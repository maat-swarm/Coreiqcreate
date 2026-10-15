-- =========================================================================
-- CORE IQ CREATE // LEARN MEDIA SLOTS MIGRATION
-- Migration: 20261015_learn_media_slots.sql
-- Description: Idempotent addition of 7 Learn media slots (videos and PDF guides)
-- =========================================================================

INSERT INTO public.media_slots (slot_key, page, label, allowed_types, max_items, max_bytes, aspect)
VALUES
  ('learn.lesson_of_week', 'learn', 'Lesson of the Week', ARRAY['video', 'url'], 1, 209715200, '16:9'),
  ('learn.step1.video', 'learn', 'Step 1 Video', ARRAY['video'], 1, 209715200, '16:9'),
  ('learn.step2.video', 'learn', 'Step 2 Video', ARRAY['video'], 1, 209715200, '16:9'),
  ('learn.step3.video', 'learn', 'Step 3 Video', ARRAY['video'], 1, 209715200, '16:9'),
  ('learn.step1.pdf', 'learn', 'Step 1 PDF Guide', ARRAY['file'], 1, 20971520, NULL),
  ('learn.step2.pdf', 'learn', 'Step 2 PDF Guide', ARRAY['file'], 1, 20971520, NULL),
  ('learn.step3.pdf', 'learn', 'Step 3 PDF Guide', ARRAY['file'], 1, 20971520, NULL)
ON CONFLICT (slot_key) DO UPDATE SET
  page = EXCLUDED.page,
  label = EXCLUDED.label,
  allowed_types = EXCLUDED.allowed_types,
  max_items = EXCLUDED.max_items,
  max_bytes = EXCLUDED.max_bytes,
  aspect = EXCLUDED.aspect,
  updated_at = timezone('utc'::text, now());
