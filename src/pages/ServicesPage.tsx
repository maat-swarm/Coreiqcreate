import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  Sparkles,
  ArrowRight,
  Bot,
  Cpu,
  Layers,
  Database,
  PhoneCall,
  MessageSquare,
  Workflow,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ShieldCheck,
  Zap,
  Globe2,
  Radio,
  ArrowUpRight,
  Compass,
  FileCheck,
  Boxes,
  Activity,
  Terminal,
} from 'lucide-react';
import { NavRoute } from '../types';
import { CoreIQData } from '../services/supabase';
import {
  DEFAULT_SERVICES_CONTENT,
  ServicesPageContent,
  parseServicesPageContent,
  ProblemItem,
  ServiceItem,
  BlueprintItem,
  DeliveryStage,
} from '../data/servicesData';
import { useMediaSlot } from '../services/mediaSlots';

interface ServicesPageProps {
  onNavigate: (route: string, query?: string) => void;
  onAsk: (query: string) => void;
}

// Service icon helper
function getServiceIcon(serviceNumber: string) {
  switch (serviceNumber) {
    case '01':
      return Bot;
    case '02':
      return Workflow;
    case '03':
      return MessageSquare;
    case '04':
      return PhoneCall;
    case '05':
      return Boxes;
    case '06':
    default:
      return Database;
  }
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ onNavigate, onAsk }) => {
  const [content, setContent] = useState<ServicesPageContent>(DEFAULT_SERVICES_CONTENT);
  const [selectedProblemIndex, setSelectedProblemIndex] = useState<number>(0);
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-1');
  const [activeCapabilityIndex, setActiveCapabilityIndex] = useState<number>(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(false);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);

  const shouldReduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const capabilityRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Fetch live video slot for Section E
  const { items: videoSlotItems } = useMediaSlot('services.feature_video');
  const featureVideoItem = videoSlotItems.find((i) => (i.type === 'video' || i.type === 'url') && Boolean(i.url));
  const featurePosterItem = videoSlotItems.find((i) => i.type === 'image' && Boolean(i.url));

  // Load custom content from services.page record
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const item = await CoreIQData.getContentByContentKey('services.page');
        if (mounted && item && (item.body || item.value)) {
          const isPublished = item.published !== false && (item.status || '').toUpperCase() !== 'DRAFT';
          if (isPublished) {
            const parsed = parseServicesPageContent(item.body || item.value);
            setContent(parsed);
          }
        }
      } catch (err) {
        console.warn('[ServicesPage] Failed to load live services.page content, using defaults:', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // SEO: Dynamic Document Title, Meta Description, Canonical Tag & Structured Data JSON-LD
  useEffect(() => {
    const originalTitle = document.title;
    document.title = content.seo.title;

    // Meta Description
    let metaDesc = document.querySelector('meta[name="description"]');
    const originalDesc = metaDesc ? metaDesc.getAttribute('content') : '';
    if (metaDesc) {
      metaDesc.setAttribute('content', content.seo.description);
    } else {
      metaDesc = document.createElement('meta');
      metaDesc.setAttribute('name', 'description');
      metaDesc.setAttribute('content', content.seo.description);
      document.head.appendChild(metaDesc);
    }

    // Canonical Link Tag
    let canonicalTag = document.querySelector('link[rel="canonical"]');
    const originalCanonical = canonicalTag ? canonicalTag.getAttribute('href') : null;
    const siteUrl = typeof window !== 'undefined' && window.location.origin.includes('vercel.app')
      ? window.location.origin
      : 'https://coreiqcreate-ten.vercel.app';
    const canonicalUrl = `${siteUrl}${content.seo.canonicalUrl.startsWith('/') ? content.seo.canonicalUrl : `/${content.seo.canonicalUrl}`}`;
    if (canonicalTag) {
      canonicalTag.setAttribute('href', canonicalUrl);
    } else {
      canonicalTag = document.createElement('link');
      canonicalTag.setAttribute('rel', 'canonical');
      canonicalTag.setAttribute('href', canonicalUrl);
      document.head.appendChild(canonicalTag);
    }

    // Structured Data JSON-LD (Organization, Service, BreadcrumbList)
    const jsonLdData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${siteUrl}/#organization`,
          name: 'CoreIQ Create',
          url: siteUrl,
          logo: `${siteUrl}/logo.png`,
          description: content.seo.description,
          areaServed: [
            { '@type': 'Country', name: 'South Africa' },
            { '@type': 'Continent', name: 'Africa' },
            { '@type': 'AdministrativeArea', name: 'Worldwide' },
          ],
        },
        {
          '@type': 'Service',
          '@id': `${siteUrl}/services/#service`,
          name: 'AI Automation & Intelligent Systems',
          provider: { '@id': `${siteUrl}/#organization` },
          serviceType: 'AI Engineering, Workflow Automation, Chatbots, Voice AI & Custom Applications',
          areaServed: 'South Africa & International',
          description: content.seo.description,
          offers: {
            '@type': 'Offer',
            availability: 'https://schema.org/InStock',
            price: 'Custom quote per requirement',
            priceCurrency: 'ZAR',
          },
        },
        {
          '@type': 'BreadcrumbList',
          '@id': `${siteUrl}/services/#breadcrumb`,
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: siteUrl,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Services',
              item: `${siteUrl}/services`,
            },
          ],
        },
      ],
    };

    const scriptTag = document.createElement('script');
    scriptTag.type = 'application/ld+json';
    scriptTag.id = 'services-page-jsonld';
    scriptTag.text = JSON.stringify(jsonLdData);
    document.head.appendChild(scriptTag);

    return () => {
      document.title = originalTitle;
      if (metaDesc && originalDesc) metaDesc.setAttribute('content', originalDesc);
      if (canonicalTag && originalCanonical) canonicalTag.setAttribute('href', originalCanonical);
      const existingScript = document.getElementById('services-page-jsonld');
      if (existingScript) existingScript.remove();
    };
  }, [content.seo]);

  // Observer to track active capability in Section C for desktop side indicator
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY + 250;
      capabilityRefs.current.forEach((el, index) => {
        if (!el) return;
        const top = el.offsetTop;
        const height = el.offsetHeight;
        if (scrollPos >= top && scrollPos < top + height) {
          setActiveCapabilityIndex(index);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [content.services]);

  const scrollToCapabilities = () => {
    const el = document.getElementById('capabilities');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const activeProblem: ProblemItem =
    content.problemDiscovery.problems[selectedProblemIndex] ||
    content.problemDiscovery.problems[0];

  return (
    <div className="relative w-full min-h-screen text-slate-100 overflow-hidden">
      {/* SECTION A — CINEMATIC HERO */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center">
        {/* Atmospheric Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-cyan-500/15 via-blue-600/10 to-purple-600/10 blur-[120px] pointer-events-none rounded-full" />

        {/* Overline & Geo pill */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-2.5 mb-6 text-center"
        >
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 font-mono text-[11px] font-semibold tracking-wider text-cyan-300 uppercase shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            {content.hero.overline}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/70 border border-slate-800 text-[11px] font-mono tracking-widest text-slate-400 uppercase">
            <Globe2 className="w-3 h-3 text-cyan-400" />
            {content.hero.geoLine}
          </span>
        </motion.div>

        {/* H1 Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-center max-w-4xl tracking-tight leading-[1.12] text-white"
        >
          {content.hero.h1}
        </motion.h1>

        {/* Supporting Copy */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-slate-300 text-center max-w-3xl leading-relaxed font-normal"
        >
          {content.hero.supportingCopy}
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={() => onAsk(content.hero.primaryCtaPrompt)}
            className="group relative px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide flex items-center gap-2.5 transition-all shadow-[0_0_25px_rgba(25,217,255,0.35)] active:scale-95 cursor-pointer min-h-[48px]"
          >
            <span>{content.hero.primaryCta}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>

          <button
            onClick={scrollToCapabilities}
            className="px-6 py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 hover:border-cyan-500/40 text-slate-200 hover:text-white font-semibold text-sm transition-all cursor-pointer min-h-[48px]"
          >
            {content.hero.secondaryCta}
          </button>
        </motion.div>

        {/* Animated Hero Architecture Visual (UNDERSTAND → CONNECT → EXECUTE → IMPROVE) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-14 w-full max-w-4xl p-6 sm:p-8 rounded-3xl bg-[#060a1f]/80 border border-cyan-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.8),inset_0_1px_0_rgba(255,255,255,0.06)] relative overflow-hidden backdrop-blur-xl"
        >
          {/* Subtle grid background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative z-10 flex flex-col items-center">
            <div className="flex items-center justify-between w-full mb-6 pb-3 border-b border-slate-800/80 text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <Terminal className="w-3.5 h-3.5" />
                SYSTEM ORCHESTRATION ARCHITECTURE
              </span>
              <span className="text-slate-500">AUTONOMOUS DISPATCH ENGINE</span>
            </div>

            {/* 4 Interactive Nodes */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full relative">
              {[
                {
                  phase: '01',
                  label: 'UNDERSTAND',
                  detail: 'Business logic & raw inputs',
                  icon: Compass,
                  color: 'from-cyan-500/20 to-blue-500/10',
                  border: 'border-cyan-500/40',
                },
                {
                  phase: '02',
                  label: 'CONNECT',
                  detail: 'APIs, tools & databases',
                  icon: Workflow,
                  color: 'from-blue-500/20 to-indigo-500/10',
                  border: 'border-blue-500/40',
                },
                {
                  phase: '03',
                  label: 'EXECUTE',
                  detail: 'Autonomous action & AI agents',
                  icon: Cpu,
                  color: 'from-indigo-500/20 to-purple-500/10',
                  border: 'border-indigo-500/40',
                },
                {
                  phase: '04',
                  label: 'IMPROVE',
                  detail: 'Continuous feedback loops',
                  icon: Activity,
                  color: 'from-purple-500/20 to-pink-500/10',
                  border: 'border-purple-500/40',
                },
              ].map((node, i) => {
                const Icon = node.icon;
                return (
                  <div
                    key={node.phase}
                    className={`relative p-4 rounded-2xl bg-gradient-to-b ${node.color} border ${node.border} flex flex-col justify-between group hover:border-cyan-400 transition-all`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs text-cyan-400 font-bold">
                        {node.phase}
                      </span>
                      <Icon className="w-4 h-4 text-cyan-300" />
                    </div>
                    <div>
                      <h4 className="font-mono text-xs font-bold text-white tracking-wider mb-1">
                        {node.label}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {node.detail}
                      </p>
                    </div>

                    {/* Connecting Chevron on Desktop */}
                    {i < 3 && (
                      <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-[#060a1f] border border-cyan-500/40 items-center justify-center text-cyan-400 shadow-sm">
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Moving Capability Strip (Accessible Ticker) */}
        {content.capabilityTicker.enabled && (
          <div className="w-full mt-10 overflow-hidden border-y border-slate-800/80 bg-[#030616]/60 py-3.5 backdrop-blur-md">
            {shouldReduceMotion ? (
              <div className="flex flex-wrap justify-center gap-6 text-xs font-mono tracking-widest text-slate-400 uppercase max-w-7xl mx-auto px-4">
                {content.capabilityTicker.items.map((item, idx) => (
                  <span key={idx} className="flex items-center gap-2 text-cyan-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex whitespace-nowrap gap-10 animate-[ticker_35s_linear_infinite] hover:[animation-play-state:paused]">
                {[...content.capabilityTicker.items, ...content.capabilityTicker.items, ...content.capabilityTicker.items].map(
                  (item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-2.5 text-xs font-mono uppercase tracking-widest text-slate-300"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#06b6d4]" />
                      <span className="hover:text-cyan-300 transition-colors">{item}</span>
                    </span>
                  )
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION B — START WITH THE BUSINESS PROBLEM */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            DIAGNOSTIC ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            {content.problemDiscovery.heading}
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            {content.problemDiscovery.subheading}
          </p>
        </div>

        {/* Interactive Problem Explorer Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Problem Selector Buttons */}
          <div className="lg:col-span-5 space-y-2.5">
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-500 block mb-2 px-1">
              Select Your Current Challenge:
            </span>
            {content.problemDiscovery.problems.map((prob, idx) => {
              const isSelected = selectedProblemIndex === idx;
              return (
                <button
                  key={prob.id}
                  onClick={() => setSelectedProblemIndex(idx)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-gradient-to-r from-cyan-950/80 to-blue-950/50 border-cyan-500/60 text-white shadow-[0_0_25px_rgba(6,182,212,0.15)] ring-1 ring-cyan-500/30'
                      : 'bg-[#060a1d]/70 hover:bg-slate-900/80 border-slate-800 text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`font-mono text-xs font-bold px-2 py-0.5 rounded-md shrink-0 mt-0.5 ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      0{idx + 1}
                    </span>
                    <span className="text-sm font-medium leading-snug">{prob.title}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isSelected ? 'rotate-[-90deg] text-cyan-400' : 'text-slate-600'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Right: Dynamic Diagnostic & Proposed Solution Card */}
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeProblem.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="p-6 sm:p-8 rounded-3xl bg-[#060a22]/90 border border-cyan-500/30 shadow-2xl relative backdrop-blur-xl"
              >
                {/* Header Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="font-mono text-xs font-bold text-cyan-300 uppercase tracking-widest">
                      SYSTEM DIAGNOSIS
                    </span>
                  </div>
                  <span className="font-mono text-xs text-slate-400">
                    PROBLEM 0{selectedProblemIndex + 1} OF {content.problemDiscovery.problems.length}
                  </span>
                </div>

                {/* Problem Statement */}
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-4">
                  "{activeProblem.title}"
                </h3>

                {/* Underlying Root Cause */}
                <div className="mb-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider block mb-1">
                    Underlying Root Cause:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeProblem.issue}
                  </p>
                </div>

                {/* Proposed Solution Architecture */}
                <div className="mb-6 space-y-3">
                  <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                    Recommended CoreIQ Solution:
                  </span>
                  <p className="text-sm sm:text-base font-semibold text-white leading-snug">
                    {activeProblem.solution}
                  </p>

                  {/* Capability Tags */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {activeProblem.capabilities.map((cap, cIdx) => (
                      <span
                        key={cIdx}
                        className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 font-mono text-[11px] text-cyan-300"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Practical Example */}
                <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-cyan-950/30 to-blue-950/20 border border-cyan-500/20">
                  <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase tracking-wider block mb-1">
                    Practical System Example:
                  </span>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {activeProblem.example}
                  </p>
                </div>

                {/* Direct CTA to Ask CoreIQ with prefilled inquiry */}
                <button
                  onClick={() => onAsk(activeProblem.ctaPrompt)}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-98 min-h-[44px]"
                >
                  <span>Discuss This Solution With CoreIQ</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* SECTION C — THE COREIQ CAPABILITY EXPERIENCE */}
      <section id="capabilities" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            END-TO-END CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mt-2 tracking-tight">
            Six Intelligent Systems Capabilities
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base leading-relaxed">
            We don't sell disconnected subscription tools. We architect, build, integrate, and deploy working systems tailored to your exact operational workflows.
          </p>
        </div>

        {/* Editorial Layout: Left Sticky Navigation Indicator on Desktop + Right Deep Capability Journey */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start relative">
          {/* Desktop Sticky Navigation Sidebar */}
          <div className="hidden lg:block lg:col-span-3 sticky top-28 space-y-3 p-4 rounded-2xl bg-[#04081c]/70 border border-slate-800/80 backdrop-blur-md">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block px-2 mb-2">
              Capabilities Index
            </span>
            {content.services.map((svc, idx) => {
              const isActive = activeCapabilityIndex === idx;
              return (
                <button
                  key={svc.id}
                  onClick={() => {
                    capabilityRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center justify-between cursor-pointer ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <span className="flex items-center gap-2 truncate">
                    <span className="text-[10px] text-cyan-400 font-bold">{svc.number}</span>
                    <span className="truncate">{svc.title}</span>
                  </span>
                  {isActive && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />}
                </button>
              );
            })}
          </div>

          {/* Right Capability Editorial Cards */}
          <div className="lg:col-span-9 space-y-16">
            {content.services.map((service: ServiceItem, idx: number) => {
              const Icon = getServiceIcon(service.number);
              return (
                <div
                  key={service.id}
                  ref={(el) => {
                    capabilityRefs.current[idx] = el;
                  }}
                  className="p-6 sm:p-10 rounded-3xl bg-[#050920]/90 border border-slate-800/90 shadow-2xl relative overflow-hidden backdrop-blur-xl group hover:border-cyan-500/40 transition-colors"
                >
                  {/* Atmospheric Top Glow */}
                  <div className="absolute top-0 right-0 w-80 h-40 bg-cyan-500/10 blur-3xl rounded-full pointer-events-none" />

                  {/* Header Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono text-cyan-400 font-bold text-sm">
                        {service.number}
                      </span>
                      <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                        {service.overline}
                      </span>
                    </div>

                    <Icon className="w-7 h-7 text-cyan-400/80" />
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white mb-3">
                    {service.title}
                  </h3>
                  <p className="text-base sm:text-lg text-cyan-200/90 font-medium leading-relaxed mb-6">
                    {service.summary}
                  </p>

                  {/* Deep Technical Description */}
                  <p className="text-sm text-slate-300 leading-relaxed mb-8">
                    {service.description}
                  </p>

                  {/* Example Workflow Step Wireframe */}
                  <div className="mb-8 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 font-mono text-xs">
                    <span className="text-[10px] text-slate-500 tracking-wider uppercase block mb-1.5 font-bold">
                      ARCHITECTURAL WORKFLOW PATH:
                    </span>
                    <div className="text-cyan-300 text-xs sm:text-[13px] leading-relaxed">
                      {service.workflow}
                    </div>
                  </div>

                  {/* Concrete Capabilities & Outcomes Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 pt-6 border-t border-slate-800/80">
                    <div>
                      <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Operational Implementations
                      </h4>
                      <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                        {service.examples.map((ex, eIdx) => (
                          <li key={eIdx} className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                            <span>{ex}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider mb-3">
                        Business Outcomes & Value
                      </h4>
                      <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                        {service.outcomes.map((out, oIdx) => (
                          <li key={oIdx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{out}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Bottom Action Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-800/80">
                    <button
                      onClick={() => onAsk(service.ctaPrompt)}
                      className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.25)] active:scale-95 min-h-[44px]"
                    >
                      <span>{service.ctaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Dedicated Apps link for Service 05 */}
                    {service.number === '05' && (
                      <a
                        href="/apps"
                        onClick={(e) => {
                          e.preventDefault();
                          onNavigate('apps');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Explore Existing Apps & Platforms</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION D — SYSTEMS BUILT FROM MULTIPLE CAPABILITIES (BLUEPRINTS) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            CROSS-CAPABILITY INTEGRATION
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            {content.blueprints.heading}
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            {content.blueprints.subheading}
          </p>
        </div>

        {/* Blueprint Visual Diagrams */}
        <div className="space-y-10">
          {content.blueprints.items.map((bp: BlueprintItem, bIdx: number) => (
            <div
              key={bp.id}
              className="p-6 sm:p-8 rounded-3xl bg-[#060a22]/90 border border-slate-800/90 shadow-2xl relative overflow-hidden backdrop-blur-xl"
            >
              {/* Top Banner */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 font-mono text-xs font-bold text-cyan-300 uppercase">
                    {bp.badge}
                  </span>
                  <span className="font-mono text-xs text-slate-500">
                    BLUEPRINT 0{bIdx + 1}
                  </span>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  {bp.steps.length} SYNCHRONIZED NODES
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                {bp.title}
              </h3>
              <p className="text-sm text-slate-300 mb-8 max-w-3xl leading-relaxed">
                {bp.description}
              </p>

              {/* Connected Step Pipeline */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 relative">
                {bp.steps.map((st, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 relative flex flex-col justify-between group hover:border-cyan-500/50 transition-colors"
                  >
                    <div>
                      <span className="font-mono text-[10px] text-cyan-400 font-bold block mb-1.5">
                        PHASE {st.step}
                      </span>
                      <h4 className="text-xs font-bold text-white mb-2 leading-snug">
                        {st.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        {st.detail}
                      </p>
                    </div>

                    {/* Step indicator arrow */}
                    {sIdx < bp.steps.length - 1 && (
                      <div className="hidden md:flex absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 w-5 h-5 rounded-full bg-[#060a22] border border-cyan-500/30 items-center justify-center text-cyan-400 text-[10px]">
                        →
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION E — SEE A SYSTEM IN ACTION (OPTIONAL FEATURE VIDEO) */}
      {featureVideoItem && (
        <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
              LIVE SYSTEM DEMONSTRATION
            </span>
            <h2 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
              {featureVideoItem.title || 'See CoreIQ In Action'}
            </h2>
            <p className="mt-2 text-slate-300 text-sm">
              {featureVideoItem.caption || 'Watch how intelligent agents and automated pipelines execute production business tasks.'}
            </p>
          </div>

          <div className="relative rounded-3xl overflow-hidden bg-slate-950 border border-cyan-500/30 shadow-[0_20px_60px_rgba(0,0,0,0.8)] aspect-video group">
            <video
              ref={videoRef}
              src={featureVideoItem.url || undefined}
              poster={featureVideoItem.poster_url || featurePosterItem?.url || '/assets/backgrounds/coreiq-world.jpg'}
              muted={isAudioMuted}
              playsInline
              loop
              onPlay={() => setIsVideoPlaying(true)}
              onPause={() => setIsVideoPlaying(false)}
              className="w-full h-full object-cover"
            />

            {/* Custom Video Control Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-6 justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (videoRef.current) {
                      if (isVideoPlaying) {
                        videoRef.current.pause();
                      } else {
                        videoRef.current.play();
                      }
                    }
                  }}
                  className="p-3 rounded-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-transform active:scale-95 cursor-pointer shadow-lg"
                  aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
                >
                  {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.muted = !isAudioMuted;
                      setIsAudioMuted(!isAudioMuted);
                    }
                  }}
                  className="p-3 rounded-full bg-slate-900/80 text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  aria-label={isAudioMuted ? 'Unmute audio' : 'Mute audio'}
                >
                  {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>

              <span className="text-xs font-mono text-slate-300">
                CoreIQ Production Demonstration
              </span>
            </div>

            {/* Initial Big Play Button Overlay */}
            {!isVideoPlaying && (
              <div
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.play();
                  }
                }}
                className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer backdrop-blur-xs"
              >
                <div className="p-5 rounded-full bg-cyan-500 text-slate-950 shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-105 transition-transform">
                  <Play className="w-8 h-8 fill-slate-950 translate-x-0.5" />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* SECTION F — HOW WE BUILD YOUR SOLUTION (7-STAGE JOURNEY) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            DELIVERY METHODOLOGY
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            {content.delivery.heading}
          </h2>
          <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed">
            {content.delivery.subheading}
          </p>
        </div>

        {/* 7-Stage Process Timeline Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {content.delivery.stages.map((stage: DeliveryStage, sIdx: number) => (
            <div
              key={stage.number}
              className={`p-6 rounded-2xl bg-[#050920]/80 border border-slate-800/80 relative flex flex-col justify-between group hover:border-cyan-500/50 transition-all ${
                sIdx === 6 ? 'md:col-span-2 lg:col-span-2' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    STAGE {stage.number}
                  </span>
                  <span className="text-slate-600 font-mono text-xs">COREIQ</span>
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  {stage.name}
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {stage.description}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
                <span>Phase Progress</span>
                <span className="text-cyan-400">Validated</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION G — FREQUENTLY ASKED QUESTIONS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto relative">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
            CLEAR ANSWERS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
            {content.faqs.heading}
          </h2>
          <p className="mt-3 text-slate-300 text-sm leading-relaxed">
            {content.faqs.subheading}
          </p>
        </div>

        {/* Accessible Accordion */}
        <div className="space-y-3">
          {content.faqs.items
            .filter((f) => f.published !== false)
            .map((faq, idx) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="rounded-2xl border border-slate-800/80 bg-[#060a22]/70 overflow-hidden backdrop-blur-md transition-colors hover:border-cyan-500/40"
                >
                  <button
                    onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-2xl"
                  >
                    <span className="font-semibold text-sm sm:text-base text-white leading-snug">
                      {faq.question}
                    </span>
                    <span
                      className={`p-1.5 rounded-lg border shrink-0 transition-transform ${
                        isOpen
                          ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 rotate-180'
                          : 'bg-slate-900 border-slate-700 text-slate-400'
                      }`}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={`faq-answer-${faq.id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="p-5 pt-0 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-800/40">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
        </div>
      </section>

      {/* SECTION H — FINAL CONVERSION CLOSING SECTION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto relative mb-12">
        <div className="p-8 sm:p-14 rounded-3xl bg-gradient-to-b from-[#080d28] to-[#040718] border border-cyan-500/40 text-center relative overflow-hidden shadow-[0_25px_80px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
          {/* Subtle Cyber Grid */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #06b6d4 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          <div className="relative z-10 max-w-2xl mx-auto space-y-5">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 font-mono text-xs font-bold text-cyan-300 uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5" />
              SOLVE YOUR FIRST BOTTLENECK
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              {content.closing.headline}
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {content.closing.supporting}
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                onClick={() => onAsk(content.closing.primaryCtaPrompt)}
                className="px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm tracking-wide flex items-center gap-2 transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] active:scale-95 cursor-pointer min-h-[48px]"
              >
                <span>{content.closing.primaryCta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onAsk(content.closing.secondaryCtaPrompt)}
                className="px-6 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white font-semibold text-sm transition-colors cursor-pointer min-h-[48px]"
              >
                {content.closing.secondaryCta}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
