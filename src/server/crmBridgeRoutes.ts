/**
 * Express Route Handlers for the CoreIQ CRM Bridge
 * - POST /api/v1/public/lead-capture (Public, Rate-limited, Honeypot-guarded)
 * - GET /api/v1/crm-bridge/health (READ_CONFIG)
 * - POST /api/v1/admin/crm-bridge/run (WRITE_CONFIG)
 * - POST /api/v1/admin/crm-bridge/test (WRITE_CONFIG)
 * - GET /api/v1/admin/crm-bridge/outbox (READ_CONFIG)
 */

import type { Express, Request, Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import {
  buildPayload,
  enqueueOutbox,
  sendOutboxRow,
  processOutbox,
  getCrmBridgeStats,
  getCrmBridgeConfig,
  evaluateSkipRules,
  detectIntent,
  CrmOutboxRow,
} from './crmBridge';

export interface CrmBridgeRouteDeps {
  authenticateApiKey: (req: Request, res: Response, next: NextFunction) => any;
  requireScope: (scope: string, legacyFallbackScope?: string) => (req: Request, res: Response, next: NextFunction) => any;
  supabase: SupabaseClient | null;
  adminSupabase: SupabaseClient | null;
  localStore: Record<string, any[]>;
}

// In-memory rate limiting maps for public lead-capture
// IP: max 10 requests per 60 seconds
const ipRateMap = new Map<string, { count: number; resetAt: number }>();
// session_id: max 30 requests per 3600 seconds (1 hour)
const sessionRateMap = new Map<string, { count: number; resetAt: number }>();

function checkLeadCaptureRateLimit(ip: string, sessionId: string): { allowed: boolean; reason?: string } {
  const now = Date.now();

  // 1. IP rate check (10 per minute)
  const ipEntry = ipRateMap.get(ip);
  if (!ipEntry || now > ipEntry.resetAt) {
    ipRateMap.set(ip, { count: 1, resetAt: now + 60 * 1000 });
  } else {
    if (ipEntry.count >= 10) {
      return { allowed: false, reason: 'IP rate limit exceeded. Max 10 requests per minute.' };
    }
    ipEntry.count++;
  }

  // 2. Session rate check (30 per hour)
  if (sessionId) {
    const sessEntry = sessionRateMap.get(sessionId);
    if (!sessEntry || now > sessEntry.resetAt) {
      sessionRateMap.set(sessionId, { count: 1, resetAt: now + 60 * 60 * 1000 });
    } else {
      if (sessEntry.count >= 30) {
        return { allowed: false, reason: 'Session rate limit exceeded. Max 30 requests per hour.' };
      }
      sessEntry.count++;
    }
  }

  return { allowed: true };
}

export function registerCrmBridgeRoutes(app: Express, deps: CrmBridgeRouteDeps) {
  const { authenticateApiKey, requireScope, supabase, adminSupabase, localStore } = deps;
  const db = adminSupabase || supabase;

  // Background interval: process outbox every 60 seconds while server is awake
  setInterval(() => {
    processOutbox(10, { db, localStore }).catch((err) => {
      console.warn('[CRM Bridge Background Worker Error]:', err?.message);
    });
  }, 60 * 1000);

  // ---------------------------------------------------------------------------
  // 1. POST /api/v1/public/lead-capture (Public, Rate Limited, Honeypot)
  // ---------------------------------------------------------------------------
  app.post('/api/v1/public/lead-capture', async (req: Request, res: Response) => {
    try {
      // 1. Enforce max body size (100 KB)
      const contentLength = parseInt(req.headers['content-length'] || '0', 10);
      if (contentLength > 100 * 1024) {
        return res.status(413).json({ error: 'Payload Too Large', message: 'Payload exceeds 100 KB limit.' });
      }

      const clientIp =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
        req.socket.remoteAddress ||
        'unknown';

      const body = req.body || {};

      // 2. Honeypot check: If filled, discard silently and respond 200 { ok: true }
      if (body.honeypot && String(body.honeypot).trim() !== '') {
        return res.status(200).json({ ok: true });
      }

      const sessionId = (body.session_id || '').trim();
      const name = (body.name || '').trim();
      const email = (body.email || '').trim();
      const phone = (body.phone || '').trim();
      const consent = body.consent === true;

      // 3. Rate limiting checks
      const rateCheck = checkLeadCaptureRateLimit(clientIp, sessionId);
      if (!rateCheck.allowed) {
        return res.status(429).json({
          error: 'Too Many Requests',
          message: rateCheck.reason || 'Rate limit exceeded. Please wait a moment.',
        });
      }

      // 4. Validations
      if (!name) {
        return res.status(400).json({ error: 'Validation Error', message: 'Name is required.' });
      }

      // Validate email or phone: at least one must be provided
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const hasValidEmail = Boolean(email && emailRegex.test(email));
      const hasValidPhone = Boolean(phone && phone.replace(/\D/g, '').length >= 7);

      if (!hasValidEmail && !hasValidPhone) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'A valid email or phone number is required.',
        });
      }

      // Consent must be explicitly boolean true
      if (!consent) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Consent is required to proceed.',
        });
      }

      // Validate session_id format (UUID preferred, non-empty string required)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!sessionId || (!uuidRegex.test(sessionId) && sessionId.length < 8)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'A valid session_id UUID is required.',
        });
      }

      // 5. Check skip rules
      const skipEval = evaluateSkipRules({ email, phone, consent });

      // 6. Upsert public.leads row with existing columns plus session_id and CRM fields
      const leadId = crypto.randomUUID ? crypto.randomUUID() : `lead_${Date.now()}`;
      const nowIso = new Date().toISOString();
      const leadRecord = {
        id: leadId,
        created_at: nowIso,
        source: body.source || 'website',
        client_name: name,
        client_contact: email || phone,
        client_message: (body.summary || body.message || '').slice(0, 2000),
        conversation_summary: (body.summary || '').slice(0, 1200),
        intent_type: detectIntent(body.intent || body.summary),
        status: 'new',
        budget_range: body.budget_hint || '',
        notes: body.company ? `Company: ${body.company}` : '',
        full_conversation: Array.isArray(body.transcript) ? body.transcript : [],
        session_id: sessionId,
        crm_skipped_reason: skipEval.shouldEnqueue ? null : skipEval.reason || null,
      };

      if (db) {
        try {
          // Check if lead already exists for session_id
          const { data: existingLead } = await db
            .from('leads')
            .select('id')
            .eq('session_id', sessionId)
            .maybeSingle();

          if (existingLead) {
            await db
              .from('leads')
              .update({
                client_name: leadRecord.client_name,
                client_contact: leadRecord.client_contact,
                client_message: leadRecord.client_message,
                conversation_summary: leadRecord.conversation_summary,
                intent_type: leadRecord.intent_type,
                full_conversation: leadRecord.full_conversation,
                crm_skipped_reason: leadRecord.crm_skipped_reason,
              })
              .eq('id', existingLead.id);
          } else {
            await db.from('leads').insert([leadRecord]);
          }
        } catch (e) {
          console.warn('[CRM Bridge leads upsert warning]:', e);
        }
      }

      // Local store leads upsert
      localStore.leads = localStore.leads || [];
      const localIdx = localStore.leads.findIndex((l: any) => l.session_id === sessionId);
      if (localIdx >= 0) {
        localStore.leads[localIdx] = { ...localStore.leads[localIdx], ...leadRecord };
      } else {
        localStore.leads.unshift(leadRecord);
      }

      // 7. Enqueue to crm_outbox if skip rules permit
      if (skipEval.shouldEnqueue) {
        const payload = buildPayload({
          source: body.source,
          session_id: sessionId,
          name,
          email,
          phone,
          company: body.company,
          summary: body.summary,
          intent: body.intent,
          budget_hint: body.budget_hint,
          page_url: body.page_url,
          consent: true,
          transcript: body.transcript,
        });

        await enqueueOutbox(payload, { db, localStore });

        // Fire-and-forget immediate send attempt
        processOutbox(10, { db, localStore }).catch(() => {});
      }

      // NEVER return CRM internal details or error messages to visitor
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      console.error('[lead-capture error]:', err?.message);
      // Even on unexpected exceptions, do not expose stack traces to visitor
      return res.status(500).json({ error: 'Server Error', message: 'Unable to process lead intake at this time.' });
    }
  });

  // ---------------------------------------------------------------------------
  // 2. GET /api/v1/crm-bridge/health (READ_CONFIG)
  // ---------------------------------------------------------------------------
  app.get('/api/v1/crm-bridge/health', authenticateApiKey, requireScope('READ_CONFIG'), async (_req: Request, res: Response) => {
    try {
      const stats = await getCrmBridgeStats({ db, localStore });
      return res.json(stats);
    } catch (err: any) {
      return res.status(500).json({ error: 'Health check failed', message: err?.message });
    }
  });

  // ---------------------------------------------------------------------------
  // 3. POST /api/v1/admin/crm-bridge/run (WRITE_CONFIG)
  // ---------------------------------------------------------------------------
  app.post('/api/v1/admin/crm-bridge/run', authenticateApiKey, requireScope('WRITE_CONFIG'), async (req: Request, res: Response) => {
    try {
      const limit = parseInt((req.query.limit as string) || (req.body?.limit as string) || '20', 10);
      const results = await processOutbox(limit, { db, localStore });
      const stats = await getCrmBridgeStats({ db, localStore });
      return res.json({
        success: true,
        run_results: results,
        stats,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Manual outbox run failed', message: err?.message });
    }
  });

  // ---------------------------------------------------------------------------
  // 4. POST /api/v1/admin/crm-bridge/test (WRITE_CONFIG)
  // ---------------------------------------------------------------------------
  app.post('/api/v1/admin/crm-bridge/test', authenticateApiKey, requireScope('WRITE_CONFIG'), async (_req: Request, res: Response) => {
    try {
      const config = getCrmBridgeConfig();
      if (!config.isConfigured) {
        return res.status(400).json({
          success: false,
          error: 'CRM Bridge is not configured. Both CRM_INTAKE_URL and CRM_INTAKE_KEY environment variables are required.',
        });
      }

      const timestamp = Date.now();
      const syntheticSessionId = `bridge-test-${timestamp}`;

      // Build synthetic payload (do NOT write to public.leads)
      const syntheticPayload = buildPayload({
        source: 'coreiq-website-test',
        session_id: syntheticSessionId,
        name: 'Bridge Test Runner',
        email: 'bridge-test@example.com',
        phone: '+27821234567',
        company: 'CoreIQ Quality Engineering',
        summary: 'Synthetic connectivity check executed from CoreIQ Command center.',
        intent: 'automation',
        consent: true,
        transcript: [
          { role: 'visitor', text: 'Initiating synthetic test sequence', at: new Date().toISOString() },
          { role: 'assistant', text: 'Synthetic test validated', at: new Date().toISOString() },
        ],
      });

      const syntheticRow: CrmOutboxRow = {
        id: `test_outbox_${timestamp}`,
        session_id: syntheticSessionId,
        source: syntheticPayload.source,
        payload: syntheticPayload,
        status: 'pending',
        attempts: 0,
        next_attempt_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const result = await sendOutboxRow(syntheticRow, config, { db: null, localStore });

      return res.json({
        success: result.success,
        client_code: result.client_code || null,
        client_id: result.client_id || null,
        status: result.status,
        error: result.error || null,
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Test execution error', message: err?.message });
    }
  });

  // ---------------------------------------------------------------------------
  // 5. GET /api/v1/admin/crm-bridge/outbox (READ_CONFIG) - returns recent outbox rows
  // ---------------------------------------------------------------------------
  app.get('/api/v1/admin/crm-bridge/outbox', authenticateApiKey, requireScope('READ_CONFIG'), async (req: Request, res: Response) => {
    try {
      const limit = parseInt((req.query.limit as string) || '20', 10);
      let rows: CrmOutboxRow[] = [];

      if (db) {
        try {
          const { data } = await db
            .from('crm_outbox')
            .select('id, session_id, source, status, attempts, last_error, next_attempt_at, crm_client_id, crm_client_code, created_at, updated_at')
            .order('created_at', { ascending: false })
            .limit(limit);
          if (data) rows = data as CrmOutboxRow[];
        } catch (e) {
          console.warn('[CRM Bridge outbox list DB error]:', e);
        }
      }

      if (rows.length === 0) {
        rows = ((localStore.crm_outbox as CrmOutboxRow[]) || []).slice(0, limit);
      }

      // Mask sensitive details, provide summary
      const safeRows = rows.map((r) => ({
        id: r.id,
        session_id: r.session_id,
        short_session_id: r.session_id.slice(0, 16),
        source: r.source,
        status: r.status,
        attempts: r.attempts,
        last_error: r.last_error,
        next_attempt_at: r.next_attempt_at,
        crm_client_id: r.crm_client_id,
        crm_client_code: r.crm_client_code,
        created_at: r.created_at,
        updated_at: r.updated_at,
      }));

      return res.json({ count: safeRows.length, rows: safeRows });
    } catch (err: any) {
      return res.status(500).json({ error: 'Failed to fetch outbox rows', message: err?.message });
    }
  });
}
