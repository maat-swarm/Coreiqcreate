import React, { useState, useRef, Suspense, lazy } from 'react';
import { Sparkles, Zap, LayoutGrid, GraduationCap, ArrowRight, Cpu, Layers, Monitor, CheckCircle2, Loader2, Search, Link as LinkIcon } from 'lucide-react';
import { ASSETS } from '../assets/images';
import { AskCoreIQBar } from '../components/common/AskCoreIQBar';
import { NavRoute } from '../types';


interface HomePageProps { onNavigate: (r: NavRoute) => void; onAsk: (q: string) => void; }

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, onAsk }) => {
  const [tilt, setTilt] = useState({ x: 0, y: 0, on: false });
  const heroRef = useRef<HTMLDivElement>(null);

  const pills = [
    { label: 'Build a website',      query: 'I need a modern website' },
    { label: 'Automate my business', query: 'I want to automate my business workflows' },
    { label: 'Create an app',        query: 'I want to build a custom web app' },
    { label: 'Explore solutions',    query: 'What solutions does Core IQ offer?' },
  ];

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!heroRef.current) return;
    const r = heroRef.current.getBoundingClientRect();
    setTilt({ x: (e.clientX - r.left) / r.width * 2 - 1, y: (e.clientY - r.top) / r.height * 2 - 1, on: true });
  };

  return (
    <div className="w-full relative">

      {/* HERO */}
      <section ref={heroRef} onMouseMove={onMove} onMouseLeave={() => setTilt({ x:0, y:0, on:false })}
        className="relative min-h-[60vh] lg:min-h-[85vh] flex items-center pt-8 pb-16 lg:py-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background:'radial-gradient(ellipse 65% 65% at 70% 50%,rgba(57,123,255,0.10) 0%,transparent 70%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Left */}
            <div className="lg:col-span-6 xl:col-span-7 space-y-8 z-10">
              <div className="reveal-up inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/[0.08] backdrop-blur-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-beacon" />
                <span className="text-xs font-semibold tracking-[0.2em] text-cyan-300/80 uppercase">Ideas · Intelligence · Action</span>
              </div>

              <div className="space-y-1">
                <h1 className="reveal-up text-5xl sm:text-6xl xl:text-[72px] font-bold tracking-tight text-white font-display leading-[1.02]">
                  Build what
                </h1>
                <h1 className="reveal-up text-5xl sm:text-6xl xl:text-[72px] font-bold tracking-tight font-display leading-[1.02] gradient-text-phoenix">
                  matters.
                </h1>
              </div>

              <p className="reveal-up text-slate-300 text-base sm:text-lg lg:text-xl max-w-lg leading-relaxed">
                CoreIQ is your AI partner for building, automating and scaling what's next. Describe your vision and let's create it — together.
              </p>

              <div className="reveal-up pt-1">
                <AskCoreIQBar placeholder="Tell us what you're trying to accomplish..." pills={pills} onAsk={onAsk} size="large" />
              </div>

              <div className="reveal-up pt-6 flex items-center gap-3 text-xs tracking-widest text-slate-600 uppercase font-medium">
                <span className="w-8 h-[1px] bg-slate-800" />
                <span>Scroll to explore</span>
              </div>
            </div>

            {/* Right — Environmental Viewport framing the Living Mascot */}
            <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end items-center select-none reveal-fade">
              <div className="relative w-full max-w-[480px] h-[360px] sm:h-[420px] lg:h-[460px] flex flex-col justify-end p-4 sm:p-6 pointer-events-auto">
                {/* Ethereal HUD Viewfinder Corner Ticks */}
                <div 
                  className="absolute inset-0 pointer-events-none transition-transform duration-700 ease-out"
                  style={{
                    transform: tilt.on ? `translate3d(${tilt.x * 12}px, ${tilt.y * 12}px, 0)` : 'none',
                  }}
                >
                  {/* Top-left corner tick */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyan-400/40 rounded-tl-lg" />
                  {/* Top-right corner tick */}
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyan-400/40 rounded-tr-lg" />
                  {/* Bottom-left corner tick */}
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyan-400/40 rounded-bl-lg" />
                  {/* Bottom-right corner tick */}
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyan-400/40 rounded-br-lg" />

                  {/* Subtle Central Target Reticle */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-cyan-500/10" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-purple-500/10 animate-spin-slow" />
                </div>

                {/* Docked Agent Sentinel Telemetry HUD (Anchored to lower edge to keep mascot face & chest visible) */}
                <div 
                  className="relative p-4 sm:p-5 rounded-xl border border-cyan-500/25 bg-[#030712]/70 backdrop-blur-xl shadow-[0_0_40px_rgba(25,217,255,0.06)] w-full text-left space-y-3 transition-all duration-500 hover:border-cyan-400/50"
                  style={{
                    transform: tilt.on ? `translate3d(${tilt.x * 8}px, ${tilt.y * 8}px, 0)` : 'none',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#19d9ff] animate-pulse" />
                      <span className="text-[11px] font-mono tracking-widest text-cyan-300 font-semibold uppercase">COREIQ SENTINEL</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 tracking-wider">SYSTEM // ONLINE</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    Intelligent environmental presence active. Connect your intent to synthesize agents, workflows, and tools.
                  </p>

                  {/* Micro Quick Actions connected to Ask CoreIQ */}
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      onClick={() => onAsk("I want to build an AI agent")}
                      className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-[11px] text-slate-300 hover:text-cyan-200 transition-colors truncate flex items-center gap-1.5"
                    >
                      <span className="text-cyan-400 font-mono text-[10px]">01</span>
                      <span>AI Agent</span>
                    </button>
                    <button
                      onClick={() => onAsk("I want to build a custom web app")}
                      className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/50 text-[11px] text-slate-300 hover:text-purple-200 transition-colors truncate flex items-center gap-1.5"
                    >
                      <span className="text-purple-400 font-mono text-[10px]">02</span>
                      <span>Web App</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CAPABILITY STRIP */}
      <section className="border-y border-slate-800/50 bg-[#04091a]/70 backdrop-blur-md py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 stagger-children">
            {[
              { Icon:Sparkles, c:'cyan',   label:'AI Agents',      desc:'Autonomous systems that reason, act and deliver — without you lifting a finger.', r:'solutions' },
              { Icon:Cpu,      c:'indigo', label:'Integrations',   desc:'Every tool, API and platform — unified into one intelligent ecosystem.',        r:'solutions' },
              { Icon:Zap,      c:'blue',   label:'Automation',     desc:'Eliminate repetitive work. Let intelligent workflows run your operations.',           r:'solutions' },
              { Icon:LayoutGrid,c:'purple',label:'Apps & Websites',desc:"Digital experiences that don't just look premium — they perform.",             r:'apps'      },
              { Icon:GraduationCap,c:'pink',label:'Learn & Grow',  desc:'Practical AI education for people who want to build real things.',         r:'learn'     },
            ].map(({ Icon, c, label, desc, r }) => (
              <div key={label} onClick={() => onNavigate(r as NavRoute)}
                className={`reveal-up group cursor-pointer p-4 rounded-2xl hover:bg-slate-900/40 border border-transparent hover:border-${c}-500/20 transition-all duration-300`}>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-${c}-500/20 to-${c}-600/20 border border-${c}-400/30 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
                  <Icon className={`w-5 h-5 text-${c}-400`} />
                </div>
                <h3 className={`text-white font-semibold text-base mb-1.5 group-hover:text-${c}-300 transition-colors`}>{label}</h3>
                <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESS */}
      <section className="py-24 lg:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-5 flex items-center justify-center">
          <div className="relative w-full rounded-3xl overflow-hidden border border-cyan-500/20 shadow-[0_0_60px_rgba(25,217,255,0.15)]" style={{aspectRatio:'16/9'}}>
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/assets/backgrounds/coreiq-world.webp"
              className="w-full h-full object-cover"
            >
              <source src="/hero-bg.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-[#050814]/60 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[10px] font-mono text-cyan-400 tracking-widest">COREIQ RUNTIME</span>
            </div>
          </div>
        </div>

            <div className="lg:col-span-7 reveal-up">
              <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900/90 via-[#060c22] to-slate-950 border border-cyan-500/20 shadow-[0_0_55px_rgba(6,182,212,0.14)] overflow-hidden">
                <div className="absolute inset-0 opacity-40 pointer-events-none">
                  <svg className="w-full h-full" viewBox="0 0 500 350" fill="none">
                    <path d="M 50 180 C 150 100, 300 260, 450 160" stroke="#06b6d4" strokeWidth="3" className="animate-flow-dash" />
                    <path d="M 50 200 C 180 280, 280 80, 450 180" stroke="#a855f7" strokeWidth="2.5" opacity="0.8" className="animate-reverse-flow-dash" />
                  </svg>
                </div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="p-6 rounded-2xl bg-slate-950/90 border border-cyan-500/35 shadow-xl space-y-3.5">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />CoreIQ Intent
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                    <p className="text-white text-sm font-medium leading-relaxed">"I want to automate my customer support process."</p>
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="h-1.5 w-16 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse" />
                      <span className="h-1.5 w-6 rounded-full bg-slate-700" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { Icon:Loader2,     c:'cyan',   t:'Analysing your needs...',      ping:true,  spin:true,  hi:false },
                      { Icon:Search,      c:'purple', t:'Finding the best solution...', ping:false, spin:false, hi:false },
                      { Icon:LinkIcon,    c:'indigo', t:'Connecting your tools...',      ping:false, spin:false, hi:false },
                      { Icon:CheckCircle2,c:'cyan',   t:'Building your system...',       ping:false, spin:false, hi:true  },
                    ].map(({ Icon, c, t, ping, spin, hi }, i) => (
                      <div key={i} className={`flex items-center justify-between p-3.5 rounded-xl border ${hi ? 'bg-cyan-950/60 border-cyan-400/60 shadow-[0_0_20px_rgba(34,211,238,0.25)]' : `bg-slate-900/70 border-${c}-500/25`}`}>
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 text-${c}-400 ${spin ? 'animate-spin' : ''}`} />
                          <span className={`text-xs sm:text-sm ${hi ? 'text-cyan-200 font-semibold' : 'text-slate-200'}`}>{t}</span>
                        </div>
                        <span className={`rounded-full bg-${c}-400 ${ping ? 'w-2 h-2 animate-ping' : 'w-1.5 h-1.5'}`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BANNER */}
      <section className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="reveal-up relative rounded-3xl overflow-hidden border border-cyan-500/20 p-8 sm:p-12 lg:p-16 bg-gradient-to-r from-[#071330] via-[#0b102b] to-[#040817]">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-25 pointer-events-none">
          </div>
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-cyan-400 uppercase">More than a website</span>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white font-display">It's an intelligent<br/>creation environment.</h3>
              <div className="w-20 h-[2px] bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full mt-4" />
            </div>
            <div className="lg:col-span-5 space-y-5">
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">CoreIQ isn't just a website — it's a living, evolving platform where ideas become solutions, powered by AI, the swarm and a universe of integrations.</p>
              <button onClick={() => onNavigate('solutions')} className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 text-sm font-semibold group transition-colors">
                <span>Explore Core IQ</span><ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* EXPLORE CARDS */}
      <section className="py-24 lg:py-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <span className="reveal-up text-xs font-semibold tracking-[0.25em] text-cyan-400 uppercase block mb-2">Explore Core IQ</span>
            <h2 className="reveal-up text-3xl sm:text-4xl font-bold text-white font-display">What would you like to create?</h2>
          </div>
          <button onClick={() => onNavigate('solutions')} className="reveal-up inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-cyan-300 transition-colors">
            <span>View all solutions</span><ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 stagger-children">
          {[
            { Icon:Sparkles,  c:'cyan',   label:'AI Agents',    desc:'Custom agents for your business needs.',     r:'solutions' },
            { Icon:Zap,       c:'blue',   label:'Automation',   desc:'Streamline workflows and save time.',         r:'solutions' },
            { Icon:LayoutGrid,c:'purple', label:'Apps',         desc:'Powerful apps, built for your vision.',       r:'apps'      },
            { Icon:Monitor,   c:'emerald',label:'Websites',     desc:'Modern, scalable web experiences.',           r:'apps'      },
            { Icon:Layers,    c:'indigo', label:'Integrations', desc:'Connect everything in your ecosystem.',       r:'solutions' },
          ].map(({ Icon, c, label, desc, r }) => (
            <div key={label} onClick={() => onNavigate(r as NavRoute)}
              className="reveal-up group cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-56">
              <div className="flex items-center justify-between">
                <div className={`w-10 h-10 rounded-xl bg-${c}-500/15 border border-${c}-500/30 flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 text-${c}-400`} />
                </div>
                <ArrowRight className={`w-4 h-4 text-slate-500 group-hover:text-${c}-300 group-hover:translate-x-1 transition-all`} />
              </div>
              <div>
                <h3 className={`text-white font-bold text-lg mb-1 group-hover:text-${c}-300 transition-colors`}>{label}</h3>
                <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
