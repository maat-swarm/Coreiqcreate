import React, { useState, useEffect } from 'react';
import { 
  Download, 
  FileText, 
  ArrowDown, 
  Sparkles, 
  Building2, 
  User, 
  Users, 
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { UseCase, UseCaseCategory, UseCaseAudience } from '../types/useCases';
import { NavRoute } from '../types';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';

interface UseCasesPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

const CATEGORIES: { slug: string; label: string }[] = [
  { slug: 'all', label: 'All' },
  { slug: 'ai-agents', label: 'AI Agents' },
  { slug: 'automation', label: 'Automation' },
  { slug: 'apps', label: 'Apps' },
  { slug: 'voice-ai', label: 'Voice AI' },
  { slug: 'integrations', label: 'Integrations' },
];

const AUDIENCE_FILTERS: { value: 'all' | UseCaseAudience; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'personal', label: 'Personal' },
  { value: 'business', label: 'Business' },
];

export const UseCasesPage: React.FC<UseCasesPageProps> = ({ onNavigate, onAsk }) => {
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedAudience, setSelectedAudience] = useState<'all' | UseCaseAudience>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function loadUseCases() {
      try {
        setIsLoading(true);
        setError(null);
        const res = await fetch('/api/v1/use-cases');
        if (!res.ok) throw new Error('Failed to load use cases');
        const data = await res.json();
        if (mounted) {
          setUseCases(data.use_cases || []);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Error loading use cases');
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    }
    loadUseCases();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDownload = async (useCaseId: string, file: { id: string; filename: string }) => {
    try {
      setDownloadingFileId(file.id);
      const res = await fetch(`/api/v1/use-cases/${useCaseId}/files/${file.id}/download`);
      if (!res.ok) throw new Error('Download request failed');
      const data = await res.json();
      if (data.download_url) {
        const link = document.createElement('a');
        link.href = data.download_url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.download = file.filename || 'download';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (e) {
      console.error('File download error:', e);
    } finally {
      setDownloadingFileId(null);
    }
  };

  const filteredUseCases = useCases.filter((uc) => {
    if (selectedCategory !== 'all' && uc.category_slug !== selectedCategory) {
      return false;
    }
    if (selectedAudience !== 'all') {
      if (uc.audience !== 'both' && uc.audience !== selectedAudience) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="w-full relative pb-24">
      {/* 1. HERO SECTION */}
      <section className="relative pt-10 pb-12 lg:pt-16 lg:pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl space-y-6">
            <span className="text-xs tracking-[0.3em] text-cyan-400 uppercase font-semibold block">
              CAPABILITIES / COREIQ
            </span>

            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display leading-[1.05]">
              Real problems. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500">
                Real solutions.
              </span>
            </h1>

            <p className="text-slate-300 text-base sm:text-lg lg:text-xl leading-relaxed">
              Discover how Core IQ is applied across industries — for individuals and businesses alike.
            </p>

            <div className="pt-2 max-w-xl">
              <AskCoreIQBar
                placeholder="Ask CoreIQ about a use case or workflow..."
                onAsk={onAsk}
              />
            </div>
          </div>

          {/* FILTER ROW 1: Audience */}
          <div className="mt-12 flex flex-col sm:flex-row sm:items-center gap-4 border-t border-slate-800/80 pt-8">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              <span>Audience:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {AUDIENCE_FILTERS.map((aud) => (
                <button
                  key={aud.value}
                  onClick={() => setSelectedAudience(aud.value)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 select-none cursor-pointer ${
                    selectedAudience === aud.value
                      ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(25,217,255,0.4)]'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {aud.label}
                </button>
              ))}
            </div>
          </div>

          {/* FILTER ROW 2: Categories */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Category:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => setSelectedCategory(cat.slug)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 select-none cursor-pointer ${
                    selectedCategory === cat.slug
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/60 shadow-[0_0_15px_rgba(25,217,255,0.2)]'
                      : 'bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. CARD GRID SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-96 rounded-2xl bg-slate-900/40 border border-slate-800/80 animate-pulse p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-full h-44 rounded-xl bg-slate-800/60" />
                  <div className="h-4 bg-slate-800/60 rounded w-1/3" />
                  <div className="h-6 bg-slate-800/60 rounded w-3/4" />
                  <div className="h-4 bg-slate-800/40 rounded w-full" />
                </div>
                <div className="h-9 bg-slate-800/60 rounded-lg w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-red-500/20 p-8">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
            <p className="text-slate-300 text-sm">{error}</p>
          </div>
        ) : filteredUseCases.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800/80 p-8 max-w-xl mx-auto space-y-3">
            <Sparkles className="w-8 h-8 text-cyan-400 mx-auto opacity-70" />
            <h3 className="text-lg font-bold text-white font-display">No published use cases found</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              We are currently preparing published use cases for this filter. Check back shortly or ask CoreIQ directly to construct a solution.
            </p>
            <div className="pt-2">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedAudience('all');
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition-colors"
              >
                Reset Filters
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredUseCases.map((uc) => {
              const files = uc.files || [];
              const categoryLabel = CATEGORIES.find((c) => c.slug === uc.category_slug)?.label || uc.category_slug;

              return (
                <div
                  key={uc.id}
                  className="group rounded-2xl bg-[#070d1f]/80 border border-slate-800/90 hover:border-cyan-500/40 p-5 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,180,255,0.12)] relative overflow-hidden"
                >
                  {/* Card Visual / Thumbnail */}
                  <div className="space-y-4">
                    <div className="w-full aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                      {uc.image_url ? (
                        <img
                          src={uc.image_url}
                          alt={uc.image_alt || uc.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-[#060c20] to-[#040817] p-4 text-center">
                          <span className="text-[11px] font-mono font-bold tracking-widest text-cyan-400 uppercase mb-1">
                            {categoryLabel}
                          </span>
                          <span className="text-xs text-slate-500">Core IQ Verified Case</span>
                        </div>
                      )}
                    </div>

                    {/* Badges & Tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                        {categoryLabel}
                      </span>
                      <span className="text-[10px] font-semibold capitalize text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700/60 flex items-center gap-1">
                        {uc.audience === 'personal' && <User className="w-2.5 h-2.5 text-sky-400" />}
                        {uc.audience === 'business' && <Building2 className="w-2.5 h-2.5 text-cyan-400" />}
                        {uc.audience === 'both' && <Users className="w-2.5 h-2.5 text-emerald-400" />}
                        <span>{uc.audience}</span>
                      </span>
                      {uc.industry_tags && uc.industry_tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Title & Problem */}
                    <div>
                      <h3 className="text-lg font-bold text-white font-display leading-snug group-hover:text-cyan-200 transition-colors">
                        {uc.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {uc.problem}
                      </p>
                    </div>
                  </div>

                  {/* Actions: View details + Files */}
                  <div className="mt-6 pt-4 border-t border-slate-800/70 space-y-3">
                    <div className="flex items-center justify-between">
                      <a
                        href={`#${uc.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          const el = document.getElementById(uc.id);
                          el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors group-hover:translate-x-0.5"
                      >
                        <span>View details</span>
                        <ArrowDown className="w-3 h-3" />
                      </a>
                    </div>

                    {/* File Download Buttons */}
                    <div className="space-y-1.5">
                      {files.length > 0 ? (
                        files.map((file) => (
                          <button
                            key={file.id}
                            disabled={downloadingFileId === file.id}
                            onClick={() => handleDownload(uc.id, file)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer disabled:opacity-60"
                          >
                            <span className="flex items-center gap-2 truncate pr-2">
                              <FileText className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                              <span className="truncate">{file.label || file.filename}</span>
                            </span>
                            {downloadingFileId === file.id ? (
                              <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                            ) : (
                              <Download className="w-3.5 h-3.5 text-slate-400 hover:text-cyan-300 shrink-0" />
                            )}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 rounded-lg text-[11px] font-medium text-slate-500 bg-slate-950/60 border border-slate-900 flex items-center justify-between select-none">
                          <span className="flex items-center gap-2">
                            <FileText className="w-3.5 h-3.5 opacity-40" />
                            <span>Files coming soon</span>
                          </span>
                          <Download className="w-3.5 h-3.5 opacity-30" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. DETAIL SECTIONS STACKED BELOW GRID */}
      {filteredUseCases.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-24 space-y-20">
          <div className="border-t border-slate-800/80 pt-16">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase block mb-2">
              DEEP DIVE SPECIFICATIONS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
              Comprehensive Architectural Breakdowns
            </h2>
          </div>

          {filteredUseCases.map((uc) => {
            const files = uc.files || [];
            const categoryLabel = CATEGORIES.find((c) => c.slug === uc.category_slug)?.label || uc.category_slug;

            return (
              <div
                key={`detail-${uc.id}`}
                id={uc.id}
                className="scroll-mt-24 rounded-3xl bg-[#050a19]/90 border border-slate-800/90 p-6 sm:p-8 lg:p-10 shadow-2xl relative overflow-hidden"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  {/* Left Column: Image & Download Assets (40% desktop) */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative">
                      {uc.image_url ? (
                        <img
                          src={uc.image_url}
                          alt={uc.image_alt || uc.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-[#070e24] p-6 text-center">
                          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase mb-2">
                            {categoryLabel}
                          </span>
                          <span className="text-sm font-semibold text-slate-300">
                            {uc.title}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Files Section in Detail */}
                    <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-300 tracking-wide">
                          Downloadable Assets & Specs
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 font-bold">
                          {files.length} {files.length === 1 ? 'FILE' : 'FILES'}
                        </span>
                      </div>

                      <div className="space-y-2">
                        {files.length > 0 ? (
                          files.map((file) => (
                            <button
                              key={`detail-file-${file.id}`}
                              disabled={downloadingFileId === file.id}
                              onClick={() => handleDownload(uc.id, file)}
                              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800/90 text-slate-200 hover:text-white border border-slate-800 hover:border-cyan-500/40 transition-colors cursor-pointer disabled:opacity-60"
                            >
                              <span className="flex items-center gap-2 truncate pr-2">
                                <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                                <span className="truncate">{file.label || file.filename}</span>
                              </span>
                              {downloadingFileId === file.id ? (
                                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
                              ) : (
                                <Download className="w-4 h-4 text-cyan-400 shrink-0" />
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2.5 rounded-lg text-xs font-medium text-slate-500 bg-slate-900/40 border border-slate-900 flex items-center justify-between select-none">
                            <span>No downloadable documents attached yet</span>
                            <Download className="w-4 h-4 opacity-30" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: 3 Specification Blocks (60% desktop) */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold tracking-wider uppercase text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/50">
                        {categoryLabel}
                      </span>
                      <span className="text-xs font-semibold capitalize text-slate-300 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
                        Audience: {uc.audience}
                      </span>
                      {uc.industry_tags && uc.industry_tags.map((t) => (
                        <span
                          key={t}
                          className="text-xs text-slate-400 bg-slate-900 px-2.5 py-1 rounded-full border border-slate-800"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-bold text-white font-display leading-tight">
                      {uc.title}
                    </h3>

                    {/* Block 1: THE PROBLEM */}
                    <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 space-y-2">
                      <span className="text-[11px] font-mono font-bold tracking-wider text-rose-400 uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <span>THE PROBLEM</span>
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {uc.problem}
                      </p>
                    </div>

                    {/* Block 2: WHAT WE DO */}
                    <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 space-y-2">
                      <span className="text-[11px] font-mono font-bold tracking-wider text-cyan-400 uppercase flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>WHAT WE DO</span>
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {uc.approach}
                      </p>
                    </div>

                    {/* Block 3: THE OUTCOME */}
                    <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 space-y-2">
                      <span className="text-[11px] font-mono font-bold tracking-wider text-emerald-400 uppercase flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>THE OUTCOME</span>
                      </span>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {uc.outcome}
                      </p>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={() => onAsk(`How can Core IQ build a system like "${uc.title}" for me?`)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/50 hover:border-cyan-400 transition-all cursor-pointer shadow-[0_0_15px_rgba(25,217,255,0.15)]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Build this for your organization</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
};
