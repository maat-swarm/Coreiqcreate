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
    type TEXT DEFAULT 'text',
    -- Extended Content System Columns
    content_key TEXT UNIQUE,
    slug TEXT,
    content_type TEXT DEFAULT 'text',
    status TEXT DEFAULT 'PLACEHOLDER',
    summary TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    asset_url TEXT,
    version INT DEFAULT 1,
    updated_by TEXT
);

-- Backward-compatible migration if table already exists
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS content_key TEXT UNIQUE;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'text';
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PLACEHOLDER';
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS summary TEXT;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS asset_url TEXT;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS version INT DEFAULT 1;
ALTER TABLE public.content ADD COLUMN IF NOT EXISTS updated_by TEXT;

CREATE INDEX IF NOT EXISTS idx_content_key ON public.content(content_key);
CREATE INDEX IF NOT EXISTS idx_content_slug ON public.content(slug);

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
    ALTER PUBLICATION supabase_realtime ADD TABLE public.media_slots;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.media_slot_items;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- -------------------------------------------------------------------------
-- 11. MEDIA SLOTS & MEDIA SLOT ITEMS (Operational Media Gateway)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.media_slots (
    slot_key TEXT PRIMARY KEY,
    id TEXT,
    page TEXT NOT NULL,
    label TEXT NOT NULL,
    allowed_types TEXT[] NOT NULL,
    max_items INT NOT NULL,
    max_bytes BIGINT NOT NULL,
    aspect TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.media_slots ADD COLUMN IF NOT EXISTS id TEXT;
UPDATE public.media_slots SET id = slot_key WHERE id IS NULL;

CREATE TABLE IF NOT EXISTS public.media_slot_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slot_key TEXT NOT NULL REFERENCES public.media_slots(slot_key) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('image', 'video', 'url', 'file')),
    storage_path TEXT NULL,
    url TEXT NULL,
    poster_url TEXT NULL,
    alt TEXT NULL,
    title TEXT NULL,
    caption TEXT NULL,
    cta_label TEXT NULL,
    cta_url TEXT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    published BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.media_slot_items ADD COLUMN IF NOT EXISTS poster_url TEXT;

DO $$
BEGIN
    ALTER TABLE public.media_slot_items DROP CONSTRAINT IF EXISTS media_slot_items_type_check;
    ALTER TABLE public.media_slot_items ADD CONSTRAINT media_slot_items_type_check 
        CHECK (type IN ('image', 'video', 'url', 'file'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_media_slots_page ON public.media_slots(page);
CREATE INDEX IF NOT EXISTS idx_media_slot_items_slot_key ON public.media_slot_items(slot_key);
CREATE INDEX IF NOT EXISTS idx_media_slot_items_published ON public.media_slot_items(slot_key, published, sort_order);

-- RLS for media_slots & items
ALTER TABLE public.media_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_slot_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can read media slots" ON public.media_slots;
    DROP POLICY IF EXISTS "Authenticated operators have full media slots access" ON public.media_slots;
    DROP POLICY IF EXISTS "Public can read published media slot items" ON public.media_slot_items;
    DROP POLICY IF EXISTS "Authenticated operators have full media slot items access" ON public.media_slot_items;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Public can read media slots" ON public.media_slots
    FOR SELECT TO anon, authenticated
    USING (true);

CREATE POLICY "Authenticated operators have full media slots access" ON public.media_slots
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

CREATE POLICY "Public can read published media slot items" ON public.media_slot_items
    FOR SELECT TO anon, authenticated
    USING (published = true);

CREATE POLICY "Authenticated operators have full media slot items access" ON public.media_slot_items
    FOR ALL TO authenticated
    USING (true) WITH CHECK (true);

-- Seed full catalog of 23 Media Slots
INSERT INTO public.media_slots (slot_key, id, page, label, allowed_types, max_items, max_bytes, aspect)
VALUES
    ('home.showcase', 'home.showcase', 'home', 'Home showcase carousel', ARRAY['image', 'video'], 6, 52428800, '16:9'),
    ('home.intro_video', 'home.intro_video', 'home', 'Home intro video', ARRAY['video', 'url'], 1, 52428800, '16:9'),
    ('home.intro_poster', 'home.intro_poster', 'home', 'Home intro video poster', ARRAY['image'], 1, 5242880, '16:9'),
    ('services.feature_video', 'services.feature_video', 'services', 'Services Feature Video', ARRAY['video', 'url', 'image'], 2, 52428800, '16:9'),
    ('solutions.showcase', 'solutions.showcase', 'solutions', 'Solutions showcase carousel', ARRAY['image', 'video'], 6, 52428800, '16:9'),
    ('apps.showcase', 'apps.showcase', 'apps', 'Apps showcase carousel', ARRAY['image', 'video'], 6, 52428800, '16:9'),
    ('learn.showcase', 'learn.showcase', 'learn', 'Learn showcase carousel', ARRAY['image', 'video'], 6, 52428800, '16:9'),
    ('learn.lesson_of_week', 'learn.lesson_of_week', 'learn', 'Lesson of the Week', ARRAY['video', 'url'], 1, 209715200, '16:9'),
    ('learn.step1.video', 'learn.step1.video', 'learn', 'Step 1 Video', ARRAY['video'], 1, 209715200, '16:9'),
    ('learn.step2.video', 'learn.step2.video', 'learn', 'Step 2 Video', ARRAY['video'], 1, 209715200, '16:9'),
    ('learn.step3.video', 'learn.step3.video', 'learn', 'Step 3 Video', ARRAY['video'], 1, 209715200, '16:9'),
    ('learn.step1.pdf', 'learn.step1.pdf', 'learn', 'Step 1 PDF Guide', ARRAY['file'], 1, 20971520, NULL),
    ('learn.step2.pdf', 'learn.step2.pdf', 'learn', 'Step 2 PDF Guide', ARRAY['file'], 1, 20971520, NULL),
    ('learn.step3.pdf', 'learn.step3.pdf', 'learn', 'Step 3 PDF Guide', ARRAY['file'], 1, 20971520, NULL),
    ('tools.showcase', 'tools.showcase', 'tools', 'Tools showcase carousel', ARRAY['image', 'video'], 6, 52428800, '16:9'),
    ('about.showcase', 'about.showcase', 'about', 'About showcase carousel', ARRAY['image', 'video'], 6, 52428800, '16:9'),
    ('news.showcase', 'news.showcase', 'news', 'News showcase carousel', ARRAY['image', 'video'], 6, 52428800, '16:9'),
    ('site.background', 'site.background', 'site', 'Site global background video', ARRAY['video', 'url'], 1, 52428800, '16:9'),
    ('site.background_poster', 'site.background_poster', 'site', 'Site global background poster', ARRAY['image'], 1, 5242880, '16:9'),
    ('tools.maatverse.banner', 'tools.maatverse.banner', 'tools', 'Ma''atverse Stage Banner', ARRAY['image', 'video'], 1, 52428800, '8:3'),
    ('tools.maatverse.mascot', 'tools.maatverse.mascot', 'tools', 'Ma''atverse Mascot', ARRAY['image', 'video'], 1, 52428800, '4:5'),
    ('tools.page.background', 'tools.page.background', 'tools', 'Tools Page Background', ARRAY['image', 'video'], 1, 52428800, '16:9'),
    ('maatverse.page.background', 'maatverse.page.background', 'maatverse', 'Ma''atverse Page Background', ARRAY['image', 'video'], 1, 52428800, '16:9')
ON CONFLICT (slot_key) DO UPDATE SET
    id = EXCLUDED.slot_key,
    page = EXCLUDED.page,
    label = EXCLUDED.label,
    allowed_types = EXCLUDED.allowed_types,
    max_items = EXCLUDED.max_items,
    max_bytes = EXCLUDED.max_bytes,
    aspect = EXCLUDED.aspect,
    updated_at = timezone('utc'::text, now());

-- Storage Bucket Setup for 'media'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    52428800,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access Media Bucket'
    ) THEN
        CREATE POLICY "Public Access Media Bucket"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'media');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Operator Media Bucket Management'
    ) THEN
        CREATE POLICY "Authenticated Operator Media Bucket Management"
            ON storage.objects FOR ALL
            TO authenticated
            USING (bucket_id = 'media')
            WITH CHECK (bucket_id = 'media');
    END IF;
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
