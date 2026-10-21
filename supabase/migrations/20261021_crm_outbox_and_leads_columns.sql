-- =========================================================================
-- COREIQ CREATE // CRM BRIDGE MIGRATION
-- Migration: 20261021_crm_outbox_and_leads_columns.sql
-- Adds: crm_outbox table (service-role only, RLS enabled, no public policies)
--       nullable CRM tracking columns on leads
-- =========================================================================

-- 1. Create crm_outbox table
CREATE TABLE IF NOT EXISTS public.crm_outbox (
    id TEXT PRIMARY KEY,
    session_id TEXT UNIQUE NOT NULL,
    source TEXT DEFAULT 'coreiq-website' NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'dead')),
    attempts INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    next_attempt_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    lease_until TIMESTAMPTZ,
    crm_client_id TEXT,
    crm_client_code TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on crm_outbox
ALTER TABLE public.crm_outbox ENABLE ROW LEVEL SECURITY;

-- Note: Intentionally NO anon or authenticated policies are created.
-- Machine/server access uses the Supabase service-role key which bypasses RLS.

-- Index for queue processing by status and next_attempt_at
CREATE INDEX IF NOT EXISTS idx_crm_outbox_status_next_attempt 
    ON public.crm_outbox(status, next_attempt_at);

-- 2. Nullable columns on public.leads
ALTER TABLE public.leads 
    ADD COLUMN IF NOT EXISTS session_id TEXT,
    ADD COLUMN IF NOT EXISTS crm_client_id TEXT,
    ADD COLUMN IF NOT EXISTS crm_client_code TEXT,
    ADD COLUMN IF NOT EXISTS crm_synced_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS crm_skipped_reason TEXT;

-- Index on session_id for deduplication & joining
CREATE INDEX IF NOT EXISTS idx_leads_session_id 
    ON public.leads(session_id);
