import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CoreIQLogo } from '../components/common/CoreIQLogo';
import { GradientBorderBox } from '../components/ask/GradientBorderBox';
import { ScrambleText } from '../components/ask/ScrambleText';
import { useMagneticHover } from '../hooks/useMagneticHover';
import { coreIQRuntime } from '../services/coreiqRuntime';
import { CoreIQData } from '../services/supabase';
import '../styles/ask.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  blueprint?: Record<string, unknown>;
}

export interface AskProps {
  onNavigate: (route: string) => void;
  initialPrompt?: string;
}

type TabCategory = 'agents' | 'apps' | 'automation';

interface TabConfig {
  id: TabCategory;
  label: string;
  placeholder: string;
}

const STATIC_TABS: TabConfig[] = [
  {
    id: 'agents',
    label: 'Agents',
    placeholder:
      'Build me an AI agent that handles client onboarding, sends follow-up emails, and updates my CRM automatically...',
  },
  {
    id: 'apps',
    label: 'Apps',
    placeholder:
      'Create a client portal where customers track their project status, upload files, and approve deliverables...',
  },
  {
    id: 'automation',
    label: 'Automation',
    placeholder:
      'Automate my lead capture from Instagram DMs into a structured CRM pipeline with instant replies...',
  },
];

const MAATVERSE_PILLS = [
  '🎨 AI Art Packs',
  '🖼️ Wallpapers',
  '🎵 Beats & Audio',
  '📱 Micro-Apps',
  '🎮 Mini Games',
  '✨ Free Downloads',
];

const MAATVERSE_CARDS = [
  {
    id: '1',
    title: 'Void Art Pack Vol.1',
    price: 'Free',
    background: 'linear-gradient(145deg, #1a0533 0%, #6b21a8 100%)',
  },
  {
    id: '2',
    title: 'Cyberpulse Wallpapers',
    price: 'R29',
    background: 'linear-gradient(145deg, #0a1628 0%, #1e40af 100%)',
  },
  {
    id: '3',
    title: 'AfroFuture Beats',
    price: 'R49',
    background: 'linear-gradient(145deg, #0d1f0d 0%, #15803d 100%)',
  },
  {
    id: '4',
    title: 'Pharaoh Dashboard App',
    price: 'R79',
    background: 'linear-gradient(145deg, #1a0a00 0%, #c2410c 100%)',
  },
];

export const Ask: React.FC<AskProps> = ({ onNavigate, initialPrompt }) => {
  const [activeTab, setActiveTab] = useState<TabCategory>('agents');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Memoized tabs and static Maatverse collections
  const tabs = useMemo<TabConfig[]>(() => STATIC_TABS, []);
  const maatversePills = useMemo(() => MAATVERSE_PILLS, []);
  const maatverseCards = useMemo(() => MAATVERSE_CARDS, []);

  // Check prefers-reduced-motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Magnetic hover on buttons
  const navCtaRef = useMagneticHover<HTMLButtonElement>(0.35);
  const stickyCtaRef = useMagneticHover<HTMLButtonElement>(0.35);
  const sendBtnRef = useMagneticHover<HTMLButtonElement>(0.25);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialHandled = useRef(false);

  // Suppress outer layout header & footer while on Ask page
  useEffect(() => {
    document.body.classList.add('ask-page-active');
    return () => {
      document.body.classList.remove('ask-page-active');
    };
  }, []);

  // Handle initial prompt from homepage or route navigation
  useEffect(() => {
    if (initialPrompt && !initialHandled.current) {
      initialHandled.current = true;
      setInput(initialPrompt);
      sendQuery(initialPrompt);
    }
  }, [initialPrompt]);

  const sendQuery = async (queryText?: string) => {
    const text = (queryText ?? input).trim();
    if (!text || loading) return;

    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await coreIQRuntime.processQuery(text);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.assistantMessage,
        timestamp: new Date(),
        blueprint: (response.blueprint as unknown) as Record<string, unknown> | undefined,
      };

      const updatedHistory = [...messages, userMsg, aiMsg];
      setMessages((prev) => [...prev, aiMsg]);

      // Record lead in Supabase database
      const fullTurns = updatedHistory.map((m) => ({
        sender: m.role === 'user' ? ('user' as const) : ('coreiq' as const),
        text: m.content,
        timestamp: m.timestamp.toISOString(),
      }));

      if (!activeLeadId) {
        const lead = await CoreIQData.insertLead({
          source: 'website',
          client_name: 'Anonymous Creator',
          client_contact: 'inbound@coreiq.dev',
          client_message: text,
          conversation_summary: text,
          intent_type: activeTab,
          status: 'new',
          full_conversation: fullTurns,
          budget_range: '$5k - $15k',
        });
        if (lead?.id) setActiveLeadId(lead.id);
      } else {
        await CoreIQData.updateLead(activeLeadId, {
          full_conversation: fullTurns,
          conversation_summary: text,
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content:
            'CoreIQ synthesis completed. Tell us more about your timeline and system requirements.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setInput('');
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  const activeConfig = tabs.find((t) => t.id === activeTab) ?? tabs[0];

  return (
    <div
      id="ask-page-root"
      className="relative w-full bg-[#080808] text-white flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 overflow-x-hidden font-sans"
    >
      {/* Hidden file input for Attach icon */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            setInput((prev) =>
              prev ? `${prev} [Attached: ${e.target.files?.[0]?.name}]` : `[Attached: ${e.target.files?.[0]?.name}] `
            );
          }
        }}
      />

      {/* =====================================================================
          SECTION A: FULL-VIEWPORT HERO (min-height: 100svh)
          ===================================================================== */}
      <div className="relative min-h-[100svh] w-full flex flex-col justify-between">
        {/* Background layer 1 (SVG geometric starburst + 8 rings) */}
        <div
          className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 800 800"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full"
            fill="none"
          >
            {/* 8 concentric rings at equal intervals centered at (400, 480) [50% 60%] */}
            {[50, 110, 170, 230, 300, 380, 470, 580].map((radius) => (
              <circle
                key={`radar-ring-${radius}`}
                cx="400"
                cy="480"
                r={radius}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.5"
              />
            ))}

            {/* 16 radiating spokes extending to corners from (400, 480) */}
            {Array.from({ length: 16 }).map((_, i) => {
              const angleDeg = (i * 360) / 16;
              const angleRad = (angleDeg * Math.PI) / 180;
              const length = 750;
              const x2 = 400 + Math.cos(angleRad) * length;
              const y2 = 480 + Math.sin(angleRad) * length;
              return (
                <line
                  key={`radar-spoke-${angleDeg}`}
                  x1="400"
                  y1="480"
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.5"
                />
              );
            })}
          </svg>
        </div>

        {/* Background layer 2 (Warm radial glow centered at 50% 65%) */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{
            background:
              'radial-gradient(ellipse 60% 35% at 50% 65%, rgba(180,60,20,0.10) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />

        {/* =====================================================================
            SECTION B: NAVIGATION BAR (56px)
            ===================================================================== */}
        <nav
          className="sticky top-0 z-[100] w-full min-h-[56px] px-6 flex items-center justify-between"
          style={{
            background: 'rgba(8,8,8,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 'max(12px, env(safe-area-inset-top))',
          }}
        >
          {/* Left: CoreIQ Logo Mark + Wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('home');
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="w-[28px] h-[28px] flex items-center justify-center shrink-0">
              <CoreIQLogo size="sm" />
            </div>
            <span className="font-semibold text-white text-[15px] tracking-tight group-hover:text-cyan-300 transition-colors">
              CoreIQ
            </span>
          </a>

          {/* Desktop Nav Links (≥768px) */}
          <div className="hidden md:flex items-center gap-[32px] text-[14px] font-[500] text-[rgba(255,255,255,0.65)]">
            <button
              onClick={() => onNavigate('solutions')}
              style={{ touchAction: 'manipulation' }}
              className="hover:text-white underline-offset-4 hover:underline decoration-[#00e676] decoration-2 transition-all cursor-pointer"
            >
              Build
            </button>
            <button
              onClick={() => onNavigate('apps')}
              style={{ touchAction: 'manipulation' }}
              className="hover:text-white underline-offset-4 hover:underline decoration-[#00e676] decoration-2 transition-all cursor-pointer"
            >
              Explore
            </button>
            <button
              onClick={() => onNavigate('learn')}
              style={{ touchAction: 'manipulation' }}
              className="hover:text-white underline-offset-4 hover:underline decoration-[#00e676] decoration-2 transition-all cursor-pointer"
            >
              Learn
            </button>
            <button
              onClick={() => onNavigate('solutions')}
              style={{ touchAction: 'manipulation' }}
              className="hover:text-white underline-offset-4 hover:underline decoration-[#00e676] decoration-2 transition-all cursor-pointer"
            >
              Pricing
            </button>
            <button
              onClick={() => onNavigate('about')}
              style={{ touchAction: 'manipulation' }}
              className="hover:text-white underline-offset-4 hover:underline decoration-[#00e676] decoration-2 transition-all cursor-pointer"
            >
              About
            </button>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center gap-3">
            {/* Desktop & Mobile CTA Pill Button */}
            <GradientBorderBox fast radius={999}>
              <button
                ref={navCtaRef}
                onClick={() => {
                  textareaRef.current?.focus();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ touchAction: 'manipulation' }}
                className="cta-btn"
              >
                Start Building →
              </button>
            </GradientBorderBox>

            {/* Mobile Hamburger (<768px) */}
            <button
              onClick={() => setMobileDrawerOpen(true)}
              style={{ touchAction: 'manipulation', minWidth: 44, minHeight: 44 }}
              className="md:hidden flex flex-col justify-center items-center w-[44px] h-[44px] gap-[5px] focus:outline-none cursor-pointer"
              aria-label="Open menu"
            >
              <span className="w-[22px] h-[2px] bg-white block" />
              <span className="w-[22px] h-[2px] bg-white block" />
              <span className="w-[22px] h-[2px] bg-white block" />
            </button>
          </div>
        </nav>

        {/* Mobile Slide-in Drawer from the right (width: 280px) */}
        <AnimatePresence>
          {mobileDrawerOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileDrawerOpen(false)}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[110] md:hidden"
              />

              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                className="fixed top-0 right-0 h-full w-[280px] bg-[#0c0c0c] border-l border-white/[0.08] z-[120] p-6 flex flex-col justify-between md:hidden shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-white/[0.08]">
                    <a
                      href="/"
                      onClick={(e) => {
                        e.preventDefault();
                        setMobileDrawerOpen(false);
                        onNavigate('home');
                      }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <CoreIQLogo size="sm" />
                      <span className="font-semibold text-white text-[15px]">CoreIQ</span>
                    </a>
                    <button
                      onClick={() => setMobileDrawerOpen(false)}
                      className="text-white/60 hover:text-white text-xl p-1"
                      aria-label="Close menu"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="flex flex-col gap-5 pt-8 text-[18px] font-medium text-white/80">
                    <button
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        onNavigate('solutions');
                      }}
                      className="text-left hover:text-white transition-colors"
                    >
                      Build
                    </button>
                    <button
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        onNavigate('apps');
                      }}
                      className="text-left hover:text-white transition-colors"
                    >
                      Explore
                    </button>
                    <button
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        onNavigate('learn');
                      }}
                      className="text-left hover:text-white transition-colors"
                    >
                      Learn
                    </button>
                    <button
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        onNavigate('solutions');
                      }}
                      className="text-left hover:text-white transition-colors"
                    >
                      Pricing
                    </button>
                    <button
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        onNavigate('about');
                      }}
                      className="text-left hover:text-white transition-colors"
                    >
                      About
                    </button>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/[0.08]">
                  <GradientBorderBox fast radius={999} className="w-full">
                    <button
                      onClick={() => {
                        setMobileDrawerOpen(false);
                        textareaRef.current?.focus();
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="cta-btn w-full"
                    >
                      Start Building →
                    </button>
                  </GradientBorderBox>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* =====================================================================
            SECTION C: HERO CONTENT AREA
            ===================================================================== */}
        <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-[80px] pb-[40px] text-center w-full max-w-[768px] mx-auto flex-1">
          {/* Headline: ScrambleText on mount */}
          <motion.h1
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(2.6rem,10vw,3.5rem)] font-[800] leading-[1.05] tracking-[-0.03em] text-[#ffffff] mb-[16px] select-none"
          >
            <ScrambleText text="One brief." delay={200} duration={900} />
            <br />
            <ScrambleText text="One solution." delay={600} duration={1000} />
          </motion.h1>

          {/* Subheadline: Muted supporting copy */}
          <motion.p
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.15, duration: prefersReducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(0.95rem,3.5vw,1.1rem)] font-[400] text-[rgba(255,255,255,0.52)] leading-[1.55] max-w-[320px] md:max-w-[480px] mb-[36px]"
          >
            Agents. Apps. Automation. Built for your business — deployed in days, not months.
          </motion.p>

          {/* =====================================================================
              SECTION D: TAB SWITCHER
              ===================================================================== */}
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.3, duration: prefersReducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="flex gap-[4px] bg-[rgba(255,255,255,0.07)] rounded-[999px] p-[4px] w-fit mx-auto mb-[20px]"
          >
            {tabs.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ touchAction: 'manipulation' }}
                  className={`px-[16px] py-[8px] rounded-[999px] text-[13px] font-[500] border-none cursor-pointer flex items-center gap-[6px] transition-all duration-200 ${
                    isSelected
                      ? 'bg-[rgba(255,255,255,0.13)] text-[#ffffff]'
                      : 'bg-transparent text-[rgba(255,255,255,0.42)] hover:text-white/70'
                  }`}
                >
                  {isSelected && tab.id === 'agents' && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <circle cx="7" cy="5" r="3" stroke="white" strokeWidth="1.2" />
                      <path
                        d="M2 13c0-2.761 2.239-5 5-5s5 2.239 5 5"
                        stroke="white"
                        strokeWidth="1.2"
                        strokeLinecap="round"
                      />
                      <circle cx="3" cy="5" r="0.8" fill="white" />
                      <circle cx="11" cy="5" r="0.8" fill="white" />
                    </svg>
                  )}
                  {isSelected && tab.id === 'apps' && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <rect x="1" y="1" width="4" height="4" rx="1" fill="white" />
                      <rect x="5.5" y="1" width="3" height="3" rx="0.8" fill="white" opacity="0.6" />
                      <rect x="9" y="1" width="4" height="4" rx="1" fill="white" />
                      <rect x="1" y="5.5" width="3" height="3" rx="0.8" fill="white" opacity="0.6" />
                      <rect x="5.5" y="5.5" width="3" height="3" rx="0.8" fill="white" />
                      <rect x="9" y="5.5" width="3" height="3" rx="0.8" fill="white" opacity="0.6" />
                      <rect x="1" y="9" width="4" height="4" rx="1" fill="white" />
                      <rect x="5.5" y="9" width="3" height="3" rx="0.8" fill="white" opacity="0.6" />
                      <rect x="9" y="9" width="4" height="4" rx="1" fill="white" />
                    </svg>
                  )}
                  {isSelected && tab.id === 'automation' && (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M8.5 1L3 8h5l-2.5 5L13 6H8L10.5 1z" fill="white" />
                    </svg>
                  )}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </motion.div>

          {/* =====================================================================
              SECTION E: PROMPT INPUT BOX (GradientBorderBox with Focus Glow)
              ===================================================================== */}
          <motion.div
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : 0.45, duration: prefersReducedMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-full md:max-w-[560px] mx-auto rounded-[18px]"
            style={{
              boxShadow: isFocused
                ? '0 0 60px rgba(0,230,118,0.25), 0 0 100px rgba(0,176,255,0.15)'
                : '0 0 20px rgba(0,0,0,0.5)',
              transition: 'box-shadow 0.3s ease',
            }}
          >
            <GradientBorderBox>
              <div className="bg-[rgba(12,12,12,0.96)] rounded-[18px] p-[16px] flex flex-col min-h-[130px] md:min-h-[110px] justify-between text-left">
                <label htmlFor="ask-input" className="sr-only">
                  Describe what you want to build
                </label>
                <textarea
                  id="ask-input"
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onKeyDown={handleKeyDown}
                  placeholder={activeConfig.placeholder}
                  rows={2}
                  style={{ fontSize: 'clamp(15px, 2.5vw, 16px)' }}
                  className="w-full bg-transparent border-none outline-none resize-none font-[400] text-[rgba(255,255,255,0.85)] placeholder:text-[rgba(255,255,255,0.28)] leading-[1.5] min-h-[60px] flex-1"
                />

                {/* Bottom row of input box */}
                <div className="flex justify-between items-center mt-[12px] pt-1">
                  {/* Left: 4 circular utility icon buttons */}
                  <div className="flex items-center gap-[8px]">
                    {/* Button 1 — Templates */}
                    <button
                      type="button"
                      onClick={() => {
                        const templatePrompt =
                          activeTab === 'agents'
                            ? 'Deploy a multi-tier customer support agent with escalation logic.'
                            : activeTab === 'apps'
                            ? 'Generate a full-stack SaaS workspace portal with user authentication.'
                            : 'Set up automated CRM synchronization triggered by stripe payment webhooks.';
                        setInput(templatePrompt);
                      }}
                      title="Templates"
                      aria-label="Browse templates"
                      style={{ touchAction: 'manipulation', minWidth: 44, minHeight: 44 }}
                      className="w-[44px] h-[44px] rounded-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[rgba(255,255,255,0.48)] hover:text-white hover:bg-[rgba(255,255,255,0.13)] hover:border-[rgba(255,255,255,0.16)] transition-all duration-150 cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                        <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                        <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                        <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                      </svg>
                    </button>

                    {/* Button 2 — Tools */}
                    <button
                      type="button"
                      onClick={() => onNavigate('tools')}
                      title="Tools & Utilities"
                      aria-label="Open tools"
                      style={{ touchAction: 'manipulation', minWidth: 44, minHeight: 44 }}
                      className="w-[44px] h-[44px] rounded-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[rgba(255,255,255,0.48)] hover:text-white hover:bg-[rgba(255,255,255,0.13)] hover:border-[rgba(255,255,255,0.16)] transition-all duration-150 cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M13.5 2.5l-1.5 1.5M10 2a4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 014-4zM2 14l4-4"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>

                    {/* Button 3 — Connect */}
                    <button
                      type="button"
                      onClick={() => onNavigate('solutions')}
                      title="Integrations & Connectors"
                      aria-label="Connect integrations"
                      style={{ touchAction: 'manipulation', minWidth: 44, minHeight: 44 }}
                      className="w-[44px] h-[44px] rounded-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[rgba(255,255,255,0.48)] hover:text-white hover:bg-[rgba(255,255,255,0.13)] hover:border-[rgba(255,255,255,0.16)] transition-all duration-150 cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <circle cx="4" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                        <circle cx="12" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                        <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.3" />
                        <path
                          d="M6.5 8l3-2.5M6.5 8l3 2.5"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>

                    {/* Button 4 — Attach */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      title="Attach brief or specification"
                      aria-label="Attach file"
                      style={{ touchAction: 'manipulation', minWidth: 44, minHeight: 44 }}
                      className="w-[44px] h-[44px] rounded-full bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center text-[rgba(255,255,255,0.48)] hover:text-white hover:bg-[rgba(255,255,255,0.13)] hover:border-[rgba(255,255,255,0.16)] transition-all duration-150 cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M13 7l-5.5 5.5a4 4 0 01-5.657-5.657L7.5 1.5a2.5 2.5 0 013.535 3.535L5.5 10.5a1 1 0 01-1.414-1.414L9.5 3.5"
                          stroke="currentColor"
                          strokeWidth="1.3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Right: Send button with magnetic hover */}
                  <button
                    ref={sendBtnRef}
                    type="button"
                    onClick={() => sendQuery()}
                    disabled={loading || !input.trim()}
                    title="Send inquiry"
                    aria-label="Send message"
                    style={{ touchAction: 'manipulation', minWidth: 44, minHeight: 44 }}
                    className="w-[44px] h-[44px] rounded-full bg-[rgba(255,255,255,0.10)] border border-[rgba(255,255,255,0.12)] flex items-center justify-center hover:bg-[rgba(255,255,255,0.20)] transition-all duration-150 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path
                          d="M3 8h10M9 4l4 4-4 4"
                          stroke="white"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </GradientBorderBox>

            {/* Keyboard Shortcuts Hint */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 16,
                marginTop: 8,
                fontSize: 11,
                color: 'rgba(255,255,255,0.3)',
                letterSpacing: '0.05em',
              }}
            >
              <span>
                <kbd
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 4,
                    padding: '1px 5px',
                    fontFamily: 'monospace',
                    fontSize: 10,
                  }}
                >
                  ↵
                </kbd>{' '}
                send
              </span>
              <span>
                <kbd
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: 4,
                    padding: '1px 5px',
                    fontFamily: 'monospace',
                    fontSize: 10,
                  }}
                >
                  esc
                </kbd>{' '}
                clear
              </span>
            </div>
          </motion.div>

          {/* Conversation Responses (if query has been dispatched) */}
          {messages.length > 0 && (
            <div className="w-full max-w-full md:max-w-[560px] mx-auto mt-6 space-y-3 text-left">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`p-4 rounded-xl text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-white/[0.06] text-white/90 ml-6 border border-white/[0.08]'
                      : 'bg-black/60 text-white/95 border border-cyan-500/25 shadow-[0_0_20px_rgba(34,211,238,0.08)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                    {m.role === 'user' ? 'You' : 'CoreIQ Engine'}
                  </div>
                  <div>{m.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* =====================================================================
            SECTION F: BOTTOM STICKY CTA (Mobile Only: <768px, md:hidden)
            ===================================================================== */}
        <div
          className="sticky bottom-0 z-50 block md:hidden w-full px-[24px] pt-[16px]"
          style={{
            paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
            background: 'linear-gradient(to top, #080808 55%, transparent)',
          }}
        >
          <div className="w-full">
            <GradientBorderBox fast radius={999} className="w-full">
              <button
                ref={stickyCtaRef}
                onClick={() => {
                  textareaRef.current?.focus();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{ touchAction: 'manipulation' }}
                className="cta-btn w-full !h-[54px] !leading-[54px] !text-[16px] !font-[600]"
              >
                Get Started Free →
              </button>
            </GradientBorderBox>
          </div>

          <div
            onClick={() => onNavigate('command')}
            className="text-[13px] text-[rgba(255,255,255,0.32)] text-center mt-[10px] cursor-pointer hover:text-white/60 transition-colors"
          >
            Already a client? Sign in
          </div>
        </div>
      </div>

      {/* =====================================================================
          SECTION G: MAATVERSE TEASER BAND (Normal document flow)
          ===================================================================== */}
      <motion.section
        initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full px-[24px] py-[56px] bg-[#0a0a0a]"
        style={{
          backgroundImage:
            'linear-gradient(135deg, rgba(255,180,0,0.025) 0%, transparent 60%)',
        }}
      >
        <div className="max-w-[768px] mx-auto">
          {/* Eyebrow label */}
          <div className="text-[11px] font-[600] tracking-[0.15em] text-[rgba(255,180,0,0.70)] mb-[10px] uppercase">
            MAATVERSE
          </div>

          {/* Heading */}
          <h2 className="text-[clamp(1.4rem,5vw,1.8rem)] font-[700] text-white mb-[8px]">
            Digital Goods Store
          </h2>

          {/* Subheading */}
          <p className="text-[14px] text-[rgba(255,255,255,0.48)] leading-[1.55] mb-[28px]">
            AI art, wallpapers, beats, micro-apps and mobile games. Download instantly.
          </p>

          {/* Category pills — horizontal scroll row with staggered reveal */}
          <div className="flex gap-[8px] overflow-x-auto pb-[4px] no-scrollbar">
            {maatversePills.map((pill, idx) => (
              <motion.div
                key={pill}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16, scale: prefersReducedMotion ? 1 : 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{
                  delay: prefersReducedMotion ? 0 : idx * 0.06,
                  duration: prefersReducedMotion ? 0 : 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <button
                  type="button"
                  style={{ touchAction: 'manipulation', minHeight: 44 }}
                  className="whitespace-nowrap px-[16px] py-[8px] rounded-[999px] bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.10)] text-[13px] text-[rgba(255,255,255,0.68)] hover:bg-[rgba(255,255,255,0.09)] hover:border-[rgba(255,255,255,0.18)] transition-all duration-150 cursor-pointer"
                >
                  {pill}
                </button>
              </motion.div>
            ))}
          </div>

          {/* Mock product cards — horizontal scroll row with CSS scroll-snap */}
          <div
            className="flex gap-[12px] overflow-x-auto pb-[8px] no-scrollbar mt-[24px] pr-[24px]"
            style={{
              scrollSnapType: 'x mandatory',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {maatverseCards.map((card, idx) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  delay: prefersReducedMotion ? 0 : idx * 0.08,
                  duration: prefersReducedMotion ? 0 : 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="w-[160px] min-w-[160px] h-[200px] rounded-[14px] relative overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_8px_32px_rgba(0,0,0,0.45)] shrink-0"
                style={{
                  scrollSnapAlign: 'start',
                  background: card.background,
                }}
              >
                {/* Bottom info area */}
                <div
                  className="absolute bottom-0 left-0 right-0 p-[12px]"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
                  }}
                >
                  <span className="text-[12px] font-[600] text-white block mb-[6px] truncate">
                    {card.title}
                  </span>
                  <span className="inline-block bg-[rgba(255,255,255,0.15)] rounded-[6px] px-[8px] py-[2px] text-[11px] font-[500] text-white">
                    {card.price}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* CTA link below cards */}
          <div className="block text-right text-[13px] text-[rgba(255,255,255,0.40)] mt-[16px] cursor-pointer hover:text-[rgba(255,255,255,0.70)] transition-colors duration-150">
            <span onClick={() => onNavigate('apps')}>Explore Maatverse →</span>
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default Ask;
