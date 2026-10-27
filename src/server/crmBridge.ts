/**
 * CoreIQ Create — CRM Bridge Server Module
 * Connects website lead capture and app requests to CoreIQ CRM (POST /api/v1/intake)
 * strictly server-side with an asynchronous outbox and retry engine.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import type { CrmBridgeHealth, CrmOutboxRecord, CrmOutboxStatus } from '../types/command';

export interface RawTranscriptTurn {
  role?: string;
  sender?: string;
  text?: string;
  content?: string;
  at?: string;
  timestamp?: string | Date;
}

export interface RawCrmInput {
  session_id: string;
  source?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  summary?: string | null;
  intent?: string | null;
  budget_hint?: string | null;
  page_url?: string | null;
  consent: boolean;
  transcript?: RawTranscriptTurn[];
  honeypot?: string | null;
}

export interface CrmPayload {
  source: string;
  session_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  summary: string;
  intent: 'website' | 'app' | 'automation' | 'agent' | 'voice' | 'unknown';
  budget_hint: string | null;
  page_url: string | null;
  consent: boolean;
  transcript: Array<{ role: 'visitor' | 'assistant'; text: string; at: string }>;
  honeypot: string;
}

export interface CrmIntakeResponse {
  client_id?: string;
  code?: string;
  stage?: string;
  engagement_id?: string;
  error?: string;
  message?: string;
}

// -----------------------------------------------------------------------------
// 1. CONFIGURATION HELPERS
// -----------------------------------------------------------------------------
export function getBridgeConfig(): {
  intakeUrl: string;
  intakeKey: string;
  configured: boolean;
  isConfigured: boolean;
  host: string | null;
} {
  const intakeUrl = (process.env.CRM_INTAKE_URL || '').trim();
  const intakeKey = (process.env.CRM_INTAKE_KEY || '').trim();
  const isConfigured = Boolean(intakeUrl && intakeKey);

  let host: string | null = null;
  if (intakeUrl) {
    try {
      const u = new URL(intakeUrl);
      host = u.host;
    } catch {
      host = intakeUrl.replace(/^https?:\/\//, '').split('/')[0] || null;
    }
  }

  return { intakeUrl, intakeKey, configured: isConfigured, isConfigured, host };
}

export function isBridgeConfigured(): boolean {
  return getBridgeConfig().isConfigured;
}

// -----------------------------------------------------------------------------
// 2. DATA NORMALIZATION & SECURITY REDACTION
// -----------------------------------------------------------------------------

/**
 * Normalizes a phone number to E.164, applying South Africa (+27) default for local numbers.
 */
export function normalizePhone(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Preserve leading '+' if present
  const hasLeadingPlus = trimmed.startsWith('+');
  const digitsOnly = trimmed.replace(/\D/g, '');
  if (!digitsOnly) return null;

  if (hasLeadingPlus) {
    return `+${digitsOnly}`;
  }

  // International prefix 00
  if (digitsOnly.startsWith('00')) {
    return `+${digitsOnly.slice(2)}`;
  }

  // Already prefixed with country code 27 (e.g. 27821234567)
  if (digitsOnly.startsWith('27') && digitsOnly.length >= 10 && digitsOnly.length <= 12) {
    return `+${digitsOnly}`;
  }

  // South African domestic format: starts with 0 and is 10 digits total (e.g. 0821234567)
  if (digitsOnly.startsWith('0') && digitsOnly.length === 10) {
    return `+27${digitsOnly.slice(1)}`;
  }

  // South African domestic without leading 0 (9 digits, e.g. 821234567)
  if (digitsOnly.length === 9) {
    return `+27${digitsOnly}`;
  }

  // Fallback: prepend '+' if longer than 9 digits, else return as +27 local
  if (digitsOnly.length > 9) {
    return `+${digitsOnly}`;
  }

  return `+27${digitsOnly}`;
}

/**
 * Maps input text or keywords to one of the canonical CRM intent types:
 * website | app | automation | agent | voice | unknown
 */
export function mapIntent(text?: string | null): 'website' | 'app' | 'automation' | 'agent' | 'voice' | 'unknown' {
  if (!text || typeof text !== 'string') return 'unknown';
  const lower = text.toLowerCase().trim();

  if (/website|site|landing/.test(lower)) return 'website';
  if (/app|mobile/.test(lower)) return 'app';
  if (/automat|workflow/.test(lower)) return 'automation';
  if (/agent|chatbot|assistant/.test(lower)) return 'agent';
  if (/voice|call|reception/.test(lower)) return 'voice';

  return 'unknown';
}

/**
 * Strips HTML and redacts secrets (ciq_live_, sk-, eyJ JWTs, and password values)
 */
export function sanitizeAndRedact(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';

  // 1. Strip HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');

  // 2. Redact ciq_live_ API keys
  cleaned = cleaned.replace(/ciq_live_[a-zA-Z0-9_-]+/g, '[REDACTED_API_KEY]');

  // 3. Redact OpenAI / third-party sk- keys
  cleaned = cleaned.replace(/sk-[a-zA-Z0-9_-]{10,}/g, '[REDACTED_API_KEY]');

  // 4. Redact JWTs starting with eyJ
  cleaned = cleaned.replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, '[REDACTED_JWT]');
  cleaned = cleaned.replace(/eyJ[a-zA-Z0-9._-]{20,}/g, '[REDACTED_JWT]');

  // 5. Redact anything after "password:"
  cleaned = cleaned.replace(/(password\s*:\s*)[^\s\r\n,;]+/gi, '$1[REDACTED]');

  return cleaned;
}

/**
 * Formats transcript turns, keeping the last 40 turns with max 2000 characters each.
 */
export function buildTranscript(
  rawHistory?: RawTranscriptTurn[]
): Array<{ role: 'visitor' | 'assistant'; text: string; at: string }> {
  if (!rawHistory || !Array.isArray(rawHistory)) return [];

  const turns = rawHistory
    .map((turn) => {
      const rawRole = (turn.role || turn.sender || 'visitor').toLowerCase();
      const role: 'visitor' | 'assistant' =
        rawRole === 'assistant' || rawRole === 'coreiq' || rawRole === 'model' || rawRole === 'operator'
          ? 'assistant'
          : 'visitor';

      const rawText = turn.text ?? turn.content ?? '';
      const text = sanitizeAndRedact(rawText).slice(0, 2000);

      let at = new Date().toISOString();
      if (turn.at) {
        at = turn.at;
      } else if (turn.timestamp) {
        at = typeof turn.timestamp === 'string' ? turn.timestamp : new Date(turn.timestamp).toISOString();
      }

      return { role, text, at };
    })
    .filter((t) => t.text.trim().length > 0);

  return turns.slice(-40);
}

/**
 * Builds the canonical CRM intake payload from raw input.
 */
export function buildPayload(input: RawCrmInput): CrmPayload {
  const email = input.email && typeof input.email === 'string' ? input.email.trim().toLowerCase() : null;
  const phone = normalizePhone(input.phone);

  const rawSummary = input.summary || (input.transcript && input.transcript[0]?.text) || 'Website consultation lead';
  const summary = sanitizeAndRedact(rawSummary).slice(0, 1200);

  const intent = mapIntent(input.intent || input.summary || (input.transcript && input.transcript[0]?.text));

  const transcript = buildTranscript(input.transcript);

  return {
    source: (input.source && input.source.trim()) || 'coreiq-website',
    session_id: input.session_id.trim(),
    name: input.name ? sanitizeAndRedact(input.name.trim()).slice(0, 120) : 'Website Visitor',
    email: email || null,
    phone: phone || null,
    company: input.company ? sanitizeAndRedact(input.company.trim()).slice(0, 120) : null,
    summary,
    intent,
    budget_hint: input.budget_hint ? sanitizeAndRedact(input.budget_hint.trim()).slice(0, 80) : null,
    page_url: input.page_url ? input.page_url.trim().slice(0, 255) : null,
    consent: Boolean(input.consent === true),
    transcript,
    honeypot: input.honeypot || '',
  };
}

/**
 * Validates whether the lead qualifies for CRM intake queuing.
 * Returns null if qualified, or a skipped reason string if not.
 */
export function getSkippedReason(input: RawCrmInput): 'no_consent' | 'no_contact' | null {
  if (input.consent !== true) {
    return 'no_consent';
  }
  const cleanEmail = input.email && input.email.trim();
  const cleanPhone = normalizePhone(input.phone);
  if (!cleanEmail && !cleanPhone) {
    return 'no_contact';
  }
  return null;
}

// -----------------------------------------------------------------------------
// 3. OUTBOX QUEUING & PERSISTENCE
// -----------------------------------------------------------------------------

/**
 * Calculates exponential backoff: 30s, 2m, 10m, 1h, 6h; marks dead after 6 attempts.
 */
export function calculateNextAttempt(attempts: number): { nextAttemptAt: string; isDead: boolean } {
  if (attempts >= 6) {
    return { nextAttemptAt: new Date().toISOString(), isDead: true };
  }

  const intervalsMs = [
    30 * 1000, // Attempt 1: 30 seconds
    2 * 60 * 1000, // Attempt 2: 2 minutes
    10 * 60 * 1000, // Attempt 3: 10 minutes
    60 * 60 * 1000, // Attempt 4: 1 hour
    6 * 60 * 60 * 1000, // Attempt 5: 6 hours
  ];

  const delay = intervalsMs[Math.min(attempts - 1, intervalsMs.length - 1)] || 30 * 1000;
  const nextAttemptAt = new Date(Date.now() + delay).toISOString();
  return { nextAttemptAt, isDead: false };
}

/**
 * Upserts a payload into crm_outbox by session_id.
 * If row was already sent and the payload has changed, sets pending with a 60s debounce.
 */
export async function enqueueOutbox(
  db: SupabaseClient | null,
  localStore: Record<string, any[]>,
  sessionId: string,
  source: string,
  payload: CrmPayload
): Promise<CrmOutboxRecord> {
  const now = new Date().toISOString();
  let existing: CrmOutboxRecord | null = null;

  if (db) {
    try {
      const { data } = await db.from('crm_outbox').select('*').eq('session_id', sessionId).maybeSingle();
      if (data) existing = data as CrmOutboxRecord;
    } catch (e) {
      console.warn('[CRM Bridge] Outbox lookup warning:', e);
    }
  }

  if (!existing && localStore.crm_outbox) {
    existing = localStore.crm_outbox.find((r: CrmOutboxRecord) => r.session_id === sessionId) || null;
  }

  if (existing) {
    const payloadChanged = JSON.stringify(existing.payload) !== JSON.stringify(payload);
    let newStatus: CrmOutboxStatus = existing.status;
    let nextAttemptAt = existing.next_attempt_at;

    if (existing.status === 'sent') {
      if (payloadChanged) {
        newStatus = 'pending';
        // Debounce 60 seconds
        nextAttemptAt = new Date(Date.now() + 60 * 1000).toISOString();
      }
    } else if (existing.status === 'dead' && payloadChanged) {
      newStatus = 'pending';
      nextAttemptAt = new Date(Date.now() + 60 * 1000).toISOString();
    }

    const updatedRecord: CrmOutboxRecord = {
      ...existing,
      payload,
      source: source || existing.source,
      status: newStatus,
      next_attempt_at: nextAttemptAt,
      updated_at: now,
    };

    if (db) {
      try {
        await db
          .from('crm_outbox')
          .update({
            payload,
            source: updatedRecord.source,
            status: newStatus,
            next_attempt_at: nextAttemptAt,
            updated_at: now,
          })
          .eq('session_id', sessionId);
      } catch (e) {
        console.warn('[CRM Bridge] Outbox update warning:', e);
      }
    }

    if (localStore.crm_outbox) {
      const idx = localStore.crm_outbox.findIndex((r: CrmOutboxRecord) => r.session_id === sessionId);
      if (idx >= 0) localStore.crm_outbox[idx] = updatedRecord;
    }

    return updatedRecord;
  }

  // Create new outbox record
  const newRecord: CrmOutboxRecord = {
    id: crypto.randomUUID ? crypto.randomUUID() : `outbox_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    session_id: sessionId,
    source: source || 'coreiq-website',
    payload,
    status: 'pending',
    attempts: 0,
    last_error: null,
    next_attempt_at: now,
    lease_until: null,
    crm_client_id: null,
    crm_client_code: null,
    created_at: now,
    updated_at: now,
  };

  if (db) {
    try {
      await db.from('crm_outbox').insert([newRecord]);
    } catch (e) {
      console.warn('[CRM Bridge] Outbox insert warning:', e);
    }
  }

  localStore.crm_outbox = localStore.crm_outbox || [];
  localStore.crm_outbox.unshift(newRecord);
  return newRecord;
}

// -----------------------------------------------------------------------------
// 4. CRM HTTP TRANSMISSION
// -----------------------------------------------------------------------------

/**
 * Transmits payload to the CRM intake endpoint with 65s timeout.
 * Never logs secrets or API tokens.
 */
export async function sendCrmPayload(
  payload: CrmPayload,
  overrideConfig?: { intakeUrl: string; intakeKey: string }
): Promise<{ success: boolean; status: number; data?: CrmIntakeResponse; error?: string }> {
  const cfg = overrideConfig || getBridgeConfig();
  if (!cfg.intakeUrl || !cfg.intakeKey) {
    return {
      success: false,
      status: 503,
      error: 'CRM Bridge is not configured (missing CRM_INTAKE_URL or CRM_INTAKE_KEY)',
    };
  }

  const controller = new AbortController();
  // 65s timeout: CRM cold starts on free tiers can take ~50s
  const timer = setTimeout(() => controller.abort(), 65000);

  try {
    const res = await fetch(cfg.intakeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.intakeKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timer);

    let resData: any = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        resData = await res.json();
      } catch {
        resData = null;
      }
    } else {
      const text = await res.text();
      resData = { message: text.slice(0, 300) };
    }

    if (res.ok) {
      return {
        success: true,
        status: res.status,
        data: resData as CrmIntakeResponse,
      };
    }

    return {
      success: false,
      status: res.status,
      data: resData,
      error: resData?.error || resData?.message || `HTTP ${res.status}`,
    };
  } catch (err: any) {
    clearTimeout(timer);
    const isTimeout = err?.name === 'AbortError' || err?.message?.includes('timeout') || err?.code === 'ETIMEDOUT';
    return {
      success: false,
      status: isTimeout ? 408 : 500,
      error: isTimeout ? 'CRM intake request timed out after 65 seconds' : err?.message || 'Network error',
    };
  }
}

// -----------------------------------------------------------------------------
// 5. OUTBOX PROCESSOR WORKER
// -----------------------------------------------------------------------------

/**
 * Claims up to `limit` pending outbox rows and transmits them to CRM.
 * Implements 5-minute leasing to avoid duplicate concurrent sends.
 */
export async function processOutbox(
  db: SupabaseClient | null,
  localStore: Record<string, any[]>,
  limit = 10
): Promise<{ processed: number; sent: number; failed: number; dead: number }> {
  const cfg = getBridgeConfig();
  if (!cfg.isConfigured) {
    // Graceful no-op when not configured
    return { processed: 0, sent: 0, failed: 0, dead: 0 };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const leaseExpiryIso = new Date(now.getTime() + 5 * 60 * 1000).toISOString();

  let dueRows: CrmOutboxRecord[] = [];

  if (db) {
    try {
      // 1. Release expired leases back to pending
      await db
        .from('crm_outbox')
        .update({ status: 'pending', lease_until: null, updated_at: nowIso })
        .eq('status', 'sending')
        .lt('lease_until', nowIso);

      // 2. Fetch pending rows whose next_attempt_at is due
      const { data, error } = await db
        .from('crm_outbox')
        .select('*')
        .eq('status', 'pending')
        .lte('next_attempt_at', nowIso)
        .order('next_attempt_at', { ascending: true })
        .limit(limit);

      if (!error && data) {
        dueRows = data as CrmOutboxRecord[];
      }
    } catch (e) {
      console.warn('[CRM Bridge] DB query warning during processOutbox:', e);
    }
  }

  // Memory fallback / merge
  if (localStore.crm_outbox) {
    // Release memory expired leases
    for (const r of localStore.crm_outbox) {
      if (r.status === 'sending' && r.lease_until && new Date(r.lease_until) < now) {
        r.status = 'pending';
        r.lease_until = null;
      }
    }

    if (dueRows.length === 0) {
      dueRows = localStore.crm_outbox
        .filter((r: CrmOutboxRecord) => r.status === 'pending' && new Date(r.next_attempt_at) <= now)
        .slice(0, limit);
    }
  }

  if (dueRows.length === 0) {
    return { processed: 0, sent: 0, failed: 0, dead: 0 };
  }

  let sentCount = 0;
  let failedCount = 0;
  let deadCount = 0;

  for (const row of dueRows) {
    // Claim the row with a 5-minute lease
    if (db) {
      try {
        await db
          .from('crm_outbox')
          .update({ status: 'sending', lease_until: leaseExpiryIso, updated_at: nowIso })
          .eq('id', row.id)
          .eq('status', 'pending');
      } catch {}
    }
    row.status = 'sending';
    row.lease_until = leaseExpiryIso;

    // Send payload to CRM
    const result = await sendCrmPayload(row.payload as CrmPayload);

    if (result.success && result.data) {
      // 2xx Success: mark sent, capture CRM codes
      sentCount++;
      const crmClientId = result.data.client_id || null;
      const crmClientCode = result.data.code || null;

      const updates: Partial<CrmOutboxRecord> = {
        status: 'sent',
        lease_until: null,
        crm_client_id: crmClientId,
        crm_client_code: crmClientCode,
        last_error: null,
        updated_at: new Date().toISOString(),
      };

      if (db) {
        try {
          await db.from('crm_outbox').update(updates).eq('id', row.id);

          // Update corresponding leads row
          await db
            .from('leads')
            .update({
              crm_client_id: crmClientId,
              crm_client_code: crmClientCode,
              crm_synced_at: new Date().toISOString(),
              crm_skipped_reason: null,
            })
            .eq('session_id', row.session_id);
        } catch (e) {
          console.warn('[CRM Bridge] DB update on success warning:', e);
        }
      }

      Object.assign(row, updates);

      // Also update local leads row if present
      if (localStore.leads) {
        const lead = localStore.leads.find((l: any) => l.session_id === row.session_id);
        if (lead) {
          lead.crm_client_id = crmClientId;
          lead.crm_client_code = crmClientCode;
          lead.crm_synced_at = new Date().toISOString();
        }
      }
    } else {
      // Failure branch: check status code
      failedCount++;
      const statusCode = result.status;
      const errorMsg = (result.error || 'CRM transmission error').slice(0, 300);

      // On 4xx (except 408 Timeout and 429 Rate Limit): mark dead immediately
      const isDeadImmediate = statusCode >= 400 && statusCode < 500 && statusCode !== 408 && statusCode !== 429;

      const newAttempts = (row.attempts || 0) + 1;
      const backoff = calculateNextAttempt(newAttempts);
      const isDead = isDeadImmediate || backoff.isDead;

      if (isDead) deadCount++;

      const updates: Partial<CrmOutboxRecord> = {
        status: isDead ? 'dead' : 'pending',
        attempts: newAttempts,
        last_error: errorMsg,
        lease_until: null,
        next_attempt_at: backoff.nextAttemptAt,
        updated_at: new Date().toISOString(),
      };

      if (db) {
        try {
          await db.from('crm_outbox').update(updates).eq('id', row.id);
        } catch (e) {
          console.warn('[CRM Bridge] DB update on failure warning:', e);
        }
      }

      Object.assign(row, updates);
    }
  }

  return {
    processed: dueRows.length,
    sent: sentCount,
    failed: failedCount,
    dead: deadCount,
  };
}

// -----------------------------------------------------------------------------
// 6. HEALTH & REPLAY ENGINE
// -----------------------------------------------------------------------------

/**
 * Returns diagnostic metrics for the CRM Bridge.
 */
export async function getBridgeHealth(
  db: SupabaseClient | null,
  localStore: Record<string, any[]>
): Promise<CrmBridgeHealth> {
  const cfg = getBridgeConfig();
  const counts: Record<CrmOutboxStatus, number> = {
    pending: 0,
    sending: 0,
    sent: 0,
    dead: 0,
  };

  let lastSuccessAt: string | null = null;
  let oldestPendingCreated: string | null = null;

  if (db) {
    try {
      const { data } = await db.from('crm_outbox').select('status, created_at, updated_at');
      if (data && Array.isArray(data)) {
        for (const row of data) {
          const s = (row.status as CrmOutboxStatus) || 'pending';
          if (counts[s] !== undefined) counts[s]++;

          if (s === 'sent') {
            const updatedAt = row.updated_at || row.created_at;
            if (!lastSuccessAt || new Date(updatedAt) > new Date(lastSuccessAt)) {
              lastSuccessAt = updatedAt;
            }
          }

          if (s === 'pending') {
            if (!oldestPendingCreated || new Date(row.created_at) < new Date(oldestPendingCreated)) {
              oldestPendingCreated = row.created_at;
            }
          }
        }
      }
    } catch {}
  } else if (localStore.crm_outbox) {
    for (const row of localStore.crm_outbox) {
      const s = (row.status as CrmOutboxStatus) || 'pending';
      if (counts[s] !== undefined) counts[s]++;

      if (s === 'sent') {
        const updatedAt = row.updated_at || row.created_at;
        if (!lastSuccessAt || new Date(updatedAt) > new Date(lastSuccessAt)) {
          lastSuccessAt = updatedAt;
        }
      }

      if (s === 'pending') {
        if (!oldestPendingCreated || new Date(row.created_at) < new Date(oldestPendingCreated)) {
          oldestPendingCreated = row.created_at;
        }
      }
    }
  }

  let oldestPendingAgeSeconds: number | null = null;
  if (oldestPendingCreated) {
    oldestPendingAgeSeconds = Math.max(0, Math.floor((Date.now() - new Date(oldestPendingCreated).getTime()) / 1000));
  }

  return {
    configured: cfg.isConfigured,
    crm_host: cfg.host,
    counts,
    last_success_at: lastSuccessAt,
    oldest_pending_age_seconds: oldestPendingAgeSeconds,
  };
}

/**
 * Replays a dead or pending outbox row by resetting status to 'pending' and next_attempt_at to now.
 */
export async function replayOutboxRow(
  db: SupabaseClient | null,
  localStore: Record<string, any[]>,
  sessionIdOrId: string
): Promise<boolean> {
  const now = new Date().toISOString();
  let found = false;

  if (db) {
    try {
      const { data } = await db
        .from('crm_outbox')
        .update({
          status: 'pending',
          attempts: 0,
          next_attempt_at: now,
          lease_until: null,
          updated_at: now,
        })
        .or(`id.eq.${sessionIdOrId},session_id.eq.${sessionIdOrId}`)
        .select();

      if (data && data.length > 0) found = true;
    } catch (e) {
      console.warn('[CRM Bridge] Replay error:', e);
    }
  }

  if (localStore.crm_outbox) {
    const row = localStore.crm_outbox.find((r: CrmOutboxRecord) => r.id === sessionIdOrId || r.session_id === sessionIdOrId);
    if (row) {
      row.status = 'pending';
      row.attempts = 0;
      row.next_attempt_at = now;
      row.lease_until = null;
      row.updated_at = now;
      found = true;
    }
  }

  return found;
}
