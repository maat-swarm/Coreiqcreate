import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';

export function buildCoreIQMcpServer(supabase: SupabaseClient | null, localStore: Record<string, any[]>) {
  const server = new McpServer({ name: 'coreiq-create', version: '1.0.0' });

  async function getAgentConfig() {
    if (supabase) {
      const { data, error } = await supabase
        .from('agent_config').select('*').eq('id', 'coreiq_primary_mind').single();
      if (!error && data) return data;
    }
    return localStore.agent_config[0];
  }

  server.registerTool(
    'coreiq_ask',
    {
      title: 'Ask CoreIQ',
      description: "Send a message to the live CoreIQ agent brain (the website's actual configured provider/model/system prompt) and return its real response.",
      inputSchema: { message: z.string().describe('Message/question to send to CoreIQ') },
    },
    async ({ message }) => {
      const config = await getAgentConfig();
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
            return { content: [{ type: 'text', text: reply }] };
          } catch (e: any) {
            return { content: [{ type: 'text', text: `Gemini fallback error: ${e.message}` }], isError: true };
          }
        }
        return { content: [{ type: 'text', text: 'CoreIQ agent brain has no active provider/API key configured.' }], isError: true };
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
      if (!res.ok) return { content: [{ type: 'text', text: `CoreIQ provider error: ${res.status} ${res.statusText}` }], isError: true };
      const json: any = await res.json();
      const reply = json.choices?.[0]?.message?.content ?? '(empty response)';
      return { content: [{ type: 'text', text: reply }] };
    }
  );

  server.registerTool(
    'coreiq_list_leads',
    { title: 'List Leads', description: 'List recent website leads/inquiries.', inputSchema: { limit: z.number().optional() } },
    async ({ limit }) => {
      let leads: any[] = [];
      if (supabase) {
        const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(limit ?? 20);
        leads = data ?? [];
      } else {
        leads = localStore.leads.slice(0, limit ?? 20);
      }
      return { content: [{ type: 'text', text: JSON.stringify(leads, null, 2) }] };
    }
  );

  server.registerTool(
    'coreiq_create_task',
    { title: 'Create Task', description: 'Create an operator task in CoreIQ Command.', inputSchema: { title: z.string(), description: z.string().optional() } },
    async ({ title, description }) => {
      const newTask = {
        id: crypto.randomUUID(), created_at: new Date().toISOString(),
        title, description: description ?? '', status: 'not_started',
        linked_lead_id: null, linked_client_id: null, due_date: null,
      };
      if (supabase) await supabase.from('tasks').insert([newTask]);
      else localStore.tasks.unshift(newTask);
      return { content: [{ type: 'text', text: `Task created: ${title}` }] };
    }
  );

  server.registerTool(
    'coreiq_get_config',
    { title: 'Get Agent Config', description: "Read CoreIQ's current provider/model/system prompt (API key redacted).", inputSchema: {} },
    async () => {
      const config = await getAgentConfig();
      const safe = { ...config, api_key: config?.api_key ? '***redacted***' : '' };
      return { content: [{ type: 'text', text: JSON.stringify(safe, null, 2) }] };
    }
  );

  server.registerTool(
    'coreiq_update_content',
    {
      title: 'Update Content',
      description: 'Create or update a content record by key (upserts by content_key), optionally publishing it immediately.',
      inputSchema: {
        content_key: z.string().describe('Unique content key, e.g. home.hero.headline'),
        body: z.string().describe('Content body/value'),
        page: z.string().optional().describe('Public page this content belongs to, e.g. home, solutions, apps, learn, tools, about'),
        publish: z.boolean().optional().describe('If true, set status to PUBLISHED; otherwise DRAFT'),
      },
    },
    async ({ content_key, body, page, publish }) => {
      const status = publish ? 'PUBLISHED' : 'DRAFT';
      const now = new Date().toISOString();

      if (supabase) {
        const { data: existing } = await supabase
          .from('content')
          .select('id')
          .eq('content_key', content_key)
          .maybeSingle();

        if (existing) {
          const { data, error } = await supabase
            .from('content')
            .update({ body, page, status, updated_at: now })
            .eq('id', existing.id)
            .select()
            .single();
          if (error) return { content: [{ type: 'text', text: `Content update error: ${error.message}` }], isError: true };
          return { content: [{ type: 'text', text: `Content '${content_key}' updated (${status}).\n${JSON.stringify(data, null, 2)}` }] };
        }

        const { data, error } = await supabase
          .from('content')
          .insert([{ id: crypto.randomUUID(), content_key, body, page, status, created_at: now, updated_at: now }])
          .select()
          .single();
        if (error) return { content: [{ type: 'text', text: `Content insert error: ${error.message}` }], isError: true };
        return { content: [{ type: 'text', text: `Content '${content_key}' created (${status}).\n${JSON.stringify(data, null, 2)}` }] };
      }

      localStore.content = localStore.content || [];
      const idx = localStore.content.findIndex((c: any) => c.content_key === content_key);
      if (idx >= 0) {
        localStore.content[idx] = { ...localStore.content[idx], body, page, status, updated_at: now };
        return { content: [{ type: 'text', text: `Content '${content_key}' updated (${status}, local fallback).` }] };
      }
      const newItem = { id: crypto.randomUUID(), content_key, body, page, status, created_at: now, updated_at: now };
      localStore.content.unshift(newItem);
      return { content: [{ type: 'text', text: `Content '${content_key}' created (${status}, local fallback).` }] };
    }
  );

  server.registerTool(
    'coreiq_publish_content',
    {
      title: 'Publish Content',
      description: 'Set an existing content record\'s status to PUBLISHED by content_key.',
      inputSchema: { content_key: z.string() },
    },
    async ({ content_key }) => {
      const now = new Date().toISOString();

      if (supabase) {
        const { data, error } = await supabase
          .from('content')
          .update({ status: 'PUBLISHED', updated_at: now })
          .eq('content_key', content_key)
          .select()
          .single();
        if (error) return { content: [{ type: 'text', text: `Publish error: ${error.message}` }], isError: true };
        if (!data) return { content: [{ type: 'text', text: `No content found for key '${content_key}'.` }], isError: true };
        return { content: [{ type: 'text', text: `Content '${content_key}' published.` }] };
      }

      localStore.content = localStore.content || [];
      const idx = localStore.content.findIndex((c: any) => c.content_key === content_key);
      if (idx < 0) return { content: [{ type: 'text', text: `No content found for key '${content_key}' (local fallback).` }], isError: true };
      localStore.content[idx].status = 'PUBLISHED';
      localStore.content[idx].updated_at = now;
      return { content: [{ type: 'text', text: `Content '${content_key}' published (local fallback).` }] };
    }
  );


  server.registerTool(
    'coreiq_content_health',
    {
      title: 'Content Health',
      description: 'Returns live published/placeholder counts for all 94 manifest keys (Scope: READ_CONTENT).',
      inputSchema: {},
    },
    async () => {
      try {
        const base = process.env.VITE_API_URL || 'https://coreiqcreate.onrender.com';
        const res = await fetch(`${base}/api/v1/content/health`, {
          headers: { Authorization: `Bearer ${process.env.COREIQ_API_KEY || ''}` },
        });
        const data = await res.json();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: 'text', text: `Health error: ${e.message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'coreiq_get_content',
    {
      title: 'Get Content',
      description: 'Fetch a single content item by manifest key (Scope: READ_CONTENT).',
      inputSchema: {
        content_key: z.string().describe('Manifest content key, e.g. home.hero.title'),
      },
    },
    async ({ content_key }) => {
      try {
        const base = process.env.VITE_API_URL || 'https://coreiqcreate.onrender.com';
        const res = await fetch(`${base}/api/v1/content/${encodeURIComponent(content_key)}`, {
          headers: { Authorization: `Bearer ${process.env.COREIQ_API_KEY || ''}` },
        });
        const data = await res.json();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: 'text', text: `Get error: ${e.message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'coreiq_resolve_content',
    {
      title: 'Resolve Content',
      description: 'Resolve a content key the same way the frontend does.',
      inputSchema: {
        content_key: z.string().describe('Manifest content key'),
      },
    },
    async ({ content_key }) => {
      try {
        const base = process.env.VITE_API_URL || 'https://coreiqcreate.onrender.com';
        const res = await fetch(`${base}/api/v1/content/${encodeURIComponent(content_key)}/resolve`, {
          headers: { Authorization: `Bearer ${process.env.COREIQ_API_KEY || ''}` },
        });
        const data = await res.json();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: 'text', text: `Resolve error: ${e.message}` }], isError: true };
      }
    }
  );

  server.registerTool(
    'coreiq_list_placeholders',
    {
      title: 'List Placeholders',
      description: 'Return all keys still in PLACEHOLDER status for a given page.',
      inputSchema: {
        page: z.string().describe('Page name: home | learn | solutions | apps | tools | about'),
      },
    },
    async ({ page }) => {
      try {
        const base = process.env.VITE_API_URL || 'https://coreiqcreate.onrender.com';
        const res = await fetch(`${base}/api/v1/content/placeholders/${encodeURIComponent(page)}`, {
          headers: { Authorization: `Bearer ${process.env.COREIQ_API_KEY || ''}` },
        });
        const data = await res.json();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      } catch (e: any) {
        return { content: [{ type: 'text', text: `Placeholders error: ${e.message}` }], isError: true };
      }
    }
  );

  return server;
}

export function mountCoreIQMcp(app: any, mcpServer: McpServer, authMiddleware: any) {
  app.post('/mcp', authMiddleware, async (req: Request, res: Response) => {
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => transport.close());
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });
}

// ── Compatibility exports for server.ts ──────────────────────
export function getCoreIQToolsList(): string[] {
  return [
    'coreiq_content_health','coreiq_get_content','coreiq_resolve_content',
    'coreiq_list_placeholders','verify_content','get_all_content',
    'coreiq_update_content','coreiq_get_config'
  ];
}

export async function executeCoreIQTool(
  toolName: string, args: Record<string, any>
): Promise<any> {
  return { tool: toolName, args, status: 'delegated_to_mcp_server' };
}

export async function getContentByKey(
  supabase: any, localStore: any, key: string
): Promise<any> {
  if (supabase) {
    const { data } = await supabase.from('content').select('*').eq('key', key).maybeSingle();
    if (data) return data;
  }
  const store = localStore?.content || [];
  return store.find((c: any) => c.key === key) ?? null;
}

export async function resolveContentInternal(
  item: any, key: string
): Promise<string> {
  if (!item) return '';
  return item.value ?? item.body ?? '';
}

export async function verifyContentInternal(
  supabase: any, localStore: any, key: string
): Promise<{ valid: boolean; key: string }> {
  const item = await getContentByKey(supabase, localStore, key);
  return { valid: !!item, key };
}

export async function getPagePlaceholders(
  supabase: any, localStore: any, page: string
): Promise<any[]> {
  if (supabase) {
    const { data } = await supabase
      .from('content')
      .select('*')
      .like('key', `${page}.%`);
    if (data) return data;
  }
  const store = localStore?.content || [];
  return store.filter((c: any) => c.key?.startsWith(`${page}.`));
}

export async function getAllContent(
  supabase: any, localStore: any
): Promise<any[]> {
  if (supabase) {
    const { data } = await supabase.from('content').select('*');
    if (data) return data;
  }
  return localStore?.content || [];
}
