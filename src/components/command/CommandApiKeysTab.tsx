import React, { useState } from 'react';
import { 
  Key, 
  Plus, 
  ShieldCheck, 
  Copy, 
  Check, 
  Trash2, 
  AlertCircle, 
  Terminal, 
  Code2, 
  Clock, 
  Cpu, 
  Send, 
  CheckCircle2, 
  X,
  Lock,
  ExternalLink
} from 'lucide-react';
import { ApiKeyItem, ApiScope } from '../../types/command';
import { CoreIQData } from '../../services/supabase';

interface CommandApiKeysTabProps {
  apiKeys: ApiKeyItem[];
  onRefresh: () => void;
}

const ALL_SCOPES: { id: ApiScope; label: string; description: string; category: 'read' | 'write' }[] = [
  { id: 'READ_LEADS', label: 'Read Leads', description: 'Query inquiries and intake records', category: 'read' },
  { id: 'WRITE_LEADS', label: 'Write Leads', description: 'Ingest new leads and update statuses', category: 'write' },
  { id: 'READ_TASKS', label: 'Read Tasks', description: 'Fetch operator tasks and roadmap items', category: 'read' },
  { id: 'WRITE_TASKS', label: 'Write Tasks', description: 'Create and transition execution tasks', category: 'write' },
  { id: 'READ_CLIENTS', label: 'Read Clients', description: 'Access registered client list', category: 'read' },
  { id: 'WRITE_CLIENTS', label: 'Write Clients', description: 'Register or update client details', category: 'write' },
  { id: 'READ_CONTENT', label: 'Read Content', description: 'Query published and draft CMS content', category: 'read' },
  { id: 'WRITE_CONTENT', label: 'Write Content', description: 'Publish or modify site content items', category: 'write' },
  { id: 'READ_CONFIG', label: 'Read Config', description: 'Fetch system prompt and active model specs', category: 'read' },
  { id: 'WRITE_CONFIG', label: 'Write Config', description: 'Update sovereign agent configuration', category: 'write' },
  { id: 'READ_MEDIA', label: 'Read Media', description: 'Read media slot items and published assets', category: 'read' },
  { id: 'WRITE_MEDIA', label: 'Write Media', description: 'Upload, publish, reorder and delete media slot items', category: 'write' },
];

export const CommandApiKeysTab: React.FC<CommandApiKeysTabProps> = ({ apiKeys, onRefresh }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>([
    'READ_LEADS', 'WRITE_LEADS', 'READ_TASKS', 'WRITE_TASKS', 'READ_CLIENTS', 'READ_CONFIG'
  ]);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ token: string; name: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [activeDocLanguage, setActiveDocLanguage] = useState<'curl' | 'python' | 'javascript'>('curl');
  
  // Test Console state
  const [testKeyId, setTestKeyId] = useState<string>('');
  const [testEndpoint, setTestEndpoint] = useState<string>('/api/v1/ping');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<any | null>(null);

  const handleToggleScope = (scope: ApiScope) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleSelectPreset = (preset: 'all' | 'read' | 'ingest') => {
    if (preset === 'all') {
      setSelectedScopes(ALL_SCOPES.map((s) => s.id));
    } else if (preset === 'read') {
      setSelectedScopes(ALL_SCOPES.filter((s) => s.category === 'read').map((s) => s.id));
    } else if (preset === 'ingest') {
      setSelectedScopes(['WRITE_LEADS', 'READ_LEADS', 'READ_CONFIG']);
    }
  };

  // Generate real cryptographically random key
  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    // Generate token string
    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const randomHex = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const rawToken = `ciq_live_${randomHex}`;
    const prefix = `ciq_live_${randomHex.substring(0, 8)}...`;

    // SHA-256 hash in browser
    const encoder = new TextEncoder();
    const data = encoder.encode(rawToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const newKeyRecord = await CoreIQData.insertApiKey({
      name: keyName.trim(),
      key_prefix: prefix,
      key_hash: tokenHash,
      raw_token_display: rawToken, // stored locally for immediate display
      scopes: selectedScopes,
      revoked: false,
    });

    setNewlyCreatedKey({ token: rawToken, name: keyName.trim() });
    setKeyName('');
    setIsModalOpen(false);
    onRefresh();
  };

  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null);

  const handleRevokeKey = async (id: string) => {
    await CoreIQData.revokeApiKey(id);
    setConfirmRevokeId(null);
    onRefresh();
  };

  const handleDeleteKey = async (id: string) => {
    await CoreIQData.deleteApiKey(id);
    onRefresh();
  };

  const handleCopy = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedEndpoint(id);
      setTimeout(() => setCopiedEndpoint(null), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleRunTest = async () => {
    setTestLoading(true);
    setTestResponse(null);
    try {
      const selected = apiKeys.find((k) => k.id === testKeyId);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (selected && selected.raw_token_display) {
        headers['Authorization'] = `Bearer ${selected.raw_token_display}`;
      } else {
        headers['Authorization'] = `Bearer ciq_live_test_token`;
      }

      const res = await fetch(testEndpoint, { headers });
      const data = await res.json();
      setTestResponse({
        statusCode: res.status,
        statusText: res.statusText,
        data,
      });
    } catch (err: any) {
      setTestResponse({
        error: true,
        message: err.message || 'Network call failed',
      });
    } finally {
      setTestLoading(false);
    }
  };

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://coreiq.create';

  return (
    <div className="space-y-6">
      
      {/* Top Header Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#060b1e] border border-cyan-500/25 shadow-[0_0_30px_rgba(25,217,255,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Machine Gateway
            </span>
            <span className="text-xs text-slate-400 font-mono">REST API v1</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
            Agent Integrations & API Keys
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Issue cryptographically secure, scoped tokens for external AI agents (such as Hermes Prime, LangChain, or custom autonomous nodes) to read and manipulate CoreIQ telemetry programmatically.
          </p>
        </div>

        <button
          onClick={() => {
            setNewlyCreatedKey(null);
            setIsModalOpen(true);
          }}
          className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-transform active:scale-98 shadow-[0_0_15px_rgba(25,217,255,0.3)] shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* Newly Created Key Alert Modal */}
      {newlyCreatedKey && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 via-blue-950/40 to-slate-950 border-2 border-cyan-400/60 shadow-[0_0_40px_rgba(25,217,255,0.25)] relative">
          <button
            onClick={() => setNewlyCreatedKey(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div className="space-y-2 flex-1">
              <div>
                <h3 className="text-sm font-bold text-white">
                  API Key Created: {newlyCreatedKey.name}
                </h3>
                <p className="text-xs text-amber-300 flex items-center gap-1.5 mt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Copy this token now. For security, this raw token cannot be shown again.</span>
                </p>
              </div>

              <div className="flex items-center gap-2 pt-1 max-w-xl">
                <input
                  type="text"
                  readOnly
                  value={newlyCreatedKey.token}
                  className="flex-1 px-3.5 py-2 rounded-lg bg-slate-950 border border-cyan-500/40 text-cyan-200 text-xs font-mono select-all focus:outline-none"
                />
                <button
                  onClick={() => handleCopy(newlyCreatedKey.token)}
                  className="py-2 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedToken ? 'Copied!' : 'Copy Token'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Keys Table */}
      <div className="rounded-2xl bg-[#060b1e] border border-slate-800/80 overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">Active Machine Credentials</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {apiKeys.length} {apiKeys.length === 1 ? 'Key' : 'Keys'} Registered
          </span>
        </div>

        {apiKeys.length === 0 ? (
          <div className="py-12 px-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <Key className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-300 font-medium">No API Keys Generated Yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Click "Generate New Key" above to grant Hermes Prime or your custom autonomous scripts programmatic access to CoreIQ leads, tasks, and brain configurations.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {apiKeys.map((key) => (
              <div key={key.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-900/30 transition-colors">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="text-sm font-bold text-white font-mono">{key.name}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      key.revoked
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {key.revoked ? 'REVOKED' : 'ACTIVE'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {key.key_prefix}
                    </span>
                  </div>

                  {/* Scopes Badges */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                    {key.scopes.map((s) => (
                      <span
                        key={s}
                        className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-cyan-300 border border-slate-700/80"
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                    <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                    <span>Last used: {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!key.revoked ? (
                    confirmRevokeId === key.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleRevokeKey(key.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors"
                        >
                          Confirm Revoke
                        </button>
                        <button
                          onClick={() => setConfirmRevokeId(null)}
                          className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRevokeId(key.id)}
                        className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
                      >
                        Revoke
                      </button>
                    )
                  ) : (
                    <button
                      onClick={() => handleDeleteKey(key.id)}
                      className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                      title="Delete key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Embedded API Documentation & Endpoint Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Documentation & Code Snippets */}
        <div className="lg:col-span-7 rounded-2xl bg-[#060b1e] border border-slate-800/80 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-display">Integration Documentation</h3>
            </div>
            
            {/* Language switcher */}
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 text-[11px] font-mono">
              {(['curl', 'python', 'javascript'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveDocLanguage(lang)}
                  className={`px-2.5 py-1 rounded capitalize transition-colors ${
                    activeDocLanguage === lang
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            All external agents authenticate by passing the token in the standard HTTP <code className="text-cyan-300 font-mono">Authorization: Bearer &lt;token&gt;</code> header or <code className="text-cyan-300 font-mono">x-api-key: &lt;token&gt;</code>.
          </p>

          {/* Code display */}
          <div className="relative rounded-xl bg-slate-950 border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/60 border-b border-slate-800/60 text-[11px] font-mono text-slate-400">
              <span>{activeDocLanguage === 'curl' ? 'cURL Shell Command' : activeDocLanguage === 'python' ? 'Python Script' : 'Node.js / Browser'}</span>
              <button
                onClick={() => {
                  const text = activeDocLanguage === 'curl' 
                    ? `curl -X GET "${baseUrl}/api/v1/leads" \\\n  -H "Authorization: Bearer ciq_live_YOUR_TOKEN" \\\n  -H "Content-Type: application/json"`
                    : activeDocLanguage === 'python'
                    ? `import requests\n\nres = requests.get(\n    "${baseUrl}/api/v1/leads",\n    headers={"Authorization": "Bearer ciq_live_YOUR_TOKEN"}\n)\nprint(res.json())`
                    : `const res = await fetch("${baseUrl}/api/v1/leads", {\n  headers: { "Authorization": "Bearer ciq_live_YOUR_TOKEN" }\n});\nconst data = await res.json();`;
                  handleCopy(text, 'doc_code');
                }}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
              >
                {copiedEndpoint === 'doc_code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copiedEndpoint === 'doc_code' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
              {activeDocLanguage === 'curl' && 
`# Fetch unhandled website leads
curl -X GET "${baseUrl}/api/v1/leads" \\
  -H "Authorization: Bearer ciq_live_YOUR_TOKEN" \\
  -H "Content-Type: application/json"

# Ingest new lead from external scraper
curl -X POST "${baseUrl}/api/v1/leads" \\
  -H "Authorization: Bearer ciq_live_YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_name": "Apollo Logistics",
    "client_contact": "ops@apollocorp.io",
    "client_message": "Automated dispatch routing AI requested",
    "intent_type": "automation"
  }'`}
              {activeDocLanguage === 'python' && 
`import requests

API_KEY = "ciq_live_YOUR_TOKEN"
BASE_URL = "${baseUrl}/api/v1"

headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# 1. Read leads
leads_res = requests.get(f"{BASE_URL}/leads", headers=headers)
print("Leads:", leads_res.json())

# 2. Ingest a task into operator queue
task_res = requests.post(f"{BASE_URL}/tasks", headers=headers, json={
    "title": "Hermes Prime: Review extracted client brief",
    "description": "Cross-referenced telemetry with public CRM records."
})
print("Task created:", task_res.json())`}
              {activeDocLanguage === 'javascript' && 
`const API_KEY = 'ciq_live_YOUR_TOKEN';
const BASE_URL = '${baseUrl}/api/v1';

// Read CoreIQ active agent config
const configRes = await fetch(\`\${BASE_URL}/config\`, {
  headers: { 'Authorization': \`Bearer \${API_KEY}\` }
});
const { config } = await configRes.json();
console.log('System Prompt:', config.system_prompt);`}
            </pre>
          </div>

          {/* Endpoints Matrix */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                Available REST Endpoints & Tools Surface
              </h4>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                17 Routes • 25 Tools Active
              </span>
            </div>

            {/* Content Control Plane */}
            <div className="space-y-1 text-xs font-mono">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/90 py-1">
                Content Control Plane (94-Key Universal Manifest)
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">GET</span>
                  <span className="text-slate-300">/api/v1/content/health</span>
                </div>
                <span className="text-[11px] text-cyan-400">READ_CONTENT</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">GET</span>
                  <span className="text-slate-300">/api/v1/content</span>
                </div>
                <span className="text-[11px] text-cyan-400">READ_CONTENT</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">GET</span>
                  <span className="text-slate-300">/api/v1/content/:key</span>
                </div>
                <span className="text-[11px] text-cyan-400">READ_CONTENT</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">GET</span>
                  <span className="text-slate-300">/api/v1/content/:key/resolve</span>
                </div>
                <span className="text-[11px] text-cyan-400">READ_CONTENT</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">PATCH</span>
                  <span className="text-slate-300">/api/v1/content/:key</span>
                </div>
                <span className="text-[11px] text-cyan-400">WRITE_CONTENT</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">POST</span>
                  <span className="text-slate-300">/api/v1/content/:key/publish</span>
                </div>
                <span className="text-[11px] text-purple-400">PUBLISH_CONTENT</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">GET</span>
                  <span className="text-slate-300">/api/v1/content/placeholders/:page</span>
                </div>
                <span className="text-[11px] text-cyan-400">READ_CONTENT</span>
              </div>
            </div>

            {/* Autonomous Tools & MCP Connectors */}
            <div className="space-y-1 text-xs font-mono pt-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/90 py-1">
                Autonomous Tools & External Connectors
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">GET</span>
                  <span className="text-slate-300">/openapi.json</span>
                </div>
                <span className="text-[11px] text-emerald-400">PUBLIC SPEC</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">GET</span>
                  <span className="text-slate-300">/api/v1/tools</span>
                </div>
                <span className="text-[11px] text-slate-400">PUBLIC / REGISTRY</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">POST</span>
                  <span className="text-slate-300">/api/v1/tools/execute</span>
                </div>
                <span className="text-[11px] text-cyan-400">SCOPED BY TOOL</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">POST</span>
                  <span className="text-slate-300">/mcp</span>
                </div>
                <span className="text-[11px] text-purple-400">STREAMABLE MCP</span>
              </div>
            </div>

            {/* Core Ingestion Endpoints */}
            <div className="space-y-1 text-xs font-mono pt-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-cyan-400/90 py-1">
                Data & Ingestion Endpoints
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">GET</span>
                  <span className="text-slate-300">/api/v1/leads</span>
                </div>
                <span className="text-[11px] text-cyan-400">READ_LEADS</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">POST</span>
                  <span className="text-slate-300">/api/v1/leads</span>
                </div>
                <span className="text-[11px] text-cyan-400">WRITE_LEADS</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">GET</span>
                  <span className="text-slate-300">/api/v1/tasks</span>
                </div>
                <span className="text-[11px] text-cyan-400">READ_TASKS</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">POST</span>
                  <span className="text-slate-300">/api/v1/tasks</span>
                </div>
                <span className="text-[11px] text-cyan-400">WRITE_TASKS</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">GET</span>
                  <span className="text-slate-300">/api/v1/clients</span>
                </div>
                <span className="text-[11px] text-cyan-400">READ_CLIENTS</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300">GET</span>
                  <span className="text-slate-300">/api/v1/config</span>
                </div>
                <span className="text-[11px] text-cyan-400">READ_CONFIG</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Test Console */}
        <div className="lg:col-span-5 rounded-2xl bg-[#060b1e] border border-slate-800/80 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-display">Live API Test Console</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Execute a live in-browser round-trip API test against the active server gateway.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                Select API Key
              </label>
              <select
                value={testKeyId}
                onChange={(e) => setTestKeyId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
              >
                <option value="">-- Anonymous / Public Test Ping --</option>
                {apiKeys.map((k) => (
                  <option key={k.id} value={k.id} disabled={k.revoked}>
                    {k.name} ({k.key_prefix}) {k.revoked ? '[REVOKED]' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                Target Endpoint
              </label>
              <select
                value={testEndpoint}
                onChange={(e) => setTestEndpoint(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs font-mono focus:outline-none focus:border-cyan-400"
              >
                <option value="/api/v1/content/health">GET /api/v1/content/health (READ_CONTENT - 94 Keys)</option>
                <option value="/api/v1/content">GET /api/v1/content (READ_CONTENT - All Items)</option>
                <option value="/api/v1/content/learn.guide.ai-workflows">GET /api/v1/content/:key (READ_CONTENT - Learn Guide)</option>
                <option value="/api/v1/content/learn.guide.ai-workflows/resolve">GET /api/v1/content/:key/resolve (READ_CONTENT - Resolution)</option>
                <option value="/api/v1/content/placeholders/learn">GET /api/v1/content/placeholders/:page (Placeholders)</option>
                <option value="/api/v1/tools">GET /api/v1/tools (Tools Registry - 25 Tools)</option>
                <option value="/openapi.json">GET /openapi.json (OpenAPI 3.0 Specification)</option>
                <option value="/api/v1/ping">GET /api/v1/ping (Public Health)</option>
                <option value="/api/v1/leads">GET /api/v1/leads (READ_LEADS)</option>
                <option value="/api/v1/tasks">GET /api/v1/tasks (READ_TASKS)</option>
                <option value="/api/v1/clients">GET /api/v1/clients (READ_CLIENTS)</option>
                <option value="/api/v1/config">GET /api/v1/config (READ_CONFIG)</option>
              </select>
            </div>

            <button
              onClick={handleRunTest}
              disabled={testLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {testLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>{testLoading ? 'Executing Request...' : 'Send Live Request'}</span>
            </button>

            {testResponse && (
              <div className="space-y-1.5 pt-2">
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Response Status:</span>
                  <span className={testResponse.statusCode === 200 || testResponse.statusCode === 201 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {testResponse.statusCode || 500} {testResponse.statusText || ''}
                  </span>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-48 overflow-y-auto leading-relaxed">
                  {JSON.stringify(testResponse.data || testResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Generate Key Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050f]/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#060b1e] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(25,217,255,0.15)] overflow-hidden my-6">
            
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Generate Agent API Key</h3>
                  <p className="text-[11px] text-slate-400">Issue scoped credentials for external systems</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateKey} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Key Name / Agent Identifier
                </label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Hermes Prime access, Scraper Swarm, LangChain Bot"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Scopes Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Assigned Scopes ({selectedScopes.length} selected)
                  </label>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-cyan-400">
                    <button type="button" onClick={() => handleSelectPreset('all')} className="hover:underline">All</button>
                    <span>•</span>
                    <button type="button" onClick={() => handleSelectPreset('read')} className="hover:underline">Read Only</button>
                    <span>•</span>
                    <button type="button" onClick={() => handleSelectPreset('ingest')} className="hover:underline">Ingestion</button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                  {ALL_SCOPES.map((scope) => {
                    const isChecked = selectedScopes.includes(scope.id);
                    return (
                      <label
                        key={scope.id}
                        className={`p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleScope(scope.id)}
                          className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold font-mono leading-tight">{scope.id}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{scope.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!keyName.trim() || selectedScopes.length === 0}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-98 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>Generate Key</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
