import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Zap, 
  LayoutGrid, 
  GraduationCap, 
  ArrowRight, 
  Cpu, 
  Layers, 
  Monitor, 
  CheckCircle2, 
  Loader2, 
  Search, 
  Link as LinkIcon 
} from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { NavRoute } from '../types';

interface HomePageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onAsk }) => {
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0, active: false });
  const heroRef = useRef<HTMLDivElement>(null);

  const homePills = [
    { label: 'Build a website', query: 'I need a modern website' },
    { label: 'Automate my business', query: 'I want to automate my business workflows' },
    { label: 'Create an app', query: 'I want to build a custom web app' },
    { label: 'Explore solutions', query: 'What solutions does Core IQ offer?' },
  ];

  const handleHeroMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    setHeroTilt({ x, y, active: true });
  };

  const handleHeroMouseLeave = () => {
    setHeroTilt({ x: 0, y: 0, active: false });
  };

  return (
    <div className="w-full relative">
      {/* 1. HERO SECTION */}
      <section 
        ref={heroRef}
        onMouseMove={handleHeroMouseMove}
        onMouseLeave={handleHeroMouseLeave}
        className="relative min-h-[88vh] flex items-center pt-8 pb-16 lg:py-20 overflow-hidden"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-7 space-y-7 z-10">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold tracking-[0.25em] text-slate-400 uppercase">
                  IDEAS + INTELLIGENCE + ACTION
                </span>
              </div>

              {/* Massive Headline */}
              <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display leading-[1.05]">
                Build what <br />
                <span className="gradient-text-phoenix">matters.</span>
              </h1>

              {/* Subtitle */}
              <p className="text-slate-300 text-base sm:text-lg lg:text-xl font-normal max-w-xl leading-relaxed">
                Core IQ is your AI partner for building, automating and scaling what's next. Describe your vision and let's create it — together.
              </p>

              {/* Ask Core IQ Input Bar */}
              <div className="pt-2">
                <AskCoreIQBar
                  placeholder="Ask Core IQ anything..."
                  pills={homePills}
                  onAsk={onAsk}
                  size="large"
                />
              </div>

              {/* Scroll to explore */}
              <div className="pt-8 flex items-center gap-3 text-xs tracking-widest text-slate-500 uppercase font-medium">
                <span className="w-8 h-[1px] bg-slate-700" />
                <span>SCROLL TO EXPLORE</span>
              </div>
            </div>

            {/* Right Visual Column: The Iconic Core IQ Phoenix Energy Core with 3D Parallax & Depth */}
            <div className="lg:col-span-5 relative flex justify-center items-center select-none" style={{ perspective: '1000px' }}>
              {/* Floating metadata badge with spatial parallax */}
              <div 
                className="absolute -top-6 right-2 sm:right-6 z-20 text-[10px] sm:text-xs font-semibold tracking-[0.2em] text-cyan-300/80 uppercase text-right transition-transform duration-500 ease-out"
                style={{
                  transform: heroTilt.active 
                    ? `translate3d(${heroTilt.x * -16}px, ${heroTilt.y * -14}px, 25px)` 
                    : 'translate3d(0, 0, 0)',
                }}
              >
                <div className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">INTELLIGENCE</div>
                <div>THAT BUILDS</div>
                <div>WITH YOU</div>
              </div>

              {/* The Glowing Energy Core Phoenix Visual with 3D Tilt */}
              <div 
                className="relative w-full max-w-[480px] aspect-square flex items-center justify-center transition-transform duration-500 ease-out"
                style={{
                  transform: heroTilt.active
                    ? `rotateY(${heroTilt.x * 8}deg) rotateX(${heroTilt.y * -8}deg) translateZ(10px)`
                    : 'rotateY(0deg) rotateX(0deg) translateZ(0px)',
                  transformStyle: 'preserve-3d',
                }}
              >
                {/* Multi-layered ambient glows behind the core with differential parallax */}
                <div 
                  className="absolute inset-0 rounded-full bg-cyan-500/25 blur-[85px] animate-pulse-glow transition-transform duration-700 ease-out" 
                  style={{
                    transform: heroTilt.active ? `translate(${heroTilt.x * 20}px, ${heroTilt.y * 20}px)` : 'none',
                  }}
                />
                <div 
                  className="absolute inset-8 rounded-full bg-purple-600/30 blur-[65px] transition-transform duration-1000 ease-out"
                  style={{
                    transform: heroTilt.active ? `translate(${heroTilt.x * -15}px, ${heroTilt.y * -15}px)` : 'none',
                  }}
                />
                <div className="absolute inset-16 rounded-full bg-pink-500/20 blur-[50px]" />

                {/* Floating ambient orbital particles around the Phoenix Core */}
                <div className="absolute -top-3 left-1/4 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#22d3ee] animate-particle-1 pointer-events-none" />
                <div className="absolute -bottom-2 right-1/4 w-1.5 h-1.5 rounded-full bg-pink-400 shadow-[0_0_8px_#ec4899] animate-particle-2 pointer-events-none" />
                <div className="absolute top-1/2 -right-4 w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_10px_#c084fc] animate-particle-3 pointer-events-none" />

                {/* Core IQ Phoenix Energy Core Image */}
                <div className="relative w-full h-full rounded-3xl overflow-hidden border border-cyan-500/30 shadow-[0_0_65px_rgba(6,182,212,0.3)] animate-float-slow transition-shadow duration-500 hover:shadow-[0_0_90px_rgba(6,182,212,0.45)]">
                  <img
                    src="/logo.png"
                    alt="Core IQ Phoenix Energy Core"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover object-center transform hover:scale-[1.02] transition-transform duration-700 ease-out"
                  />
                  {/* Subtle inner vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent opacity-40 pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-transparent to-purple-500/10 opacity-60 pointer-events-none" />
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. CAPABILITY STRIP (5 PILLARS) */}
      <section className="border-y border-slate-800/60 bg-[#04091a]/60 backdrop-blur-md py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6">
            
            {/* 1. AI Agents */}
            <div 
              onClick={() => onNavigate('solutions')} 
              className="group cursor-pointer p-4 rounded-2xl hover:bg-slate-900/40 border border-transparent hover:border-cyan-500/20 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-white font-semibold text-base mb-1.5 group-hover:text-cyan-300 transition-colors">
                AI Agents
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Specialised agents working together to get real results.
              </p>
            </div>

            {/* 2. Integrations */}
            <div 
              onClick={() => onNavigate('solutions')} 
              className="group cursor-pointer p-4 rounded-2xl hover:bg-slate-900/40 border border-transparent hover:border-cyan-500/20 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-indigo-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Cpu className="w-5 h-5 text-indigo-400" />
              </div>
              <h3 className="text-white font-semibold text-base mb-1.5 group-hover:text-indigo-300 transition-colors">
                Integrations
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Connect your tools, data and systems effortlessly.
              </p>
            </div>

            {/* 3. Automation */}
            <div 
              onClick={() => onNavigate('solutions')} 
              className="group cursor-pointer p-4 rounded-2xl hover:bg-slate-900/40 border border-transparent hover:border-cyan-500/20 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-white font-semibold text-base mb-1.5 group-hover:text-blue-300 transition-colors">
                Automation
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Remove the busy work and focus on what matters.
              </p>
            </div>

            {/* 4. Apps & Websites */}
            <div 
              onClick={() => onNavigate('apps')} 
              className="group cursor-pointer p-4 rounded-2xl hover:bg-slate-900/40 border border-transparent hover:border-cyan-500/20 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <LayoutGrid className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-white font-semibold text-base mb-1.5 group-hover:text-purple-300 transition-colors">
                Apps & Websites
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Custom solutions built for your unique needs.
              </p>
            </div>

            {/* 5. Learn & Grow */}
            <div 
              onClick={() => onNavigate('learn')} 
              className="group cursor-pointer p-4 rounded-2xl hover:bg-slate-900/40 border border-transparent hover:border-cyan-500/20 transition-all duration-300"
            >
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500/20 to-rose-600/20 border border-pink-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-5 h-5 text-pink-400" />
              </div>
              <h3 className="text-white font-semibold text-base mb-1.5 group-hover:text-pink-300 transition-colors">
                Learn & Grow
              </h3>
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                Build your skills with courses, guides and more.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* 3. THE CORE IQ PROCESS ("From idea to reality") */}
      <section className="py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Description */}
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
                THE CORE IQ PROCESS
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-display">
                From idea to reality
              </h2>
              <p className="text-slate-300 text-base leading-relaxed">
                You bring the vision. Core IQ handles the rest — analysing, planning, integrating and building with the power of AI, automation and the swarm.
              </p>
              <div>
                <button
                  onClick={() => onNavigate('solutions')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/40 hover:border-cyan-400 transition-all duration-200"
                >
                  <span>See how it works</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Connected Flow Visualization */}
            <div className="lg:col-span-7 relative">
              <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#060c22] to-slate-950 border border-cyan-500/25 shadow-[0_0_60px_rgba(6,182,212,0.18)] overflow-hidden">
                {/* Luminous background wave lines with dynamic animated dash traveling */}
                <div className="absolute inset-0 opacity-40 pointer-events-none">
                  <svg className="w-full h-full" viewBox="0 0 500 350" fill="none">
                    <path 
                      d="M 50 180 C 150 100, 300 260, 450 160" 
                      stroke="#06b6d4" 
                      strokeWidth="3" 
                      className="animate-flow-dash"
                    />
                    <path 
                      d="M 50 200 C 180 280, 280 80, 450 180" 
                      stroke="#a855f7" 
                      strokeWidth="2.5" 
                      opacity="0.8" 
                      className="animate-reverse-flow-dash"
                    />
                  </svg>
                </div>

                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  
                  {/* Left: Input Intent Card */}
                  <div className="p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/35 shadow-xl space-y-3.5 transform hover:scale-[1.02] transition-transform duration-300">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                        CoreIQ Intent
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-white text-sm font-medium leading-relaxed">
                      "I want to automate my customer support process."
                    </p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="h-1.5 w-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse" />
                      <span className="h-1.5 w-6 rounded-full bg-slate-700" />
                    </div>
                  </div>

                  {/* Right: Connected Progression Nodes with Live Operational Beacons */}
                  <div className="space-y-3">
                    {/* Node 1 */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/70 border border-cyan-500/25 shadow-sm hover:border-cyan-400/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                        <span className="text-xs sm:text-sm text-slate-200">Analysing your needs...</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-ping" />
                    </div>

                    {/* Node 2 */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/70 border border-purple-500/25 shadow-sm hover:border-purple-400/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <Search className="w-4 h-4 text-purple-400" />
                        <span className="text-xs sm:text-sm text-slate-200">Finding the best solution...</span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    </div>

                    {/* Node 3 */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/70 border border-indigo-500/25 shadow-sm hover:border-indigo-400/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <LinkIcon className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs sm:text-sm text-slate-200">Connecting your tools...</span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>

                    {/* Node 4 */}
                    <div className="flex items-center justify-between p-3.5 rounded-xl bg-cyan-950/60 border border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-4 h-4 text-cyan-300" />
                        <span className="text-xs sm:text-sm text-cyan-200 font-semibold">Building your system...</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
                    </div>
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. BANNER: MORE THAN A WEBSITE ("It's an intelligent creation environment.") */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden border border-cyan-500/20 p-8 sm:p-12 lg:p-16 bg-gradient-to-r from-[#071330] via-[#0b102b] to-[#040817]">
          {/* Cosmic backdrop light */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 pointer-events-none">
            <img 
              src={ASSETS.cosmicHorizon} 
              alt="Cosmic Horizon" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-right"
            />
          </div>

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-cyan-400 uppercase">
                MORE THAN A WEBSITE
              </span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white font-display">
                It's an intelligent <br />
                creation environment.
              </h3>
              <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full mt-4" />
            </div>

            <div className="lg:col-span-5 space-y-5">
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Core IQ isn't just a website — it's a living, evolving platform where ideas become solutions, powered by AI, the swarm and a universe of integrations.
              </p>
              <button
                onClick={() => onNavigate('solutions')}
                className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-semibold group transition-colors"
              >
                <span>Explore Core IQ</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EXPLORE CORE IQ ("What would you like to create?") */}
      <section className="py-20 lg:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase">
              EXPLORE CORE IQ
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white font-display mt-2">
              What would you like to create?
            </h2>
          </div>
          <button
            onClick={() => onNavigate('solutions')}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-400 hover:text-cyan-300 transition-colors"
          >
            <span>View all solutions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 5 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {/* Card 1: AI Agents */}
          <div
            onClick={() => onNavigate('solutions')}
            className="group cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-56"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-300 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1 group-hover:text-cyan-300 transition-colors">
                AI Agents
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Custom agents for your business needs.
              </p>
            </div>
          </div>

          {/* Card 2: Automation */}
          <div
            onClick={() => onNavigate('solutions')}
            className="group cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-56"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-300 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1 group-hover:text-blue-300 transition-colors">
                Automation
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Streamline workflows and save time.
              </p>
            </div>
          </div>

          {/* Card 3: Apps */}
          <div
            onClick={() => onNavigate('apps')}
            className="group cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-56"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center">
                <LayoutGrid className="w-5 h-5 text-purple-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-purple-300 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1 group-hover:text-purple-300 transition-colors">
                Apps
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Powerful apps, built for your vision.
              </p>
            </div>
          </div>

          {/* Card 4: Websites */}
          <div
            onClick={() => onNavigate('apps')}
            className="group cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-56"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-emerald-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-300 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1 group-hover:text-emerald-300 transition-colors">
                Websites
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Modern, scalable web experiences.
              </p>
            </div>
          </div>

          {/* Card 5: Integrations */}
          <div
            onClick={() => onNavigate('solutions')}
            className="group cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-56"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-300 group-hover:translate-x-1 transition-all" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-1 group-hover:text-indigo-300 transition-colors">
                Integrations
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Connect everything in your ecosystem.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
