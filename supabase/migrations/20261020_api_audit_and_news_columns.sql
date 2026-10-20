-- =========================================================================
-- CORE IQ CREATE // API AUDIT LOG & NEWS COLUMN EXTENSIONS
-- =========================================================================

-- 1. api_audit table
CREATE TABLE IF NOT EXISTS public.api_audit (
    id TEXT PRIMARY KEY,
    key_id TEXT NOT NULL,
    key_name TEXT NOT NULL,
    route TEXT NOT NULL,
    method TEXT NOT NULL,
    resource_id TEXT,
    status INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.api_audit ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated operators can read api_audit" ON public.api_audit;
CREATE POLICY "Authenticated operators can read api_audit" ON public.api_audit
    FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role can manage api_audit" ON public.api_audit;
CREATE POLICY "Service role can manage api_audit" ON public.api_audit
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 2. Extended nullable news columns
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS url_key TEXT;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS issue_date TIMESTAMPTZ;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT 0;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS is_lead BOOLEAN DEFAULT false;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.news_articles ADD COLUMN IF NOT EXISTS source_name TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_url_key ON public.news_articles (url_key) WHERE url_key IS NOT NULL;
