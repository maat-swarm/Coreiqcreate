import React, { useState } from 'react';
import { 
  Globe, 
  Plus, 
  ExternalLink, 
  Copy, 
  Check, 
  Trash2, 
  Share2, 
  Briefcase, 
  Rocket, 
  X,
  Layers
} from 'lucide-react';
import { PlatformRegistryItem, PlatformCategory } from '../../types/command';
import { CoreIQData } from '../../services/supabase';

interface CommandPlatformsTabProps {
  platforms: PlatformRegistryItem[];
  onRefresh: () => void;
}

export const CommandPlatformsTab: React.FC<CommandPlatformsTabProps> = ({
  platforms,
  onRefresh,
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | PlatformCategory>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [platName, setPlatName] = useState('');
  const [platCategory, setPlatCategory] = useState<PlatformCategory>('deployment');
  const [platUrl, setPlatUrl] = useState('');
  const [platNotes, setPlatNotes] = useState('');

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddPlatform = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platName.trim() || !platUrl.trim()) return;

    await CoreIQData.insertPlatform({
      name: platName.trim(),
      category: platCategory,
      url: platUrl.trim(),
      notes: platNotes.trim() || undefined,
    });

    setShowAddModal(false);
    setPlatName('');
    setPlatUrl('');
    setPlatNotes('');
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    await CoreIQData.deletePlatform(id);
    onRefresh();
  };

  const handleSeedDefaults = async () => {
    const defaults: Omit<PlatformRegistryItem, 'id' | 'created_at'>[] = [
      {
        name: 'CoreIQ Public Website',
        category: 'deployment',
        url: window.location.origin,
        notes: 'Primary visitor facing surface & client discovery intake.',
      },
      {
        name: 'Instagram (@coreiq.create)',
        category: 'social',
        url: 'https://instagram.com/coreiq.create',
        notes: 'Visual showcase for AI workflows, prompts, and architecture.',
      },
      {
        name: 'LinkedIn Company Page',
        category: 'social',
        url: 'https://linkedin.com/company/coreiq-create',
        notes: 'B2B enterprise automation and client case studies.',
      },
      {
        name: 'Upwork Agency Profile',
        category: 'freelance',
        url: 'https://upwork.com',
        notes: 'Top-rated enterprise automation and custom AI engineering.',
      },
      {
        name: 'Contra Independent Profile',
        category: 'freelance',
        url: 'https://contra.com',
        notes: 'Commission-free client contracts and project milestones.',
      },
    ];

    for (const d of defaults) {
      await CoreIQData.insertPlatform(d);
    }
    onRefresh();
  };

  const filtered = platforms.filter((p) => {
    if (activeCategory === 'all') return true;
    return p.category === activeCategory;
  });

  return (
    <div className="space-y-4">
      {/* Top Header & Category Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#060b1c]/90 border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Platforms ({platforms.length})
            </button>
            <button
              onClick={() => setActiveCategory('deployment')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeCategory === 'deployment'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Rocket className="w-3.5 h-3.5 text-cyan-400" />
              <span>Deployments</span>
            </button>
            <button
              onClick={() => setActiveCategory('social')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeCategory === 'social'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Social Media</span>
            </button>
            <button
              onClick={() => setActiveCategory('freelance')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                activeCategory === 'freelance'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              <span>Freelance & Marketplaces</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {platforms.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Seed Default Platforms
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-98 shadow-[0_0_15px_rgba(25,217,255,0.25)] min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Register Platform</span>
          </button>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#060b1c]/60 border border-slate-800/80 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
            <Globe className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Platforms Registered</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Keep track of live URLs, social handles, freelance marketplace profiles, and deploy targets.
          </p>
          <button
            onClick={handleSeedDefaults}
            className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
          >
            Load Standard Platforms
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-2xl border border-slate-800 bg-[#060b1e] hover:border-slate-700 transition-all space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono uppercase font-bold ${
                      item.category === 'deployment'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                        : item.category === 'social'
                        ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        : item.category === 'freelance'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}
                  >
                    {item.category}
                  </span>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                    title="Delete platform"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug">{item.name}</h4>

                {item.notes && (
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {item.notes}
                  </p>
                )}

                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300 font-mono">
                  <span className="truncate pr-2">{item.url}</span>
                  <button
                    onClick={() => handleCopy(item.id, item.url)}
                    className="p-1 text-slate-400 hover:text-cyan-300 transition-colors shrink-0"
                    title="Copy URL"
                  >
                    {copiedId === item.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[10px] font-mono text-slate-500">
                  Added {new Date(item.created_at).toLocaleDateString()}
                </span>

                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <span>Visit Surface</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Platform Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050f]/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#060b1c] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Register Platform Surface</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPlatform} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Platform Name *</label>
                <input
                  type="text"
                  required
                  value={platName}
                  onChange={(e) => setPlatName(e.target.value)}
                  placeholder="e.g. Upwork Agency / YouTube Channel"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Category</label>
                <select
                  value={platCategory}
                  onChange={(e) => setPlatCategory(e.target.value as PlatformCategory)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="deployment">Live Deployment</option>
                  <option value="social">Social Media</option>
                  <option value="freelance">Freelance / Marketplace</option>
                  <option value="other">Other Surface</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">URL *</label>
                <input
                  type="url"
                  required
                  value={platUrl}
                  onChange={(e) => setPlatUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Notes / Credentials / Handle</label>
                <textarea
                  rows={2}
                  value={platNotes}
                  onChange={(e) => setPlatNotes(e.target.value)}
                  placeholder="Handle, account email, status, or posting schedule..."
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
                  Save Platform
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
