import React, { useState, useMemo } from 'react';
import { 
  FolderKanban, 
  Image as ImageIcon, 
  Type, 
  Save, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  ExternalLink, 
  RotateCcw,
  Sparkles,
  X,
  Activity,
  RefreshCw
} from 'lucide-react';
import { ContentItem } from '../../types/command';
import { CoreIQData } from '../../services/supabase';
import { evaluateContentHealth } from '../../data/contentManifest';
import { seedManifestPlaceholders } from '../../services/contentResolver';

interface CommandContentTabProps {
  contentItems: ContentItem[];
  onRefresh: () => void;
}

export const CommandContentTab: React.FC<CommandContentTabProps> = ({
  contentItems,
  onRefresh,
}) => {
  const [subTab, setSubTab] = useState<'copy' | 'media'>('copy');
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // New Media / Content Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItemKey, setNewItemKey] = useState('');
  const [newItemType, setNewItemType] = useState<'text' | 'image' | 'json'>('image');
  const [newItemValue, setNewItemValue] = useState('');

  const handleTextChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveItem = async (key: string, type: 'text' | 'image' | 'json') => {
    const valueToSave = editedValues[key] ?? contentItems.find((c) => c.key === key)?.value ?? '';
    await CoreIQData.saveContentItem(key, valueToSave, type);
    
    setSaveStatus((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setSaveStatus((prev) => ({ ...prev, [key]: false }));
    }, 2500);

    onRefresh();
  };

  const handleDeleteItem = async (key: string) => {
    await CoreIQData.deleteContentItem(key);
    onRefresh();
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemKey.trim() || !newItemValue.trim()) return;

    await CoreIQData.saveContentItem(newItemKey.trim(), newItemValue.trim(), newItemType);
    setShowAddModal(false);
    setNewItemKey('');
    setNewItemValue('');
    onRefresh();
  };

  const handleCopyUrl = (key: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyItems = contentItems.filter((c) => c.type === 'text');
  const mediaItems = contentItems.filter((c) => c.type === 'image');

  const health = useMemo(() => evaluateContentHealth(contentItems), [contentItems]);
  const [seeding, setSeeding] = useState(false);

  const handleSyncManifest = async () => {
    setSeeding(true);
    try {
      await seedManifestPlaceholders();
      onRefresh();
    } finally {
      setSeeding(false);
    }
  };

  // Seed default copy presets if empty
  const handleSeedDefaults = async () => {
    const defaults = [
      {
        key: 'hero.headline',
        value: 'Autonomous AI Systems & Intelligent Creation',
        type: 'text' as const,
      },
      {
        key: 'hero.subheadline',
        value: 'CoreIQ designs, automates, and orchestrates custom AI agents, voice assistants, and full-spectrum digital infrastructure.',
        type: 'text' as const,
      },
      {
        key: 'ask.welcome',
        value: 'Tell CoreIQ what you are trying to accomplish. We will help you figure out what to build.',
        type: 'text' as const,
      },
      {
        key: 'capabilities.headline',
        value: 'The CoreIQ Autonomous Ecosystem',
        type: 'text' as const,
      },
      {
        key: 'media.core_phoenix',
        value: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
        type: 'image' as const,
      },
      {
        key: 'media.system_grid',
        value: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1200&q=80',
        type: 'image' as const,
      },
    ];

    for (const d of defaults) {
      await CoreIQData.saveContentItem(d.key, d.value, d.type);
    }
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Dynamic Content Manifest Health Summary Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#030717]/90 border border-slate-800/90 font-mono text-xs shadow-inner">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest">
              MANIFEST HEALTH
            </span>
            <span className="text-[10px] text-cyan-400/80 px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              6 Pages
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Total */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <span className="text-[10px] text-slate-500 uppercase">Total</span>
            <span className="font-bold text-slate-200">{health.total}</span>
          </div>

          {/* Published */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400">
            <span className="text-[10px] text-emerald-500/80 uppercase">Published</span>
            <span className="font-bold">{health.published}</span>
          </div>

          {/* Placeholder */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-400">
            <span className="text-[10px] text-cyan-500/80 uppercase">Placeholder</span>
            <span className="font-bold">{health.placeholder}</span>
          </div>

          {/* Missing */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-400">
            <span className="text-[10px] text-amber-500/80 uppercase">Missing</span>
            <span className="font-bold">{health.missing}</span>
          </div>

          {/* Stale */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-400">
            <span className="text-[10px] text-rose-500/80 uppercase">Stale</span>
            <span className="font-bold">{health.stale}</span>
          </div>

          {/* Sync / Seed button */}
          <button
            onClick={handleSyncManifest}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors disabled:opacity-50 cursor-pointer"
            title="Seed missing manifest placeholders in local store / DB"
          >
            <RefreshCw className={`w-3 h-3 ${seeding ? 'animate-spin' : ''}`} />
            <span className="text-[10px] uppercase font-bold tracking-wider">
              {seeding ? 'Syncing...' : 'Sync Manifest'}
            </span>
          </button>
        </div>
      </div>

      {/* Top Header & Sub-tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#060b1c]/90 border border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setSubTab('copy')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                subTab === 'copy'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Website Copy & Headlines ({copyItems.length})</span>
            </button>
            <button
              onClick={() => setSubTab('media')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                subTab === 'media'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Media Library ({mediaItems.length})</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {contentItems.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Load Default Content
            </button>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-transform active:scale-98 shadow-[0_0_15px_rgba(25,217,255,0.25)] min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Add {subTab === 'copy' ? 'Copy String' : 'Media Asset'}</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: WEBSITE COPY */}
      {subTab === 'copy' && (
        <div className="space-y-3.5">
          {copyItems.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#060b1c]/60 border border-slate-800/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <Type className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">No Custom Copy Overrides</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                The public website is currently displaying standard hardcoded defaults. Add overrides here to update live headlines without rebuilding.
              </p>
              <button
                onClick={handleSeedDefaults}
                className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
              >
                Seed Website Headlines
              </button>
            </div>
          ) : (
            copyItems.map((item) => {
              const currentVal = editedValues[item.key] !== undefined ? editedValues[item.key] : item.value;
              const isSaved = saveStatus[item.key];

              return (
                <div
                  key={item.key}
                  className="p-4 rounded-2xl border border-slate-800 bg-[#060b1e] space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-cyan-400">
                      {item.key}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleDeleteItem(item.key)}
                        className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                        title="Delete key override"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={currentVal.length > 80 ? 3 : 2}
                    value={currentVal}
                    onChange={(e) => handleTextChange(item.key, e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white focus:outline-none focus:border-cyan-400 leading-relaxed font-sans"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono text-slate-500">
                      Last modified {new Date(item.updated_at || item.created_at || Date.now()).toLocaleString()}
                    </span>

                    <button
                      onClick={() => handleSaveItem(item.key, 'text')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isSaved
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(25,217,255,0.2)]'
                      }`}
                    >
                      {isSaved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                      <span>{isSaved ? 'Published to Site!' : 'Publish Override'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* SUB-VIEW 2: MEDIA LIBRARY */}
      {subTab === 'media' && (
        <div>
          {mediaItems.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[#060b1c]/60 border border-slate-800/80 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">Media Library Empty</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Register public image URLs, hero visuals, and diagrams for CoreIQ Create.
              </p>
              <button
                onClick={handleSeedDefaults}
                className="mt-2 px-4 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/30 text-cyan-300 text-xs font-semibold"
              >
                Load Default Assets
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {mediaItems.map((media) => (
                <div
                  key={media.key}
                  className="p-3.5 rounded-2xl border border-slate-800 bg-[#060b1e] space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative group">
                      <img
                        src={media.value}
                        alt={media.key}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <a
                        href={media.value}
                        target="_blank"
                        rel="noreferrer"
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-950/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Open image in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-mono font-bold text-cyan-400 block truncate">
                        {media.key}
                      </span>
                      <p className="text-[11px] font-mono text-slate-400 truncate">
                        {media.value}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <button
                      onClick={() => handleCopyUrl(media.key, media.value)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
                    >
                      {copiedKey === media.key ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedKey === media.key ? 'Copied' : 'Copy URL'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteItem(media.key)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#02050f]/85 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#060b1c] border border-cyan-500/30 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Add {newItemType === 'text' ? 'Website Copy' : 'Media Asset'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-3.5 text-xs">
              <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setNewItemType('text')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    newItemType === 'text' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  Copy / Text
                </button>
                <button
                  type="button"
                  onClick={() => setNewItemType('image')}
                  className={`flex-1 py-1.5 rounded-lg font-medium transition-all ${
                    newItemType === 'image' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  Image Asset
                </button>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Content Key Identifier *
                </label>
                <input
                  type="text"
                  required
                  value={newItemKey}
                  onChange={(e) => setNewItemKey(e.target.value)}
                  placeholder={newItemType === 'text' ? 'e.g. hero.headline' : 'e.g. media.core_phoenix'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  {newItemType === 'text' ? 'Content String Value *' : 'Image Public URL *'}
                </label>
                <textarea
                  rows={newItemType === 'text' ? 4 : 2}
                  required
                  value={newItemValue}
                  onChange={(e) => setNewItemValue(e.target.value)}
                  placeholder={
                    newItemType === 'text'
                      ? 'Text rendered on the live website...'
                      : 'https://images.unsplash.com/...'
                  }
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
                  Publish Content
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
