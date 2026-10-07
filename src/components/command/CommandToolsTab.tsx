import React, { useState } from 'react';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Check, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Sparkles, 
  Link as LinkIcon, 
  X,
  ExternalLink,
  Zap,
  Layers
} from 'lucide-react';
import { AgentToolConnection, ToolStatus } from '../../types/command';
import { CoreIQData } from '../../services/supabase';

interface CommandToolsTabProps {
  tools: AgentToolConnection[];
  onRefresh: () => void;
}

export const CommandToolsTab: React.FC<CommandToolsTabProps> = ({
  tools,
  onRefresh,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  // Form state
  const [toolName, setToolName] = useState('');
  const [toolProvider, setToolProvider] = useState('');
  const [toolKey, setToolKey] = useState('');
  const [toolEndpoint, setToolEndpoint] = useState('');
  const [toolStatus, setToolStatus] = useState<ToolStatus>('connected');
  const [toolNotes, setToolNotes] = useState('');

  const toggleKey = (id: string) => {
    setRevealedKeys((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!toolName.trim() || !toolProvider.trim()) return;

    await CoreIQData.insertAgentTool({
      tool_name: toolName.trim(),
      provider: toolProvider.trim(),
      api_key: toolKey.trim(),
      endpoint_url: toolEndpoint.trim() || undefined,
      status: toolStatus,
      notes: toolNotes.trim() || undefined,
    });

    setShowAddModal(false);
    setToolName('');
    setToolProvider('');
    setToolKey('');
    setToolEndpoint('');
    setToolNotes('');
    onRefresh();
  };

  const handleDeleteTool = async (id: string) => {
    await CoreIQData.deleteAgentTool(id);
    onRefresh();
  };

  const handleStatusToggle = async (tool: AgentToolConnection) => {
    const next: Record<ToolStatus, ToolStatus> = {
      connected: 'not_connected',
      not_connected: 'connected',
      error: 'connected',
    };
    await CoreIQData.updateAgentTool(tool.id, { status: next[tool.status] });
    onRefresh();
  };

  // Seed default tool recommendations if empty
  const handleSeedDefaults = async () => {
    const defaults: Omit<AgentToolConnection, 'id' | 'created_at'>[] = [
      {
        tool_name: 'Image Generation (FLUX / SDXL)',
        provider: 'Together.ai / Pollinations (Free-Tier)',
        api_key: '',
        endpoint_url: 'https://api.together.xyz/v1/images/generations',
        status: 'not_connected',
        notes: 'Called invisibly when visitors request image assets. Visitor sees only native CoreIQ output.',
      },
      {
        tool_name: 'Voice AI & Speech Synthesis',
        provider: 'ElevenLabs / EdgeTTS',
        api_key: '',
        endpoint_url: 'https://api.elevenlabs.io/v1/text-to-speech',
        status: 'not_connected',
        notes: 'Synthesizes spoken audio models and inbound phone voice demonstrations.',
      },
      {
        tool_name: 'Live Web Grounding & Research',
        provider: 'Tavily / Serper API',
        api_key: '',
        endpoint_url: 'https://api.tavily.com/search',
        status: 'not_connected',
        notes: 'Enables CoreIQ to look up real-time documentation and vendor specs dynamically.',
      },
    ];

    for (const d of defaults) {
      await CoreIQData.insertAgentTool(d);
    }
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#060b1c]/90 border border-slate-800/80">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-cyan-400" />
            <span>Invisible External Capability Providers</span>
          </h2>
          <p className="text-xs text-slate-400">
            Tools called invisibly on the visitor's behalf. Visitors experience these as CoreIQ's native power, never a 3rd party handoff.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {tools.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Seed Recommended Tools
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-98 shadow-[0_0_15px_rgba(25,217,255,0.25)] min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Register New Tool</span>
          </button>
        </div>
      </div>

      {/* Tool Connections List */}
      {tools.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#060b1c]/60 border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No External Tools Connected</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Add image generation, voice AI, code sandboxes, or search grounding APIs that CoreIQ can execute autonomously.
          </p>
          <div className="flex justify-center gap-2">
            <button
              onClick={handleSeedDefaults}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold"
            >
              Load Standard Presets
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
            >
              Add Custom Tool
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {tools.map((tool) => {
            const isRevealed = revealedKeys[tool.id];

            return (
              <div
                key={tool.id}
                className="p-4 rounded-2xl border border-slate-800 bg-[#060b1e] hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white leading-snug">{tool.tool_name}</h4>
                      <p className="text-xs text-cyan-400 font-mono">{tool.provider}</p>
                    </div>

                    <button
                      onClick={() => handleStatusToggle(tool)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold uppercase flex items-center gap-1.5 transition-colors ${
                        tool.status === 'connected'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : tool.status === 'error'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                      title="Tap to toggle tool connection status"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          tool.status === 'connected'
                            ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                            : tool.status === 'error'
                            ? 'bg-rose-400'
                            : 'bg-slate-500'
                        }`}
                      />
                      <span>{tool.status.replace('_', ' ')}</span>
                    </button>
                  </div>

                  {tool.notes && (
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                      {tool.notes}
                    </p>
                  )}

                  {tool.endpoint_url && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono truncate">
                      <LinkIcon className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{tool.endpoint_url}</span>
                    </div>
                  )}

                  {/* Masked API Key field */}
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                      <span>API Credentials:</span>
                      <button
                        onClick={() => toggleKey(tool.id)}
                        className="text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{isRevealed ? 'Hide' : 'Reveal'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-slate-300 truncate">
                      {tool.api_key
                        ? isRevealed
                          ? tool.api_key
                          : '••••••••••••••••••••••••'
                        : '(No credential configured)'}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500">
                    Added {new Date(tool.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDeleteTool(tool.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                    title="Remove tool"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Tool Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050f]/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#060b1c] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Register External Tool</h3>
              <button onClick={() => setShowAddModal(false)} aria-label="Close modal" className="p-1 text-slate-400 hover:text-white cursor-pointer">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddTool} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Tool Capability Name *</label>
                <input
                  type="text"
                  required
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  placeholder="e.g. Image Generation (FLUX.1 Schnell)"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Provider / Engine *</label>
                <input
                  type="text"
                  required
                  value={toolProvider}
                  onChange={(e) => setToolProvider(e.target.value)}
                  placeholder="e.g. Together.ai / Replicate / Fal.ai"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">API Key / Token (Masked)</label>
                <input
                  type="password"
                  value={toolKey}
                  onChange={(e) => setToolKey(e.target.value)}
                  placeholder="API Secret Key"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Endpoint URL (Optional)</label>
                <input
                  type="url"
                  value={toolEndpoint}
                  onChange={(e) => setToolEndpoint(e.target.value)}
                  placeholder="https://api.provider.com/v1/..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Execution Purpose / Notes</label>
                <textarea
                  rows={2}
                  value={toolNotes}
                  onChange={(e) => setToolNotes(e.target.value)}
                  placeholder="How CoreIQ uses this capability without third-party branding..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
                >
                  Connect Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
