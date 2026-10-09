import cors from 'cors';
import { buildSystemPrompt } from './coreiq-agent/loader';
import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  buildCoreIQMcpServer,
  mountCoreIQMcp,
  getCoreIQToolsList,
  executeCoreIQTool,
  getContentByKey,
  resolveContentInternal,
  verifyContentInternal,
  getPagePlaceholders,
  getAllContent,
} from './src/mcp/coreiqMcp';
import { buildOpenApiSpec } from './src/mcp/openApiSpec';
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
app.use('/media', express.static(path.join(process.cwd(), 'public', 'media')));

// Multer memory storage for validating magic bytes before writing to disk/storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 55 * 1024 * 1024 }, // 55MB hard buffer max
});

// Initialize Supabase client for server-side API proxy
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabase: SupabaseClient | null = null;
if (supabaseUrl && (supabaseServiceKey || supabaseAnonKey)) {
  supabase = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
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
        'READ_CONFIG', 'WRITE_CONFIG',
        'READ_MEDIA', 'WRITE_MEDIA'
      ],
      revoked: false,
      created_at: new Date().toISOString(),
    }
  ],
  media_slots: [
    {
      slot_key: 'home.showcase',
      page: 'home',
      label: 'Home showcase carousel',
      allowed_types: ['image', 'video'],
      max_items: 6,
      max_bytes: 52428800,
      aspect: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      slot_key: 'home.intro_video',
      page: 'home',
      label: 'Home intro video',
      allowed_types: ['video', 'url'],
      max_items: 1,
      max_bytes: 52428800,
      aspect: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      slot_key: 'home.intro_poster',
      page: 'home',
      label: 'Home intro video poster',
      allowed_types: ['image'],
      max_items: 1,
      max_bytes: 5242880,
      aspect: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      slot_key: 'site.background',
      page: 'site',
      label: 'Site global background video',
      allowed_types: ['video', 'url'],
      max_items: 1,
      max_bytes: 52428800,
      aspect: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      slot_key: 'site.background_poster',
      page: 'site',
      label: 'Site global background poster',
      allowed_types: ['image'],
      max_items: 1,
      max_bytes: 5242880,
      aspect: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      slot_key: 'solutions.showcase',
      page: 'solutions',
      label: 'Solutions showcase carousel',
      allowed_types: ['image', 'video'],
      max_items: 6,
      max_bytes: 52428800,
      aspect: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      slot_key: 'apps.showcase',
      page: 'apps',
      label: 'Apps showcase carousel',
      allowed_types: ['image', 'video'],
      max_items: 6,
      max_bytes: 52428800,
      aspect: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      slot_key: 'learn.showcase',
      page: 'learn',
      label: 'Learn showcase carousel',
      allowed_types: ['image', 'video'],
      max_items: 6,
      max_bytes: 52428800,
      aspect: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      slot_key: 'tools.showcase',
      page: 'tools',
      label: 'Tools showcase carousel',
      allowed_types: ['image', 'video'],
      max_items: 6,
      max_bytes: 52428800,
      aspect: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      slot_key: 'about.showcase',
      page: 'about',
      label: 'About showcase carousel',
      allowed_types: ['image', 'video'],
      max_items: 6,
      max_bytes: 52428800,
      aspect: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      slot_key: 'news.showcase',
      page: 'news',
      label: 'News showcase carousel',
      allowed_types: ['image', 'video'],
      max_items: 6,
      max_bytes: 52428800,
      aspect: '16:9',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  media_slot_items: [],
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
  ],
  use_case_categories: [
    { id: 'cat-1', slug: 'ai-agents', label: 'AI Agents', sort_order: 1 },
    { id: 'cat-2', slug: 'automation', label: 'Automation', sort_order: 2 },
    { id: 'cat-3', slug: 'apps', label: 'Apps', sort_order: 3 },
    { id: 'cat-4', slug: 'voice-ai', label: 'Voice AI', sort_order: 4 },
    { id: 'cat-5', slug: 'integrations', label: 'Integrations', sort_order: 5 }
  ],
  use_cases: [
    {
      id: 'c1000000-0000-0000-0000-000000000001',
      category_slug: 'ai-agents',
      title: 'Autonomous Customer Support Agent',
      problem: 'Customer queries went unanswered after hours, leading to high churn and overwhelmed support staff during peak hours.',
      approach: 'Deployed a multi-tiered LLM support agent grounded in the product catalog, policies, and ticketing history.',
      outcome: '82% of first-touch tickets resolved instantly, response times dropped from 4 hours to 12 seconds, 24/7 availability.',
      audience: 'business',
      industry_tags: ['retail', 'e-commerce', 'technology'],
      image_url: null,
      image_alt: 'Customer Support AI Agent',
      published: false,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000002',
      category_slug: 'ai-agents',
      title: 'Personal Deep Research Assistant',
      problem: 'Information overload and hours lost scouring journals, whitepapers, and market feeds for actionable insights.',
      approach: 'Crafted an autonomous research agent that synthesizes multi-source research into structured executive dossiers.',
      outcome: 'Cut literature and market analysis time by 75% while producing citation-backed executive briefs with full provenance.',
      audience: 'personal',
      industry_tags: ['research', 'creative', 'education'],
      image_url: null,
      image_alt: 'Personal Research Assistant',
      published: false,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000003',
      category_slug: 'ai-agents',
      title: 'AI Lead Qualification & Triage Agent',
      problem: 'Sales reps spent 60% of their workday filtering out tire-kickers and outdated inbound form fills.',
      approach: 'Built an conversational qualifier that engages inbound leads within 30 seconds across web, email, and chat.',
      outcome: 'Lead-to-pipeline conversion increased by 44%; high-intent buyers booked direct demo calls automatically.',
      audience: 'business',
      industry_tags: ['finance', 'real-estate', 'legal'],
      image_url: null,
      image_alt: 'AI Lead Qualifier',
      published: false,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000004',
      category_slug: 'automation',
      title: 'Intelligent Invoice Processing Pipeline',
      problem: 'Manual data entry of supplier invoices created error rates of 6% and 14-day payment settlement delays.',
      approach: 'Engineered optical document understanding pipelines with automated three-way matching against POs and ERP ledgers.',
      outcome: 'Reduced processing cycle from 14 days to under 3 minutes; zero reconciliatory errors across 10,000+ monthly invoices.',
      audience: 'business',
      industry_tags: ['finance', 'accounting', 'logistics'],
      image_url: null,
      image_alt: 'Invoice Automation Pipeline',
      published: false,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000005',
      category_slug: 'automation',
      title: 'Proactive Appointment Reminders & Rescheduling',
      problem: 'Clinic and practice no-show rates hovered at 23%, bleeding operational revenue and delaying patient care.',
      approach: 'Built intelligent SMS and WhatsApp bi-directional reminder flows that detect rescheduling intents and adjust calendar slots.',
      outcome: 'No-shows plummeted by 68%; reclaimed an average of 18 billable consultation hours per practitioner each month.',
      audience: 'both',
      industry_tags: ['healthcare', 'professional-services', 'trades'],
      image_url: null,
      image_alt: 'Appointment Reminders Flow',
      published: false,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000006',
      category_slug: 'automation',
      title: 'Multi-Channel Content & Social Distribution Flow',
      problem: 'Creating and scheduling tailored social copy across four networks took 12 hours every week for solo creators.',
      approach: 'Constructed an automated repurposing pipeline from long-form audio/text into platform-native threads, carousel drafts, and assets.',
      outcome: 'Weekly distribution time dropped from 12 hours to 45 minutes with a 3.2x increase in consistent publishing cadence.',
      audience: 'both',
      industry_tags: ['creative', 'marketing', 'media'],
      image_url: null,
      image_alt: 'Content Distribution Flow',
      published: false,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000007',
      category_slug: 'apps',
      title: 'Boutique Hotel & Venue Booking Portal',
      problem: 'Third-party booking platforms captured 18% commission fees while delivering generic guest booking experiences.',
      approach: 'Created a direct reservation web application featuring personalized add-on bundles, instant room holds, and Stripe checkout.',
      outcome: 'Direct bookings rose by 53%, slashing OTA commission overhead while improving guest pre-arrival satisfaction scores.',
      audience: 'business',
      industry_tags: ['hospitality', 'travel', 'events'],
      image_url: null,
      image_alt: 'Booking Portal Application',
      published: false,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000008',
      category_slug: 'apps',
      title: 'Personal Wealth & Cash-Flow Planner',
      problem: 'Disconnected bank accounts and generic budgeting apps failed to forecast upcoming tax deadlines and cash buffer milestones.',
      approach: 'Built a private, encrypted personal finance tracker with automated categorization and predictive runaway modeling.',
      outcome: 'Clear 6-month forward visibility into savings, zero missed tax estimated payments, and completely self-hosted privacy.',
      audience: 'personal',
      industry_tags: ['finance', 'lifestyle'],
      image_url: null,
      image_alt: 'Personal Wealth App',
      published: false,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000009',
      category_slug: 'apps',
      title: 'Field Service Dispatch & Quoting Mobile App',
      problem: 'Contractors and electricians relied on paper work orders, delaying customer invoice generation by up to two weeks.',
      approach: 'Deployed a progressive field application enabling offline signature capture, photo attachments, and instant PDF quotes.',
      outcome: 'On-site quote acceptance doubled; invoice collection turnaround decreased from 21 days to under 48 hours.',
      audience: 'business',
      industry_tags: ['trades', 'construction', 'field-services'],
      image_url: null,
      image_alt: 'Field Service Mobile App',
      published: false,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000010',
      category_slug: 'voice-ai',
      title: '24/7 After-Hours Intelligent Receptionist',
      problem: 'Emergency plumbing, HVAC, and legal clients missed calls after 6 PM, losing prospective retainer clients to competitors.',
      approach: 'Installed an ultra-low latency voice agent capable of emergency triage, caller intake, and urgent SMS escalation dispatch.',
      outcome: '100% of after-hours calls answered within two rings; secured $42k in monthly revenue from previously lost calls.',
      audience: 'business',
      industry_tags: ['trades', 'legal', 'professional-services'],
      image_url: null,
      image_alt: 'Voice Receptionist',
      published: false,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000011',
      category_slug: 'voice-ai',
      title: 'Voice-Activated Home & Executive Task Hub',
      problem: 'Standard smart home voice assistants failed to handle multi-step workspace queries or execute real business API calls.',
      approach: 'Configured a custom voice assistant bridge that links natural spoken commands to task boards, emails, and home devices.',
      outcome: 'Hands-free voice capture of meeting notes, follow-up task dispatch, and calendar blocking in under 10 seconds.',
      audience: 'personal',
      industry_tags: ['productivity', 'smart-home'],
      image_url: null,
      image_alt: 'Voice Executive Task Hub',
      published: false,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000012',
      category_slug: 'voice-ai',
      title: 'Automated Dental & Medical Recall Voice Assistant',
      problem: 'Reception staff spent 15 hours per week manually calling patients overdue for recurring hygiene checkups.',
      approach: 'Introduced a warm, HIPAA-compliant conversational voice agent that dials overdue patients to schedule open chair times.',
      outcome: 'Rebooked 34% of dormant patients within the first campaign wave, freeing 60 staff hours every month.',
      audience: 'business',
      industry_tags: ['healthcare', 'dental', 'wellness'],
      image_url: null,
      image_alt: 'Medical Recall Voice Assistant',
      published: false,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000013',
      category_slug: 'integrations',
      title: 'CRM & WhatsApp Direct Business Bridge',
      problem: 'Sales agents conducted deals on personal WhatsApp numbers, resulting in lost client history and zero CRM tracking.',
      approach: 'Built a secure two-way WhatsApp Business API connector that mirrors all conversations and media into HubSpot and Salesforce.',
      outcome: '100% CRM compliance, zero lead leakage when staff transition, and real-time deal stage advancement via chat triggers.',
      audience: 'business',
      industry_tags: ['sales', 'retail', 'automotive'],
      image_url: null,
      image_alt: 'WhatsApp CRM Bridge',
      published: false,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000014',
      category_slug: 'integrations',
      title: 'Accounting & Invoicing Bi-Directional Sync',
      problem: 'Stripe transactions, recurring subscriptions, and manual bank wires were manually reconciled each month in Xero.',
      approach: 'Constructed an automated middleware sync with tax jurisdiction mapping, fee separation, and daily batch reconciliations.',
      outcome: 'Eliminated 25 hours of monthly manual bookkeeper reconciliation; tax audit readiness reached 100%.',
      audience: 'business',
      industry_tags: ['finance', 'e-commerce', 'saas'],
      image_url: null,
      image_alt: 'Accounting Invoicing Sync',
      published: false,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'c1000000-0000-0000-0000-000000000015',
      category_slug: 'integrations',
      title: 'E-Commerce Inventory & Logistics Multi-Warehouse Sync',
      problem: 'Selling across Shopify, Amazon, and retail storefronts caused stockouts and overselling penalties.',
      approach: 'Implemented an event-driven stock synchronization engine across 3 regional fulfillment centers and all sales channels.',
      outcome: 'Overselling dropped to absolute zero; warehouse transfer routing optimized by 38% based on localized demand signals.',
      audience: 'business',
      industry_tags: ['retail', 'logistics', 'manufacturing'],
      image_url: null,
      image_alt: 'Inventory Logistics Sync',
      published: false,
      sort_order: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  use_case_files: []
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
  const operatorHeader = (req.headers['x-operator-auth'] as string) || (req.headers['x-operator-mode'] as string);

  let rawToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.substring(7).trim();
  } else if (apiKeyHeader) {
    rawToken = apiKeyHeader.trim();
  } else if ((req.query as any).api_key) {
    rawToken = String((req.query as any).api_key).trim();
  }

  // Operator session from Command or dev master
  if (operatorHeader === 'true' || rawToken === 'operator-session' || rawToken === 'ciq_live_devmaster_00000000000000000000000000000000') {
    (req as any).apiKey = {
      id: 'key_operator_session',
      name: 'CoreIQ Operator Session',
      key_prefix: 'operator...',
      key_hash: 'operator_hash',
      scopes: ['*'],
      revoked: false,
      created_at: new Date().toISOString(),
    };
    return next();
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

  // Check if rawToken is a Supabase Auth session token
  if (supabase && rawToken.length > 50) {
    try {
      const { data: { user }, error } = await supabase.auth.getUser(rawToken);
      if (!error && user) {
        keyRecord = {
          id: `operator_${user.id}`,
          name: `Operator (${user.email || 'Admin'})`,
          key_prefix: 'operator...',
          key_hash: tokenHash,
          scopes: ['*'],
          revoked: false,
          created_at: new Date().toISOString(),
        };
      }
    } catch {}
  }

  // Try fetching from Supabase
  if (!keyRecord && supabase) {
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

function isCallerAuthorizedForMedia(req: Request): boolean {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'] as string;
  const operatorHeader = (req.headers['x-operator-auth'] as string) || (req.headers['x-operator-mode'] as string);
  if (operatorHeader === 'true') return true;

  let rawToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    rawToken = authHeader.substring(7).trim();
  } else if (apiKeyHeader) {
    rawToken = apiKeyHeader.trim();
  } else if ((req.query as any).api_key) {
    rawToken = String((req.query as any).api_key).trim();
  }
  if (!rawToken) return false;
  if (rawToken === 'operator-session' || rawToken === 'ciq_live_devmaster_00000000000000000000000000000000') return true;

  const tokenHash = hashToken(rawToken);
  const found = (localStore.api_keys as ApiKeyRecord[]).find((k) => k.key_hash === tokenHash && !k.revoked);
  if (found) {
    return found.scopes.some((s) => s === '*' || s === 'ADMIN' || s === 'READ_MEDIA');
  }
  return false;
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

// Health / Status ping & MCP Server
mountCoreIQMcp(
  app,
  (req?: Request) => buildCoreIQMcpServer(supabase, localStore, (req as any)?.apiKey),
  authenticateApiKey
);

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

// OpenAPI 3.0 Specification for External Connectors (ORC-GROK, Grok, GPTs, Swarm)
app.get(['/openapi.json', '/api/v1/openapi.json', '/api/openapi.json'], (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const proto = req.get('x-forwarded-proto') || req.protocol || 'http';
  const baseUrl = `${proto}://${host}`;
  res.json(buildOpenApiSpec(baseUrl));
});

// --- TOOLS REGISTRY & EXECUTION (REST Connector Surface) ---
// Discovery: unauthenticated inspection allowed; if Bearer key provided, it attaches caller identity
app.get(['/api/v1/tools', '/api/tools'], (req, res) => {
  const tools = getCoreIQToolsList();
  res.json({
    status: 'ok',
    total_tools: tools.length,
    tools,
  });
});

app.post(['/api/v1/tools/execute', '/api/v1/tools/:toolName'], authenticateApiKey, async (req, res) => {
  const toolName = req.params.toolName || req.body?.tool || req.body?.name;
  const args = req.body?.arguments || req.body?.params || req.body?.input || (req.params.toolName ? req.body : {});

  if (!toolName) {
    return res.status(400).json({ error: 'Missing tool name' });
  }

  const result = await executeCoreIQTool(toolName, args, {
    supabase,
    localStore,
    callerApiKey: (req as any).apiKey,
  });

  if (!result.success) {
    const statusCode = result.isForbidden ? 403 : result.isNotFound ? 404 : 400;
    return res.status(statusCode).json({ error: result.error, tool: toolName });
  }

  return res.json({ success: true, tool: toolName, data: result.data });
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
  const page = (req.query.page as string) || '';
  const status = (req.query.status as string) || '';
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;

  let allContent: any[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('content')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        allContent = data;
      }
    } catch (e) {
      console.error('API get content error:', e);
    }
  }
  if (!allContent.length) {
    allContent = localStore.content;
  }

  let filtered = allContent;
  if (page) {
    const cleanPage = page.toLowerCase().replace(/^\/+/, '');
    filtered = filtered.filter((c: any) =>
      (c.content_key || c.key || '').toLowerCase().startsWith(cleanPage)
    );
  }
  if (status) {
    filtered = filtered.filter(
      (c: any) => (c.status || '').toUpperCase() === status.toUpperCase()
    );
  }

  res.json({
    count: filtered.length,
    total: allContent.length,
    content: filtered.slice(0, limit),
  });
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
  const healthPct = healthReport.total > 0 ? Math.round((healthReport.published / healthReport.total) * 100) : 0;
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    total_manifest_keys: healthReport.total,
    published: healthReport.published,
    placeholder: healthReport.placeholder,
    missing: healthReport.missing,
    stale: healthReport.stale,
    overall_health_pct: healthPct,
    by_page: healthReport.by_page,
    health: healthReport,
  });
});

// Get all placeholder keys for a given page (e.g. /home, /solutions, /learn, etc.)
app.get('/api/v1/content/placeholders/:page', authenticateApiKey, requireScope('content:read'), async (req, res) => {
  const { page } = req.params;
  const result = await getPagePlaceholders(supabase, localStore, page);
  return res.json({
    status: 'ok',
    page,
    ...result,
  });
});

// Direct REST content resolution preview through frontend contentResolver layer
app.get('/api/v1/content/:key/resolve', authenticateApiKey, requireScope('content:read'), async (req, res) => {
  const { key } = req.params;
  const item = await getContentByKey(supabase, localStore, key);
  const resolved = resolveContentInternal(item, key);
  return res.json({
    status: 'ok',
    content_key: key,
    resolved,
  });
});

// Direct REST content verification endpoint
app.post('/api/v1/content/:key/verify', authenticateApiKey, requireScope('content:read'), async (req, res) => {
  const { key } = req.params;
  const { expected_status, expected_body_substring } = req.body || {};
  const verification = await verifyContentInternal(
    supabase,
    localStore,
    key,
    expected_status || 'PUBLISHED',
    expected_body_substring
  );
  return res.json({
    status: verification.verified ? 'verified' : 'failed',
    content_key: key,
    verification,
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

// -----------------------------------------------------------------------------
// MEDIA SLOTS & UPLOAD API (BASE PATH: /api/v1/media)
// -----------------------------------------------------------------------------

function detectMimeTypeFromBuffer(buffer: Buffer): string | null {
  if (!buffer || buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 &&
    buffer[4] === 0x0D && buffer[5] === 0x0A && buffer[6] === 0x1A && buffer[7] === 0x0A
  ) {
    return 'image/png';
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }
  // MP4: ISO Base Media file contains 'ftyp' at bytes 4-8
  if (buffer.toString('ascii', 4, 8) === 'ftyp') {
    return 'video/mp4';
  }
  // WEBM: 1A 45 DF A3
  if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
    return 'video/webm';
  }
  return null;
}

function validateExternalUrl(urlString: string): { valid: boolean; error?: string } {
  if (!urlString || typeof urlString !== 'string') {
    return { valid: false, error: 'URL is required.' };
  }
  const trimmed = urlString.trim();
  if (trimmed.toLowerCase().startsWith('javascript:') || trimmed.toLowerCase().startsWith('data:')) {
    return { valid: false, error: 'javascript: and data: URLs are rejected.' };
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Only HTTPS URLs are allowed.' };
    }
    const host = parsed.hostname.toLowerCase();
    const allowedHosts = [
      'youtube.com',
      'www.youtube.com',
      'm.youtube.com',
      'youtu.be',
      'vimeo.com',
      'player.vimeo.com',
    ];
    const isAllowed = allowedHosts.some((h) => host === h || host.endsWith('.' + h));
    if (!isAllowed) {
      return { valid: false, error: `Host '${parsed.hostname}' is not in the allowlist (youtube.com, youtu.be, vimeo.com).` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Malformed URL.' };
  }
}

function validateCtaUrl(urlString: string | null | undefined): { valid: boolean; error?: string } {
  if (!urlString || !urlString.trim()) return { valid: true };
  const trimmed = urlString.trim();
  if (trimmed.startsWith('/')) {
    if (trimmed.includes('javascript:') || trimmed.includes('data:')) {
      return { valid: false, error: 'Invalid internal route.' };
    }
    return { valid: true };
  }
  if (trimmed.startsWith('https://')) {
    try {
      new URL(trimmed);
      return { valid: true };
    } catch {
      return { valid: false, error: 'Malformed external CTA URL.' };
    }
  }
  return { valid: false, error: 'CTA URL must be an internal route starting with "/" or an HTTPS URL.' };
}

async function deleteStorageFile(storagePath: string | null | undefined) {
  if (!storagePath) return;
  try {
    const cleanPath = storagePath.replace(/^\/+/, '');
    const localFilePath = path.join(process.cwd(), 'public', cleanPath);
    if (fs.existsSync(localFilePath)) {
      await fs.promises.unlink(localFilePath).catch(() => {});
    }
  } catch {}
  if (supabase) {
    try {
      const cleanPath = storagePath.replace(/^media\//, '');
      await supabase.storage.from('media').remove([cleanPath]);
    } catch {}
  }
}

const mediaUploadMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('file')(req as any, res as any, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({ error: 'Payload Too Large', message: 'Uploaded file exceeds server limit.' });
        }
        return res.status(400).json({ error: 'Upload Error', message: err.message });
      }
      next();
    });
  } else {
    next();
  }
};

// GET /api/v1/media/slots?page=home
app.get('/api/v1/media/slots', authenticateApiKey, requireScope('READ_MEDIA'), async (req, res) => {
  const pageFilter = ((req.query.page as string) || 'home').toLowerCase();

  let slots: any[] = [];
  let items: any[] = [];

  if (supabase) {
    try {
      const { data: slotData, error: slotErr } = await supabase
        .from('media_slots')
        .select('*')
        .eq('page', pageFilter);
      if (!slotErr && slotData) {
        slots = slotData;
      }
      const { data: itemData, error: itemErr } = await supabase
        .from('media_slot_items')
        .select('*')
        .order('sort_order', { ascending: true });
      if (!itemErr && itemData) {
        items = itemData;
      }
    } catch (e) {
      console.warn('Supabase media slots fetch error, falling back:', e);
    }
  }

  if (!slots.length) {
    slots = (localStore.media_slots || []).filter((s: any) => s.page.toLowerCase() === pageFilter);
    items = localStore.media_slot_items || [];
  }

  const result = slots.map((slot) => {
    const slotItems = items.filter((i) => i.slot_key === slot.slot_key);
    const count = slotItems.length;
    let status: 'empty' | 'filled' | 'error' = 'empty';
    if (count === 0) {
      status = 'empty';
    } else if (count >= slot.max_items) {
      status = 'filled';
    } else {
      status = 'filled';
    }

    return {
      ...slot,
      item_count: count,
      status,
      items: slotItems,
    };
  });

  return res.json({ slots: result, count: result.length });
});

// GET /api/v1/media/slots/:slot_key (Anon sees published items only; Operator sees all)
app.get('/api/v1/media/slots/:slot_key', async (req, res) => {
  const { slot_key } = req.params;
  const isOperator = isCallerAuthorizedForMedia(req);

  let slot: any = null;
  let items: any[] = [];

  if (supabase) {
    try {
      const { data: slotData } = await supabase
        .from('media_slots')
        .select('*')
        .eq('slot_key', slot_key)
        .maybeSingle();
      if (slotData) slot = slotData;

      let itemQuery = supabase
        .from('media_slot_items')
        .select('*')
        .eq('slot_key', slot_key)
        .order('sort_order', { ascending: true });

      if (!isOperator) {
        itemQuery = itemQuery.eq('published', true);
      }
      const { data: itemData } = await itemQuery;
      if (itemData) items = itemData;
    } catch {}
  }

  if (!slot) {
    slot = (localStore.media_slots || []).find((s: any) => s.slot_key === slot_key);
    const allItems = (localStore.media_slot_items || []).filter((i: any) => i.slot_key === slot_key);
    items = isOperator ? allItems : allItems.filter((i: any) => i.published);
  }

  if (!slot) {
    return res.status(404).json({ error: 'Not Found', message: `Slot '${slot_key}' not found.` });
  }

  return res.json({
    slot: {
      ...slot,
      item_count: items.length,
      status: items.length === 0 ? 'empty' : (items.length >= slot.max_items ? 'filled' : 'filled'),
    },
    items,
  });
});

// POST /api/v1/media/slots/:slot_key/items (Multipart or JSON for type url)
app.post(
  '/api/v1/media/slots/:slot_key/items',
  authenticateApiKey,
  requireScope('WRITE_MEDIA'),
  mediaUploadMiddleware,
  async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    const { slot_key } = req.params;

    // 1. Locate slot
    let slot: any = null;
    if (supabase) {
      try {
        const { data } = await supabase.from('media_slots').select('*').eq('slot_key', slot_key).maybeSingle();
        if (data) slot = data;
      } catch {}
    }
    if (!slot) {
      slot = (localStore.media_slots || []).find((s: any) => s.slot_key === slot_key);
    }

    if (!slot) {
      return res.status(404).json({ error: 'Not Found', message: `Slot '${slot_key}' not found.` });
    }

    // 2. Extract fields
    let type = req.body?.type as string;
    const alt = req.body?.alt ? String(req.body.alt).trim() : '';
    const title = req.body?.title ? String(req.body.title).trim() : '';
    const caption = req.body?.caption ? String(req.body.caption).trim() : '';
    const cta_label = req.body?.cta_label ? String(req.body.cta_label).trim() : '';
    const cta_url = req.body?.cta_url ? String(req.body.cta_url).trim() : '';
    const rawUrl = req.body?.url ? String(req.body.url).trim() : '';
    const poster_url = req.body?.poster_url ? String(req.body.poster_url).trim() : '';

    if (!type && req.file) {
      if (req.file.mimetype.startsWith('video/')) type = 'video';
      else type = 'image';
    }

    // 3. Validate type
    if (!type || !slot.allowed_types.includes(type)) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: `Type '${type || 'unknown'}' is not allowed for slot '${slot_key}'. Allowed types: ${slot.allowed_types.join(', ')}`,
      });
    }

    // 4. Validate CTA URL if provided
    const ctaCheck = validateCtaUrl(cta_url);
    if (!ctaCheck.valid) {
      return res.status(400).json({ error: 'Invalid CTA URL', message: ctaCheck.error });
    }

    // 5. Type-specific validations
    let detectedMime: string | null = null;

    if (type === 'url') {
      const urlCheck = validateExternalUrl(rawUrl);
      if (!urlCheck.valid) {
        return res.status(400).json({ error: 'Invalid URL', message: urlCheck.error });
      }
    } else {
      // File upload required for image / video
      if (!req.file) {
        return res.status(400).json({ error: 'Missing File', message: `A file upload is required for media type '${type}'.` });
      }

      // Check file size
      if (req.file.size > slot.max_bytes) {
        return res.status(413).json({
          error: 'Payload Too Large',
          message: `File size (${req.file.size} bytes) exceeds slot limit of ${slot.max_bytes} bytes (${Math.round(slot.max_bytes / 1024)} KB).`,
        });
      }

      // Check MIME by inspecting magic bytes
      detectedMime = detectMimeTypeFromBuffer(req.file.buffer);
      const allowlistMimes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'];

      if (!detectedMime || !allowlistMimes.includes(detectedMime)) {
        return res.status(415).json({
          error: 'Unsupported Media Type',
          message: 'File content must be a valid image/jpeg, image/png, image/webp, video/mp4, or video/webm based on magic bytes inspection.',
        });
      }

      if (type === 'image' && !detectedMime.startsWith('image/')) {
        return res.status(415).json({ error: 'Unsupported Media Type', message: 'Image slot requires an image file.' });
      }

      if (type === 'video' && !detectedMime.startsWith('video/')) {
        return res.status(415).json({ error: 'Unsupported Media Type', message: 'Video slot requires a video file.' });
      }

      // Alt text required for image items
      if (type === 'image' && !alt) {
        return res.status(400).json({ error: 'Missing Alt Text', message: 'Alt text is required for image items.' });
      }
    }

    // 6. Check slot capacity & single-item replacement
    let currentItems: any[] = [];
    if (supabase) {
      try {
        const { data } = await supabase.from('media_slot_items').select('*').eq('slot_key', slot_key);
        if (data) currentItems = data;
      } catch {}
    }
    if (!currentItems.length) {
      currentItems = (localStore.media_slot_items || []).filter((i: any) => i.slot_key === slot_key);
    }

    if (slot.max_items === 1) {
      // Single-item slot replacement: remove existing old asset & file
      for (const oldItem of currentItems) {
        await deleteStorageFile(oldItem.storage_path);
        if (supabase) {
          try {
            await supabase.from('media_slot_items').delete().eq('id', oldItem.id);
          } catch {}
        }
      }
      localStore.media_slot_items = (localStore.media_slot_items || []).filter((i: any) => i.slot_key !== slot_key);
      currentItems = [];
    } else if (currentItems.length >= slot.max_items) {
      return res.status(400).json({
        error: 'Slot Full',
        message: `Slot '${slot_key}' cannot exceed maximum of ${slot.max_items} items.`,
      });
    }

    // 7. Storage persistence
    const itemId = crypto.randomUUID ? crypto.randomUUID() : `item_${Date.now()}`;
    let storagePath: string | null = null;
    let finalUrl: string | null = rawUrl || null;

    if (req.file && detectedMime) {
      const ext = detectedMime === 'image/jpeg' ? 'jpg' : (
        detectedMime === 'image/png' ? 'png' : (
          detectedMime === 'image/webp' ? 'webp' : (
            detectedMime === 'video/mp4' ? 'mp4' : 'webm'
          )
        )
      );

      storagePath = `media/${slot_key}/${itemId}.${ext}`;

      // Write to public disk storage
      try {
        const targetDir = path.join(process.cwd(), 'public', 'media', slot_key);
        await fs.promises.mkdir(targetDir, { recursive: true });
        const filePath = path.join(targetDir, `${itemId}.${ext}`);
        await fs.promises.writeFile(filePath, req.file.buffer);
        finalUrl = `/media/${slot_key}/${itemId}.${ext}`;
      } catch (err) {
        console.error('Local disk write error:', err);
      }

      // Upload to Supabase storage bucket if configured
      if (supabase) {
        try {
          await supabase.storage
            .from('media')
            .upload(`${slot_key}/${itemId}.${ext}`, req.file.buffer, { contentType: detectedMime, upsert: true });
          const { data } = supabase.storage.from('media').getPublicUrl(`${slot_key}/${itemId}.${ext}`);
          if (data?.publicUrl) {
            finalUrl = data.publicUrl;
          }
        } catch (storageErr) {
          console.warn('Supabase storage upload error:', storageErr);
        }
      }
    }

    // 8. Create item record (published: false by default per acceptance criteria)
    const maxOrder = currentItems.length > 0 ? Math.max(...currentItems.map((i: any) => i.sort_order || 0)) : -1;
    const sort_order = maxOrder + 1;

    const newItem = {
      id: itemId,
      slot_key,
      type,
      storage_path: storagePath,
      url: finalUrl,
      poster_url: poster_url || null,
      alt: alt || null,
      title: title || null,
      caption: caption || null,
      cta_label: cta_label || null,
      cta_url: cta_url || null,
      sort_order,
      published: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.from('media_slot_items').insert([newItem]).select().single();
        if (!error && data) {
          localStore.media_slot_items = [data, ...(localStore.media_slot_items || [])];
          return res.status(201).json({ status: 'created', item: data });
        }
      } catch (insertErr) {
        console.warn('Supabase item insert warning, using localStore:', insertErr);
      }
    }

    localStore.media_slot_items = [newItem, ...(localStore.media_slot_items || [])];
    return res.status(201).json({ status: 'created', item: newItem });
  }
);

// PATCH /api/v1/media/slots/:slot_key/items/:id
app.patch('/api/v1/media/slots/:slot_key/items/:id', authenticateApiKey, requireScope('WRITE_MEDIA'), async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const { slot_key, id } = req.params;
  const updates = req.body || {};

  let existing: any = null;
  if (supabase) {
    try {
      const { data } = await supabase.from('media_slot_items').select('*').eq('id', id).eq('slot_key', slot_key).maybeSingle();
      if (data) existing = data;
    } catch {}
  }
  if (!existing) {
    existing = (localStore.media_slot_items || []).find((i: any) => i.id === id && i.slot_key === slot_key);
  }

  if (!existing) {
    return res.status(404).json({ error: 'Not Found', message: `Media item '${id}' not found in slot '${slot_key}'.` });
  }

  // Validate alt text if provided
  if (updates.alt !== undefined && existing.type === 'image') {
    if (!updates.alt || !String(updates.alt).trim()) {
      return res.status(400).json({ error: 'Missing Alt Text', message: 'Alt text cannot be empty for image items.' });
    }
  }

  // Validate CTA URL if provided
  if (updates.cta_url !== undefined) {
    const ctaCheck = validateCtaUrl(updates.cta_url);
    if (!ctaCheck.valid) {
      return res.status(400).json({ error: 'Invalid CTA URL', message: ctaCheck.error });
    }
  }

  const payload: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.alt !== undefined) payload.alt = String(updates.alt).trim();
  if (updates.title !== undefined) payload.title = updates.title ? String(updates.title).trim() : null;
  if (updates.caption !== undefined) payload.caption = updates.caption ? String(updates.caption).trim() : null;
  if (updates.poster_url !== undefined) payload.poster_url = updates.poster_url ? String(updates.poster_url).trim() : null;
  if (updates.cta_label !== undefined) payload.cta_label = updates.cta_label ? String(updates.cta_label).trim() : null;
  if (updates.cta_url !== undefined) payload.cta_url = updates.cta_url ? String(updates.cta_url).trim() : null;
  if (updates.sort_order !== undefined) payload.sort_order = Number(updates.sort_order);
  if (updates.published !== undefined) payload.published = Boolean(updates.published);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('media_slot_items')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        localStore.media_slot_items = (localStore.media_slot_items || []).map((i: any) => (i.id === id ? data : i));
        return res.json({ status: 'updated', item: data });
      }
    } catch {}
  }

  const updatedItem = { ...existing, ...payload };
  localStore.media_slot_items = (localStore.media_slot_items || []).map((i: any) => (i.id === id ? updatedItem : i));
  return res.json({ status: 'updated', item: updatedItem });
});

// PUT /api/v1/media/slots/:slot_key/order
app.put('/api/v1/media/slots/:slot_key/order', authenticateApiKey, requireScope('WRITE_MEDIA'), async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const { slot_key } = req.params;
  const itemIds: string[] = req.body?.item_ids || [];

  if (!Array.isArray(itemIds)) {
    return res.status(400).json({ error: 'Bad Request', message: 'item_ids must be an array of item IDs.' });
  }

  for (let idx = 0; idx < itemIds.length; idx++) {
    const id = itemIds[idx];
    if (supabase) {
      try {
        await supabase
          .from('media_slot_items')
          .update({ sort_order: idx, updated_at: new Date().toISOString() })
          .eq('id', id)
          .eq('slot_key', slot_key);
      } catch {}
    }
    const item = (localStore.media_slot_items || []).find((i: any) => i.id === id && i.slot_key === slot_key);
    if (item) {
      item.sort_order = idx;
      item.updated_at = new Date().toISOString();
    }
  }

  return res.json({ status: 'reordered', slot_key });
});

// DELETE /api/v1/media/slots/:slot_key/items/:id
app.delete('/api/v1/media/slots/:slot_key/items/:id', authenticateApiKey, requireScope('WRITE_MEDIA'), async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const { slot_key, id } = req.params;

  let existing: any = null;
  if (supabase) {
    try {
      const { data } = await supabase.from('media_slot_items').select('*').eq('id', id).eq('slot_key', slot_key).maybeSingle();
      if (data) existing = data;
    } catch {}
  }
  if (!existing) {
    existing = (localStore.media_slot_items || []).find((i: any) => i.id === id && i.slot_key === slot_key);
  }

  if (!existing) {
    return res.status(404).json({ error: 'Not Found', message: `Media item '${id}' not found in slot '${slot_key}'.` });
  }

  // Remove storage asset
  await deleteStorageFile(existing.storage_path);

  if (supabase) {
    try {
      await supabase.from('media_slot_items').delete().eq('id', id).eq('slot_key', slot_key);
    } catch {}
  }

  localStore.media_slot_items = (localStore.media_slot_items || []).filter((i: any) => !(i.id === id && i.slot_key === slot_key));
  return res.json({ status: 'deleted', id });
});

// -----------------------------------------------------------------------------
// USE CASES API (PUBLIC & ADMIN)
// -----------------------------------------------------------------------------

// Helper to fetch files for use cases
async function attachFilesToUseCases(useCases: any[]): Promise<any[]> {
  if (!useCases || !useCases.length) return [];
  const ids = useCases.map((u) => u.id);

  let files: any[] = [];
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('use_case_files')
        .select('*')
        .in('use_case_id', ids)
        .order('sort_order', { ascending: true });
      if (!error && data) {
        files = data;
      }
    } catch {}
  }
  if (!files.length && localStore.use_case_files) {
    files = (localStore.use_case_files || []).filter((f: any) => ids.includes(f.use_case_id));
  }

  return useCases.map((u) => ({
    ...u,
    files: files.filter((f) => f.use_case_id === u.id),
  }));
}

// GET /api/v1/use-cases/categories — list all categories with use case counts
app.get('/api/v1/use-cases/categories', async (req, res) => {
  let categories: any[] = [];
  let allUseCases: any[] = [];

  if (supabase) {
    try {
      const { data: catData } = await supabase
        .from('use_case_categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (catData && catData.length) categories = catData;

      const { data: ucData } = await supabase
        .from('use_cases')
        .select('id, category_slug, published');
      if (ucData) allUseCases = ucData;
    } catch {}
  }

  if (!categories.length) {
    categories = localStore.use_case_categories || [];
    allUseCases = localStore.use_cases || [];
  }

  const result = categories.map((cat) => {
    const matching = allUseCases.filter((u) => u.category_slug === cat.slug);
    return {
      ...cat,
      use_cases_count: matching.length,
      published_count: matching.filter((u) => u.published).length,
    };
  });

  return res.json({ count: result.length, categories: result });
});

// GET /api/v1/use-cases — list published use cases with filters
app.get('/api/v1/use-cases', async (req, res) => {
  const categoryFilter = req.query.category as string;
  const audienceFilter = req.query.audience as string;
  const industryFilter = req.query.industry as string;

  let useCases: any[] = [];

  if (supabase) {
    try {
      let query = supabase
        .from('use_cases')
        .select('*')
        .eq('published', true)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category_slug', categoryFilter);
      }
      if (audienceFilter && audienceFilter !== 'all') {
        query = query.or(`audience.eq.${audienceFilter},audience.eq.both`);
      }

      const { data, error } = await query;
      if (!error && data) {
        useCases = data;
      }
    } catch {}
  }

  if (!useCases.length) {
    useCases = (localStore.use_cases || []).filter((u: any) => u.published);
    if (categoryFilter && categoryFilter !== 'all') {
      useCases = useCases.filter((u: any) => u.category_slug === categoryFilter);
    }
    if (audienceFilter && audienceFilter !== 'all') {
      useCases = useCases.filter((u: any) => u.audience === audienceFilter || u.audience === 'both');
    }
  }

  // Filter by industry if requested
  if (industryFilter && industryFilter !== 'all') {
    const cleanInd = industryFilter.toLowerCase().trim();
    useCases = useCases.filter((u: any) =>
      Array.isArray(u.industry_tags) &&
      u.industry_tags.some((t: string) => t.toLowerCase() === cleanInd)
    );
  }

  const populated = await attachFilesToUseCases(useCases);
  return res.json({ count: populated.length, use_cases: populated });
});

// GET /api/v1/use-cases/:id — single use case with its files
app.get('/api/v1/use-cases/:id', async (req, res) => {
  const { id } = req.params;
  let useCase: any = null;

  if (supabase) {
    try {
      const { data } = await supabase
        .from('use_cases')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (data) useCase = data;
    } catch {}
  }

  if (!useCase) {
    useCase = (localStore.use_cases || []).find((u: any) => u.id === id);
  }

  if (!useCase) {
    return res.status(404).json({ error: 'Not Found', message: `Use case '${id}' not found.` });
  }

  const [populated] = await attachFilesToUseCases([useCase]);
  return res.json({ use_case: populated });
});

// GET /api/v1/use-cases/:id/files/:fileId/download — returns signed URL (3600s) for one file
app.get('/api/v1/use-cases/:id/files/:fileId/download', async (req, res) => {
  const { id, fileId } = req.params;
  let fileRecord: any = null;

  if (supabase) {
    try {
      const { data } = await supabase
        .from('use_case_files')
        .select('*')
        .eq('id', fileId)
        .eq('use_case_id', id)
        .maybeSingle();
      if (data) fileRecord = data;
    } catch {}
  }

  if (!fileRecord) {
    fileRecord = (localStore.use_case_files || []).find(
      (f: any) => f.id === fileId && f.use_case_id === id
    );
  }

  if (!fileRecord) {
    return res.status(404).json({ error: 'Not Found', message: 'Use case file not found.' });
  }

  // Try creating signed Supabase storage URL
  if (supabase && fileRecord.storage_path) {
    try {
      const { data, error } = await supabase.storage
        .from('use-cases')
        .createSignedUrl(fileRecord.storage_path, 3600);
      if (!error && data?.signedUrl) {
        return res.json({
          status: 'ok',
          filename: fileRecord.filename,
          label: fileRecord.label,
          download_url: data.signedUrl,
        });
      }
    } catch {}
  }

  // Local filesystem fallback
  const cleanPath = fileRecord.storage_path.replace(/^use-cases\//, '');
  const downloadUrl = fileRecord.storage_path.startsWith('http')
    ? fileRecord.storage_path
    : `/media/use-cases/${cleanPath}`;

  return res.json({
    status: 'ok',
    filename: fileRecord.filename,
    label: fileRecord.label,
    download_url: downloadUrl,
  });
});

// POST /api/v1/use-cases/:id/image — upload image for a use case (authenticated)
app.post(
  '/api/v1/use-cases/:id/image',
  authenticateApiKey,
  mediaUploadMiddleware,
  async (req, res) => {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'Bad Request', message: 'No file uploaded.' });
    }

    const mime = detectMimeTypeFromBuffer(req.file.buffer) || req.file.mimetype;
    const allowedImages = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedImages.includes(mime)) {
      return res.status(415).json({
        error: 'Unsupported Media Type',
        message: 'Only WEBP, PNG, and JPEG images are allowed.',
      });
    }

    if (req.file.buffer.length > 5 * 1024 * 1024) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: 'Image exceeds maximum limit of 5MB.',
      });
    }

    const safeFilename = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `images/${id}/${safeFilename}`;

    // Write to local disk fallback
    const localDir = path.join(process.cwd(), 'public', 'media', 'use-cases', 'images', id);
    try {
      await fs.promises.mkdir(localDir, { recursive: true });
      await fs.promises.writeFile(path.join(localDir, safeFilename), req.file.buffer);
    } catch (e) {
      console.warn('Local disk image write warning:', e);
    }

    let imageUrl = `/media/use-cases/images/${id}/${safeFilename}`;

    // Upload to Supabase Storage if available
    if (supabase) {
      try {
        await supabase.storage
          .from('use-cases')
          .upload(storagePath, req.file.buffer, { contentType: mime, upsert: true });

        const { data: pubData } = supabase.storage
          .from('use-cases')
          .getPublicUrl(storagePath);
        if (pubData?.publicUrl) {
          imageUrl = pubData.publicUrl;
        }
      } catch (err) {
        console.warn('Supabase image upload warning:', err);
      }
    }

    const alt = req.body?.alt ? String(req.body.alt).trim() : req.file.originalname;

    // Update use_cases table
    if (supabase) {
      try {
        await supabase
          .from('use_cases')
          .update({ image_url: imageUrl, image_alt: alt, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch {}
    }

    const localItem = (localStore.use_cases || []).find((u: any) => u.id === id);
    if (localItem) {
      localItem.image_url = imageUrl;
      localItem.image_alt = alt;
      localItem.updated_at = new Date().toISOString();
    }

    return res.json({
      status: 'uploaded',
      use_case_id: id,
      image_url: imageUrl,
      image_alt: alt,
    });
  }
);

// POST /api/v1/use-cases/:id/files — upload a downloadable file for a use case (authenticated)
app.post(
  '/api/v1/use-cases/:id/files',
  authenticateApiKey,
  mediaUploadMiddleware,
  async (req, res) => {
    const { id } = req.params;
    if (!req.file) {
      return res.status(400).json({ error: 'Bad Request', message: 'No file uploaded.' });
    }

    if (req.file.buffer.length > 50 * 1024 * 1024) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: 'File exceeds maximum limit of 50MB.',
      });
    }

    const label = req.body?.label ? String(req.body.label).trim() : req.file.originalname;
    const safeFilename = `${Date.now()}_${req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const storagePath = `files/${id}/${safeFilename}`;
    const fileExt = path.extname(req.file.originalname).replace('.', '').toLowerCase() || 'bin';

    // Write to local disk fallback
    const localDir = path.join(process.cwd(), 'public', 'media', 'use-cases', 'files', id);
    try {
      await fs.promises.mkdir(localDir, { recursive: true });
      await fs.promises.writeFile(path.join(localDir, safeFilename), req.file.buffer);
    } catch (e) {
      console.warn('Local disk file write warning:', e);
    }

    // Upload to Supabase Storage if available
    if (supabase) {
      try {
        await supabase.storage
          .from('use-cases')
          .upload(storagePath, req.file.buffer, {
            contentType: req.file.mimetype || 'application/octet-stream',
            upsert: true,
          });
      } catch (err) {
        console.warn('Supabase file upload warning:', err);
      }
    }

    const newFile = {
      id: crypto.randomUUID ? crypto.randomUUID() : `file_${Date.now()}`,
      use_case_id: id,
      filename: req.file.originalname,
      storage_path: storagePath,
      label,
      file_type: fileExt,
      sort_order: req.body?.sort_order ? parseInt(req.body.sort_order, 10) : 0,
      created_at: new Date().toISOString(),
    };

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('use_case_files')
          .insert([newFile])
          .select()
          .single();
        if (!error && data) {
          return res.status(201).json({ status: 'created', file: data });
        }
      } catch {}
    }

    if (!localStore.use_case_files) localStore.use_case_files = [];
    localStore.use_case_files.push(newFile);

    return res.status(201).json({ status: 'created', file: newFile });
  }
);

// DELETE /api/v1/use-cases/:id/files/:fileId — delete a downloadable file (authenticated)
app.delete(
  '/api/v1/use-cases/:id/files/:fileId',
  authenticateApiKey,
  async (req, res) => {
    const { id, fileId } = req.params;
    let fileRecord: any = null;

    if (supabase) {
      try {
        const { data } = await supabase
          .from('use_case_files')
          .select('*')
          .eq('id', fileId)
          .eq('use_case_id', id)
          .maybeSingle();
        if (data) fileRecord = data;
      } catch {}
    }

    if (!fileRecord) {
      fileRecord = (localStore.use_case_files || []).find(
        (f: any) => f.id === fileId && f.use_case_id === id
      );
    }

    if (!fileRecord) {
      return res.status(404).json({ error: 'Not Found', message: 'File not found.' });
    }

    // Remove from storage
    if (supabase && fileRecord.storage_path) {
      try {
        await supabase.storage.from('use-cases').remove([fileRecord.storage_path]);
      } catch {}
    }

    // Remove local disk file if exists
    try {
      const localFilePath = path.join(process.cwd(), 'public', 'media', 'use-cases', fileRecord.storage_path.replace(/^use-cases\//, ''));
      if (fs.existsSync(localFilePath)) {
        await fs.promises.unlink(localFilePath).catch(() => {});
      }
    } catch {}

    // Delete DB row
    if (supabase) {
      try {
        await supabase
          .from('use_case_files')
          .delete()
          .eq('id', fileId)
          .eq('use_case_id', id);
      } catch {}
    }

    localStore.use_case_files = (localStore.use_case_files || []).filter(
      (f: any) => !(f.id === fileId && f.use_case_id === id)
    );

    return res.json({ status: 'deleted', id: fileId });
  }
);

// --- ADMIN USE CASE ENDPOINTS ---

// GET /api/v1/admin/use-cases — list ALL use cases including unpublished
app.get('/api/v1/admin/use-cases', authenticateApiKey, async (req, res) => {
  let allUseCases: any[] = [];

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('use_cases')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (!error && data) {
        allUseCases = data;
      }
    } catch {}
  }

  if (!allUseCases.length) {
    allUseCases = localStore.use_cases || [];
  }

  const populated = await attachFilesToUseCases(allUseCases);
  return res.json({ count: populated.length, use_cases: populated });
});

// POST /api/v1/admin/use-cases — create a use case
app.post('/api/v1/admin/use-cases', authenticateApiKey, async (req, res) => {
  const {
    category_slug,
    title,
    problem,
    approach,
    outcome,
    audience,
    industry_tags,
    published,
    sort_order,
  } = req.body;

  if (!title || !category_slug || !problem || !approach || !outcome || !audience) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'category_slug, title, problem, approach, outcome, and audience are required fields.',
    });
  }

  const newUseCase = {
    id: crypto.randomUUID ? crypto.randomUUID() : `uc_${Date.now()}`,
    category_slug,
    title,
    problem,
    approach,
    outcome,
    audience,
    industry_tags: Array.isArray(industry_tags) ? industry_tags : [],
    image_url: null,
    image_alt: null,
    published: Boolean(published),
    sort_order: sort_order ? parseInt(sort_order, 10) : 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('use_cases')
        .insert([newUseCase])
        .select()
        .single();
      if (!error && data) {
        return res.status(201).json({ status: 'created', use_case: { ...data, files: [] } });
      }
    } catch (e) {
      console.error('Supabase create use case error:', e);
    }
  }

  if (!localStore.use_cases) localStore.use_cases = [];
  localStore.use_cases.unshift(newUseCase);

  return res.status(201).json({ status: 'created', use_case: { ...newUseCase, files: [] } });
});

// PATCH /api/v1/admin/use-cases/:id — update a use case (including toggle published)
app.patch('/api/v1/admin/use-cases/:id', authenticateApiKey, async (req, res) => {
  const { id } = req.params;
  const updates = { ...req.body, updated_at: new Date().toISOString() };

  let updatedRecord: any = null;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('use_cases')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (!error && data) {
        updatedRecord = data;
      }
    } catch (e) {
      console.error('Supabase update use case error:', e);
    }
  }

  const existingLocal = (localStore.use_cases || []).find((u: any) => u.id === id);
  if (existingLocal) {
    Object.assign(existingLocal, updates);
    if (!updatedRecord) updatedRecord = existingLocal;
  }

  if (!updatedRecord) {
    return res.status(404).json({ error: 'Not Found', message: `Use case '${id}' not found.` });
  }

  const [populated] = await attachFilesToUseCases([updatedRecord]);
  return res.json({ status: 'updated', use_case: populated });
});

// DELETE /api/v1/admin/use-cases/:id — delete a use case
app.delete('/api/v1/admin/use-cases/:id', authenticateApiKey, async (req, res) => {
  const { id } = req.params;

  if (supabase) {
    try {
      await supabase.from('use_cases').delete().eq('id', id);
    } catch {}
  }

  localStore.use_cases = (localStore.use_cases || []).filter((u: any) => u.id !== id);
  localStore.use_case_files = (localStore.use_case_files || []).filter((f: any) => f.use_case_id !== id);

  return res.json({ status: 'deleted', id });
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
const systemPrompt = buildSystemPrompt() || agentConfig?.system_prompt || 'You are CoreIQ.';

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
