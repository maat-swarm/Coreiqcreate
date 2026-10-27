-- =========================================================================
-- CORE IQ CREATE // SITE TOOLS, SUBMISSIONS & MA'ATVERSE MIGRATION
-- Migration: 20261022_site_tools_and_maatverse.sql
-- Description: Complete idempotent migration for site_tools, site_tool_private,
--              tool_submissions, private storage bucket, maatverse_sections,
--              maatverse_entries, RLS policies, and seed data.
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. SITE_TOOLS TABLE
CREATE TABLE IF NOT EXISTS public.site_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Writing',
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  launch_type TEXT NOT NULL DEFAULT 'coming_soon' CHECK (launch_type IN ('link', 'download', 'payment', 'in_app', 'coming_soon', 'inline')),
  launch_url TEXT,
  cta_label TEXT NOT NULL DEFAULT 'Open',
  image_url TEXT,
  image_path TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 100,
  origin TEXT NOT NULL DEFAULT 'coreiq' CHECK (origin IN ('coreiq', 'opensource')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Phase 2 new columns on site_tools
ALTER TABLE public.site_tools ADD COLUMN IF NOT EXISTS is_paid BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.site_tools ADD COLUMN IF NOT EXISTS price_amount NUMERIC;
ALTER TABLE public.site_tools ADD COLUMN IF NOT EXISTS price_currency TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE public.site_tools ADD COLUMN IF NOT EXISTS form_schema JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.site_tools ADD COLUMN IF NOT EXISTS is_mock BOOLEAN NOT NULL DEFAULT false;

-- Allow launch_type 'in_app' in existing constraints if previously restricted
DO $$
BEGIN
  ALTER TABLE public.site_tools DROP CONSTRAINT IF EXISTS site_tools_launch_type_check;
  ALTER TABLE public.site_tools ADD CONSTRAINT site_tools_launch_type_check 
    CHECK (launch_type IN ('link', 'download', 'payment', 'in_app', 'coming_soon', 'inline'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS site_tools_public_idx ON public.site_tools (status, sort_order);
CREATE INDEX IF NOT EXISTS site_tools_slug_idx ON public.site_tools (slug);

-- 2. SITE_TOOL_PRIVATE TABLE
CREATE TABLE IF NOT EXISTS public.site_tool_private (
  tool_id UUID PRIMARY KEY REFERENCES public.site_tools(id) ON DELETE CASCADE,
  launch_url TEXT,
  payment_url TEXT,
  download_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TOOL_SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS public.tool_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES public.site_tools(id) ON DELETE SET NULL,
  tool_slug TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_paths TEXT[] NOT NULL DEFAULT '{}'::text[],
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'awaiting_payment', 'paid', 'delivered', 'cancelled')),
  payment_status TEXT NOT NULL DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'paid')),
  amount_due NUMERIC,
  operator_notes TEXT NOT NULL DEFAULT '',
  deliverable_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tool_submissions_status_idx ON public.tool_submissions (status, created_at DESC);
CREATE INDEX IF NOT EXISTS tool_submissions_tool_idx ON public.tool_submissions (tool_id);

-- 4. PRIVATE STORAGE BUCKET: tool-submissions
INSERT INTO storage.buckets (id, name, public)
VALUES ('tool-submissions', 'tool-submissions', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Ensure media bucket exists for tools images
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for tool-submissions (service_role only, no anon access)
DO $$
BEGIN
  DROP POLICY IF EXISTS "tool_submissions_bucket_service_role" ON storage.objects;
  CREATE POLICY "tool_submissions_bucket_service_role" ON storage.objects
    FOR ALL TO service_role
    USING (bucket_id = 'tool-submissions')
    WITH CHECK (bucket_id = 'tool-submissions');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 5. MA'ATVERSE SECTIONS & ENTRIES
CREATE TABLE IF NOT EXISTS public.maatverse_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  blurb TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'opening_soon' CHECK (status IN ('opening_soon', 'live')),
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_mock BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.maatverse_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_slug TEXT NOT NULL REFERENCES public.maatverse_sections(slug) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'entry' CHECK (kind IN ('entry', 'character', 'video', 'download', 'comic')),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body_md TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  external_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_mock BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT maatverse_entries_section_slug_unique UNIQUE (section_slug, slug)
);

CREATE INDEX IF NOT EXISTS maatverse_sections_sort_idx ON public.maatverse_sections (status, sort_order);
CREATE INDEX IF NOT EXISTS maatverse_entries_sort_idx ON public.maatverse_entries (section_slug, status, sort_order);

-- 6. ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.site_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_tool_private ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maatverse_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maatverse_entries ENABLE ROW LEVEL SECURITY;

-- site_tools: anon can read published only; service_role can do all
DROP POLICY IF EXISTS "site_tools_anon_read_published" ON public.site_tools;
CREATE POLICY "site_tools_anon_read_published" ON public.site_tools
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "site_tools_service_role_all" ON public.site_tools;
CREATE POLICY "site_tools_service_role_all" ON public.site_tools
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- site_tool_private: strictly NO anon policy. Service role only.
DROP POLICY IF EXISTS "site_tool_private_anon_deny" ON public.site_tool_private;
DROP POLICY IF EXISTS "site_tool_private_service_role_all" ON public.site_tool_private;
CREATE POLICY "site_tool_private_service_role_all" ON public.site_tool_private
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- tool_submissions: strictly NO anon policy. Service role only.
DROP POLICY IF EXISTS "tool_submissions_anon_deny" ON public.tool_submissions;
DROP POLICY IF EXISTS "tool_submissions_service_role_all" ON public.tool_submissions;
CREATE POLICY "tool_submissions_service_role_all" ON public.tool_submissions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- maatverse_sections: anon can read live only; service_role can do all
DROP POLICY IF EXISTS "maatverse_sections_anon_read_live" ON public.maatverse_sections;
CREATE POLICY "maatverse_sections_anon_read_live" ON public.maatverse_sections
  FOR SELECT TO anon, authenticated
  USING (status = 'live');

DROP POLICY IF EXISTS "maatverse_sections_service_role_all" ON public.maatverse_sections;
CREATE POLICY "maatverse_sections_service_role_all" ON public.maatverse_sections
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- maatverse_entries: anon can read published only; service_role can do all
DROP POLICY IF EXISTS "maatverse_entries_anon_read_published" ON public.maatverse_entries;
CREATE POLICY "maatverse_entries_anon_read_published" ON public.maatverse_entries
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "maatverse_entries_service_role_all" ON public.maatverse_entries;
CREATE POLICY "maatverse_entries_service_role_all" ON public.maatverse_entries
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- 7. ENSURE MA'ATVERSE AND TOOLS MEDIA SLOTS EXIST
INSERT INTO public.media_slots (slot_key, page, label, allowed_types, max_items, max_bytes, aspect)
VALUES
  ('tools.maatverse.banner', 'tools', 'Tools Maatverse Banner', ARRAY['image', 'video'], 1, 52428800, '8:3'),
  ('tools.maatverse.mascot', 'tools', 'Tools Maatverse Mascot', ARRAY['image', 'video'], 1, 52428800, '4:5'),
  ('tools.page.background', 'tools', 'Tools Page Background', ARRAY['image', 'video'], 1, 52428800, '16:9'),
  ('maatverse.page.background', 'maatverse', 'Maatverse Page Background', ARRAY['image', 'video'], 1, 52428800, '16:9')
ON CONFLICT (slot_key) DO NOTHING;

-- 8. SEED DATA: 12 PLACEHOLDER TOOLS (is_mock = true, launch_type = 'coming_soon', status = 'published')
INSERT INTO public.site_tools (
  id, slug, name, tagline, description, category, tier, launch_type, cta_label, featured, sort_order, origin, status, is_mock, is_paid
) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'prompt-enhancer', 'Prompt Enhancer', 'Transform vague ideas into structured, high-leverage prompts that unlock superior model intelligence.', 'Turn vague ideas into structured, high-leverage prompts that unlock superior model intelligence across any LLM.', 'Writing', 'free', 'coming_soon', 'Open', true, 1, 'coreiq', 'published', true, false),
  ('b0000001-0000-0000-0000-000000000002', 'headline-generator', 'Headline Generator', 'Craft high-converting hooks, titles, and editorial headlines tailored to your specific audience.', 'Generate calibrated hooks, editorial titles, and engagement variants proven across web platforms.', 'Writing', 'free', 'coming_soon', 'Open', true, 2, 'coreiq', 'published', true, false),
  ('b0000001-0000-0000-0000-000000000003', 'image-prompt-builder', 'Image Prompt Builder', 'Construct detailed photographic and artistic prompts with camera lens, lighting, and composition tokens.', 'Assemble studio-grade photographic tokens, camera optics, cinematic lighting, and negative prompts.', 'Images', 'free', 'coming_soon', 'Open', true, 3, 'coreiq', 'published', true, false),
  ('b0000001-0000-0000-0000-000000000004', 'code-explainer', 'Code Explainer', 'Break down complex algorithms, legacy repositories, or unfamiliar syntax into clear mental models.', 'Deconstruct complex functions, AST trees, and legacy codebases into concise mental models.', 'Code', 'pro', 'coming_soon', 'Open', false, 4, 'coreiq', 'published', true, false),
  ('b0000001-0000-0000-0000-000000000005', 'data-formatter', 'Data Formatter', 'Instantly convert messy CSV, JSON, markdown tables, and unstructured text into clean schemas.', 'Normalize malformed JSON, dirty CSVs, and semi-structured reports into typed relational schemas.', 'Data', 'free', 'coming_soon', 'Open', false, 5, 'coreiq', 'published', true, false),
  ('b0000001-0000-0000-0000-000000000006', 'regex-builder', 'Regex Builder', 'Explain, construct, and validate regular expressions with test pattern evaluation and edge-case flags.', 'Construct pattern matchers and regex expressions with real-time test harnesses and boundary flags.', 'Code', 'pro', 'coming_soon', 'Open', false, 6, 'coreiq', 'published', true, false),
  ('b0000001-0000-0000-0000-000000000007', 'meeting-summarizer', 'Meeting Summarizer', 'Condense audio transcripts or discussion notes into executive decisions, blockers, and next actions.', 'Distill transcripts into executive briefs, action items with owners, and verified milestone blockers.', 'Business', 'free', 'coming_soon', 'Open', false, 7, 'coreiq', 'published', true, false),
  ('b0000001-0000-0000-0000-000000000008', 'workflow-mapper', 'Workflow Mapper', 'Map operational bottlenecks and generate autonomous trigger-action execution diagrams.', 'Generate flow diagrams, failover loops, and event-driven automation topologies.', 'Automation', 'pro', 'coming_soon', 'Open', false, 8, 'coreiq', 'published', true, false),
  ('b0000001-0000-0000-0000-000000000009', 'image-generator', 'Image Generator', 'Generate high-resolution visual assets and neural art with FLUX and SDXL.', 'Generate high-resolution visual assets and neural art with open diffusion backends.', 'Images', 'free', 'coming_soon', 'Open', false, 9, 'opensource', 'published', true, false),
  ('b0000001-0000-0000-0000-000000000010', 'music-generator', 'Music Generator', 'Create atmospheric tracks, ambient soundscapes, and procedural audio stems.', 'Create atmospheric tracks, ambient soundscapes, and procedural audio stems.', 'Audio', 'free', 'coming_soon', 'Open', false, 10, 'opensource', 'published', true, false),
  ('b0000001-0000-0000-0000-000000000011', 'research-assistant', 'Research Assistant', 'Autonomous deep research agent synthesizes citations and executive dossiers.', 'Autonomous deep research agent synthesizes citations and executive dossiers.', 'Business', 'free', 'coming_soon', 'Open', false, 11, 'coreiq', 'published', true, false),
  ('b0000001-0000-0000-0000-000000000012', 'brief-generator', 'Brief Generator', 'Turn raw project requirements into structured architecture milestones and execution specs.', 'Turn raw project requirements into structured architecture milestones and execution specs.', 'Business', 'free', 'coming_soon', 'Open', false, 12, 'coreiq', 'published', true, false)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  tier = EXCLUDED.tier,
  launch_type = EXCLUDED.launch_type,
  cta_label = EXCLUDED.cta_label,
  featured = EXCLUDED.featured,
  sort_order = EXCLUDED.sort_order,
  origin = EXCLUDED.origin,
  status = EXCLUDED.status,
  is_mock = EXCLUDED.is_mock;

-- 9. SEED DATA: 5 MA'ATVERSE SECTIONS & 2 ENTRIES PER SECTION (all is_mock = true)
INSERT INTO public.maatverse_sections (slug, title, blurb, status, sort_order, is_mock)
VALUES
  ('the-builders', 'The Builders', 'The creators and visionaries constructing systems across the Ma''atverse.', 'live', 1, true),
  ('the-lore', 'The Lore', 'Foundational histories, chronicles, and principles governing the Ma''atverse.', 'live', 2, true),
  ('comics', 'Comics', 'Visual graphic narratives exploring agents, worlds, and frontier horizons.', 'live', 3, true),
  ('downloads-and-skins', 'Downloads and Skins', 'Visual interfaces, themes, custom wallpapers, and companion assets.', 'live', 4, true),
  ('videos', 'Videos', 'Cinematic reels, architectural dispatches, and recorded transmissions.', 'live', 5, true)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  blurb = EXCLUDED.blurb,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  is_mock = EXCLUDED.is_mock;

INSERT INTO public.maatverse_entries (
  section_slug, kind, title, slug, summary, body_md, status, sort_order, is_mock
) VALUES
  ('the-builders', 'character', 'Architect Zero', 'architect-zero', 'The primordial builder of neural structures. Sample entry. Replace this in Command > Ma''atverse.', 'Sample entry. Replace this in Command > Ma''atverse.', 'published', 1, true),
  ('the-builders', 'entry', 'The Swarm Guild', 'the-swarm-guild', 'Collective of autonomous agents coordinating venture infrastructure. Sample entry. Replace this in Command > Ma''atverse.', 'Sample entry. Replace this in Command > Ma''atverse.', 'published', 2, true),
  ('the-lore', 'entry', 'The Origin Transmission', 'the-origin-transmission', 'The first signal recorded across the matrix. Sample entry. Replace this in Command > Ma''atverse.', 'Sample entry. Replace this in Command > Ma''atverse.', 'published', 1, true),
  ('the-lore', 'entry', 'Principles of Equilibrium', 'principles-of-equilibrium', 'Core tenet balance of intelligence and purpose. Sample entry. Replace this in Command > Ma''atverse.', 'Sample entry. Replace this in Command > Ma''atverse.', 'published', 2, true),
  ('comics', 'comic', 'Chronicle Episode 1', 'chronicle-episode-1', 'Visual issue exploring the genesis epoch. Sample entry. Replace this in Command > Ma''atverse.', 'Sample entry. Replace this in Command > Ma''atverse.', 'published', 1, true),
  ('comics', 'comic', 'Chronicle Episode 2', 'chronicle-episode-2', 'The convergence of nodes. Sample entry. Replace this in Command > Ma''atverse.', 'Sample entry. Replace this in Command > Ma''atverse.', 'published', 2, true),
  ('downloads-and-skins', 'download', 'Ma''at Sentinel Wallpaper Pack', 'sentinel-wallpaper-pack', '4K atmospheric displays. Sample entry. Replace this in Command > Ma''atverse.', 'Sample entry. Replace this in Command > Ma''atverse.', 'published', 1, true),
  ('downloads-and-skins', 'download', 'Terminal Glyph HUD Theme', 'terminal-glyph-hud-theme', 'Custom color theme and palette assets. Sample entry. Replace this in Command > Ma''atverse.', 'Sample entry. Replace this in Command > Ma''atverse.', 'published', 2, true),
  ('videos', 'video', 'Epoch Overview Transmission', 'epoch-overview-transmission', 'Introductory overview dispatch. Sample entry. Replace this in Command > Ma''atverse.', 'Sample entry. Replace this in Command > Ma''atverse.', 'published', 1, true),
  ('videos', 'video', 'Core Synthesis Demo', 'core-synthesis-demo', 'Visualized execution stream. Sample entry. Replace this in Command > Ma''atverse.', 'Sample entry. Replace this in Command > Ma''atverse.', 'published', 2, true)
ON CONFLICT (section_slug, slug) DO UPDATE SET
  title = EXCLUDED.title,
  kind = EXCLUDED.kind,
  summary = EXCLUDED.summary,
  body_md = EXCLUDED.body_md,
  status = EXCLUDED.status,
  sort_order = EXCLUDED.sort_order,
  is_mock = EXCLUDED.is_mock;

-- 10. NOTIFY POSTGREST TO RELOAD SCHEMA CACHE
NOTIFY pgrst, 'reload schema';
