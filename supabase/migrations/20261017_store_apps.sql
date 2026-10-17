-- =========================================================================
-- CORE IQ CREATE // APP STORE SCHEMA MIGRATION
-- Migration: 20261017_store_apps.sql
-- Description: Idempotent table definitions, column alignment, and RLS
-- policies for store_apps and associated store tables.
-- =========================================================================

-- 1. store_apps table
CREATE TABLE IF NOT EXISTS public.store_apps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Productivity',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'coming_soon', 'archived')),
  price_mode TEXT NOT NULL DEFAULT 'free' CHECK (price_mode IN ('free', 'paid', 'contact')),
  price_amount NUMERIC NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  price_note TEXT NOT NULL DEFAULT '',
  payment_label TEXT NOT NULL DEFAULT '',
  payment_url TEXT NOT NULL DEFAULT '',
  payment_instructions TEXT NOT NULL DEFAULT '',
  distribution_type TEXT NOT NULL DEFAULT 'link' CHECK (distribution_type IN ('download', 'link', 'access', 'custom', 'web', 'file', 'store', 'external')),
  requires_email BOOLEAN NOT NULL DEFAULT false,
  has_file BOOLEAN NOT NULL DEFAULT false,
  app_url TEXT NOT NULL DEFAULT '',
  external_url TEXT NOT NULL DEFAULT '',
  file_path TEXT NULL,
  file_name TEXT NULL,
  file_size_bytes BIGINT NULL,
  sha256 TEXT NULL,
  icon_url TEXT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Sparkles',
  accent_color TEXT NOT NULL DEFAULT '#06b6d4',
  screenshots JSONB NOT NULL DEFAULT '[]'::jsonb,
  version TEXT NOT NULL DEFAULT '1.0.0',
  changelog TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Safely add any columns that may be missing if store_apps was pre-created manually
DO $$ BEGIN
  -- created_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'created_at') THEN
    ALTER TABLE public.store_apps ADD COLUMN created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
    UPDATE public.store_apps SET created_at = COALESCE(updated_at, timezone('utc'::text, now())) WHERE created_at IS NULL;
    ALTER TABLE public.store_apps ALTER COLUMN created_at SET NOT NULL;
  END IF;

  -- updated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'updated_at') THEN
    ALTER TABLE public.store_apps ADD COLUMN updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());
  END IF;

  -- file_path
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'file_path') THEN
    ALTER TABLE public.store_apps ADD COLUMN file_path TEXT NULL;
  END IF;

  -- file_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'file_name') THEN
    ALTER TABLE public.store_apps ADD COLUMN file_name TEXT NULL;
  END IF;

  -- file_size_bytes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'file_size_bytes') THEN
    ALTER TABLE public.store_apps ADD COLUMN file_size_bytes BIGINT NULL;
  END IF;

  -- sha256
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'sha256') THEN
    ALTER TABLE public.store_apps ADD COLUMN sha256 TEXT NULL;
  END IF;

  -- external_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'external_url') THEN
    ALTER TABLE public.store_apps ADD COLUMN external_url TEXT DEFAULT '';
  END IF;

  -- app_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'app_url') THEN
    ALTER TABLE public.store_apps ADD COLUMN app_url TEXT DEFAULT '';
  END IF;

  -- requires_email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'requires_email') THEN
    ALTER TABLE public.store_apps ADD COLUMN requires_email BOOLEAN DEFAULT false;
  END IF;

  -- has_file
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'has_file') THEN
    ALTER TABLE public.store_apps ADD COLUMN has_file BOOLEAN DEFAULT false;
  END IF;

  -- screenshots
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'screenshots') THEN
    ALTER TABLE public.store_apps ADD COLUMN screenshots JSONB DEFAULT '[]'::jsonb;
  END IF;

  -- payment_label
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'payment_label') THEN
    ALTER TABLE public.store_apps ADD COLUMN payment_label TEXT DEFAULT '';
  END IF;

  -- payment_url
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'payment_url') THEN
    ALTER TABLE public.store_apps ADD COLUMN payment_url TEXT DEFAULT '';
  END IF;

  -- payment_instructions
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'payment_instructions') THEN
    ALTER TABLE public.store_apps ADD COLUMN payment_instructions TEXT DEFAULT '';
  END IF;

  -- price_note
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'price_note') THEN
    ALTER TABLE public.store_apps ADD COLUMN price_note TEXT DEFAULT '';
  END IF;

  -- version
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'version') THEN
    ALTER TABLE public.store_apps ADD COLUMN version TEXT DEFAULT '1.0.0';
  END IF;

  -- changelog
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'changelog') THEN
    ALTER TABLE public.store_apps ADD COLUMN changelog TEXT DEFAULT '';
  END IF;

  -- sort_order
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'sort_order') THEN
    ALTER TABLE public.store_apps ADD COLUMN sort_order INT DEFAULT 0;
  END IF;

  -- featured
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'featured') THEN
    ALTER TABLE public.store_apps ADD COLUMN featured BOOLEAN DEFAULT false;
  END IF;

  -- icon_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'icon_name') THEN
    ALTER TABLE public.store_apps ADD COLUMN icon_name TEXT DEFAULT 'Sparkles';
  END IF;

  -- accent_color
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'store_apps' AND column_name = 'accent_color') THEN
    ALTER TABLE public.store_apps ADD COLUMN accent_color TEXT DEFAULT '#06b6d4';
  END IF;
END $$;

-- RLS policies for store_apps
ALTER TABLE public.store_apps ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read published store apps' AND tablename = 'store_apps') THEN
    CREATE POLICY "Public read published store apps" ON public.store_apps
      FOR SELECT TO public USING (status IN ('published', 'coming_soon'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manage store apps' AND tablename = 'store_apps') THEN
    CREATE POLICY "Service role manage store apps" ON public.store_apps
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth manage store apps' AND tablename = 'store_apps') THEN
    CREATE POLICY "Auth manage store apps" ON public.store_apps
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 2. app_access_links table
CREATE TABLE IF NOT EXISTS public.app_access_links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  app_id TEXT NOT NULL,
  note TEXT DEFAULT '',
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INT DEFAULT 1,
  use_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_access_links ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manage app_access_links' AND tablename = 'app_access_links') THEN
    CREATE POLICY "Service role manage app_access_links" ON public.app_access_links
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth manage app_access_links' AND tablename = 'app_access_links') THEN
    CREATE POLICY "Auth manage app_access_links" ON public.app_access_links
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. app_requests table
CREATE TABLE IF NOT EXISTS public.app_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  app_id TEXT NULL,
  user_email TEXT NOT NULL,
  user_name TEXT DEFAULT '',
  message TEXT DEFAULT '',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')),
  admin_note TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.app_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public insert app_requests' AND tablename = 'app_requests') THEN
    CREATE POLICY "Public insert app_requests" ON public.app_requests
      FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manage app_requests' AND tablename = 'app_requests') THEN
    CREATE POLICY "Service role manage app_requests" ON public.app_requests
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth manage app_requests' AND tablename = 'app_requests') THEN
    CREATE POLICY "Auth manage app_requests" ON public.app_requests
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 4. store_settings table
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  heading TEXT DEFAULT '',
  default_instructions TEXT DEFAULT '',
  default_currency TEXT DEFAULT 'USD',
  methods JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public read store_settings' AND tablename = 'store_settings') THEN
    CREATE POLICY "Public read store_settings" ON public.store_settings
      FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manage store_settings' AND tablename = 'store_settings') THEN
    CREATE POLICY "Service role manage store_settings" ON public.store_settings
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth manage store_settings' AND tablename = 'store_settings') THEN
    CREATE POLICY "Auth manage store_settings" ON public.store_settings
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 5. app_downloads table
CREATE TABLE IF NOT EXISTS public.app_downloads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  app_id TEXT NOT NULL,
  access_link_id TEXT NULL,
  ip_hash TEXT NOT NULL,
  user_agent TEXT DEFAULT '',
  downloaded_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_email TEXT DEFAULT ''
);

ALTER TABLE public.app_downloads ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public insert app_downloads' AND tablename = 'app_downloads') THEN
    CREATE POLICY "Public insert app_downloads" ON public.app_downloads
      FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service role manage app_downloads' AND tablename = 'app_downloads') THEN
    CREATE POLICY "Service role manage app_downloads" ON public.app_downloads
      FOR ALL TO service_role USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth manage app_downloads' AND tablename = 'app_downloads') THEN
    CREATE POLICY "Auth manage app_downloads" ON public.app_downloads
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
END $$;
