import React from 'react';
import { 
  Sparkles, 
  Lightbulb, 
  Cpu, 
  Zap, 
  ArrowRight, 
  Compass, 
  Layers, 
  Clock, 
  CheckCircle2 
} from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { CosmicCTABanner } from '../components/common/CosmicCTABanner';
import { NavRoute } from '../types';
import { ABOUT_PILLARS, CORE_BELIEFS } from '../data/aboutData';
import { PROCESS_STEPS } from '../data/solutionsData';

interface AboutPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, onAsk }) => {
  const aboutPills = [
    { label: 'Our philosophy', query: 'What is the philosophy behind Core IQ?' },
    { label: 'How we build', query: 'How does Core IQ design and build solutions?' },
    { label: 'The vision', query: 'What is the long term vision of Core IQ Create?' },
  ];

  const getPillarIcon = (iconName: string) => {
    switch (iconName) {
      case 'Lightbulb': return Lightbulb;
      case 'Cpu': return Cpu;
      case 'Zap': return Zap;
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
                ABOUT CORE IQ
              </span>

              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display leading-[1.05]">
                Intelligence should <br />
                <span className="gradient-text-phoenix">help you create.</span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg lg:text-xl max-w-xl leading-relaxed">
                We believe AI shouldn't just answer questions — it should help people build, automate, solve problems and bring meaningful ideas to life. That's why we created Core IQ.
              </p>

              <div className="pt-2">
                <AskCoreIQBar
                  placeholder="Ask Core IQ anything..."
                  pills={aboutPills}
                  onAsk={onAsk}
                  size="large"
                />
              </div>
            </div>

            {/* Right Visual: Luminous Holographic AI Intelligence Profile */}
            <div className="lg:col-span-5 relative flex justify-center items-center">
              <div className="relative w-full max-w-[480px] aspect-square flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-[90px] animate-pulse-glow" />
                <div className="relative w-full h-full rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.3)] animate-float-slow">
                  <img
                    src={ASSETS.agentHead}
                    alt="Core IQ Intelligence Mind"
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

      {/* 2. "IDEAS + INTELLIGENCE + ACTION" (3 PILLARS) */}
      <section className="py-20 lg:py-28 border-t border-slate-800/60 bg-[#03081c]/50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
              OUR PHILOSOPHY
            </span>
            <h2 className="text-4xl sm:text-5xl font-bold text-white font-display">
              Ideas. Intelligence. <span className="gradient-text-primary">Action.</span>
            </h2>
            <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
              The formula behind everything we create. It's not enough to have an idea, or to have powerful technology. You need the bridge between them.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ABOUT_PILLARS.map((pillar) => {
              const Icon = getPillarIcon(pillar.iconName);
              return (
                <div 
                  key={pillar.title}
                  className="p-8 rounded-3xl coreiq-glass-card space-y-5 border border-cyan-500/20 relative"
                >
                  <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-cyan-300" />
                  </div>
                  <div>
                    <span className="text-xs font-semibold tracking-wider text-cyan-400 uppercase block mb-1">
                      {pillar.subtitle}
                    </span>
                    <h3 className="text-white font-bold text-2xl font-display">
                      {pillar.title}
                    </h3>
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. CORE BELIEFS ("Built on first principles") */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-4 mb-14">
          <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
            WHAT WE BELIEVE
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display">
            Built on first principles.
          </h2>
          <p className="text-slate-300 text-base max-w-2xl leading-relaxed">
            Honest craftsmanship and practical utility guide how we design, build, and interact.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CORE_BELIEFS.map((belief, idx) => (
            <div
              key={idx}
              className="p-8 rounded-2xl coreiq-glass-card space-y-3 border border-slate-800 hover:border-cyan-500/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                <h3 className="text-white font-bold text-xl font-display">
                  {belief.title}
                </h3>
              </div>
              <p className="text-slate-400 text-sm sm:text-base leading-relaxed pl-5.5">
                {belief.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. "FROM VISION TO WORKING REALITY" (Creation Model) */}
      <section className="py-20 lg:py-28 border-t border-slate-800/60 bg-[#03081c]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 mb-14 text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
              THE CREATION MODEL
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display">
              From vision to working reality.
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {PROCESS_STEPS.map((step) => (
              <div 
                key={step.number}
                className="p-5 rounded-2xl coreiq-glass-card flex flex-col justify-between h-40 border border-cyan-500/15 text-center items-center"
              >
                <div className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-xs font-mono font-bold text-cyan-300">
                  {step.number}
                </div>
                <div>
                  <div className="text-xs font-bold tracking-wider text-white uppercase mb-1">
                    {step.label}
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {step.sublabel}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. BOTTOM CTA BANNER */}
      <CosmicCTABanner
        eyebrow="READY TO CREATE?"
        headline="Let's create what matters."
        subtext="Have an idea, a problem to solve, or something you want to build? Core IQ is ready."
        inputPlaceholder="Ask Core IQ anything..."
        onAsk={onAsk}
      />
    </div>
  );
};
