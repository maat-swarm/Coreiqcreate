import React, { useState, useEffect } from 'react';
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
  ExternalLink,
  Edit2,
  FileCode,
  Activity,
  Zap,
  List
} from 'lucide-react';
import { ApiKeyItem, ApiScope, ApiAuditItem } from '../../types/command';
import { CoreIQData } from '../../services/supabase';
import { 
  ALL_SCOPES, 
  SCOPE_GROUPS, 
  PRESET_FULL_ACCESS, 
  PRESET_READ_ONLY, 
  PRESET_CONTENT_EDITOR,
  StandardApiScope
} from '../../shared/scopes';
import { RESOURCE_REGISTRY_TOOLS, getToolsGrouped } from '../../server/resourceRegistry';

interface CommandApiKeysTabProps {
  apiKeys: ApiKeyItem[];
  onRefresh: () => void;
}

export const CommandApiKeysTab: React.FC<CommandApiKeysTabProps> = ({ apiKeys, onRefresh }) => {
  // Key creation state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFullAccessModalOpen, setIsFullAccessModalOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<ApiScope[]>([...PRESET_CONTENT_EDITOR]);
  const [activePreset, setActivePreset] = useState<'full' | 'read' | 'content' | 'custom'>('content');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<{ token: string; name: string } | null>(null);

  // Edit scopes state
  const [editingKey, setEditingKey] = useState<ApiKeyItem | null>(null);
  const [editScopesList, setEditScopesList] = useState<ApiScope[]>([]);
  const [editConfirmStep, setEditConfirmStep] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Copy helpers
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [activeDocLanguage, setActiveDocLanguage] = useState<'curl' | 'python' | 'javascript'>('curl');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<ApiAuditItem[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Test Console state
  const [testKeyId, setTestKeyId] = useState<string>('');
  const [testEndpoint, setTestEndpoint] = useState<string>('/api/v1/ping');
  const [testLoading, setTestLoading] = useState(false);
  const [testResponse, setTestResponse] = useState<any | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://coreiqcreate.onrender.com';
  const renderHost = 'https://coreiqcreate.onrender.com';
  // Use current host if deployed, otherwise fallback to configured render host
  const effectiveBase = typeof window !== 'undefined' && !window.location.origin.includes('localhost') && !window.location.origin.includes('run.app')
    ? window.location.origin
    : renderHost;

  const groupedTools = getToolsGrouped();

  // Load audit logs on mount
  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      const logs = await CoreIQData.getApiAuditLogs(50);
      setAuditLogs(logs || []);
    } catch {
      setAuditLogs([]);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const handleToggleScope = (scope: ApiScope) => {
    setActivePreset('custom');
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  const handleToggleGroup = (groupKey: string) => {
    setActivePreset('custom');
    const groupScopes = ALL_SCOPES.filter((s) => s.group === groupKey).map((s) => s.id);
    const allInGroupSelected = groupScopes.every((s) => selectedScopes.includes(s));

    if (allInGroupSelected) {
      setSelectedScopes(selectedScopes.filter((s) => !groupScopes.includes(s as any)));
    } else {
      const next = new Set([...selectedScopes, ...groupScopes]);
      setSelectedScopes(Array.from(next));
    }
  };

  const handleSelectPreset = (preset: 'full' | 'read' | 'content' | 'custom') => {
    setActivePreset(preset);
    if (preset === 'full') {
      setSelectedScopes(['*']);
    } else if (preset === 'read') {
      setSelectedScopes([...PRESET_READ_ONLY]);
    } else if (preset === 'content') {
      setSelectedScopes([...PRESET_CONTENT_EDITOR]);
    }
  };

  // Generate real cryptographically random key
  const handleGenerateKey = async (nameToUse: string, scopesToUse: ApiScope[]) => {
    if (!nameToUse.trim()) return;

    const array = new Uint8Array(24);
    crypto.getRandomValues(array);
    const randomHex = Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const rawToken = `ciq_live_${randomHex}`;
    const prefix = `ciq_live_${randomHex.substring(0, 8)}...`;

    const encoder = new TextEncoder();
    const data = encoder.encode(rawToken);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    await CoreIQData.insertApiKey({
      name: nameToUse.trim(),
      key_prefix: prefix,
      key_hash: tokenHash,
      raw_token_display: rawToken,
      scopes: scopesToUse,
      revoked: false,
    });

    setNewlyCreatedKey({ token: rawToken, name: nameToUse.trim() });
    setKeyName('');
    setIsModalOpen(false);
    setIsFullAccessModalOpen(false);
    onRefresh();
  };

  // Open Edit Scopes modal
  const handleOpenEditScopes = (keyItem: ApiKeyItem) => {
    setEditingKey(keyItem);
    setEditScopesList([...keyItem.scopes]);
    setEditConfirmStep(false);
  };

  const handleSaveEditedScopes = async () => {
    if (!editingKey) return;
    setIsSavingEdit(true);
    try {
      await CoreIQData.updateApiKeyScopes(editingKey.id, editScopesList);
      setEditingKey(null);
      setEditConfirmStep(false);
      onRefresh();
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleRevokeKey = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to revoke API key "${name}"? External agents using this key will immediately be blocked.`)) {
      await CoreIQData.revokeApiKey(id);
      onRefresh();
    }
  };

  const handleDeleteKey = async (id: string) => {
    await CoreIQData.deleteApiKey(id);
    onRefresh();
  };

  const handleCopy = (text: string, id?: string) => {
    navigator.clipboard.writeText(text);
    if (id) {
      setCopiedSnippet(id);
      setTimeout(() => setCopiedSnippet(null), 2000);
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

  return (
    <div className="space-y-6">
      {/* Top Header Banner with Action Buttons */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[#060b1e] border border-cyan-500/25 shadow-[0_0_30px_rgba(25,217,255,0.08)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              Machine Gateway & Autonomous Access
            </span>
            <span className="text-xs text-slate-400 font-mono">REST + MCP Streamable</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
            Agent Integrations & API Keys
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Issue cryptographically secure tokens for AI agents (Claude Code, Hermes Prime, cursor, custom swarms) to read and manage all CoreIQ surfaces via REST and Model Context Protocol.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Quick Create FULL ACCESS Button */}
          <button
            onClick={() => {
              setKeyName('');
              setIsFullAccessModalOpen(true);
            }}
            className="py-2.5 px-3.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-400/40 text-purple-200 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-98"
            title="Create Full Access key (* scope)"
          >
            <Zap className="w-3.5 h-3.5 text-purple-300" />
            <span>Create FULL ACCESS key</span>
          </button>

          {/* Standard Create Key Button */}
          <button
            onClick={() => {
              setNewlyCreatedKey(null);
              setKeyName('');
              setSelectedScopes([...PRESET_CONTENT_EDITOR]);
              setActivePreset('content');
              setIsModalOpen(true);
            }}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-2 transition-transform active:scale-98 shadow-[0_0_15px_rgba(25,217,255,0.3)] shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Scoped Key</span>
          </button>
        </div>
      </div>

      {/* Newly Created Key Alert Modal with Connector Snippets */}
      {newlyCreatedKey && (
        <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-cyan-950/70 via-blue-950/50 to-slate-950 border-2 border-cyan-400/60 shadow-[0_0_40px_rgba(25,217,255,0.25)] relative space-y-4">
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
            <div className="space-y-1 flex-1">
              <h3 className="text-sm font-bold text-white">
                API Key Created: {newlyCreatedKey.name}
              </h3>
              <p className="text-xs text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>Save this token now. For security, this raw secret token cannot be shown again.</span>
              </p>
            </div>
          </div>

          {/* Raw token display */}
          <div className="flex items-center gap-2 pt-1 max-w-2xl">
            <input
              type="text"
              readOnly
              value={newlyCreatedKey.token}
              className="flex-1 px-3.5 py-2.5 rounded-lg bg-slate-950 border border-cyan-500/40 text-cyan-200 text-xs font-mono select-all focus:outline-none"
            />
            <button
              onClick={() => handleCopy(newlyCreatedKey.token)}
              className="py-2.5 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
            >
              {copiedToken ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToken ? 'Copied!' : 'Copy Token'}</span>
            </button>
          </div>

          {/* Machine Integration Snippets */}
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300 font-mono">
              Ready-to-Use Agent Connector Snippets
            </h4>

            {/* 1. Claude Code CLI */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span className="font-semibold text-slate-200">1. Claude Code CLI Command</span>
                <button
                  onClick={() => {
                    const text = `claude mcp add --transport http coreiq-site ${effectiveBase}/mcp --header 'Authorization: Bearer ${newlyCreatedKey.token}'`;
                    handleCopy(text, 'claude_code');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  {copiedSnippet === 'claude_code' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet === 'claude_code' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto select-all">
                {`claude mcp add --transport http coreiq-site ${effectiveBase}/mcp --header 'Authorization: Bearer ${newlyCreatedKey.token}'`}
              </pre>
            </div>

            {/* 2. Generic MCP JSON Config */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span className="font-semibold text-slate-200">2. Generic JSON Config (Claude Desktop / Cursor)</span>
                <button
                  onClick={() => {
                    const json = JSON.stringify({
                      mcpServers: {
                        'coreiq-site': {
                          url: `${effectiveBase}/mcp`,
                          headers: {
                            Authorization: `Bearer ${newlyCreatedKey.token}`,
                          },
                        },
                      },
                    }, null, 2);
                    handleCopy(json, 'json_config');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  {copiedSnippet === 'json_config' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet === 'json_config' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-200 overflow-x-auto select-all">
{JSON.stringify({
  mcpServers: {
    'coreiq-site': {
      url: `${effectiveBase}/mcp`,
      headers: {
        Authorization: `Bearer ${newlyCreatedKey.token}`,
      },
    },
  },
}, null, 2)}
              </pre>
            </div>

            {/* 3. Claude.ai Secret Connector URL */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-300">
                <span className="font-semibold text-slate-200">3. Claude.ai Connector URL (Secret Token in Path)</span>
                <button
                  onClick={() => {
                    const url = `${effectiveBase}/mcp/k/${newlyCreatedKey.token}`;
                    handleCopy(url, 'claude_url');
                  }}
                  className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                >
                  {copiedSnippet === 'claude_url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSnippet === 'claude_url' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-cyan-300 overflow-x-auto select-all">
                {`${effectiveBase}/mcp/k/${newlyCreatedKey.token}`}
              </pre>
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
              Click &quot;Generate Scoped Key&quot; or &quot;Create FULL ACCESS key&quot; above to grant external AI swarms access to CoreIQ.
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
                        className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          s === '*' || s === 'ADMIN'
                            ? 'bg-purple-950 text-purple-300 border-purple-500/40 font-bold'
                            : s.startsWith('WRITE_')
                            ? 'bg-amber-950/40 text-amber-300 border-amber-600/40'
                            : s.startsWith('PUBLISH_')
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40'
                            : 'bg-slate-900 text-cyan-300 border-slate-700/80'
                        }`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono pt-1">
                    <span>Created: {new Date(key.created_at).toLocaleDateString()}</span>
                    <span className="text-cyan-400 font-semibold">
                      Last used: {key.last_used_at ? new Date(key.last_used_at).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>

                {/* Actions: Edit Scopes, Revoke, Delete */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {!key.revoked && (
                    <button
                      onClick={() => handleOpenEditScopes(key)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit scopes</span>
                    </button>
                  )}

                  {!key.revoked ? (
                    <button
                      onClick={() => handleRevokeKey(key.id, key.name)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-semibold transition-colors"
                    >
                      Revoke
                    </button>
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
        {/* Left: Available REST Endpoints & Tools Surface Panel (Grouped with counts) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#060b1e] border border-slate-800/80 p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white font-display">Available REST Endpoints & Tools Surface</h3>
            </div>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {RESOURCE_REGISTRY_TOOLS.length} Machine Tools Active
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Every resource editable in Command is mapped directly to a scoped REST endpoint and native MCP tool.
          </p>

          {/* Grouped tools list */}
          <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1">
            {Object.entries(groupedTools).map(([groupKey, tools]) => {
              const groupMeta = (SCOPE_GROUPS as any)[groupKey] || { label: groupKey.toUpperCase(), description: '' };
              return (
                <div key={groupKey} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-cyan-400 border-b border-slate-800/60 pb-1">
                    <span>{groupMeta.label} ({tools.length})</span>
                    <span className="text-[10px] text-slate-400 font-mono font-normal">{groupMeta.description}</span>
                  </div>

                  <div className="space-y-1">
                    {tools.map((t) => (
                      <div
                        key={t.name}
                        className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {t.restRoute?.method && (
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              t.restRoute.method === 'GET'
                                ? 'bg-blue-500/20 text-blue-300'
                                : t.restRoute.method === 'POST'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : t.restRoute.method === 'PATCH'
                                ? 'bg-amber-500/20 text-amber-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}>
                              {t.restRoute.method}
                            </span>
                          )}
                          <span className="text-slate-200 truncate">{t.name}</span>
                        </div>
                        <span className={`text-[10px] font-bold shrink-0 ${
                          t.requiredScope === 'PUBLIC'
                            ? 'text-slate-400'
                            : t.requiredScope.startsWith('WRITE_')
                            ? 'text-amber-400'
                            : t.requiredScope.startsWith('PUBLISH_')
                            ? 'text-purple-400'
                            : 'text-cyan-400'
                        }`}>
                          {t.requiredScope}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Live API Test Console */}
        <div className="lg:col-span-5 rounded-2xl bg-[#060b1e] border border-slate-800/80 p-5 sm:p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-display">Live API Test Console</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Execute a live round-trip test against the gateway with selected credentials.
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
                <option value="/api/v1/ping">GET /api/v1/ping (Public Ping)</option>
                <option value="/api/v1/capabilities">GET /api/v1/capabilities (Capabilities)</option>
                <option value="/api/v1/tools">GET /api/v1/tools (Tools Registry)</option>
                <option value="/openapi.json">GET /openapi.json (OpenAPI 3.0 Spec)</option>
                <option value="/api/v1/content/health">GET /api/v1/content/health (READ_CONTENT)</option>
                <option value="/api/v1/admin/news">GET /api/v1/admin/news (READ_NEWS)</option>
                <option value="/api/v1/admin/use-cases">GET /api/v1/admin/use-cases (READ_USE_CASES)</option>
                <option value="/api/v1/store/apps">GET /api/v1/store/apps (READ_STORE)</option>
                <option value="/api/v1/media/slots">GET /api/v1/media/slots (READ_MEDIA)</option>
                <option value="/api/v1/site-tools">GET /api/v1/site-tools (READ_TOOLS)</option>
                <option value="/api/v1/platforms">GET /api/v1/platforms (READ_PLATFORMS)</option>
                <option value="/api/v1/swarm/messages">GET /api/v1/swarm/messages (READ_SWARM)</option>
                <option value="/api/v1/social/messages">GET /api/v1/social/messages (READ_SOCIAL)</option>
                <option value="/api/v1/analytics/summary">GET /api/v1/analytics/summary (READ_ANALYTICS)</option>
                <option value="/api/v1/leads">GET /api/v1/leads (READ_LEADS)</option>
                <option value="/api/v1/tasks">GET /api/v1/tasks (READ_TASKS)</option>
                <option value="/api/v1/clients">GET /api/v1/clients (READ_CLIENTS)</option>
                <option value="/api/v1/config">GET /api/v1/config (READ_CONFIG)</option>
                <option value="/api/v1/keys">GET /api/v1/keys (READ_KEYS)</option>
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

      {/* API Audit Log: Last 50 Write Operations */}
      <div className="rounded-2xl bg-[#060b1e] border border-slate-800/80 p-5 sm:p-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white font-display">API Audit Log (Last 50 Machine Writes)</h3>
          </div>
          <button
            onClick={loadAuditLogs}
            disabled={isLoadingAudit}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1"
          >
            <span>Refresh</span>
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 font-mono">
            No machine write actions recorded in audit log yet. All write requests authenticated by API key will appear here.
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60 font-mono text-xs">
            {auditLogs.map((log) => (
              <div key={log.id} className="py-2 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    log.method === 'POST' ? 'bg-emerald-500/20 text-emerald-300' :
                    log.method === 'PATCH' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                  }`}>
                    {log.method}
                  </span>
                  <span className="text-slate-300 truncate">{log.route}</span>
                  <span className="text-[10px] text-cyan-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                    {log.key_name}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-[11px] text-slate-400">
                  <span className={log.status >= 200 && log.status < 300 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    HTTP {log.status}
                  </span>
                  <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Modal: Create Full Access Key */}
      {isFullAccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050f]/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-md bg-[#060b1e] border border-purple-500/40 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(168,85,247,0.2)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white font-display">Create FULL ACCESS Key</h3>
              </div>
              <button onClick={() => setIsFullAccessModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This key will have wildcard <code className="text-purple-300 font-mono font-bold">*</code> scope, granting unrestricted read, write, and publishing capability across all CoreIQ resources.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGenerateKey(keyName, ['*']);
              }}
              className="space-y-4 pt-1"
            >
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                  Agent / Service Name
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Claude Code Sovereign, Orchestrator Prime"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-400 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFullAccessModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!keyName.trim()}
                  className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-98 disabled:opacity-50"
                >
                  <Zap className="w-4 h-4" />
                  <span>Issue Full Access Key</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scoped Key Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050f]/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#060b1e] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-[0_0_50px_rgba(25,217,255,0.15)] overflow-hidden my-6">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-display">Generate Agent API Key</h3>
                  <p className="text-[11px] text-slate-400">Scoped machine credentials for external AI systems</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleGenerateKey(keyName, selectedScopes); }} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Key Name / Agent Identifier
                </label>
                <input
                  type="text"
                  required
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="e.g. Content Autonomous Writer, News Scraper, Swarm Node"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              {/* Presets Selector */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Presets & Scopes ({selectedScopes.includes('*') ? 'All (*)' : `${selectedScopes.length} selected`})
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('full')}
                      className={`px-2 py-0.5 rounded transition-colors ${activePreset === 'full' ? 'bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30' : 'text-slate-400 hover:text-white'}`}
                    >
                      Full Access
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('read')}
                      className={`px-2 py-0.5 rounded transition-colors ${activePreset === 'read' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
                    >
                      Read-only
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => handleSelectPreset('content')}
                      className={`px-2 py-0.5 rounded transition-colors ${activePreset === 'content' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30' : 'text-slate-400 hover:text-white'}`}
                    >
                      Content editor
                    </button>
                  </div>
                </div>

                {/* Group Checkboxes */}
                <div className="flex items-center gap-1.5 flex-wrap py-1">
                  {Object.entries(SCOPE_GROUPS).map(([groupKey, groupMeta]) => {
                    const groupScopes = ALL_SCOPES.filter((s) => s.group === groupKey).map((s) => s.id);
                    const allSelected = groupScopes.every((s) => selectedScopes.includes(s));
                    return (
                      <button
                        type="button"
                        key={groupKey}
                        onClick={() => handleToggleGroup(groupKey)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono border transition-colors ${
                          allSelected
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {groupMeta.label}
                      </button>
                    );
                  })}
                </div>

                {/* Scopes Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                  {ALL_SCOPES.map((scope) => {
                    const isChecked = selectedScopes.includes('*') || selectedScopes.includes(scope.id);
                    return (
                      <label
                        key={scope.id}
                        className={`p-2 rounded-lg border flex items-start gap-2 cursor-pointer transition-colors ${
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
                  className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
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

      {/* Edit Scopes Modal (Operator session, confirmation step, secret never touched) */}
      {editingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050f]/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-lg bg-[#060b1e] border border-cyan-500/40 rounded-2xl p-5 sm:p-6 shadow-[0_0_50px_rgba(25,217,255,0.2)] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-base font-bold text-white font-display">Edit Key Scopes: {editingKey.name}</h3>
              </div>
              <button onClick={() => setEditingKey(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Modifying scopes updates authorizations immediately across all active agents. Secret token hash is never changed.
            </p>

            {!editConfirmStep ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                  <span>Assigned Scopes ({editScopesList.includes('*') ? 'All (*)' : editScopesList.length}):</span>
                  <button
                    type="button"
                    onClick={() => setEditScopesList(['*'])}
                    className="text-purple-400 hover:underline"
                  >
                    Grant Full Access (*)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                  {ALL_SCOPES.map((scope) => {
                    const isChecked = editScopesList.includes('*') || editScopesList.includes(scope.id);
                    return (
                      <label
                        key={scope.id}
                        className={`p-2 rounded-lg border flex items-start gap-2 cursor-pointer transition-colors ${
                          isChecked
                            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (editScopesList.includes('*')) {
                              setEditScopesList(ALL_SCOPES.filter((s) => s.id !== scope.id).map((s) => s.id));
                            } else if (editScopesList.includes(scope.id)) {
                              setEditScopesList(editScopesList.filter((s) => s !== scope.id));
                            } else {
                              setEditScopesList([...editScopesList, scope.id]);
                            }
                          }}
                          className="mt-0.5 rounded border-slate-700 text-cyan-500 focus:ring-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold font-mono leading-tight">{scope.id}</p>
                          <p className="text-[10px] text-slate-400 leading-tight">{scope.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingKey(null)}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditConfirmStep(true)}
                    className="py-2.5 px-5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs"
                  >
                    Review & Confirm
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-2">
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Confirm Scope Changes</span>
                  </p>
                  <p className="text-[11px] text-amber-300">
                    You are updating authorizations for &quot;{editingKey.name}&quot; to {editScopesList.includes('*') ? 'FULL ACCESS (*)' : `${editScopesList.length} scopes`}.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditConfirmStep(false)}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    disabled={isSavingEdit}
                    onClick={handleSaveEditedScopes}
                    className="py-2.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5"
                  >
                    {isSavingEdit ? (
                      <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    <span>Save Scopes</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
