/**
 * CoreIQ Create — CRM Bridge Express API Routes
 * Endpoints for public lead-capture, admin diagnostics, manual runs, and test leads.
 */

import type { Express, Request, Response, NextFunction } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import {
  buildPayload,
  getSkippedReason,
  enqueueOutbox,
  processOutbox,
  getBridgeHealth,
  sendCrmPayload,
  replayOutboxRow,
  getBridgeConfig,
  normalizePhone,
  CrmPayload,
} from './crmBridge';
import type { CrmOutboxRecord } from '../types/command';

export interface CrmBridgeDeps {
  authenticateApiKey: (req: Request, res: Response, next: NextFunction) => any;
  requireScope: (...scopes: string[]) => (req: Request, res: Response, next: NextFunction) => any;
  supabase: SupabaseClient | null;
  adminSupabase: SupabaseClient | null;
  localStore: Record<string, any[]>;
}

// In-memory rate limiting structures
interface RateLimitBucket {
  count: number;
  resetAt: number;
}
const ipRateLimits = new Map<string, RateLimitBucket>();
const sessionRateLimits = new Map<string, RateLimitBucket>();

// Clean rate limit maps every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of ipRateLimits.entries()) {
    if (v.resetAt < now) ipRateLimits.delete(k);
  }
  for (const [k, v] of sessionRateLimits.entries()) {
    if (v.resetAt < now) sessionRateLimits.delete(k);
  }
}, 10 * 60 * 1000);

function checkPublicRateLimit(ip: string, sessionId: string): { allowed: boolean; reason?: string } {
  const now = Date.now();

  // 1. IP rate limit: 10 requests / minute
  let ipBucket = ipRateLimits.get(ip);
  if (!ipBucket || ipBucket.resetAt < now) {
    ipBucket = { count: 1, resetAt: now + 60 * 1000 };
    ipRateLimits.set(ip, ipBucket);
  } else {
    ipBucket.count++;
    if (ipBucket.count > 10) {
      return { allowed: false, reason: 'Too many requests from this IP. Please wait a minute.' };
    }
  }

  // 2. Session rate limit: 30 requests / hour per session_id
  if (sessionId) {
    let sessBucket = sessionRateLimits.get(sessionId);
    if (!sessBucket || sessBucket.resetAt < now) {
      sessBucket = { count: 1, resetAt: now + 60 * 60 * 1000 };
      sessionRateLimits.set(sessionId, sessBucket);
    } else {
      sessBucket.count++;
      if (sessBucket.count > 30) {
        return { allowed: false, reason: 'Session submission limit reached. Please wait a while.' };
      }
    }
  }

  return { allowed: true };
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function registerCrmBridgeRoutes(app: Express, deps: CrmBridgeDeps) {
  const { authenticateApiKey, requireScope, supabase, adminSupabase, localStore } = deps;
  const db = adminSupabase || supabase;

  // Initialize in-memory outbox array if needed
  localStore.crm_outbox = localStore.crm_outbox || [];

  // ===========================================================================
  // 1. PUBLIC LEAD CAPTURE ENDPOINT
  // ===========================================================================
  app.post('/api/v1/public/lead-capture', async (req: Request, res: Response) => {
    // 100KB Body limit safety check
    const bodyLength = req.headers['content-length']
      ? parseInt(req.headers['content-length'], 10)
      : JSON.stringify(req.body || {}).length;

    if (bodyLength > 100 * 1024) {
      return res.status(413).json({ error: 'Payload Too Large', message: 'Body exceeds maximum limit of 100KB.' });
    }

    const body = req.body || {};
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || 'unknown_ip';
    const sessionId = typeof body.session_id === 'string' ? body.session_id.trim() : '';

    // Rate limiting: 10/min per IP, 30/hour per session_id
    const rateCheck = checkPublicRateLimit(ip, sessionId);
    if (!rateCheck.allowed) {
      return res.status(429).json({ error: 'Too Many Requests', message: rateCheck.reason });
    }

    // Honeypot check: if filled, return 200 { ok: true } immediately and discard
    if (body.honeypot && String(body.honeypot).trim() !== '') {
      return res.status(200).json({ ok: true });
    }

    // Validation
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) {
      return res.status(400).json({ error: 'Validation Error', message: 'Name is required.' });
    }

    if (!sessionId || !UUID_REGEX.test(sessionId)) {
      return res.status(400).json({ error: 'Validation Error', message: 'A valid session_id UUID is required.' });
    }

    const email = typeof body.email === 'string' && body.email.trim() ? body.email.trim().toLowerCase() : null;
    const phone = normalizePhone(body.phone);

    if (!email && !phone) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'At least one contact method (valid email or phone number) is required.',
      });
    }

    const consent = body.consent === true;
    if (!consent) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Consent is required to submit your contact details.',
      });
    }

    const contactStr = email || phone || '';
    const message = typeof body.summary === 'string' ? body.summary.trim() : (body.message ? String(body.message).trim() : '');
    const source = (typeof body.source === 'string' && body.source.trim()) || 'website';
    const intentType = (typeof body.intent === 'string' && body.intent.trim()) || 'custom';
    const fullConversation = Array.isArray(body.transcript) ? body.transcript : [];

    // Check for skipped reason
    const skippedReason = getSkippedReason({
      session_id: sessionId,
      name,
      email,
      phone,
      consent,
    });

    const nowIso = new Date().toISOString();

    // 1. Upsert into leads table
    let leadId = `lead_${sessionId}`;
    let existingLead: any = null;

    if (db) {
      try {
        const { data } = await db.from('leads').select('*').eq('session_id', sessionId).maybeSingle();
        if (data) existingLead = data;
      } catch (e) {
        console.warn('[CRM Bridge] Lead lookup warning:', e);
      }
    }

    if (!existingLead && localStore.leads) {
      existingLead = localStore.leads.find((l: any) => l.session_id === sessionId);
    }

    if (existingLead) {
      leadId = existingLead.id;
      const leadUpdates = {
        client_name: name,
        client_contact: contactStr,
        client_message: message || existingLead.client_message,
        conversation_summary: message || existingLead.conversation_summary,
        full_conversation: fullConversation.length > 0 ? fullConversation : existingLead.full_conversation,
        crm_skipped_reason: skippedReason,
      };

      if (db) {
        try {
          await db.from('leads').update(leadUpdates).eq('id', existingLead.id);
        } catch (e) {
          console.warn('[CRM Bridge] DB lead update warning:', e);
        }
      }
      if (localStore.leads) {
        const idx = localStore.leads.findIndex((l: any) => l.id === existingLead.id);
        if (idx >= 0) {
          localStore.leads[idx] = { ...localStore.leads[idx], ...leadUpdates };
        }
      }
    } else {
      const newLead = {
        id: crypto.randomUUID ? crypto.randomUUID() : `lead_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        created_at: nowIso,
        source,
        client_name: name,
        client_contact: contactStr,
        client_message: message,
        conversation_summary: message,
        intent_type: intentType,
        status: 'new',
        full_conversation: fullConversation,
        client_id: null,
        budget_range: body.budget_hint || '',
        notes: body.company ? `Company: ${body.company}` : '',
        session_id: sessionId,
        crm_client_id: null,
        crm_client_code: null,
        crm_synced_at: null,
        crm_skipped_reason: skippedReason,
      };

      if (db) {
        try {
          await db.from('leads').insert([newLead]);
        } catch (e) {
          console.warn('[CRM Bridge] DB lead insert warning:', e);
        }
      }

      localStore.leads = localStore.leads || [];
      localStore.leads.unshift(newLead);
    }

    // 2. If qualified, enqueue to CRM outbox
    if (!skippedReason) {
      const payload = buildPayload({
        session_id: sessionId,
        source: 'coreiq-website',
        name,
        email,
        phone,
        company: body.company || null,
        summary: message,
        intent: body.intent || null,
        budget_hint: body.budget_hint || null,
        page_url: body.page_url || null,
        consent: true,
        transcript: fullConversation,
        honeypot: '',
      });

      await enqueueOutbox(db, localStore, sessionId, 'coreiq-website', payload);

      // Fire and forget processOutbox
      processOutbox(db, localStore, 5).catch((err) => {
        console.warn('[CRM Bridge] Background process error:', err?.message || err);
      });
    }

    // NEVER expose CRM internal codes, errors, or IDs to the visitor
    return res.status(200).json({ ok: true });
  });

  // ===========================================================================
  // 2. HEALTH & DIAGNOSTICS ENDPOINT (READ_CONFIG)
  // ===========================================================================
  app.get('/api/v1/crm-bridge/health', authenticateApiKey, requireScope('READ_CONFIG'), async (_req: Request, res: Response) => {
    try {
      const health = await getBridgeHealth(db, localStore);
      return res.json(health);
    } catch (e: any) {
      console.error('[CRM Bridge] Health check error:', e);
      return res.status(500).json({ error: 'Failed to retrieve CRM bridge health', detail: e?.message });
    }
  });

  // ===========================================================================
  // 3. RECENT OUTBOX ROWS ENDPOINT (READ_CONFIG) — FOR COMMAND DASHBOARD
  // ===========================================================================
  app.get('/api/v1/crm-bridge/outbox', authenticateApiKey, requireScope('READ_CONFIG'), async (req: Request, res: Response) => {
    try {
      const limit = Math.min(Math.max(1, parseInt((req.query.limit as string) || '20', 10)), 100);
      let rows: CrmOutboxRecord[] = [];

      if (db) {
        try {
          const { data, error } = await db
            .from('crm_outbox')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

          if (!error && data) {
            rows = data as CrmOutboxRecord[];
          }
        } catch (e) {
          console.warn('[CRM Bridge] DB outbox query error:', e);
        }
      }

      if (rows.length === 0 && localStore.crm_outbox) {
        rows = [...localStore.crm_outbox]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
          .slice(0, limit);
      }

      return res.json({ rows, count: rows.length });
    } catch (e: any) {
      return res.status(500).json({ error: 'Failed to list outbox rows', detail: e?.message });
    }
  });

  // ===========================================================================
  // 4. MANUAL OUTBOX RUN ENDPOINT (WRITE_CONFIG)
  // ===========================================================================
  app.post('/api/v1/admin/crm-bridge/run', authenticateApiKey, requireScope('WRITE_CONFIG'), async (_req: Request, res: Response) => {
    try {
      const result = await processOutbox(db, localStore, 10);
      const health = await getBridgeHealth(db, localStore);
      return res.json({
        ok: true,
        summary: result,
        health,
      });
    } catch (e: any) {
      console.error('[CRM Bridge] Manual run error:', e);
      return res.status(500).json({ error: 'Outbox run failed', detail: e?.message });
    }
  });

  // ===========================================================================
  // 5. TEST LEAD ENDPOINT (WRITE_CONFIG)
  // ===========================================================================
  app.post('/api/v1/admin/crm-bridge/test', authenticateApiKey, requireScope('WRITE_CONFIG'), async (_req: Request, res: Response) => {
    try {
      const testTimestamp = Date.now();
      const testSessionId = `bridge-test-${testTimestamp}`;

      const syntheticPayload: CrmPayload = {
        source: 'coreiq-website-test',
        session_id: testSessionId,
        name: 'Synthetic Test Lead',
        email: 'bridge-test@example.com',
        phone: '+27821234567',
        company: 'CoreIQ Quality Engineering',
        summary: 'Automated CRM bridge configuration test from CoreIQ Command',
        intent: 'website',
        budget_hint: 'R10k - R25k',
        page_url: 'https://coreiqcreate.com/command#crm-bridge',
        consent: true,
        transcript: [
          { role: 'visitor', text: 'This is a synthetic test submission verifying CRM intake connectivity.', at: new Date().toISOString() },
          { role: 'assistant', text: 'Test acknowledged by CoreIQ.', at: new Date().toISOString() }
        ],
        honeypot: '',
      };

      // Send directly without writing to leads table
      const sendResult = await sendCrmPayload(syntheticPayload);

      if (!sendResult.success) {
        return res.status(sendResult.status || 500).json({
          ok: false,
          error: sendResult.error || 'CRM test send rejected',
          status: sendResult.status,
          detail: sendResult.data,
        });
      }

      return res.json({
        ok: true,
        status: sendResult.status,
        client_id: sendResult.data?.client_id || null,
        code: sendResult.data?.code || null,
        stage: sendResult.data?.stage || null,
        engagement_id: sendResult.data?.engagement_id || null,
        message: 'Synthetic test lead successfully delivered to CoreIQ CRM.',
      });
    } catch (e: any) {
      console.error('[CRM Bridge] Test lead exception:', e);
      return res.status(500).json({ error: 'CRM test execution failed', detail: e?.message });
    }
  });

  // ===========================================================================
  // 6. REPLAY OUTBOX ROW ENDPOINT (WRITE_CONFIG)
  // ===========================================================================
  app.post('/api/v1/admin/crm-bridge/replay/:id', authenticateApiKey, requireScope('WRITE_CONFIG'), async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await replayOutboxRow(db, localStore, id);
      if (!success) {
        return res.status(404).json({ error: 'Outbox row not found' });
      }
      // Trigger process
      processOutbox(db, localStore, 5).catch(() => {});
      return res.json({ ok: true, message: `Row ${id} scheduled for replay.` });
    } catch (e: any) {
      return res.status(500).json({ error: 'Replay failed', detail: e?.message });
    }
  });
}
