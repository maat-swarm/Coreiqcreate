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
import { CosmicCTABanner } from '../components/common/CosmicCTABanner';
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
      <section className="relative min-h-[85vh] flex items-center pt-8 pb-16 lg:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-7 z-10">
              <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-cyan-400 uppercase">
                CORE IQ APPS
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
                  placeholder="Ask Core IQ anything..."
                  pills={appPills}
                  onAsk={onAsk}
                  size="large"
                />
              </div>
            </div>

            {/* Right Visual: Floating Multi-Screen Showcase */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-[90px] animate-pulse-glow" />
                <div className="relative w-full h-full rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.3)] animate-float-slow">
                  <img
                    src={ASSETS.appsShowcase}
                    alt="Core IQ Apps Showcase"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-40" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. FEATURED APPLICATION: ImageForge */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-[#060e28] via-[#09153a] to-[#040817] p-8 sm:p-12 lg:p-14 shadow-[0_0_50px_rgba(34,211,238,0.15)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left: Interactive Mock Canvas */}
            <div className="lg:col-span-7 relative">
              <div className="rounded-2xl overflow-hidden border border-cyan-400/30 bg-slate-950/90 shadow-2xl p-4">
                {/* Header bar */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-white ml-2">ImageForge Studio</span>
                  </div>
                  <span className="text-[11px] font-mono text-cyan-400">v2.4 Live</span>
                </div>

                {/* Studio Canvas Preview */}
                <div className="relative aspect-[16/10] rounded-xl overflow-hidden border border-slate-800">
                  <img
                    src={ASSETS.imageforgeArt}
                    alt="ImageForge Generation"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 left-3 right-3 p-3 rounded-lg bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 flex items-center justify-between text-xs text-white">
                    <span className="truncate pr-2 font-mono text-[11px] text-cyan-200">
                      Prompt: "Luminous hyper-space nebula mountain peak"
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold shrink-0">
                      Generated 1.2s
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest text-cyan-300 bg-cyan-500/20 border border-cyan-400/40 uppercase">
                  FEATURED
                </span>
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  AI POWERED
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display">
                ImageForge
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Turn your ideas into stunning visuals. Create, edit and transform images with the power of AI. Perfect for marketers, creators and businesses who need high-quality visuals, fast.
              </p>

              <div>
                <button
                  onClick={() => onAsk("I want to launch and test ImageForge")}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all duration-200"
                >
                  <span>Try it</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. EXPLORE APPS CATALOGUE */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 mb-12">
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
              EXPLORE APPS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
              Find the right app for your needs.
            </h2>
          </div>

          {/* Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {APP_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 font-semibold shadow-[0_0_15px_rgba(34,211,238,0.4)]'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
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
          {filteredApps.map((app) => {
            const Icon = getAppIcon(app.iconName);
            return (
              <div
                key={app.id}
                onClick={() => onAsk(`Tell me about the ${app.title} application and how I can use it.`)}
                className="group cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-64 relative border border-cyan-500/15"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className="w-11 h-11 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: `${app.accentColor}18`,
                        borderColor: `${app.accentColor}40`,
                      }}
                    >
                      <Icon className="w-5 h-5" style={{ color: app.accentColor }} />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
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
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
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
