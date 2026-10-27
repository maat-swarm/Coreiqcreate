-- =========================================================================
-- CORE IQ CREATE // CRM BRIDGE MIGRATION
-- =========================================================================

-- 1. Table: crm_outbox
CREATE TABLE IF NOT EXISTS public.crm_outbox (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL UNIQUE,
    source TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL, -- pending | sending | sent | dead
    attempts INTEGER DEFAULT 0 NOT NULL,
    last_error TEXT,
    next_attempt_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    lease_until TIMESTAMPTZ,
    crm_client_id TEXT,
    crm_client_code TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index on (status, next_attempt_at) for efficient outbox worker claiming
CREATE INDEX IF NOT EXISTS idx_crm_outbox_status_next_attempt ON public.crm_outbox (status, next_attempt_at);

-- RLS ON: strictly block anon and authenticated. Service role only.
ALTER TABLE public.crm_outbox ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage crm_outbox" ON public.crm_outbox;
CREATE POLICY "Service role can manage crm_outbox" ON public.crm_outbox
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Nullable columns on leads table
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS crm_client_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS crm_client_code TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS crm_synced_at TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS crm_skipped_reason TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_session_id ON public.leads (session_id) WHERE session_id IS NOT NULL;
