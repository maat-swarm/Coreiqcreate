-- =========================================================================
-- CORE IQ CREATE // PRODUCTION MEDIA SLOTS & STORAGE INFRASTRUCTURE
-- Migration: 20261105_media_slots_complete.sql
-- Description: Idempotent definition of media_slots, media_slot_items,
--              storage bucket 'media', RLS policies, indexes, and full seed catalog.
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -------------------------------------------------------------------------
-- 1. TABLE: media_slots
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

-- Ensure backward-compatible id column exists (mirrors slot_key so queries with id or slot_key succeed)
ALTER TABLE public.media_slots ADD COLUMN IF NOT EXISTS id TEXT;
UPDATE public.media_slots SET id = slot_key WHERE id IS NULL;

-- -------------------------------------------------------------------------
-- 2. TABLE: media_slot_items
-- -------------------------------------------------------------------------
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

-- Backward-compatible columns & constraint updates
ALTER TABLE public.media_slot_items ADD COLUMN IF NOT EXISTS poster_url TEXT;

DO $$
BEGIN
  ALTER TABLE public.media_slot_items DROP CONSTRAINT IF EXISTS media_slot_items_type_check;
  ALTER TABLE public.media_slot_items ADD CONSTRAINT media_slot_items_type_check 
    CHECK (type IN ('image', 'video', 'url', 'file'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- -------------------------------------------------------------------------
-- 3. INDEXES
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_media_slots_page ON public.media_slots(page);
CREATE INDEX IF NOT EXISTS idx_media_slot_items_slot_key ON public.media_slot_items(slot_key);
CREATE INDEX IF NOT EXISTS idx_media_slot_items_published ON public.media_slot_items(slot_key, published, sort_order);

-- -------------------------------------------------------------------------
-- 4. SEED MEDIA SLOTS (Full Operational Catalog - 23 Slots)
-- -------------------------------------------------------------------------
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

-- -------------------------------------------------------------------------
-- 5. STORAGE BUCKET: media
-- -------------------------------------------------------------------------
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

-- Storage bucket access policies
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
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------------------
ALTER TABLE public.media_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_slot_items ENABLE ROW LEVEL SECURITY;

-- media_slots: Public read, operator full management
DROP POLICY IF EXISTS "Public can read media slots" ON public.media_slots;
CREATE POLICY "Public can read media slots"
  ON public.media_slots
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated operators have full media slots access" ON public.media_slots;
CREATE POLICY "Authenticated operators have full media slots access"
  ON public.media_slots
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- media_slot_items: Public read published only, operator full management
DROP POLICY IF EXISTS "Public can read published media slot items" ON public.media_slot_items;
CREATE POLICY "Public can read published media slot items"
  ON public.media_slot_items
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

DROP POLICY IF EXISTS "Authenticated operators have full media slot items access" ON public.media_slot_items;
CREATE POLICY "Authenticated operators have full media slot items access"
  ON public.media_slot_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- -------------------------------------------------------------------------
-- 7. REALTIME REPLICATION
-- -------------------------------------------------------------------------
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.media_slots;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.media_slot_items;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
