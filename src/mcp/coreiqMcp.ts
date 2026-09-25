import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import { CONTENT_MANIFEST } from '../data/contentManifest';

// ---- Types ----
export interface CoreIQTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
  isNotFound?: boolean;
  isForbidden?: boolean;
}


// ---- Content Accessors ----
export async function getContentByKey(
  arg1: any,
  arg2: any,
  arg3?: any
): Promise<any | null> {
  let supabase: SupabaseClient | null = null;
  let localStore: Record<string, any[]> = {};
  let key = '';

  if (typeof arg1 === 'string') {
    key = arg1;
    localStore = arg2 || {};
  } else {
    supabase = arg1;
    localStore = arg2 || {};
    key = arg3 || '';
  }

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .or(`content_key.eq.${key},key.eq.${key},id.eq.${key},slug.eq.${key}`)
        .maybeSingle();
      if (!error && data) return data;
    } catch {}
  }

  const items = (localStore.content as any[]) || [];
  return items.find((c: any) => c.content_key === key || c.key === key || c.id === key || c.slug === key) || null;
}

export function resolveContentInternal(
  arg1: any,
  arg2?: any
): string {
  let item: any = null;
  let key = '';

  if (typeof arg1 === 'string') {
    key = arg1;
    const localStore = arg2 || {};
    const items = (localStore.content as any[]) || [];
    item = items.find((c: any) => c.content_key === key || c.key === key) || null;
  } else {
    item = arg1;
    key = arg2 || item?.content_key || item?.key || '';
  }

  if (!item) return `[${key}]`;
  if (item.status === 'PLACEHOLDER') return item.summary || item.defaultSummary || `[${key}]`;
  return item.value || item.body || item.summary || item.title || `[${key}]`;
}

export async function verifyContentInternal(
  arg1: any,
  arg2: any,
  arg3?: any,
  arg4?: any,
  arg5?: any
): Promise<{ verified: boolean; exists: boolean; status: string; key: string; error?: string }> {
  let supabase: SupabaseClient | null = null;
  let localStore: Record<string, any[]> = {};
  let key = '';
  let expectedStatus = 'PUBLISHED';
  let expectedSubstring = '';

  if (typeof arg1 === 'string') {
    key = arg1;
    localStore = arg2 || {};
  } else {
    supabase = arg1;
    localStore = arg2 || {};
    key = arg3 || '';
    expectedStatus = arg4 || 'PUBLISHED';
    expectedSubstring = arg5 || '';
  }

  let item: any = null;
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .or(`content_key.eq.${key},key.eq.${key},id.eq.${key},slug.eq.${key}`)
        .maybeSingle();
      if (!error && data) item = data;
    } catch {}
  }

  if (!item) {
    const items = (localStore.content as any[]) || [];
    item = items.find((c: any) => c.content_key === key || c.key === key || c.id === key || c.slug === key);
  }

  if (!item) {
    return { verified: false, exists: false, status: 'MISSING', key, error: `Content '${key}' not found` };
  }

  const statusMatches = !expectedStatus || (item.status || '').toUpperCase() === expectedStatus.toUpperCase();
  const bodyText = item.body || item.value || item.summary || '';
  const substringMatches = !expectedSubstring || bodyText.toLowerCase().includes(expectedSubstring.toLowerCase());

  const verified = Boolean(statusMatches && substringMatches);
  return {
    verified,
    exists: true,
    status: item.status || 'PUBLISHED',
    key,
  };
}

export async function getPagePlaceholders(
  arg1: any,
  arg2: any,
  arg3?: any
): Promise<{ count: number; items: any[]; placeholders?: any[] }> {
  let supabase: SupabaseClient | null = null;
  let localStore: Record<string, any[]> = {};
  let page = '';

  if (typeof arg1 === 'string') {
    page = arg1;
    localStore = arg2 || {};
  } else {
    supabase = arg1;
    localStore = arg2 || {};
    page = arg3 || '';
  }

  let allContent: any[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase.from('content').select('*');
      if (!error && data) allContent = data;
    } catch {}
  }
  if (!allContent.length) {
    allContent = (localStore.content as any[]) || [];
  }

  const cleanPage = (page || '').toLowerCase().replace(/^\/+/, '');
  const placeholders = allContent.filter((c: any) => {
    const key = (c.content_key || c.key || '').toLowerCase();
    const slug = (c.slug || '').toLowerCase();
    const isPlaceholder = (c.status || '').toUpperCase() === 'PLACEHOLDER' || !c.published;
    return isPlaceholder && (key.startsWith(cleanPage) || slug === cleanPage);
  });

  return {
    count: placeholders.length,
    items: placeholders,
    placeholders,
  };
}

export function getAllContent(
  localStore: Record<string, any[]>
): any[] {
  return (localStore.content as any[]) || [];
}

// ---- Tools Registry ----
export function getCoreIQToolsList(): CoreIQTool[] {
  return [
    { name: 'content_health', description: 'Returns published/placeholder counts for all manifest keys.', inputSchema: {} },
    { name: 'get_content', description: 'Fetch a single content item by manifest key.', inputSchema: { content_key: { type: 'string' } } },
    { name: 'resolve_content', description: 'Resolve a content key the same way the frontend does.', inputSchema: { content_key: { type: 'string' } } },
    { name: 'verify_content', description: 'Check if a content key exists and its status.', inputSchema: { content_key: { type: 'string' } } },
    { name: 'list_placeholders', description: 'Return all keys still in PLACEHOLDER status for a given page.', inputSchema: { page: { type: 'string' } } },
    { name: 'get_all_content', description: 'Return all content items in the store.', inputSchema: {} },
    { name: 'get_content_health', description: 'Full health report with per-page breakdown.', inputSchema: {} },
    { name: 'search_content', description: 'Search content by keyword.', inputSchema: { query: { type: 'string' } } },
  ];
}

export async function executeCoreIQTool(
  toolName: string,
  args: Record<string, any>,
  ctx: { supabase: SupabaseClient | null; localStore: Record<string, any[]>; callerApiKey?: any }
): Promise<ToolResult> {
  const { localStore } = ctx;
  try {
    switch (toolName) {
      case 'content_health': {
        const all = getAllContent(localStore);
        const published = all.filter((c: any) => c.status === 'PUBLISHED').length;
        const placeholder = all.filter((c: any) => c.status === 'PLACEHOLDER').length;
        return { success: true, data: { total: all.length, published, placeholder } };
      }
      case 'get_content': {
        const item = await getContentByKey(ctx.supabase, localStore, args.content_key);
        if (!item) return { success: false, error: 'Not found', isNotFound: true };
        return { success: true, data: item };
      }
      case 'resolve_content': {
        const item = await getContentByKey(ctx.supabase, localStore, args.content_key);
        const value = resolveContentInternal(item, args.content_key);
        return { success: true, data: { key: args.content_key, value } };
      }
      case 'verify_content': {
        const result = await verifyContentInternal(ctx.supabase, localStore, args.content_key);
        return { success: true, data: result };
      }
      case 'list_placeholders': {
        const items = await getPagePlaceholders(ctx.supabase, localStore, args.page);
        return { success: true, data: { page: args.page, count: items.count, items: items.items } };
      }
      case 'get_all_content': {
        const all = getAllContent(localStore);
        return { success: true, data: { count: all.length, items: all } };
      }
      case 'get_content_health': {
        const all = getAllContent(localStore);
        const pages = ['home','learn','solutions','apps','tools','about'];
        const breakdown = pages.map(p => ({
          page: p,
          placeholders: all.filter((c: any) => c.status === 'PLACEHOLDER' && (c.content_key||'').startsWith(p)).length
        }));
        return { success: true, data: { total: all.length, breakdown } };
      }
      case 'search_content': {
        const q = (args.query || '').toLowerCase();
        const all = getAllContent(localStore);
        const hits = all.filter((c: any) =>
          (c.content_key||'').toLowerCase().includes(q) ||
          (c.title||'').toLowerCase().includes(q) ||
          (c.value||'').toLowerCase().includes(q)
        );
        return { success: true, data: { count: hits.length, items: hits } };
      }
      default:
        return { success: false, error: `Unknown tool: ${toolName}`, isNotFound: true };
    }
  } catch (e: any) {
    return { success: false, error: e.message || 'Tool execution error' };
  }
}

// ---- MCP Server Builder ----
export function buildCoreIQMcpServer(
  supabase: SupabaseClient | null,
  localStore: Record<string, any[]>,
  callerApiKey?: any
): McpServer {
  const server = new McpServer({ name: 'coreiq-create', version: '1.0.0' });

  server.registerTool('content_health', {
    title: 'Content Health',
    description: 'Returns live published/placeholder counts for all 94 manifest keys.',
    inputSchema: {},
  }, async () => {
    const result = await executeCoreIQTool('content_health', {}, { supabase, localStore, callerApiKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  });

  server.registerTool('get_content', {
    title: 'Get Content',
    description: 'Fetch a single content item by manifest key.',
    inputSchema: { content_key: z.string().describe('Manifest content key, e.g. home.hero.title') },
  }, async ({ content_key }) => {
    const result = await executeCoreIQTool('get_content', { content_key }, { supabase, localStore, callerApiKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  });

  server.registerTool('resolve_content', {
    title: 'Resolve Content',
    description: 'Resolve a content key the same way the frontend does.',
    inputSchema: { content_key: z.string().describe('Manifest content key') },
  }, async ({ content_key }) => {
    const result = await executeCoreIQTool('resolve_content', { content_key }, { supabase, localStore, callerApiKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  });

  server.registerTool('verify_content', {
    title: 'Verify Content',
    description: 'Check if a content key exists and its publish status.',
    inputSchema: { content_key: z.string().describe('Manifest content key') },
  }, async ({ content_key }) => {
    const result = await executeCoreIQTool('verify_content', { content_key }, { supabase, localStore, callerApiKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  });

  server.registerTool('list_placeholders', {
    title: 'List Placeholders',
    description: 'Return all keys still in PLACEHOLDER status for a given page.',
    inputSchema: { page: z.string().describe('Page name: home | learn | solutions | apps | tools | about') },
  }, async ({ page }) => {
    const result = await executeCoreIQTool('list_placeholders', { page }, { supabase, localStore, callerApiKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  });

  server.registerTool('get_all_content', {
    title: 'Get All Content',
    description: 'Return all content items in the store.',
    inputSchema: {},
  }, async () => {
    const result = await executeCoreIQTool('get_all_content', {}, { supabase, localStore, callerApiKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  });

  server.registerTool('get_content_health', {
    title: 'Get Content Health',
    description: 'Full health report with per-page placeholder breakdown.',
    inputSchema: {},
  }, async () => {
    const result = await executeCoreIQTool('get_content_health', {}, { supabase, localStore, callerApiKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  });

  server.registerTool('search_content', {
    title: 'Search Content',
    description: 'Search content items by keyword.',
    inputSchema: { query: z.string().describe('Search keyword') },
  }, async ({ query }) => {
    const result = await executeCoreIQTool('search_content', { query }, { supabase, localStore, callerApiKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  });

  return server;
}

export function mountCoreIQMcp(
  app: any,
  serverOrFactory: McpServer | ((req?: Request) => McpServer),
  authMiddleware: any
) {
  app.post('/mcp', authMiddleware, async (req: Request, res: Response) => {
    try {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on('close', () => transport.close());
      const mcpServer = typeof serverOrFactory === 'function' ? serverOrFactory(req) : serverOrFactory;
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(500).json({ error: err?.message || 'MCP transport error' });
      }
    }
  });
}
