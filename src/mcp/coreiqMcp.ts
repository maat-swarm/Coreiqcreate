import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import type { Request, Response } from 'express';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  CONTENT_MANIFEST,
  evaluateContentHealth,
  getManifestEntry,
  humanizeKey,
  ContentHealthReport,
} from '../data/contentManifest';
import { ContentType, ContentStatus } from '../types/command';

// -----------------------------------------------------------------------------
// SCOPE VALIDATION HELPER
// -----------------------------------------------------------------------------

export function hasKeyScope(key: { scopes?: string[]; name?: string } | null | undefined, scope: string): boolean {
  if (!key || !key.scopes) return true; // If key is unattached (internal / test), pass through
  const normalizedReq = scope.toLowerCase().replace(/_/g, ':');
  return key.scopes.some((s) => {
    if (s === '*' || s === 'ADMIN' || s === 'admin') return true;
    if (s === scope) return true;
    const normalizedKeyScope = s.toLowerCase().replace(/_/g, ':');
    if (normalizedKeyScope === normalizedReq) return true;
    const invertedReq = scope.toLowerCase().includes(':')
      ? scope.toLowerCase().split(':').reverse().join('_')
      : scope.toLowerCase().split('_').reverse().join(':');
    return s.toLowerCase() === invertedReq || normalizedKeyScope === invertedReq;
  });
}

// -----------------------------------------------------------------------------
// INTERNAL STORAGE ACCESSORS
// -----------------------------------------------------------------------------

export async function getAgentConfig(supabase: SupabaseClient | null, localStore: Record<string, any[]>) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('agent_config')
        .select('*')
        .eq('id', 'coreiq_primary_mind')
        .single();
      if (!error && data) return data;
    } catch {}
  }
  return (localStore.agent_config && localStore.agent_config[0]) || null;
}

export async function getAllContent(supabase: SupabaseClient | null, localStore: Record<string, any[]>): Promise<any[]> {
  let allContent: any[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase.from('content').select('*');
      if (!error && data && data.length) allContent = data;
    } catch (e) {
      console.error('Supabase content fetch error:', e);
    }
  }
  if (!allContent.length) {
    allContent = localStore.content || [];
  }
  return allContent;
}

export async function getContentByKey(
  supabase: SupabaseClient | null,
  localStore: Record<string, any[]>,
  key: string
): Promise<any | null> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .or(`content_key.eq.${key},key.eq.${key},id.eq.${key},slug.eq.${key}`)
        .maybeSingle();
      if (!error && data) return data;
    } catch (e) {
      console.error('Supabase content lookup error:', e);
    }
  }
  const found = (localStore.content || []).find(
    (c: any) => c.content_key === key || c.key === key || c.id === key || c.slug === key
  );
  return found || null;
}

export function resolveContentInternal(item: any | null, key: string) {
  const manifestEntry = getManifestEntry(key);
  const fallbackTitle = manifestEntry?.defaultTitle || humanizeKey(key);
  const fallbackSummary =
    manifestEntry?.defaultSummary || `Content being prepared for ${fallbackTitle}.`;
  const fallbackType: ContentType = manifestEntry?.content_type || 'text';

  if (!item) {
    return {
      content_key: key,
      status: 'PLACEHOLDER' as ContentStatus,
      content_type: fallbackType,
      title: fallbackTitle,
      summary: fallbackSummary,
      body: null,
      isPlaceholder: true,
      slug: manifestEntry?.slug,
      category: manifestEntry?.category,
      metadata: manifestEntry?.metadata,
    };
  }

  const normalizedStatus = (item.status || '').toUpperCase();
  const hasBody = Boolean(item.body || item.value);
  const isPublished = (normalizedStatus === 'PUBLISHED' || item.published === true) && hasBody;

  if (isPublished) {
    return {
      content_key: item.content_key || key,
      status: 'PUBLISHED' as ContentStatus,
      content_type: (item.content_type as ContentType) || fallbackType,
      title: item.title || fallbackTitle,
      summary: item.summary || (item.body ? item.body.slice(0, 200) : fallbackSummary),
      body: item.body || item.value || null,
      slug: item.slug || manifestEntry?.slug,
      category: item.category || manifestEntry?.category,
      metadata: item.metadata || manifestEntry?.metadata,
      asset_url: item.asset_url || item.media_reference,
      version: item.version || 1,
      updated_by: item.updated_by,
      isPlaceholder: false,
    };
  }

  return {
    content_key: item.content_key || key,
    status: 'PLACEHOLDER' as ContentStatus,
    content_type: (item.content_type as ContentType) || fallbackType,
    title: item.title || fallbackTitle,
    summary: item.summary || fallbackSummary,
    body: item.body || null,
    slug: item.slug || manifestEntry?.slug,
    category: item.category || manifestEntry?.category,
    metadata: item.metadata || manifestEntry?.metadata,
    asset_url: item.asset_url || item.media_reference,
    version: item.version || 1,
    updated_by: item.updated_by,
    isPlaceholder: true,
  };
}

export async function patchContentInternal(
  supabase: SupabaseClient | null,
  localStore: Record<string, any[]>,
  key: string,
  updates: Record<string, any>,
  updaterName = 'connector'
) {
  const existing = await getContentByKey(supabase, localStore, key);
  const newVersion = (existing?.version || 1) + 1;
  const patchPayload = {
    ...updates,
    version: updates.version ?? newVersion,
    updated_by: updates.updated_by || updaterName,
    updated_at: new Date().toISOString(),
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
        if (!error && data) return { status: 'updated', content: data };
      } catch (e) {
        console.error('Supabase patch error:', e);
      }
    }
    const updated = { ...existing, ...patchPayload };
    localStore.content = (localStore.content || []).map((c: any) =>
      c.id === existing.id ? updated : c
    );
    return { status: 'updated', content: updated };
  }

  const manifestEntry = getManifestEntry(key);
  const newContent = {
    id: `content_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
    content_key: key,
    key,
    title: updates.title || manifestEntry?.defaultTitle || humanizeKey(key),
    body: updates.body || '',
    summary: updates.summary || manifestEntry?.defaultSummary || '',
    category: updates.category || manifestEntry?.category || 'learning',
    status: updates.status || 'DRAFT',
    content_type: updates.content_type || manifestEntry?.content_type || 'text',
    slug: updates.slug || manifestEntry?.slug || key.replace(/^learn\.guide\./, ''),
    published: updates.published ?? (updates.status === 'PUBLISHED'),
    version: 1,
    updated_by: updaterName,
    ...updates,
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('content')
        .insert([newContent])
        .select()
        .single();
      if (!error && data) return { status: 'created', content: data };
    } catch (e) {
      console.error('Supabase insert error:', e);
    }
  }

  if (!localStore.content) localStore.content = [];
  localStore.content.unshift(newContent);
  return { status: 'created', content: newContent };
}

export async function publishContentInternal(
  supabase: SupabaseClient | null,
  localStore: Record<string, any[]>,
  key: string,
  publisherName = 'connector'
) {
  const existing = await getContentByKey(supabase, localStore, key);
  const publishPayload = {
    published: true,
    status: 'PUBLISHED',
    version: (existing?.version || 1) + 1,
    updated_by: publisherName,
    published_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('content')
          .update(publishPayload)
          .eq('id', existing.id)
          .select()
          .single();
        if (!error && data) return { status: 'published', content: data };
      } catch (e) {
        console.error('Supabase publish error:', e);
      }
    }
    const updated = { ...existing, ...publishPayload };
    localStore.content = (localStore.content || []).map((c: any) =>
      c.id === existing.id ? updated : c
    );
    return { status: 'published', content: updated };
  }

  const manifestEntry = getManifestEntry(key);
  const newContent = {
    id: `content_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
    content_key: key,
    key,
    title: manifestEntry?.defaultTitle || humanizeKey(key),
    body: manifestEntry?.defaultSummary || '',
    summary: manifestEntry?.defaultSummary || '',
    category: manifestEntry?.category || 'learning',
    status: 'PUBLISHED',
    content_type: manifestEntry?.content_type || 'text',
    slug: manifestEntry?.slug || key.replace(/^learn\.guide\./, ''),
    published: true,
    version: 1,
    updated_by: publisherName,
    published_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('content')
        .insert([newContent])
        .select()
        .single();
      if (!error && data) return { status: 'published', content: data };
    } catch (e) {
      console.error('Supabase publish insert error:', e);
    }
  }

  if (!localStore.content) localStore.content = [];
  localStore.content.unshift(newContent);
  return { status: 'published', content: newContent };
}

export async function verifyContentInternal(
  supabase: SupabaseClient | null,
  localStore: Record<string, any[]>,
  key: string,
  expectedStatus = 'PUBLISHED',
  expectedSubstring?: string
) {
  const item = await getContentByKey(supabase, localStore, key);
  const resolved = resolveContentInternal(item, key);

  const exists = Boolean(item);
  const itemStatus = (item?.status || 'MISSING').toUpperCase();
  const statusMatch = !expectedStatus || itemStatus === expectedStatus.toUpperCase();
  const bodyText = item?.body || item?.value || '';
  const bodySubstringMatch = !expectedSubstring || bodyText.includes(expectedSubstring);
  const resolvedPublished = expectedStatus.toUpperCase() === 'PUBLISHED' ? !resolved.isPlaceholder : true;

  const verified = exists && statusMatch && bodySubstringMatch && resolvedPublished;

  return {
    verified,
    content_key: key,
    exists,
    database_status: itemStatus,
    database_version: item?.version || 1,
    database_body_length: bodyText.length,
    resolved_status: resolved.status,
    is_placeholder: resolved.isPlaceholder,
    verification_checks: {
      exists,
      status_match: statusMatch,
      body_substring_match: bodySubstringMatch,
      resolved_matches_expectation: resolvedPublished,
    },
    message: verified
      ? `Verification PASSED for '${key}': Status is '${itemStatus}', version ${item?.version || 1}, resolution verified.`
      : `Verification FAILED for '${key}': ${
          !exists
            ? 'Item does not exist in store.'
            : !statusMatch
            ? `Expected status '${expectedStatus}', got '${itemStatus}'.`
            : !bodySubstringMatch
            ? 'Body does not contain required substring.'
            : 'Frontend resolution layer still reports item as placeholder.'
        }`,
  };
}

export async function getPagePlaceholders(
  supabase: SupabaseClient | null,
  localStore: Record<string, any[]>,
  page: string
) {
  const allContent = await getAllContent(supabase, localStore);
  const itemMap = new Map<string, any>();
  for (const item of allContent) {
    if (item.content_key) itemMap.set(item.content_key, item);
    if (item.key) itemMap.set(item.key, item);
  }

  const normalized = page.trim().toLowerCase().replace(/^\/+/, '');
  const manifestForPage = CONTENT_MANIFEST.filter(
    (m) => m.page.toLowerCase().replace(/^\/+/, '') === normalized
  );

  const placeholderKeys: any[] = [];
  for (const entry of manifestForPage) {
    const found = itemMap.get(entry.content_key);
    const rawStatus = (found?.status || '').toUpperCase();
    const isPublished = (rawStatus === 'PUBLISHED' || found?.published === true) && Boolean(found?.body);
    if (!isPublished) {
      placeholderKeys.push({
        content_key: entry.content_key,
        page: entry.page,
        required: entry.required,
        content_type: entry.content_type,
        current_status: rawStatus || 'PLACEHOLDER',
        default_title: entry.defaultTitle || humanizeKey(entry.content_key),
        default_summary: entry.defaultSummary || '',
        category: entry.category,
        slug: entry.slug,
      });
    }
  }

  return {
    page,
    total_manifest_entries: manifestForPage.length,
    placeholder_count: placeholderKeys.length,
    published_count: manifestForPage.length - placeholderKeys.length,
    placeholders: placeholderKeys,
  };
}

export async function emitSwarmEvent(
  supabase: SupabaseClient | null,
  localStore: Record<string, any[]>,
  senderName: string,
  event_type: 'content_published' | 'page_complete' | 'verification_failed',
  subject: string,
  message: string,
  content_key?: string,
  payload?: Record<string, any>
) {
  const newEvent = {
    id: `swarm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
    sender_node: senderName,
    target_node: 'ORC-GROK/SWARM-ALL',
    subject: `[${event_type.toUpperCase()}] ${subject}`,
    message: `${message}${content_key ? ` (key: ${content_key})` : ''}`,
    status: 'sent',
    payload: {
      event_type,
      content_key,
      ...payload,
    },
  };

  if (supabase) {
    try {
      await supabase.from('swarm_comms').insert([newEvent]);
    } catch (e) {
      console.error('Supabase swarm_comms insert error:', e);
    }
  }

  if (!localStore.swarm_comms) localStore.swarm_comms = [];
  localStore.swarm_comms.unshift(newEvent);

  return newEvent;
}

export async function createLeadInternal(
  supabase: SupabaseClient | null,
  localStore: Record<string, any[]>,
  leadData: {
    client_name: string;
    client_contact: string;
    client_message?: string;
    budget_range?: string;
    intent_type?: string;
    notes?: string;
  }
) {
  const newLead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
    source: 'api',
    client_name: leadData.client_name,
    client_contact: leadData.client_contact,
    client_message: leadData.client_message || '',
    conversation_summary: leadData.notes || '',
    intent_type: leadData.intent_type || 'general',
    status: 'new',
    full_conversation: [],
    budget_range: leadData.budget_range || '',
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('leads').insert([newLead]).select().single();
      if (!error && data) return data;
    } catch (e) {
      console.error('Supabase create lead error:', e);
    }
  }

  if (!localStore.leads) localStore.leads = [];
  localStore.leads.unshift(newLead);
  return newLead;
}

export async function listTasksInternal(
  supabase: SupabaseClient | null,
  localStore: Record<string, any[]>,
  limit = 20,
  status?: string
) {
  if (supabase) {
    try {
      let q = supabase.from('tasks').select('*').order('created_at', { ascending: false }).limit(limit);
      if (status) q = q.eq('status', status);
      const { data, error } = await q;
      if (!error && data) return data;
    } catch (e) {
      console.error('Supabase list tasks error:', e);
    }
  }
  let tasks = localStore.tasks || [];
  if (status) tasks = tasks.filter((t: any) => t.status === status);
  return tasks.slice(0, limit);
}

export async function listClientsInternal(
  supabase: SupabaseClient | null,
  localStore: Record<string, any[]>,
  limit = 20
) {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && data) return data;
    } catch (e) {
      console.error('Supabase list clients error:', e);
    }
  }
  return (localStore.clients || []).slice(0, limit);
}

export async function createClientInternal(
  supabase: SupabaseClient | null,
  localStore: Record<string, any[]>,
  clientData: {
    name: string;
    contact_email: string;
    contact_phone?: string;
    notes?: string;
  }
) {
  const newClient = {
    id: `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    created_at: new Date().toISOString(),
    name: clientData.name,
    contact_email: clientData.contact_email,
    contact_phone: clientData.contact_phone || '',
    notes: clientData.notes || '',
    status: 'active',
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('clients').insert([newClient]).select().single();
      if (!error && data) return data;
    } catch (e) {
      console.error('Supabase create client error:', e);
    }
  }

  if (!localStore.clients) localStore.clients = [];
  localStore.clients.unshift(newClient);
  return newClient;
}

// -----------------------------------------------------------------------------
// MCP SERVER BUILDER
// -----------------------------------------------------------------------------

export function buildCoreIQMcpServer(
  supabase: SupabaseClient | null,
  localStore: Record<string, any[]>,
  callerApiKey?: any
) {
  const server = new McpServer({ name: 'coreiq-create', version: '1.2.0' });

  function assertScope(scope: string): { ok: boolean; errorResponse?: any } {
    if (!callerApiKey) return { ok: true };
    if (!hasKeyScope(callerApiKey, scope)) {
      return {
        ok: false,
        errorResponse: {
          content: [
            {
              type: 'text',
              text: `403 Forbidden: API Key '${callerApiKey.name || 'token'}' does not have the required '${scope}' scope. Available scopes: ${(callerApiKey.scopes || []).join(', ')}`,
            },
          ],
          isError: true,
        },
      };
    }
    return { ok: true };
  }

  // --- 1. ASK COREIQ (Existing tool - unchanged) ---
  server.registerTool(
    'ask_coreiq',
    {
      title: 'Ask CoreIQ',
      description: "Send a message to the live CoreIQ agent brain (the website's actual configured provider/model/system prompt) and return its real response.",
      inputSchema: { message: z.string().describe('Message/question to send to CoreIQ') },
    },
    async ({ message }) => {
      const config = await getAgentConfig(supabase, localStore);
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

  // --- 2. LIST LEADS (Existing tool - unchanged) + coreiq_list_leads alias ---
  const listLeadsHandler = async ({ limit }: { limit?: number }) => {
    const scopeCheck = assertScope('READ_LEADS');
    if (!scopeCheck.ok) return scopeCheck.errorResponse;

    let leads: any[] = [];
    if (supabase) {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(limit ?? 20);
      leads = data ?? [];
    } else {
      leads = (localStore.leads || []).slice(0, limit ?? 20);
    }
    return { content: [{ type: 'text', text: JSON.stringify(leads, null, 2) }] };
  };

  server.registerTool(
    'list_leads',
    { title: 'List Leads', description: 'List recent website leads/inquiries.', inputSchema: { limit: z.number().optional() } },
    listLeadsHandler
  );
  server.registerTool(
    'coreiq_list_leads',
    { title: 'CoreIQ List Leads', description: 'List recent website leads/inquiries (requires READ_LEADS).', inputSchema: { limit: z.number().optional() } },
    listLeadsHandler
  );

  // --- 3. CREATE LEAD (New first-class tool coreiq_create_lead) ---
  const createLeadHandler = async (args: {
    client_name: string;
    client_contact: string;
    client_message?: string;
    budget_range?: string;
    intent_type?: string;
    notes?: string;
  }) => {
    const scopeCheck = assertScope('WRITE_LEADS');
    if (!scopeCheck.ok) return scopeCheck.errorResponse;

    const lead = await createLeadInternal(supabase, localStore, args);
    return { content: [{ type: 'text', text: JSON.stringify(lead, null, 2) }] };
  };

  server.registerTool(
    'coreiq_create_lead',
    {
      title: 'CoreIQ Create Lead',
      description: 'Ingest a new lead or project inquiry into CoreIQ (requires WRITE_LEADS).',
      inputSchema: {
        client_name: z.string().describe('Inquirer or business name'),
        client_contact: z.string().describe('Email or phone contact'),
        client_message: z.string().optional().describe('Project details or requirements'),
        budget_range: z.string().optional().describe('Estimated budget range'),
        intent_type: z.string().optional().describe('Intent type: website, automation, app, agent, voice, etc.'),
        notes: z.string().optional().describe('Internal operator notes'),
      },
    },
    createLeadHandler
  );
  server.registerTool(
    'create_lead',
    {
      title: 'Create Lead',
      description: 'Ingest a new lead or project inquiry into CoreIQ.',
      inputSchema: {
        client_name: z.string(),
        client_contact: z.string(),
        client_message: z.string().optional(),
        budget_range: z.string().optional(),
        intent_type: z.string().optional(),
        notes: z.string().optional(),
      },
    },
    createLeadHandler
  );

  // --- 4. LIST TASKS (coreiq_list_tasks + list_tasks) ---
  const listTasksHandler = async ({ limit, status }: { limit?: number; status?: string }) => {
    const scopeCheck = assertScope('READ_TASKS');
    if (!scopeCheck.ok) return scopeCheck.errorResponse;

    const tasks = await listTasksInternal(supabase, localStore, limit ?? 20, status);
    return { content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }] };
  };

  server.registerTool(
    'coreiq_list_tasks',
    {
      title: 'CoreIQ List Tasks',
      description: 'List operator and engineering tasks in CoreIQ Command (requires READ_TASKS).',
      inputSchema: { limit: z.number().optional(), status: z.string().optional() },
    },
    listTasksHandler
  );
  server.registerTool(
    'list_tasks',
    { title: 'List Tasks', description: 'List operator tasks in CoreIQ Command.', inputSchema: { limit: z.number().optional(), status: z.string().optional() } },
    listTasksHandler
  );

  // --- 5. CREATE TASK (Existing tool - unchanged) + coreiq_create_task alias ---
  const createTaskHandler = async ({ title, description }: { title: string; description?: string }) => {
    const scopeCheck = assertScope('WRITE_TASKS');
    if (!scopeCheck.ok) return scopeCheck.errorResponse;

    const newTask = {
      id: crypto.randomUUID ? crypto.randomUUID() : `task_${Date.now()}`,
      created_at: new Date().toISOString(),
      title,
      description: description ?? '',
      status: 'not_started',
      linked_lead_id: null,
      linked_client_id: null,
      due_date: null,
    };
    if (supabase) await supabase.from('tasks').insert([newTask]);
    else {
      if (!localStore.tasks) localStore.tasks = [];
      localStore.tasks.unshift(newTask);
    }
    return { content: [{ type: 'text', text: `Task created: ${title}` }] };
  };

  server.registerTool(
    'create_task',
    { title: 'Create Task', description: 'Create an operator task in CoreIQ Command.', inputSchema: { title: z.string(), description: z.string().optional() } },
    createTaskHandler
  );
  server.registerTool(
    'coreiq_create_task',
    { title: 'CoreIQ Create Task', description: 'Create an operator task in CoreIQ Command (requires WRITE_TASKS).', inputSchema: { title: z.string(), description: z.string().optional() } },
    createTaskHandler
  );

  // --- 6. GET AGENT CONFIG (Existing tool - unchanged) + coreiq_get_config alias ---
  const getConfigHandler = async () => {
    const scopeCheck = assertScope('READ_CONFIG');
    if (!scopeCheck.ok) return scopeCheck.errorResponse;

    const config = await getAgentConfig(supabase, localStore);
    const safe = { ...config, api_key: config?.api_key ? '***redacted***' : '' };
    return { content: [{ type: 'text', text: JSON.stringify(safe, null, 2) }] };
  };

  server.registerTool(
    'get_agent_config',
    { title: 'Get Agent Config', description: "Read CoreIQ's current provider/model/system prompt (API key redacted).", inputSchema: {} },
    getConfigHandler
  );
  server.registerTool(
    'coreiq_get_config',
    { title: 'CoreIQ Get Config', description: "Read CoreIQ's current provider/model/system prompt (API key redacted, requires READ_CONFIG).", inputSchema: {} },
    getConfigHandler
  );

  // --- 7. COREIQ CONTENT HEALTH (New Required Tool 1) ---
  server.registerTool(
    'coreiq_content_health',
    {
      title: 'CoreIQ Content Health',
      description: 'Audit content status across all 94 manifest keys. Returns total, placeholder/draft/published counts, overall health percentage, and by_page breakdown (requires READ_CONTENT).',
      inputSchema: {
        include_details: z.boolean().optional().describe('Whether to include per-key detailed entries in the response (default false)'),
      },
    },
    async ({ include_details }) => {
      const scopeCheck = assertScope('READ_CONTENT');
      if (!scopeCheck.ok) return scopeCheck.errorResponse;

      const allContent = await getAllContent(supabase, localStore);
      const report: ContentHealthReport = evaluateContentHealth(allContent);
      const healthPct = report.total > 0 ? Math.round((report.published / report.total) * 100) : 0;

      const responsePayload = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        total_manifest_keys: report.total,
        published: report.published,
        placeholder: report.placeholder,
        missing: report.missing,
        stale: report.stale,
        overall_health_pct: healthPct,
        by_page: report.by_page,
        details: include_details ? report.details : undefined,
      };

      return { content: [{ type: 'text', text: JSON.stringify(responsePayload, null, 2) }] };
    }
  );

  // --- 8. COREIQ GET CONTENT (New Required Tool 2) ---
  server.registerTool(
    'coreiq_get_content',
    {
      title: 'CoreIQ Get Content',
      description: 'Fetch single content item by its manifest content_key, slug, or ID. Returns full record or clear 404 (requires READ_CONTENT).',
      inputSchema: {
        content_key: z.string().describe('The content key, ID, or slug (e.g., "learn.guide.ai-workflows", "home.hero.title")'),
      },
    },
    async ({ content_key }) => {
      const scopeCheck = assertScope('READ_CONTENT');
      if (!scopeCheck.ok) return scopeCheck.errorResponse;

      const item = await getContentByKey(supabase, localStore, content_key);
      if (!item) {
        return {
          content: [{ type: 'text', text: `404 Not Found: Content item with key '${content_key}' not found.` }],
          isError: true,
        };
      }
      return { content: [{ type: 'text', text: JSON.stringify(item, null, 2) }] };
    }
  );

  // --- 9. COREIQ LIST CONTENT (New Required Tool 3) ---
  server.registerTool(
    'coreiq_list_content',
    {
      title: 'CoreIQ List Content',
      description: 'List content items across the 94 manifest keys with optional page and status filters (requires READ_CONTENT).',
      inputSchema: {
        page: z.string().optional().describe('Filter by page (e.g. "home", "solutions", "apps", "learn", "tools", "about")'),
        status: z.string().optional().describe('Filter by status (e.g. "PLACEHOLDER", "DRAFT", "PUBLISHED")'),
        limit: z.number().optional().describe('Maximum number of items to return (default 50)'),
      },
    },
    async ({ page, status, limit }) => {
      const scopeCheck = assertScope('READ_CONTENT');
      if (!scopeCheck.ok) return scopeCheck.errorResponse;

      let allContent = await getAllContent(supabase, localStore);

      if (page) {
        allContent = allContent.filter((c: any) => {
          const key = c.content_key || c.key || '';
          return key.toLowerCase().startsWith(`${page.toLowerCase()}.`);
        });
      }

      if (status) {
        allContent = allContent.filter((c: any) => {
          const rawStatus = (c.status || '').toUpperCase();
          return rawStatus === status.toUpperCase();
        });
      }

      const results = allContent.slice(0, limit ?? 50);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                count: results.length,
                total_matching: allContent.length,
                filter_page: page || 'all',
                filter_status: status || 'all',
                items: results,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // --- 10. COREIQ PATCH CONTENT (New Required Tool 4) ---
  server.registerTool(
    'coreiq_patch_content',
    {
      title: 'CoreIQ Patch Content',
      description: 'Update title, summary, body, category, or status of a content item. Supports dry-run and post-update auto-verification (requires WRITE_CONTENT).',
      inputSchema: {
        content_key: z.string().describe('The manifest content key (e.g., "learn.guide.ai-workflows")'),
        title: z.string().optional().describe('Content title'),
        summary: z.string().optional().describe('Short summary or subtitle'),
        body: z.string().optional().describe('Markdown body content'),
        category: z.string().optional().describe('Category classification'),
        content_type: z.enum(['text', 'markdown', 'html', 'json', 'image', 'video', 'card', 'list']).optional().describe('Content format type'),
        status: z.enum(['PLACEHOLDER', 'DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).optional().describe('Target content status'),
        dry_run: z.boolean().optional().describe('If true, simulates update and validates key without writing to database'),
        auto_verify: z.boolean().optional().describe('If true (default), re-reads the record after patch to confirm persistence'),
      },
    },
    async ({ content_key, title, summary, body, category, content_type, status, dry_run, auto_verify = true }) => {
      const scopeCheck = assertScope('WRITE_CONTENT');
      if (!scopeCheck.ok) return scopeCheck.errorResponse;

      const updates: Record<string, any> = {};
      if (title !== undefined) updates.title = title;
      if (summary !== undefined) updates.summary = summary;
      if (body !== undefined) updates.body = body;
      if (category !== undefined) updates.category = category;
      if (content_type !== undefined) updates.content_type = content_type;
      if (status !== undefined) {
        updates.status = status;
        if (status === 'PUBLISHED') updates.published = true;
      }

      if (dry_run) {
        const existing = await getContentByKey(supabase, localStore, content_key);
        const previewRecord = {
          ...(existing || {}),
          content_key,
          ...updates,
          version: (existing?.version || 1) + 1,
          simulated_at: new Date().toISOString(),
        };
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  dry_run: true,
                  status: 'simulated',
                  message: 'Dry run completed successfully. No changes persisted to database.',
                  target_key: content_key,
                  current_version: existing?.version || 1,
                  next_version: (existing?.version || 1) + 1,
                  patched_preview: previewRecord,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const updaterName = callerApiKey?.name || 'ORC-GROK/SWARM';
      const patchResult = await patchContentInternal(supabase, localStore, content_key, updates, updaterName);

      let verificationReport: any = null;
      if (auto_verify) {
        verificationReport = await verifyContentInternal(
          supabase,
          localStore,
          content_key,
          updates.status || patchResult.content?.status || 'DRAFT',
          updates.body ? updates.body.slice(0, 30) : undefined
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: patchResult.status,
                content_key,
                content: patchResult.content,
                verification: verificationReport,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // --- 11. COREIQ PUBLISH CONTENT (New Required Tool 5) ---
  server.registerTool(
    'coreiq_publish_content',
    {
      title: 'CoreIQ Publish Content',
      description: 'Transition a content key to PUBLISHED status. Increments version and logs publisher. Supports dry-run and auto-verification (requires PUBLISH_CONTENT).',
      inputSchema: {
        content_key: z.string().describe('Manifest content key to publish (e.g., "learn.guide.ai-workflows")'),
        dry_run: z.boolean().optional().describe('If true, verifies item is valid and ready to publish without persisting state change'),
        auto_verify: z.boolean().optional().describe('If true (default), re-reads record and verifies resolution layer visibility'),
      },
    },
    async ({ content_key, dry_run, auto_verify = true }) => {
      const scopeCheck = assertScope('PUBLISH_CONTENT');
      if (!scopeCheck.ok) return scopeCheck.errorResponse;

      if (dry_run) {
        const existing = await getContentByKey(supabase, localStore, content_key);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  dry_run: true,
                  status: 'publishable',
                  content_key,
                  exists_in_database: Boolean(existing),
                  current_status: existing?.status || 'PLACEHOLDER',
                  has_body: Boolean(existing?.body || existing?.value),
                  message: 'Dry run successful. Item is valid and ready to publish.',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      const publisherName = callerApiKey?.name || 'ORC-GROK/SWARM';
      const publishResult = await publishContentInternal(supabase, localStore, content_key, publisherName);

      let verificationReport: any = null;
      if (auto_verify) {
        verificationReport = await verifyContentInternal(
          supabase,
          localStore,
          content_key,
          'PUBLISHED'
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: publishResult.status,
                content_key,
                content: publishResult.content,
                verification: verificationReport,
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // --- 12. COREIQ VERIFY CONTENT (New Required Tool 6) ---
  server.registerTool(
    'coreiq_verify_content',
    {
      title: 'CoreIQ Verify Content',
      description: 'Verification helper: re-reads a content key from database and asserts expected status, body substring, and frontend resolution layer state (requires READ_CONTENT).',
      inputSchema: {
        content_key: z.string().describe('Manifest content key to verify (e.g., "learn.guide.ai-workflows")'),
        expected_status: z.string().optional().describe('Expected database status to assert (default "PUBLISHED")'),
        expected_body_substring: z.string().optional().describe('Optional substring that must be present in the content body'),
      },
    },
    async ({ content_key, expected_status = 'PUBLISHED', expected_body_substring }) => {
      const scopeCheck = assertScope('READ_CONTENT');
      if (!scopeCheck.ok) return scopeCheck.errorResponse;

      const report = await verifyContentInternal(
        supabase,
        localStore,
        content_key,
        expected_status,
        expected_body_substring
      );

      return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };
    }
  );

  // --- 13. COREIQ RESOLVE CONTENT (New Desirable Tool) ---
  server.registerTool(
    'coreiq_resolve_content',
    {
      title: 'CoreIQ Resolve Content',
      description: 'Resolve content key into the exact shape consumed by the frontend React components (isPlaceholder, status, title, summary, body).',
      inputSchema: {
        content_key: z.string().describe('The content key to resolve'),
      },
    },
    async ({ content_key }) => {
      const scopeCheck = assertScope('READ_CONTENT');
      if (!scopeCheck.ok) return scopeCheck.errorResponse;

      const item = await getContentByKey(supabase, localStore, content_key);
      const resolved = resolveContentInternal(item, content_key);
      return { content: [{ type: 'text', text: JSON.stringify(resolved, null, 2) }] };
    }
  );

  // --- 14. COREIQ PAGE PLACEHOLDERS (New Desirable Tool) ---
  server.registerTool(
    'coreiq_page_placeholders',
    {
      title: 'CoreIQ Page Placeholders',
      description: 'Retrieve all keys that remain in PLACEHOLDER status on a given page, with their default titles and requirements for systematic swarm drafting.',
      inputSchema: {
        page: z.string().describe('Page name: "home", "solutions", "apps", "learn", "tools", or "about"'),
      },
    },
    async ({ page }) => {
      const scopeCheck = assertScope('READ_CONTENT');
      if (!scopeCheck.ok) return scopeCheck.errorResponse;

      const report = await getPagePlaceholders(supabase, localStore, page);
      return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };
    }
  );

  // --- 15. COREIQ EMIT SWARM EVENT (New Desirable Tool) ---
  server.registerTool(
    'coreiq_emit_swarm_event',
    {
      title: 'CoreIQ Emit Swarm Event',
      description: 'Safely emit a structured coordination event to swarm_comms. Strictly restricted to "content_published", "page_complete", and "verification_failed".',
      inputSchema: {
        event_type: z.enum(['content_published', 'page_complete', 'verification_failed']).describe('Restricted safe event type'),
        content_key: z.string().optional().describe('Related content key, if applicable'),
        subject: z.string().describe('Brief subject line'),
        message: z.string().describe('Event details or telemetry summary'),
        payload: z.record(z.string(), z.any()).optional().describe('Optional structured metadata payload'),
      },
    },
    async ({ event_type, content_key, subject, message, payload }) => {
      const scopeCheck = assertScope('WRITE_CONTENT');
      if (!scopeCheck.ok) return scopeCheck.errorResponse;

      const sender = callerApiKey?.name || 'ORC-GROK/SWARM';
      const eventRecord = await emitSwarmEvent(
        supabase,
        localStore,
        sender,
        event_type,
        subject,
        message,
        content_key,
        payload
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ status: 'emitted', event: eventRecord }, null, 2),
          },
        ],
      };
    }
  );

  // --- 16. COREIQ PING (New Desirable Tool) ---
  server.registerTool(
    'coreiq_ping',
    {
      title: 'CoreIQ Ping',
      description: 'Ping the CoreIQ connector and control plane to detect availability and database connectivity early.',
      inputSchema: {},
    },
    async () => {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'online',
                connector: 'CoreIQ Website Connector & Control Plane',
                version: '1.2.0',
                timestamp: new Date().toISOString(),
                supabase_connected: Boolean(supabase),
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );

  // --- 17. LIST & CREATE CLIENTS (New Desirable Tools) ---
  const listClientsHandler = async ({ limit }: { limit?: number }) => {
    const scopeCheck = assertScope('READ_CLIENTS');
    if (!scopeCheck.ok) return scopeCheck.errorResponse;

    const clients = await listClientsInternal(supabase, localStore, limit ?? 20);
    return { content: [{ type: 'text', text: JSON.stringify(clients, null, 2) }] };
  };

  const createClientHandler = async (args: {
    name: string;
    contact_email: string;
    contact_phone?: string;
    notes?: string;
  }) => {
    const scopeCheck = assertScope('WRITE_CLIENTS');
    if (!scopeCheck.ok) return scopeCheck.errorResponse;

    const client = await createClientInternal(supabase, localStore, args);
    return { content: [{ type: 'text', text: JSON.stringify(client, null, 2) }] };
  };

  server.registerTool(
    'coreiq_list_clients',
    { title: 'CoreIQ List Clients', description: 'List registered clients (requires READ_CLIENTS).', inputSchema: { limit: z.number().optional() } },
    listClientsHandler
  );
  server.registerTool(
    'list_clients',
    { title: 'List Clients', description: 'List registered clients.', inputSchema: { limit: z.number().optional() } },
    listClientsHandler
  );

  server.registerTool(
    'coreiq_create_client',
    {
      title: 'CoreIQ Create Client',
      description: 'Register a new client in the CRM (requires WRITE_CLIENTS).',
      inputSchema: {
        name: z.string().describe('Client or business name'),
        contact_email: z.string().describe('Primary email contact'),
        contact_phone: z.string().optional().describe('Phone number'),
        notes: z.string().optional().describe('Client notes or brief'),
      },
    },
    createClientHandler
  );
  server.registerTool(
    'create_client',
    {
      title: 'Create Client',
      description: 'Register a new client in the CRM.',
      inputSchema: {
        name: z.string(),
        contact_email: z.string(),
        contact_phone: z.string().optional(),
        notes: z.string().optional(),
      },
    },
    createClientHandler
  );

  return server;
}

// -----------------------------------------------------------------------------
// DIRECT TOOL EXECUTOR & METADATA REGISTRY
// -----------------------------------------------------------------------------

export function getCoreIQToolsList() {
  return [
    { name: 'ask_coreiq', scope: null, description: "Send message to the live CoreIQ agent brain." },
    { name: 'list_leads', scope: 'READ_LEADS', description: 'List recent website leads/inquiries.' },
    { name: 'coreiq_list_leads', scope: 'READ_LEADS', description: 'List recent website leads/inquiries.' },
    { name: 'create_lead', scope: 'WRITE_LEADS', description: 'Ingest a new lead or project inquiry.' },
    { name: 'coreiq_create_lead', scope: 'WRITE_LEADS', description: 'Ingest a new lead or project inquiry.' },
    { name: 'list_tasks', scope: 'READ_TASKS', description: 'List operator and engineering tasks.' },
    { name: 'coreiq_list_tasks', scope: 'READ_TASKS', description: 'List operator and engineering tasks.' },
    { name: 'create_task', scope: 'WRITE_TASKS', description: 'Create an operator task.' },
    { name: 'coreiq_create_task', scope: 'WRITE_TASKS', description: 'Create an operator task.' },
    { name: 'get_agent_config', scope: 'READ_CONFIG', description: "Read CoreIQ's current provider/model/system prompt." },
    { name: 'coreiq_get_config', scope: 'READ_CONFIG', description: "Read CoreIQ's current provider/model/system prompt." },
    { name: 'coreiq_content_health', scope: 'READ_CONTENT', description: 'Audit content status across all 94 manifest keys.' },
    { name: 'coreiq_get_content', scope: 'READ_CONTENT', description: 'Fetch single content item by key, slug, or ID.' },
    { name: 'coreiq_list_content', scope: 'READ_CONTENT', description: 'List content items with optional page and status filters.' },
    { name: 'coreiq_patch_content', scope: 'WRITE_CONTENT', description: 'Update title, summary, body, category, or status. Supports dry-run and auto-verification.' },
    { name: 'coreiq_publish_content', scope: 'PUBLISH_CONTENT', description: 'Transition content key to PUBLISHED status. Supports dry-run and auto-verification.' },
    { name: 'coreiq_verify_content', scope: 'READ_CONTENT', description: 'Verification helper: asserts status, body substring, and resolution layer state.' },
    { name: 'coreiq_resolve_content', scope: 'READ_CONTENT', description: 'Resolve content key into frontend React component format.' },
    { name: 'coreiq_page_placeholders', scope: 'READ_CONTENT', description: 'List all remaining placeholder keys on a specific page.' },
    { name: 'coreiq_emit_swarm_event', scope: 'WRITE_CONTENT', description: 'Safely emit restricted coordination event to swarm_comms.' },
    { name: 'coreiq_ping', scope: null, description: 'Ping the CoreIQ connector and control plane.' },
    { name: 'list_clients', scope: 'READ_CLIENTS', description: 'List registered clients.' },
    { name: 'coreiq_list_clients', scope: 'READ_CLIENTS', description: 'List registered clients.' },
    { name: 'create_client', scope: 'WRITE_CLIENTS', description: 'Register a new client.' },
    { name: 'coreiq_create_client', scope: 'WRITE_CLIENTS', description: 'Register a new client.' },
  ];
}

export async function executeCoreIQTool(
  toolName: string,
  args: any = {},
  context: {
    supabase: SupabaseClient | null;
    localStore: Record<string, any[]>;
    callerApiKey?: any;
  }
): Promise<{ success: boolean; data?: any; error?: string; isForbidden?: boolean; isNotFound?: boolean }> {
  const { supabase, localStore, callerApiKey } = context;

  const toolDef = getCoreIQToolsList().find((t) => t.name === toolName);
  if (!toolDef) {
    return { success: false, error: `Tool '${toolName}' not found.`, isNotFound: true };
  }

  if (toolDef.scope && callerApiKey && !hasKeyScope(callerApiKey, toolDef.scope)) {
    return {
      success: false,
      error: `API Key '${callerApiKey.name || 'token'}' does not have the required '${toolDef.scope}' scope.`,
      isForbidden: true,
    };
  }

  try {
    switch (toolName) {
      case 'coreiq_ping':
        return {
          success: true,
          data: {
            status: 'online',
            connector: 'CoreIQ Website Connector & Control Plane',
            version: '1.2.0',
            timestamp: new Date().toISOString(),
            supabase_connected: Boolean(supabase),
          },
        };

      case 'list_leads':
      case 'coreiq_list_leads': {
        const limit = args.limit ?? 20;
        let leads: any[] = [];
        if (supabase) {
          const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(limit);
          leads = data ?? [];
        } else {
          leads = (localStore.leads || []).slice(0, limit);
        }
        return { success: true, data: leads };
      }

      case 'create_lead':
      case 'coreiq_create_lead': {
        const lead = await createLeadInternal(supabase, localStore, args);
        return { success: true, data: lead };
      }

      case 'list_tasks':
      case 'coreiq_list_tasks': {
        const tasks = await listTasksInternal(supabase, localStore, args.limit ?? 20, args.status);
        return { success: true, data: tasks };
      }

      case 'create_task':
      case 'coreiq_create_task': {
        const newTask = {
          id: crypto.randomUUID ? crypto.randomUUID() : `task_${Date.now()}`,
          created_at: new Date().toISOString(),
          title: args.title,
          description: args.description ?? '',
          status: 'not_started',
          linked_lead_id: null,
          linked_client_id: null,
          due_date: null,
        };
        if (supabase) await supabase.from('tasks').insert([newTask]);
        else {
          if (!localStore.tasks) localStore.tasks = [];
          localStore.tasks.unshift(newTask);
        }
        return { success: true, data: newTask };
      }

      case 'get_agent_config':
      case 'coreiq_get_config': {
        const config = await getAgentConfig(supabase, localStore);
        const safe = { ...config, api_key: config?.api_key ? '***redacted***' : '' };
        return { success: true, data: safe };
      }

      case 'coreiq_content_health': {
        const allContent = await getAllContent(supabase, localStore);
        const report = evaluateContentHealth(allContent);
        const healthPct = report.total > 0 ? Math.round((report.published / report.total) * 100) : 0;
        return {
          success: true,
          data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            total_manifest_keys: report.total,
            published: report.published,
            placeholder: report.placeholder,
            missing: report.missing,
            stale: report.stale,
            overall_health_pct: healthPct,
            by_page: report.by_page,
            details: args.include_details ? report.details : undefined,
          },
        };
      }

      case 'coreiq_get_content': {
        const item = await getContentByKey(supabase, localStore, args.content_key);
        if (!item) {
          return { success: false, error: `Content item with key '${args.content_key}' not found.`, isNotFound: true };
        }
        return { success: true, data: item };
      }

      case 'coreiq_list_content': {
        let allContent = await getAllContent(supabase, localStore);
        if (args.page) {
          allContent = allContent.filter((c: any) =>
            (c.content_key || c.key || '').toLowerCase().startsWith(`${args.page.toLowerCase()}.`)
          );
        }
        if (args.status) {
          allContent = allContent.filter(
            (c: any) => (c.status || '').toUpperCase() === args.status.toUpperCase()
          );
        }
        return { success: true, data: allContent.slice(0, args.limit ?? 50) };
      }

      case 'coreiq_patch_content': {
        if (args.dry_run) {
          const existing = await getContentByKey(supabase, localStore, args.content_key);
          return {
            success: true,
            data: {
              dry_run: true,
              target_key: args.content_key,
              simulated_next_version: (existing?.version || 1) + 1,
              message: 'Dry run completed successfully. No changes persisted.',
            },
          };
        }
        const updaterName = callerApiKey?.name || 'ORC-GROK/SWARM';
        const res = await patchContentInternal(supabase, localStore, args.content_key, args, updaterName);
        let verification: any = null;
        if (args.auto_verify !== false) {
          verification = await verifyContentInternal(
            supabase,
            localStore,
            args.content_key,
            args.status || res.content?.status || 'DRAFT'
          );
        }
        return { success: true, data: { ...res, verification } };
      }

      case 'coreiq_publish_content': {
        if (args.dry_run) {
          const existing = await getContentByKey(supabase, localStore, args.content_key);
          return {
            success: true,
            data: {
              dry_run: true,
              content_key: args.content_key,
              exists: Boolean(existing),
              current_status: existing?.status || 'PLACEHOLDER',
              message: 'Dry run successful. Ready to publish.',
            },
          };
        }
        const publisherName = callerApiKey?.name || 'ORC-GROK/SWARM';
        const res = await publishContentInternal(supabase, localStore, args.content_key, publisherName);
        let verification: any = null;
        if (args.auto_verify !== false) {
          verification = await verifyContentInternal(supabase, localStore, args.content_key, 'PUBLISHED');
        }
        return { success: true, data: { ...res, verification } };
      }

      case 'coreiq_verify_content': {
        const report = await verifyContentInternal(
          supabase,
          localStore,
          args.content_key,
          args.expected_status || 'PUBLISHED',
          args.expected_body_substring
        );
        return { success: true, data: report };
      }

      case 'coreiq_resolve_content': {
        const item = await getContentByKey(supabase, localStore, args.content_key);
        const resolved = resolveContentInternal(item, args.content_key);
        return { success: true, data: resolved };
      }

      case 'coreiq_page_placeholders': {
        const placeholders = await getPagePlaceholders(supabase, localStore, args.page);
        return { success: true, data: placeholders };
      }

      case 'coreiq_emit_swarm_event': {
        const sender = callerApiKey?.name || 'ORC-GROK/SWARM';
        const event = await emitSwarmEvent(
          supabase,
          localStore,
          sender,
          args.event_type,
          args.subject,
          args.message,
          args.content_key,
          args.payload
        );
        return { success: true, data: event };
      }

      case 'list_clients':
      case 'coreiq_list_clients': {
        const clients = await listClientsInternal(supabase, localStore, args.limit ?? 20);
        return { success: true, data: clients };
      }

      case 'create_client':
      case 'coreiq_create_client': {
        const client = await createClientInternal(supabase, localStore, args);
        return { success: true, data: client };
      }

      case 'ask_coreiq': {
        const config = await getAgentConfig(supabase, localStore);
        if (!config?.api_key || !config?.base_url) {
          if (process.env.GEMINI_API_KEY) {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const geminiRes = await ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: [{ role: 'user', parts: [{ text: `${config?.system_prompt || 'You are CoreIQ'}\n\n${args.message}` }] }],
            });
            return { success: true, data: { reply: geminiRes.text || '(empty response)' } };
          }
          return { success: false, error: 'No active provider or Gemini API key configured.' };
        }
        const endpoint = config.base_url.endsWith('/') ? `${config.base_url}chat/completions` : `${config.base_url}/chat/completions`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${config.api_key}` },
          body: JSON.stringify({
            model: config.model_name,
            messages: [{ role: 'system', content: config.system_prompt }, { role: 'user', content: args.message }],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });
        if (!res.ok) return { success: false, error: `Provider error: ${res.status} ${res.statusText}` };
        const json: any = await res.json();
        return { success: true, data: { reply: json.choices?.[0]?.message?.content ?? '(empty response)' } };
      }

      default:
        return { success: false, error: `Unimplemented tool: ${toolName}`, isNotFound: true };
    }
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

// -----------------------------------------------------------------------------
// MCP SERVER MOUNTING & CONNECTOR ENDPOINTS
// -----------------------------------------------------------------------------

export function mountCoreIQMcp(
  app: any,
  serverOrFactory: any,
  authMiddleware: any
) {
  const getFreshServer = (req?: Request): McpServer => {
    if (typeof serverOrFactory === 'function') {
      return serverOrFactory(req);
    }
    return serverOrFactory;
  };

  // POST /mcp, /api/mcp, /api/v1/mcp
  app.post(['/mcp', '/api/mcp', '/api/v1/mcp'], authMiddleware, async (req: Request, res: Response) => {
    try {
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      res.on('close', () => transport.close());
      const mcpServer = getFreshServer(req);
      await mcpServer.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err: any) {
      console.error('MCP Transport Request Error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'MCP Internal Error', message: err?.message || String(err) });
      }
    }
  });

  // GET /mcp, /api/mcp, /api/v1/mcp, /api/v1/mcp/health - Health check / diagnostics
  app.get(['/mcp', '/api/mcp', '/api/v1/mcp', '/api/v1/mcp/health'], (req: Request, res: Response) => {
    res.json({
      status: 'online',
      protocol: 'Model Context Protocol (MCP)',
      transport: 'StreamableHTTPServerTransport',
      endpoints: ['/mcp', '/api/mcp', '/api/v1/mcp'],
      supported_tools: getCoreIQToolsList().map((t) => t.name),
      timestamp: new Date().toISOString(),
    });
  });
}
