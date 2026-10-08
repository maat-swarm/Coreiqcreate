-- =========================================================================
-- CORE IQ CREATE // MEDIA SLOTS MIGRATION
-- Migration: 20261002_media_slots.sql
-- Description: Idempotent migration for Media Slots and Media Slot Items
-- =========================================================================

-- Enable pgcrypto for gen_random_uuid() if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Table: media_slots
CREATE TABLE IF NOT EXISTS public.media_slots (
  slot_key TEXT PRIMARY KEY,
  page TEXT NOT NULL,
  label TEXT NOT NULL,
  allowed_types TEXT[] NOT NULL,
  max_items INT NOT NULL,
  max_bytes BIGINT NOT NULL,
  aspect TEXT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Table: media_slot_items
CREATE TABLE IF NOT EXISTS public.media_slot_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_key TEXT NOT NULL REFERENCES public.media_slots(slot_key) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'url')),
  storage_path TEXT NULL,
  url TEXT NULL,
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

-- 3. Seed slots (Idempotent UPSERT)
INSERT INTO public.media_slots (slot_key, page, label, allowed_types, max_items, max_bytes, aspect)
VALUES
  ('home.showcase', 'home', 'Home showcase carousel', ARRAY['image'], 6, 307200, '16:9'),
  ('home.intro_video', 'home', 'Home intro video', ARRAY['video', 'url'], 1, 52428800, '16:9'),
  ('home.intro_poster', 'home', 'Home intro video poster', ARRAY['image'], 1, 307200, '16:9'),
  ('site.background', 'site', 'Site global background video', ARRAY['video', 'url'], 1, 52428800, '16:9'),
  ('site.background_poster', 'site', 'Site global background poster', ARRAY['image'], 1, 5242880, '16:9'),
  ('solutions.showcase', 'solutions', 'Solutions showcase carousel', ARRAY['image'], 6, 307200, '16:9'),
  ('apps.showcase', 'apps', 'Apps showcase carousel', ARRAY['image'], 6, 307200, '16:9'),
  ('learn.showcase', 'learn', 'Learn showcase carousel', ARRAY['image'], 6, 307200, '16:9'),
  ('tools.showcase', 'tools', 'Tools showcase carousel', ARRAY['image'], 6, 307200, '16:9'),
  ('about.showcase', 'about', 'About showcase carousel', ARRAY['image'], 6, 307200, '16:9')
ON CONFLICT (slot_key) DO UPDATE SET
  page = EXCLUDED.page,
  label = EXCLUDED.label,
  allowed_types = EXCLUDED.allowed_types,
  max_items = EXCLUDED.max_items,
  max_bytes = EXCLUDED.max_bytes,
  aspect = EXCLUDED.aspect,
  updated_at = timezone('utc'::text, now());

-- 4. Storage Bucket: media (public bucket for published assets)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];

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
END $$;

-- 5. Security & Row Level Security (RLS)
ALTER TABLE public.media_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_slot_items ENABLE ROW LEVEL SECURITY;

-- Revoke all excess privileges from public/anon/authenticated
REVOKE ALL ON public.media_slots FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.media_slot_items FROM PUBLIC, anon, authenticated;

-- Grant SELECT only to anon and authenticated
GRANT SELECT ON public.media_slots TO anon, authenticated;
GRANT SELECT ON public.media_slot_items TO anon, authenticated;

-- Grant ALL to service_role (used by Express backend with secret key)
GRANT ALL ON public.media_slots TO service_role;
GRANT ALL ON public.media_slot_items TO service_role;

-- Policies for media_slots
DROP POLICY IF EXISTS "anon_select_media_slots" ON public.media_slots;
CREATE POLICY "anon_select_media_slots"
  ON public.media_slots
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policies for media_slot_items: only published items readable by anon / authenticated
DROP POLICY IF EXISTS "anon_select_published_media_slot_items" ON public.media_slot_items;
CREATE POLICY "anon_select_published_media_slot_items"
  ON public.media_slot_items
  FOR SELECT
  TO anon, authenticated
  USING (published = true);

-- Service role policies (full CRUD bypass)
DROP POLICY IF EXISTS "service_role_all_media_slots" ON public.media_slots;
CREATE POLICY "service_role_all_media_slots"
  ON public.media_slots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "service_role_all_media_slot_items" ON public.media_slot_items;
CREATE POLICY "service_role_all_media_slot_items"
  ON public.media_slot_items
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
