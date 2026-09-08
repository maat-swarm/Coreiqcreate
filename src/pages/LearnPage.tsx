import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  BookOpen, 
  Layers, 
  Clock, 
  CheckCircle2, 
  Compass, 
  Wrench, 
  Hammer, 
  Target,
  GraduationCap
} from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { CosmicCTABanner } from '../components/common/CosmicCTABanner';
import { NavRoute } from '../types';
import { LEARN_TOPICS, LEARN_CATEGORIES, FOUR_PILLARS } from '../data/learnData';

interface LearnPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

export const LearnPage: React.FC<LearnPageProps> = ({ onNavigate, onAsk }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeArticle, setActiveArticle] = useState<string | null>(null);

  const filteredTopics = selectedCategory === 'All'
    ? LEARN_TOPICS
    : LEARN_TOPICS.filter(t => t.category === selectedCategory);

  const learnPills = [
    { label: 'Browse all', query: 'Show me all available Core IQ learning guides' },
    { label: 'Start with the basics', query: 'I want to learn the basics of AI and agents' },
    { label: 'Explore topics', query: 'What AI topics can I learn about?' },
  ];

  return (
    <div className="w-full relative">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[85vh] flex items-center pt-8 pb-16 lg:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-7 z-10">
              <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-cyan-400 uppercase">
                LEARN WITH CORE IQ
              </span>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display leading-[1.05]">
                Knowledge that <br />
                <span className="gradient-text-phoenix">empowers.</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg lg:text-xl max-w-xl leading-relaxed">
                Explore practical guides, courses, frameworks and insights to master AI, automation and modern creation. Whether you're just starting or building advanced systems, there's always more to discover.
              </p>

              <div className="pt-2">
                <AskCoreIQBar
                  placeholder="Ask Core IQ anything..."
                  pills={learnPills}
                  onAsk={onAsk}
                  size="large"
                />
              </div>
            </div>

            {/* Right Visual: Luminous Open Celestial Book */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-[90px] animate-pulse-glow" />
                <div className="relative w-full h-full rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.3)] animate-float-slow">
                  <img
                    src={ASSETS.learnBook}
                    alt="Core IQ Knowledge & Learning"
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

      {/* 2. FEATURED PATH: The Core IQ Creation Framework */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-[#060e28] via-[#09153a] to-[#040817] p-8 sm:p-12 lg:p-14 shadow-[0_0_50px_rgba(34,211,238,0.15)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Info */}
            <div className="lg:col-span-6 space-y-6">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold tracking-widest text-cyan-300 bg-cyan-500/20 border border-cyan-400/40 uppercase">
                  FEATURED PATH
                </span>
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  START HERE
                </span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
                The Core IQ Creation Framework
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                A complete, step-by-step methodology for going from raw idea to fully realized AI solution. Learn how to define problems, choose the right tools, build intelligent workflows and iterate with confidence.
              </p>

              <div>
                <button
                  onClick={() => onAsk("I want to learn The Core IQ Creation Framework step by step")}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-sm font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all duration-200"
                >
                  <span>Start this path</span>
                  <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Right: Step Progression Diagram */}
            <div className="lg:col-span-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-cyan-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs text-cyan-400 font-bold">
                    <span>STEP 01</span>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                  </div>
                  <h4 className="text-white font-semibold text-sm">Vision & Problem</h4>
                  <p className="text-slate-400 text-xs">Isolate the root bottleneck and determine real value.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-purple-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs text-purple-400 font-bold">
                    <span>STEP 02</span>
                    <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
                  </div>
                  <h4 className="text-white font-semibold text-sm">Architecture</h4>
                  <p className="text-slate-400 text-xs">Select models, tools, data memory, and security constraints.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-indigo-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs text-indigo-400 font-bold">
                    <span>STEP 03</span>
                    <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_8px_#818cf8]" />
                  </div>
                  <h4 className="text-white font-semibold text-sm">Execution</h4>
                  <p className="text-slate-400 text-xs">Assemble agents, wire automations, and build UI touchpoints.</p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/80 border border-pink-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs text-pink-400 font-bold">
                    <span>STEP 04</span>
                    <span className="w-2 h-2 rounded-full bg-pink-400 shadow-[0_0_8px_#f472b6]" />
                  </div>
                  <h4 className="text-white font-semibold text-sm">Scaling & Ops</h4>
                  <p className="text-slate-400 text-xs">Monitor telemetry, add human feedback, and optimize throughput.</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. EXPLORE TOPICS & GUIDES */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6 mb-12">
          <div className="space-y-2">
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
              EXPLORE TOPICS
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
              Curated guides for builders.
            </h2>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2">
            {LEARN_CATEGORIES.map((cat) => {
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

        {/* 6 Learning Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => onAsk(`Teach me about: ${topic.title}. Explain the key concepts and practical implementation steps.`)}
              className="group cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-72 relative border border-cyan-500/15"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {topic.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-400 text-xs">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{topic.readTime}</span>
                  </div>
                </div>

                <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-300 transition-colors">
                  {topic.title}
                </h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                  {topic.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 font-mono">
                  Level: {topic.level}
                </span>
                <div className="flex items-center gap-1.5 text-cyan-400 font-semibold group-hover:text-cyan-300">
                  <span>Read guide</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. "FOUR PILLARS OF AI MASTERY" */}
      <section className="py-20 lg:py-28 border-t border-slate-800/60 bg-[#03081c]/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
              METHODOLOGY
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white font-display">
              Four pillars of <span className="gradient-text-primary">AI mastery.</span>
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              We focus on practical capability rather than abstract theory. Master these four disciplines to build systems that endure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FOUR_PILLARS.map((pillar) => {
              const Icon = 
                pillar.iconName === 'Compass' ? Compass :
                pillar.iconName === 'Wrench' ? Wrench :
                pillar.iconName === 'Hammer' ? Hammer : Target;

              return (
                <div 
                  key={pillar.title}
                  className="p-6 rounded-2xl coreiq-glass-card space-y-4 border border-cyan-500/15"
                >
                  <div className="w-11 h-11 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-cyan-300" />
                  </div>
                  <h3 className="text-white font-bold text-lg">
                    {pillar.title}
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CTA BANNER */}
      <CosmicCTABanner
        eyebrow="GO FURTHER"
        headline="Keep learning. Keep building."
        subtext="The best creators never stop learning. Tell Core IQ what you want to understand, and we'll guide you to the right resource."
        inputPlaceholder="Ask Core IQ anything..."
        onAsk={onAsk}
      />
    </div>
  );
};
