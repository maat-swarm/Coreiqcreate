-- =============================================================================
-- Migration: 20261028_site_visits.sql
-- Description: First-party, privacy-preserving visitor tracking for CoreIQ Create.
-- No IP addresses, no personal names, no cookies.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.site_visits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  visitor_id text NOT NULL,
  path text NOT NULL,
  referrer_domain text,
  device_type text
);

-- Optimize analytics query lookups for recent intervals and unique visitor counts
CREATE INDEX IF NOT EXISTS idx_site_visits_created_at ON public.site_visits (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_visits_visitor_id ON public.site_visits (visitor_id);
CREATE INDEX IF NOT EXISTS idx_site_visits_path ON public.site_visits (path);

-- Enable Row Level Security (RLS)
ALTER TABLE public.site_visits ENABLE ROW LEVEL SECURITY;

-- 1. Public / Anon can INSERT new page views
DROP POLICY IF EXISTS "Anon can insert site visits" ON public.site_visits;
CREATE POLICY "Anon can insert site visits"
  ON public.site_visits
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- 2. Anon CANNOT select or read site visits (denied by default, authenticated operators only)
DROP POLICY IF EXISTS "Operators can select site visits" ON public.site_visits;
CREATE POLICY "Operators can select site visits"
  ON public.site_visits
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Operators can delete or prune site visits
DROP POLICY IF EXISTS "Operators can delete site visits" ON public.site_visits;
CREATE POLICY "Operators can delete site visits"
  ON public.site_visits
  FOR DELETE
  TO authenticated
  USING (true);

-- Realtime replication hook for live dashboard updates
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_visits;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
