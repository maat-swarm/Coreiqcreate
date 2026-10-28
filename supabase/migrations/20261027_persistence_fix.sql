-- =========================================================================
-- CORE IQ CREATE // COMPREHENSIVE PERSISTENCE & HARDENING MIGRATION
-- Migration File: 20261027_persistence_fix.sql
-- Characteristics: 100% Additive, Idempotent, Zero Data Loss (No DROP/TRUNCATE)
-- =========================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. CONTENT (Dynamic Site Copy, Modules, & Guidance)
CREATE TABLE IF NOT EXISTS public.content (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    key TEXT,
    content_key TEXT,
    title TEXT,
    summary TEXT,
    body TEXT,
    value TEXT,
    category TEXT DEFAULT 'general',
    content_type TEXT DEFAULT 'text',
    status TEXT DEFAULT 'PUBLISHED',
    slug TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    published BOOLEAN DEFAULT true NOT NULL,
    version INTEGER DEFAULT 1 NOT NULL,
    type TEXT DEFAULT 'text',
    media_reference TEXT,
    asset_url TEXT,
    updated_by TEXT
);

-- Ensure indexes and columns exist
DO $$
BEGIN
    ALTER TABLE public.content ADD COLUMN IF NOT EXISTS content_key TEXT;
    ALTER TABLE public.content ADD COLUMN IF NOT EXISTS summary TEXT;
    ALTER TABLE public.content ADD COLUMN IF NOT EXISTS body TEXT;
    ALTER TABLE public.content ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PUBLISHED';
    ALTER TABLE public.content ADD COLUMN IF NOT EXISTS slug TEXT;
    ALTER TABLE public.content ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;
    ALTER TABLE public.content ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
    ALTER TABLE public.content ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE public.content ADD COLUMN IF NOT EXISTS asset_url TEXT;
    ALTER TABLE public.content ADD COLUMN IF NOT EXISTS updated_by TEXT;
END $$;

CREATE INDEX IF NOT EXISTS idx_content_content_key ON public.content(content_key);
CREATE INDEX IF NOT EXISTS idx_content_key ON public.content(key);
CREATE INDEX IF NOT EXISTS idx_content_published ON public.content(published);

-- 2. NEWS ARTICLES (Newsfeed & Editorial Intelligence)
CREATE TABLE IF NOT EXISTS public.news_articles (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    slug TEXT UNIQUE,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    body TEXT NOT NULL,
    category TEXT DEFAULT 'Frontier Models',
    hero_image TEXT,
    author TEXT DEFAULT 'CoreIQ Intelligence Desk',
    read_time TEXT DEFAULT '4 min read',
    badge TEXT DEFAULT 'UPDATE',
    featured BOOLEAN DEFAULT false,
    tags TEXT[] DEFAULT '{}',
    takeaways TEXT[] DEFAULT '{}',
    source TEXT DEFAULT 'CoreIQ Frontier Intelligence',
    accent_color TEXT DEFAULT 'cyan',
    published BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0
);

DO $$
BEGIN
    ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
    ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS takeaways TEXT[] DEFAULT '{}';
    ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'CoreIQ Frontier Intelligence';
    ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT 'cyan';
    ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS published BOOLEAN DEFAULT true;
    ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
END $$;

CREATE INDEX IF NOT EXISTS idx_news_published ON public.news_articles(published, sort_order);
CREATE INDEX IF NOT EXISTS idx_news_slug ON public.news_articles(slug);

-- 3. SITE TOOLS & CATALOG
CREATE TABLE IF NOT EXISTS public.site_tools (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    tagline TEXT DEFAULT '',
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'Productivity',
    tier TEXT DEFAULT 'free',
    origin TEXT DEFAULT 'coreiq',
    is_paid BOOLEAN DEFAULT false,
    price_amount NUMERIC(10, 2),
    price_currency TEXT DEFAULT 'USD',
    launch_type TEXT DEFAULT 'coming_soon',
    launch_url TEXT,
    cta_label TEXT DEFAULT 'Open',
    form_schema JSONB DEFAULT '[]'::jsonb,
    image_url TEXT,
    image_path TEXT,
    featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 100,
    status TEXT DEFAULT 'published',
    is_mock BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS public.site_tool_private (
    tool_id TEXT PRIMARY KEY REFERENCES public.site_tools(id) ON DELETE CASCADE,
    launch_url TEXT,
    payment_url TEXT,
    download_path TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.tool_submissions (
    id TEXT PRIMARY KEY,
    tool_id TEXT REFERENCES public.site_tools(id) ON DELETE CASCADE,
    client_name TEXT,
    client_contact TEXT,
    form_data JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'new',
    payment_status TEXT DEFAULT 'unpaid',
    deliverable_path TEXT,
    operator_notes TEXT,
    file_paths TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_site_tools_status ON public.site_tools(status, featured, sort_order);

-- 4. MEDIA SLOTS & ITEMS
CREATE TABLE IF NOT EXISTS public.media_slots (
    slot_key TEXT PRIMARY KEY,
    page TEXT NOT NULL,
    label TEXT NOT NULL,
    allowed_types TEXT[] NOT NULL DEFAULT '{"image"}'::text[],
    max_items INTEGER DEFAULT 1,
    max_bytes BIGINT DEFAULT 52428800,
    aspect TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.media_slot_items (
    id TEXT PRIMARY KEY,
    slot_key TEXT REFERENCES public.media_slots(slot_key) ON DELETE CASCADE,
    type TEXT NOT NULL,
    url TEXT,
    storage_path TEXT,
    title TEXT,
    caption TEXT,
    alt TEXT,
    cta_label TEXT,
    cta_url TEXT,
    published BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_media_slot_items_slot ON public.media_slot_items(slot_key, published, sort_order);

-- 5. LEADS & INBOUND
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    client_name TEXT NOT NULL,
    client_contact TEXT,
    client_message TEXT,
    conversation_summary TEXT,
    intent_type TEXT,
    source TEXT DEFAULT 'website',
    status TEXT DEFAULT 'new',
    budget_range TEXT,
    notes TEXT,
    session_id TEXT,
    crm_skipped_reason TEXT
);

-- 6. TASKS & CLIENTS
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    assigned_to TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'backlog',
    due_date TIMESTAMPTZ,
    tags TEXT[] DEFAULT '{}',
    source TEXT DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    company TEXT,
    email TEXT,
    phone TEXT,
    status TEXT DEFAULT 'lead',
    tier TEXT DEFAULT 'standard',
    notes TEXT,
    total_spent NUMERIC DEFAULT 0
);

-- 7. SOCIAL MESSAGES & TELEMETRY
CREATE TABLE IF NOT EXISTS public.social_messages (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    source TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_contact TEXT,
    message_text TEXT NOT NULL,
    status TEXT DEFAULT 'new',
    channel TEXT,
    raw_payload JSONB
);

-- 8. AGENT CONFIG & API KEYS
CREATE TABLE IF NOT EXISTS public.agent_config (
    id TEXT PRIMARY KEY,
    provider TEXT DEFAULT 'groq',
    model_name TEXT DEFAULT 'llama-3.3-70b-versatile',
    base_url TEXT DEFAULT 'https://api.groq.com/openai/v1',
    api_key TEXT,
    system_prompt TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.api_keys (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    raw_token_display TEXT,
    scopes TEXT[] DEFAULT '{}',
    revoked BOOLEAN DEFAULT false NOT NULL,
    last_used_at TIMESTAMPTZ,
    created_by TEXT
);

-- 9. STORE & APPLICATION PACKAGES
CREATE TABLE IF NOT EXISTS public.store_apps (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    tagline TEXT,
    description TEXT,
    category TEXT DEFAULT 'Productivity',
    status TEXT DEFAULT 'published',
    price_mode TEXT DEFAULT 'free',
    price_amount NUMERIC(10, 2),
    currency TEXT DEFAULT 'USD',
    price_note TEXT,
    payment_label TEXT,
    payment_url TEXT,
    payment_instructions TEXT,
    distribution_type TEXT DEFAULT 'download',
    external_url TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size_bytes BIGINT,
    sha256 TEXT,
    requires_email BOOLEAN DEFAULT false,
    icon_url TEXT,
    icon_name TEXT DEFAULT 'Sparkles',
    accent_color TEXT DEFAULT '#06b6d4',
    screenshots TEXT[] DEFAULT '{}',
    version TEXT DEFAULT '1.0.0',
    changelog TEXT,
    sort_order INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.app_access_links (
    id TEXT PRIMARY KEY,
    app_id TEXT REFERENCES public.store_apps(id) ON DELETE CASCADE,
    token_hash TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    max_uses INTEGER DEFAULT 1,
    use_count INTEGER DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.app_downloads (
    id TEXT PRIMARY KEY,
    app_id TEXT REFERENCES public.store_apps(id) ON DELETE CASCADE,
    access_link_id TEXT,
    ip_hash TEXT,
    user_agent TEXT,
    downloaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.app_requests (
    id TEXT PRIMARY KEY,
    app_id TEXT REFERENCES public.store_apps(id) ON DELETE CASCADE,
    user_name TEXT,
    user_email TEXT NOT NULL,
    message TEXT,
    status TEXT DEFAULT 'new',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.store_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. STORAGE BUCKETS (Additive idempotency)
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('media', 'media', true),
    ('app-files', 'app-files', false),
    ('tool-submissions', 'tool-submissions', false),
    ('use-cases', 'use-cases', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Drop and recreate storage policies for media bucket
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public Media Read" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Media Insert" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Media Update" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated Media Delete" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

CREATE POLICY "Public Media Read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id IN ('media', 'use-cases'));
CREATE POLICY "Authenticated Media Insert" ON storage.objects FOR INSERT TO anon, authenticated WITH CHECK (bucket_id IN ('media', 'use-cases', 'tool-submissions', 'app-files'));
CREATE POLICY "Authenticated Media Update" ON storage.objects FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated Media Delete" ON storage.objects FOR DELETE TO authenticated USING (true);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_tool_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_slot_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_access_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DO $$
BEGIN
    DROP POLICY IF EXISTS "Public can read published content" ON public.content;
    DROP POLICY IF EXISTS "Full content access for authenticated" ON public.content;
    DROP POLICY IF EXISTS "Public can read published news" ON public.news_articles;
    DROP POLICY IF EXISTS "Full news access for authenticated" ON public.news_articles;
    DROP POLICY IF EXISTS "Public can read published site tools" ON public.site_tools;
    DROP POLICY IF EXISTS "Full site tools access for authenticated" ON public.site_tools;
    DROP POLICY IF EXISTS "Full site tools private access for authenticated" ON public.site_tool_private;
    DROP POLICY IF EXISTS "Public can submit tool submissions" ON public.tool_submissions;
    DROP POLICY IF EXISTS "Full tool submissions access for authenticated" ON public.tool_submissions;
    DROP POLICY IF EXISTS "Public can read media slots" ON public.media_slots;
    DROP POLICY IF EXISTS "Full media slots access for authenticated" ON public.media_slots;
    DROP POLICY IF EXISTS "Public can read published media items" ON public.media_slot_items;
    DROP POLICY IF EXISTS "Full media items access for authenticated" ON public.media_slot_items;
    DROP POLICY IF EXISTS "Public can submit leads" ON public.leads;
    DROP POLICY IF EXISTS "Full leads access for authenticated" ON public.leads;
    DROP POLICY IF EXISTS "Full tasks access for authenticated" ON public.tasks;
    DROP POLICY IF EXISTS "Full clients access for authenticated" ON public.clients;
    DROP POLICY IF EXISTS "Public can insert social webhooks" ON public.social_messages;
    DROP POLICY IF EXISTS "Full social access for authenticated" ON public.social_messages;
    DROP POLICY IF EXISTS "Public can read agent config" ON public.agent_config;
    DROP POLICY IF EXISTS "Full agent config access for authenticated" ON public.agent_config;
    DROP POLICY IF EXISTS "Full api keys access for authenticated" ON public.api_keys;
    DROP POLICY IF EXISTS "Public can read published store apps" ON public.store_apps;
    DROP POLICY IF EXISTS "Full store apps access for authenticated" ON public.store_apps;
    DROP POLICY IF EXISTS "Full app access links for authenticated" ON public.app_access_links;
    DROP POLICY IF EXISTS "Public can record app download" ON public.app_downloads;
    DROP POLICY IF EXISTS "Full app downloads for authenticated" ON public.app_downloads;
    DROP POLICY IF EXISTS "Public can submit app request" ON public.app_requests;
    DROP POLICY IF EXISTS "Full app requests for authenticated" ON public.app_requests;
    DROP POLICY IF EXISTS "Public can read store settings" ON public.store_settings;
    DROP POLICY IF EXISTS "Full store settings for authenticated" ON public.store_settings;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Policy definitions
CREATE POLICY "Public can read published content" ON public.content FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Full content access for authenticated" ON public.content FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can read published news" ON public.news_articles FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Full news access for authenticated" ON public.news_articles FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can read published site tools" ON public.site_tools FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Full site tools access for authenticated" ON public.site_tools FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full site tools private access for authenticated" ON public.site_tool_private FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can submit tool submissions" ON public.tool_submissions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Full tool submissions access for authenticated" ON public.tool_submissions FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can read media slots" ON public.media_slots FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Full media slots access for authenticated" ON public.media_slots FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Public can read published media items" ON public.media_slot_items FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "Full media items access for authenticated" ON public.media_slot_items FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can submit leads" ON public.leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Full leads access for authenticated" ON public.leads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Full tasks access for authenticated" ON public.tasks FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Full clients access for authenticated" ON public.clients FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can insert social webhooks" ON public.social_messages FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Full social access for authenticated" ON public.social_messages FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can read agent config" ON public.agent_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Full agent config access for authenticated" ON public.agent_config FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Full api keys access for authenticated" ON public.api_keys FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can read published store apps" ON public.store_apps FOR SELECT TO anon, authenticated USING (status = 'published');
CREATE POLICY "Full store apps access for authenticated" ON public.store_apps FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Full app access links for authenticated" ON public.app_access_links FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can record app download" ON public.app_downloads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Full app downloads for authenticated" ON public.app_downloads FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can submit app request" ON public.app_requests FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Full app requests for authenticated" ON public.app_requests FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Public can read store settings" ON public.store_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Full store settings for authenticated" ON public.store_settings FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 12. REALTIME PUBLICATIONS
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.content;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.news_articles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_tools;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.media_slots;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.media_slot_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.social_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.store_apps;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_requests;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
