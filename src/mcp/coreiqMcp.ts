import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';
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
    { name: 'patch_content', description: 'Update or create a content item by key (body, summary, title, status, etc.).', inputSchema: { key: { type: 'string' }, title: { type: 'string' }, summary: { type: 'string' }, body: { type: 'string' }, category: { type: 'string' }, status: { type: 'string' }, dry_run: { type: 'boolean' } } },
    { name: 'publish_content', description: 'Publish a content item by key.', inputSchema: { key: { type: 'string' } } },
    { name: 'ask_coreiq', description: "Send a message to the live CoreIQ agent brain and return its response.", inputSchema: { message: { type: 'string' } } },
    { name: 'list_leads', description: 'List recent website leads/inquiries.', inputSchema: { limit: { type: 'number' } } },
    { name: 'create_lead', description: 'Create a new client lead/inquiry.', inputSchema: { client_name: { type: 'string' }, client_contact: { type: 'string' }, client_message: { type: 'string' } } },
    { name: 'list_tasks', description: 'List operator tasks in CoreIQ Command.', inputSchema: { limit: { type: 'number' } } },
    { name: 'create_task', description: 'Create an operator task in CoreIQ Command.', inputSchema: { title: { type: 'string' }, description: { type: 'string' } } },
    { name: 'get_agent_config', description: "Read CoreIQ's current provider/model/system prompt (API key redacted).", inputSchema: {} },
  ];
}

export async function executeCoreIQTool(
  toolName: string,
  args: Record<string, any>,
  ctx: { supabase: SupabaseClient | null; localStore: Record<string, any[]>; callerApiKey?: any }
): Promise<ToolResult> {
  const { localStore, supabase, callerApiKey } = ctx;
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
      case 'patch_content':
      case 'update_content': {
        const key = args.key || args.content_key;
        if (!key) return { success: false, error: 'Missing content key' };

        const { dry_run, ...rawUpdates } = args;
        const updates: Record<string, any> = {};
        for (const [k, v] of Object.entries(rawUpdates)) {
          if (k !== 'key' && k !== 'content_key' && v !== undefined) {
            updates[k] = v;
          }
        }

        // Find existing
        let existing: any = null;
        if (supabase) {
          try {
            const { data } = await supabase
              .from('content')
              .select('*')
              .or(`content_key.eq.${key},key.eq.${key},id.eq.${key},slug.eq.${key}`)
              .maybeSingle();
            if (data) existing = data;
          } catch {}
        }
        if (!existing) {
          existing = (localStore.content as any[]).find(
            (c: any) => c.content_key === key || c.key === key || c.id === key || c.slug === key
          );
        }

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
          updated_by: updates.updated_by || callerApiKey?.name || 'mcp',
        };

        if (existing) {
          if (supabase) {
            try {
              const { data, error } = await supabase
                .from('content')
                .update(patchPayload)
                .eq('id', existing.id)
                .select()
                .single();
              if (!error && data) {
                return { success: true, data: { status: 'updated', content: data } };
              }
            } catch {}
          }
          const updated = { ...existing, ...patchPayload };
          localStore.content = (localStore.content as any[]).map((c: any) =>
            c.id === existing.id ? updated : c
          );
          return { success: true, data: { status: 'updated', content: updated } };
        }

        // Create new if not existing
        const newContent = {
          id: crypto.randomUUID ? crypto.randomUUID() : `content_${Date.now()}`,
          created_at: new Date().toISOString(),
          content_key: key,
          key,
          title: updates.title || key,
          body: updates.body || '',
          summary: updates.summary || '',
          category: updates.category || 'learning',
          status: updates.status || 'PLACEHOLDER',
          content_type: updates.content_type || 'text',
          slug: updates.slug || key.replace(/^learn\.guide\./, ''),
          published: updates.published ?? false,
          version: 1,
          updated_by: callerApiKey?.name || 'mcp',
          ...updates,
        };

        if (supabase) {
          try {
            const { data, error } = await supabase
              .from('content')
              .insert([newContent])
              .select()
              .single();
            if (!error && data) {
              return { success: true, data: { status: 'created', content: data } };
            }
          } catch {}
        }

        (localStore.content as any[]).unshift(newContent);
        return { success: true, data: { status: 'created', content: newContent } };
      }
      case 'publish_content': {
        const key = args.key || args.content_key;
        if (!key) return { success: false, error: 'Missing content key' };

        let existing: any = null;
        if (supabase) {
          try {
            const { data } = await supabase
              .from('content')
              .select('*')
              .or(`content_key.eq.${key},key.eq.${key},id.eq.${key},slug.eq.${key}`)
              .maybeSingle();
            if (data) existing = data;
          } catch {}
        }
        if (!existing) {
          existing = (localStore.content as any[]).find(
            (c: any) => c.content_key === key || c.key === key || c.id === key || c.slug === key
          );
        }

        if (!existing) {
          return {
            success: false,
            error: `Cannot publish: content item with key '${key}' does not exist.`,
            isNotFound: true,
          };
        }

        const publishPayload = {
          published: true,
          status: 'PUBLISHED',
          version: (existing.version || 1) + 1,
          updated_by: callerApiKey?.name || 'mcp-publisher',
        };

        if (supabase) {
          try {
            const { data, error } = await supabase
              .from('content')
              .update(publishPayload)
              .eq('id', existing.id)
              .select()
              .single();
            if (!error && data) {
              return { success: true, data: { status: 'published', content: data } };
            }
          } catch {}
        }

        const published = { ...existing, ...publishPayload };
        localStore.content = (localStore.content as any[]).map((c: any) =>
          c.id === existing.id ? published : c
        );
        return { success: true, data: { status: 'published', content: published } };
      }
      case 'ask_coreiq': {
        const message = args.message;
        if (!message) return { success: false, error: 'Message is required' };

        let config: any = null;
        if (supabase) {
          try {
            const { data, error } = await supabase
              .from('agent_config')
              .select('*')
              .eq('id', 'coreiq_primary_mind')
              .single();
            if (!error && data) config = data;
          } catch {}
        }
        if (!config && localStore.agent_config) {
          config = localStore.agent_config[0];
        }

        if (!config?.api_key || !config?.base_url) {
          if (process.env.GEMINI_API_KEY) {
            try {
              const { GoogleGenAI } = await import('@google/genai');
              const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
              const geminiRes = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: [{ role: 'user', parts: [{ text: `${config?.system_prompt || 'You are CoreIQ'}\n\n${message}` }] }],
              });
              const reply = geminiRes.text || '(empty response)';
              return { success: true, data: { reply } };
            } catch (e: any) {
              return { success: false, error: `Gemini fallback error: ${e.message}` };
            }
          }
          return { success: false, error: 'CoreIQ agent brain has no active provider/API key configured.' };
        }

        const endpoint = config.base_url.endsWith('/') ? `${config.base_url}chat/completions` : `${config.base_url}/chat/completions`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.api_key}` },
          body: JSON.stringify({
            model: config.model_name,
            messages: [{ role: 'system', content: config.system_prompt }, { role: 'user', content: message }],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });

        if (!res.ok) return { success: false, error: `CoreIQ provider error: ${res.status} ${res.statusText}` };
        const json: any = await res.json();
        const reply = json.choices?.[0]?.message?.content ?? '(empty response)';
        return { success: true, data: { reply } };
      }
      case 'list_leads': {
        const limit = args.limit ?? 20;
        let leads: any[] = [];
        if (supabase) {
          try {
            const { data } = await supabase
              .from('leads')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(limit);
            leads = data ?? [];
          } catch {}
        }
        if (!leads.length && localStore.leads) {
          leads = (localStore.leads as any[]).slice(0, limit);
        }
        return { success: true, data: leads };
      }
      case 'create_lead': {
        const { client_name, client_contact, client_message, intent_type, budget_range, notes } = args;
        if (!client_name || !client_contact) {
          return { success: false, error: 'client_name and client_contact are required' };
        }

        const newLead = {
          id: crypto.randomUUID ? crypto.randomUUID() : `lead_${Date.now()}`,
          created_at: new Date().toISOString(),
          client_name,
          client_contact,
          client_message: client_message || '',
          conversation_summary: args.conversation_summary || '',
          intent_type: intent_type || 'custom',
          source: args.source || 'mcp',
          status: 'new',
          budget_range: budget_range || '',
          notes: notes || '',
        };

        if (supabase) {
          try {
            const { data, error } = await supabase.from('leads').insert([newLead]).select().single();
            if (!error && data) {
              return { success: true, data: data };
            }
          } catch {}
        }

        (localStore.leads as any[]).unshift(newLead);
        return { success: true, data: newLead };
      }
      case 'list_tasks': {
        const limit = args.limit ?? 20;
        let tasks: any[] = [];
        if (supabase) {
          try {
            const { data } = await supabase
              .from('tasks')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(limit);
            tasks = data ?? [];
          } catch {}
        }
        if (!tasks.length && localStore.tasks) {
          tasks = (localStore.tasks as any[]).slice(0, limit);
        }
        return { success: true, data: tasks };
      }
      case 'create_task': {
        const { title, description, status, due_date, linked_lead_id, linked_client_id } = args;
        if (!title) return { success: false, error: 'title is required' };

        const newTask = {
          id: crypto.randomUUID ? crypto.randomUUID() : `task_${Date.now()}`,
          created_at: new Date().toISOString(),
          title,
          description: description || '',
          status: status || 'not_started',
          due_date: due_date || null,
          linked_lead_id: linked_lead_id || null,
          linked_client_id: linked_client_id || null,
        };

        if (supabase) {
          try {
            const { data, error } = await supabase.from('tasks').insert([newTask]).select().single();
            if (!error && data) {
              return { success: true, data: data };
            }
          } catch {}
        }

        (localStore.tasks as any[]).unshift(newTask);
        return { success: true, data: newTask };
      }
      case 'get_agent_config':
      case 'get_config': {
        let config: any = null;
        if (supabase) {
          try {
            const { data, error } = await supabase
              .from('agent_config')
              .select('*')
              .eq('id', 'coreiq_primary_mind')
              .single();
            if (!error && data) config = data;
          } catch {}
        }
        if (!config && localStore.agent_config) {
          config = localStore.agent_config[0];
        }
        const safe = { ...config, api_key: config?.api_key ? '***redacted***' : '' };
        return { success: true, data: safe };
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

  server.registerTool('patch_content', {
    title: 'Patch Content',
    description: 'Update or create a content item by key (body, summary, title, category, status, etc.). Supports dry_run.',
    inputSchema: {
      key: z.string().describe('Content manifest key (e.g. home.hero.title or learn.guide.my-topic)'),
      title: z.string().optional().describe('Headline or title for the content item'),
      summary: z.string().optional().describe('Short summary or excerpt'),
      body: z.string().optional().describe('Main markdown or text body'),
      category: z.string().optional().describe('Content category (e.g. learning, solutions, general)'),
      status: z.string().optional().describe('Content status (PUBLISHED or PLACEHOLDER)'),
      dry_run: z.boolean().optional().describe('If true, simulates the patch without persisting'),
    },
  }, async (args) => {
    const result = await executeCoreIQTool('patch_content', args, { supabase, localStore, callerApiKey });
    if (!result.success) {
      return { content: [{ type: 'text', text: `Error: ${result.error}` }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  });

  server.registerTool('publish_content', {
    title: 'Publish Content',
    description: 'Publish a content item by key, setting its status to PUBLISHED and published flag to true.',
    inputSchema: {
      key: z.string().describe('Content manifest key to publish'),
    },
  }, async ({ key }) => {
    const result = await executeCoreIQTool('publish_content', { key }, { supabase, localStore, callerApiKey });
    if (!result.success) {
      return { content: [{ type: 'text', text: `Error: ${result.error}` }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  });

  server.registerTool('ask_coreiq', {
    title: 'Ask CoreIQ',
    description: "Send a message to the live CoreIQ agent brain (the website's configured provider/model/system prompt) and return its real response.",
    inputSchema: { message: z.string().describe('Message or prompt to send to CoreIQ') },
  }, async ({ message }) => {
    const result = await executeCoreIQTool('ask_coreiq', { message }, { supabase, localStore, callerApiKey });
    if (!result.success) {
      return { content: [{ type: 'text', text: `Error: ${result.error}` }], isError: true };
    }
    const reply = (result.data as any)?.reply || '(empty response)';
    return { content: [{ type: 'text', text: reply }] };
  });

  server.registerTool('list_leads', {
    title: 'List Leads',
    description: 'List recent website leads/inquiries.',
    inputSchema: { limit: z.number().optional().describe('Max number of leads to return (default 20)') },
  }, async ({ limit }) => {
    const result = await executeCoreIQTool('list_leads', { limit }, { supabase, localStore, callerApiKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  });

  server.registerTool('create_lead', {
    title: 'Create Lead',
    description: 'Create a new client lead/inquiry record.',
    inputSchema: {
      client_name: z.string().describe('Name of the lead/client'),
      client_contact: z.string().describe('Email or phone contact'),
      client_message: z.string().optional().describe('Message or inquiry text'),
      intent_type: z.string().optional().describe('Intent type (e.g. agents, apps, automation, custom)'),
      budget_range: z.string().optional().describe('Client budget range'),
      notes: z.string().optional().describe('Internal operator notes'),
    },
  }, async (args) => {
    const result = await executeCoreIQTool('create_lead', args, { supabase, localStore, callerApiKey });
    if (!result.success) {
      return { content: [{ type: 'text', text: `Error: ${result.error}` }], isError: true };
    }
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  });

  server.registerTool('list_tasks', {
    title: 'List Tasks',
    description: 'List operator tasks in CoreIQ Command.',
    inputSchema: { limit: z.number().optional().describe('Max number of tasks to return (default 20)') },
  }, async ({ limit }) => {
    const result = await executeCoreIQTool('list_tasks', { limit }, { supabase, localStore, callerApiKey });
    return { content: [{ type: 'text', text: JSON.stringify(result.data, null, 2) }] };
  });

  server.registerTool('create_task', {
    title: 'Create Task',
    description: 'Create an operator task in CoreIQ Command.',
    inputSchema: {
      title: z.string().describe('Task title'),
      description: z.string().optional().describe('Task details or instructions'),
      status: z.string().optional().describe('Initial status: not_started, in_progress, completed, blocked'),
      due_date: z.string().optional().describe('Due date ISO string'),
    },
  }, async (args) => {
    const result = await executeCoreIQTool('create_task', args, { supabase, localStore, callerApiKey });
    if (!result.success) {
      return { content: [{ type: 'text', text: `Error: ${result.error}` }], isError: true };
    }
    return { content: [{ type: 'text', text: `Task created: ${args.title}` }] };
  });

  server.registerTool('get_agent_config', {
    title: 'Get Agent Config',
    description: "Read CoreIQ's current provider/model/system prompt (API key redacted).",
    inputSchema: {},
  }, async () => {
    const result = await executeCoreIQTool('get_agent_config', {}, { supabase, localStore, callerApiKey });
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
