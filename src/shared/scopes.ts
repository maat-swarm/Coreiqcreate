/**
 * Shared API Scopes & Access Control Definitions for CoreIQ Create
 * Used across Server Gateway, MCP Tools, OpenAPI specs, and Command UI.
 */

export type StandardApiScope =
  // Existing scopes (must remain unchanged)
  | 'READ_LEADS'
  | 'WRITE_LEADS'
  | 'READ_TASKS'
  | 'WRITE_TASKS'
  | 'READ_CLIENTS'
  | 'WRITE_CLIENTS'
  | 'READ_CONTENT'
  | 'WRITE_CONTENT'
  | 'PUBLISH_CONTENT'
  | 'READ_CONFIG'
  | 'WRITE_CONFIG'
  | 'READ_MEDIA'
  | 'WRITE_MEDIA'
  // Added scopes
  | 'READ_NEWS'
  | 'WRITE_NEWS'
  | 'PUBLISH_NEWS'
  | 'READ_USE_CASES'
  | 'WRITE_USE_CASES'
  | 'PUBLISH_USE_CASES'
  | 'READ_STORE'
  | 'WRITE_STORE'
  | 'READ_TOOLS'
  | 'WRITE_TOOLS'
  | 'READ_PLATFORMS'
  | 'WRITE_PLATFORMS'
  | 'READ_SWARM'
  | 'WRITE_SWARM'
  | 'READ_SOCIAL'
  | 'WRITE_SOCIAL'
  | 'READ_ANALYTICS'
  | 'READ_KEYS';

export type ApiScope = StandardApiScope | '*' | 'ADMIN' | 'admin' | string;

export interface ScopeDefinition {
  id: StandardApiScope;
  label: string;
  description: string;
  group: 'inbox' | 'content' | 'store' | 'media' | 'brain' | 'swarm' | 'insights';
  isWrite?: boolean;
  isPublish?: boolean;
}

export const ALL_SCOPES: readonly ScopeDefinition[] = [
  // INBOX GROUP
  { id: 'READ_LEADS', label: 'Read Leads', description: 'Query inquiries and intake records', group: 'inbox' },
  { id: 'WRITE_LEADS', label: 'Write Leads', description: 'Ingest new leads and transition statuses', group: 'inbox', isWrite: true },
  { id: 'READ_SOCIAL', label: 'Read Social Messages', description: 'Query inbound webhook and social messages', group: 'inbox' },
  { id: 'WRITE_SOCIAL', label: 'Write Social Messages', description: 'Update status of incoming social messages', group: 'inbox', isWrite: true },
  { id: 'READ_TASKS', label: 'Read Tasks', description: 'Fetch operator tasks and roadmap items', group: 'inbox' },
  { id: 'WRITE_TASKS', label: 'Write Tasks', description: 'Create and transition execution tasks', group: 'inbox', isWrite: true },
  { id: 'READ_CLIENTS', label: 'Read Clients', description: 'Access registered client list', group: 'inbox' },
  { id: 'WRITE_CLIENTS', label: 'Write Clients', description: 'Register or update client details', group: 'inbox', isWrite: true },

  // CONTENT GROUP
  { id: 'READ_CONTENT', label: 'Read Content', description: 'Query CMS content items and health', group: 'content' },
  { id: 'WRITE_CONTENT', label: 'Write Content', description: 'Draft or update CMS content keys', group: 'content', isWrite: true },
  { id: 'PUBLISH_CONTENT', label: 'Publish Content', description: 'Publish CMS content items directly', group: 'content', isPublish: true },
  { id: 'READ_NEWS', label: 'Read News', description: 'List published and draft news articles', group: 'content' },
  { id: 'WRITE_NEWS', label: 'Write News', description: 'Create and edit news articles', group: 'content', isWrite: true },
  { id: 'PUBLISH_NEWS', label: 'Publish News', description: 'Publish news articles and toggle lead', group: 'content', isPublish: true },
  { id: 'READ_USE_CASES', label: 'Read Use Cases', description: 'List use cases, categories and files', group: 'content' },
  { id: 'WRITE_USE_CASES', label: 'Write Use Cases', description: 'Create and update use case definitions', group: 'content', isWrite: true },
  { id: 'PUBLISH_USE_CASES', label: 'Publish Use Cases', description: 'Publish and unpublish use cases', group: 'content', isPublish: true },

  // STORE GROUP
  { id: 'READ_STORE', label: 'Read Store', description: 'Query apps, requests, settings and stats', group: 'store' },
  { id: 'WRITE_STORE', label: 'Write Store', description: 'Manage apps, handle requests, update settings', group: 'store', isWrite: true },

  // MEDIA GROUP
  { id: 'READ_MEDIA', label: 'Read Media', description: 'Query media slots and slot items', group: 'media' },
  { id: 'WRITE_MEDIA', label: 'Write Media', description: 'Manage media slot items and ordering', group: 'media', isWrite: true },

  // BRAIN GROUP
  { id: 'READ_CONFIG', label: 'Read Config', description: 'Fetch system prompt and active model specs', group: 'brain' },
  { id: 'WRITE_CONFIG', label: 'Write Config', description: 'Update sovereign agent brain configuration', group: 'brain', isWrite: true },
  { id: 'READ_TOOLS', label: 'Read Tools', description: 'Inspect site tool catalog cards', group: 'brain' },
  { id: 'WRITE_TOOLS', label: 'Write Tools', description: 'Create, edit and manage site tools', group: 'brain', isWrite: true },
  { id: 'READ_PLATFORMS', label: 'Read Platforms', description: 'Query registered deployment platforms', group: 'brain' },
  { id: 'WRITE_PLATFORMS', label: 'Write Platforms', description: 'Register or delete platform entries', group: 'brain', isWrite: true },

  // SWARM GROUP
  { id: 'READ_SWARM', label: 'Read Swarm', description: 'Inspect agent swarm communication log', group: 'swarm' },
  { id: 'WRITE_SWARM', label: 'Write Swarm', description: 'Emit swarm communication messages', group: 'swarm', isWrite: true },

  // INSIGHTS GROUP
  { id: 'READ_ANALYTICS', label: 'Read Analytics', description: 'Access aggregated site and lead analytics', group: 'insights' },
  { id: 'READ_KEYS', label: 'Read API Keys', description: 'List registered API keys (read-only)', group: 'insights' },
];

export const SCOPE_GROUPS: Record<
  'inbox' | 'content' | 'store' | 'media' | 'brain' | 'swarm' | 'insights',
  { label: string; description: string }
> = {
  inbox: { label: 'Inbox', description: 'Leads, social messages, tasks, clients' },
  content: { label: 'Content', description: 'Universal content, news articles, use cases, publishing' },
  store: { label: 'Store', description: 'Store apps, access requests, licenses, payment settings' },
  media: { label: 'Media', description: 'Media slots and showcased visuals' },
  brain: { label: 'Brain', description: 'Agent config, tools catalog, platforms registry' },
  swarm: { label: 'Swarm', description: 'Multi-agent communication channels' },
  insights: { label: 'Insights', description: 'Telemetry, analytics rollup, key listing' },
};

export const PRESET_FULL_ACCESS: StandardApiScope[] = ['*'] as any;

export const PRESET_READ_ONLY: StandardApiScope[] = ALL_SCOPES
  .filter((s) => !s.isWrite && !s.isPublish)
  .map((s) => s.id);

export const PRESET_CONTENT_EDITOR: StandardApiScope[] = [
  'READ_CONTENT',
  'WRITE_CONTENT',
  'PUBLISH_CONTENT',
  'READ_NEWS',
  'WRITE_NEWS',
  'PUBLISH_NEWS',
  'READ_USE_CASES',
  'WRITE_USE_CASES',
  'PUBLISH_USE_CASES',
  'READ_MEDIA',
  'WRITE_MEDIA',
];

const KNOWN_SCOPES_SET = new Set<string>([
  '*',
  'ADMIN',
  'admin',
  ...ALL_SCOPES.map((s) => s.id),
  // Legacy aliases
  'content:read',
  'content:write',
  'content:publish',
  'read:leads',
  'write:leads',
  'read:tasks',
  'write:tasks',
  'read:clients',
  'write:clients',
  'read:config',
  'write:config',
  'read:media',
  'write:media',
]);

/**
 * Normalizes a scope token into standard uppercase format (e.g. content:read -> READ_CONTENT)
 */
export function normalizeScope(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed === '*' || trimmed === 'ADMIN' || trimmed === 'admin') {
    return trimmed;
  }
  if (trimmed.includes(':')) {
    const [left, right] = trimmed.split(':');
    if (right && (right.toLowerCase() === 'read' || right.toLowerCase() === 'write' || right.toLowerCase() === 'publish')) {
      return `${right.toUpperCase()}_${left.toUpperCase()}`;
    }
  }
  return trimmed.toUpperCase().replace(/-/g, '_');
}

/**
 * Pure scope authorization resolver:
 * - '*' or 'ADMIN' allows all scopes (including PUBLISH_*)
 * - Exact matches or normalized alias matches allow
 * - WRITE_<RESOURCE> automatically implies READ_<RESOURCE>
 * - Unknown scopes are denied
 * - READ scopes can never write
 */
export function hasScope(grantedScopes: string[] | undefined | null, requiredScope: string): boolean {
  if (!grantedScopes || !Array.isArray(grantedScopes) || grantedScopes.length === 0) {
    return false;
  }

  const normalizedRequired = normalizeScope(requiredScope);

  // Wildcard grants everything
  for (const s of grantedScopes) {
    if (s === '*' || s === 'ADMIN' || s === 'admin') {
      return true;
    }
  }

  // Validate that required scope is known
  if (!KNOWN_SCOPES_SET.has(requiredScope) && !KNOWN_SCOPES_SET.has(normalizedRequired)) {
    return false;
  }

  const normalizedGranted = new Set<string>();
  for (const s of grantedScopes) {
    normalizedGranted.add(s);
    normalizedGranted.add(normalizeScope(s));
  }

  // Exact or alias match
  if (normalizedGranted.has(requiredScope) || normalizedGranted.has(normalizedRequired)) {
    return true;
  }

  // WRITE_X implies READ_X
  if (normalizedRequired.startsWith('READ_')) {
    const resource = normalizedRequired.replace(/^READ_/, '');
    const writeScope = `WRITE_${resource}`;
    if (normalizedGranted.has(writeScope)) {
      return true;
    }
  }

  return false;
}
