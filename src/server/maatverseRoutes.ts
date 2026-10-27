import { Express, Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import multer from 'multer';
import { MaatverseSectionItem, MaatverseEntryItem } from '../types/command';

export interface MaatverseDeps {
  authenticateApiKey: (req: Request, res: Response, next: NextFunction) => Promise<any>;
  requireScope: (...scopes: string[]) => (req: Request, res: Response, next: NextFunction) => any;
  adminSupabase: SupabaseClient | null;
  publicRateLimiter: (req: Request, res: Response, next: NextFunction) => any;
  localStore?: any;
}

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
});

export const SEED_MAATVERSE_SECTIONS: MaatverseSectionItem[] = [
  {
    id: 'm1000000-0000-0000-0000-000000000001',
    slug: 'the-builders',
    title: 'The Builders',
    blurb: 'The creators and visionaries constructing systems across the Ma\'atverse.',
    image_url: null,
    status: 'live',
    sort_order: 1,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm1000000-0000-0000-0000-000000000002',
    slug: 'the-lore',
    title: 'The Lore',
    blurb: 'Foundational histories, chronicles, and principles governing the Ma\'atverse.',
    image_url: null,
    status: 'live',
    sort_order: 2,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm1000000-0000-0000-0000-000000000003',
    slug: 'comics',
    title: 'Comics',
    blurb: 'Visual graphic narratives exploring agents, worlds, and frontier horizons.',
    image_url: null,
    status: 'live',
    sort_order: 3,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm1000000-0000-0000-0000-000000000004',
    slug: 'downloads-and-skins',
    title: 'Downloads and Skins',
    blurb: 'Visual interfaces, themes, custom wallpapers, and companion assets.',
    image_url: null,
    status: 'live',
    sort_order: 4,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'm1000000-0000-0000-0000-000000000005',
    slug: 'videos',
    title: 'Videos',
    blurb: 'Cinematic reels, architectural dispatches, and recorded transmissions.',
    image_url: null,
    status: 'live',
    sort_order: 5,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const SEED_MAATVERSE_ENTRIES: MaatverseEntryItem[] = [
  {
    id: 'e1000000-0000-0000-0000-000000000001',
    section_slug: 'the-builders',
    kind: 'character',
    title: 'Architect Zero',
    slug: 'architect-zero',
    summary: 'The primordial builder of neural structures. Sample entry. Replace this in Command > Ma\'atverse.',
    body_md: 'Sample entry. Replace this in Command > Ma\'atverse.',
    image_url: null,
    external_url: null,
    status: 'published',
    sort_order: 1,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e1000000-0000-0000-0000-000000000002',
    section_slug: 'the-builders',
    kind: 'entry',
    title: 'The Swarm Guild',
    slug: 'the-swarm-guild',
    summary: 'Collective of autonomous agents coordinating venture infrastructure. Sample entry. Replace this in Command > Ma\'atverse.',
    body_md: 'Sample entry. Replace this in Command > Ma\'atverse.',
    image_url: null,
    external_url: null,
    status: 'published',
    sort_order: 2,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e1000000-0000-0000-0000-000000000003',
    section_slug: 'the-lore',
    kind: 'entry',
    title: 'The Origin Transmission',
    slug: 'the-origin-transmission',
    summary: 'The first signal recorded across the matrix. Sample entry. Replace this in Command > Ma\'atverse.',
    body_md: 'Sample entry. Replace this in Command > Ma\'atverse.',
    image_url: null,
    external_url: null,
    status: 'published',
    sort_order: 1,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e1000000-0000-0000-0000-000000000004',
    section_slug: 'the-lore',
    kind: 'entry',
    title: 'Principles of Equilibrium',
    slug: 'principles-of-equilibrium',
    summary: 'Core tenet balance of intelligence and purpose. Sample entry. Replace this in Command > Ma\'atverse.',
    body_md: 'Sample entry. Replace this in Command > Ma\'atverse.',
    image_url: null,
    external_url: null,
    status: 'published',
    sort_order: 2,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e1000000-0000-0000-0000-000000000005',
    section_slug: 'comics',
    kind: 'comic',
    title: 'Chronicle Episode 1',
    slug: 'chronicle-episode-1',
    summary: 'Visual issue exploring the genesis epoch. Sample entry. Replace this in Command > Ma\'atverse.',
    body_md: 'Sample entry. Replace this in Command > Ma\'atverse.',
    image_url: null,
    external_url: null,
    status: 'published',
    sort_order: 1,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e1000000-0000-0000-0000-000000000006',
    section_slug: 'comics',
    kind: 'comic',
    title: 'Chronicle Episode 2',
    slug: 'chronicle-episode-2',
    summary: 'The convergence of nodes. Sample entry. Replace this in Command > Ma\'atverse.',
    body_md: 'Sample entry. Replace this in Command > Ma\'atverse.',
    image_url: null,
    external_url: null,
    status: 'published',
    sort_order: 2,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e1000000-0000-0000-0000-000000000007',
    section_slug: 'downloads-and-skins',
    kind: 'download',
    title: 'Ma\'at Sentinel Wallpaper Pack',
    slug: 'sentinel-wallpaper-pack',
    summary: '4K atmospheric displays. Sample entry. Replace this in Command > Ma\'atverse.',
    body_md: 'Sample entry. Replace this in Command > Ma\'atverse.',
    image_url: null,
    external_url: null,
    status: 'published',
    sort_order: 1,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e1000000-0000-0000-0000-000000000008',
    section_slug: 'downloads-and-skins',
    kind: 'download',
    title: 'Terminal Glyph HUD Theme',
    slug: 'terminal-glyph-hud-theme',
    summary: 'Custom color theme and palette assets. Sample entry. Replace this in Command > Ma\'atverse.',
    body_md: 'Sample entry. Replace this in Command > Ma\'atverse.',
    image_url: null,
    external_url: null,
    status: 'published',
    sort_order: 2,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e1000000-0000-0000-0000-000000000009',
    section_slug: 'videos',
    kind: 'video',
    title: 'Epoch Overview Transmission',
    slug: 'epoch-overview-transmission',
    summary: 'Introductory overview dispatch. Sample entry. Replace this in Command > Ma\'atverse.',
    body_md: 'Sample entry. Replace this in Command > Ma\'atverse.',
    image_url: null,
    external_url: null,
    status: 'published',
    sort_order: 1,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'e1000000-0000-0000-0000-000000000010',
    section_slug: 'videos',
    kind: 'video',
    title: 'Core Synthesis Demo',
    slug: 'core-synthesis-demo',
    summary: 'Visualized execution stream. Sample entry. Replace this in Command > Ma\'atverse.',
    body_md: 'Sample entry. Replace this in Command > Ma\'atverse.',
    image_url: null,
    external_url: null,
    status: 'published',
    sort_order: 2,
    is_mock: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function registerMaatverseRoutes(app: Express, deps: MaatverseDeps) {
  const { authenticateApiKey, requireScope, adminSupabase, publicRateLimiter, localStore } = deps;

  // Initialize localStore seeds if needed
  if (localStore) {
    if (!localStore.maatverse_sections || localStore.maatverse_sections.length === 0) {
      localStore.maatverse_sections = [...SEED_MAATVERSE_SECTIONS];
    }
    if (!localStore.maatverse_entries || localStore.maatverse_entries.length === 0) {
      localStore.maatverse_entries = [...SEED_MAATVERSE_ENTRIES];
    }
  }

  // ---------------------------------------------------------------------------
  // 1. PUBLIC: GET /api/v1/maatverse/sections (Live sections)
  // ---------------------------------------------------------------------------
  app.get('/api/v1/maatverse/sections', publicRateLimiter, async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=30');

    let sections: any[] = [];
    if (adminSupabase) {
      try {
        const { data, error } = await adminSupabase
          .from('maatverse_sections')
          .select('*')
          .order('sort_order', { ascending: true });
        if (!error && data) sections = data;
      } catch {}
    }
    if (!sections.length && localStore?.maatverse_sections) {
      sections = [...localStore.maatverse_sections];
    }

    return res.json({ sections });
  });

  // ---------------------------------------------------------------------------
  // 2. PUBLIC: GET /api/v1/maatverse/sections/:slug (Section with published entries)
  // ---------------------------------------------------------------------------
  app.get('/api/v1/maatverse/sections/:slug', publicRateLimiter, async (req: Request, res: Response) => {
    const { slug } = req.params;

    let section: any = null;
    let entries: any[] = [];

    if (adminSupabase) {
      try {
        const { data: sData } = await adminSupabase
          .from('maatverse_sections')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        if (sData) section = sData;

        const { data: eData } = await adminSupabase
          .from('maatverse_entries')
          .select('*')
          .eq('section_slug', slug)
          .eq('status', 'published')
          .order('sort_order', { ascending: true });
        if (eData) entries = eData;
      } catch {}
    }

    if (!section && localStore?.maatverse_sections) {
      section = localStore.maatverse_sections.find((s: any) => s.slug === slug) || null;
      entries = (localStore.maatverse_entries || []).filter(
        (e: any) => e.section_slug === slug && e.status === 'published'
      );
    }

    if (!section) {
      return res.status(404).json({ error: 'not_found', message: `Section '${slug}' not found.` });
    }

    return res.json({ section, entries });
  });

  // ---------------------------------------------------------------------------
  // 3. PUBLIC: GET /api/v1/maatverse/entries/:section_slug/:slug (Entry detail)
  // ---------------------------------------------------------------------------
  app.get('/api/v1/maatverse/entries/:section_slug/:slug', publicRateLimiter, async (req: Request, res: Response) => {
    const { section_slug, slug } = req.params;

    let entry: any = null;
    if (adminSupabase) {
      try {
        const { data } = await adminSupabase
          .from('maatverse_entries')
          .select('*')
          .eq('section_slug', section_slug)
          .eq('slug', slug)
          .eq('status', 'published')
          .maybeSingle();
        if (data) entry = data;
      } catch {}
    }

    if (!entry && localStore?.maatverse_entries) {
      entry = localStore.maatverse_entries.find(
        (e: any) => e.section_slug === section_slug && e.slug === slug && e.status === 'published'
      ) || null;
    }

    if (!entry) {
      return res.status(404).json({ error: 'not_found', message: `Entry '${slug}' not found in '${section_slug}'.` });
    }

    return res.json({ entry });
  });

  // ---------------------------------------------------------------------------
  // 4. OPERATOR: SECTIONS CRUD (READ_CONTENT / WRITE_CONTENT)
  // ---------------------------------------------------------------------------
  app.get('/api/v1/admin/maatverse/sections', authenticateApiKey, requireScope('READ_CONTENT'), async (req: Request, res: Response) => {
    let sections: any[] = [];
    if (adminSupabase) {
      try {
        const { data, error } = await adminSupabase
          .from('maatverse_sections')
          .select('*')
          .order('sort_order', { ascending: true });
        if (!error && data) sections = data;
      } catch {}
    }
    if (!sections.length && localStore?.maatverse_sections) {
      sections = [...localStore.maatverse_sections];
    }
    return res.json({ sections });
  });

  app.post('/api/v1/admin/maatverse/sections', authenticateApiKey, requireScope('WRITE_CONTENT'), async (req: Request, res: Response) => {
    const body = req.body || {};
    const title = String(body.title || '').trim();
    const slug = String(body.slug || '').trim().toLowerCase() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const blurb = String(body.blurb || '').trim();
    const image_url = body.image_url || null;
    const status = body.status === 'opening_soon' ? 'opening_soon' : 'live';
    const sort_order = Number.isInteger(Number(body.sort_order)) ? Number(body.sort_order) : 100;
    const is_mock = Boolean(body.is_mock);

    const newSection: MaatverseSectionItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `sec_${Date.now()}`,
      slug,
      title,
      blurb,
      image_url,
      status,
      sort_order,
      is_mock,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (adminSupabase) {
      try {
        await adminSupabase.from('maatverse_sections').insert([newSection]);
      } catch {}
    }

    if (!localStore.maatverse_sections) localStore.maatverse_sections = [];
    localStore.maatverse_sections.push(newSection);

    return res.status(201).json({ section: newSection });
  });

  app.patch('/api/v1/admin/maatverse/sections/:id', authenticateApiKey, requireScope('WRITE_CONTENT'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body || {};
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.slug !== undefined) updates.slug = String(body.slug).trim().toLowerCase();
    if (body.blurb !== undefined) updates.blurb = String(body.blurb).trim();
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.status !== undefined) updates.status = body.status;
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);
    if (body.is_mock !== undefined) updates.is_mock = Boolean(body.is_mock);

    if (adminSupabase) {
      try {
        await adminSupabase.from('maatverse_sections').update(updates).eq('id', id);
      } catch {}
    }

    if (localStore?.maatverse_sections) {
      const idx = localStore.maatverse_sections.findIndex((s: any) => s.id === id);
      if (idx !== -1) {
        localStore.maatverse_sections[idx] = { ...localStore.maatverse_sections[idx], ...updates };
      }
    }

    return res.json({ status: 'updated', id, updates });
  });

  app.delete('/api/v1/admin/maatverse/sections/:id', authenticateApiKey, requireScope('WRITE_CONTENT'), async (req: Request, res: Response) => {
    const { id } = req.params;

    if (adminSupabase) {
      try {
        await adminSupabase.from('maatverse_sections').delete().eq('id', id);
      } catch {}
    }

    if (localStore?.maatverse_sections) {
      localStore.maatverse_sections = localStore.maatverse_sections.filter((s: any) => s.id !== id);
    }

    return res.json({ status: 'deleted', id });
  });

  // ---------------------------------------------------------------------------
  // 5. OPERATOR: ENTRIES CRUD
  // ---------------------------------------------------------------------------
  app.get('/api/v1/admin/maatverse/entries', authenticateApiKey, requireScope('READ_CONTENT'), async (req: Request, res: Response) => {
    const sectionSlug = req.query.section_slug as string | undefined;

    let entries: any[] = [];
    if (adminSupabase) {
      try {
        let q = adminSupabase.from('maatverse_entries').select('*').order('sort_order', { ascending: true });
        if (sectionSlug) q = q.eq('section_slug', sectionSlug);
        const { data, error } = await q;
        if (!error && data) entries = data;
      } catch {}
    }
    if (!entries.length && localStore?.maatverse_entries) {
      entries = (localStore.maatverse_entries as MaatverseEntryItem[]).filter(
        (e) => !sectionSlug || e.section_slug === sectionSlug
      );
    }

    return res.json({ entries });
  });

  app.post('/api/v1/admin/maatverse/entries', authenticateApiKey, requireScope('WRITE_CONTENT'), async (req: Request, res: Response) => {
    const body = req.body || {};
    const title = String(body.title || '').trim();
    const section_slug = String(body.section_slug || 'the-builders').trim();
    const slug = String(body.slug || '').trim().toLowerCase() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const kind = ['entry', 'character', 'video', 'download', 'comic'].includes(body.kind) ? body.kind : 'entry';
    const summary = String(body.summary || '').trim();
    const body_md = String(body.body_md || '').trim();
    const image_url = body.image_url || null;
    const external_url = body.external_url || null;
    const status = body.status === 'published' ? 'published' : 'draft';
    const sort_order = Number.isInteger(Number(body.sort_order)) ? Number(body.sort_order) : 100;
    const is_mock = Boolean(body.is_mock);

    const newEntry: MaatverseEntryItem = {
      id: crypto.randomUUID ? crypto.randomUUID() : `ent_${Date.now()}`,
      section_slug,
      kind,
      title,
      slug,
      summary,
      body_md,
      image_url,
      external_url,
      status,
      sort_order,
      is_mock,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (adminSupabase) {
      try {
        await adminSupabase.from('maatverse_entries').insert([newEntry]);
      } catch {}
    }

    if (!localStore.maatverse_entries) localStore.maatverse_entries = [];
    localStore.maatverse_entries.push(newEntry);

    return res.status(201).json({ entry: newEntry });
  });

  app.patch('/api/v1/admin/maatverse/entries/:id', authenticateApiKey, requireScope('WRITE_CONTENT'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body || {};
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (body.title !== undefined) updates.title = String(body.title).trim();
    if (body.slug !== undefined) updates.slug = String(body.slug).trim().toLowerCase();
    if (body.section_slug !== undefined) updates.section_slug = String(body.section_slug).trim();
    if (body.kind !== undefined) updates.kind = body.kind;
    if (body.summary !== undefined) updates.summary = String(body.summary).trim();
    if (body.body_md !== undefined) updates.body_md = String(body.body_md).trim();
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.external_url !== undefined) updates.external_url = body.external_url;
    if (body.status !== undefined) updates.status = body.status;
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);
    if (body.is_mock !== undefined) updates.is_mock = Boolean(body.is_mock);

    if (adminSupabase) {
      try {
        await adminSupabase.from('maatverse_entries').update(updates).eq('id', id);
      } catch {}
    }

    if (localStore?.maatverse_entries) {
      const idx = localStore.maatverse_entries.findIndex((e: any) => e.id === id);
      if (idx !== -1) {
        localStore.maatverse_entries[idx] = { ...localStore.maatverse_entries[idx], ...updates };
      }
    }

    return res.json({ status: 'updated', id, updates });
  });

  app.delete('/api/v1/admin/maatverse/entries/:id', authenticateApiKey, requireScope('WRITE_CONTENT'), async (req: Request, res: Response) => {
    const { id } = req.params;

    if (adminSupabase) {
      try {
        await adminSupabase.from('maatverse_entries').delete().eq('id', id);
      } catch {}
    }

    if (localStore?.maatverse_entries) {
      localStore.maatverse_entries = localStore.maatverse_entries.filter((e: any) => e.id !== id);
    }

    return res.json({ status: 'deleted', id });
  });

  // ---------------------------------------------------------------------------
  // 6. OPERATOR: DELETE /api/v1/admin/maatverse/mocks ("Delete all mock")
  // ---------------------------------------------------------------------------
  app.delete('/api/v1/admin/maatverse/mocks', authenticateApiKey, requireScope('WRITE_CONTENT'), async (req: Request, res: Response) => {
    let deletedEntries = 0;
    let deletedSections = 0;

    if (adminSupabase) {
      try {
        const { data: eData } = await adminSupabase.from('maatverse_entries').delete().eq('is_mock', true).select('id');
        deletedEntries = eData?.length || 0;
        const { data: sData } = await adminSupabase.from('maatverse_sections').delete().eq('is_mock', true).select('id');
        deletedSections = sData?.length || 0;
      } catch {}
    }

    if (localStore?.maatverse_entries) {
      const initE = localStore.maatverse_entries.length;
      localStore.maatverse_entries = localStore.maatverse_entries.filter((e: any) => !e.is_mock);
      deletedEntries = Math.max(deletedEntries, initE - localStore.maatverse_entries.length);
    }

    if (localStore?.maatverse_sections) {
      const initS = localStore.maatverse_sections.length;
      localStore.maatverse_sections = localStore.maatverse_sections.filter((s: any) => !s.is_mock);
      deletedSections = Math.max(deletedSections, initS - localStore.maatverse_sections.length);
    }

    return res.json({ status: 'success', deleted_entries: deletedEntries, deleted_sections: deletedSections });
  });

  // ---------------------------------------------------------------------------
  // 7. OPERATOR: POST /api/v1/admin/maatverse/image (Upload image)
  // ---------------------------------------------------------------------------
  app.post(
    '/api/v1/admin/maatverse/image',
    authenticateApiKey,
    requireScope('WRITE_CONTENT'),
    (imageUpload.single('file') as any),
    async (req: Request, res: Response) => {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'validation', message: 'No image file provided' });
      }

      const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
      const fileId = crypto.randomUUID ? crypto.randomUUID() : `mv_${Date.now()}`;
      const storagePath = `maatverse/${fileId}.${ext}`;

      if (adminSupabase) {
        try {
          const { error: upErr } = await adminSupabase.storage
            .from('media')
            .upload(storagePath, file.buffer, {
              contentType: file.mimetype,
              upsert: true,
            });

          if (!upErr) {
            const { data: pubData } = adminSupabase.storage.from('media').getPublicUrl(storagePath);
            return res.json({
              image_url: pubData.publicUrl,
              image_path: storagePath,
            });
          }
        } catch {}
      }

      return res.json({
        image_url: `/media/${storagePath}`,
        image_path: storagePath,
      });
    }
  );
}
