import React from 'react';
import { 
  Sparkles, 
  Zap, 
  LayoutGrid, 
  Monitor, 
  Mic, 
  Link as LinkIcon, 
  ArrowRight
} from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { PageHeroVisual } from '../components/common/PageHeroVisual';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { NavRoute } from '../types';

interface SolutionsPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

export const SolutionsPage: React.FC<SolutionsPageProps> = ({ onNavigate, onAsk }) => {
  const journeySteps = ['IDEA', 'DISCOVERY', 'DESIGN', 'BUILD', 'INTEGRATE', 'OPTIMIZE'];

  const capabilities = [
    {
      num: '01',
      name: 'AI Agents',
      description: 'Autonomous systems that reason, act and complete complex tasks.',
      action: () => onAsk('Tell me about Core IQ AI Agents'),
    },
    {
      num: '02',
      name: 'Automation',
      description: 'Remove repetitive work and connect your processes into automated workflows.',
      action: () => onAsk('Tell me about Core IQ Automation'),
    },
    {
      num: '03',
      name: 'Apps',
      description: 'Custom software and digital experiences built to operate smoothly.',
      action: () => onNavigate('apps'),
    },
    {
      num: '04',
      name: 'Websites and Web Apps',
      description: 'High-performance digital front-ends engineered for conversions and scale.',
      action: () => onAsk('Tell me about Core IQ Websites and Web Apps'),
    },
    {
      num: '05',
      name: 'Voice AI',
      description: 'Natural voice interfaces for support, intake and hands-free operations.',
      action: () => onAsk('Tell me about Core IQ Voice AI'),
    },
    {
      num: '06',
      name: 'Customer AI',
      description: 'Conversational qualification and smart resolution for customer experiences.',
      action: () => onAsk('Tell me about Core IQ Customer AI'),
    },
    {
      num: '07',
      name: 'Integrations',
      description: 'Connect your tools, APIs and databases into one coherent ecosystem.',
      action: () => onAsk('Tell me about Core IQ Integrations'),
    },
    {
      num: '08',
      name: 'Intelligence and Data',
      description: 'Transform raw information into structured, actionable intelligence.',
      action: () => onAsk('Tell me about Core IQ Intelligence and Data'),
    },
    {
      num: '09',
      name: 'Learn',
      description: 'Practical AI education, frameworks, and guides for builders.',
      action: () => onNavigate('learn'),
    },
  ];

  return (
    <div className="w-full relative">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[75vh] flex items-center pt-8 pb-14 lg:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-7 z-10">
              <span className="text-xs tracking-[0.3em] text-cyan-400 uppercase font-semibold">
                CAPABILITIES / COREIQ
              </span>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display leading-[1.05]">
                Build the system, <br />
                <span className="gradient-text-phoenix">not just the feature.</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg lg:text-xl max-w-xl leading-relaxed">
                From AI agents and automation to apps, websites, voice and integrations — Core IQ turns what you're trying to accomplish into something you can actually build.
              </p>

              {/* Input + Action button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                <div className="flex-1 max-w-lg">
                  <AskCoreIQBar
                    placeholder="Ask CoreIQ anything..."
                    onAsk={onAsk}
                  />
                </div>
                <button
                  onClick={() => {
                    const el = document.getElementById('capability-stream');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 transition-all duration-200 shrink-0"
                >
                  <span>Explore directory</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Visual: Core IQ Connected Capability Orbit */}
            <div className="lg:col-span-5 relative flex justify-center items-center select-none">
              <PageHeroVisual>
                <div className="relative w-full max-w-[440px] aspect-square flex items-center justify-center">
                  {/* Ambient Luminous Energy Halo */}
                  <div className="absolute inset-4 rounded-full bg-cyan-500/20 blur-[70px] animate-pulse-glow pointer-events-none" />
                  <div className="absolute inset-12 rounded-full bg-purple-600/20 blur-[50px] pointer-events-none" />

                  {/* Luminous Core Image with hover zoom */}
                  <div className="relative w-60 h-60 sm:w-68 sm:h-68 rounded-full overflow-hidden border border-cyan-400/50 shadow-[0_0_80px_rgba(6,182,212,0.45)] z-10 transition-transform duration-700 hover:scale-105">
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
                    className="animate-float-subtle absolute -top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-cyan-400/60 text-cyan-200 text-xs font-semibold shadow-[0_0_18px_rgba(34,211,238,0.4)] cursor-pointer hover:scale-110 hover:border-cyan-300 hover:shadow-[0_0_24px_rgba(34,211,238,0.7)] transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AGENTS</span>
                  </div>

                  {/* Orbit Node: AUTOMATION (Top Right) */}
                  <div 
                    onClick={() => onAsk("Tell me about Core IQ Automation")}
                    className="animate-float-delayed absolute top-8 -right-2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-blue-400/60 text-blue-200 text-xs font-semibold shadow-[0_0_18px_rgba(59,130,246,0.4)] cursor-pointer hover:scale-110 hover:border-blue-300 hover:shadow-[0_0_24px_rgba(59,130,246,0.7)] transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-blue-400" />
                    <span>AUTOMATION</span>
                  </div>

                  {/* Orbit Node: APPS (Right) */}
                  <div 
                    onClick={() => onNavigate('apps')}
                    className="animate-float-subtle absolute top-1/2 -right-6 -translate-y-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-purple-400/60 text-purple-200 text-xs font-semibold shadow-[0_0_18px_rgba(168,85,247,0.4)] cursor-pointer hover:scale-110 hover:border-purple-300 hover:shadow-[0_0_24px_rgba(168,85,247,0.7)] transition-all"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-purple-400" />
                    <span>APPS</span>
                  </div>

                  {/* Orbit Node: WEB (Bottom Right) */}
                  <div 
                    onClick={() => onAsk("Tell me about Core IQ Web and Web Apps")}
                    className="animate-float-delayed absolute bottom-8 -right-2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-emerald-400/60 text-emerald-200 text-xs font-semibold shadow-[0_0_18px_rgba(16,185,129,0.4)] cursor-pointer hover:scale-110 hover:border-emerald-300 hover:shadow-[0_0_24px_rgba(16,185,129,0.7)] transition-all"
                  >
                    <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WEB</span>
                  </div>

                  {/* Orbit Node: VOICE (Bottom) */}
                  <div 
                    onClick={() => onAsk("Tell me about Core IQ Voice AI")}
                    className="animate-float-subtle absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-pink-400/60 text-pink-200 text-xs font-semibold shadow-[0_0_18px_rgba(236,72,153,0.4)] cursor-pointer hover:scale-110 hover:border-pink-300 hover:shadow-[0_0_24px_rgba(236,72,153,0.7)] transition-all"
                  >
                    <Mic className="w-3.5 h-3.5 text-pink-400" />
                    <span>VOICE</span>
                  </div>

                  {/* Orbit Node: INTEGRATIONS (Bottom Left) */}
                  <div 
                    onClick={() => onAsk("Tell me about Core IQ Integrations")}
                    className="animate-float-delayed absolute bottom-10 -left-4 z-20 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950/90 border border-indigo-400/60 text-indigo-200 text-xs font-semibold shadow-[0_0_18px_rgba(99,102,241,0.4)] cursor-pointer hover:scale-110 hover:border-indigo-300 hover:shadow-[0_0_24px_rgba(99,102,241,0.7)] transition-all"
                  >
                    <LinkIcon className="w-3.5 h-3.5 text-indigo-400" />
                    <span>INTEGRATIONS</span>
                  </div>

                </div>
              </PageHeroVisual>
            </div>

          </div>
        </div>
      </section>

      {/* 2. HORIZONTAL JOURNEY STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 mb-12 relative z-20">
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 py-6 px-6 sm:px-8 backdrop-blur-md shadow-xl hover:border-cyan-500/30 transition-all duration-300">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-2">
            {journeySteps.map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex items-center gap-2.5 group/step cursor-default">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.7)] shrink-0 group-hover/step:scale-125 transition-transform" />
                  <span className="text-xs font-mono tracking-widest text-slate-400 group-hover/step:text-cyan-300 uppercase select-none whitespace-nowrap transition-colors">
                    {step}
                  </span>
                </div>
                {idx < journeySteps.length - 1 && (
                  <div className="hidden sm:flex flex-1 items-center mx-2 sm:mx-3 relative overflow-hidden">
                    <div className="w-full h-[1.5px] bg-gradient-to-r from-cyan-500/30 via-cyan-400/60 to-cyan-500/30" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 3. NUMBERED EDITORIAL CAPABILITY STREAM */}
      <section id="capability-stream" className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
                CAPABILITY DIRECTORY
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display mt-2">
                Everything connects.
              </h2>
            </div>
            <p className="text-slate-400 text-sm max-w-md">
              From discrete intelligence components to full-stack systems, explore any capability to begin shaping your architecture.
            </p>
          </div>
        </ScrollReveal>

        {/* 9 Numbered Rows with animated vertical line */}
        <div className="relative">
          {/* Subtle animated vertical line in cyan-500/20 running down the left side next to the numbers */}
          <div className="absolute left-[88px] sm:left-[96px] top-4 bottom-4 w-[1px] bg-cyan-500/20 animate-line-grow pointer-events-none hidden sm:block" />

          <div className="divide-y divide-transparent">
            {capabilities.map((row) => (
              <div
                key={row.num}
                onClick={row.action}
                className="group w-full flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-8 py-5 border-b border-slate-800/50 cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-cyan-950/25 hover:via-slate-900/40 hover:to-transparent px-3 sm:px-5 rounded-xl hover:translate-x-1"
              >
                <div className="flex items-center gap-6 sm:gap-8 min-w-0">
                  <span className="w-20 shrink-0 text-5xl sm:text-6xl font-mono font-bold text-slate-800 transition-all duration-300 group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] select-none">
                    {row.num}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white transition-all duration-300 group-hover:text-cyan-300 flex items-center gap-3">
                    <span>{row.name}</span>
                    <ArrowRight className="w-5 h-5 text-cyan-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden sm:inline" />
                  </h3>
                </div>
                <p className="text-slate-400 text-sm md:text-right max-w-md pl-26 md:pl-0 transition-colors duration-300 group-hover:text-slate-200">
                  {row.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FOOTER: "Tell us what you need." */}
      <section className="py-24 bg-gradient-to-r from-slate-950 via-[#06102a] to-slate-950 border-t border-slate-800 text-center relative overflow-hidden">
        {/* Subtle ambient glow behind footer */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
          <h2 className="text-4xl sm:text-5xl font-bold text-white font-display">
            Tell us what you need.
          </h2>
          <p className="text-slate-400 text-base max-w-xl mx-auto">
            Describe your project, workflow challenge, or product idea. We'll map the exact architecture and system to build it.
          </p>
          <div className="pt-2">
            <button
              onClick={() => onNavigate('ask')}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full text-base font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] transition-all duration-200"
            >
              <span>Ask CoreIQ</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
