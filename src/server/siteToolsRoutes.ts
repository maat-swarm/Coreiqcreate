import { Express, Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import multer from 'multer';

export interface SiteToolsDeps {
  authenticateApiKey: (req: Request, res: Response, next: NextFunction) => Promise<any>;
  requireScope: (scope: string) => (req: Request, res: Response, next: NextFunction) => any;
  adminSupabase: SupabaseClient | null;
  publicRateLimiter: (req: Request, res: Response, next: NextFunction) => any;
}

const VALID_TIERS = ['free', 'pro'] as const;
const VALID_STATUSES = ['draft', 'published'] as const;
const VALID_LAUNCH_TYPES = ['link', 'download', 'payment', 'inline', 'coming_soon'] as const;
const VALID_ORIGINS = ['coreiq', 'opensource'] as const;

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB cap
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function validateLaunchUrl(
  url: string | null | undefined,
  launchType: string,
  status: string
): { isValid: boolean; error?: string } {
  const clean = (url || '').trim();

  // If empty
  if (!clean) {
    if ((launchType === 'link' || launchType === 'download') && status === 'published') {
      return { isValid: false, error: `launch_url is required when launch_type is '${launchType}' and status is 'published'.` };
    }
    return { isValid: true };
  }

  // Reject javascript:, data:, http:, etc.
  if (/^(javascript:|data:|http:|blob:|file:)/i.test(clean)) {
    return { isValid: false, error: 'Only internal relative paths (e.g. /tools) or secure https:// URLs are allowed.' };
  }

  // Check if relative path starting with single "/"
  if (clean.startsWith('/')) {
    if (clean.startsWith('//')) {
      return { isValid: false, error: 'Protocol-relative URLs starting with // are not permitted.' };
    }
    return { isValid: true };
  }

  // Check if valid https URL
  try {
    const parsed = new URL(clean);
    if (parsed.protocol !== 'https:') {
      return { isValid: false, error: 'launch_url must be https://' };
    }
    if (launchType === 'payment' && parsed.hostname.toLowerCase().includes('stripe.com')) {
      return { isValid: false, error: 'Stripe is not permitted' };
    }
    return { isValid: true };
  } catch {
    return { isValid: false, error: 'Malformed launch_url provided.' };
  }
}

function validateImageUrl(url: string | null | undefined): boolean {
  if (!url || !url.trim()) return true;
  const clean = url.trim();
  if (clean.startsWith('/media/')) return true;
  try {
    const parsed = new URL(clean);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function registerSiteToolsRoutes(app: Express, deps: SiteToolsDeps) {
  const { authenticateApiKey, requireScope, adminSupabase, publicRateLimiter } = deps;

  // 1. PUBLIC: GET /api/v1/site-tools/public
  app.get('/api/v1/site-tools/public', publicRateLimiter, async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=15');

    if (!adminSupabase) {
      console.error('[site_tools public] adminSupabase is not configured');
      return res.status(503).json({ error: 'service_unavailable', message: 'Database service is currently unavailable' });
    }

    try {
      const { data, error } = await adminSupabase
        .from('site_tools')
        .select(
          'id, slug, name, tagline, description, category, tier, launch_type, launch_url, cta_label, image_url, featured, sort_order, origin'
        )
        .eq('status', 'published')
        .order('featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[site_tools public DB ERROR]', error.message, error.code);
        return res.status(500).json({ error: 'db_error', detail: error.message, code: error.code });
      }

      return res.json({ tools: data || [] });
    } catch (e: any) {
      console.error('[site_tools public EXCEPTION]', e?.message || e);
      return res.status(500).json({ error: 'db_error', detail: e?.message || 'Database query exception' });
    }
  });

  // 2. OPERATOR: GET /api/v1/site-tools
  app.get('/api/v1/site-tools', authenticateApiKey, requireScope('READ_TOOLS', 'READ_MEDIA'), async (req: Request, res: Response) => {
    if (!adminSupabase) {
      return res.status(503).json({ error: 'service_unavailable', message: 'adminSupabase is not configured' });
    }

    try {
      const { data, error } = await adminSupabase
        .from('site_tools')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[site_tools operator GET DB ERROR]', error.message, error.code);
        return res.status(500).json({ error: 'db_error', detail: error.message, code: error.code });
      }

      return res.json({ tools: data || [] });
    } catch (e: any) {
      console.error('[site_tools operator GET EXCEPTION]', e?.message || e);
      return res.status(500).json({ error: 'db_error', detail: e?.message });
    }
  });

  // 3. OPERATOR: POST /api/v1/site-tools
  app.post('/api/v1/site-tools', authenticateApiKey, requireScope('WRITE_TOOLS', 'WRITE_MEDIA'), async (req: Request, res: Response) => {
    if (!adminSupabase) {
      return res.status(503).json({ error: 'service_unavailable', message: 'adminSupabase is not configured' });
    }

    const body = req.body || {};
    const fieldErrors: Record<string, string> = {};

    // Name validation
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length < 2 || name.length > 80) {
      fieldErrors.name = 'Name must be between 2 and 80 characters.';
    }

    // Slug validation
    let slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
    if (!slug) {
      slug = slugify(name);
    }
    if (!slug || slug.length < 2 || slug.length > 60 || !SLUG_REGEX.test(slug)) {
      fieldErrors.slug = 'Slug must be 2-60 characters and contain only lowercase letters, numbers, and hyphens (a-z0-9-).';
    }

    // Tagline validation
    const tagline = typeof body.tagline === 'string' ? body.tagline.trim() : '';
    if (tagline.length > 120) {
      fieldErrors.tagline = 'Tagline cannot exceed 120 characters.';
    }

    // Description validation
    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (description.length > 400) {
      fieldErrors.description = 'Description cannot exceed 400 characters.';
    }

    // Category validation
    const category = typeof body.category === 'string' ? body.category.trim() : 'Writing';
    if (!category || category.length < 1 || category.length > 40) {
      fieldErrors.category = 'Category must be between 1 and 40 characters.';
    }

    // CTA label
    const cta_label = typeof body.cta_label === 'string' && body.cta_label.trim() ? body.cta_label.trim() : 'Open';
    if (cta_label.length < 1 || cta_label.length > 24) {
      fieldErrors.cta_label = 'CTA label must be between 1 and 24 characters.';
    }

    // Sort order
    const sort_order = Number.isInteger(Number(body.sort_order)) ? Number(body.sort_order) : 100;
    if (sort_order < 0 || sort_order > 9999) {
      fieldErrors.sort_order = 'Sort order must be an integer between 0 and 9999.';
    }

    // Featured
    const featured = Boolean(body.featured);

    // Enums
    const tier = VALID_TIERS.includes(body.tier) ? body.tier : 'free';
    if (body.tier && !VALID_TIERS.includes(body.tier)) {
      fieldErrors.tier = `Tier must be one of: ${VALID_TIERS.join(', ')}`;
    }

    const status = VALID_STATUSES.includes(body.status) ? body.status : 'draft';
    if (body.status && !VALID_STATUSES.includes(body.status)) {
      fieldErrors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}`;
    }

    const launch_type = VALID_LAUNCH_TYPES.includes(body.launch_type) ? body.launch_type : 'coming_soon';
    if (body.launch_type && !VALID_LAUNCH_TYPES.includes(body.launch_type)) {
      fieldErrors.launch_type = `Launch type must be one of: ${VALID_LAUNCH_TYPES.join(', ')}`;
    }

    const origin = VALID_ORIGINS.includes(body.origin) ? body.origin : 'coreiq';
    if (body.origin && !VALID_ORIGINS.includes(body.origin)) {
      fieldErrors.origin = `Origin must be one of: ${VALID_ORIGINS.join(', ')}`;
    }

    // Launch URL
    const launch_url = typeof body.launch_url === 'string' && body.launch_url.trim() ? body.launch_url.trim() : null;
    const launchUrlCheck = validateLaunchUrl(launch_url, launch_type, status);
    if (!launchUrlCheck.isValid) {
      fieldErrors.launch_url = launchUrlCheck.error || 'Invalid launch_url';
    }

    // Image URL & Path
    const image_url = typeof body.image_url === 'string' && body.image_url.trim() ? body.image_url.trim() : null;
    if (image_url && !validateImageUrl(image_url)) {
      fieldErrors.image_url = 'Image URL must be https:// or start with /media/';
    }
    const image_path = typeof body.image_path === 'string' && body.image_path.trim() ? body.image_path.trim() : null;

    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({ error: 'validation', fields: fieldErrors });
    }

    try {
      // Check for duplicate slug
      const { data: existing, error: checkErr } = await adminSupabase
        .from('site_tools')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (checkErr) {
        console.error('[site_tools slug check error]', checkErr);
      }
      if (existing) {
        return res.status(409).json({ error: 'slug_taken', message: 'A tool with this slug already exists' });
      }

      const newRow = {
        slug,
        name,
        tagline,
        description,
        category,
        tier,
        status,
        launch_type,
        launch_url,
        cta_label,
        image_url,
        image_path,
        featured,
        sort_order,
        origin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await adminSupabase.from('site_tools').insert([newRow]).select().single();

      if (error) {
        console.error('[site_tools INSERT DB ERROR]', error.message, error.code);
        return res.status(500).json({ error: 'db_error', detail: error.message, code: error.code });
      }

      return res.status(201).json({ tool: data, ...data });
    } catch (e: any) {
      console.error('[site_tools INSERT EXCEPTION]', e?.message || e);
      return res.status(500).json({ error: 'db_error', detail: e?.message });
    }
  });

  // 4. OPERATOR: PATCH /api/v1/site-tools/:id
  app.patch('/api/v1/site-tools/:id', authenticateApiKey, requireScope('WRITE_TOOLS', 'WRITE_MEDIA'), async (req: Request, res: Response) => {
    if (!adminSupabase) {
      return res.status(503).json({ error: 'service_unavailable', message: 'adminSupabase is not configured' });
    }

    const { id } = req.params;
    const body = req.body || {};
    const fieldErrors: Record<string, string> = {};
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    // If name provided
    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name || name.length < 2 || name.length > 80) {
        fieldErrors.name = 'Name must be between 2 and 80 characters.';
      } else {
        updates.name = name;
      }
    }

    // If slug provided
    if (body.slug !== undefined) {
      const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
      if (!slug || slug.length < 2 || slug.length > 60 || !SLUG_REGEX.test(slug)) {
        fieldErrors.slug = 'Slug must be 2-60 characters and contain only lowercase letters, numbers, and hyphens (a-z0-9-).';
      } else {
        // Check duplicate excluding self
        const { data: existing } = await adminSupabase
          .from('site_tools')
          .select('id')
          .eq('slug', slug)
          .neq('id', id)
          .maybeSingle();

        if (existing) {
          return res.status(409).json({ error: 'slug_taken', message: 'A tool with this slug already exists' });
        }
        updates.slug = slug;
      }
    }

    if (body.tagline !== undefined) {
      const tagline = typeof body.tagline === 'string' ? body.tagline.trim() : '';
      if (tagline.length > 120) {
        fieldErrors.tagline = 'Tagline cannot exceed 120 characters.';
      } else {
        updates.tagline = tagline;
      }
    }

    if (body.description !== undefined) {
      const description = typeof body.description === 'string' ? body.description.trim() : '';
      if (description.length > 400) {
        fieldErrors.description = 'Description cannot exceed 400 characters.';
      } else {
        updates.description = description;
      }
    }

    if (body.category !== undefined) {
      const category = typeof body.category === 'string' ? body.category.trim() : '';
      if (!category || category.length < 1 || category.length > 40) {
        fieldErrors.category = 'Category must be between 1 and 40 characters.';
      } else {
        updates.category = category;
      }
    }

    if (body.cta_label !== undefined) {
      const cta = typeof body.cta_label === 'string' ? body.cta_label.trim() : 'Open';
      if (cta.length < 1 || cta.length > 24) {
        fieldErrors.cta_label = 'CTA label must be between 1 and 24 characters.';
      } else {
        updates.cta_label = cta;
      }
    }

    if (body.sort_order !== undefined) {
      const order = Number.isInteger(Number(body.sort_order)) ? Number(body.sort_order) : -1;
      if (order < 0 || order > 9999) {
        fieldErrors.sort_order = 'Sort order must be an integer between 0 and 9999.';
      } else {
        updates.sort_order = order;
      }
    }

    if (body.featured !== undefined) {
      updates.featured = Boolean(body.featured);
    }

    if (body.tier !== undefined) {
      if (!VALID_TIERS.includes(body.tier)) {
        fieldErrors.tier = `Tier must be one of: ${VALID_TIERS.join(', ')}`;
      } else {
        updates.tier = body.tier;
      }
    }

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        fieldErrors.status = `Status must be one of: ${VALID_STATUSES.join(', ')}`;
      } else {
        updates.status = body.status;
      }
    }

    if (body.launch_type !== undefined) {
      if (!VALID_LAUNCH_TYPES.includes(body.launch_type)) {
        fieldErrors.launch_type = `Launch type must be one of: ${VALID_LAUNCH_TYPES.join(', ')}`;
      } else {
        updates.launch_type = body.launch_type;
      }
    }

    if (body.origin !== undefined) {
      if (!VALID_ORIGINS.includes(body.origin)) {
        fieldErrors.origin = `Origin must be one of: ${VALID_ORIGINS.join(', ')}`;
      } else {
        updates.origin = body.origin;
      }
    }

    if (body.image_url !== undefined) {
      const img = typeof body.image_url === 'string' && body.image_url.trim() ? body.image_url.trim() : null;
      if (img && !validateImageUrl(img)) {
        fieldErrors.image_url = 'Image URL must be https:// or start with /media/';
      } else {
        updates.image_url = img;
      }
    }

    if (body.image_path !== undefined) {
      updates.image_path = typeof body.image_path === 'string' && body.image_path.trim() ? body.image_path.trim() : null;
    }

    if (body.launch_url !== undefined || updates.status || updates.launch_type) {
      const nextUrl = body.launch_url !== undefined ? (typeof body.launch_url === 'string' && body.launch_url.trim() ? body.launch_url.trim() : null) : undefined;
      const nextType = updates.launch_type || body.launch_type;
      const nextStatus = updates.status || body.status;

      // Check current row if not provided
      let currentType = nextType;
      let currentStatus = nextStatus;
      let currentUrl = nextUrl;

      if (currentType === undefined || currentStatus === undefined || currentUrl === undefined) {
        const { data: curr } = await adminSupabase.from('site_tools').select('launch_url, launch_type, status').eq('id', id).maybeSingle();
        if (curr) {
          if (currentType === undefined) currentType = curr.launch_type;
          if (currentStatus === undefined) currentStatus = curr.status;
          if (currentUrl === undefined) currentUrl = curr.launch_url;
        }
      }

      const launchUrlCheck = validateLaunchUrl(currentUrl, currentType || 'coming_soon', currentStatus || 'draft');
      if (!launchUrlCheck.isValid) {
        fieldErrors.launch_url = launchUrlCheck.error || 'Invalid launch_url';
      } else if (nextUrl !== undefined) {
        updates.launch_url = nextUrl;
      }
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({ error: 'validation', fields: fieldErrors });
    }

    try {
      const { data, error } = await adminSupabase
        .from('site_tools')
        .update(updates)
        .eq('id', id)
        .select()
        .maybeSingle();

      if (error) {
        console.error('[site_tools UPDATE DB ERROR]', error.message, error.code);
        return res.status(500).json({ error: 'db_error', detail: error.message, code: error.code });
      }

      if (!data) {
        return res.status(404).json({ error: 'not_found', message: `Site tool ${id} not found` });
      }

      return res.json({ tool: data, ...data });
    } catch (e: any) {
      console.error('[site_tools UPDATE EXCEPTION]', e?.message || e);
      return res.status(500).json({ error: 'db_error', detail: e?.message });
    }
  });

  // 5. OPERATOR: DELETE /api/v1/site-tools/:id
  app.delete('/api/v1/site-tools/:id', authenticateApiKey, requireScope('WRITE_TOOLS', 'WRITE_MEDIA'), async (req: Request, res: Response) => {
    if (!adminSupabase) {
      return res.status(503).json({ error: 'service_unavailable', message: 'adminSupabase is not configured' });
    }

    const { id } = req.params;

    try {
      const { error } = await adminSupabase.from('site_tools').delete().eq('id', id);

      if (error) {
        console.error('[site_tools DELETE DB ERROR]', error.message, error.code);
        return res.status(500).json({ error: 'db_error', detail: error.message, code: error.code });
      }

      return res.json({ status: 'deleted', id });
    } catch (e: any) {
      console.error('[site_tools DELETE EXCEPTION]', e?.message || e);
      return res.status(500).json({ error: 'db_error', detail: e?.message });
    }
  });

  // 6. OPERATOR: POST /api/v1/site-tools/image (Upload tool thumbnail to media storage bucket)
  app.post(
    '/api/v1/site-tools/image',
    authenticateApiKey,
    requireScope('WRITE_TOOLS', 'WRITE_MEDIA'),
    (upload.single('file') as any),
    async (req: Request, res: Response) => {
      if (!adminSupabase) {
        return res.status(503).json({ error: 'service_unavailable', message: 'adminSupabase is not configured' });
      }

      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'validation', message: 'No image file provided' });
      }

      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(file.mimetype)) {
        return res.status(400).json({ error: 'validation', message: 'Image must be JPEG, PNG, or WebP.' });
      }

      if (file.size > 2 * 1024 * 1024) {
        return res.status(400).json({ error: 'validation', message: 'Image exceeds 2 MB limit.' });
      }

      const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
      const fileId = crypto.randomUUID ? crypto.randomUUID() : `tool_${Date.now()}`;
      const storagePath = `tools/${fileId}.${ext}`;

      try {
        const { error: upErr } = await adminSupabase.storage
          .from('media')
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
          });

        if (upErr) {
          console.error('[site_tools image upload storage error]', upErr);
          return res.status(500).json({ error: 'storage_error', detail: upErr.message });
        }

        const { data: pubData } = adminSupabase.storage.from('media').getPublicUrl(storagePath);
        return res.json({
          image_url: pubData.publicUrl,
          image_path: storagePath,
        });
      } catch (err: any) {
        console.error('[site_tools image upload exception]', err);
        return res.status(500).json({ error: 'storage_error', detail: err?.message || 'Storage error' });
      }
    }
  );
}
