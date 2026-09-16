import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const app = express();
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
        'READ_CONTENT', 'WRITE_CONTENT',
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

    if (!key.scopes.includes(scope)) {
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
    model_name: model_name || 'llama-3.3-70b-versatile',
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
    const modelName = agentConfig?.model_name || 'llama-3.3-70b-versatile';
    const systemPrompt = agentConfig?.system_prompt || 'You are CoreIQ, an intelligent creation engine.';

    if (!apiKey) {
      return res.status(503).json({ error: 'Agent not configured. Set API key in Agent Brain.' });
    }

    const messages = [
      { role: 'system', content: systemPrompt },
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

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      console.error('Groq error:', errText);
      return res.status(502).json({ error: 'AI provider error', detail: errText });
    }

    const groqData = await groqRes.json();
    const assistantMessage = groqData.choices?.[0]?.message?.content || '';

    // Save lead if conversation is substantial
    if (history.length >= 2 && supabase) {
      const lead = {
        id: crypto.randomUUID(),
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

    return res.json({ assistantMessage });

  } catch (e) {
    console.error('Ask endpoint error:', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

startServer();
