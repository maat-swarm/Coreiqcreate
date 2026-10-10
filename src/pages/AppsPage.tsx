import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ArrowRight, 
  Sparkles, 
  RefreshCw,
  AlertTriangle,
  ShoppingBag
} from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { CoreIQSentinel } from '../components/common/CoreIQSentinel';
import { CosmicCTABanner } from '../components/common/CosmicCTABanner';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { PRO_TIERS } from '../data/appsData';
import { PublicStoreApp, fetchPublicApps } from '../services/storePublic';
import { AppCard } from '../components/apps/AppCard';
import { AppCategoryFilter } from '../components/apps/AppCategoryFilter';
import { AppOfTheDay } from '../components/apps/AppOfTheDay';

interface AppsPageProps {
  onNavigate: (route: string) => void;
  onAsk: (query: string) => void;
}

export const AppsPage: React.FC<AppsPageProps> = ({ onNavigate, onAsk }) => {
  const [apps, setApps] = useState<PublicStoreApp[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadApps = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const data = await fetchPublicApps();
      setApps(data);
    } catch (err: any) {
      setLoadError(err.message || 'Failed to connect to application directory.');
      setApps([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApps();
  }, [loadApps]);

  // Derive dynamic list of categories that actually exist
  const availableCategories = useMemo(() => {
    const rawSet = new Set<string>();
    apps.forEach((a) => {
      if (a.category && a.category.trim()) {
        rawSet.add(a.category.trim());
      }
    });
    return ['All', ...Array.from(rawSet)];
  }, [apps]);

  // Client-side filter by selectedCategory and search query
  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      const matchesCategory =
        selectedCategory === 'All' || app.category.toLowerCase() === selectedCategory.toLowerCase();

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        app.title.toLowerCase().includes(q) ||
        (app.tagline && app.tagline.toLowerCase().includes(q)) ||
        (app.description && app.description.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [apps, selectedCategory, searchQuery]);

  const appPills = [
    { label: 'Browse apps', query: 'Show me all Core IQ applications' },
    { label: 'Try a tool', query: 'I want to try the writing or image generator tool' },
    { label: 'Explore categories', query: 'What categories of apps are available?' },
  ];

  return (
    <div className="w-full relative">
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 pb-8 lg:pt-14 lg:pb-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-7 z-10">
              <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-cyan-400 uppercase font-mono">
                COREIQ APPS
              </span>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display leading-[1.05]">
                Useful things, <br />
                <span className="gradient-text-phoenix">intelligently built.</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg lg:text-xl max-w-xl leading-relaxed">
                Explore a growing collection of practical applications built to solve real problems. Powerful, easy to use, and designed to help you create, work and achieve more.
              </p>

              {/* Input Bar */}
              <div className="pt-2">
                <AskCoreIQBar
                  placeholder="Ask CoreIQ anything..."
                  pills={appPills}
                  onAsk={onAsk}
                  size="large"
                />
              </div>

              {/* Sentinel Carousel */}
              <div className="pt-2">
                <CoreIQSentinel
                  page="apps"
                  onAsk={onAsk}
                  onNavigate={(r) => onNavigate(r)}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. FEATURED APPLICATION: CORE BRIEF HERO BLOCK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-950/90 border border-slate-700/50 p-8 sm:p-12 mb-16 relative overflow-hidden backdrop-blur-md shadow-[0_0_50px_rgba(34,211,238,0.12)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left side */}
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
                FEATURED / CORE BRIEF
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4 font-display">
                From rough idea to usable brief.
              </h2>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed mb-6 max-w-xl">
                Paste messy notes, voice transcripts or bullet points. Core Brief extracts goals, constraints, technical requirements and produces a structured build plan.
              </p>
              <div>
                <button
                  onClick={() => onAsk('I want to try Core Brief to create a structured build plan')}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all duration-200 min-h-[44px]"
                >
                  <span>Try it free</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Right side */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-950/90 p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-[11px] text-cyan-400 uppercase">Raw Input</span>
                    <span className="text-[10px] text-slate-500 font-mono">Unstructured text</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed select-none">
                    Notes: Need a client portal. Must sync with Airtable, send email receipts, support 3 user roles, mobile friendly, launch in 3 weeks...
                  </div>
                </div>

                <div className="flex items-center justify-center py-0.5">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-mono">
                    <span>Extracting architecture</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-cyan-400 uppercase">Structured Output</span>
                    <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Brief ready</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-200 text-xs font-mono">
                      Scope: 3 weeks
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-200 text-xs font-mono">
                      Airtable Sync
                    </span>
                    <span className="px-3 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs font-mono">
                      RBAC: 3 Roles
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. EXPLORE APPS CATALOGUE (LIVE API DRIVEN ONLY) */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 mb-10">
          <ScrollReveal>
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase font-mono">
                EXPLORE APPS
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
                Find the right app for your needs.
              </h2>
            </div>
          </ScrollReveal>

          {/* Dynamic Categories & Search */}
          <AppCategoryFilter
            categories={availableCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="p-5 rounded-2xl bg-[#060b1e]/70 border border-slate-800 space-y-4 animate-pulse min-h-[320px]"
              >
                <div className="w-full aspect-video rounded-xl bg-slate-800" />
                <div className="w-20 h-4 bg-slate-800 rounded-md" />
                <div className="w-3/4 h-6 bg-slate-800 rounded-lg" />
                <div className="w-full h-10 bg-slate-800/60 rounded-lg" />
                <div className="w-full h-10 bg-slate-800 rounded-xl mt-6" />
              </div>
            ))}
          </div>
        )}

        {/* Error State with Friendly Retry */}
        {!isLoading && loadError && (
          <div className="p-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center space-y-4 max-w-md mx-auto">
            <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Unable to Load Applications</h3>
              <p className="text-xs text-rose-200 leading-relaxed">{loadError}</p>
            </div>
            <button
              onClick={loadApps}
              className="px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/40 font-semibold text-xs transition-colors min-h-[44px] inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !loadError && filteredApps.length === 0 && (
          <div className="p-12 rounded-2xl bg-[#060b1e]/60 border border-slate-800 text-center space-y-3 max-w-lg mx-auto">
            <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-bold text-white">No applications found</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {searchQuery || selectedCategory !== 'All'
                ? 'No published applications matched your current filters.'
                : 'No published applications are available at this time.'}
            </p>
            {(searchQuery || selectedCategory !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                }}
                className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-cyan-300 hover:bg-slate-700 transition-colors min-h-[44px]"
              >
                Reset filters
              </button>
            )}
          </div>
        )}

        {/* Live Tiles Grid (From API ONLY) */}
        {!isLoading && !loadError && filteredApps.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredApps.map((app) => (
              <AppCard
                key={app.id}
                app={app}
                onNavigateToDetail={(slug) => onNavigate(`apps/${slug}`)}
              />
            ))}
          </div>
        )}
      </section>

      {/* 4. "FROM FREE TO PRO" PROGRESSION */}
      <section className="py-20 lg:py-28 border-t border-slate-800/60 bg-[#03081c]/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Description + 3 Progression Nodes */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-3">
                <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase font-mono">
                  FROM FREE TO PRO
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display">
                  More power. <br />
                  More possibilities.
                </h2>
                <p className="text-slate-300 text-base max-w-xl leading-relaxed">
                  Start with free tools. Upgrade for advanced features. Or get a custom solution built for your unique needs.
                </p>
              </div>

              {/* Connected 3 steps */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                {PRO_TIERS.map((tier) => (
                  <div 
                    key={tier.step}
                    className="p-5 rounded-2xl coreiq-glass-card space-y-3 border border-cyan-500/20"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 font-bold text-sm font-display">
                      {tier.step}
                    </div>
                    <h3 className="text-white font-bold text-base">
                      {tier.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {tier.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Visual: App of the Day / Featured App */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <AppOfTheDay
                apps={apps}
                onNavigateToDetail={(slug) => onNavigate(`apps/${slug}`)}
              />
            </div>

          </div>
        </div>
      </section>

      {/* 5. BOTTOM CTA BANNER */}
      <CosmicCTABanner
        eyebrow="HAVE SOMETHING SPECIFIC IN MIND?"
        headline="Let's build it."
        subtext="Tell Core IQ what you want to create, and we'll help you find the right app, tool or custom solution."
        inputPlaceholder="Tell us what you're trying to accomplish..."
        onAsk={onAsk}
      />
    </div>
  );
};
