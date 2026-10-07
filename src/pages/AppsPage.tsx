import React, { useState } from 'react';
import { 
  Flame, 
  PenTool, 
  Database, 
  GitMerge, 
  Monitor, 
  Volume2, 
  MessageSquare, 
  LayoutGrid, 
  Search, 
  Megaphone, 
  ArrowRight, 
  Sparkles, 
  Play, 
  Cpu, 
  Check 
} from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { CoreIQSentinel } from '../components/common/CoreIQSentinel';
import { CosmicCTABanner } from '../components/common/CosmicCTABanner';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { NavRoute } from '../types';
import { APPS_LIST, APP_CATEGORIES, PRO_TIERS } from '../data/appsData';

interface AppsPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

export const AppsPage: React.FC<AppsPageProps> = ({ onNavigate, onAsk }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeAppModal, setActiveAppModal] = useState<string | null>(null);

  const filteredApps = selectedCategory === 'All'
    ? APPS_LIST
    : APPS_LIST.filter(app => app.category === selectedCategory || (selectedCategory === 'Productivity' && app.id === 'researchpro'));

  const appPills = [
    { label: 'Browse apps', query: 'Show me all Core IQ applications' },
    { label: 'Try a tool', query: 'I want to try the writing or image generator tool' },
    { label: 'Explore categories', query: 'What categories of apps are available?' },
  ];

  const getAppIcon = (iconName: string) => {
    switch (iconName) {
      case 'Flame': return Flame;
      case 'PenTool': return PenTool;
      case 'Database': return Database;
      case 'GitMerge': return GitMerge;
      case 'Monitor': return Monitor;
      case 'Volume2': return Volume2;
      case 'MessageSquare': return MessageSquare;
      case 'LayoutGrid': return LayoutGrid;
      case 'Search': return Search;
      case 'Megaphone': return Megaphone;
      default: return Sparkles;
    }
  };

  return (
    <div className="w-full relative">
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 pb-8 lg:pt-14 lg:pb-10 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-7 z-10">
              <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-cyan-400 uppercase">
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

              {/* Sentinel moved to be directly below AskCoreIQ */}
              <div className="pt-2">
                <CoreIQSentinel
                  page="apps"
                  onAsk={onAsk}
                  onNavigate={onNavigate}
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. FEATURED APPLICATION: CORE BRIEF HERO BLOCK */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-950/90 border border-slate-700/50 p-8 sm:p-12 mb-16 relative overflow-hidden backdrop-blur-md shadow-[0_0_50px_rgba(34,211,238,0.12)]">
          {/* Subtle luminous background aura */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-purple-600/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left side (roughly 55%) */}
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
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all duration-200"
                >
                  <span>Try it free</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Right side (roughly 45%) */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl border border-slate-700/70 bg-slate-950/90 p-5 sm:p-6 shadow-2xl backdrop-blur-md space-y-4">
                {/* Raw input textarea mockup */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono text-[11px] text-cyan-400 uppercase">Raw Input</span>
                    <span className="text-[10px] text-slate-500 font-mono">Unstructured text</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed select-none">
                    Notes: Need a client portal. Must sync with Airtable, send email receipts, support 3 user roles, mobile friendly, launch in 3 weeks...
                  </div>
                </div>

                {/* Arrow pointing to structured output */}
                <div className="flex items-center justify-center py-0.5">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-mono">
                    <span>Extracting architecture</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                </div>

                {/* Structured output section */}
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

      {/* 3. EXPLORE APPS CATALOGUE */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 content-visibility-auto">
        <div className="space-y-6 mb-12">
          <ScrollReveal>
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
                EXPLORE APPS
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
                Find the right app for your needs.
              </h2>
            </div>
          </ScrollReveal>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {APP_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 font-semibold shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-105'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80 hover:border-cyan-500/30 hover:scale-[1.02]'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 10 App Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {filteredApps.map((app, index) => {
            const Icon = getAppIcon(app.iconName);
            return (
              <div
                key={app.id}
                onClick={() => onAsk(`Tell me about the ${app.title} application and how I can use it.`)}
                style={{ '--i': index } as React.CSSProperties}
                className="reveal group cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-auto min-h-[190px] relative border border-cyan-500/20 transition-all duration-300 hover:border-cyan-400/60 hover:-translate-y-2 hover:shadow-[0_16px_36px_rgba(0,0,0,0.8),0_0_28px_rgba(34,211,238,0.22)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center border transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_16px_rgba(34,211,238,0.3)]"
                      style={{
                        backgroundColor: `${app.accentColor}18`,
                        borderColor: `${app.accentColor}40`,
                      }}
                    >
                      <Icon className="w-5 h-5 group-hover:rotate-6 transition-transform" style={{ color: app.accentColor }} />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-800 text-slate-400 group-hover:border-cyan-500/30 group-hover:text-cyan-300 transition-colors">
                      {app.category}
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-lg mb-1.5 group-hover:text-cyan-300 transition-colors">
                    {app.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                    {app.tagline}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
                  <span className="text-cyan-400 font-medium group-hover:underline">
                    Explore app
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-1.5 transition-all duration-300" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. "FROM FREE TO PRO" PROGRESSION */}
      <section className="py-20 lg:py-28 border-t border-slate-800/60 bg-[#03081c]/50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Description + 3 Progression Nodes */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-3">
                <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
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

            {/* Right Visual: Crystalline 3D Hypercube Matrix */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-purple-600/20 blur-[80px]" />
                <div className="relative w-full h-full rounded-3xl overflow-hidden border border-purple-500/30 shadow-[0_0_60px_rgba(168,85,247,0.3)] animate-pulse-glow">
                  <img
                    src={ASSETS.hypercubeCrystal}
                    alt="Core IQ Crystalline Hypercube"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    width={420}
                    height={420}
                    className="w-full h-full object-cover scale-105"
                  />
                </div>
              </div>
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
