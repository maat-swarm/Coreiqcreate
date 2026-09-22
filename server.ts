import cors from 'cors';
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { buildCoreIQMcpServer, mountCoreIQMcp } from './src/mcp/coreiqMcp';
import { CONTENT_MANIFEST, evaluateContentHealth } from './src/data/contentManifest';
import { GoogleGenAI } from '@google/genai';

const MEM0_API_KEY = process.env.MEM0_API_KEY || '';
const MEM0_USER_ID = process.env.MEM0_USER_ID || 'maat-builder-shared';

async function mem0Search(query: string): Promise<string> {
  if (!MEM0_API_KEY) return '';
  try {
    const res = await fetch('https://api.mem0.ai/v1/memories/search/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${MEM0_API_KEY}` },
      body: JSON.stringify({ query, user_id: MEM0_USER_ID, limit: 5 })
    });
    if (!res.ok) return '';
    const data = await res.json();
    const memories = (data.results ?? []).map((m: any) => m.memory).filter(Boolean);
    return memories.length ? `Relevant memory:\n${memories.join('\n')}` : '';
  } catch { return ''; }
}

async function mem0Save(userMsg: string, assistantMsg: string): Promise<void> {
  if (!MEM0_API_KEY) return;
  try {
    await fetch('https://api.mem0.ai/v1/memories/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Token ${MEM0_API_KEY}` },
      body: JSON.stringify({
        messages: [{ role: 'user', content: userMsg }, { role: 'assistant', content: assistantMsg }],
        user_id: MEM0_USER_ID
      })
    });
  } catch {}
}


const app = express();
app.use(cors({ origin: true, credentials: true }));
const PORT = 3000;

app.use(express.json());

// Initialize Supabase client for server-side API proxy
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

let supabase: SupabaseClient | null = null;
if (supabaseUrl && supabaseAnonKey) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

// In-memory fallback stores if Supabase tables are still initializing
const localStore: Record<string, any[]> = {
  leads: [],
  tasks: [],
  clients: [],
  content: [],
  api_keys: [
    {
      id: 'key_local_dev_master',
      name: 'System Local Master Key',
      key_prefix: 'ciq_live_devmaster...',
      key_hash: crypto.createHash('sha256').update('ciq_live_devmaster_00000000000000000000000000000000').digest('hex'),
      scopes: [
        'READ_LEADS', 'WRITE_LEADS',
        'READ_TASKS', 'WRITE_TASKS',
        'READ_CLIENTS', 'WRITE_CLIENTS',
        'READ_CONTENT', 'WRITE_CONTENT', 'PUBLISH_CONTENT',
        'READ_CONFIG', 'WRITE_CONFIG'
      ],
      revoked: false,
      created_at: new Date().toISOString(),
    }
  ],
  agent_config: [
    {
      id: 'coreiq_primary_mind',
      provider: 'groq',
      model_name: 'llama-3.3-70b-versatile',
      base_url: 'https://api.groq.com/openai/v1',
      api_key: '',
      system_prompt: 'You are CoreIQ, sovereign intelligence for CoreIQ Create.',
      updated_at: new Date().toISOString(),
    }
  ]
};

// Seed localStore with manifest placeholders
function seedLocalStoreManifest() {
  const existingKeys = new Set(localStore.content.map((c: any) => c.content_key || c.key));
  for (const entry of CONTENT_MANIFEST) {
    if (!existingKeys.has(entry.content_key)) {
      const title = entry.defaultTitle || entry.content_key;
      localStore.content.push({
        id: `manifest_${entry.content_key.replace(/[^a-zA-Z0-9_]/g, '_')}`,
        content_key: entry.content_key,
        key: entry.content_key,
        title,
        summary: entry.defaultSummary || `Content being prepared for ${title}.`,
        body: '',
        value: '',
        category: entry.category || 'general',
        content_type: entry.content_type,
        status: 'PLACEHOLDER',
        slug: entry.slug,
        metadata: entry.metadata || {},
        published: false,
        version: 1,
        type: 'text',
        created_at: new Date().toISOString(),
      });
      existingKeys.add(entry.content_key);
    }
  }
}
seedLocalStoreManifest();

interface ApiKeyRecord {
  id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  scopes: string[];
  revoked: boolean;
  last_used_at?: string;
  created_at: string;
}

// Hash helper
function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token.trim()).digest('hex');
}

// Authentication & Scope validation middleware for /api/v1/*
async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'] as string;

  let rawToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.substring(7).trim();
  } else if (apiKeyHeader) {
    rawToken = apiKeyHeader.trim();
  }

  if (!rawToken) {
    return res.status(401).json({
      error: 'Missing API Key',
      message: 'Provide an API key via "Authorization: Bearer ciq_live_..." or "x-api-key" header.',
      docs: '/command#api_keys'
    });
  }

  const tokenHash = hashToken(rawToken);

  let keyRecord: ApiKeyRecord | null = null;

  // Try fetching from Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .eq('key_hash', tokenHash)
        .eq('revoked', false)
        .maybeSingle();

      if (!error && data) {
        keyRecord = data as ApiKeyRecord;
        // Update last_used_at non-blockingly
        supabase
          .from('api_keys')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', keyRecord.id)
          .then(() => {});
      }
    } catch {
      // fallback to memory
    }
  }

  // Fallback to local store
  if (!keyRecord) {
    const found = (localStore.api_keys as ApiKeyRecord[]).find(
      (k) => k.key_hash === tokenHash && !k.revoked
    );
    if (found) {
      keyRecord = found;
      found.last_used_at = new Date().toISOString();
    }
  }

  if (!keyRecord) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or revoked API key token.',
    });
  }

  (req as any).apiKey = keyRecord;
  next();
}

function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = (req as any).apiKey as ApiKeyRecord;
    if (!key) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const normalizedReq = scope.toLowerCase().replace(/_/g, ':');
    const hasScope = key.scopes.some((s) => {
      if (s === '*' || s === 'ADMIN' || s === 'admin') return true;
      if (s === scope) return true;
      const normalizedKeyScope = s.toLowerCase().replace(/_/g, ':');
      if (normalizedKeyScope === normalizedReq) return true;
      // Reverse mapping: content:read <-> read_content, content:write <-> write_content
      const invertedReq = scope.toLowerCase().includes(':')
        ? scope.toLowerCase().split(':').reverse().join('_')
        : scope.toLowerCase().split('_').reverse().join(':');
      return s.toLowerCase() === invertedReq || normalizedKeyScope === invertedReq;
    });

    if (!hasScope) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `API Key '${key.name}' does not have the required '${scope}' scope.`,
        available_scopes: key.scopes,
      });
    }

    next();
  };
}

// -----------------------------------------------------------------------------
// PUBLIC API V1 ENDPOINTS
// -----------------------------------------------------------------------------

// Health / Status ping
const coreIQMcpServer = buildCoreIQMcpServer(supabase, localStore);
mountCoreIQMcp(app, coreIQMcpServer, authenticateApiKey);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'CoreIQ Command Autonomous Gateway',
    timestamp: new Date().toISOString(),
    supabase_configured: Boolean(supabase),
  });
});

app.get('/api/v1/ping', (req, res) => {
  res.json({
    status: 'online',
    system: 'CoreIQ Command Autonomous Gateway',
    timestamp: new Date().toISOString(),
    supabase_configured: Boolean(supabase),
  });
});

// --- LEADS ---
app.get('/api/v1/leads', authenticateApiKey, requireScope('READ_LEADS'), async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return res.json({ count: data.length, leads: data });
      }
    } catch (e) {
      console.error('API get leads error:', e);
    }
  }
  res.json({ count: localStore.leads.length, leads: localStore.leads });
});

app.post('/api/v1/leads', authenticateApiKey, requireScope('WRITE_LEADS'), async (req, res) => {
  const {
    client_name,
    client_contact,
    client_message,
    conversation_summary,
    intent_type,
    source,
    budget_range,
    notes,
  } = req.body;

  if (!client_name || !client_contact) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'client_name and client_contact are required fields.',
    });
  }

  const newLead = {
    id: crypto.randomUUID ? crypto.randomUUID() : `lead_${Date.now()}`,
    created_at: new Date().toISOString(),
    client_name,
    client_contact,
    client_message: client_message || '',
    conversation_summary: conversation_summary || '',
    intent_type: intent_type || 'custom',
    source: source || 'api',
    status: 'new',
    budget_range: budget_range || '',
    notes: notes || '',
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('leads').insert([newLead]).select().single();
      if (!error && data) {
        return res.status(201).json({ status: 'created', lead: data });
      }
    } catch (e) {
      console.error('API insert lead error:', e);
    }
  }

  localStore.leads.unshift(newLead);
  res.status(201).json({ status: 'created', lead: newLead });
});

// --- TASKS ---
app.get('/api/v1/tasks', authenticateApiKey, requireScope('READ_TASKS'), async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return res.json({ count: data.length, tasks: data });
      }
    } catch (e) {
      console.error('API get tasks error:', e);
    }
  }
  res.json({ count: localStore.tasks.length, tasks: localStore.tasks });
});

app.post('/api/v1/tasks', authenticateApiKey, requireScope('WRITE_TASKS'), async (req, res) => {
  const { title, description, status, due_date, linked_lead_id, linked_client_id } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Bad Request', message: 'title is required.' });
  }

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
        return res.status(201).json({ status: 'created', task: data });
      }
    } catch (e) {
      console.error('API insert task error:', e);
    }
  }

  localStore.tasks.unshift(newTask);
  res.status(201).json({ status: 'created', task: newTask });
});

// --- CLIENTS ---
app.get('/api/v1/clients', authenticateApiKey, requireScope('READ_CLIENTS'), async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return res.json({ count: data.length, clients: data });
      }
    } catch (e) {
      console.error('API get clients error:', e);
    }
  }
  res.json({ count: localStore.clients.length, clients: localStore.clients });
});

app.post('/api/v1/clients', authenticateApiKey, requireScope('WRITE_CLIENTS'), async (req, res) => {
  const { name, contact_email, contact_phone, notes } = req.body;

  if (!name || !contact_email) {
    return res.status(400).json({ error: 'Bad Request', message: 'name and contact_email are required.' });
  }

  const newClient = {
    id: crypto.randomUUID ? crypto.randomUUID() : `client_${Date.now()}`,
    created_at: new Date().toISOString(),
    name,
    contact_email,
    contact_phone: contact_phone || '',
    notes: notes || '',
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('clients').insert([newClient]).select().single();
      if (!error && data) {
        return res.status(201).json({ status: 'created', client: data });
      }
    } catch (e) {
      console.error('API insert client error:', e);
    }
  }

  localStore.clients.unshift(newClient);
  res.status(201).json({ status: 'created', client: newClient });
});

// --- CONTENT ---
app.get('/api/v1/content', authenticateApiKey, requireScope('READ_CONTENT'), async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        return res.json({ count: data.length, content: data });
      }
    } catch (e) {
      console.error('API get content error:', e);
    }
  }
  res.json({ count: localStore.content.length, content: localStore.content });
});

app.post('/api/v1/content', authenticateApiKey, requireScope('WRITE_CONTENT'), async (req, res) => {
  const { title, body, category, media_reference, published, key, value, type } = req.body;

  const newContent = {
    id: crypto.randomUUID ? crypto.randomUUID() : `content_${Date.now()}`,
    created_at: new Date().toISOString(),
    title: title || '',
    body: body || '',
    category: category || 'general',
    media_reference: media_reference || '',
    published: published !== false,
    key: key || '',
    value: value || '',
    type: type || 'text',
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('content').insert([newContent]).select().single();
      if (!error && data) {
        return res.status(201).json({ status: 'created', content: data });
      }
    } catch (e) {
      console.error('API insert content error:', e);
    }
  }

  localStore.content.unshift(newContent);
  res.status(201).json({ status: 'created', content: newContent });
});

// --- EXTENDED CONTENT & HEALTH ENDPOINTS ---

// Health check endpoint (declared BEFORE /:key)
app.get('/api/v1/content/health', authenticateApiKey, requireScope('content:read'), async (req, res) => {
  let allContent: any[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase.from('content').select('*');
      if (!error && data) allContent = data;
    } catch (e) {
      console.error('API content health check error:', e);
    }
  }
  if (!allContent.length) {
    allContent = localStore.content;
  }

  const healthReport = evaluateContentHealth(allContent);
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    health: healthReport,
  });
});

// Single content item lookup by key, content_key, id, or slug
app.get('/api/v1/content/:key', authenticateApiKey, requireScope('content:read'), async (req, res) => {
  const { key } = req.params;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .or(`content_key.eq.${key},key.eq.${key},id.eq.${key},slug.eq.${key}`)
        .maybeSingle();
      if (!error && data) {
        return res.json({ status: 'found', content: data });
      }
    } catch (e) {
      console.error('API get single content error:', e);
    }
  }

  const found = localStore.content.find(
    (c: any) => c.content_key === key || c.key === key || c.id === key || c.slug === key
  );

  if (found) {
    return res.json({ status: 'found', content: found });
  }

  return res.status(404).json({
    error: 'Not Found',
    message: `Content item with key '${key}' not found.`,
  });
});

// Update / patch content item by key
app.patch('/api/v1/content/:key', authenticateApiKey, requireScope('content:write'), async (req, res) => {
  const { key } = req.params;
  const updates = req.body || {};
  const apiKey = (req as any).apiKey as ApiKeyRecord;

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
    } catch (e) {
      console.error('API patch find error:', e);
    }
  }
  if (!existing) {
    existing = localStore.content.find(
      (c: any) => c.content_key === key || c.key === key || c.id === key || c.slug === key
    );
  }

  const newVersion = (existing?.version || 1) + 1;
  const patchPayload = {
    ...updates,
    version: updates.version ?? newVersion,
    updated_by: updates.updated_by || apiKey?.name || 'api',
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
          return res.json({ status: 'updated', content: data });
        }
      } catch (e) {
        console.error('API supabase patch content error:', e);
      }
    }

    const updated = { ...existing, ...patchPayload };
    localStore.content = localStore.content.map((c: any) => (c.id === existing.id ? updated : c));
    return res.json({ status: 'updated', content: updated });
  }

  // If not existing, create it
  const newContent = {
    id: crypto.randomUUID ? crypto.randomUUID() : `content_${Date.now()}`,
    created_at: new Date().toISOString(),
    content_key: key,
    key: key,
    title: updates.title || key,
    body: updates.body || '',
    summary: updates.summary || '',
    category: updates.category || 'learning',
    status: updates.status || 'PLACEHOLDER',
    content_type: updates.content_type || 'text',
    slug: updates.slug || key.replace(/^learn\.guide\./, ''),
    published: updates.published ?? false,
    version: 1,
    updated_by: apiKey?.name || 'api',
    ...updates,
  };

  if (supabase) {
    try {
      const { data, error } = await supabase.from('content').insert([newContent]).select().single();
      if (!error && data) {
        return res.status(201).json({ status: 'created', content: data });
      }
    } catch (e) {
      console.error('API insert patched content error:', e);
    }
  }

  localStore.content.unshift(newContent);
  return res.status(201).json({ status: 'created', content: newContent });
});

// Publish content item by key
app.post('/api/v1/content/:key/publish', authenticateApiKey, requireScope('content:publish'), async (req, res) => {
  const { key } = req.params;
  const apiKey = (req as any).apiKey as ApiKeyRecord;

  let existing: any = null;
  if (supabase) {
    try {
      const { data } = await supabase
        .from('content')
        .select('*')
        .or(`content_key.eq.${key},key.eq.${key},id.eq.${key},slug.eq.${key}`)
        .maybeSingle();
      if (data) existing = data;
    } catch (e) {
      console.error('API publish find error:', e);
    }
  }
  if (!existing) {
    existing = localStore.content.find(
      (c: any) => c.content_key === key || c.key === key || c.id === key || c.slug === key
    );
  }

  const publishPayload = {
    published: true,
    status: 'PUBLISHED',
    version: (existing?.version || 1) + 1,
    updated_by: apiKey?.name || 'agent-publisher',
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
        if (!error && data) {
          return res.json({ status: 'published', content: data });
        }
      } catch (e) {
        console.error('API publish error:', e);
      }
    }

    const published = { ...existing, ...publishPayload };
    localStore.content = localStore.content.map((c: any) => (c.id === existing.id ? published : c));
    return res.json({ status: 'published', content: published });
  }

  return res.status(404).json({
    error: 'Not Found',
    message: `Cannot publish: content item with key '${key}' does not exist.`,
  });
});

// --- AGENT CONFIG ---
app.get('/api/v1/config', authenticateApiKey, requireScope('READ_CONFIG'), async (req, res) => {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('agent_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (!error && data) {
        return res.json({ config: data });
      }
    } catch (e) {
      console.error('API get config error:', e);
    }
  }
  res.json({ config: localStore.agent_config[0] });
});

app.post('/api/v1/config', authenticateApiKey, requireScope('WRITE_CONFIG'), async (req, res) => {
  const { provider, model_name, base_url, api_key, system_prompt } = req.body;

  const updatedConfig = {
    id: 'coreiq_primary_mind',
    provider: provider || 'groq',
    model_name: model_name || 'openai/gpt-oss-120b',
    base_url: base_url || 'https://api.groq.com/openai/v1',
    api_key: api_key || '',
    system_prompt: system_prompt || '',
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('agent_config')
        .upsert(updatedConfig)
        .select()
        .single();
      if (!error && data) {
        return res.json({ status: 'updated', config: data });
      }
    } catch (e) {
      console.error('API update config error:', e);
    }
  }

  localStore.agent_config[0] = updatedConfig;
  res.json({ status: 'updated', config: updatedConfig });
});

// --- PUBLIC ASK ENDPOINT ---
app.post('/api/ask', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    // Load agent config from Supabase or fallback
    let agentConfig = localStore.agent_config[0];
    if (supabase) {
      const { data } = await supabase
        .from('agent_config')
        .select('*')
        .limit(1)
        .maybeSingle();
      if (data) agentConfig = data;
    }

    const apiKey = agentConfig?.api_key || '';
    const baseUrl = agentConfig?.base_url || 'https://api.groq.com/openai/v1';
    const modelName = agentConfig?.model_name || 'openai/gpt-oss-120b';
    const systemPrompt = agentConfig?.system_prompt || 'You are CoreIQ, an intelligent creation engine.';

    const memContext = await mem0Search(message);
    const enrichedPrompt = memContext ? `${systemPrompt}\n\n${memContext}` : systemPrompt;

    let assistantMessage = '';

    if (apiKey) {
      const messages = [
        { role: 'system', content: enrichedPrompt },
        ...history.slice(-6),
        { role: 'user', content: message }
      ];

      const groqRes = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      });

      if (groqRes.ok) {
        const groqData = await groqRes.json();
        assistantMessage = groqData.choices?.[0]?.message?.content || '';
      } else {
        const errText = await groqRes.text();
        console.warn('Groq response not OK:', errText);
      }
    }

    // Fallback to Gemini if assistantMessage is empty and GEMINI_API_KEY is available
    if (!assistantMessage && process.env.GEMINI_API_KEY) {
      const modelsToTry = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const contents = [
        ...history.slice(-6).map((h: any) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content || '' }]
        })),
        {
          role: 'user',
          parts: [{ text: `${enrichedPrompt}\n\nUser Question: ${message}` }]
        }
      ];

      for (const model of modelsToTry) {
        try {
          const geminiRes = await ai.models.generateContent({
            model,
            contents,
          });
          if (geminiRes?.text) {
            assistantMessage = geminiRes.text;
            break;
          }
        } catch (geminiErr) {
          console.warn(`Gemini model ${model} fallback error:`, geminiErr);
        }
      }
    }

    if (!assistantMessage) {
      if (!apiKey && !process.env.GEMINI_API_KEY) {
        assistantMessage = `Hello! I am CoreIQ, your intelligent creation engine. I can help architect websites, automation workflows, AI agents, and tools. To activate real-time neural processing, please configure your API key in the Agent Brain command center or set GEMINI_API_KEY in your environment.`;
      } else {
        assistantMessage = `CoreIQ is analyzing your request: "${message}". We are ready to help architect, automate, and build your digital solution. Explore our solutions, tools, and guides to proceed.`;
      }
    }

    // Save lead if conversation is substantial
    if (history.length >= 2 && supabase) {
      const lead = {
        id: crypto.randomUUID ? crypto.randomUUID() : `lead_${Date.now()}`,
        created_at: new Date().toISOString(),
        client_name: 'Website Visitor',
        client_contact: '',
        client_message: message,
        conversation_summary: assistantMessage.slice(0, 300),
        intent_type: 'custom',
        source: 'ask_page',
        status: 'new',
      };
      supabase.from('leads').insert([lead]).then(() => {});
    }

    await mem0Save(message, assistantMessage);
    return res.json({ assistantMessage });

  } catch (e) {
    console.error('Ask endpoint error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// -----------------------------------------------------------------------------
// VITE MIDDLEWARE & STATIC ASSET SERVING
// -----------------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CoreIQ Command Engine & API Gateway active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
