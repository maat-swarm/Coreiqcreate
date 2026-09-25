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
export function getContentByKey(
  key: string,
  localStore: Record<string, any[]>
): any | null {
  const items = localStore.content as any[];
  if (!items) return null;
  return items.find((c: any) => c.content_key === key || c.key === key) || null;
}

export function resolveContentInternal(
  key: string,
  localStore: Record<string, any[]>
): string {
  const item = getContentByKey(key, localStore);
  if (!item) return `[${key}]`;
  if (item.status === 'PLACEHOLDER') return item.summary || `[${key}]`;
  return item.value || item.body || item.title || `[${key}]`;
}

export function verifyContentInternal(
  key: string,
  localStore: Record<string, any[]>
): { exists: boolean; status: string; key: string } {
  const item = getContentByKey(key, localStore);
  if (!item) return { exists: false, status: 'MISSING', key };
  return { exists: true, status: item.status || 'PUBLISHED', key };
}

export function getPagePlaceholders(
  page: string,
  localStore: Record<string, any[]>
): any[] {
  const items = localStore.content as any[];
  if (!items) return [];
  return items.filter((c: any) =>
    c.status === 'PLACEHOLDER' &&
    (c.slug === page || (c.content_key || '').startsWith(page))
  );
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
        const item = getContentByKey(args.content_key, localStore);
        if (!item) return { success: false, error: 'Not found', isNotFound: true };
        return { success: true, data: item };
      }
      case 'resolve_content': {
        const value = resolveContentInternal(args.content_key, localStore);
        return { success: true, data: { key: args.content_key, value } };
      }
      case 'verify_content': {
        const result = verifyContentInternal(args.content_key, localStore);
        return { success: true, data: result };
      }
      case 'list_placeholders': {
        const items = getPagePlaceholders(args.page, localStore);
        return { success: true, data: { page: args.page, count: items.length, items } };
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
