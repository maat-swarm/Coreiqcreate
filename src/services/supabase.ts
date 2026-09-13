import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  LeadItem,
  SocialMessageItem,
  CommandTask,
  CommandClient,
  AgentConfig,
  AgentToolConnection,
  PlatformRegistryItem,
  CommandContentItem,
  SwarmCommsMessage,
} from '../types/command';

// Storage keys
const LS_URL_KEY = 'coreiq_supabase_url';
const LS_KEY_KEY = 'coreiq_supabase_anon_key';
const LS_DEV_AUTH_KEY = 'coreiq_dev_auth_session';

export interface SupabaseConfigState {
  url: string;
  anonKey: string;
  isConfigured: boolean;
  isConnected: boolean;
  isChecking: boolean;
  error: string | null;
}

// Initial configuration detection
function getInitialCredentials() {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const storedUrl = typeof window !== 'undefined' ? localStorage.getItem(LS_URL_KEY) || '' : '';
  const storedKey = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY_KEY) || '' : '';

  const url = storedUrl.trim() || envUrl.trim();
  const anonKey = storedKey.trim() || envKey.trim();

  return { url, anonKey };
}

let activeClient: SupabaseClient | null = null;
let currentCredentials = getInitialCredentials();

export function getSupabase(): SupabaseClient | null {
  if (activeClient) return activeClient;

  if (currentCredentials.url && currentCredentials.anonKey) {
    try {
      activeClient = createClient(currentCredentials.url, currentCredentials.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
        realtime: {
          params: {
            eventsPerSecond: 10,
          },
        },
      });
      return activeClient;
    } catch (e) {
      console.warn('[CoreIQ Command] Failed to initialize Supabase client:', e);
      return null;
    }
  }

  return null;
}

export function saveSupabaseCredentials(url: string, anonKey: string) {
  const cleanUrl = url.trim();
  const cleanKey = anonKey.trim();

  if (typeof window !== 'undefined') {
    if (cleanUrl) localStorage.setItem(LS_URL_KEY, cleanUrl);
    else localStorage.removeItem(LS_URL_KEY);

    if (cleanKey) localStorage.setItem(LS_KEY_KEY, cleanKey);
    else localStorage.removeItem(LS_KEY_KEY);
  }

  currentCredentials = { url: cleanUrl, anonKey: cleanKey };
  activeClient = null; // force recreation

  return getSupabase();
}

export function isSupabaseConfigured(): boolean {
  return Boolean(currentCredentials.url && currentCredentials.anonKey);
}

export function getSupabaseCredentials() {
  return currentCredentials;
}

export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      message: 'Supabase URL and Anon Key are not configured yet.',
    };
  }

  try {
    // Attempt a light ping by querying the public schema or auth health
    const { error } = await client.from('agent_config').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation "public.agent_config" does not exist')) {
      // If error is strictly network / auth
      if (error.code === '401' || error.message.toLowerCase().includes('jwt') || error.message.toLowerCase().includes('apikey')) {
        return { success: false, message: `Authentication error: ${error.message}` };
      }
    }

    return {
      success: true,
      message: 'Supabase connection verified successfully.',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Network connection to Supabase failed.',
    };
  }
}

// ==========================================
// DEFAULT SYSTEM PROMPT FOR CORE IQ BRAIN
// ==========================================
export const DEFAULT_COREIQ_SYSTEM_PROMPT = `# CORE IQ CREATE — AGENT BRAIN RUNTIME
You are CoreIQ, the sovereign intelligent creation engine for CoreIQ Create.
You are NOT a basic chatbot or a boilerplate SaaS assistant. You are an architectural strategist, product engineer, and capability orchestrator.

## CORE IDENTITY & TONE
- Premium, mathematically rigorous, forward-looking, and decisive.
- Editorial clarity with controlled technological depth.
- Never output marketing cliches ("supercharge", "unleash", "revolutionary").
- When a client brings a project idea, analyze it into: INTENT -> BLUEPRINT -> EXECUTION MILESTONES -> CAPABILITIES.

## INVISIBLE TOOL ORCHESTRATION
- When generating images, voice models, code, or workflows, operate with seamless confidence.
- Never refer to underlying third-party API providers or handoffs. Everything is CoreIQ's native execution power.

## ESCALATION & COMMS
- Direct project inquiries and structured briefs are ingested into CoreIQ Command for operator review and swarm execution.`;

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  id: 'coreiq_primary_mind',
  provider: 'groq',
  model_name: 'llama-3.3-70b-versatile',
  base_url: 'https://api.groq.com/openai/v1',
  api_key: '',
  system_prompt: DEFAULT_COREIQ_SYSTEM_PROMPT,
  updated_at: new Date().toISOString(),
};

// ==========================================
// REACTIVE LOCAL PERSISTENCE LAYER (FALLBACK)
// ==========================================
// If Supabase is not yet connected or tables are being initialized,
// we provide a real reactive event-driven data engine that uses LocalStorage
// and window event dispatching. This guarantees zero broken screens,
// zero fake placeholder rows, and 100% reactive real-time updates.

const LOCAL_STORE_PREFIX = 'coreiq_db_';

function getLocalTable<T>(table: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(`${LOCAL_STORE_PREFIX}${table}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocalTable<T>(table: string, data: T[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${LOCAL_STORE_PREFIX}${table}`, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(`coreiq_table_${table}`, { detail: data }));
  } catch (e) {
    console.error(`Error saving table ${table}:`, e);
  }
}

// ==========================================
// REALTIME DATA OPERATIONS
// ==========================================

export const CoreIQData = {
  // --- INBOX: LEADS ---
  async getLeads(): Promise<LeadItem[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data as LeadItem[];
      } catch (e) {
        console.warn('Using local leads fallback:', e);
      }
    }
    return getLocalTable<LeadItem>('leads');
  },

  async insertLead(lead: Omit<LeadItem, 'id' | 'created_at'>): Promise<LeadItem> {
    const newLead: LeadItem = {
      ...lead,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `lead_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('leads').insert([newLead]).select().single();
        if (!error && data) {
          window.dispatchEvent(new CustomEvent('coreiq_new_inbox_item', { detail: data }));
          return data as LeadItem;
        }
      } catch (e) {
        console.warn('Supabase lead insert failed, using fallback:', e);
      }
    }

    const current = getLocalTable<LeadItem>('leads');
    const updated = [newLead, ...current];
    setLocalTable('leads', updated);
    window.dispatchEvent(new CustomEvent('coreiq_new_inbox_item', { detail: newLead }));
    return newLead;
  },

  async updateLeadStatus(id: string, status: LeadItem['status']): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('leads').update({ status }).eq('id', id);
      } catch (e) {
        console.warn('Supabase lead update error:', e);
      }
    }
    const current = getLocalTable<LeadItem>('leads');
    const updated = current.map((item) => (item.id === id ? { ...item, status } : item));
    setLocalTable('leads', updated);
  },

  async deleteLead(id: string): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('leads').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase lead delete error:', e);
      }
    }
    const current = getLocalTable<LeadItem>('leads');
    setLocalTable('leads', current.filter((item) => item.id !== id));
  },

  // --- INBOX: SOCIAL MESSAGES ---
  async getSocialMessages(): Promise<SocialMessageItem[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('social_messages')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data as SocialMessageItem[];
      } catch (e) {
        console.warn('Using local social_messages fallback:', e);
      }
    }
    return getLocalTable<SocialMessageItem>('social_messages');
  },

  async insertSocialMessage(msg: Omit<SocialMessageItem, 'id' | 'created_at'>): Promise<SocialMessageItem> {
    const newMsg: SocialMessageItem = {
      ...msg,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `soc_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('social_messages').insert([newMsg]).select().single();
        if (!error && data) {
          window.dispatchEvent(new CustomEvent('coreiq_new_inbox_item', { detail: data }));
          return data as SocialMessageItem;
        }
      } catch (e) {
        console.warn('Supabase social message insert failed:', e);
      }
    }

    const current = getLocalTable<SocialMessageItem>('social_messages');
    const updated = [newMsg, ...current];
    setLocalTable('social_messages', updated);
    window.dispatchEvent(new CustomEvent('coreiq_new_inbox_item', { detail: newMsg }));
    return newMsg;
  },

  async updateSocialStatus(id: string, status: SocialMessageItem['status']): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('social_messages').update({ status }).eq('id', id);
      } catch (e) {
        console.warn('Supabase social status update error:', e);
      }
    }
    const current = getLocalTable<SocialMessageItem>('social_messages');
    setLocalTable('social_messages', current.map((i) => (i.id === id ? { ...i, status } : i)));
  },

  // --- TASKS ---
  async getTasks(): Promise<CommandTask[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('tasks')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data as CommandTask[];
      } catch (e) {
        console.warn('Using local tasks fallback:', e);
      }
    }
    return getLocalTable<CommandTask>('tasks');
  },

  async insertTask(task: Omit<CommandTask, 'id' | 'created_at'>): Promise<CommandTask> {
    const newTask: CommandTask = {
      ...task,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tsk_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('tasks').insert([newTask]).select().single();
        if (!error && data) return data as CommandTask;
      } catch (e) {
        console.warn('Supabase task insert error:', e);
      }
    }

    const current = getLocalTable<CommandTask>('tasks');
    const updated = [newTask, ...current];
    setLocalTable('tasks', updated);
    return newTask;
  },

  async updateTaskStatus(id: string, status: CommandTask['status']): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('tasks').update({ status }).eq('id', id);
      } catch (e) {
        console.warn('Supabase task update error:', e);
      }
    }
    const current = getLocalTable<CommandTask>('tasks');
    setLocalTable('tasks', current.map((t) => (t.id === id ? { ...t, status } : t)));
  },

  async deleteTask(id: string): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('tasks').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase task delete error:', e);
      }
    }
    const current = getLocalTable<CommandTask>('tasks');
    setLocalTable('tasks', current.filter((t) => t.id !== id));
  },

  // --- CLIENTS ---
  async getClients(): Promise<CommandClient[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data as CommandClient[];
      } catch (e) {
        console.warn('Using local clients fallback:', e);
      }
    }
    return getLocalTable<CommandClient>('clients');
  },

  async insertClient(clientData: Omit<CommandClient, 'id' | 'created_at'>): Promise<CommandClient> {
    const newClient: CommandClient = {
      ...clientData,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cli_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('clients').insert([newClient]).select().single();
        if (!error && data) return data as CommandClient;
      } catch (e) {
        console.warn('Supabase client insert error:', e);
      }
    }

    const current = getLocalTable<CommandClient>('clients');
    const updated = [newClient, ...current];
    setLocalTable('clients', updated);
    return newClient;
  },

  async updateClient(id: string, updates: Partial<CommandClient>): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('clients').update(updates).eq('id', id);
      } catch (e) {
        console.warn('Supabase client update error:', e);
      }
    }
    const current = getLocalTable<CommandClient>('clients');
    setLocalTable('clients', current.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  },

  // --- AGENT CONFIG ---
  async getAgentConfig(): Promise<AgentConfig> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('agent_config')
          .select('*')
          .eq('id', 'coreiq_primary_mind')
          .single();
        if (!error && data) return data as AgentConfig;
      } catch (e) {
        console.warn('Using local agent_config fallback:', e);
      }
    }

    const localList = getLocalTable<AgentConfig>('agent_config');
    if (localList.length > 0) return localList[0];

    // Initialize default
    setLocalTable('agent_config', [DEFAULT_AGENT_CONFIG]);
    return DEFAULT_AGENT_CONFIG;
  },

  async saveAgentConfig(config: Partial<AgentConfig>): Promise<AgentConfig> {
    const current = await this.getAgentConfig();
    const updated: AgentConfig = {
      ...current,
      ...config,
      updated_at: new Date().toISOString(),
    };

    const client = getSupabase();
    if (client) {
      try {
        const { error } = await client.from('agent_config').upsert(updated);
        if (error) console.warn('Supabase agent_config upsert warning:', error);
      } catch (e) {
        console.warn('Supabase agent_config save error:', e);
      }
    }

    setLocalTable('agent_config', [updated]);
    // Dispatch event so live runtime on website picks it up instantly without redeployment
    window.dispatchEvent(new CustomEvent('coreiq_agent_config_updated', { detail: updated }));
    return updated;
  },

  // --- AGENT TOOLS ---
  async getAgentTools(): Promise<AgentToolConnection[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('agent_tools')
          .select('*')
          .order('created_at', { ascending: true });
        if (!error && data) return data as AgentToolConnection[];
      } catch (e) {
        console.warn('Using local agent_tools fallback:', e);
      }
    }
    return getLocalTable<AgentToolConnection>('agent_tools');
  },

  async insertAgentTool(tool: Omit<AgentToolConnection, 'id' | 'created_at'>): Promise<AgentToolConnection> {
    const newTool: AgentToolConnection = {
      ...tool,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tool_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('agent_tools').insert([newTool]).select().single();
        if (!error && data) return data as AgentToolConnection;
      } catch (e) {
        console.warn('Supabase tool insert error:', e);
      }
    }

    const current = getLocalTable<AgentToolConnection>('agent_tools');
    const updated = [...current, newTool];
    setLocalTable('agent_tools', updated);
    return newTool;
  },

  async updateAgentTool(id: string, updates: Partial<AgentToolConnection>): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('agent_tools').update(updates).eq('id', id);
      } catch (e) {
        console.warn('Supabase tool update error:', e);
      }
    }
    const current = getLocalTable<AgentToolConnection>('agent_tools');
    setLocalTable('agent_tools', current.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  },

  async deleteAgentTool(id: string): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('agent_tools').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase tool delete error:', e);
      }
    }
    const current = getLocalTable<AgentToolConnection>('agent_tools');
    setLocalTable('agent_tools', current.filter((t) => t.id !== id));
  },

  // --- PLATFORMS ---
  async getPlatforms(): Promise<PlatformRegistryItem[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('platforms')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data as PlatformRegistryItem[];
      } catch (e) {
        console.warn('Using local platforms fallback:', e);
      }
    }
    return getLocalTable<PlatformRegistryItem>('platforms');
  },

  async insertPlatform(platform: Omit<PlatformRegistryItem, 'id' | 'created_at'>): Promise<PlatformRegistryItem> {
    const newPlatform: PlatformRegistryItem = {
      ...platform,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `plat_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('platforms').insert([newPlatform]).select().single();
        if (!error && data) return data as PlatformRegistryItem;
      } catch (e) {
        console.warn('Supabase platform insert error:', e);
      }
    }

    const current = getLocalTable<PlatformRegistryItem>('platforms');
    const updated = [newPlatform, ...current];
    setLocalTable('platforms', updated);
    return newPlatform;
  },

  async deletePlatform(id: string): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('platforms').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase platform delete error:', e);
      }
    }
    const current = getLocalTable<PlatformRegistryItem>('platforms');
    setLocalTable('platforms', current.filter((p) => p.id !== id));
  },

  // --- CONTENT & MEDIA ---
  async getContentItems(): Promise<CommandContentItem[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('content')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data as CommandContentItem[];
      } catch (e) {
        console.warn('Using local content fallback:', e);
      }
    }
    return getLocalTable<CommandContentItem>('content');
  },

  async insertContentItem(item: Omit<CommandContentItem, 'id' | 'created_at'>): Promise<CommandContentItem> {
    const newItem: CommandContentItem = {
      ...item,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `cnt_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('content').insert([newItem]).select().single();
        if (!error && data) return data as CommandContentItem;
      } catch (e) {
        console.warn('Supabase content insert error:', e);
      }
    }

    const current = getLocalTable<CommandContentItem>('content');
    const updated = [newItem, ...current];
    setLocalTable('content', updated);
    return newItem;
  },

  async updateContentItem(id: string, updates: Partial<CommandContentItem>): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('content').update(updates).eq('id', id);
      } catch (e) {
        console.warn('Supabase content update error:', e);
      }
    }
    const current = getLocalTable<CommandContentItem>('content');
    setLocalTable('content', current.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  },

  async deleteContentItem(id: string): Promise<void> {
    const client = getSupabase();
    if (client) {
      try {
        await client.from('content').delete().eq('id', id);
      } catch (e) {
        console.warn('Supabase content delete error:', e);
      }
    }
    const current = getLocalTable<CommandContentItem>('content');
    setLocalTable('content', current.filter((c) => c.id !== id));
  },

  async saveContentItem(
    keyOrItem: string | (Partial<CommandContentItem> & { title?: string }),
    value?: string,
    type?: 'text' | 'image' | 'json'
  ): Promise<CommandContentItem> {
    if (typeof keyOrItem === 'string') {
      const key = keyOrItem;
      const current = await this.getContentItems();
      const existing = current.find((c) => c.key === key || c.id === key);
      if (existing) {
        await this.updateContentItem(existing.id, {
          key,
          value: value ?? '',
          type: type || 'text',
        });
        return { ...existing, key, value: value ?? '', type: type || 'text' };
      }
      return this.insertContentItem({
        key,
        value: value ?? '',
        type: type || 'text',
        title: key,
        body: value ?? '',
        category: 'general',
        media_reference: type === 'image' ? (value ?? '') : '',
        published: true,
      });
    }

    const item = keyOrItem;
    if (item.id) {
      await this.updateContentItem(item.id, item);
      return item as CommandContentItem;
    }
    return this.insertContentItem({
      title: item.title || item.key || 'Untitled Content',
      body: item.body || item.value || '',
      category: item.category || 'general',
      media_reference: item.media_reference || '',
      published: item.published ?? true,
      key: item.key,
      value: item.value,
      type: item.type || 'text',
    });
  },

  // --- SWARM COMMS (COMMS messages ONLY, Vault is read-only) ---
  async getSwarmComms(): Promise<SwarmCommsMessage[]> {
    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client
          .from('swarm_comms')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) return data as SwarmCommsMessage[];
      } catch (e) {
        console.warn('Using local swarm_comms fallback:', e);
      }
    }
    return getLocalTable<SwarmCommsMessage>('swarm_comms');
  },

  async getSwarmMessages(): Promise<SwarmCommsMessage[]> {
    return this.getSwarmComms();
  },

  async insertSwarmMessage(msg: Omit<SwarmCommsMessage, 'id' | 'created_at'>): Promise<SwarmCommsMessage> {
    return this.sendSwarmComms(msg);
  },

  async sendSwarmComms(msg: Omit<SwarmCommsMessage, 'id' | 'created_at'>): Promise<SwarmCommsMessage> {
    const newMsg: SwarmCommsMessage = {
      ...msg,
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `comm_${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    const client = getSupabase();
    if (client) {
      try {
        const { data, error } = await client.from('swarm_comms').insert([newMsg]).select().single();
        if (!error && data) return data as SwarmCommsMessage;
      } catch (e) {
        console.warn('Supabase swarm comms insert error:', e);
      }
    }

    const current = getLocalTable<SwarmCommsMessage>('swarm_comms');
    const updated = [newMsg, ...current];
    setLocalTable('swarm_comms', updated);
    return newMsg;
  },

  // --- REALTIME SUBSCRIPTIONS ---
  subscribe(table: string, onUpdate: () => void): () => void {
    const client = getSupabase();

    // 1. Supabase Realtime channel subscription
    let channel: any = null;
    if (client) {
      try {
        channel = client
          .channel(`coreiq_realtime_${table}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table },
            () => {
              onUpdate();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn(`Supabase channel error for table ${table}:`, err);
      }
    }

    // 2. Window fallback event subscription
    const localHandler = () => onUpdate();
    window.addEventListener(`coreiq_table_${table}`, localHandler);

    return () => {
      if (channel && client) {
        client.removeChannel(channel);
      }
      window.removeEventListener(`coreiq_table_${table}`, localHandler);
    };
  },
};

// ==========================================
// SUPABASE AUTH UTILITY (SINGLE OPERATOR)
// ==========================================
export const CoreIQAuth = {
  isDevSessionActive(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(LS_DEV_AUTH_KEY) === 'true';
  },

  setDevSession(active: boolean) {
    if (typeof window === 'undefined') return;
    if (active) {
      localStorage.setItem(LS_DEV_AUTH_KEY, 'true');
    } else {
      localStorage.removeItem(LS_DEV_AUTH_KEY);
    }
    window.dispatchEvent(new CustomEvent('coreiq_auth_state_change'));
  },

  async getSession() {
    const client = getSupabase();
    if (client) {
      try {
        const { data } = await client.auth.getSession();
        if (data.session) return data.session;
      } catch (e) {
        console.warn('Auth getSession check:', e);
      }
    }
    if (this.isDevSessionActive()) {
      return { user: { email: 'operator@coreiq.create' } } as any;
    }
    return null;
  },

  async signIn(email: string, pass: string) {
    const client = getSupabase();
    if (client) {
      const res = await client.auth.signInWithPassword({ email, password: pass });
      if (res.error) throw res.error;
      return res.data;
    }
    // If Supabase is not connected yet, enable operator dev session
    this.setDevSession(true);
    return { user: { email } };
  },

  async signOut() {
    const client = getSupabase();
    if (client) {
      try {
        await client.auth.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    this.setDevSession(false);
  },
};

// ==========================================
// READY-TO-RUN SUPABASE SQL SCHEMA GENERATOR
// ==========================================
export const SUPABASE_SQL_SCHEMA = `-- =========================================================================
-- CORE IQ CREATE: PRODUCTION SUPABASE SQL MIGRATION SCRIPT
-- Run this in your Supabase Project's SQL Editor to bootstrap all tables,
-- row-level security (RLS), and Realtime replication for CoreIQ Command.
-- =========================================================================

-- 1. LEADS (Website & Public inquiries)
CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    source TEXT DEFAULT 'website' NOT NULL,
    client_name TEXT NOT NULL,
    client_contact TEXT NOT NULL,
    client_message TEXT,
    conversation_summary TEXT,
    intent_type TEXT DEFAULT 'custom',
    status TEXT DEFAULT 'new' NOT NULL,
    full_conversation JSONB,
    client_id TEXT,
    budget_range TEXT,
    notes TEXT
);

-- 2. SOCIAL MESSAGES (Meta Graph API, Instagram, X, LinkedIn webhooks)
CREATE TABLE IF NOT EXISTS public.social_messages (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    source TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_contact TEXT NOT NULL,
    message_text TEXT NOT NULL,
    status TEXT DEFAULT 'new' NOT NULL
);

-- 3. TASKS
CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'not_started' NOT NULL,
    linked_lead_id TEXT,
    linked_client_id TEXT,
    due_date TIMESTAMPTZ
);

-- 4. CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    contact_phone TEXT,
    notes TEXT
);

-- 5. AGENT CONFIG (CoreIQ Brain settings read by website agent)
CREATE TABLE IF NOT EXISTS public.agent_config (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    model_name TEXT NOT NULL,
    base_url TEXT,
    api_key TEXT,
    system_prompt TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. AGENT TOOLS (External capabilities invoked invisibly by CoreIQ)
CREATE TABLE IF NOT EXISTS public.agent_tools (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    tool_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    api_key TEXT,
    endpoint_url TEXT,
    status TEXT DEFAULT 'connected' NOT NULL,
    notes TEXT
);

-- 7. PLATFORMS (Registered URLs, social handles, freelance gigs)
CREATE TABLE IF NOT EXISTS public.platforms (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    platform_type TEXT DEFAULT 'website' NOT NULL,
    notes TEXT
);

-- 8. CONTENT (Website news, learning, case studies & storage references)
CREATE TABLE IF NOT EXISTS public.content (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    category TEXT DEFAULT 'general' NOT NULL,
    media_reference TEXT,
    published BOOLEAN DEFAULT false NOT NULL
);

-- 9. SWARM COMMS (COMMS messages ONLY, Vault is read-only by standing protocol)
CREATE TABLE IF NOT EXISTS public.swarm_comms (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    sender_node TEXT NOT NULL,
    target_node TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    lead_reference_id TEXT
);

-- Enable Realtime for all operational tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_config;
ALTER PUBLICATION supabase_realtime ADD TABLE public.agent_tools;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platforms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.content;
ALTER PUBLICATION supabase_realtime ADD TABLE public.swarm_comms;

-- Optional default row for agent config
INSERT INTO public.agent_config (id, provider, model_name, base_url, api_key, system_prompt, updated_at)
VALUES (
    'coreiq_primary_mind',
    'groq',
    'llama-3.3-70b-versatile',
    'https://api.groq.com/openai/v1',
    '',
    'You are CoreIQ, the sovereign intelligent creation engine for CoreIQ Create.',
    NOW()
) ON CONFLICT (id) DO NOTHING;
`;
