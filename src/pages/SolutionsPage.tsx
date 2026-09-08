import React from 'react';
import { 
  Sparkles, 
  Zap, 
  LayoutGrid, 
  Monitor, 
  Mic, 
  Link as LinkIcon, 
  ArrowRight, 
  MessageSquare, 
  Lightbulb, 
  Search, 
  Layout, 
  Code, 
  TrendingUp,
  Boxes,
  Cpu
} from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { CosmicCTABanner } from '../components/common/CosmicCTABanner';
import { NavRoute } from '../types';
import { PROCESS_STEPS, GOAL_INTENTS } from '../data/solutionsData';

interface SolutionsPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

export const SolutionsPage: React.FC<SolutionsPageProps> = ({ onNavigate, onAsk }) => {
  return (
    <div className="w-full relative">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center pt-8 pb-16 lg:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-7 z-10">
              <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-cyan-400 uppercase">
                THE CORE IQ ECOSYSTEM
              </span>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display leading-[1.05]">
                Build the right <br />
                <span className="gradient-text-phoenix">system.</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg lg:text-xl max-w-xl leading-relaxed">
                From AI agents and automation to apps, websites, voice and integrations — Core IQ turns what you're trying to accomplish into something you can actually build.
              </p>

              {/* Input + Action button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <div className="flex-1 max-w-lg">
                  <AskCoreIQBar
                    placeholder="Ask Core IQ anything..."
                    onAsk={onAsk}
                  />
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('connected-capabilities');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 transition-all duration-200 shrink-0"
                >
                  <span>Explore how it works</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Visual: Core IQ Connected Capability Orbit */}
            <div className="lg:col-span-5 relative flex justify-center items-center select-none">
              <div className="relative w-full max-w-[460px] aspect-square flex items-center justify-center">
                {/* Ambient Luminous Energy Halo */}
                <div className="absolute inset-4 rounded-full bg-cyan-500/20 blur-[70px] animate-pulse-glow pointer-events-none" />
                <div className="absolute inset-12 rounded-full bg-purple-600/20 blur-[50px] pointer-events-none" />

                {/* Luminous Core Image with hover zoom */}
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full overflow-hidden border border-cyan-400/50 shadow-[0_0_80px_rgba(6,182,212,0.45)] z-10 transition-transform duration-700 hover:scale-105">
                  <img
                    src={ASSETS.energyCore}
                    alt="Core IQ Intelligence"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/50 via-transparent to-cyan-500/10 pointer-events-none" />
                </div>

                {/* Orbit Rings */}
                <div className="absolute inset-0 rounded-full border border-cyan-500/30 pointer-events-none" />
                <div className="absolute -inset-6 rounded-full border border-purple-500/20 pointer-events-none" />

                {/* Orbit Node: AGENTS (Top) */}
                <div 
                  onClick={() => onAsk("Tell me about Core IQ AI Agents")}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-cyan-400/60 text-cyan-200 text-xs font-semibold shadow-[0_0_18px_rgba(34,211,238,0.4)] cursor-pointer hover:scale-110 hover:border-cyan-300 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>AGENTS</span>
                </div>

                {/* Orbit Node: AUTOMATION (Top Right) */}
                <div 
                  onClick={() => onAsk("Tell me about Core IQ Automation")}
                  className="absolute top-8 -right-2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-blue-400/60 text-blue-200 text-xs font-semibold shadow-[0_0_18px_rgba(59,130,246,0.4)] cursor-pointer hover:scale-110 hover:border-blue-300 transition-all"
                >
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                  <span>AUTOMATION</span>
                </div>

                {/* Orbit Node: APPS (Right) */}
                <div 
                  onClick={() => onAsk("Tell me about Core IQ Apps")}
                  className="absolute top-1/2 -right-6 -translate-y-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-purple-400/60 text-purple-200 text-xs font-semibold shadow-[0_0_18px_rgba(168,85,247,0.4)] cursor-pointer hover:scale-110 hover:border-purple-300 transition-all"
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
                  <span>APPS</span>
                </div>

                {/* Orbit Node: WEB (Bottom Right) */}
                <div 
                  onClick={() => onAsk("Tell me about Core IQ Web and Web Apps")}
                  className="absolute bottom-8 -right-2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-emerald-400/60 text-emerald-200 text-xs font-semibold shadow-[0_0_18px_rgba(16,185,129,0.4)] cursor-pointer hover:scale-110 hover:border-emerald-300 transition-all"
                >
                  <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WEB</span>
                </div>

                {/* Orbit Node: VOICE (Bottom) */}
                <div 
                  onClick={() => onAsk("Tell me about Core IQ Voice AI")}
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-pink-400/60 text-pink-200 text-xs font-semibold shadow-[0_0_18px_rgba(236,72,153,0.4)] cursor-pointer hover:scale-110 hover:border-pink-300 transition-all"
                >
                  <Mic className="w-3.5 h-3.5 text-pink-400" />
                  <span>VOICE</span>
                </div>

                {/* Orbit Node: INTEGRATIONS (Bottom Left) */}
                <div 
                  onClick={() => onAsk("Tell me about Core IQ Integrations")}
                  className="absolute bottom-10 -left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-indigo-400/60 text-indigo-200 text-xs font-semibold shadow-[0_0_18px_rgba(99,102,241,0.4)] cursor-pointer hover:scale-110 hover:border-indigo-300 transition-all"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                  <span>INTEGRATIONS</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. "EVERYTHING CONNECTS" CAPABILITY MAP */}
      <section id="connected-capabilities" className="py-20 lg:py-28 border-t border-slate-800/60 bg-[#03081c]/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
              THE CORE IQ ECOSYSTEM
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white font-display">
              Everything <span className="gradient-text-primary">connects.</span>
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              All Core IQ capabilities work together, powered by one intelligent system. Choose what you need, and let the ecosystem do the rest.
            </p>
          </div>

          {/* Central Architecture Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left 3 Cards */}
            <div className="lg:col-span-4 space-y-4">
              <div 
                onClick={() => onAsk("I want to deploy specialized AI agents")}
                className="p-5 rounded-2xl coreiq-glass-card cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-300" />
                  </div>
                  <h3 className="text-white font-semibold text-base group-hover:text-cyan-300 transition-colors">
                    AI Agents
                  </h3>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 ml-auto group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-slate-400 text-xs sm:text-sm pl-12.5">
                  Specialised intelligence for repeatable work.
                </p>
              </div>

              <div 
                onClick={() => onAsk("I want to automate my workflows and business tools")}
                className="p-5 rounded-2xl coreiq-glass-card cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-300" />
                  </div>
                  <h3 className="text-white font-semibold text-base group-hover:text-blue-300 transition-colors">
                    Automation
                  </h3>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 ml-auto group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-slate-400 text-xs sm:text-sm pl-12.5">
                  Remove busy work and connect workflows.
                </p>
              </div>

              <div 
                onClick={() => onAsk("I need a custom app and website built")}
                className="p-5 rounded-2xl coreiq-glass-card cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                    <LayoutGrid className="w-4 h-4 text-purple-300" />
                  </div>
                  <h3 className="text-white font-semibold text-base group-hover:text-purple-300 transition-colors">
                    Apps & Websites
                  </h3>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 ml-auto group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-slate-400 text-xs sm:text-sm pl-12.5">
                  Custom solutions built for your unique needs.
                </p>
              </div>
            </div>

            {/* Center Core: CORE IQ INTELLIGENCE */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-8 relative select-none">
              {/* Pulsing energy rings */}
              <div className="absolute w-64 h-64 rounded-full border border-cyan-500/20 animate-ping opacity-25 pointer-events-none" />
              <div className="absolute w-72 h-72 rounded-full bg-cyan-500/10 blur-[40px] pointer-events-none" />

              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-gradient-to-tr from-cyan-600/40 via-purple-600/40 to-pink-600/30 p-[2px] shadow-[0_0_70px_rgba(34,211,238,0.3)] flex items-center justify-center relative transition-transform duration-500 hover:scale-105">
                <div className="w-full h-full rounded-full bg-[#030718] flex flex-col items-center justify-center p-6 text-center border border-cyan-400/40">
                  <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                    <Cpu className="w-7 h-7 text-cyan-300" />
                  </div>
                  <span className="text-white font-bold text-base tracking-wider font-display">
                    CORE IQ
                  </span>
                  <span className="text-[10px] font-semibold tracking-[0.25em] text-cyan-400 uppercase mt-0.5">
                    INTELLIGENCE
                  </span>
                </div>
              </div>
            </div>

            {/* Right 3 Cards */}
            <div className="lg:col-span-4 space-y-4">
              <div 
                onClick={() => onAsk("I need voice AI and speech interfaces")}
                className="p-5 rounded-2xl coreiq-glass-card cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-pink-500/20 border border-pink-400/30 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-pink-300" />
                  </div>
                  <h3 className="text-white font-semibold text-base group-hover:text-pink-300 transition-colors">
                    Voice AI
                  </h3>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 ml-auto group-hover:text-pink-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-slate-400 text-xs sm:text-sm pl-12.5">
                  Natural voice interfaces and conversations.
                </p>
              </div>

              <div 
                onClick={() => onAsk("I need customer AI and smart support bots")}
                className="p-5 rounded-2xl coreiq-glass-card cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-indigo-300" />
                  </div>
                  <h3 className="text-white font-semibold text-base group-hover:text-indigo-300 transition-colors">
                    Customer AI
                  </h3>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 ml-auto group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-slate-400 text-xs sm:text-sm pl-12.5">
                  Smarter support, happier customers.
                </p>
              </div>

              <div 
                onClick={() => onAsk("I want to integrate all my company tools and databases")}
                className="p-5 rounded-2xl coreiq-glass-card cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 mb-2">
                  <div className="w-9 h-9 rounded-lg bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                    <LinkIcon className="w-4 h-4 text-cyan-300" />
                  </div>
                  <h3 className="text-white font-semibold text-base group-hover:text-cyan-300 transition-colors">
                    Integrations
                  </h3>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 ml-auto group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-slate-400 text-xs sm:text-sm pl-12.5">
                  Connect your tools, data and systems.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. "FROM IDEA TO REALITY" 6-STEP PROCESS */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 mb-14">
          <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
            THE CORE IQ PROCESS
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display">
            From idea to reality.
          </h2>
          <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
            Your vision becomes a plan. Your plan becomes a working system. We guide you through every step, from discovery to optimization.
          </p>
        </div>

        {/* 6 Connected Steps Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 relative">
          {PROCESS_STEPS.map((step) => {
            const Icon = 
              step.iconName === 'Lightbulb' ? Lightbulb :
              step.iconName === 'Search' ? Search :
              step.iconName === 'Layout' ? Layout :
              step.iconName === 'Code' ? Code :
              step.iconName === 'Link' ? LinkIcon : TrendingUp;

            return (
              <div 
                key={step.number}
                className="p-5 rounded-2xl coreiq-glass-card flex flex-col justify-between h-52 border border-cyan-500/20 group hover:border-cyan-400/50 hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(6,182,212,0.2)] transition-all duration-300 relative overflow-hidden"
              >
                {/* Step indicator tag */}
                <div className="flex items-center justify-between w-full">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center group-hover:scale-110 group-hover:bg-cyan-500/25 transition-all">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-[11px] font-mono font-semibold text-slate-500 group-hover:text-cyan-400/80 transition-colors">
                    0{step.number}
                  </span>
                </div>

                <div>
                  <div className="text-xs font-bold tracking-wider text-cyan-300 uppercase mb-1.5 group-hover:text-cyan-200 transition-colors">
                    {step.label}
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed group-hover:text-slate-300 transition-colors">
                    {step.sublabel}
                  </p>
                </div>

                {/* Bottom subtle progress line */}
                <div className="w-full h-0.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 w-0 group-hover:w-full transition-all duration-500" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. "SOLUTIONS FOR WHAT COMES NEXT" (6 Rich Cards) */}
      <section className="py-20 border-t border-slate-800/60 bg-[#04081c]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
              SOLUTIONS FOR WHAT COMES NEXT.
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Card 1: AI Agents */}
            <div 
              onClick={() => onAsk("Tell me more about building AI agents with Core IQ")}
              className="p-6 rounded-2xl coreiq-glass-card cursor-pointer group flex flex-col justify-between h-72 relative overflow-hidden"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg group-hover:text-cyan-300 transition-colors">
                    AI Agents
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Specialised intelligence for repeatable work. Autonomous agent loops with verified tool calling.
                </p>
              </div>

              {/* Mock UI graphic */}
              <div className="h-20 rounded-xl bg-slate-950/80 border border-slate-800 p-3 flex flex-col justify-center space-y-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between text-[11px] text-cyan-300">
                  <span>Agent: Dispatch Swarm</span>
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                </div>
                <div className="h-1.5 w-3/4 rounded-full bg-slate-800" />
                <div className="h-1.5 w-1/2 rounded-full bg-slate-800" />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 group-hover:text-cyan-300 pt-2">
                <span>Explore Agents</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 2: Automation */}
            <div 
              onClick={() => onAsk("Tell me about workflow automation solutions")}
              className="p-6 rounded-2xl coreiq-glass-card cursor-pointer group flex flex-col justify-between h-72 relative overflow-hidden"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg group-hover:text-blue-300 transition-colors">
                    Automation
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Remove busy work and connect workflows across CRM, databases, and APIs without code bottlenecks.
                </p>
              </div>

              <div className="h-20 rounded-xl bg-slate-950/80 border border-slate-800 p-3 flex items-center justify-around opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-xs text-blue-300">A</div>
                <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-xs text-purple-300">B</div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-400" />
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-xs text-emerald-300">C</div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 group-hover:text-blue-300 pt-2">
                <span>Explore Automation</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 3: Apps */}
            <div 
              onClick={() => onNavigate('apps')}
              className="p-6 rounded-2xl coreiq-glass-card cursor-pointer group flex flex-col justify-between h-72 relative overflow-hidden"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                    <Boxes className="w-4 h-4 text-purple-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg group-hover:text-purple-300 transition-colors">
                    Apps
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Useful software built around real needs. Single-purpose utilities to complete enterprise suites.
                </p>
              </div>

              <div className="h-20 rounded-xl bg-slate-950/80 border border-slate-800 p-3 flex items-center justify-between opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-2">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-400/30 flex items-center justify-center">
                    <LayoutGrid className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="space-y-1">
                    <div className="h-2.5 w-16 bg-slate-700 rounded" />
                    <div className="h-2 w-10 bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="text-[10px] text-purple-300 font-mono px-2 py-0.5 rounded bg-purple-950 border border-purple-800">
                  Ready
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 group-hover:text-purple-300 pt-2">
                <span>Explore Apps</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 4: Websites & Web Apps */}
            <div 
              onClick={() => onAsk("I need modern websites and web application development")}
              className="p-6 rounded-2xl coreiq-glass-card cursor-pointer group flex flex-col justify-between h-72 relative overflow-hidden"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                    <Monitor className="w-4 h-4 text-teal-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg group-hover:text-teal-300 transition-colors">
                    Websites & Web Apps
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Modern digital experiences that work for you. High velocity, responsive layouts, tailored to convert.
                </p>
              </div>

              <div className="h-20 rounded-xl bg-slate-950/80 border border-slate-800 p-2.5 space-y-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500/60" />
                  <span className="w-2 h-2 rounded-full bg-amber-500/60" />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/60" />
                  <div className="h-2.5 w-24 bg-slate-800 rounded ml-2" />
                </div>
                <div className="h-7 w-full bg-slate-900 rounded border border-slate-800/80" />
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 group-hover:text-teal-300 pt-2">
                <span>Explore Websites</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 5: Voice AI */}
            <div 
              onClick={() => onAsk("I want to build a voice AI assistant")}
              className="p-6 rounded-2xl coreiq-glass-card cursor-pointer group flex flex-col justify-between h-72 relative overflow-hidden"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-400/30 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-pink-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg group-hover:text-pink-300 transition-colors">
                    Voice AI
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Natural voice interfaces and business conversations with human-cadence speech and zero awkward latency.
                </p>
              </div>

              {/* Soundwave graphic */}
              <div className="h-20 rounded-xl bg-slate-950/80 border border-slate-800 p-3 flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                {[12, 28, 44, 20, 36, 52, 28, 16, 40, 24, 48, 18, 30].map((h, idx) => (
                  <div 
                    key={idx} 
                    className="w-1.5 rounded-full bg-gradient-to-t from-pink-500 to-cyan-400" 
                    style={{ height: `${h}px` }} 
                  />
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-pink-400 group-hover:text-pink-300 pt-2">
                <span>Explore Voice AI</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

            {/* Card 6: Integrations */}
            <div 
              onClick={() => onAsk("How does Core IQ integrate across our tech stack?")}
              className="p-6 rounded-2xl coreiq-glass-card cursor-pointer group flex flex-col justify-between h-72 relative overflow-hidden"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                    <LinkIcon className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h3 className="text-white font-bold text-lg group-hover:text-indigo-300 transition-colors">
                    Integrations
                  </h3>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  Connect tools, data and systems. Reliable webhooks, OAuth connections, and bi-directional pipelines.
                </p>
              </div>

              <div className="h-20 rounded-xl bg-slate-950/80 border border-slate-800 p-3 flex items-center justify-center gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                <div className="px-3 py-1.5 rounded-lg bg-indigo-950 border border-indigo-700/50 text-[11px] text-indigo-200">DB</div>
                <div className="w-8 h-[1px] bg-indigo-400/50" />
                <div className="px-3 py-1.5 rounded-lg bg-cyan-950 border border-cyan-700/50 text-[11px] text-cyan-200">API</div>
                <div className="w-8 h-[1px] bg-cyan-400/50" />
                <div className="px-3 py-1.5 rounded-lg bg-purple-950 border border-purple-700/50 text-[11px] text-purple-200">UI</div>
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 pt-2">
                <span>Explore Integrations</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. "BUILT AROUND YOUR GOAL" STRIP */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="text-xs font-semibold tracking-[0.25em] text-slate-400 uppercase">
            BUILT AROUND YOUR GOAL.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {GOAL_INTENTS.map((goal, idx) => {
            const Icon = 
              goal.icon === 'Zap' ? Zap :
              goal.icon === 'MessageSquare' ? MessageSquare :
              goal.icon === 'LayoutGrid' ? LayoutGrid :
              goal.icon === 'Monitor' ? Monitor : LinkIcon;

            return (
              <div
                key={idx}
                onClick={() => onAsk(goal.text)}
                className="p-5 rounded-2xl coreiq-glass-card cursor-pointer group flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs sm:text-sm text-slate-200 font-medium group-hover:text-cyan-300 transition-colors">
                    {goal.text.replace(' →', '')}
                  </span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0 group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-all" />
              </div>
            );
          })}
        </div>
      </section>

      {/* 6. BOTTOM CTA BANNER */}
      <CosmicCTABanner
        headline="What are you trying to build?"
        subtext="Start with the problem. We'll help shape the solution."
        inputPlaceholder="Ask Core IQ anything..."
        onAsk={onAsk}
      />
    </div>
  );
};
