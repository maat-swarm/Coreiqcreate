-- =========================================================================
-- CORE IQ CREATE // USE CASES STORAGE BUCKET MIGRATION
-- Migration: 20261011_use_cases_storage.sql
-- Description: Ensures use-cases bucket exists, is public, and has public read RLS policy
-- =========================================================================

-- 1. Create or update storage bucket 'use-cases'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'use-cases',
  'use-cases',
  true,
  52428800,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf', 'application/zip']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf', 'application/zip'];

-- 2. Storage bucket access policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access Use Cases Bucket'
  ) THEN
    CREATE POLICY "Public Access Use Cases Bucket"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'use-cases');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Service Role All Use Cases Bucket'
  ) THEN
    CREATE POLICY "Service Role All Use Cases Bucket"
      ON storage.objects FOR ALL
      TO service_role
      USING (bucket_id = 'use-cases')
      WITH CHECK (bucket_id = 'use-cases');
  END IF;
END $$;
