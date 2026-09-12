import React, { useState } from 'react';
import { 
  ArrowRight, 
  Clock, 
  Compass, 
  Wrench, 
  Hammer, 
  Target
} from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { CosmicCTABanner } from '../components/common/CosmicCTABanner';
import { PageHeroVisual } from '../components/common/PageHeroVisual';
import { ScrollReveal } from '../components/common/ScrollReveal';
import { NavRoute } from '../types';
import { LEARN_TOPICS, LEARN_CATEGORIES, FOUR_PILLARS } from '../data/learnData';

interface LearnPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

const EDITORIAL_TOPICS = [
  { num: '01', label: 'AI News', query: 'What are the latest AI news and updates?' },
  { num: '02', label: 'Models', query: 'How to select and evaluate frontier AI models' },
  { num: '03', label: 'Agents', query: 'How do autonomous AI agents work?' },
  { num: '04', label: 'Automation', query: 'How to design intelligent business automations' },
  { num: '05', label: 'Workflows', query: 'Best practices for AI human-in-the-loop workflows' },
  { num: '06', label: 'Prompting', query: 'Advanced prompting engineering and structured output' },
  { num: '07', label: 'Business AI', query: 'How to implement AI across business operations' },
  { num: '08', label: 'Tutorials', query: 'Show me step-by-step AI tutorials' },
  { num: '09', label: 'Tools', query: 'What are the top AI tools and SDKs?' },
  { num: '10', label: 'Guides', query: 'Show me comprehensive Core IQ guides' },
];

export const LearnPage: React.FC<LearnPageProps> = ({ onNavigate, onAsk }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTopics = selectedCategory === 'All'
    ? LEARN_TOPICS
    : LEARN_TOPICS.filter(t => t.category === selectedCategory);

  const learnPills = [
    { label: 'Browse all', query: 'Show me all available Core IQ learning guides' },
    { label: 'Start with basics', query: 'I want to learn the basics of AI and agents' },
    { label: 'Explore workflows', query: 'How to build production AI workflows' },
  ];

  return (
    <div className="w-full relative">
      {/* 1. HERO SECTION */}
      <section className="relative min-h-[75vh] flex items-center pt-8 pb-16 lg:py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-7 z-10">
              <span className="text-xs tracking-[0.3em] text-cyan-400 uppercase font-mono">
                LEARN / COREIQ
              </span>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display leading-[1.05]">
                Learn what matters. <br />
                <span className="gradient-text-phoenix">Build what works.</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg lg:text-xl max-w-xl leading-relaxed">
                Practical AI education for people who want to build real things.
              </p>

              <div className="pt-2">
                <AskCoreIQBar
                  placeholder="Ask CoreIQ what you want to learn..."
                  pills={learnPills}
                  onAsk={onAsk}
                  size="large"
                />
              </div>
            </div>

            {/* Right Visual: Celestial Learning Hologram */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <PageHeroVisual>
                <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
                  <div className="relative w-full h-full rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.3)]">
                    <img
                      src={ASSETS.learnBook}
                      alt="Core IQ Knowledge & Learning"
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

      {/* 2. FEATURED ARTICLE BLOCK */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="full-width rounded-3xl bg-gradient-to-br from-slate-900 via-[#060d22] to-slate-950 border border-cyan-500/20 p-8 sm:p-12 relative overflow-hidden backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.12)]">
          {/* Luminous aura behind */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-[90px] pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            {/* Left side */}
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
                FEATURED
              </span>

              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display leading-snug">
                How to turn an AI idea into a useful workflow.
              </h2>

              <p className="text-slate-400 text-sm sm:text-base leading-relaxed max-w-xl">
                A practical walkthrough of breaking down a business problem, choosing the right AI approach, and building a working automation.
              </p>

              <div className="pt-2">
                <button
                  onClick={() => onAsk('Guide: How to turn an AI idea into a useful workflow')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium border border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/10 hover:border-cyan-400 transition-all duration-200"
                >
                  <span>Read the guide</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right side: 4-Box Connected Workflow Diagram */}
            <div className="lg:col-span-6">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-950/80 p-6 sm:p-8 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs text-slate-500 font-mono mb-6">
                  <span className="text-cyan-400 uppercase tracking-widest">Workflow Architecture</span>
                  <span>4-Stage Pipeline</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
                  {[
                    { step: '01', title: 'Problem', desc: 'Isolate root bottleneck & scope' },
                    { step: '02', title: 'AI Approach', desc: 'Choose model & reasoning tools' },
                    { step: '03', title: 'Build', desc: 'Wire agents & data bridges' },
                    { step: '04', title: 'Result', desc: 'Working high-impact automation' },
                  ].map((box, idx) => (
                    <div
                      key={box.step}
                      className="relative p-4 rounded-xl bg-slate-900/90 border border-cyan-500/20 hover:border-cyan-400/40 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] text-cyan-400">STAGE {box.step}</span>
                        {idx < 3 && (
                          <span className="text-cyan-500/60 hidden sm:inline text-xs font-mono">→</span>
                        )}
                      </div>
                      <h4 className="text-white font-bold text-sm mb-0.5">{box.title}</h4>
                      <p className="text-slate-400 text-xs">{box.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. TOPIC GRID (10 EDITORIAL TOPICS) */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <span className="text-xs font-mono tracking-[0.25em] text-cyan-400 uppercase">
            EXPLORE BY TOPIC
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-display mt-1">
            Browse knowledge streams
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {EDITORIAL_TOPICS.map((topic) => (
            <div
              key={topic.num}
              onClick={() => onAsk(topic.query)}
              className="cursor-pointer rounded-xl border border-slate-800 hover:border-cyan-500/40 bg-slate-900/40 p-4 flex items-center justify-between transition-all duration-200 group"
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs text-slate-500 group-hover:text-cyan-400 transition-colors">
                  {topic.num}
                </span>
                <span className="text-sm font-semibold text-white group-hover:text-cyan-200 transition-colors">
                  {topic.label}
                </span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
            </div>
          ))}
        </div>
      </section>

      {/* 4. LEARNING PATHS */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <span className="text-xs font-mono tracking-[0.25em] text-cyan-400 uppercase">
            STRUCTURED PATHWAYS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-white font-display mt-1">
            Choose your direction
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Path 01 */}
          <div 
            onClick={() => onAsk('Start Path 01: Begin with the fundamentals of AI and work toward my first automation')}
            className="cursor-pointer rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 p-8 transition-all duration-200 group flex flex-col justify-between"
          >
            <div>
              <div className="text-5xl font-mono text-slate-800 group-hover:text-cyan-500/30 transition-colors mb-4">
                01
              </div>
              <span className="text-xs font-mono tracking-wider text-cyan-400 uppercase">
                FOUNDATIONS
              </span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-3 group-hover:text-cyan-300 transition-colors font-display">
                Start Here
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                New to AI? Begin with the fundamentals and work toward your first automation.
              </p>
            </div>
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium pt-4 border-t border-slate-800/80">
              <span>Begin pathway</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Path 02 */}
          <div 
            onClick={() => onAsk('Start Path 02: Deep dive into agents, workflows and real AI systems')}
            className="cursor-pointer rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 p-8 transition-all duration-200 group flex flex-col justify-between"
          >
            <div>
              <div className="text-5xl font-mono text-slate-800 group-hover:text-cyan-500/30 transition-colors mb-4">
                02
              </div>
              <span className="text-xs font-mono tracking-wider text-cyan-400 uppercase">
                ADVANCED SYSTEMS
              </span>
              <h3 className="text-2xl font-bold text-white mt-1 mb-3 group-hover:text-cyan-300 transition-colors font-display">
                Build With AI
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                Already know the basics? Go deeper into agents, workflows and real systems.
              </p>
            </div>
            <div className="flex items-center gap-2 text-cyan-400 text-sm font-medium pt-4 border-t border-slate-800/80">
              <span>Begin pathway</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. CURATED GUIDES CATALOGUE */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-slate-800/60">
        <div className="space-y-6 mb-10">
          <ScrollReveal>
            <div className="space-y-2">
              <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
                CURATED GUIDES
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
                Deep dives for builders.
              </h2>
            </div>
          </ScrollReveal>

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

        {/* Learning Guides Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTopics.map((topic) => (
            <div
              key={topic.id}
              onClick={() => onAsk(`Teach me about: ${topic.title}. Explain key concepts and practical execution.`)}
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

      {/* 6. FOUR PILLARS METHODOLOGY */}
      <section className="py-20 border-t border-slate-800/60 bg-[#03081c]/50 relative">
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

      {/* 7. BOTTOM CTA BANNER */}
      <CosmicCTABanner
        eyebrow="GO FURTHER"
        headline="Keep learning. Keep building."
        subtext="The best creators never stop learning. Tell Core IQ what you want to understand, and we'll guide you to the right resource."
        inputPlaceholder="Ask CoreIQ anything..."
        onAsk={onAsk}
      />
    </div>
  );
};
