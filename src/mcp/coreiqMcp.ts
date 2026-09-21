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
    'ask_coreiq',
    {
      title: 'Ask CoreIQ',
      description: "Send a message to the live CoreIQ agent brain (the website's actual configured provider/model/system prompt) and return its real response.",
      inputSchema: { message: z.string().describe('Message/question to send to CoreIQ') },
    },
    async ({ message }) => {
      const config = await getAgentConfig();
      if (!config?.api_key || !config?.base_url) {
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
    'list_leads',
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
    'create_task',
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
    'get_agent_config',
    { title: 'Get Agent Config', description: "Read CoreIQ's current provider/model/system prompt (API key redacted).", inputSchema: {} },
    async () => {
      const config = await getAgentConfig();
      const safe = { ...config, api_key: config?.api_key ? '***redacted***' : '' };
      return { content: [{ type: 'text', text: JSON.stringify(safe, null, 2) }] };
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
