import React, { useState, useMemo } from 'react';
import { 
  Zap, 
  Layers, 
  Crosshair,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { CoreIQSentinel } from '../components/common/CoreIQSentinel';
import { CosmicCTABanner } from '../components/common/CosmicCTABanner';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { PageBackground } from '../components/environment/PageBackground';
import { MaatverseStage } from '../components/tools/MaatverseStage';
import { ToolCard } from '../components/tools/ToolCard';
import { usePublicSiteTools } from '../services/siteTools';
import { TOOL_PHILOSOPHY, TOOL_CATEGORIES } from '../data/toolsData';
import { NavRoute } from '../types';

interface ToolsPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

export const ToolsPage: React.FC<ToolsPageProps> = ({ onNavigate, onAsk }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const { tools, isPlaceholder, loading, error, reload } = usePublicSiteTools();

  const toolPills = [
    { label: 'Browse tools', query: 'Show me all tools in Core IQ' },
    { label: 'Prompt Enhancer', query: 'I want to try the Prompt Enhancer tool' },
    { label: 'Explore workflows', query: 'How can I connect tools into an automation workflow?' },
  ];

  // Distinct category chips from tools list or fallback
  const categories = useMemo(() => {
    if (isPlaceholder || tools.length === 0) {
      return TOOL_CATEGORIES;
    }
    const set = new Set<string>();
    tools.forEach((t) => {
      if (t.category) set.add(t.category);
    });
    return ['All', ...Array.from(set)];
  }, [tools, isPlaceholder]);

  // First 3 tools in display order feed "Start here"
  const startHereTools = useMemo(() => {
    return tools.slice(0, 3);
  }, [tools]);

  // Remaining tools feed "Explore Tools"
  const remainingTools = useMemo(() => {
    return tools.slice(3);
  }, [tools]);

  // Filtered remaining tools
  const filteredGridTools = useMemo(() => {
    if (selectedCategory === 'All') return remainingTools;
    return remainingTools.filter((t) => t.category === selectedCategory);
  }, [remainingTools, selectedCategory]);

  return (
    <div className="w-full relative min-h-screen">
      {/* Per-Page Fixed Background (rendered into document.body via Portal) */}
      <PageBackground slotKey="tools.page.background" variant="tools" />

      {/* 1. HERO SECTION (UNCHANGED) */}
      <section className="relative pt-8 pb-8 lg:pt-14 lg:pb-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-7 z-10">
              <span className="text-xs font-mono tracking-[0.3em] text-cyan-400 uppercase font-bold">
                TOOLS / COREIQ
              </span>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display leading-[1.05]">
                Intelligent tools <br />
                <span className="gradient-text-phoenix">for real work.</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg lg:text-xl max-w-xl leading-relaxed">
                A growing collection of AI-powered utilities. Start with one. Build a workflow.
              </p>

              <div className="pt-2">
                <AskCoreIQBar
                  placeholder="Ask CoreIQ to run a tool..."
                  pills={toolPills}
                  onAsk={onAsk}
                  size="large"
                />
              </div>

              {/* Sentinel carousel directly below AskCoreIQ */}
              <div className="pt-2">
                <CoreIQSentinel
                  page="tools"
                  onAsk={onAsk}
                  onNavigate={onNavigate}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. THE STAGE (Banner & Mascot side by side) */}
      <MaatverseStage onNavigate={onNavigate} />

      {/* 3. "START HERE" SECTION */}
      <section className="py-6 sm:py-8 lg:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <ScrollReveal>
          <div className="space-y-2 mb-6 sm:mb-8">
            <span
              className="text-xs font-mono tracking-[0.25em] uppercase font-bold"
              style={{ color: '#C9A24B' }}
            >
              START HERE
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
              Pick one and go.
            </h2>
          </div>
        </ScrollReveal>

        {loading ? (
          /* Skeletons: 3 hero cards */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-[320px] rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="w-full aspect-video rounded-xl bg-slate-800/80 mb-4" />
                <div className="space-y-2 flex-1">
                  <div className="w-20 h-3 bg-slate-800 rounded" />
                  <div className="w-3/4 h-5 bg-slate-800 rounded" />
                  <div className="w-full h-3 bg-slate-800 rounded" />
                </div>
                <div className="w-16 h-3 bg-slate-800 rounded mt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={reload}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-white font-semibold flex items-center gap-1.5 min-h-[44px]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          /* Start Here Layout:
             mobile: first card full width, next two side by side (2 columns)
             lg: 3 equal large cards with mono numbers 01, 02, 03 overlapping top-left
          */
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {startHereTools.map((tool, idx) => {
              const numStr = `0${idx + 1}`;
              const isFirstOnMobile = idx === 0;

              return (
                <div
                  key={tool.id}
                  className={isFirstOnMobile ? 'col-span-2 lg:col-span-1 h-full' : 'col-span-1 h-full'}
                >
                  <ToolCard
                    tool={tool}
                    variant="hero"
                    heroNumber={numStr}
                    onNavigate={onNavigate}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. DIVIDER: 1px hairline with a centred small gold diamond (CSS only) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-6 sm:my-8 lg:my-14 relative" aria-hidden="true">
        <div className="border-t border-slate-800/80 w-full relative">
          <div
            className="absolute left-1/2 -top-1.5 -translate-x-1/2 w-3 h-3 rotate-45 border border-slate-950"
            style={{
              background: '#C9A24B',
              boxShadow: '0 0 10px rgba(201, 162, 75, 0.4)',
            }}
          />
        </div>
      </div>

      {/* 5. "EXPLORE TOOLS" SECTION */}
      <section className="py-6 sm:py-8 lg:py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="space-y-6 mb-8 sm:mb-10">
          <ScrollReveal>
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
                EXPLORE TOOLS
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
                Explore the toolkit.
              </h2>
            </div>
          </ScrollReveal>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 min-h-[44px] cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 font-bold shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                      : 'bg-slate-900/70 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Free download banner (UNCHANGED content and look) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-cyan-950/60 to-violet-950/40 border border-cyan-500/35 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.1)] hover:shadow-[0_0_40px_rgba(6,182,212,0.2)] transition-shadow duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
              Free download — no signup
            </span>
            <h3 className="text-sm font-bold text-white">CoreIQ AI Prompt Pack — 20 production-ready prompts</h3>
            <p className="text-xs text-slate-300/80">The exact prompt templates CoreIQ uses internally.</p>
          </div>
          <a
            href="/downloads/coreiq-prompt-pack.pdf"
            download="coreiq-prompt-pack.pdf"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(34,211,238,0.4)] hover:shadow-[0_0_30px_rgba(34,211,238,0.6)] hover:scale-105 active:scale-95 transition-all min-h-[44px]"
          >
            ↓ Download Free PDF
          </a>
        </div>

        {/* Automation checklist banner (UNCHANGED content and look) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-violet-950/50 to-slate-950/70 border border-violet-500/30 mb-8 sm:mb-12 shadow-[0_0_30px_rgba(168,85,247,0.1)] hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] transition-shadow duration-300">
          <div className="space-y-1">
            <span className="text-[10px] font-mono text-violet-400 uppercase tracking-wider flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              Free checklist
            </span>
            <h3 className="text-sm font-bold text-white">Automation Starter Checklist — 10 steps before you build</h3>
            <p className="text-xs text-slate-300/80">Used on every CoreIQ automation project.</p>
          </div>
          <a
            href="/downloads/automation-starter-checklist.pdf"
            download="automation-starter-checklist.pdf"
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-violet-500/40 hover:border-violet-400 bg-violet-500/10 hover:bg-violet-500/20 text-violet-300 hover:text-white font-bold text-xs shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:scale-105 active:scale-95 transition-all min-h-[44px]"
          >
            ↓ Download Checklist
          </a>
        </div>

        {/* The Grid of Remaining Tools */}
        {loading ? (
          /* Skeletons: 8 grid cards */
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div
                key={n}
                className="h-[280px] rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="w-full aspect-[16/10] rounded-xl bg-slate-800/80 mb-3" />
                <div className="space-y-2 flex-1">
                  <div className="w-16 h-3 bg-slate-800 rounded" />
                  <div className="w-3/4 h-4 bg-slate-800 rounded" />
                  <div className="w-full h-3 bg-slate-800 rounded" />
                </div>
                <div className="w-14 h-3 bg-slate-800 rounded mt-3" />
              </div>
            ))}
          </div>
        ) : remainingTools.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-[#060b1c]/60 border border-slate-800/80 space-y-2">
            <p className="text-base font-semibold text-slate-200">More tools are on the way.</p>
            <p className="text-xs text-slate-400">
              New utilities are added regularly. Have a specific automation in mind?
            </p>
          </div>
        ) : filteredGridTools.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-[#060b1c]/60 border border-slate-800/80 space-y-2">
            <p className="text-sm font-semibold text-slate-300">
              No tools found in the &ldquo;{selectedCategory}&rdquo; category.
            </p>
            <button
              onClick={() => setSelectedCategory('All')}
              className="px-4 py-2 rounded-xl bg-cyan-500/15 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/25 border border-cyan-500/30 transition-colors min-h-[44px]"
            >
              Show all tools
            </button>
          </div>
        ) : (
          /* Grid: 2 columns from 360px, 3 from 768px, 4 from 1280px */
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredGridTools.map((tool) => (
              <ToolCard
                key={tool.id}
                tool={tool}
                variant="grid"
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </section>

      {/* 6. DESIGN PHILOSOPHY SECTION (UNCHANGED) */}
      <section className="py-20 lg:py-28 border-t border-slate-800/60 bg-[#03081c]/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
              DESIGN PHILOSOPHY
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white font-display">
              Why single-purpose <span className="gradient-text-primary">tools?</span>
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              When software tries to do everything, it usually does nothing well. We believe in sharp, precision utilities that get out of your way.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TOOL_PHILOSOPHY.map((item) => {
              const Icon = 
                item.iconName === 'Zap' ? Zap :
                item.iconName === 'Crosshair' ? Crosshair : Layers;

              return (
                <div 
                  key={item.title}
                  className="p-8 rounded-2xl coreiq-glass-card space-y-4 border border-cyan-500/15"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-cyan-300" />
                  </div>
                  <h3 className="text-white font-bold text-xl">
                    {item.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA BANNER (UNCHANGED) */}
      <CosmicCTABanner
        eyebrow="HAVE SOMETHING SPECIFIC IN MIND?"
        headline="Let's build it."
        subtext="Tell Core IQ what you need and we'll help you find the right tool, or create something custom."
        inputPlaceholder="Ask CoreIQ anything..."
        onAsk={onAsk}
      />
    </div>
  );
};
