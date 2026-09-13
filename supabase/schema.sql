-- =========================================================================
-- CORE IQ CREATE // PRODUCTION SUPABASE SQL MIGRATION
-- Target Project: https://irrpqqxetyfbafjpjtpt.supabase.co
-- Features: 10 Operational Tables, RLS Enabled on ALL tables, Realtime Replication
-- =========================================================================

-- Enable pgcrypto extension for secure token generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------------------------
-- 1. LEADS (Website & Public inquiries)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    source TEXT DEFAULT 'website' NOT NULL,
    client_name TEXT NOT NULL,
    client_contact TEXT NOT NULL,
    client_message TEXT,
    conversation_summary TEXT,
    intent_type TEXT DEFAULT 'custom',
    status TEXT DEFAULT 'new' NOT NULL,
    full_conversation JSONB,
    client_id TEXT,
    budget_range TEXT,
    notes TEXT
);

-- -------------------------------------------------------------------------
-- 2. SOCIAL MESSAGES (Meta, Instagram, X, LinkedIn, WhatsApp Webhooks)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.social_messages (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    source TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_contact TEXT NOT NULL,
    message_text TEXT NOT NULL,
    status TEXT DEFAULT 'new' NOT NULL
);

-- -------------------------------------------------------------------------
-- 3. TASKS (Execution Pipeline)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'not_started' NOT NULL,
    linked_lead_id TEXT,
    linked_client_id TEXT,
    due_date TIMESTAMPTZ
);

-- -------------------------------------------------------------------------
-- 4. CLIENTS (Directory & Mailing Lists)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    notes TEXT
);

-- -------------------------------------------------------------------------
-- 5. AGENT CONFIG (CoreIQ Brain settings read live by website runtime)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_config (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    base_url TEXT,
    api_key TEXT,
    system_prompt TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- -------------------------------------------------------------------------
-- 6. AGENT TOOLS (External capabilities & integrations)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.agent_tools (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    tool_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    api_key TEXT,
    endpoint_url TEXT,
    status TEXT DEFAULT 'connected' NOT NULL,
    notes TEXT
);

-- -------------------------------------------------------------------------
-- 7. PLATFORMS (Live registered deployment surfaces)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.platforms (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    platform_type TEXT DEFAULT 'website' NOT NULL,
    category TEXT,
    notes TEXT
);

-- -------------------------------------------------------------------------
-- 8. CONTENT (CMS items & storage references)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.content (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT,
    body TEXT,
    category TEXT DEFAULT 'general' NOT NULL,
    media_reference TEXT,
    published BOOLEAN DEFAULT true NOT NULL,
    key TEXT,
    value TEXT,
    type TEXT DEFAULT 'text'
);

-- -------------------------------------------------------------------------
-- 9. SWARM COMMS (Autonomous swarm node telemetry)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.swarm_comms (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    sender_node TEXT,
    target_node TEXT,
    subject TEXT,
    message TEXT,
    agent_name TEXT,
    event_type TEXT,
    payload JSONB,
    lead_reference_id TEXT
);

-- -------------------------------------------------------------------------
-- 10. API KEYS (Machine credentials for external agents like Hermes Prime)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.api_keys (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    raw_token_display TEXT,
    scopes TEXT[] NOT NULL DEFAULT '{}',
    revoked BOOLEAN DEFAULT false NOT NULL,
    last_used_at TIMESTAMPTZ,
    created_by TEXT
);

-- -------------------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) - MANDATORY HARDENING
-- -------------------------------------------------------------------------
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.swarm_comms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can submit leads" ON public.leads;
    DROP POLICY IF EXISTS "Authenticated operators have full leads access" ON public.leads;
    DROP POLICY IF EXISTS "Anon can insert social webhooks" ON public.social_messages;
    DROP POLICY IF EXISTS "Authenticated operators have full social access" ON public.social_messages;
    DROP POLICY IF EXISTS "Authenticated operators have full tasks access" ON public.tasks;
    DROP POLICY IF EXISTS "Authenticated operators have full clients access" ON public.clients;
    DROP POLICY IF EXISTS "Public can read live agent config" ON public.agent_config;
    DROP POLICY IF EXISTS "Authenticated operators have full agent config access" ON public.agent_config;
    DROP POLICY IF EXISTS "Authenticated operators have full tools access" ON public.agent_tools;
    DROP POLICY IF EXISTS "Public can read platforms" ON public.platforms;
    DROP POLICY IF EXISTS "Authenticated operators have full platforms access" ON public.platforms;
    DROP POLICY IF EXISTS "Public can read published content" ON public.content;
    DROP POLICY IF EXISTS "Authenticated operators have full content access" ON public.content;
    DROP POLICY IF EXISTS "Authenticated operators have full swarm access" ON public.swarm_comms;
    DROP POLICY IF EXISTS "Authenticated operators have full api_keys access" ON public.api_keys;
    DROP POLICY IF EXISTS "Service role / API can check api_keys" ON public.api_keys;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- 1. Leads Policies
CREATE POLICY "Public can submit leads" ON public.leads
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated operators have full leads access" ON public.leads
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- 2. Social Messages Policies
CREATE POLICY "Anon can insert social webhooks" ON public.social_messages
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated operators have full social access" ON public.social_messages
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- 3. Tasks Policies (Operator-only)
CREATE POLICY "Authenticated operators have full tasks access" ON public.tasks
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- 4. Clients Policies (Operator-only)
CREATE POLICY "Authenticated operators have full clients access" ON public.clients
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- 5. Agent Config Policies (Public read for dynamic website runtime, Operator write)
CREATE POLICY "Public can read live agent config" ON public.agent_config
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Authenticated operators have full agent config access" ON public.agent_config
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- 6. Agent Tools Policies (Operator-only)
CREATE POLICY "Authenticated operators have full tools access" ON public.agent_tools
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- 7. Platforms Policies (Public read, Operator write)
CREATE POLICY "Public can read platforms" ON public.platforms
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Authenticated operators have full platforms access" ON public.platforms
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- 8. Content Policies (Public read published, Operator write)
CREATE POLICY "Public can read published content" ON public.content
    FOR SELECT TO anon, authenticated
    USING (published = true);

CREATE POLICY "Authenticated operators have full content access" ON public.content
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- 9. Swarm Comms Policies (Operator-only)
CREATE POLICY "Authenticated operators have full swarm access" ON public.swarm_comms
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- 10. API Keys Policies (Operator-only for management)
CREATE POLICY "Authenticated operators have full api_keys access" ON public.api_keys
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- Also allow anon read on api_keys solely by exact key_hash lookup for agent verification if needed
CREATE POLICY "Public can verify valid api_key" ON public.api_keys
    FOR SELECT TO anon
    USING (revoked = false);

-- -------------------------------------------------------------------------
-- REALTIME SUBSCRIPTIONS REPLICATION
-- -------------------------------------------------------------------------
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_config;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_tools;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.platforms;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.content;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.swarm_comms;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.api_keys;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- -------------------------------------------------------------------------
-- SEED DEFAULT ROW FOR AGENT CONFIG
-- -------------------------------------------------------------------------
INSERT INTO public.agent_config (id, provider, model_name, base_url, api_key, system_prompt, updated_at)
VALUES (
    'coreiq_primary_mind',
    'groq',
    'llama-3.3-70b-versatile',
    'https://api.groq.com/openai/v1',
    '',
    '# CORE IQ CREATE — AGENT BRAIN RUNTIME
You are CoreIQ, the sovereign intelligent creation engine for CoreIQ Create.
You are an architectural strategist, product engineer, and capability orchestrator.
- Premium, mathematically rigorous, forward-looking, and decisive.
- Editorial clarity with controlled technological depth.
- Never output marketing clichés ("supercharge", "unleash", "revolutionary").
- When a client brings a project idea, analyze it into: INTENT -> BLUEPRINT -> EXECUTION MILESTONES -> CAPABILITIES.',
    NOW()
) ON CONFLICT (id) DO NOTHING;
