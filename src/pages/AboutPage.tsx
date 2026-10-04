import React from 'react';
import { ArrowRight } from 'lucide-react';
import { NavRoute } from '../types';
import { ScrollReveal } from '../components/common/ScrollReveal';

interface AboutPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

const MANIFESTO_PRINCIPLES = [
  {
    num: '01',
    title: 'Start with the problem.',
    desc: 'Never build technology looking for an application. We isolate root bottlenecks, quantifiable frictions, and user goals before writing a single line.',
  },
  {
    num: '02',
    title: 'Use the smallest useful system.',
    desc: 'Complexity is the enemy of reliability. Deploy the leanest architecture that solves the objective, avoiding bloated dependencies and brittle abstraction layers.',
  },
  {
    num: '03',
    title: 'Connect capability to workflow.',
    desc: 'Isolated AI demos are vanity. Real value occurs when intelligence directly hooks into data pipelines, webhooks, databases, and daily operations.',
  },
  {
    num: '04',
    title: 'Test in reality.',
    desc: 'Synthetic benchmarks do not reflect live conditions. We stress-test workflows against edge cases, dirty inputs, real user friction, and latency demands.',
  },
  {
    num: '05',
    title: 'Improve continuously.',
    desc: 'Launch is day zero. Autonomous agents and workflows must collect telemetry, monitor drift, adapt to new requirements, and compound value over time.',
  },
];

const DELIVERY_STEPS = [
  'UNDERSTAND',
  'DESIGN',
  'BUILD',
  'CONNECT',
  'LAUNCH',
  'IMPROVE',
];

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onAsk }) => {
  return (
    <div className="w-full relative">
      {/* 1. HERO SECTION: Full-viewport opening manifesto */}
      <section className="relative min-h-[85vh] sm:min-h-screen flex items-center justify-center pt-16 pb-20 overflow-hidden">
        {/* Subtle luminous core ambient glow behind text */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center relative z-10 space-y-8">
          <span className="text-xs font-mono tracking-[0.3em] text-cyan-400 uppercase">
            COREIQ CREATE / PHILOSOPHY
          </span>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white font-display leading-[1.05]">
            We build useful intelligence <br />
            <span className="gradient-text-phoenix">into real work.</span>
          </h1>

          {/* Core Principle: IDEAS + INTELLIGENCE + ACTION */}
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 pt-4 text-xl sm:text-2xl md:text-3xl font-bold tracking-wider">
            <span className="text-white hover:text-cyan-300 transition-colors">IDEAS</span>
            <span className="text-cyan-400 font-normal animate-pulse drop-shadow-[0_0_8px_#22d3ee]">+</span>
            <span className="text-white hover:text-cyan-300 transition-colors">INTELLIGENCE</span>
            <span className="text-cyan-400 font-normal animate-pulse drop-shadow-[0_0_8px_#22d3ee]">+</span>
            <span className="text-white hover:text-cyan-300 transition-colors">ACTION</span>
          </div>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed pt-2">
            The bridge between vision and working systems. We engineer focused artificial intelligence that powers real-world automation, tools, and platforms.
          </p>
        </div>
      </section>

      {/* 2. DELIVERY LOOP JOURNEY STRIP */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 py-6 px-6 sm:px-8 backdrop-blur-md shadow-xl hover:border-cyan-500/30 transition-all duration-300">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {DELIVERY_STEPS.map((step, idx) => (
              <React.Fragment key={step}>
                <div className="flex items-center gap-2 sm:gap-3 group/step cursor-default">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] group-hover/step:scale-125 transition-transform" />
                  <span className="text-xs sm:text-sm font-mono tracking-widest text-slate-300 group-hover/step:text-cyan-300 uppercase font-semibold transition-colors">
                    {step}
                  </span>
                </div>
                {idx < DELIVERY_STEPS.length - 1 && (
                  <div className="hidden lg:flex items-center flex-1 mx-2">
                    <div className="h-[1.5px] w-full bg-gradient-to-r from-cyan-500/30 via-cyan-400/60 to-cyan-500/30" />
                    <span className="text-cyan-400 text-xs font-mono ml-1">→</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PRINCIPLES STREAM: 5 full-width numbered editorial rows */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <ScrollReveal>
          <div className="space-y-3 mb-16">
            <span className="text-xs font-mono tracking-[0.3em] text-cyan-400 uppercase">
              FOUNDATIONAL PRINCIPLES
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display">
              How we think. How we build.
            </h2>
            <p className="text-slate-400 text-base max-w-2xl">
              Five core principles that determine every architectural decision, prompt, integration, and interface we deploy.
            </p>
          </div>
        </ScrollReveal>

        {/* Editorial Stream Container with animated vertical line */}
        <div className="relative border-t border-slate-800/80">
          <div className="absolute left-[38px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-cyan-500/30 via-purple-500/20 to-transparent hidden lg:block animate-line-grow" />

          {MANIFESTO_PRINCIPLES.map((principle) => (
            <div
              key={principle.num}
              className="group py-10 sm:py-12 border-b border-slate-800/80 transition-all duration-300 hover:bg-gradient-to-r hover:from-cyan-950/20 hover:via-slate-900/40 hover:to-transparent px-4 sm:px-6 -mx-4 sm:-mx-6 rounded-2xl hover:translate-x-1"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 items-center">
                {/* Large Monospace Number */}
                <div className="md:col-span-2">
                  <span className="font-mono text-5xl sm:text-6xl text-slate-800 group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-all duration-300 select-none">
                    {principle.num}
                  </span>
                </div>

                {/* Principle Statement */}
                <div className="md:col-span-4">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300 font-display flex items-center gap-2">
                    <span>{principle.title}</span>
                    <ArrowRight className="w-5 h-5 text-cyan-400 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 hidden md:inline" />
                  </h3>
                </div>

                {/* Description */}
                <div className="md:col-span-6">
                  <p className="text-slate-400 text-sm sm:text-base leading-relaxed group-hover:text-slate-300 transition-colors duration-300">
                    {principle.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. CLOSING CTA */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center border-t border-slate-800/80 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="max-w-2xl mx-auto space-y-6 relative z-10">
          <span className="text-xs font-mono tracking-[0.3em] text-cyan-400 uppercase">
            COLLABORATE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display">
            Ready to build what's next?
          </h2>
          <p className="text-slate-400 text-base leading-relaxed">
            Bring your hardest problem or ambitious concept. CoreIQ will help you map the architecture and build the solution.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('ask')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.5)] hover:shadow-[0_0_35px_rgba(34,211,238,0.7)] hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Ask CoreIQ
            </button>
            <button
              onClick={() => onNavigate('ask')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-semibold text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 hover:bg-cyan-500/15 hover:scale-105 active:scale-95 transition-all duration-200"
            >
              Start a project
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
