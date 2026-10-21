/**
 * CoreIQ CRM Bridge
 * Handles reliable server-side intake forwarding to CoreIQ CRM (https://coreiqcreate-crm.onrender.com).
 * Manages outbox queueing, retries, backoff, transcripts, secret redaction, and lead syncing.
 */

import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface CrmTranscriptTurn {
  role: 'visitor' | 'assistant';
  text: string;
  at: string;
}

export type CrmIntent = 'website' | 'app' | 'automation' | 'agent' | 'voice' | 'unknown';

export interface CrmIntakePayload {
  source: string;
  session_id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  summary: string;
  intent: CrmIntent;
  budget_hint?: string;
  page_url?: string;
  consent: boolean;
  transcript: CrmTranscriptTurn[];
  honeypot: '';
}

export interface CrmOutboxRow {
  id: string;
  session_id: string;
  source: string;
  payload: CrmIntakePayload;
  status: 'pending' | 'sending' | 'sent' | 'dead';
  attempts: number;
  last_error?: string | null;
  next_attempt_at: string;
  lease_until?: string | null;
  crm_client_id?: string | null;
  crm_client_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmBridgeConfig {
  intakeUrl: string;
  intakeKey: string;
  isConfigured: boolean;
}

export interface CrmBridgeStats {
  configured: boolean;
  crm_host: string | null;
  counts: {
    pending: number;
    sending: number;
    sent: number;
    dead: number;
    total: number;
  };
  last_success_at: string | null;
  oldest_pending_age_seconds: number | null;
}

// Retry backoff schedule in milliseconds: 30s, 2m, 10m, 1h, 6h
const BACKOFF_MS = [
  30 * 1000,
  2 * 60 * 1000,
  10 * 60 * 1000,
  60 * 60 * 1000,
  6 * 60 * 60 * 1000,
];
const MAX_ATTEMPTS = 6;
const LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const SEND_TIMEOUT_MS = 65 * 1000; // 65 seconds timeout (CRM can take ~50s to wake)

/**
 * Get current CRM Bridge configuration from server env
 */
export function getCrmBridgeConfig(): CrmBridgeConfig {
  const intakeUrl = (process.env.CRM_INTAKE_URL || '').trim();
  const intakeKey = (process.env.CRM_INTAKE_KEY || '').trim();
  const isConfigured = Boolean(intakeUrl && intakeKey);
  return {
    intakeUrl,
    intakeKey,
    isConfigured,
  };
}

/**
 * Normalise phone number to E.164 with South Africa default (+27)
 */
export function normalizePhone(rawPhone?: string | null): string | undefined {
  if (!rawPhone || typeof rawPhone !== 'string') return undefined;
  const trimmed = rawPhone.trim();
  if (!trimmed) return undefined;

  // Strip spaces, dashes, parentheses, dots
  const stripped = trimmed.replace(/[\s\-\(\)\.]+/g, '');
  if (!stripped) return undefined;

  // Case 1: Already has leading +
  if (stripped.startsWith('+')) {
    const digits = stripped.slice(1).replace(/\D/g, '');
    return digits ? `+${digits}` : undefined;
  }

  // Case 2: South Africa local starting with 0 (e.g. 0821234567 -> +27821234567)
  if (/^0\d{9}$/.test(stripped)) {
    return `+27${stripped.slice(1)}`;
  }

  // Case 3: Starts with 27 followed by 9 digits
  if (/^27\d{9}$/.test(stripped)) {
    return `+${stripped}`;
  }

  // Case 4: Digits only
  const onlyDigits = stripped.replace(/\D/g, '');
  if (!onlyDigits) return undefined;

  // If 10 digits and starts with 0, convert to +27
  if (onlyDigits.length === 10 && onlyDigits.startsWith('0')) {
    return `+27${onlyDigits.slice(1)}`;
  }

  return `+${onlyDigits}`;
}

/**
 * Redact sensitive tokens and strip HTML tags
 */
export function sanitizeTranscriptText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  // 1. Strip HTML tags
  let cleaned = text.replace(/<[^>]*>/g, '');

  // 2. Redact ciq_live_ API keys
  cleaned = cleaned.replace(/ciq_live_[a-zA-Z0-9_]+/g, '[REDACTED_KEY]');

  // 3. Redact sk- API keys (OpenAI / Gemini / Anthropic)
  cleaned = cleaned.replace(/sk-[a-zA-Z0-9_\-]+/g, '[REDACTED_KEY]');

  // 4. Redact JWT tokens starting with eyJ
  cleaned = cleaned.replace(/eyJ[a-zA-Z0-9_\-\.]+/g, '[REDACTED_JWT]');

  // 5. Redact anything after "password:"
  cleaned = cleaned.replace(/(password\s*:\s*)([^\s\n,;\)]+)/gi, '$1[REDACTED]');

  return cleaned.trim().slice(0, 2000);
}

/**
 * Determine intent from text or keyword rules
 */
export function detectIntent(textOrKeyword?: string | null): CrmIntent {
  if (!textOrKeyword || typeof textOrKeyword !== 'string') return 'unknown';
  const lower = textOrKeyword.toLowerCase();

  if (/website|site|landing/.test(lower)) return 'website';
  if (/app|mobile/.test(lower)) return 'app';
  if (/automat|workflow/.test(lower)) return 'automation';
  if (/agent|chatbot|assistant/.test(lower)) return 'agent';
  if (/voice|call|reception/.test(lower)) return 'voice';

  return 'unknown';
}

/**
 * Build the standardised CRM intake payload
 */
export function buildPayload(input: {
  source?: string;
  session_id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  summary?: string;
  intent?: string;
  budget_hint?: string;
  page_url?: string;
  consent: boolean;
  transcript?: any[];
}): CrmIntakePayload {
  const source = (input.source && input.source.trim()) || 'coreiq-website';
  const email = (input.email || '').trim().toLowerCase();
  const phone = normalizePhone(input.phone);
  const company = (input.company || '').trim() || undefined;
  const summary = (input.summary || '').trim().slice(0, 1200);
  const intent = detectIntent(input.intent || summary);
  const budget_hint = (input.budget_hint || '').trim() || undefined;
  const page_url = (input.page_url || '').trim() || undefined;
  const consent = input.consent === true;

  // Process transcript turns: last 40 turns, { role: 'visitor'|'assistant', text: max 2000, at: ISO string }
  const rawTranscript = Array.isArray(input.transcript) ? input.transcript : [];
  const processedTranscript: CrmTranscriptTurn[] = rawTranscript
    .slice(-40)
    .map((turn: any) => {
      const rawRole = String(turn?.role || turn?.sender || '').toLowerCase();
      const role: 'visitor' | 'assistant' =
        rawRole === 'assistant' || rawRole === 'coreiq' || rawRole === 'system' || rawRole === 'operator'
          ? 'assistant'
          : 'visitor';

      const rawText = String(turn?.text || turn?.content || turn?.message || '');
      const text = sanitizeTranscriptText(rawText);
      const at = turn?.at || turn?.timestamp || new Date().toISOString();

      return { role, text, at: typeof at === 'string' ? at : new Date(at).toISOString() };
    });

  return {
    source,
    session_id: input.session_id,
    name: input.name.trim(),
    email,
    ...(phone ? { phone } : {}),
    ...(company ? { company } : {}),
    summary,
    intent,
    ...(budget_hint ? { budget_hint } : {}),
    ...(page_url ? { page_url } : {}),
    consent,
    transcript: processedTranscript,
    honeypot: '',
  };
}

/**
 * Validate skip rules for intake:
 * Returns { shouldEnqueue: false, reason: 'no_contact' | 'no_consent' } if not qualified.
 */
export function evaluateSkipRules(input: {
  email?: string | null;
  phone?: string | null;
  consent?: boolean | null;
}): { shouldEnqueue: boolean; reason?: 'no_contact' | 'no_consent' } {
  const hasEmail = Boolean(input.email && input.email.trim());
  const hasPhone = Boolean(input.phone && input.phone.trim());

  if (!hasEmail && !hasPhone) {
    return { shouldEnqueue: false, reason: 'no_contact' };
  }

  if (input.consent !== true) {
    return { shouldEnqueue: false, reason: 'no_consent' };
  }

  return { shouldEnqueue: true };
}

/**
 * Enqueue an intake payload into crm_outbox (Supabase or localStore)
 */
export async function enqueueOutbox(
  payload: CrmIntakePayload,
  ctx: {
    db: SupabaseClient | null;
    localStore: Record<string, any[]>;
  }
): Promise<{ row: CrmOutboxRow; status: 'queued' | 'debounced' }> {
  const { db, localStore } = ctx;
  const now = new Date();
  const nowIso = now.toISOString();

  // Find existing outbox row by session_id
  let existingRow: CrmOutboxRow | null = null;
  if (db) {
    try {
      const { data } = await db
        .from('crm_outbox')
        .select('*')
        .eq('session_id', payload.session_id)
        .maybeSingle();
      if (data) existingRow = data as CrmOutboxRow;
    } catch (e) {
      console.warn('[CRM Bridge DB read warning]:', e);
    }
  }

  if (!existingRow) {
    localStore.crm_outbox = localStore.crm_outbox || [];
    existingRow = localStore.crm_outbox.find((r: CrmOutboxRow) => r.session_id === payload.session_id) || null;
  }

  let nextAttemptAt = nowIso;
  let status: 'pending' | 'sending' | 'sent' | 'dead' = 'pending';
  let queueStatus: 'queued' | 'debounced' = 'queued';

  if (existingRow) {
    // If already sent and payload has updated, set to pending with next_attempt_at = now + 60s (debounce)
    if (existingRow.status === 'sent') {
      const payloadChanged = JSON.stringify(existingRow.payload) !== JSON.stringify(payload);
      if (payloadChanged) {
        nextAttemptAt = new Date(now.getTime() + 60 * 1000).toISOString();
        status = 'pending';
        queueStatus = 'debounced';
      } else {
        // Unchanged sent row remains sent
        return { row: existingRow, status: 'queued' };
      }
    } else if (existingRow.status === 'dead') {
      // Allow new submission for a dead session to retry
      status = 'pending';
      nextAttemptAt = nowIso;
    } else {
      // Pending or sending
      status = 'pending';
      nextAttemptAt = existingRow.next_attempt_at || nowIso;
    }
  }

  const outboxId = existingRow?.id || (crypto.randomUUID ? crypto.randomUUID() : `outbox_${Date.now()}`);
  const outboxRecord: CrmOutboxRow = {
    id: outboxId,
    session_id: payload.session_id,
    source: payload.source,
    payload,
    status,
    attempts: existingRow ? existingRow.attempts : 0,
    last_error: existingRow?.last_error || null,
    next_attempt_at: nextAttemptAt,
    lease_until: null,
    crm_client_id: existingRow?.crm_client_id || null,
    crm_client_code: existingRow?.crm_client_code || null,
    created_at: existingRow?.created_at || nowIso,
    updated_at: nowIso,
  };

  if (db) {
    try {
      const { data, error } = await db
        .from('crm_outbox')
        .upsert([outboxRecord], { onConflict: 'session_id' })
        .select()
        .single();
      if (!error && data) {
        return { row: data as CrmOutboxRow, status: queueStatus };
      }
    } catch (e) {
      console.warn('[CRM Bridge DB upsert warning]:', e);
    }
  }

  // Fallback to localStore
  localStore.crm_outbox = localStore.crm_outbox || [];
  const idx = localStore.crm_outbox.findIndex((r: CrmOutboxRow) => r.session_id === payload.session_id);
  if (idx >= 0) {
    localStore.crm_outbox[idx] = outboxRecord;
  } else {
    localStore.crm_outbox.push(outboxRecord);
  }

  return { row: outboxRecord, status: queueStatus };
}

/**
 * Send an outbox row to CRM_INTAKE_URL
 */
export async function sendOutboxRow(
  row: CrmOutboxRow,
  config: CrmBridgeConfig,
  ctx: {
    db: SupabaseClient | null;
    localStore: Record<string, any[]>;
  }
): Promise<{ success: boolean; status: 'sent' | 'pending' | 'dead'; error?: string; client_code?: string; client_id?: string }> {
  if (!config.isConfigured) {
    return { success: false, status: 'pending', error: 'CRM bridge is not configured (missing URL or KEY)' };
  }

  const { db, localStore } = ctx;
  const now = new Date();

  // Create AbortController with 65s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SEND_TIMEOUT_MS);

  let responseStatus = 0;
  let responseData: any = null;
  let networkError: string | null = null;

  try {
    const res = await fetch(config.intakeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.intakeKey}`,
      },
      body: JSON.stringify(row.payload),
      signal: controller.signal,
    });

    responseStatus = res.status;
    const text = await res.text();
    try {
      responseData = JSON.parse(text);
    } catch {
      responseData = { message: text.slice(0, 500) };
    }
  } catch (err: any) {
    networkError = err?.name === 'AbortError' ? 'Connection timed out after 65s' : err?.message || 'Network error';
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle outcome
  let nextStatus: 'sent' | 'pending' | 'dead' = 'pending';
  let crmClientId: string | null = row.crm_client_id || null;
  let crmClientCode: string | null = row.crm_client_code || null;
  let lastError: string | null = null;
  let nextAttemptAt: string = row.next_attempt_at;
  const nextAttempts = row.attempts + 1;

  if (!networkError && responseStatus >= 200 && responseStatus < 300) {
    // 2xx Success
    nextStatus = 'sent';
    crmClientId = responseData?.client_id || responseData?.id || null;
    crmClientCode = responseData?.code || responseData?.client_code || null;
    lastError = null;
  } else if (!networkError && responseStatus >= 400 && responseStatus < 500 && responseStatus !== 408 && responseStatus !== 429) {
    // 4xx (except 408 & 429): Non-retryable error -> dead
    nextStatus = 'dead';
    lastError = `HTTP ${responseStatus}: ${String(responseData?.message || responseData?.error || 'Rejected by CRM').slice(0, 500)}`;
  } else {
    // 408, 429, 5xx, timeout, or network error: schedule retry with backoff
    const errText = networkError || `HTTP ${responseStatus}: ${String(responseData?.message || responseData?.error || 'Server error').slice(0, 500)}`;
    lastError = errText;

    if (nextAttempts >= MAX_ATTEMPTS) {
      nextStatus = 'dead';
    } else {
      nextStatus = 'pending';
      const backoffDelay = BACKOFF_MS[Math.min(nextAttempts - 1, BACKOFF_MS.length - 1)];
      nextAttemptAt = new Date(now.getTime() + backoffDelay).toISOString();
    }
  }

  // Update outbox record
  const updatedRow: CrmOutboxRow = {
    ...row,
    status: nextStatus,
    attempts: nextStatus === 'sent' ? row.attempts : nextAttempts,
    last_error: lastError,
    next_attempt_at: nextAttemptAt,
    lease_until: null,
    crm_client_id: crmClientId,
    crm_client_code: crmClientCode,
    updated_at: new Date().toISOString(),
  };

  // Persist to DB or localStore
  if (db) {
    try {
      await db.from('crm_outbox').update(updatedRow).eq('id', row.id);

      // If sent, update corresponding row in public.leads table
      if (nextStatus === 'sent') {
        await db
          .from('leads')
          .update({
            crm_client_id: crmClientId,
            crm_client_code: crmClientCode,
            crm_synced_at: new Date().toISOString(),
          })
          .eq('session_id', row.session_id);
      }
    } catch (e) {
      console.warn('[CRM Bridge outbox update DB error]:', e);
    }
  }

  localStore.crm_outbox = localStore.crm_outbox || [];
  const idx = localStore.crm_outbox.findIndex((r: CrmOutboxRow) => r.id === row.id);
  if (idx >= 0) {
    localStore.crm_outbox[idx] = updatedRow;
  } else {
    localStore.crm_outbox.push(updatedRow);
  }

  // Also update localStore leads if applicable
  if (nextStatus === 'sent' && localStore.leads) {
    const lead = localStore.leads.find((l: any) => l.session_id === row.session_id);
    if (lead) {
      lead.crm_client_id = crmClientId;
      lead.crm_client_code = crmClientCode;
      lead.crm_synced_at = new Date().toISOString();
    }
  }

  return {
    success: nextStatus === 'sent',
    status: nextStatus,
    error: lastError || undefined,
    client_code: crmClientCode || undefined,
    client_id: crmClientId || undefined,
  };
}

/**
 * Process due outbox rows (limit 10)
 * Uses a 5-minute lease to prevent double-sends across concurrent workers.
 */
export async function processOutbox(
  limit: number = 10,
  ctx: {
    db: SupabaseClient | null;
    localStore: Record<string, any[]>;
  }
): Promise<{ processed: number; sent: number; pending: number; dead: number }> {
  const config = getCrmBridgeConfig();
  const { db, localStore } = ctx;
  const now = new Date();
  const nowIso = now.toISOString();
  const leaseUntilIso = new Date(now.getTime() + LEASE_DURATION_MS).toISOString();

  let claimedRows: CrmOutboxRow[] = [];

  if (db) {
    try {
      // 1. Release expired leases (rows stuck in 'sending' past lease_until)
      await db
        .from('crm_outbox')
        .update({ status: 'pending', lease_until: null, updated_at: nowIso })
        .eq('status', 'sending')
        .lt('lease_until', nowIso);

      // 2. Claim due pending rows
      const { data: dueRows } = await db
        .from('crm_outbox')
        .select('*')
        .eq('status', 'pending')
        .lte('next_attempt_at', nowIso)
        .order('next_attempt_at', { ascending: true })
        .limit(limit);

      if (dueRows && dueRows.length > 0) {
        const ids = dueRows.map((r: any) => r.id);
        const { data: updatedClaimed } = await db
          .from('crm_outbox')
          .update({ status: 'sending', lease_until: leaseUntilIso, updated_at: nowIso })
          .in('id', ids)
          .select('*');

        claimedRows = (updatedClaimed as CrmOutboxRow[]) || [];
      }
    } catch (e) {
      console.warn('[CRM Bridge DB claim warning]:', e);
    }
  }

  // Memory fallback / local store processing
  if (claimedRows.length === 0) {
    localStore.crm_outbox = localStore.crm_outbox || [];

    // Release expired leases in memory
    for (const r of localStore.crm_outbox) {
      if (r.status === 'sending' && r.lease_until && new Date(r.lease_until) < now) {
        r.status = 'pending';
        r.lease_until = null;
      }
    }

    const dueMemory = localStore.crm_outbox
      .filter((r: CrmOutboxRow) => r.status === 'pending' && new Date(r.next_attempt_at) <= now)
      .slice(0, limit);

    for (const r of dueMemory) {
      r.status = 'sending';
      r.lease_until = leaseUntilIso;
      claimedRows.push(r);
    }
  }

  let sent = 0;
  let pending = 0;
  let dead = 0;

  for (const row of claimedRows) {
    try {
      const result = await sendOutboxRow(row, config, ctx);
      if (result.status === 'sent') sent++;
      else if (result.status === 'dead') dead++;
      else pending++;
    } catch {
      pending++;
    }
  }

  return {
    processed: claimedRows.length,
    sent,
    pending,
    dead,
  };
}

/**
 * Get aggregate statistics on CRM bridge status and queue counts
 */
export async function getCrmBridgeStats(ctx: {
  db: SupabaseClient | null;
  localStore: Record<string, any[]>;
}): Promise<CrmBridgeStats> {
  const config = getCrmBridgeConfig();
  const { db, localStore } = ctx;

  let rows: CrmOutboxRow[] = [];

  if (db) {
    try {
      const { data } = await db.from('crm_outbox').select('*').order('created_at', { ascending: false });
      if (data) rows = data as CrmOutboxRow[];
    } catch (e) {
      console.warn('[CRM Bridge stats DB warning]:', e);
    }
  }

  if (rows.length === 0) {
    rows = (localStore.crm_outbox as CrmOutboxRow[]) || [];
  }

  const counts = {
    pending: 0,
    sending: 0,
    sent: 0,
    dead: 0,
    total: rows.length,
  };

  let lastSuccessAt: string | null = null;
  let oldestPendingTime: number | null = null;

  for (const r of rows) {
    if (r.status === 'pending') {
      counts.pending++;
      const createdAtMs = new Date(r.created_at).getTime();
      if (oldestPendingTime === null || createdAtMs < oldestPendingTime) {
        oldestPendingTime = createdAtMs;
      }
    } else if (r.status === 'sending') {
      counts.sending++;
    } else if (r.status === 'sent') {
      counts.sent++;
      if (!lastSuccessAt || new Date(r.updated_at) > new Date(lastSuccessAt)) {
        lastSuccessAt = r.updated_at;
      }
    } else if (r.status === 'dead') {
      counts.dead++;
    }
  }

  let oldestPendingAgeSeconds: number | null = null;
  if (oldestPendingTime !== null) {
    oldestPendingAgeSeconds = Math.max(0, Math.round((Date.now() - oldestPendingTime) / 1000));
  }

  let crmHost: string | null = null;
  if (config.intakeUrl) {
    try {
      crmHost = new URL(config.intakeUrl).host;
    } catch {
      crmHost = config.intakeUrl;
    }
  }

  return {
    configured: config.isConfigured,
    crm_host: crmHost,
    counts,
    last_success_at: lastSuccessAt,
    oldest_pending_age_seconds: oldestPendingAgeSeconds,
  };
}
