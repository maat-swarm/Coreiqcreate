import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown, RefreshCw } from 'lucide-react';
import { GradientBorderBox } from '../components/ask/GradientBorderBox';
import { ScrambleText } from '../components/ask/ScrambleText';
import { SafeMarkdown } from '../components/ask/SafeMarkdown';
import { useMagneticHover } from '../hooks/useMagneticHover';
import { coreIQRuntime } from '../services/coreiqRuntime';
import { CoreIQData } from '../services/supabase';
import { LeadCaptureCard } from '../components/ask/LeadCaptureCard';
import '../styles/ask.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isError?: boolean;
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

const STARTER_CHIPS = [
  'Build a website',
  'Automate my business',
  'Create an app',
  'I am not sure yet',
];

function getOrCreateSessionId(): string {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      let id = sessionStorage.getItem('coreiq_ask_session_id');
      if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'c1000000-0000-4000-8000-000000000001';
        sessionStorage.setItem('coreiq_ask_session_id', id);
      }
      return id;
    }
  } catch {}
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'c1000000-0000-4000-8000-000000000001';
}

export const Ask: React.FC<AskProps> = ({ onNavigate, initialPrompt }) => {
  const [sessionId] = useState<string>(getOrCreateSessionId);
  const [capturedContact, setCapturedContact] = useState<{
    name: string;
    email: string;
    phone: string;
    company: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<TabCategory>('agents');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [slowNotice, setSlowNotice] = useState(false);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);

  // Viewport tracking for mobile virtual keyboards
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);

  // Scroll tracking state
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const messageListRef = useRef<HTMLDivElement>(null);
  const latestReplyRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialSentRef = useRef<string | null>(null);
  const sendBtnRef = useMagneticHover<HTMLButtonElement>(0.25);
  const lastUserTextRef = useRef<string>('');

  // Prefers reduced motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Background ping on page open to wake up server if asleep
  useEffect(() => {
    fetch('/api/v1/ping').catch(() => {});
  }, []);

  // Suppress outer layout footer while on Ask page
  useEffect(() => {
    document.body.classList.add('ask-page-active');
    return () => {
      document.body.classList.remove('ask-page-active');
    };
  }, []);

  // Focus textarea on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Track visualViewport on touch devices to pin the input bar right above the soft keyboard
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const onViewportChange = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      }
    };

    window.visualViewport.addEventListener('resize', onViewportChange);
    window.visualViewport.addEventListener('scroll', onViewportChange);
    onViewportChange();

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', onViewportChange);
        window.visualViewport.removeEventListener('scroll', onViewportChange);
      }
    };
  }, []);

  // Speech synthesis toggle
  const handleToggleSpeech = (messageId: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (speakingMessageId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onend = () => setSpeakingMessageId((c) => (c === messageId ? null : c));
    utterance.onerror = () => setSpeakingMessageId((c) => (c === messageId ? null : c));
    setSpeakingMessageId(messageId);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Send Query
  const sendQuery = async (queryText?: string) => {
    const text = (queryText ?? input).trim();
    if (!text || loading) return;

    lastUserTextRef.current = text;
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setSlowNotice(false);

    // Bring user message into view immediately
    setTimeout(() => {
      if (messageListRef.current) {
        messageListRef.current.scrollTo({
          top: messageListRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 50);

    // 4-second slow notice timer
    const slowTimer = setTimeout(() => {
      setSlowNotice(true);
    }, 4000);

    try {
      // 45-second timeout promise
      const timeoutPromise = new Promise<{ assistantMessage: string }>((_, reject) => {
        setTimeout(() => reject(new Error('REQUEST_TIMEOUT')), 45000);
      });

      const response = await Promise.race([
        coreIQRuntime.processQuery(text, undefined, sessionId),
        timeoutPromise,
      ]);

      clearTimeout(slowTimer);
      setSlowNotice(false);

      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.assistantMessage,
        timestamp: new Date(),
      };

      const updatedHistory = [...messages, userMsg, aiMsg];
      setMessages((prev) => [...prev, aiMsg]);

      // Handle reply scroll behavior
      setTimeout(() => {
        if (!messageListRef.current) return;
        const container = messageListRef.current;
        const replyEl = latestReplyRef.current;

        if (replyEl) {
          const replyHeight = replyEl.offsetHeight;
          const visibleHeight = container.clientHeight;

          if (replyHeight > visibleHeight) {
            // Reply is taller than visible area: scroll to its top and show Jump to latest button
            replyEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setShowJumpToLatest(true);
          } else {
            // Reply fits in visible area: scroll so top of reply is visible
            replyEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setShowJumpToLatest(false);
          }
        }
      }, 100);

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
          session_id: sessionId,
        });
        if (lead?.id) setActiveLeadId(lead.id);
      } else {
        await CoreIQData.updateLead(activeLeadId, {
          full_conversation: fullTurns,
          conversation_summary: text,
          session_id: sessionId,
        });
      }

      // Auto-resend updated transcript to CRM 5s after assistant reply if contact was already captured
      if (capturedContact) {
        setTimeout(() => {
          fetch('/api/v1/public/lead-capture', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: sessionId,
              source: 'coreiq-website-ask',
              name: capturedContact.name,
              email: capturedContact.email || null,
              phone: capturedContact.phone || null,
              company: capturedContact.company || null,
              summary: aiMsg.content.slice(0, 1200),
              intent: 'website',
              consent: true,
              page_url: window.location.href,
              transcript: updatedHistory.map((h) => ({
                role: h.role === 'user' ? 'visitor' : 'assistant',
                text: h.content,
                at: h.timestamp.toISOString(),
              })),
              honeypot: '',
            }),
          }).catch(() => {});
        }, 5000);
      }
    } catch {
      clearTimeout(slowTimer);
      setSlowNotice(false);

      // Show friendly error message with Try again button
      const errorAiMsg: Message = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: 'We encountered a temporary connection delay while generating your solution.',
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorAiMsg]);

      setTimeout(() => {
        latestReplyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } finally {
      clearTimeout(slowTimer);
      setLoading(false);
      setSlowNotice(false);
    }
  };

  // Handle initial prompt from homepage or route navigation exactly once
  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && initialSentRef.current !== initialPrompt.trim()) {
      initialSentRef.current = initialPrompt.trim();
      sendQuery(initialPrompt.trim());
    }
  }, [initialPrompt]);

  // Handle scroll detection inside the message log
  const handleScroll = () => {
    if (!messageListRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = messageListRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const scrolledUp = distanceFromBottom > 90;
    setIsScrolledUp(scrolledUp);
    if (!scrolledUp) {
      setShowJumpToLatest(false);
    }
  };

  // Keyboard events on textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setInput('');
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  // Pre-fill contact extraction from previous visitor messages
  const extractedPrefill = useMemo(() => {
    let name = '';
    let email = '';
    let phone = '';
    let company = '';

    for (const m of messages) {
      if (m.role === 'user') {
        if (!email) {
          const emailMatch = m.content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) email = emailMatch[0];
        }
        if (!phone) {
          const phoneMatch = m.content.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/);
          if (phoneMatch && phoneMatch[0].length >= 7) phone = phoneMatch[0];
        }
        if (!name) {
          const nameMatch = m.content.match(/(?:my name is|i am|i'm)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)/i);
          if (nameMatch) name = nameMatch[1];
        }
      }
    }
    return { name, email, phone, company };
  }, [messages]);

  // Visitor message count for "Take this forward" gate
  const visitorMessageCount = useMemo(() => {
    return messages.filter((m) => m.role === 'user').length;
  }, [messages]);

  const activeConfig = STATIC_TABS.find((t) => t.id === activeTab) ?? STATIC_TABS[0];

  return (
    <div
      id="ask-page-root"
      style={{
        height: viewportHeight ? `${viewportHeight}px` : '100%',
        maxHeight: viewportHeight ? `${viewportHeight}px` : '100%',
      }}
      className="relative w-full flex flex-col justify-between overflow-hidden bg-[#080808] text-white selection:bg-cyan-500/30 selection:text-cyan-200 font-sans"
    >
      {/* Hidden file input for Attach icon button */}
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

      {/* Background radial atmosphere */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse 65% 45% at 50% 35%, rgba(180,60,20,0.08) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* =====================================================================
          MIDDLE MESSAGE LIST AREA (Independent Scrollable Container)
          ===================================================================== */}
      <div
        ref={messageListRef}
        onScroll={handleScroll}
        role="log"
        aria-live="polite"
        className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 flex flex-col"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* EMPTY STATE: Centered Hero + Tabs + Starter Chips */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center max-w-[768px] mx-auto w-full py-4 my-auto">
            {/* Headline with ScrambleText */}
            <motion.h1
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="text-[clamp(2.2rem,8vw,3.2rem)] font-[800] leading-[1.08] tracking-[-0.03em] text-[#ffffff] mb-3 select-none"
            >
              <ScrambleText text="One brief." delay={100} duration={700} />
              <br />
              <ScrambleText text="One solution." delay={400} duration={800} />
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.1, duration: prefersReducedMotion ? 0 : 0.45 }}
              className="text-[clamp(0.92rem,3.2vw,1.05rem)] font-[400] text-white/55 leading-relaxed max-w-[480px] mb-5"
            >
              Agents. Apps. Automation. Built for your business — deployed in days, not months.
            </motion.p>

            {/* Category Tabs */}
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.2, duration: prefersReducedMotion ? 0 : 0.45 }}
              className="flex gap-1 bg-white/[0.07] rounded-full p-1 mb-6"
            >
              {STATIC_TABS.map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    style={{ touchAction: 'manipulation' }}
                    className={`px-4 py-2 min-h-[44px] rounded-full text-xs sm:text-[13px] font-medium border-none cursor-pointer flex items-center gap-1.5 transition-all duration-150 ${
                      isSelected
                        ? 'bg-white/[0.14] text-white shadow-sm'
                        : 'bg-transparent text-white/45 hover:text-white/70'
                    }`}
                  >
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </motion.div>

            {/* 4 Starter Chips */}
            <motion.div
              initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0 : 0.3, duration: prefersReducedMotion ? 0 : 0.45 }}
              className="flex flex-wrap items-center justify-center gap-2 max-w-[560px]"
            >
              {STARTER_CHIPS.map((chipText) => (
                <button
                  key={chipText}
                  type="button"
                  onClick={() => sendQuery(chipText)}
                  disabled={loading}
                  style={{ touchAction: 'manipulation' }}
                  className="px-4 py-2.5 min-h-[44px] rounded-full text-xs font-medium bg-white/[0.06] hover:bg-cyan-500/15 border border-white/[0.10] hover:border-cyan-400/50 text-white/80 hover:text-cyan-200 transition-all duration-150 cursor-pointer disabled:opacity-50"
                >
                  {chipText}
                </button>
              ))}
            </motion.div>
          </div>
        ) : (
          /* CONVERSATION MESSAGE LIST */
          <div className="w-full max-w-[720px] mx-auto space-y-4 pb-4">
            {messages.map((m, idx) => {
              const isLatestAssistant = idx === messages.length - 1 && m.role === 'assistant';
              const showTakeThisForward = isLatestAssistant && visitorMessageCount >= 3 && !m.isError;

              return (
                <div
                  key={m.id}
                  ref={isLatestAssistant ? latestReplyRef : undefined}
                  className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed transition-all ${
                    m.role === 'user'
                      ? 'bg-white/[0.07] text-white/95 ml-auto max-w-[85%] sm:max-w-[75%] border border-white/[0.10]'
                      : 'bg-[#090d19]/90 text-white/95 mr-auto max-w-full border border-cyan-500/25 shadow-[0_0_24px_rgba(34,211,238,0.06)]'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-wider text-cyan-400 select-none">
                      {m.role === 'user' ? 'You' : 'CoreIQ Engine'}
                    </div>

                    {m.role === 'assistant' && !m.isError && (
                      <button
                        type="button"
                        onClick={() => handleToggleSpeech(m.id, m.content)}
                        aria-label={speakingMessageId === m.id ? 'Stop reading aloud' : 'Read aloud'}
                        style={{ touchAction: 'manipulation' }}
                        className="text-[11px] font-mono px-2.5 py-1 min-h-[32px] rounded-lg border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 bg-cyan-950/40 transition-colors cursor-pointer"
                      >
                        {speakingMessageId === m.id ? 'Stop' : 'Read aloud'}
                      </button>
                    )}
                  </div>

                  {/* Message Content: Formatted via SafeMarkdown without raw ** or - */}
                  {m.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{m.content}</div>
                  ) : (
                    <div>
                      <SafeMarkdown content={m.content} />

                      {/* Error state with Try Again button */}
                      {m.isError && (
                        <div className="mt-3 pt-3 border-t border-rose-500/20 flex items-center justify-between gap-3">
                          <span className="text-xs text-rose-300">Connection delay</span>
                          <button
                            type="button"
                            onClick={() => sendQuery(lastUserTextRef.current)}
                            disabled={loading}
                            className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-semibold flex items-center gap-1.5 min-h-[44px] cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Try again</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* "Take this forward": ONLY on latest assistant reply AND after at least 3 visitor messages */}
                  {showTakeThisForward && (
                    <LeadCaptureCard
                      sessionId={sessionId}
                      summaryText={m.content.slice(0, 1200)}
                      transcript={messages.map((h) => ({
                        role: h.role === 'user' ? 'visitor' : 'assistant',
                        text: h.content,
                        at: h.timestamp.toISOString(),
                      }))}
                      prefillName={extractedPrefill.name}
                      prefillEmail={extractedPrefill.email}
                      prefillPhone={extractedPrefill.phone}
                      prefillCompany={extractedPrefill.company}
                      alreadyCaptured={Boolean(capturedContact)}
                      onCaptured={(contact) => setCapturedContact(contact)}
                    />
                  )}
                </div>
              );
            })}

            {/* Pending Typing Indicator */}
            {loading && (
              <div className="p-4 rounded-2xl bg-[#090d19]/90 text-white/95 border border-cyan-500/25 shadow-[0_0_20px_rgba(34,211,238,0.06)] max-w-full sm:max-w-[320px] mr-auto flex items-center gap-3">
                <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
                  CoreIQ Engine
                </span>
                <div className="flex items-center gap-1.5 py-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Floating "Jump to latest" button when reply is taller than viewport or user scrolled up */}
        <AnimatePresence>
          {showJumpToLatest && (
            <motion.button
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={() => {
                if (messageListRef.current) {
                  messageListRef.current.scrollTo({
                    top: messageListRef.current.scrollHeight,
                    behavior: 'smooth',
                  });
                }
                setShowJumpToLatest(false);
              }}
              style={{ touchAction: 'manipulation', minHeight: 44, minWidth: 44 }}
              className="sticky bottom-4 ml-auto mr-4 z-30 px-4 py-2.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-400/40 shadow-[0_4px_24px_rgba(0,0,0,0.7)] backdrop-blur-md text-xs font-semibold flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <span>Jump to latest</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* =====================================================================
          BOTTOM PINNED INPUT AREA (Always stays visible above keyboard)
          ===================================================================== */}
      <div
        className="relative z-20 shrink-0 w-full px-4 sm:px-6 pt-2 pb-3 bg-gradient-to-t from-[#080808] via-[#080808]/95 to-transparent border-t border-white/[0.04]"
        style={{
          paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        }}
      >
        <div className="w-full max-w-[720px] mx-auto">
          {/* Rainbow Gradient Border Box with focus-within glowing */}
          <div
            className={`w-full rounded-[18px] transition-shadow duration-300 ${
              isFocused
                ? 'shadow-[0_0_40px_rgba(0,230,118,0.2),0_0_80px_rgba(0,176,255,0.12)]'
                : 'shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
            }`}
          >
            <GradientBorderBox>
              <div className="bg-[#0c0c0c] rounded-[18px] p-3 sm:p-4 flex flex-col min-h-[90px] justify-between text-left focus-within:ring-0">
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
                  style={{ fontSize: '15px' }}
                  className="w-full bg-transparent border-none outline-none resize-none font-normal text-white/90 placeholder:text-white/30 leading-relaxed min-h-[48px] flex-1 focus:ring-0 focus:outline-none"
                />

                {/* Bottom Row of Input Bar */}
                <div className="flex justify-between items-center mt-2 pt-1 border-t border-white/[0.04]">
                  {/* Left: 4 circular utility icon buttons (each at least 44px) */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
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
                      className="w-11 h-11 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.12] transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
                      className="w-11 h-11 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.12] transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
                      className="w-11 h-11 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.12] transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
                      className="w-11 h-11 rounded-full bg-white/[0.07] border border-white/[0.08] flex items-center justify-center text-white/50 hover:text-white hover:bg-white/[0.12] transition-colors cursor-pointer"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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

                  {/* Right: Send arrow button with magnetic hover */}
                  <button
                    ref={sendBtnRef}
                    type="button"
                    onClick={() => sendQuery()}
                    disabled={loading || !input.trim()}
                    title="Send message"
                    aria-label="Send message"
                    style={{ touchAction: 'manipulation', minWidth: 44, minHeight: 44 }}
                    className="w-11 h-11 rounded-full bg-white/[0.10] border border-white/[0.12] flex items-center justify-center hover:bg-white/[0.20] transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path
                          d="M3 8h10M9 4l4 4-4 4"
                          stroke="white"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </GradientBorderBox>
          </div>

          {/* Under-input status bar: 4s idle notice & keyboard hints */}
          <div className="flex items-center justify-between mt-2 px-1 text-[11px] text-white/40 font-mono min-h-[20px]">
            {slowNotice ? (
              <span className="text-amber-300 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                Starting up, this can take up to 30 seconds.
              </span>
            ) : (
              <span />
            )}

            {/* Keyboard Shortcuts Hint: hidden on touch devices */}
            <div className="keyboard-hints hidden sm:flex items-center gap-3">
              <span>
                <kbd className="bg-white/10 border border-white/15 rounded px-1.5 py-0.5 text-[10px]">↵</kbd> send
              </span>
              <span>
                <kbd className="bg-white/10 border border-white/15 rounded px-1.5 py-0.5 text-[10px]">esc</kbd> clear
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Ask;
