export type CommandTab = 
  | 'inbox'
  | 'tasks'
  | 'clients'
  | 'brain'
  | 'api_keys'
  | 'tools'
  | 'platforms'
  | 'content'
  | 'use_cases'
  | 'upload'
  | 'swarm'
  | 'analytics';

export type ApiScope =
  | 'READ_LEADS'
  | 'WRITE_LEADS'
  | 'READ_TASKS'
  | 'WRITE_TASKS'
  | 'READ_CLIENTS'
  | 'WRITE_CLIENTS'
  | 'READ_CONTENT'
  | 'WRITE_CONTENT'
  | 'READ_CONFIG'
  | 'WRITE_CONFIG'
  | 'READ_MEDIA'
  | 'WRITE_MEDIA';

export type MediaSlotType = 'image' | 'video' | 'url';

export interface MediaSlot {
  slot_key: string;
  page: string;
  label: string;
  allowed_types: MediaSlotType[];
  max_items: number;
  max_bytes: number;
  aspect?: string | null;
  created_at?: string;
  updated_at?: string;
  // Computed for UI
  item_count?: number;
  status?: 'empty' | 'filled' | 'error';
  items?: MediaSlotItem[];
}

export interface MediaSlotItem {
  id: string;
  slot_key: string;
  type: MediaSlotType;
  storage_path?: string | null;
  url?: string | null;
  poster_url?: string | null;
  alt?: string | null;
  title?: string | null;
  caption?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  sort_order: number;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ApiKeyItem {
  id: string;
  created_at: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  raw_token_display?: string;
  scopes: ApiScope[];
  revoked: boolean;
  last_used_at?: string;
  created_by?: string;
}

export type LeadSource = 'website' | 'api' | 'manual';
export type LeadStatus = 'new' | 'in_progress' | 'done';

export interface ChatMessageTurn {
  sender: 'user' | 'coreiq' | 'operator';
  text: string;
  timestamp: string;
  blueprint?: Record<string, any>;
}

export interface LeadItem {
  id: string;
  created_at: string;
  source: LeadSource;
  client_name: string;
  client_contact: string;
  client_message: string;
  conversation_summary: string;
  intent_type: string;
  status: LeadStatus;
  full_conversation: ChatMessageTurn[] | string;
  client_id?: string | null;
  budget_range?: string;
  notes?: string;
}

export type SocialPlatformSource = 'facebook' | 'instagram' | 'x' | 'linkedin' | 'whatsapp' | 'telegram' | 'tiktok';

export interface SocialMessageItem {
  id: string;
  created_at: string;
  source: SocialPlatformSource | string;
  sender_name: string;
  sender_contact: string;
  message_text: string;
  status: LeadStatus;
}

export type UnifiedInboxItem = 
  | ({ itemType: 'lead' } & LeadItem)
  | ({ itemType: 'social' } & SocialMessageItem);

export type TaskStatus = 'not_started' | 'in_progress' | 'done';

export interface CommandTask {
  id: string;
  created_at: string;
  title: string;
  description: string;
  status: TaskStatus;
  linked_lead_id?: string | null;
  linked_client_id?: string | null;
  due_date?: string | null;
}

export interface CommandClient {
  id: string;
  created_at: string;
  name: string;
  contact_email: string;
  contact_phone?: string | null;
  notes: string;
}

export interface AgentConfig {
  id?: string;
  provider: string; // 'groq' | 'openai' | 'google' | 'anthropic' | 'openrouter' | etc.
  model_name: string;
  base_url: string;
  api_key: string;
  system_prompt: string;
  updated_at: string;
}

export type ToolStatus = 'connected' | 'not_connected' | 'error';

export interface AgentToolConnection {
  id: string;
  created_at: string;
  tool_name: string;
  provider: string;
  api_key: string;
  endpoint_url?: string;
  status: ToolStatus;
  notes?: string;
}

export type PlatformType = 'website' | 'social' | 'freelance' | 'deployment' | 'tool' | 'other';

export interface PlatformRegistryItem {
  id: string;
  created_at: string;
  name: string;
  url: string;
  platform_type?: PlatformType;
  category?: string;
  notes?: string;
}

export type ContentCategory = 'hero_background' | 'news' | 'learning' | 'case_study' | 'general';

export type ContentType = 
  | 'text'
  | 'article'
  | 'guide'
  | 'topic'
  | 'learning_path'
  | 'pdf'
  | 'video'
  | 'external'
  | 'resource'
  | 'coming_soon';

export type ContentStatus = 
  | 'MISSING'
  | 'PLACEHOLDER'
  | 'DRAFT'
  | 'REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'STALE';

export interface CommandContentItem {
  id: string;
  created_at: string;
  updated_at?: string;
  title?: string;
  body?: string;
  category?: ContentCategory | string;
  media_reference?: string;
  published?: boolean;
  key?: string;
  value?: string;
  type?: 'text' | 'image' | 'json';
  // Extended fields
  content_key?: string;
  slug?: string;
  content_type?: ContentType | string;
  status?: ContentStatus | string;
  summary?: string;
  metadata?: Record<string, any>;
  asset_url?: string;
  version?: number;
  updated_by?: string;
}

export type ContentItem = CommandContentItem;
export type PlatformCategory = PlatformType;

export interface SwarmNode {
  id: string;
  name: string;
  role: string;
  status: 'online' | 'busy' | 'standby' | 'syncing';
  lastSeen: string;
  activeContext: string;
  readOnlyVaultAccess: boolean;
}

export interface SwarmCommsMessage {
  id: string;
  created_at: string;
  sender_node?: string;
  target_node?: string;
  subject?: string;
  message?: string;
  agent_name?: string;
  event_type?: string;
  payload?: any;
  lead_reference_id?: string;
}

export type SwarmMessage = SwarmCommsMessage;

export interface AnalyticsSummary {
  visitorCountEstimate: number;
  totalLeads: number;
  leadsByStatus: Record<LeadStatus, number>;
  leadsByIntent: Record<string, number>;
  taskCompletionRate: number;
  totalTasks: number;
  completedTasks: number;
  activeClientsCount: number;
}
