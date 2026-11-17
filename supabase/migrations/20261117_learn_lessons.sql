-- =========================================================================
-- CORE IQ CREATE // LEARN LESSONS
-- Migration: 20261117_learn_lessons.sql
-- Description: Table & RLS policies for data-driven /learn lessons
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.learn_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'AI Agents',
  video_url TEXT,
  poster_url TEXT,
  pdf_url TEXT,
  pdf_label TEXT,
  published BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_learn_lessons_published_order
  ON public.learn_lessons (published, sort_order, created_at);

ALTER TABLE public.learn_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read published lessons" ON public.learn_lessons;
CREATE POLICY "Public read published lessons"
  ON public.learn_lessons FOR SELECT
  USING (published = true);

DROP POLICY IF EXISTS "Service role full access" ON public.learn_lessons;
CREATE POLICY "Service role full access"
  ON public.learn_lessons FOR ALL
  USING (auth.role() = 'service_role');
