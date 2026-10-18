-- =========================================================================
-- CORE IQ CREATE // SITE TOOLS & MA'ATVERSE SLOTS MIGRATION
-- Migration: 20261018_site_tools.sql
-- Description: Idempotent migration for public.site_tools and new media slots
-- =========================================================================

create table if not exists public.site_tools (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  tagline text not null default '',
  description text not null default '',
  category text not null default 'Writing',
  tier text not null default 'free' check (tier in ('free','pro')),
  status text not null default 'draft' check (status in ('draft','published')),
  launch_type text not null default 'coming_soon' check (launch_type in ('link','download','payment','inline','coming_soon')),
  launch_url text,
  cta_label text not null default 'Open',
  image_url text,
  image_path text,
  featured boolean not null default false,
  sort_order integer not null default 100,
  origin text not null default 'coreiq' check (origin in ('coreiq','opensource')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists site_tools_public_idx on public.site_tools (status, sort_order);
alter table public.site_tools enable row level security;
revoke all on public.site_tools from anon, authenticated;
-- No policies on purpose: the table is reachable only through the server (service role).

-- Idempotent inserts for the FOUR new media slots
INSERT INTO public.media_slots (slot_key, page, label, allowed_types, max_items, max_bytes, aspect)
VALUES
  ('tools.maatverse.banner', 'tools', 'Tools Maatverse Banner', ARRAY['image', 'video'], 1, 52428800, '8:3'),
  ('tools.maatverse.mascot', 'tools', 'Tools Maatverse Mascot', ARRAY['image', 'video'], 1, 52428800, '4:5'),
  ('tools.page.background', 'tools', 'Tools Page Background', ARRAY['image', 'video'], 1, 52428800, '16:9'),
  ('maatverse.page.background', 'maatverse', 'Maatverse Page Background', ARRAY['image', 'video'], 1, 52428800, '16:9')
ON CONFLICT (slot_key) DO NOTHING;
