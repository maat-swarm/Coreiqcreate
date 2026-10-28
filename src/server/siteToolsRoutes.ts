import { Express, Request, Response, NextFunction } from 'express';
import { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { z } from 'zod';
import { ToolFormField, ToolSubmissionItem } from '../types/command';

export interface SiteToolsDeps {
  authenticateApiKey: (req: Request, res: Response, next: NextFunction) => Promise<any>;
  requireScope: (...scopes: string[]) => (req: Request, res: Response, next: NextFunction) => any;
  adminSupabase: SupabaseClient | null;
  publicRateLimiter: (req: Request, res: Response, next: NextFunction) => any;
  localStore?: any;
}

const VALID_TIERS = ['free', 'pro'] as const;
const VALID_STATUSES = ['draft', 'published'] as const;
const VALID_LAUNCH_TYPES = ['link', 'download', 'payment', 'in_app', 'coming_soon', 'inline'] as const;
const VALID_ORIGINS = ['coreiq', 'opensource'] as const;

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Upload for tool thumbnails (up to 5 MB as required by Phase 3)
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Upload for submissions & deliverables (up to 10 MB per file, max 5 files as required by Phase 5)
const submissionUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function detectMimeType(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 4) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  // WEBP: RIFF....WEBP
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'image/webp';
  }
  // PDF: %PDF
  if (buffer.toString('ascii', 0, 4) === '%PDF') return 'application/pdf';
  // DOCX / ZIP: 50 4B 03 04 (PK..)
  if (buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  // Plain text (ASCII / UTF8 printable)
  let isAsciiText = true;
  for (let i = 0; i < Math.min(buffer.length, 512); i++) {
    const byte = buffer[i];
    if (byte === 0) {
      isAsciiText = false;
      break;
    }
  }
  if (isAsciiText) return 'text/plain';

  return null;
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

// In-memory IP submission limiter (5 submissions per IP per hour)
const submissionRateMap = new Map<string, number[]>();
function checkSubmissionRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const timestamps = (submissionRateMap.get(ip) || []).filter((t) => now - t < windowMs);
  if (timestamps.length >= 5) {
    submissionRateMap.set(ip, timestamps);
    return false;
  }
  timestamps.push(now);
  submissionRateMap.set(ip, timestamps);
  return true;
}

export function registerSiteToolsRoutes(app: Express, deps: SiteToolsDeps) {
  const { authenticateApiKey, requireScope, adminSupabase, publicRateLimiter, localStore } = deps;

  // Helper to check if a Supabase error is table-missing/schema cache error
  const isSchemaMissing = (err: any) => {
    if (!err) return false;
    const msg = String(err.message || '').toLowerCase();
    const code = String(err.code || '');
    return (
      code === 'PGRST205' ||
      code === '42P01' ||
      msg.includes('schema cache') ||
      msg.includes('does not exist') ||
      msg.includes('could not find the table')
    );
  };

  // Helper to sync localStore tool private data
  const getToolPrivate = async (toolId: string) => {
    if (adminSupabase) {
      try {
        const { data, error } = await adminSupabase
          .from('site_tool_private')
          .select('*')
          .eq('tool_id', toolId)
          .maybeSingle();
        if (!error && data) return data;
      } catch {}
    }
    const privList = localStore?.site_tool_private || [];
    return privList.find((p: any) => p.tool_id === toolId) || null;
  };

  // ---------------------------------------------------------------------------
  // 1. PUBLIC: GET /api/v1/site-tools/public
  // Whitelisted columns ONLY: Never URLs, payment links, or file paths
  // ---------------------------------------------------------------------------
  app.get('/api/v1/site-tools/public', publicRateLimiter, async (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'public, max-age=15');

    let tools: any[] = [];
    let usedDb = false;

    if (adminSupabase) {
      try {
        const { data, error } = await adminSupabase
          .from('site_tools')
          .select(
            'id, slug, name, tagline, description, category, tier, launch_type, cta_label, image_url, featured, sort_order, origin, is_paid, price_amount, price_currency, form_schema, is_mock'
          )
          .eq('status', 'published')
          .order('featured', { ascending: false })
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true });

        if (!error && data) {
          tools = data;
          usedDb = true;
        } else if (error && !isSchemaMissing(error)) {
          console.error('[site_tools public DB ERROR]', error.message);
        }
      } catch (e: any) {
        console.warn('[site_tools public catch]', e?.message);
      }
    }

    if (!usedDb) {
      const localList = localStore?.site_tools || [];
      tools = localList
        .filter((t: any) => t.status === 'published')
        .map((t: any) => ({
          id: t.id,
          slug: t.slug,
          name: t.name,
          tagline: t.tagline,
          description: t.description,
          category: t.category,
          tier: t.tier,
          launch_type: t.launch_type,
          cta_label: t.cta_label,
          image_url: t.image_url,
          featured: t.featured,
          sort_order: t.sort_order,
          origin: t.origin,
          is_paid: Boolean(t.is_paid),
          price_amount: t.price_amount ?? null,
          price_currency: t.price_currency || 'USD',
          form_schema: Array.isArray(t.form_schema) ? t.form_schema : [],
          is_mock: Boolean(t.is_mock),
        }))
        .sort((a: any, b: any) => {
          if (a.featured !== b.featured) return a.featured ? -1 : 1;
          return a.sort_order - b.sort_order;
        });
    }

    return res.json({ tools });
  });

  // ---------------------------------------------------------------------------
  // 2. PUBLIC: POST /api/v1/site-tools/:slug/launch
  // Resolves the action and URL safely; never exposes URLs in public lists
  // ---------------------------------------------------------------------------
  app.post('/api/v1/site-tools/:slug/launch', publicRateLimiter, async (req: Request, res: Response) => {
    const { slug } = req.params;

    // Locate tool
    let tool: any = null;
    if (adminSupabase) {
      try {
        const { data, error } = await adminSupabase
          .from('site_tools')
          .select('*')
          .eq('slug', slug)
          .eq('status', 'published')
          .maybeSingle();
        if (!error && data) tool = data;
      } catch {}
    }
    if (!tool) {
      tool = (localStore?.site_tools || []).find((t: any) => t.slug === slug && t.status === 'published');
    }

    if (!tool) {
      return res.status(404).json({ error: 'not_found', message: `Tool '${slug}' not found or not published.` });
    }

    // Coming soon
    if (tool.launch_type === 'coming_soon') {
      return res.json({ action: 'coming_soon', message: `${tool.name} is launching soon.` });
    }

    // In-app modal with form schema
    if (tool.launch_type === 'in_app') {
      return res.json({
        action: 'in_app',
        form_schema: Array.isArray(tool.form_schema) ? tool.form_schema : [],
      });
    }

    // If paid tool or launch_type is payment
    if (tool.is_paid || tool.launch_type === 'payment') {
      return res.json({
        action: 'paid_required',
        price_amount: tool.price_amount,
        price_currency: tool.price_currency || 'USD',
        message: 'This is a paid tool. Complete submission and payment to proceed.',
      });
    }

    // Free tool: fetch private config
    const priv = await getToolPrivate(tool.id);

    if (tool.launch_type === 'link') {
      const targetUrl = priv?.launch_url || tool.launch_url || '';
      if (!targetUrl) {
        return res.status(400).json({ error: 'missing_destination', message: 'No destination configured.' });
      }
      return res.json({ action: 'link', url: targetUrl });
    }

    if (tool.launch_type === 'download') {
      const downloadPath = priv?.download_path || priv?.launch_url || tool.launch_url || '';
      let downloadUrl = downloadPath;

      // Try creating signed URL if stored in bucket
      if (adminSupabase && downloadPath && !downloadPath.startsWith('http') && !downloadPath.startsWith('/')) {
        try {
          const { data: signData } = await adminSupabase.storage
            .from('tool-submissions')
            .createSignedUrl(downloadPath, 3600);
          if (signData?.signedUrl) downloadUrl = signData.signedUrl;
        } catch {}
      }

      return res.json({
        action: 'download',
        url: downloadUrl,
        fileName: `${tool.slug}.zip`,
      });
    }

    return res.json({ action: 'coming_soon' });
  });

  // ---------------------------------------------------------------------------
  // 3. PUBLIC: POST /api/v1/site-tools/:slug/submit (Multipart)
  // Validates with Zod from form_schema, honeypot, IP limit, magic bytes, max 10MB
  // ---------------------------------------------------------------------------
  app.post(
    '/api/v1/site-tools/:slug/submit',
    (submissionUpload.any() as any),
    async (req: Request, res: Response) => {
      const { slug } = req.params;
      const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '127.0.0.1';

      // 1. Rate limiting: 5 submissions per IP per hour
      if (!checkSubmissionRateLimit(ip)) {
        return res.status(429).json({
          error: 'rate_limited',
          message: 'Submission limit reached (maximum 5 submissions per hour per IP). Please try again later.',
        });
      }

      // 2. Honeypot check
      const honeypot = (req.body?.honeypot || req.body?.hp_comment || '').trim();
      if (honeypot) {
        // Silently accept without saving
        return res.json({ reference_id: `sub_${Date.now()}`, message: 'Submission received.' });
      }

      // 3. Find tool
      let tool: any = null;
      if (adminSupabase) {
        try {
          const { data } = await adminSupabase
            .from('site_tools')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();
          if (data) tool = data;
        } catch {}
      }
      if (!tool) {
        tool = (localStore?.site_tools || []).find((t: any) => t.slug === slug);
      }
      if (!tool) {
        return res.status(404).json({ error: 'not_found', message: `Tool '${slug}' not found.` });
      }

      // 4. Client info validation
      const client_name = (req.body?.client_name || '').trim();
      const client_email = (req.body?.client_email || '').trim().toLowerCase();

      if (!client_name || client_name.length < 2) {
        return res.status(400).json({ error: 'validation', field_errors: { client_name: 'Name is required (min 2 chars).' } });
      }
      const emailZod = z.string().email();
      const emailResult = emailZod.safeParse(client_email);
      if (!emailResult.success) {
        return res.status(400).json({ error: 'validation', field_errors: { client_email: 'A valid email address is required.' } });
      }

      // 5. Build dynamic Zod schema from form_schema
      const formSchema: ToolFormField[] = Array.isArray(tool.form_schema) ? tool.form_schema : [];
      const fieldErrors: Record<string, string> = {};
      const parsedFormData: Record<string, any> = {};

      for (const field of formSchema) {
        const val = req.body?.[field.key];
        if (field.type === 'file') {
          // Handled via files check below
          continue;
        }
        if (field.required && (val === undefined || String(val).trim() === '')) {
          fieldErrors[field.key] = `${field.label} is required.`;
          continue;
        }
        if (val !== undefined) {
          const cleanVal = String(val).trim();
          if (field.type === 'email' && cleanVal) {
            const check = z.string().email().safeParse(cleanVal);
            if (!check.success) fieldErrors[field.key] = `${field.label} must be a valid email.`;
          }
          parsedFormData[field.key] = cleanVal;
        }
      }

      // Also parse any extra non-file body keys
      for (const [k, v] of Object.entries(req.body)) {
        if (!['client_name', 'client_email', 'honeypot', 'hp_comment'].includes(k) && parsedFormData[k] === undefined) {
          parsedFormData[k] = v;
        }
      }

      // 6. Handle file uploads: max 10MB per file, allowed: pdf, docx, txt, png, jpg
      const files = (req.files as Express.Multer.File[]) || [];
      const uploadedFilePaths: string[] = [];
      const allowedExts = ['pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg'];

      for (const f of files) {
        if (f.size > 10 * 1024 * 1024) {
          fieldErrors[f.fieldname] = `File ${f.originalname} exceeds the 10 MB limit.`;
          continue;
        }

        const ext = (f.originalname.split('.').pop() || '').toLowerCase();
        if (!allowedExts.includes(ext)) {
          fieldErrors[f.fieldname] = `File ${f.originalname} has unsupported format. Allowed: pdf, docx, txt, png, jpg.`;
          continue;
        }

        // Magic bytes inspection
        const mime = detectMimeType(f.buffer);
        if (!mime) {
          fieldErrors[f.fieldname] = `File ${f.originalname} content does not match allowed file types.`;
          continue;
        }

        const fileId = crypto.randomUUID ? crypto.randomUUID() : `subfile_${Date.now()}`;
        const storagePath = `submissions/${slug}/${fileId}_${f.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

        if (adminSupabase) {
          try {
            await adminSupabase.storage
              .from('tool-submissions')
              .upload(storagePath, f.buffer, {
                contentType: f.mimetype || mime,
                upsert: true,
              });
            uploadedFilePaths.push(storagePath);
          } catch (e) {
            uploadedFilePaths.push(storagePath);
          }
        } else {
          uploadedFilePaths.push(storagePath);
        }
      }

      if (Object.keys(fieldErrors).length > 0) {
        return res.status(400).json({ error: 'validation', field_errors: fieldErrors });
      }

      // 7. Save submission
      const subId = crypto.randomUUID ? crypto.randomUUID() : `sub_${Date.now()}`;
      const isPaid = tool.is_paid || tool.launch_type === 'payment';
      const initialStatus = isPaid ? 'awaiting_payment' : 'new';
      const paymentStatus = isPaid ? 'pending' : 'not_required';
      const amountDue = isPaid ? tool.price_amount : null;

      const submissionRow: ToolSubmissionItem = {
        id: subId,
        tool_id: tool.id,
        tool_slug: tool.slug,
        client_name,
        client_email,
        form_data: parsedFormData,
        file_paths: uploadedFilePaths,
        status: initialStatus,
        payment_status: paymentStatus,
        amount_due: amountDue,
        operator_notes: '',
        deliverable_path: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (adminSupabase) {
        try {
          const { error } = await adminSupabase.from('tool_submissions').insert([submissionRow]);
          if (error && !isSchemaMissing(error)) {
            console.error('[tool_submissions insert error]', error);
          }
        } catch (e) {
          console.warn('[tool_submissions insert catch]', e);
        }
      }

      // Always update in localStore
      if (!localStore.tool_submissions) localStore.tool_submissions = [];
      localStore.tool_submissions.unshift(submissionRow);

      // Fetch payment url if paid
      let paymentUrl: string | undefined = undefined;
      if (isPaid) {
        const priv = await getToolPrivate(tool.id);
        paymentUrl = priv?.payment_url || priv?.launch_url || undefined;
      }

      return res.status(201).json({
        reference_id: subId,
        status: initialStatus,
        payment_url: paymentUrl,
        message: isPaid
          ? 'Submission registered. Please proceed to payment to begin execution.'
          : 'Thank you! Your submission has been received.',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // 4. OPERATOR: GET /api/v1/site-tools (List tools with private data & sub counts)
  // ---------------------------------------------------------------------------
  app.get('/api/v1/site-tools', authenticateApiKey, requireScope('READ_TOOLS', 'READ_MEDIA'), async (req: Request, res: Response) => {
    let tools: any[] = [];
    let usedDb = false;

    if (adminSupabase) {
      try {
        const { data: dbTools, error: toolErr } = await adminSupabase
          .from('site_tools')
          .select('*')
          .order('sort_order', { ascending: true })
          .order('created_at', { ascending: true });

        if (!toolErr && dbTools) {
          usedDb = true;
          // Join private fields and submission counts
          const { data: privList } = await adminSupabase.from('site_tool_private').select('*');
          const privMap = new Map((privList || []).map((p: any) => [p.tool_id, p]));

          const { data: subs } = await adminSupabase
            .from('tool_submissions')
            .select('tool_id, status')
            .eq('status', 'new');
          const counts: Record<string, number> = {};
          (subs || []).forEach((s: any) => {
            if (s.tool_id) counts[s.tool_id] = (counts[s.tool_id] || 0) + 1;
          });

          tools = dbTools.map((t: any) => {
            const p: any = privMap.get(t.id) || {};
            return {
              ...t,
              launch_url: p.launch_url || t.launch_url || null,
              payment_url: p.payment_url || null,
              download_path: p.download_path || null,
              new_submissions_count: counts[t.id] || 0,
            };
          });
        }
      } catch (e: any) {
        console.warn('[site_tools operator GET]', e?.message);
      }
    }

    if (!usedDb) {
      const localTools = localStore?.site_tools || [];
      const privList = localStore?.site_tool_private || [];
      const privMap = new Map(privList.map((p: any) => [p.tool_id, p]));
      const subs = localStore?.tool_submissions || [];
      const counts: Record<string, number> = {};
      subs.filter((s: any) => s.status === 'new').forEach((s: any) => {
        if (s.tool_id) counts[s.tool_id] = (counts[s.tool_id] || 0) + 1;
      });

      tools = localTools.map((t: any) => {
        const p: any = privMap.get(t.id) || {};
        return {
          ...t,
          launch_url: p.launch_url || t.launch_url || null,
          payment_url: p.payment_url || null,
          download_path: p.download_path || null,
          new_submissions_count: counts[t.id] || 0,
        };
      });
    }

    return res.json({ tools });
  });

  // ---------------------------------------------------------------------------
  // 5. OPERATOR: POST /api/v1/site-tools (Create tool & private data)
  // ---------------------------------------------------------------------------
  app.post('/api/v1/site-tools', authenticateApiKey, requireScope('WRITE_TOOLS', 'WRITE_MEDIA'), async (req: Request, res: Response) => {
    const body = req.body || {};
    const fieldErrors: Record<string, string> = {};

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length < 2 || name.length > 80) {
      fieldErrors.name = 'Name must be between 2 and 80 characters.';
    }

    let slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';
    if (!slug) slug = slugify(name);
    if (!slug || slug.length < 2 || slug.length > 60 || !SLUG_REGEX.test(slug)) {
      fieldErrors.slug = 'Slug must be 2-60 characters and contain only lowercase letters, numbers, and hyphens (a-z0-9-).';
    }

    const tagline = typeof body.tagline === 'string' ? body.tagline.trim() : '';
    if (tagline.length > 120) fieldErrors.tagline = 'Tagline cannot exceed 120 characters.';

    const description = typeof body.description === 'string' ? body.description.trim() : '';
    if (description.length > 400) fieldErrors.description = 'Description cannot exceed 400 characters.';

    const category = typeof body.category === 'string' ? body.category.trim() : 'Writing';
    const cta_label = typeof body.cta_label === 'string' && body.cta_label.trim() ? body.cta_label.trim() : 'Open';
    const sort_order = Number.isInteger(Number(body.sort_order)) ? Number(body.sort_order) : 100;
    const featured = Boolean(body.featured);
    const tier = VALID_TIERS.includes(body.tier) ? body.tier : 'free';
    const status = VALID_STATUSES.includes(body.status) ? body.status : 'draft';
    const launch_type = VALID_LAUNCH_TYPES.includes(body.launch_type) ? body.launch_type : 'coming_soon';
    const origin = VALID_ORIGINS.includes(body.origin) ? body.origin : 'coreiq';

    const is_paid = Boolean(body.is_paid);
    const price_amount = body.price_amount !== undefined && body.price_amount !== null && body.price_amount !== '' ? Number(body.price_amount) : null;
    const price_currency = (body.price_currency || 'USD').trim().toUpperCase();
    const form_schema = Array.isArray(body.form_schema) ? body.form_schema : [];
    const is_mock = Boolean(body.is_mock);

    const image_url = typeof body.image_url === 'string' && body.image_url.trim() ? body.image_url.trim() : null;
    if (image_url && !validateImageUrl(image_url)) {
      fieldErrors.image_url = 'Image URL must be https:// or start with /media/';
    }
    const image_path = typeof body.image_path === 'string' && body.image_path.trim() ? body.image_path.trim() : null;

    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({ error: 'validation', fields: fieldErrors });
    }

    const toolId = crypto.randomUUID ? crypto.randomUUID() : `tool_${Date.now()}`;
    const newToolRow = {
      id: toolId,
      slug,
      name,
      tagline,
      description,
      category,
      tier,
      status,
      launch_type,
      launch_url: body.launch_url || null,
      cta_label,
      image_url,
      image_path,
      featured,
      sort_order,
      origin,
      is_paid,
      price_amount,
      price_currency,
      form_schema,
      is_mock,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const privateRow = {
      tool_id: toolId,
      launch_url: body.launch_url || null,
      payment_url: body.payment_url || null,
      download_path: body.download_path || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (adminSupabase) {
      try {
        const { error: toolErr } = await adminSupabase.from('site_tools').insert([newToolRow]);
        if (toolErr && !isSchemaMissing(toolErr)) {
          console.error('[site_tools insert error]', toolErr);
          return res.status(500).json({ error: 'Database Write Error', message: toolErr.message });
        }
        await adminSupabase.from('site_tool_private').insert([privateRow]);
      } catch (e: any) {
        console.warn('[site_tools create db catch]', e);
        return res.status(500).json({ error: 'Database Write Exception', message: e?.message });
      }
    }

    if (!localStore.site_tools) localStore.site_tools = [];
    if (!localStore.site_tool_private) localStore.site_tool_private = [];
    localStore.site_tools.push(newToolRow);
    localStore.site_tool_private.push(privateRow);

    return res.status(201).json({
      tool: {
        ...newToolRow,
        ...privateRow,
      },
    });
  });

  // ---------------------------------------------------------------------------
  // 6. OPERATOR: PATCH /api/v1/site-tools/:id
  // ---------------------------------------------------------------------------
  app.patch('/api/v1/site-tools/:id', authenticateApiKey, requireScope('WRITE_TOOLS', 'WRITE_MEDIA'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body || {};
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    const privUpdates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) updates.name = String(body.name).trim();
    if (body.slug !== undefined) updates.slug = String(body.slug).trim().toLowerCase();
    if (body.tagline !== undefined) updates.tagline = String(body.tagline).trim();
    if (body.description !== undefined) updates.description = String(body.description).trim();
    if (body.category !== undefined) updates.category = String(body.category).trim();
    if (body.cta_label !== undefined) updates.cta_label = String(body.cta_label).trim();
    if (body.sort_order !== undefined) updates.sort_order = Number(body.sort_order);
    if (body.featured !== undefined) updates.featured = Boolean(body.featured);
    if (body.tier !== undefined) updates.tier = body.tier;
    if (body.status !== undefined) updates.status = body.status;
    if (body.launch_type !== undefined) updates.launch_type = body.launch_type;
    if (body.origin !== undefined) updates.origin = body.origin;
    if (body.is_paid !== undefined) updates.is_paid = Boolean(body.is_paid);
    if (body.price_amount !== undefined) updates.price_amount = body.price_amount !== null && body.price_amount !== '' ? Number(body.price_amount) : null;
    if (body.price_currency !== undefined) updates.price_currency = String(body.price_currency).trim().toUpperCase();
    if (body.form_schema !== undefined) updates.form_schema = body.form_schema;
    if (body.is_mock !== undefined) updates.is_mock = Boolean(body.is_mock);
    if (body.image_url !== undefined) updates.image_url = body.image_url;
    if (body.image_path !== undefined) updates.image_path = body.image_path;

    if (body.launch_url !== undefined) {
      updates.launch_url = body.launch_url;
      privUpdates.launch_url = body.launch_url;
    }
    if (body.payment_url !== undefined) privUpdates.payment_url = body.payment_url;
    if (body.download_path !== undefined) privUpdates.download_path = body.download_path;

    if (adminSupabase) {
      try {
        await adminSupabase.from('site_tools').update(updates).eq('id', id);
        await adminSupabase.from('site_tool_private').upsert({ tool_id: id, ...privUpdates });
      } catch (e) {
        console.warn('[site_tools update db catch]', e);
      }
    }

    // Update localStore
    let found = false;
    if (localStore?.site_tools) {
      const idx = localStore.site_tools.findIndex((t: any) => t.id === id);
      if (idx !== -1) {
        localStore.site_tools[idx] = { ...localStore.site_tools[idx], ...updates };
        found = true;
      }
    }
    if (localStore?.site_tool_private) {
      const pIdx = localStore.site_tool_private.findIndex((p: any) => p.tool_id === id);
      if (pIdx !== -1) {
        localStore.site_tool_private[pIdx] = { ...localStore.site_tool_private[pIdx], ...privUpdates };
      } else {
        localStore.site_tool_private.push({ tool_id: id, ...privUpdates });
      }
    }

    return res.json({ status: 'updated', id, updates });
  });

  // ---------------------------------------------------------------------------
  // 7. OPERATOR: DELETE /api/v1/site-tools/:id
  // ---------------------------------------------------------------------------
  app.delete('/api/v1/site-tools/:id', authenticateApiKey, requireScope('WRITE_TOOLS', 'WRITE_MEDIA'), async (req: Request, res: Response) => {
    const { id } = req.params;

    if (adminSupabase) {
      try {
        await adminSupabase.from('site_tools').delete().eq('id', id);
        await adminSupabase.from('site_tool_private').delete().eq('tool_id', id);
      } catch (e) {
        console.warn('[site_tools delete db catch]', e);
      }
    }

    if (localStore?.site_tools) {
      localStore.site_tools = localStore.site_tools.filter((t: any) => t.id !== id);
    }
    if (localStore?.site_tool_private) {
      localStore.site_tool_private = localStore.site_tool_private.filter((p: any) => p.tool_id !== id);
    }

    return res.json({ status: 'deleted', id });
  });

  // ---------------------------------------------------------------------------
  // 8. OPERATOR: POST /api/v1/site-tools/:id/duplicate
  // ---------------------------------------------------------------------------
  app.post('/api/v1/site-tools/:id/duplicate', authenticateApiKey, requireScope('WRITE_TOOLS', 'WRITE_MEDIA'), async (req: Request, res: Response) => {
    const { id } = req.params;
    let tool: any = null;

    if (adminSupabase) {
      try {
        const { data } = await adminSupabase.from('site_tools').select('*').eq('id', id).maybeSingle();
        if (data) tool = data;
      } catch {}
    }
    if (!tool) {
      tool = (localStore?.site_tools || []).find((t: any) => t.id === id);
    }

    if (!tool) {
      return res.status(404).json({ error: 'not_found', message: `Tool ${id} not found.` });
    }

    const priv = await getToolPrivate(id);
    const newId = crypto.randomUUID ? crypto.randomUUID() : `tool_${Date.now()}`;
    const newSlug = `${tool.slug}-copy-${Math.floor(Math.random() * 900 + 100)}`;

    const duplicatedTool = {
      ...tool,
      id: newId,
      name: `${tool.name} (Copy)`,
      slug: newSlug,
      status: 'draft',
      is_mock: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const duplicatedPriv = {
      tool_id: newId,
      launch_url: priv?.launch_url || tool.launch_url || null,
      payment_url: priv?.payment_url || null,
      download_path: priv?.download_path || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (adminSupabase) {
      try {
        await adminSupabase.from('site_tools').insert([duplicatedTool]);
        await adminSupabase.from('site_tool_private').insert([duplicatedPriv]);
      } catch {}
    }

    if (!localStore.site_tools) localStore.site_tools = [];
    if (!localStore.site_tool_private) localStore.site_tool_private = [];
    localStore.site_tools.push(duplicatedTool);
    localStore.site_tool_private.push(duplicatedPriv);

    return res.status(201).json({ tool: { ...duplicatedTool, ...duplicatedPriv } });
  });

  // ---------------------------------------------------------------------------
  // 9. OPERATOR: DELETE /api/v1/site-tools/mocks ("Delete all mock tools")
  // ---------------------------------------------------------------------------
  app.delete('/api/v1/site-tools/mocks', authenticateApiKey, requireScope('WRITE_TOOLS', 'WRITE_MEDIA'), async (req: Request, res: Response) => {
    let deletedCount = 0;

    if (adminSupabase) {
      try {
        const { data } = await adminSupabase.from('site_tools').select('id').eq('is_mock', true);
        const ids = (data || []).map((t: any) => t.id);
        if (ids.length > 0) {
          await adminSupabase.from('site_tools').delete().in('id', ids);
          await adminSupabase.from('site_tool_private').delete().in('tool_id', ids);
          deletedCount = ids.length;
        }
      } catch (e) {
        console.warn('[site_tools delete mocks db catch]', e);
      }
    }

    if (localStore?.site_tools) {
      const initial = localStore.site_tools.length;
      const mockIds = new Set(localStore.site_tools.filter((t: any) => t.is_mock).map((t: any) => t.id));
      localStore.site_tools = localStore.site_tools.filter((t: any) => !t.is_mock);
      if (localStore.site_tool_private) {
        localStore.site_tool_private = localStore.site_tool_private.filter((p: any) => !mockIds.has(p.tool_id));
      }
      deletedCount = Math.max(deletedCount, initial - localStore.site_tools.length);
    }

    return res.json({ status: 'success', deleted: deletedCount });
  });

  // ---------------------------------------------------------------------------
  // 10. OPERATOR: POST /api/v1/site-tools/image (Upload tool thumbnail, max 5 MB)
  // ---------------------------------------------------------------------------
  app.post(
    '/api/v1/site-tools/image',
    authenticateApiKey,
    requireScope('WRITE_TOOLS', 'WRITE_MEDIA'),
    (imageUpload.single('file') as any),
    async (req: Request, res: Response) => {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'validation', message: 'No image file provided' });
      }

      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedMimes.includes(file.mimetype)) {
        return res.status(400).json({ error: 'validation', message: 'Image must be JPEG, PNG, or WebP.' });
      }

      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'validation', message: 'Image exceeds 5 MB limit.' });
      }

      const ext = file.mimetype === 'image/png' ? 'png' : file.mimetype === 'image/webp' ? 'webp' : 'jpg';
      const fileId = crypto.randomUUID ? crypto.randomUUID() : `tool_${Date.now()}`;
      const storagePath = `tools/${fileId}.${ext}`;

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
          console.error('[Tool Image Upload Storage Error]', upErr);
          return res.status(500).json({ error: 'Storage Upload Failed', message: upErr.message });
        } catch (uploadEx: any) {
          console.error('[Tool Image Upload Exception]', uploadEx);
          return res.status(500).json({ error: 'Storage Exception', message: uploadEx?.message });
        }
      }

      // Local fallback
      try {
        const localDir = path.join(process.cwd(), 'public', 'media', 'tools');
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
        }
        fs.writeFileSync(path.join(localDir, `${fileId}.${ext}`), file.buffer);
      } catch (diskErr) {
        console.warn('Local disk write error:', diskErr);
      }

      return res.json({
        image_url: `/media/${storagePath}`,
        image_path: storagePath,
        warning: 'Saved to local ephemeral disk. Configure Supabase storage to persist uploads.',
      });
    }
  );

  // ---------------------------------------------------------------------------
  // 11. OPERATOR: POST /api/v1/site-tools/upload-file (Upload downloadable package)
  // ---------------------------------------------------------------------------
  app.post(
    '/api/v1/site-tools/upload-file',
    authenticateApiKey,
    requireScope('WRITE_TOOLS', 'WRITE_MEDIA'),
    (submissionUpload.single('file') as any),
    async (req: Request, res: Response) => {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'validation', message: 'No file provided' });
      }

      const fileId = crypto.randomUUID ? crypto.randomUUID() : `dl_${Date.now()}`;
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `tool-downloads/${fileId}_${cleanName}`;

      if (adminSupabase) {
        try {
          await adminSupabase.storage.from('tool-submissions').upload(storagePath, file.buffer, {
            contentType: file.mimetype || 'application/octet-stream',
            upsert: true,
          });
        } catch {}
      }

      return res.json({
        file_path: storagePath,
        file_name: cleanName,
      });
    }
  );

  // ---------------------------------------------------------------------------
  // 12. OPERATOR: SUBMISSIONS MANAGEMENT
  // ---------------------------------------------------------------------------
  app.get('/api/v1/site-tools/submissions', authenticateApiKey, requireScope('READ_TOOLS'), async (req: Request, res: Response) => {
    const toolId = req.query.tool_id as string | undefined;
    const status = req.query.status as string | undefined;

    let list: ToolSubmissionItem[] = [];

    if (adminSupabase) {
      try {
        let q = adminSupabase.from('tool_submissions').select('*').order('created_at', { ascending: false });
        if (toolId) q = q.eq('tool_id', toolId);
        if (status && status !== 'all') q = q.eq('status', status);
        const { data, error } = await q;
        if (!error && data) list = data;
      } catch {}
    }

    if (!list.length && localStore?.tool_submissions) {
      list = (localStore.tool_submissions as ToolSubmissionItem[]).filter((s) => {
        if (toolId && s.tool_id !== toolId) return false;
        if (status && status !== 'all' && s.status !== status) return false;
        return true;
      });
    }

    // Attach signed URLs for uploaded files
    const enriched = await Promise.all(
      list.map(async (sub) => {
        const fileUrls: { path: string; url: string }[] = [];
        for (const fp of sub.file_paths || []) {
          let url = fp;
          if (adminSupabase) {
            try {
              const { data } = await adminSupabase.storage.from('tool-submissions').createSignedUrl(fp, 3600);
              if (data?.signedUrl) url = data.signedUrl;
            } catch {}
          }
          fileUrls.push({ path: fp, url });
        }

        let signedDeliverable: string | null = null;
        if (sub.deliverable_path && adminSupabase) {
          try {
            const { data } = await adminSupabase.storage.from('tool-submissions').createSignedUrl(sub.deliverable_path, 3600);
            if (data?.signedUrl) signedDeliverable = data.signedUrl;
          } catch {}
        }

        return {
          ...sub,
          signed_file_urls: fileUrls,
          signed_deliverable_url: signedDeliverable || sub.deliverable_path,
        };
      })
    );

    return res.json({ submissions: enriched });
  });

  app.patch('/api/v1/site-tools/submissions/:id', authenticateApiKey, requireScope('WRITE_TOOLS'), async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body || {};
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };

    if (body.status !== undefined) updates.status = body.status;
    if (body.payment_status !== undefined) updates.payment_status = body.payment_status;
    if (body.operator_notes !== undefined) updates.operator_notes = String(body.operator_notes);
    if (body.amount_due !== undefined) updates.amount_due = body.amount_due !== null ? Number(body.amount_due) : null;
    if (body.deliverable_path !== undefined) updates.deliverable_path = body.deliverable_path;

    if (adminSupabase) {
      try {
        await adminSupabase.from('tool_submissions').update(updates).eq('id', id);
      } catch {}
    }

    let updated: any = null;
    if (localStore?.tool_submissions) {
      const idx = localStore.tool_submissions.findIndex((s: any) => s.id === id);
      if (idx !== -1) {
        localStore.tool_submissions[idx] = { ...localStore.tool_submissions[idx], ...updates };
        updated = localStore.tool_submissions[idx];
      }
    }

    return res.json({ status: 'updated', id, submission: updated || updates });
  });

  app.delete('/api/v1/site-tools/submissions/:id', authenticateApiKey, requireScope('WRITE_TOOLS'), async (req: Request, res: Response) => {
    const { id } = req.params;

    // Remove files from bucket if possible
    let sub: any = (localStore?.tool_submissions || []).find((s: any) => s.id === id);
    if (adminSupabase) {
      try {
        const { data } = await adminSupabase.from('tool_submissions').select('*').eq('id', id).maybeSingle();
        if (data) sub = data;
        if (sub?.file_paths && Array.isArray(sub.file_paths)) {
          await adminSupabase.storage.from('tool-submissions').remove(sub.file_paths);
        }
        if (sub?.deliverable_path) {
          await adminSupabase.storage.from('tool-submissions').remove([sub.deliverable_path]);
        }
        await adminSupabase.from('tool_submissions').delete().eq('id', id);
      } catch {}
    }

    if (localStore?.tool_submissions) {
      localStore.tool_submissions = localStore.tool_submissions.filter((s: any) => s.id !== id);
    }

    return res.json({ status: 'deleted', id });
  });

  // Upload finished deliverable for submission
  app.post(
    '/api/v1/site-tools/submissions/:id/deliverable',
    authenticateApiKey,
    requireScope('WRITE_TOOLS'),
    (submissionUpload.single('file') as any),
    async (req: Request, res: Response) => {
      const { id } = req.params;
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'validation', message: 'No deliverable file provided' });
      }

      const fileId = crypto.randomUUID ? crypto.randomUUID() : `del_${Date.now()}`;
      const cleanName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `deliverables/${id}/${fileId}_${cleanName}`;

      let signedUrl = '';
      if (adminSupabase) {
        try {
          await adminSupabase.storage.from('tool-submissions').upload(storagePath, file.buffer, {
            contentType: file.mimetype || 'application/octet-stream',
            upsert: true,
          });
          const { data } = await adminSupabase.storage.from('tool-submissions').createSignedUrl(storagePath, 7 * 86400);
          if (data?.signedUrl) signedUrl = data.signedUrl;

          await adminSupabase
            .from('tool_submissions')
            .update({ deliverable_path: storagePath, status: 'delivered', updated_at: new Date().toISOString() })
            .eq('id', id);
        } catch {}
      }

      if (localStore?.tool_submissions) {
        const s = localStore.tool_submissions.find((item: any) => item.id === id);
        if (s) {
          s.deliverable_path = storagePath;
          s.status = 'delivered';
          s.updated_at = new Date().toISOString();
        }
      }

      return res.json({
        status: 'delivered',
        deliverable_path: storagePath,
        signed_url: signedUrl,
      });
    }
  );

  // Generate 7-day signed shareable link for client deliverable
  app.get('/api/v1/site-tools/submissions/:id/shareable-link', authenticateApiKey, requireScope('READ_TOOLS'), async (req: Request, res: Response) => {
    const { id } = req.params;
    let sub: any = (localStore?.tool_submissions || []).find((s: any) => s.id === id);

    if (adminSupabase) {
      try {
        const { data } = await adminSupabase.from('tool_submissions').select('*').eq('id', id).maybeSingle();
        if (data) sub = data;
      } catch {}
    }

    if (!sub || !sub.deliverable_path) {
      return res.status(404).json({ error: 'not_found', message: 'No deliverable uploaded for this submission yet.' });
    }

    let signedUrl = sub.deliverable_path;
    if (adminSupabase) {
      try {
        const { data } = await adminSupabase.storage.from('tool-submissions').createSignedUrl(sub.deliverable_path, 7 * 86400);
        if (data?.signedUrl) signedUrl = data.signedUrl;
      } catch {}
    }

    return res.json({
      signed_url: signedUrl,
      expires_at: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
    });
  });
}
