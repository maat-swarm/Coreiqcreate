/**
 * Execution Engine for Resource Registry Tools & REST Machine Routes
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { getRegistryToolByName, RegistryToolDefinition } from './resourceRegistry';
import { hasScope } from '../shared/scopes';
import { validateUrl, sanitizeText, sanitizeRecord, maskSecrets } from './validators';
import { CONTENT_MANIFEST } from '../data/contentManifest';
import {
  getContentByKey,
  resolveContentInternal,
  verifyContentInternal,
  getPagePlaceholders,
  getAllContent
} from '../mcp/coreiqMcp';

export interface ExecutionContext {
  supabase?: SupabaseClient | null;
  adminSupabase?: SupabaseClient | null;
  db?: SupabaseClient | null;
  localStore?: Record<string, any[]>;
  store?: Record<string, any[]>;
  callerApiKey?: any;
  isOperatorSession?: boolean;
}

export interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  isNotFound?: boolean;
  isForbidden?: boolean;
  isDuplicate?: boolean;
  statusCode?: number;
}

/**
 * Log machine API write actions to api_audit table
 */
export async function logApiAudit(
  ctx: ExecutionContext,
  route: string,
  method: string,
  status: number,
  resourceId?: string | null
): Promise<void> {
  const key = ctx.callerApiKey;
  if (!key) return;

  const auditEntry = {
    id: crypto.randomUUID ? crypto.randomUUID() : `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    key_id: key.id || 'unknown_key',
    key_name: key.name || 'API Key',
    route,
    method: method.toUpperCase(),
    resource_id: resourceId || null,
    status,
    created_at: new Date().toISOString(),
  };

  const dbClient = ctx.adminSupabase || ctx.supabase || ctx.db;
  if (dbClient) {
    try {
      await dbClient.from('api_audit').insert([auditEntry]);
    } catch (e) {
      console.warn('[CoreIQ Audit Log DB Warning]:', e);
    }
  }

  const store = ctx.localStore || ctx.store;
  if (store) {
    if (!store.api_audit) {
      store.api_audit = [];
    }
    store.api_audit.unshift(auditEntry);
    if (store.api_audit.length > 200) {
      store.api_audit = store.api_audit.slice(0, 200);
    }
  }
}

/**
 * Normalizes URL keys for uniqueness checks
 */
export function normalizeUrlKey(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const clean = url.trim().toLowerCase().replace(/\/+$/, '');
  if (!clean) return null;
  return clean;
}

export async function executeRegistryTool(
  toolName: string,
  rawArgs: Record<string, any> = {},
  ctx: ExecutionContext
): Promise<ExecutionResult> {
  const tool = getRegistryToolByName(toolName);
  if (!tool) {
    return { success: false, error: `Tool '${toolName}' not found in registry`, isNotFound: true };
  }

  // Check required scope
  if (tool.requiredScope !== 'PUBLIC') {
    const grantedScopes = ctx.callerApiKey?.scopes || [];
    if (!hasScope(grantedScopes, tool.requiredScope)) {
      return {
        success: false,
        error: `Forbidden: API key does not have the required '${tool.requiredScope}' scope.`,
        isForbidden: true,
        statusCode: 403,
      };
    }
  }

  const db = ctx.adminSupabase || ctx.supabase || ctx.db;
  const store = ctx.localStore || ctx.store || {};
  const args = sanitizeRecord(rawArgs);

  try {
    switch (toolName) {
      // --- UTILITY ---
      case 'site_ping': {
        return {
          success: true,
          data: {
            status: 'online',
            system: 'CoreIQ Command Autonomous Engine',
            timestamp: new Date().toISOString(),
            supabase_configured: Boolean(db),
          },
        };
      }

      case 'site_capabilities': {
        const callerName = ctx.callerApiKey?.name || 'Anonymous / Unauthenticated';
        const grantedScopes = ctx.callerApiKey?.scopes || [];
        return {
          success: true,
          data: {
            status: 'online',
            caller_identity: callerName,
            granted_scopes: grantedScopes,
            base_url: process.env.SITE_URL || 'https://coreiqcreate.onrender.com',
            mcp_endpoint: '/mcp',
            mcp_key_url_pattern: '/mcp/k/<api-key>',
            rest_v1_prefix: '/api/v1',
            openapi_spec: '/openapi.json',
          },
        };
      }

      // --- NEWS ---
      case 'site_news_list': {
        const limit = Math.min(Math.max(Number(args.limit) || 25, 1), 100);
        const offset = Math.max(Number(args.offset) || 0, 0);
        let items: any[] = [];

        if (db) {
          try {
            let q = db.from('news_articles').select('*').order('sort_order', { ascending: true }).order('created_at', { ascending: false });
            if (args.category && args.category !== 'All') {
              q = q.eq('category', args.category);
            }
            if (args.published_only) {
              q = q.eq('published', true);
            }
            const { data } = await q.range(offset, offset + limit - 1);
            if (data) items = data;
          } catch {}
        }
        if (!items.length && store.news_articles) {
          items = store.news_articles
            .filter((a: any) => {
              if (args.published_only && !a.published) return false;
              if (args.category && args.category !== 'All' && a.category !== args.category) return false;
              return true;
            })
            .slice(offset, offset + limit);
        }
        return { success: true, data: { count: items.length, articles: maskSecrets(items) } };
      }

      case 'site_news_get': {
        const target = args.id_or_slug || args.id || args.slug;
        let item: any = null;
        if (db) {
          try {
            const { data } = await db
              .from('news_articles')
              .select('*')
              .or(`id.eq.${target},slug.eq.${target}`)
              .maybeSingle();
            if (data) item = data;
          } catch {}
        }
        if (!item && store.news_articles) {
          item = store.news_articles.find((a: any) => a.id === target || a.slug === target);
        }
        if (!item) {
          return { success: false, error: `Article '${target}' not found`, isNotFound: true, statusCode: 404 };
        }
        return { success: true, data: { article: maskSecrets(item) } };
      }

      case 'site_news_create': {
        if (!args.title || !args.summary || !args.body) {
          return { success: false, error: 'title, summary, and body are required fields', statusCode: 400 };
        }

        // Validate URLs
        if (args.source_url) {
          const check = validateUrl(args.source_url, false);
          if (!check.isValid) return { success: false, error: check.error || 'Invalid source_url', statusCode: 400 };
        }
        if (args.image_url) {
          const check = validateUrl(args.image_url, true);
          if (!check.isValid) return { success: false, error: check.error || 'Invalid image_url', statusCode: 400 };
        }

        const urlKey = normalizeUrlKey(args.source_url);
        // Duplicate url_key check
        if (urlKey) {
          let duplicate: any = null;
          if (db) {
            try {
              const { data } = await db.from('news_articles').select('id, title').eq('url_key', urlKey).maybeSingle();
              if (data) duplicate = data;
            } catch {}
          }
          if (!duplicate && store.news_articles) {
            duplicate = store.news_articles.find((a: any) => a.url_key === urlKey);
          }
          if (duplicate) {
            return {
              success: false,
              error: `DUPLICATE: Article with source url_key already exists (${duplicate.id})`,
              isDuplicate: true,
              statusCode: 409,
              data: { error: 'DUPLICATE', existing_id: duplicate.id, id: duplicate.id },
            };
          }
        }

        // Publication check
        const canPublish = hasScope(ctx.callerApiKey?.scopes, 'PUBLISH_NEWS') || ctx.callerApiKey?.scopes?.includes('*');
        const isPublished = Boolean(args.publish) && canPublish;

        const generatedSlug = (args.slug && String(args.slug).trim()) || String(args.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const newArticle = {
          id: crypto.randomUUID ? crypto.randomUUID() : `news_${Date.now()}`,
          slug: generatedSlug,
          title: String(args.title).trim(),
          summary: String(args.summary).trim(),
          body: String(args.body).trim(),
          category: args.category || 'Frontier Models',
          hero_image: args.image_url || null,
          image_url: args.image_url || null,
          author: args.author || 'CoreIQ Intelligence Desk',
          read_time: args.read_time || '4 min read',
          badge: args.badge || (isPublished ? 'UPDATE' : 'DRAFT'),
          featured: Boolean(args.featured || args.is_lead),
          is_lead: Boolean(args.is_lead),
          tags: Array.isArray(args.tags) ? args.tags : (typeof args.tags === 'string' ? args.tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
          takeaways: Array.isArray(args.takeaways) ? args.takeaways : (typeof args.takeaways === 'string' ? args.takeaways.split('\n').map((t: string) => t.trim()).filter(Boolean) : []),
          source: args.source || 'CoreIQ Frontier Intelligence',
          source_name: args.source_name || args.source || 'CoreIQ Frontier Intelligence',
          source_url: args.source_url || null,
          url_key: urlKey,
          accent_color: args.accent_color || 'cyan',
          published: isPublished,
          sort_order: args.sort_order !== undefined ? parseInt(args.sort_order, 10) : 0,
          rank: args.rank !== undefined ? parseInt(args.rank, 10) : 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (db) {
          try {
            const { data, error } = await db.from('news_articles').insert([newArticle]).select().single();
            if (!error && data) {
              await logApiAudit(ctx, '/api/v1/admin/news', 'POST', 201, data.id);
              return { success: true, data: { status: 'created', article: maskSecrets(data) } };
            }
          } catch (e: any) {
            console.error('[site_news_create error]', e);
          }
        }

        if (!store.news_articles) store.news_articles = [];
        store.news_articles.unshift(newArticle);
        await logApiAudit(ctx, '/api/v1/admin/news', 'POST', 201, newArticle.id);
        return { success: true, data: { status: 'created', article: maskSecrets(newArticle) } };
      }

      case 'site_news_update': {
        const id = args.id;
        if (!id) return { success: false, error: 'Article ID is required', statusCode: 400 };

        const updates: any = { ...args, updated_at: new Date().toISOString() };
        delete updates.id;

        if (updates.image_url) {
          const check = validateUrl(updates.image_url, true);
          if (!check.isValid) return { success: false, error: check.error || 'Invalid image_url', statusCode: 400 };
          updates.hero_image = updates.image_url;
        }

        if (updates.published !== undefined) {
          const canPublish = hasScope(ctx.callerApiKey?.scopes, 'PUBLISH_NEWS');
          if (!canPublish) {
            delete updates.published;
          }
        }

        let updated: any = null;
        if (db) {
          try {
            const { data } = await db.from('news_articles').update(updates).eq('id', id).select().maybeSingle();
            if (data) updated = data;
          } catch {}
        }
        if (!updated && store.news_articles) {
          const item = store.news_articles.find((a: any) => a.id === id);
          if (item) {
            Object.assign(item, updates);
            updated = item;
          }
        }
        if (!updated) {
          return { success: false, error: `Article '${id}' not found`, isNotFound: true, statusCode: 404 };
        }
        await logApiAudit(ctx, `/api/v1/admin/news/${id}`, 'PATCH', 200, id);
        return { success: true, data: { status: 'updated', article: maskSecrets(updated) } };
      }

      case 'site_news_publish': {
        const id = args.id;
        if (!id) return { success: false, error: 'Article ID is required', statusCode: 400 };
        const updates: any = { published: true, updated_at: new Date().toISOString() };
        if (args.is_lead !== undefined) {
          updates.is_lead = Boolean(args.is_lead);
          updates.featured = Boolean(args.is_lead);
        }

        let publishedItem: any = null;
        if (db) {
          try {
            const { data } = await db.from('news_articles').update(updates).eq('id', id).select().maybeSingle();
            if (data) publishedItem = data;
          } catch {}
        }
        if (!publishedItem && store.news_articles) {
          const item = store.news_articles.find((a: any) => a.id === id);
          if (item) {
            Object.assign(item, updates);
            publishedItem = item;
          }
        }
        if (!publishedItem) {
          return { success: false, error: `Article '${id}' not found`, isNotFound: true, statusCode: 404 };
        }
        await logApiAudit(ctx, `/api/v1/admin/news/${id}/publish`, 'POST', 200, id);
        return { success: true, data: { status: 'published', article: maskSecrets(publishedItem) } };
      }

      case 'site_news_unpublish': {
        const id = args.id;
        if (!id) return { success: false, error: 'Article ID is required', statusCode: 400 };
        const updates = { published: false, updated_at: new Date().toISOString() };

        let item: any = null;
        if (db) {
          try {
            const { data } = await db.from('news_articles').update(updates).eq('id', id).select().maybeSingle();
            if (data) item = data;
          } catch {}
        }
        if (!item && store.news_articles) {
          const localItem = store.news_articles.find((a: any) => a.id === id);
          if (localItem) {
            Object.assign(localItem, updates);
            item = localItem;
          }
        }
        if (!item) return { success: false, error: `Article '${id}' not found`, isNotFound: true, statusCode: 404 };
        await logApiAudit(ctx, `/api/v1/admin/news/${id}/unpublish`, 'POST', 200, id);
        return { success: true, data: { status: 'unpublished', article: maskSecrets(item) } };
      }

      case 'site_news_delete': {
        const id = args.id;
        if (!id) return { success: false, error: 'Article ID is required', statusCode: 400 };

        if (db) {
          try {
            await db.from('news_articles').delete().eq('id', id);
          } catch {}
        }
        if (store.news_articles) {
          store.news_articles = store.news_articles.filter((a: any) => a.id !== id);
        }
        await logApiAudit(ctx, `/api/v1/admin/news/${id}`, 'DELETE', 200, id);
        return { success: true, data: { status: 'deleted', id } };
      }

      // --- USE CASES ---
      case 'site_use_cases_list_categories': {
        let categories: any[] = [];
        if (db) {
          try {
            const { data } = await db.from('use_case_categories').select('*').order('sort_order', { ascending: true });
            if (data) categories = data;
          } catch {}
        }
        if (!categories.length && store.use_case_categories) {
          categories = store.use_case_categories;
        }
        return { success: true, data: { categories } };
      }

      case 'site_use_cases_list': {
        const limit = Math.min(Math.max(Number(args.limit) || 25, 1), 100);
        const offset = Math.max(Number(args.offset) || 0, 0);
        let items: any[] = [];

        if (db) {
          try {
            let q = db.from('use_cases').select('*').order('sort_order', { ascending: true });
            if (args.category_slug) q = q.eq('category_slug', args.category_slug);
            if (args.published_only) q = q.eq('published', true);
            const { data } = await q.range(offset, offset + limit - 1);
            if (data) items = data;
          } catch {}
        }
        if (!items.length && store.use_cases) {
          items = store.use_cases.filter((u: any) => {
            if (args.published_only && !u.published) return false;
            if (args.category_slug && u.category_slug !== args.category_slug) return false;
            return true;
          }).slice(offset, offset + limit);
        }
        return { success: true, data: { count: items.length, use_cases: items } };
      }

      case 'site_use_cases_get': {
        const id = args.id;
        if (!id) return { success: false, error: 'ID is required', statusCode: 400 };
        let item: any = null;
        let files: any[] = [];

        if (db) {
          try {
            const { data } = await db.from('use_cases').select('*').eq('id', id).maybeSingle();
            if (data) item = data;
            const { data: fileData } = await db.from('use_case_files').select('*').eq('use_case_id', id);
            if (fileData) files = fileData;
          } catch {}
        }
        if (!item && store.use_cases) {
          item = store.use_cases.find((u: any) => u.id === id);
        }
        if (!item) return { success: false, error: `Use case '${id}' not found`, isNotFound: true, statusCode: 404 };
        return { success: true, data: { use_case: item, files } };
      }

      case 'site_use_cases_create': {
        if (!args.category_slug || !args.title || !args.problem || !args.approach || !args.outcome) {
          return { success: false, error: 'category_slug, title, problem, approach, outcome are required', statusCode: 400 };
        }
        if (args.image_url) {
          const check = validateUrl(args.image_url, true);
          if (!check.isValid) return { success: false, error: check.error || 'Invalid image_url', statusCode: 400 };
        }

        const canPublish = hasScope(ctx.callerApiKey?.scopes, 'PUBLISH_USE_CASES');
        const isPublished = Boolean(args.publish) && canPublish;

        const newCase = {
          id: crypto.randomUUID ? crypto.randomUUID() : `uc_${Date.now()}`,
          category_slug: args.category_slug,
          title: args.title,
          problem: args.problem,
          approach: args.approach,
          outcome: args.outcome,
          audience: args.audience || 'business',
          industry_tags: Array.isArray(args.industry_tags) ? args.industry_tags : (typeof args.industry_tags === 'string' ? args.industry_tags.split(',').map((t: string) => t.trim()).filter(Boolean) : []),
          image_url: args.image_url || null,
          image_alt: args.image_alt || args.title,
          published: isPublished,
          sort_order: args.sort_order ? parseInt(args.sort_order, 10) : 10,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (db) {
          try {
            const { data } = await db.from('use_cases').insert([newCase]).select().single();
            if (data) {
              await logApiAudit(ctx, '/api/v1/admin/use-cases', 'POST', 201, data.id);
              return { success: true, data: { status: 'created', use_case: data } };
            }
          } catch {}
        }
        if (!store.use_cases) store.use_cases = [];
        store.use_cases.unshift(newCase);
        await logApiAudit(ctx, '/api/v1/admin/use-cases', 'POST', 201, newCase.id);
        return { success: true, data: { status: 'created', use_case: newCase } };
      }

      case 'site_use_cases_update': {
        const id = args.id;
        if (!id) return { success: false, error: 'ID is required', statusCode: 400 };
        const updates: any = { ...args, updated_at: new Date().toISOString() };
        delete updates.id;

        if (updates.image_url) {
          const check = validateUrl(updates.image_url, true);
          if (!check.isValid) return { success: false, error: check.error || 'Invalid image_url', statusCode: 400 };
        }

        let updated: any = null;
        if (db) {
          try {
            const { data } = await db.from('use_cases').update(updates).eq('id', id).select().maybeSingle();
            if (data) updated = data;
          } catch {}
        }
        if (!updated && store.use_cases) {
          const item = store.use_cases.find((u: any) => u.id === id);
          if (item) {
            Object.assign(item, updates);
            updated = item;
          }
        }
        if (!updated) return { success: false, error: `Use case '${id}' not found`, isNotFound: true, statusCode: 404 };
        await logApiAudit(ctx, `/api/v1/admin/use-cases/${id}`, 'PATCH', 200, id);
        return { success: true, data: { status: 'updated', use_case: updated } };
      }

      case 'site_use_cases_publish': {
        const id = args.id;
        if (!id) return { success: false, error: 'ID is required', statusCode: 400 };
        let item: any = null;
        if (db) {
          try {
            const { data } = await db.from('use_cases').update({ published: true, updated_at: new Date().toISOString() }).eq('id', id).select().maybeSingle();
            if (data) item = data;
          } catch {}
        }
        if (!item && store.use_cases) {
          const localItem = store.use_cases.find((u: any) => u.id === id);
          if (localItem) {
            localItem.published = true;
            item = localItem;
          }
        }
        if (!item) return { success: false, error: `Use case '${id}' not found`, isNotFound: true, statusCode: 404 };
        await logApiAudit(ctx, `/api/v1/admin/use-cases/${id}/publish`, 'POST', 200, id);
        return { success: true, data: { status: 'published', use_case: item } };
      }

      case 'site_use_cases_unpublish': {
        const id = args.id;
        if (!id) return { success: false, error: 'ID is required', statusCode: 400 };
        let item: any = null;
        if (db) {
          try {
            const { data } = await db.from('use_cases').update({ published: false, updated_at: new Date().toISOString() }).eq('id', id).select().maybeSingle();
            if (data) item = data;
          } catch {}
        }
        if (!item && store.use_cases) {
          const localItem = store.use_cases.find((u: any) => u.id === id);
          if (localItem) {
            localItem.published = false;
            item = localItem;
          }
        }
        if (!item) return { success: false, error: `Use case '${id}' not found`, isNotFound: true, statusCode: 404 };
        await logApiAudit(ctx, `/api/v1/admin/use-cases/${id}/unpublish`, 'POST', 200, id);
        return { success: true, data: { status: 'unpublished', use_case: item } };
      }

      case 'site_use_cases_delete': {
        const id = args.id;
        if (!id) return { success: false, error: 'ID is required', statusCode: 400 };
        if (db) {
          try {
            await db.from('use_cases').delete().eq('id', id);
          } catch {}
        }
        if (store.use_cases) {
          store.use_cases = store.use_cases.filter((u: any) => u.id !== id);
        }
        await logApiAudit(ctx, `/api/v1/admin/use-cases/${id}`, 'DELETE', 200, id);
        return { success: true, data: { status: 'deleted', id } };
      }

      case 'site_use_cases_list_files': {
        const useCaseId = args.use_case_id;
        let files: any[] = [];
        if (db) {
          try {
            const { data } = await db.from('use_case_files').select('*').eq('use_case_id', useCaseId);
            if (data) files = data;
          } catch {}
        }
        if (!files.length && store.use_case_files) {
          files = store.use_case_files.filter((f: any) => f.use_case_id === useCaseId);
        }
        return { success: true, data: { count: files.length, files } };
      }

      case 'site_use_cases_add_file_metadata': {
        const { use_case_id, label, file_name, storage_path, file_size_bytes, mime_type } = args;
        if (!use_case_id || !label || !file_name || !storage_path) {
          return { success: false, error: 'use_case_id, label, file_name, and storage_path are required', statusCode: 400 };
        }
        const newFile = {
          id: crypto.randomUUID ? crypto.randomUUID() : `ucf_${Date.now()}`,
          use_case_id,
          label,
          file_name,
          storage_path,
          file_size_bytes: file_size_bytes ? Number(file_size_bytes) : 0,
          mime_type: mime_type || 'application/octet-stream',
          created_at: new Date().toISOString(),
        };
        if (db) {
          try {
            const { data } = await db.from('use_case_files').insert([newFile]).select().single();
            if (data) {
              await logApiAudit(ctx, `/api/v1/admin/use-cases/${use_case_id}/file-metadata`, 'POST', 201, data.id);
              return { success: true, data: { status: 'created', file: data } };
            }
          } catch {}
        }
        if (!store.use_case_files) store.use_case_files = [];
        store.use_case_files.push(newFile);
        await logApiAudit(ctx, `/api/v1/admin/use-cases/${use_case_id}/file-metadata`, 'POST', 201, newFile.id);
        return { success: true, data: { status: 'created', file: newFile } };
      }

      case 'site_use_cases_remove_file_metadata': {
        const { file_id } = args;
        if (!file_id) return { success: false, error: 'file_id is required', statusCode: 400 };
        if (db) {
          try {
            await db.from('use_case_files').delete().eq('id', file_id);
          } catch {}
        }
        if (store.use_case_files) {
          store.use_case_files = store.use_case_files.filter((f: any) => f.id !== file_id);
        }
        await logApiAudit(ctx, `/api/v1/use-cases/files/${file_id}`, 'DELETE', 200, file_id);
        return { success: true, data: { status: 'deleted', file_id } };
      }

      // --- STORE ---
      case 'site_store_list_apps': {
        let apps: any[] = [];
        if (db) {
          try {
            let q = db.from('store_apps').select('*').order('sort_order', { ascending: true });
            if (args.category) q = q.eq('category', args.category);
            if (args.status) q = q.eq('status', args.status);
            const { data } = await q;
            if (data) apps = data;
          } catch {}
        }
        if (!apps.length && store.store_apps) {
          apps = store.store_apps.filter((a: any) => {
            if (args.category && a.category !== args.category) return false;
            if (args.status && a.status !== args.status) return false;
            return true;
          });
        }
        return { success: true, data: { count: apps.length, apps: maskSecrets(apps) } };
      }

      case 'site_store_get_app': {
        const target = args.id_or_slug;
        let appItem: any = null;
        if (db) {
          try {
            const { data } = await db.from('store_apps').select('*').or(`id.eq.${target},slug.eq.${target}`).maybeSingle();
            if (data) appItem = data;
          } catch {}
        }
        if (!appItem && store.store_apps) {
          appItem = store.store_apps.find((a: any) => a.id === target || a.slug === target);
        }
        if (!appItem) return { success: false, error: `App '${target}' not found`, isNotFound: true, statusCode: 404 };
        return { success: true, data: { app: maskSecrets(appItem) } };
      }

      case 'site_store_create_app': {
        if (!args.title || !args.tagline || !args.description || !args.category) {
          return { success: false, error: 'title, tagline, description, and category are required', statusCode: 400 };
        }
        if (args.external_url) {
          const check = validateUrl(args.external_url, true);
          if (!check.isValid) return { success: false, error: check.error || 'Invalid external_url', statusCode: 400 };
        }

        const slug = (args.slug && String(args.slug).trim()) || String(args.title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const newApp = {
          id: crypto.randomUUID ? crypto.randomUUID() : `app_${Date.now()}`,
          slug,
          title: args.title,
          tagline: args.tagline,
          description: args.description,
          category: args.category,
          status: args.status || 'draft',
          price_mode: args.price_mode || 'free',
          price_amount: args.price_amount !== undefined ? Number(args.price_amount) : 0,
          currency: args.currency || 'USD',
          distribution_type: args.distribution_type || 'download',
          external_url: args.external_url || '',
          sort_order: args.sort_order ? parseInt(args.sort_order, 10) : 50,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (db) {
          try {
            const { data } = await db.from('store_apps').insert([newApp]).select().single();
            if (data) {
              await logApiAudit(ctx, '/api/v1/store/apps', 'POST', 201, data.id);
              return { success: true, data: { status: 'created', app: maskSecrets(data) } };
            }
          } catch {}
        }
        if (!store.store_apps) store.store_apps = [];
        store.store_apps.push(newApp);
        await logApiAudit(ctx, '/api/v1/store/apps', 'POST', 201, newApp.id);
        return { success: true, data: { status: 'created', app: maskSecrets(newApp) } };
      }

      case 'site_store_update_app': {
        const id = args.id;
        if (!id) return { success: false, error: 'ID is required', statusCode: 400 };
        const updates: any = { ...args, updated_at: new Date().toISOString() };
        delete updates.id;

        if (updates.external_url) {
          const check = validateUrl(updates.external_url, true);
          if (!check.isValid) return { success: false, error: check.error || 'Invalid external_url', statusCode: 400 };
        }

        let updated: any = null;
        if (db) {
          try {
            const { data } = await db.from('store_apps').update(updates).eq('id', id).select().maybeSingle();
            if (data) updated = data;
          } catch {}
        }
        if (!updated && store.store_apps) {
          const item = store.store_apps.find((a: any) => a.id === id);
          if (item) {
            Object.assign(item, updates);
            updated = item;
          }
        }
        if (!updated) return { success: false, error: `App '${id}' not found`, isNotFound: true, statusCode: 404 };
        await logApiAudit(ctx, `/api/v1/store/apps/${id}`, 'PATCH', 200, id);
        return { success: true, data: { status: 'updated', app: maskSecrets(updated) } };
      }

      case 'site_store_delete_app': {
        const id = args.id;
        if (!id) return { success: false, error: 'ID is required', statusCode: 400 };
        if (db) {
          try {
            await db.from('store_apps').delete().eq('id', id);
          } catch {}
        }
        if (store.store_apps) {
          store.store_apps = store.store_apps.filter((a: any) => a.id !== id);
        }
        await logApiAudit(ctx, `/api/v1/store/apps/${id}`, 'DELETE', 200, id);
        return { success: true, data: { status: 'deleted', id } };
      }

      case 'site_store_list_requests': {
        let requests: any[] = [];
        if (db) {
          try {
            let q = db.from('app_requests').select('*').order('created_at', { ascending: false });
            if (args.status) q = q.eq('status', args.status);
            const { data } = await q;
            if (data) requests = data;
          } catch {}
        }
        if (!requests.length && store.app_requests) {
          requests = store.app_requests;
        }
        return { success: true, data: { count: requests.length, requests: maskSecrets(requests) } };
      }

      case 'site_store_update_request_status': {
        const { id, status, notes } = args;
        if (!id || !status) return { success: false, error: 'id and status are required', statusCode: 400 };
        const updates: any = { status, updated_at: new Date().toISOString() };
        if (notes !== undefined) updates.operator_notes = notes;

        let updated: any = null;
        if (db) {
          try {
            const { data } = await db.from('app_requests').update(updates).eq('id', id).select().maybeSingle();
            if (data) updated = data;
          } catch {}
        }
        if (!updated && store.app_requests) {
          const item = store.app_requests.find((r: any) => r.id === id);
          if (item) {
            Object.assign(item, updates);
            updated = item;
          }
        }
        if (!updated) return { success: false, error: `Request '${id}' not found`, isNotFound: true, statusCode: 404 };
        await logApiAudit(ctx, `/api/v1/store/requests/${id}`, 'PATCH', 200, id);
        return { success: true, data: { status: 'updated', request: maskSecrets(updated) } };
      }

      case 'site_store_get_payment_settings': {
        let settings: any = null;
        if (db) {
          try {
            const { data } = await db.from('store_settings').select('value').eq('key', 'payment').maybeSingle();
            if (data) settings = data.value;
          } catch {}
        }
        if (!settings && store.store_settings) {
          const item = store.store_settings.find((s: any) => s.key === 'payment');
          if (item) settings = item.value;
        }
        return { success: true, data: { settings: settings || {} } };
      }

      case 'site_store_update_payment_settings': {
        if (!args.value || typeof args.value !== 'object') {
          return { success: false, error: 'value object is required', statusCode: 400 };
        }
        const payload = {
          key: 'payment',
          value: args.value,
          updated_at: new Date().toISOString(),
        };
        if (db) {
          try {
            await db.from('store_settings').upsert(payload);
          } catch {}
        }
        if (store.store_settings) {
          const item = store.store_settings.find((s: any) => s.key === 'payment');
          if (item) item.value = args.value;
          else store.store_settings.push(payload);
        }
        await logApiAudit(ctx, '/api/v1/store/settings/payment', 'PUT', 200, 'payment');
        return { success: true, data: { status: 'updated', settings: args.value } };
      }

      case 'site_store_get_stats': {
        const appsCount = (store.store_apps || []).length;
        const requestsCount = (store.app_requests || []).length;
        const downloadsCount = (store.app_downloads || []).length;
        return {
          success: true,
          data: {
            published_apps: appsCount,
            active_requests: requestsCount,
            downloads_count: downloadsCount,
          },
        };
      }

      // --- CONTENT ---
      case 'site_content_health': {
        const all = getAllContent(store);
        const published = all.filter((c: any) => c.status === 'PUBLISHED').length;
        const placeholder = all.filter((c: any) => c.status === 'PLACEHOLDER').length;
        return { success: true, data: { total: all.length, published, placeholder } };
      }

      case 'site_content_list': {
        const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 100);
        let all = getAllContent(store);
        if (args.page) {
          all = all.filter((c: any) => (c.content_key || c.key || '').startsWith(args.page));
        }
        if (args.status) {
          all = all.filter((c: any) => c.status === args.status);
        }
        return { success: true, data: { count: all.length, content: all.slice(0, limit) } };
      }

      case 'site_content_get': {
        const key = args.key;
        if (!key) return { success: false, error: 'key is required', statusCode: 400 };
        const item = await getContentByKey(db, store, key);
        if (!item) return { success: false, error: `Content '${key}' not found`, isNotFound: true, statusCode: 404 };
        return { success: true, data: { content: item } };
      }

      case 'site_content_placeholders': {
        const res = await getPagePlaceholders(db, store, args.page);
        return { success: true, data: res };
      }

      case 'site_content_patch': {
        const key = args.key;
        if (!key) return { success: false, error: 'key is required', statusCode: 400 };
        const { dry_run, ...updates } = args;

        let existing = await getContentByKey(db, store, key);

        if (dry_run) {
          return {
            success: true,
            data: {
              status: 'dry_run',
              key,
              will_create: !existing,
              existing_version: existing?.version || 1,
              proposed_updates: updates,
            },
          };
        }

        const newVersion = (existing?.version || 1) + 1;
        const patchPayload = {
          ...updates,
          version: updates.version ?? newVersion,
          updated_by: ctx.callerApiKey?.name || 'mcp',
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          if (db) {
            try {
              const { data } = await db.from('content').update(patchPayload).eq('id', existing.id).select().single();
              if (data) {
                await logApiAudit(ctx, `/api/v1/content/${key}`, 'PATCH', 200, key);
                return { success: true, data: { status: 'updated', content: data } };
              }
            } catch {}
          }
          const updated = { ...existing, ...patchPayload };
          store.content = (store.content as any[]).map((c: any) => (c.id === existing.id ? updated : c));
          await logApiAudit(ctx, `/api/v1/content/${key}`, 'PATCH', 200, key);
          return { success: true, data: { status: 'updated', content: updated } };
        }

        // Create new
        const newContent = {
          id: crypto.randomUUID ? crypto.randomUUID() : `content_${Date.now()}`,
          created_at: new Date().toISOString(),
          content_key: key,
          key,
          title: updates.title || key,
          body: updates.body || '',
          summary: updates.summary || '',
          category: updates.category || 'general',
          status: updates.status || 'PLACEHOLDER',
          content_type: updates.content_type || 'text',
          slug: updates.slug || key.replace(/^learn\.guide\./, ''),
          published: updates.published ?? false,
          version: 1,
          updated_by: ctx.callerApiKey?.name || 'mcp',
          ...updates,
        };

        if (db) {
          try {
            const { data } = await db.from('content').insert([newContent]).select().single();
            if (data) {
              await logApiAudit(ctx, `/api/v1/content/${key}`, 'PATCH', 201, key);
              return { success: true, data: { status: 'created', content: data } };
            }
          } catch {}
        }
        if (!store.content) store.content = [];
        store.content.unshift(newContent);
        await logApiAudit(ctx, `/api/v1/content/${key}`, 'PATCH', 201, key);
        return { success: true, data: { status: 'created', content: newContent } };
      }

      case 'site_content_publish': {
        const key = args.key;
        if (!key) return { success: false, error: 'key is required', statusCode: 400 };

        let existing = await getContentByKey(db, store, key);
        if (!existing) {
          return { success: false, error: `Content item with key '${key}' does not exist`, isNotFound: true, statusCode: 404 };
        }

        const publishPayload = {
          published: true,
          status: 'PUBLISHED',
          version: (existing.version || 1) + 1,
          updated_by: ctx.callerApiKey?.name || 'mcp-publisher',
          updated_at: new Date().toISOString(),
        };

        if (db) {
          try {
            const { data } = await db.from('content').update(publishPayload).eq('id', existing.id).select().single();
            if (data) {
              await logApiAudit(ctx, `/api/v1/content/${key}/publish`, 'POST', 200, key);
              return { success: true, data: { status: 'published', content: data } };
            }
          } catch {}
        }

        const published = { ...existing, ...publishPayload };
        store.content = (store.content as any[]).map((c: any) => (c.id === existing.id ? published : c));
        await logApiAudit(ctx, `/api/v1/content/${key}/publish`, 'POST', 200, key);
        return { success: true, data: { status: 'published', content: published } };
      }

      case 'site_content_verify': {
        const res = await verifyContentInternal(db, store, args.key, args.expected_status, args.expected_substring);
        return { success: true, data: res };
      }

      // --- MEDIA SLOTS ---
      case 'site_media_list_slots': {
        let slots: any[] = [];
        if (db) {
          try {
            const { data } = await db.from('media_slots').select('*');
            if (data) slots = data;
          } catch {}
        }
        if (!slots.length && store.media_slots) {
          slots = store.media_slots;
        }
        return { success: true, data: { count: slots.length, slots } };
      }

      case 'site_media_get_slot': {
        const slotKey = args.slot_key;
        if (!slotKey) return { success: false, error: 'slot_key is required', statusCode: 400 };
        let slot: any = null;
        let items: any[] = [];

        if (db) {
          try {
            const { data } = await db.from('media_slots').select('*').eq('slot_key', slotKey).maybeSingle();
            if (data) slot = data;
            const { data: itemData } = await db.from('media_slot_items').select('*').eq('slot_key', slotKey).order('sort_order', { ascending: true });
            if (itemData) items = itemData;
          } catch {}
        }
        if (!slot && store.media_slots) {
          slot = store.media_slots.find((s: any) => s.slot_key === slotKey);
          items = (store.media_slot_items || []).filter((i: any) => i.slot_key === slotKey);
        }
        if (!slot) return { success: false, error: `Media slot '${slotKey}' not found`, isNotFound: true, statusCode: 404 };
        return { success: true, data: { slot, items } };
      }

      case 'site_media_add_item': {
        const { slot_key, url, title, description, item_type, published } = args;
        if (!slot_key || !url) return { success: false, error: 'slot_key and url are required', statusCode: 400 };

        const check = validateUrl(url, true);
        if (!check.isValid) return { success: false, error: check.error || 'Invalid URL', statusCode: 400 };

        const newItem = {
          id: crypto.randomUUID ? crypto.randomUUID() : `item_${Date.now()}`,
          slot_key,
          url,
          title: title || '',
          description: description || '',
          item_type: item_type || 'image',
          published: published !== undefined ? Boolean(published) : true,
          sort_order: 100,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (db) {
          try {
            const { data } = await db.from('media_slot_items').insert([newItem]).select().single();
            if (data) {
              await logApiAudit(ctx, `/api/v1/media/slots/${slot_key}/items`, 'POST', 201, data.id);
              return { success: true, data: { status: 'created', item: data } };
            }
          } catch {}
        }
        if (!store.media_slot_items) store.media_slot_items = [];
        store.media_slot_items.push(newItem);
        await logApiAudit(ctx, `/api/v1/media/slots/${slot_key}/items`, 'POST', 201, newItem.id);
        return { success: true, data: { status: 'created', item: newItem } };
      }

      case 'site_media_update_item': {
        const { slot_key, id, title, description, published } = args;
        if (!slot_key || !id) return { success: false, error: 'slot_key and id are required', statusCode: 400 };

        const updates: any = { updated_at: new Date().toISOString() };
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (published !== undefined) updates.published = Boolean(published);

        let item: any = null;
        if (db) {
          try {
            const { data } = await db.from('media_slot_items').update(updates).eq('id', id).select().maybeSingle();
            if (data) item = data;
          } catch {}
        }
        if (!item && store.media_slot_items) {
          const found = store.media_slot_items.find((i: any) => i.id === id);
          if (found) {
            Object.assign(found, updates);
            item = found;
          }
        }
        if (!item) return { success: false, error: `Media item '${id}' not found`, isNotFound: true, statusCode: 404 };
        await logApiAudit(ctx, `/api/v1/media/slots/${slot_key}/items/${id}`, 'PATCH', 200, id);
        return { success: true, data: { status: 'updated', item } };
      }

      case 'site_media_reorder_items': {
        const { slot_key, item_ids } = args;
        const ids: string[] = Array.isArray(item_ids) ? item_ids : (typeof item_ids === 'string' ? JSON.parse(item_ids) : []);
        if (db) {
          for (let i = 0; i < ids.length; i++) {
            await db.from('media_slot_items').update({ sort_order: i }).eq('id', ids[i]);
          }
        }
        await logApiAudit(ctx, `/api/v1/media/slots/${slot_key}/order`, 'PUT', 200, slot_key);
        return { success: true, data: { status: 'reordered', slot_key, ids } };
      }

      case 'site_media_delete_item': {
        const { slot_key, id } = args;
        if (!id) return { success: false, error: 'id is required', statusCode: 400 };
        if (db) {
          try {
            await db.from('media_slot_items').delete().eq('id', id);
          } catch {}
        }
        if (store.media_slot_items) {
          store.media_slot_items = store.media_slot_items.filter((i: any) => i.id !== id);
        }
        await logApiAudit(ctx, `/api/v1/media/slots/${slot_key}/items/${id}`, 'DELETE', 200, id);
        return { success: true, data: { status: 'deleted', id } };
      }

      // --- TOOLS CATALOG ---
      case 'site_tools_list': {
        let tools: any[] = [];
        if (db) {
          try {
            const { data } = await db.from('site_tools').select('*').order('sort_order', { ascending: true });
            if (data) tools = data;
          } catch {}
        }
        return { success: true, data: { count: tools.length, tools } };
      }

      case 'site_tools_get': {
        const target = args.id_or_slug;
        let toolItem: any = null;
        if (db) {
          try {
            const { data } = await db.from('site_tools').select('*').or(`id.eq.${target},slug.eq.${target}`).maybeSingle();
            if (data) toolItem = data;
          } catch {}
        }
        if (!toolItem) return { success: false, error: `Tool '${target}' not found`, isNotFound: true, statusCode: 404 };
        return { success: true, data: { tool: toolItem } };
      }

      case 'site_tools_create': {
        if (!args.name || !args.category) {
          return { success: false, error: 'name and category are required', statusCode: 400 };
        }
        if (args.launch_url) {
          const check = validateUrl(args.launch_url, true);
          if (!check.isValid) return { success: false, error: check.error || 'Invalid launch_url', statusCode: 400 };
        }
        if (args.image_url) {
          const check = validateUrl(args.image_url, true);
          if (!check.isValid) return { success: false, error: check.error || 'Invalid image_url', statusCode: 400 };
        }

        const slug = (args.slug && String(args.slug).trim()) || String(args.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const newTool = {
          id: crypto.randomUUID ? crypto.randomUUID() : `tool_${Date.now()}`,
          name: args.name,
          slug,
          tagline: args.tagline || '',
          description: args.description || '',
          category: args.category,
          tier: args.tier || 'free',
          status: args.status || 'draft',
          launch_type: args.launch_type || 'coming_soon',
          launch_url: args.launch_url || null,
          image_url: args.image_url || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        if (db) {
          try {
            const { data } = await db.from('site_tools').insert([newTool]).select().single();
            if (data) {
              await logApiAudit(ctx, '/api/v1/site-tools', 'POST', 201, data.id);
              return { success: true, data: { status: 'created', tool: data } };
            }
          } catch {}
        }
        await logApiAudit(ctx, '/api/v1/site-tools', 'POST', 201, newTool.id);
        return { success: true, data: { status: 'created', tool: newTool } };
      }

      case 'site_tools_update': {
        const id = args.id;
        if (!id) return { success: false, error: 'id is required', statusCode: 400 };
        const updates: any = { ...args, updated_at: new Date().toISOString() };
        delete updates.id;

        if (updates.launch_url) {
          const check = validateUrl(updates.launch_url, true);
          if (!check.isValid) return { success: false, error: check.error || 'Invalid launch_url', statusCode: 400 };
        }
        if (updates.image_url) {
          const check = validateUrl(updates.image_url, true);
          if (!check.isValid) return { success: false, error: check.error || 'Invalid image_url', statusCode: 400 };
        }

        let updated: any = null;
        if (db) {
          try {
            const { data } = await db.from('site_tools').update(updates).eq('id', id).select().maybeSingle();
            if (data) updated = data;
          } catch {}
        }
        if (!updated) return { success: false, error: `Tool '${id}' not found`, isNotFound: true, statusCode: 404 };
        await logApiAudit(ctx, `/api/v1/site-tools/${id}`, 'PATCH', 200, id);
        return { success: true, data: { status: 'updated', tool: updated } };
      }

      case 'site_tools_delete': {
        const id = args.id;
        if (!id) return { success: false, error: 'id is required', statusCode: 400 };
        if (db) {
          try {
            await db.from('site_tools').delete().eq('id', id);
          } catch {}
        }
        await logApiAudit(ctx, `/api/v1/site-tools/${id}`, 'DELETE', 200, id);
        return { success: true, data: { status: 'deleted', id } };
      }

      // --- PLATFORMS ---
      case 'site_platforms_list': {
        let platforms: any[] = [];
        if (db) {
          try {
            const { data } = await db.from('platforms').select('*').order('created_at', { ascending: false });
            if (data) platforms = data;
          } catch {}
        }
        if (!platforms.length && store.platforms) platforms = store.platforms;
        return { success: true, data: { count: platforms.length, platforms } };
      }

      case 'site_platforms_create': {
        const { name, url, category, notes } = args;
        if (!name || !url) return { success: false, error: 'name and url are required', statusCode: 400 };
        const check = validateUrl(url, false);
        if (!check.isValid) return { success: false, error: check.error || 'Invalid URL', statusCode: 400 };

        const newPlatform = {
          id: crypto.randomUUID ? crypto.randomUUID() : `plat_${Date.now()}`,
          name,
          url,
          category: category || 'deployment',
          notes: notes || '',
          created_at: new Date().toISOString(),
        };

        if (db) {
          try {
            const { data } = await db.from('platforms').insert([newPlatform]).select().single();
            if (data) {
              await logApiAudit(ctx, '/api/v1/platforms', 'POST', 201, data.id);
              return { success: true, data: { status: 'created', platform: data } };
            }
          } catch {}
        }
        if (!store.platforms) store.platforms = [];
        store.platforms.unshift(newPlatform);
        await logApiAudit(ctx, '/api/v1/platforms', 'POST', 201, newPlatform.id);
        return { success: true, data: { status: 'created', platform: newPlatform } };
      }

      case 'site_platforms_delete': {
        const id = args.id;
        if (!id) return { success: false, error: 'id is required', statusCode: 400 };
        if (db) {
          try {
            await db.from('platforms').delete().eq('id', id);
          } catch {}
        }
        if (store.platforms) store.platforms = store.platforms.filter((p: any) => p.id !== id);
        await logApiAudit(ctx, `/api/v1/platforms/${id}`, 'DELETE', 200, id);
        return { success: true, data: { status: 'deleted', id } };
      }

      // --- SWARM ---
      case 'site_swarm_list_messages': {
        let messages: any[] = [];
        if (db) {
          try {
            const { data } = await db.from('swarm_comms').select('*').order('created_at', { ascending: false }).limit(args.limit ? Number(args.limit) : 25);
            if (data) messages = data;
          } catch {}
        }
        if (!messages.length && store.swarm_comms) {
          messages = (store.swarm_comms || []).slice(0, args.limit ? Number(args.limit) : 25);
        }
        return { success: true, data: { count: messages.length, messages } };
      }

      case 'site_swarm_send_message': {
        const { agent_name, event_type, payload, subject } = args;
        if (!agent_name || !event_type) return { success: false, error: 'agent_name and event_type are required', statusCode: 400 };

        const msg = {
          id: crypto.randomUUID ? crypto.randomUUID() : `comm_${Date.now()}`,
          agent_name,
          event_type,
          payload: payload || {},
          subject: subject || '',
          created_at: new Date().toISOString(),
        };

        if (db) {
          try {
            const { data } = await db.from('swarm_comms').insert([msg]).select().single();
            if (data) {
              await logApiAudit(ctx, '/api/v1/swarm/messages', 'POST', 201, data.id);
              return { success: true, data: { status: 'sent', message: data } };
            }
          } catch {}
        }
        if (!store.swarm_comms) store.swarm_comms = [];
        store.swarm_comms.unshift(msg);
        await logApiAudit(ctx, '/api/v1/swarm/messages', 'POST', 201, msg.id);
        return { success: true, data: { status: 'sent', message: msg } };
      }

      // --- SOCIAL MESSAGES ---
      case 'site_social_list_messages': {
        let msgs: any[] = [];
        if (db) {
          try {
            let q = db.from('social_messages').select('*').order('created_at', { ascending: false });
            if (args.status) q = q.eq('status', args.status);
            const { data } = await q;
            if (data) msgs = data;
          } catch {}
        }
        if (!msgs.length && store.social_messages) {
          msgs = (store.social_messages || []).filter((m: any) => !args.status || m.status === args.status);
        }
        return { success: true, data: { count: msgs.length, messages: msgs } };
      }

      case 'site_social_update_status': {
        const { id, status } = args;
        if (!id || !status) return { success: false, error: 'id and status are required', statusCode: 400 };
        if (db) {
          try {
            await db.from('social_messages').update({ status }).eq('id', id);
          } catch {}
        }
        if (store.social_messages) {
          const item = store.social_messages.find((m: any) => m.id === id);
          if (item) item.status = status;
        }
        await logApiAudit(ctx, `/api/v1/social/messages/${id}`, 'PATCH', 200, id);
        return { success: true, data: { status: 'updated', id, message_status: status } };
      }

      // --- ANALYTICS ---
      case 'site_analytics_get_summary': {
        const leads = (store.leads || []);
        const social = (store.social_messages || []);
        const tasks = (store.tasks || []);

        const doneTasks = tasks.filter((t: any) => t.status === 'done' || t.status === 'completed').length;
        const taskCompletionRate = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

        const intentCounts: Record<string, number> = {};
        leads.forEach((l: any) => {
          const it = l.intent_type || 'General Inquiry';
          intentCounts[it] = (intentCounts[it] || 0) + 1;
        });

        return {
          success: true,
          data: {
            total_leads: leads.length,
            total_social_messages: social.length,
            total_tasks: tasks.length,
            task_completion_rate: taskCompletionRate,
            intent_breakdown: intentCounts,
            active_clients: (store.clients || []).length,
          },
        };
      }

      // --- LEADS ---
      case 'site_leads_list': {
        let leads: any[] = [];
        if (db) {
          try {
            let q = db.from('leads').select('*').order('created_at', { ascending: false });
            if (args.status) q = q.eq('status', args.status);
            const { data } = await q.limit(args.limit ? Number(args.limit) : 25);
            if (data) leads = data;
          } catch {}
        }
        if (!leads.length && store.leads) {
          leads = (store.leads || []).filter((l: any) => !args.status || l.status === args.status).slice(0, args.limit ? Number(args.limit) : 25);
        }
        return { success: true, data: { count: leads.length, leads } };
      }

      case 'site_leads_create': {
        const { client_name, client_contact, client_message, intent_type, budget_range, notes } = args;
        if (!client_name || !client_contact) {
          return { success: false, error: 'client_name and client_contact are required', statusCode: 400 };
        }
        const newLead = {
          id: crypto.randomUUID ? crypto.randomUUID() : `lead_${Date.now()}`,
          client_name,
          client_contact,
          client_message: client_message || '',
          intent_type: intent_type || 'custom',
          budget_range: budget_range || '',
          notes: notes || '',
          status: 'new',
          created_at: new Date().toISOString(),
        };
        if (db) {
          try {
            const { data } = await db.from('leads').insert([newLead]).select().single();
            if (data) {
              await logApiAudit(ctx, '/api/v1/leads', 'POST', 201, data.id);
              return { success: true, data: { status: 'created', lead: data } };
            }
          } catch {}
        }
        if (!store.leads) store.leads = [];
        store.leads.unshift(newLead);
        await logApiAudit(ctx, '/api/v1/leads', 'POST', 201, newLead.id);
        return { success: true, data: { status: 'created', lead: newLead } };
      }

      case 'site_leads_update_status': {
        const { id, status } = args;
        if (!id || !status) return { success: false, error: 'id and status are required', statusCode: 400 };
        if (db) {
          try {
            await db.from('leads').update({ status }).eq('id', id);
          } catch {}
        }
        if (store.leads) {
          const item = store.leads.find((l: any) => l.id === id);
          if (item) item.status = status;
        }
        await logApiAudit(ctx, `/api/v1/leads/${id}`, 'PATCH', 200, id);
        return { success: true, data: { status: 'updated', id, lead_status: status } };
      }

      // --- TASKS ---
      case 'site_tasks_list': {
        let tasks: any[] = [];
        if (db) {
          try {
            let q = db.from('tasks').select('*').order('created_at', { ascending: false });
            if (args.status) q = q.eq('status', args.status);
            const { data } = await q.limit(args.limit ? Number(args.limit) : 25);
            if (data) tasks = data;
          } catch {}
        }
        if (!tasks.length && store.tasks) {
          tasks = (store.tasks || []).filter((t: any) => !args.status || t.status === args.status).slice(0, args.limit ? Number(args.limit) : 25);
        }
        return { success: true, data: { count: tasks.length, tasks } };
      }

      case 'site_tasks_create': {
        const { title, description, status, due_date } = args;
        if (!title) return { success: false, error: 'title is required', statusCode: 400 };
        const newTask = {
          id: crypto.randomUUID ? crypto.randomUUID() : `task_${Date.now()}`,
          title,
          description: description || '',
          status: status || 'not_started',
          due_date: due_date || null,
          created_at: new Date().toISOString(),
        };
        if (db) {
          try {
            const { data } = await db.from('tasks').insert([newTask]).select().single();
            if (data) {
              await logApiAudit(ctx, '/api/v1/tasks', 'POST', 201, data.id);
              return { success: true, data: { status: 'created', task: data } };
            }
          } catch {}
        }
        if (!store.tasks) store.tasks = [];
        store.tasks.unshift(newTask);
        await logApiAudit(ctx, '/api/v1/tasks', 'POST', 201, newTask.id);
        return { success: true, data: { status: 'created', task: newTask } };
      }

      case 'site_tasks_update_status': {
        const { id, status } = args;
        if (!id || !status) return { success: false, error: 'id and status are required', statusCode: 400 };
        if (db) {
          try {
            await db.from('tasks').update({ status }).eq('id', id);
          } catch {}
        }
        if (store.tasks) {
          const item = store.tasks.find((t: any) => t.id === id);
          if (item) item.status = status;
        }
        await logApiAudit(ctx, `/api/v1/tasks/${id}`, 'PATCH', 200, id);
        return { success: true, data: { status: 'updated', id, task_status: status } };
      }

      case 'site_tasks_delete': {
        const id = args.id;
        if (!id) return { success: false, error: 'id is required', statusCode: 400 };
        if (db) {
          try {
            await db.from('tasks').delete().eq('id', id);
          } catch {}
        }
        if (store.tasks) store.tasks = store.tasks.filter((t: any) => t.id !== id);
        await logApiAudit(ctx, `/api/v1/tasks/${id}`, 'DELETE', 200, id);
        return { success: true, data: { status: 'deleted', id } };
      }

      // --- CLIENTS ---
      case 'site_clients_list': {
        let clients: any[] = [];
        if (db) {
          try {
            const { data } = await db.from('clients').select('*').order('created_at', { ascending: false });
            if (data) clients = data;
          } catch {}
        }
        if (!clients.length && store.clients) clients = store.clients;
        return { success: true, data: { count: clients.length, clients } };
      }

      case 'site_clients_create': {
        const { name, contact_email, contact_phone, notes } = args;
        if (!name || !contact_email) return { success: false, error: 'name and contact_email are required', statusCode: 400 };
        const newClient = {
          id: crypto.randomUUID ? crypto.randomUUID() : `cli_${Date.now()}`,
          name,
          contact_email,
          contact_phone: contact_phone || '',
          notes: notes || '',
          created_at: new Date().toISOString(),
        };
        if (db) {
          try {
            const { data } = await db.from('clients').insert([newClient]).select().single();
            if (data) {
              await logApiAudit(ctx, '/api/v1/clients', 'POST', 201, data.id);
              return { success: true, data: { status: 'created', client: data } };
            }
          } catch {}
        }
        if (!store.clients) store.clients = [];
        store.clients.unshift(newClient);
        await logApiAudit(ctx, '/api/v1/clients', 'POST', 201, newClient.id);
        return { success: true, data: { status: 'created', client: newClient } };
      }

      // --- CONFIG ---
      case 'site_config_get': {
        let config: any = null;
        if (db) {
          try {
            const { data } = await db.from('agent_config').select('*').limit(1).maybeSingle();
            if (data) config = data;
          } catch {}
        }
        if (!config && store.agent_config) config = store.agent_config[0];
        return { success: true, data: { config: maskSecrets(config) } };
      }

      case 'site_config_update': {
        const { provider, model_name, base_url, api_key, system_prompt } = args;
        const updatedConfig = {
          id: 'coreiq_primary_mind',
          provider: provider || 'groq',
          model_name: model_name || 'llama-3.3-70b-versatile',
          base_url: base_url || 'https://api.groq.com/openai/v1',
          api_key: api_key || '',
          system_prompt: system_prompt || '',
          updated_at: new Date().toISOString(),
        };
        if (db) {
          try {
            await db.from('agent_config').upsert(updatedConfig);
          } catch {}
        }
        if (store.agent_config) store.agent_config = [updatedConfig];
        await logApiAudit(ctx, '/api/v1/config', 'POST', 200, 'coreiq_primary_mind');
        return { success: true, data: { status: 'updated', config: maskSecrets(updatedConfig) } };
      }

      // --- KEYS (Read-only for agents) ---
      case 'site_keys_list': {
        let keys: any[] = [];
        if (db) {
          try {
            const { data } = await db.from('api_keys').select('id, name, key_prefix, scopes, revoked, last_used_at, created_at').order('created_at', { ascending: false });
            if (data) keys = data;
          } catch {}
        }
        if (!keys.length && store.api_keys) {
          keys = store.api_keys.map((k: any) => {
            const { key_hash, raw_token_display, ...rest } = k;
            return rest;
          });
        }
        return { success: true, data: { count: keys.length, keys: maskSecrets(keys) } };
      }

      case 'site_keys_audit_list': {
        const limit = Math.min(Math.max(Number(args.limit) || 50, 1), 100);
        let logs: any[] = [];
        if (db) {
          try {
            const { data } = await db.from('api_audit').select('*').order('created_at', { ascending: false }).limit(limit);
            if (data) logs = data;
          } catch {}
        }
        if (!logs.length && store.api_audit) {
          logs = store.api_audit.slice(0, limit);
        }
        return { success: true, data: { count: logs.length, audit_logs: logs } };
      }

      default:
        return { success: false, error: `Unhandled registry tool: ${toolName}`, isNotFound: true };
    }
  } catch (err: any) {
    console.error(`[executeRegistryTool exception in ${toolName}]`, err);
    return { success: false, error: err?.message || 'Tool execution failure', statusCode: 500 };
  }
}
