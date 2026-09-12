import React, { useState } from 'react';
import { 
  ArrowRight, 
  Copy, 
  Check, 
  Zap, 
  Layers, 
  Crosshair 
} from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { CosmicCTABanner } from '../components/common/CosmicCTABanner';
import { PageHeroVisual } from '../components/common/PageHeroVisual';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { NavRoute } from '../types';
import { TOOLS_LIST, TOOL_CATEGORIES, TOOL_PHILOSOPHY } from '../data/toolsData';

interface ToolsPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

export const ToolsPage: React.FC<ToolsPageProps> = ({ onNavigate, onAsk }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [promptInput, setPromptInput] = useState('');
  const [enhancedOutput, setEnhancedOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredTools = selectedCategory === 'All'
    ? TOOLS_LIST
    : TOOLS_LIST.filter(t => t.category === selectedCategory);

  const toolPills = [
    { label: 'Browse tools', query: 'Show me all tools in Core IQ' },
    { label: 'Prompt Enhancer', query: 'I want to try the Prompt Enhancer tool' },
    { label: 'Explore workflows', query: 'How can I connect tools into an automation workflow?' },
  ];

  const handleEnhancePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = promptInput.trim() || 'Create an automated customer onboarding sequence for a SaaS platform';
    
    const enhanced = `[ROLE & PERSONA]
You are a Principal Product Strategist and Senior AI Automation Architect.

[OBJECTIVE]
${raw}

[CONTEXT & REQUIREMENTS]
- Deliver clear, actionable steps prioritized by business impact.
- Structure logic with fail-safes and human-in-the-loop validation triggers.
- Include suggested tech stack connectors (Webhooks, CRM, Vector DB).

[DESIRED OUTPUT FORMAT]
Provide an executive summary, followed by a chronological execution table with milestone verification metrics.`;

    setEnhancedOutput(enhanced);
  };

  const handleCopy = () => {
    if (enhancedOutput) {
      navigator.clipboard.writeText(enhancedOutput);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="w-full relative">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[75vh] flex items-center pt-8 pb-16 lg:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-7 z-10">
              <span className="text-xs font-mono tracking-[0.3em] text-cyan-400 uppercase">
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
            </div>

            {/* Right Visual: Futuristic Precision Matrix */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <PageHeroVisual>
                <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
                  <div className="relative w-full h-full rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.3)]">
                    <img
                      src={ASSETS.toolsCube}
                      alt="Core IQ Tools Cube"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-transparent opacity-40" />
                  </div>
                </div>
              </PageHeroVisual>
            </div>

          </div>
        </div>
      </section>

      {/* 2. FEATURED TOOL BLOCK */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="full-width rounded-3xl bg-gradient-to-br from-slate-900 via-[#060d22] to-slate-950 border border-cyan-500/20 p-8 sm:p-12 relative overflow-hidden backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.12)]">
          {/* Luminous aura behind */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            
            {/* Left: Info */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
                FEATURED TOOL
              </span>

              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display leading-snug">
                Prompt Enhancer
              </h2>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
                Turn vague ideas into clear, effective prompts that get better results from any AI model. Describe what you're trying to do and get a polished, structured prompt instantly.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => onAsk('I want to test the Prompt Enhancer tool with a custom objective')}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all duration-200"
                >
                  <span>Try Prompt Enhancer</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Right: Mock Tool Interface with Input & Structured Output Preview */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 sm:p-6 space-y-4 backdrop-blur-md shadow-2xl">
                {/* Input Area */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="text-cyan-400 uppercase tracking-wider">Input / User Intent</span>
                    <span className="text-slate-500">Raw prompt</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300">
                    "Write an executive briefing for our AI infrastructure migration"
                  </div>
                </div>

                {/* Center Transition */}
                <div className="flex items-center justify-center py-0.5">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-[11px] font-mono">
                    <span>Structuring prompt parameters</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                </div>

                {/* Structured Output Preview with 3 labelled result rows */}
                <div className="space-y-2.5 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-cyan-400 uppercase tracking-wider">Structured Result</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px]">
                      Optimized
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono shrink-0 mt-0.5">
                        ROLE
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        Principal Enterprise Architect & Technology Strategist
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-mono shrink-0 mt-0.5">
                        CONSTRAINTS
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        Quantify ROI, outline roll-back contingencies, and cite latency SLA
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start gap-3">
                      <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px] font-mono shrink-0 mt-0.5">
                        FORMAT
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        3-Tier executive matrix with decision milestones & telemetry triggers
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. EXPLORE TOOLS CATALOGUE */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 mb-12">
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
            {TOOL_CATEGORIES.map((cat) => {
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

        {/* Minimal Editorial Tool Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredTools.map((tool, idx) => {
            const isPro = tool.category === 'Automation' || tool.category === 'Code' || idx % 3 === 2;
            return (
              <div
                key={tool.id}
                onClick={() => onAsk(`Open and run the ${tool.title} tool. What does it do and how can I execute it?`)}
                className="group cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-auto min-h-[200px] relative border border-slate-800 hover:border-cyan-500/30 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                      {tool.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono tracking-widest px-2 py-0.5 rounded-md ${
                        isPro
                          ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {isPro ? 'PRO' : 'FREE'}
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-300 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
                    {tool.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-sm mt-4">
                  <span className="text-cyan-400 font-medium group-hover:underline">
                    Open
                  </span>
                  <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. DESIGN PHILOSOPHY */}
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

      {/* 5. BOTTOM CTA BANNER */}
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
