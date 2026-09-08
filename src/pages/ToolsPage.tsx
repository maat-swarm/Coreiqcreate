import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  FileText, 
  Image, 
  Code, 
  Database, 
  Terminal, 
  Clock, 
  GitBranch, 
  Copy, 
  Check, 
  Zap, 
  Layers, 
  Crosshair 
} from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { CosmicCTABanner } from '../components/common/CosmicCTABanner';
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
    { label: 'Try a tool', query: 'I want to try the Prompt Enhancer tool' },
    { label: 'See popular', query: 'Which Core IQ tools are most popular?' },
  ];

  const handleEnhancePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = promptInput.trim() || 'Create an automated customer onboarding sequence for a SaaS platform';
    
    // Generates a professional structured prompt
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

  const getToolIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return Sparkles;
      case 'FileText': return FileText;
      case 'Image': return Image;
      case 'Code': return Code;
      case 'Database': return Database;
      case 'Terminal': return Terminal;
      case 'Clock': return Clock;
      case 'GitBranch': return GitBranch;
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
                CORE IQ TOOLS
              </span>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display leading-[1.05]">
                Single-purpose. <br />
                <span className="gradient-text-phoenix">Infinitely useful.</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg lg:text-xl max-w-xl leading-relaxed">
                Fast, focused tools designed to do one thing exceptionally well. No setup required. Just open, create and get back to what you were doing.
              </p>

              <div className="pt-2">
                <AskCoreIQBar
                  placeholder="Ask Core IQ anything..."
                  pills={toolPills}
                  onAsk={onAsk}
                  size="large"
                />
              </div>
            </div>

            {/* Right Visual: Futuristic Glowing Cube Matrix */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-[90px] animate-pulse-glow" />
                <div className="relative w-full h-full rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.3)] animate-float-slow">
                  <img
                    src={ASSETS.toolsCube}
                    alt="Core IQ Tools Cube"
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

      {/* 2. FEATURED INTERACTIVE TOOL: Prompt Enhancer */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-[#060e28] via-[#09153a] to-[#040817] p-8 sm:p-12 lg:p-14 shadow-[0_0_50px_rgba(34,211,238,0.15)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left: Info */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest text-cyan-300 bg-cyan-500/20 border border-cyan-400/40 uppercase">
                  FEATURED TOOL
                </span>
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  FAST & FOCUSED
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
                Prompt Enhancer
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Turn vague ideas into clear, effective prompts that get better results from any AI model. Describe what you're trying to do and get a polished, structured prompt instantly.
              </p>

              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  Instant Output
                </span>
                <span>•</span>
                <span>Zero signup required</span>
              </div>
            </div>

            {/* Right: Live Interactive Prompt Workbench */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-5 sm:p-6 space-y-4 shadow-xl">
                <form onSubmit={handleEnhancePrompt} className="space-y-3">
                  <label className="block text-xs font-semibold tracking-wider text-cyan-300 uppercase">
                    Your Raw Idea or Prompt:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder="e.g. Write a cold outreach email for an automation audit"
                      className="flex-1 rounded-xl bg-slate-900 border border-slate-700/80 px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-semibold text-sm flex items-center gap-2 shrink-0 transition-all shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                    >
                      <span>Enhance</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </button>
                  </div>
                </form>

                {/* Enhanced Result Box */}
                {enhancedOutput && (
                  <div className="pt-3 space-y-2 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-cyan-300">Enhanced Prompt Output</span>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied!' : 'Copy prompt'}</span>
                      </button>
                    </div>
                    <pre className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/20 text-xs font-mono text-slate-200 whitespace-pre-wrap leading-relaxed max-h-56 overflow-y-auto">
                      {enhancedOutput}
                    </pre>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. EXPLORE TOOLS CATALOGUE */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 mb-12">
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
              EXPLORE TOOLS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
              Explore the toolkit.
            </h2>
          </div>

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

        {/* 8 Tool Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredTools.map((tool) => {
            const Icon = getToolIcon(tool.iconName);
            return (
              <div
                key={tool.id}
                onClick={() => onAsk(`Open and test the ${tool.title} tool. What does it do and how can I run it?`)}
                className="group cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-64 relative border border-cyan-500/15"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400">
                      {tool.category}
                    </span>
                  </div>

                  <h3 className="text-white font-bold text-lg mb-1.5 group-hover:text-cyan-300 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {tool.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
                  <span className="text-cyan-400 font-medium group-hover:underline">
                    Use tool
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. "WHY SINGLE-PURPOSE TOOLS?" PHILOSOPHY */}
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
        inputPlaceholder="Ask Core IQ anything..."
        onAsk={onAsk}
      />
    </div>
  );
};
