import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip, Mic, Send, Sparkles, Plus,
  Zap, Globe, Code, X, ArrowRight, ShieldCheck, CheckCircle2, User, Mail, DollarSign
} from 'lucide-react';
import { CoreIQLogo } from '../components/common/CoreIQLogo';
import { coreIQRuntime } from '../services/coreiqRuntime';
import { CoreIQData } from '../services/supabase';
import { AgentConfig, LeadItem } from '../types/command';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  blueprint?: any;
}

interface AskPageProps {
  onNavigate: (route: string) => void;
  initialPrompt?: string;
}

const SUGGESTIONS = [
  { label: 'Build me a website', icon: Globe },
  { label: 'Automate my business', icon: Zap },
  { label: 'Create an AI agent', icon: Sparkles },
  { label: 'Build an app', icon: Code },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export const AskPage: React.FC<AskPageProps> = ({ onNavigate, initialPrompt }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [activeConfig, setActiveConfig] = useState<AgentConfig | null>(null);
  const [activeLeadId, setActiveLeadId] = useState<string | null>(null);
  
  // Project submission form state inside conversation
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [budgetRange, setBudgetRange] = useState('$5k - $15k');
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = messages.length > 0;
  const initialHandled = useRef(false);

  // Fetch active Agent Brain configuration from Supabase
  useEffect(() => {
    CoreIQData.getAgentConfig().then((cfg) => {
      setActiveConfig(cfg);
    });
  }, []);

  // Handle initialPrompt passed from previous page
  useEffect(() => {
    if (initialPrompt && !initialHandled.current) {
      initialHandled.current = true;
      send(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showInquiryForm, inquirySubmitted]);

  const autoResize = () => {
    const t = textareaRef.current;
    if (!t) return;
    t.style.height = 'auto';
    t.style.height = Math.min(t.scrollHeight, 160) + 'px';
  };

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Dynamic cognitive processing using active agent config
      const response = await coreIQRuntime.processQuery(content, activeConfig || undefined);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.assistantMessage,
        timestamp: new Date(),
        blueprint: response.blueprint,
      };
      
      const newMessages = [...messages, userMsg, aiMsg];
      setMessages((prev) => [...prev, aiMsg]);

      // Automatically sync or update lead in Supabase
      const fullTurns = newMessages.map((m) => ({
        sender: (m.role === 'user' ? 'user' : 'coreiq') as any,
        text: m.content,
        timestamp: m.timestamp.toISOString(),
      }));

      if (!activeLeadId) {
        const newLead = await CoreIQData.insertLead({
          source: 'website',
          client_name: clientName || `Visitor (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
          client_contact: clientEmail || 'Web Inquiry Session',
          client_message: content,
          conversation_summary: content.slice(0, 100),
          intent_type: response.blueprint?.recommendedType || 'custom',
          status: 'new',
          full_conversation: fullTurns,
          budget_range: budgetRange,
        });
        setActiveLeadId(newLead.id);
      } else {
        await CoreIQData.updateLead(activeLeadId, {
          full_conversation: fullTurns,
          conversation_summary: content.slice(0, 100),
        });
      }

    } catch (err) {
      console.error('CoreIQ agent query error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'I encountered an operational latency. Please retry your creation request.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormalInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientEmail.trim()) return;

    const fullTurns = messages.map((m) => ({
      sender: (m.role === 'user' ? 'user' : 'coreiq') as any,
      text: m.content,
      timestamp: m.timestamp.toISOString(),
    }));

    if (activeLeadId) {
      await CoreIQData.updateLead(activeLeadId, {
        client_name: clientName.trim(),
        client_contact: clientEmail.trim(),
        budget_range: budgetRange,
        status: 'new',
        full_conversation: fullTurns,
      });
    } else {
      const created = await CoreIQData.insertLead({
        source: 'website',
        client_name: clientName.trim(),
        client_contact: clientEmail.trim(),
        client_message: messages[0]?.content || 'Project inquiry submitted via Ask CoreIQ',
        conversation_summary: messages[0]?.content?.slice(0, 100) || 'Project inquiry',
        intent_type: 'custom',
        status: 'new',
        full_conversation: fullTurns,
        budget_range: budgetRange,
      });
      setActiveLeadId(created.id);
    }

    setInquirySubmitted(true);
    setShowInquiryForm(false);

    // Confirm in conversation
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Thank you, ${clientName.trim()}. Your project inquiry has been encrypted and routed directly to CoreIQ Command for operator review. We will contact you at ${clientEmail.trim()} with architectural next steps.`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const removeAttachment = (i: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div className="flex flex-col h-screen bg-[#050814] relative overflow-hidden text-slate-100">

      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-[100px]" />
      </div>

      {/* Top Header Information */}
      <div className="shrink-0 px-6 py-3 border-b border-slate-800/60 bg-[#050814]/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#19d9ff] animate-pulse" />
          <span className="text-xs font-mono text-cyan-300 font-semibold">CoreIQ Cognitive Gateway</span>
        </div>

        {activeConfig && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
            <span className="hidden sm:inline">Active Mind:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300">
              {activeConfig.model_name}
            </span>
          </div>
        )}
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto z-10">
        {!hasMessages ? (
          /* Empty state — greeting */
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-16 text-center">
            <div className="mb-6 opacity-90">
              <CoreIQLogo size="lg" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight font-display">
              {getGreeting()}
            </h1>
            <p className="text-slate-400 text-base sm:text-lg mb-12 max-w-md leading-relaxed">
              Tell us what you're trying to accomplish. We'll help you figure out what to build.
            </p>

            {/* Suggestion chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => send(s.label)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/40 hover:bg-slate-900 text-left text-slate-300 text-sm font-medium transition-all duration-200 group shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 group-hover:border-cyan-500/30 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-cyan-400" />
                    </div>
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Message thread */
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_12px_rgba(25,217,255,0.3)]">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] px-4 py-3.5 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.role === 'user'
                      ? 'bg-cyan-500/15 border border-cyan-500/25 text-white rounded-tr-sm'
                      : 'bg-slate-900/90 border border-slate-700/60 text-slate-200 rounded-tl-sm shadow-md'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-slate-900/80 border border-slate-700/60">
                  <div className="flex gap-1.5 items-center h-5">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Bidirectional Project Dispatch CTA */}
            {hasMessages && !showInquiryForm && !inquirySubmitted && (
              <div className="pt-4 flex justify-center">
                <button
                  onClick={() => setShowInquiryForm(true)}
                  className="py-2.5 px-4 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono flex items-center gap-2 transition-all shadow-[0_0_20px_rgba(25,217,255,0.1)]"
                >
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Submit Project to CoreIQ Command Operator</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* In-chat Lead Dispatch Form */}
            {showInquiryForm && !inquirySubmitted && (
              <div className="p-5 rounded-2xl bg-[#070e26] border border-cyan-500/30 shadow-[0_0_30px_rgba(25,217,255,0.15)] space-y-4 max-w-lg mx-auto animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-sm font-bold text-white font-display">Dispatch to CoreIQ Command</h3>
                  </div>
                  <button
                    onClick={() => setShowInquiryForm(false)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  Provide your contact information so the operator can review your blueprint and engage via email/phone.
                </p>

                <form onSubmit={handleFormalInquirySubmit} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                      Your Name or Organization
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        required
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="e.g. Alex Morgan / Apex Labs"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                      Contact Email
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <input
                        type="email"
                        required
                        value={clientEmail}
                        onChange={(e) => setClientEmail(e.target.value)}
                        placeholder="alex@example.com"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1 font-mono">
                      Target Budget Range
                    </label>
                    <div className="relative">
                      <DollarSign className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                      <select
                        value={budgetRange}
                        onChange={(e) => setBudgetRange(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-700/80 text-white text-xs focus:outline-none focus:border-cyan-400 font-mono"
                      >
                        <option value="Under $5k">Under $5k (Sprint MVP)</option>
                        <option value="$5k - $15k">$5k - $15k (Production Web & Agent)</option>
                        <option value="$15k - $50k">$15k - $50k (Enterprise Swarm / Full-Stack)</option>
                        <option value="$50k+">$50k+ (Comprehensive Autonomous System)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowInquiryForm(false)}
                      className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(25,217,255,0.3)] transition-transform active:scale-98"
                    >
                      <span>Transmit to Command</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {inquirySubmitted && (
              <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2.5 max-w-lg mx-auto">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Project brief received by Command. Operator alerted.</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Bottom input bar */}
      <div className="shrink-0 px-4 pb-6 pt-3 border-t border-slate-800/60 bg-[#050814]/95 backdrop-blur-md z-10">
        <div className="max-w-3xl mx-auto">

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {attachments.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300"
                >
                  <Paperclip className="w-3 h-3 text-cyan-400" />
                  <span className="max-w-[120px] truncate">{f.name}</span>
                  <button onClick={() => removeAttachment(i)}>
                    <X className="w-3 h-3 text-slate-500 hover:text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 bg-slate-900/80 border border-slate-700/60 rounded-3xl px-4 py-3 focus-within:border-cyan-500/50 focus-within:shadow-[0_0_30px_rgba(25,217,255,0.1)] transition-all duration-200">

            {/* Attach */}
            <button
              onClick={() => fileRef.current?.click()}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => setAttachments((prev) => [...prev, ...Array.from(e.target.files ?? [])])}
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKey}
              placeholder="Ask CoreIQ anything..."
              rows={1}
              className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm resize-none outline-none leading-relaxed max-h-40 py-1"
            />

            {/* Mic */}
            <button className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors">
              <Mic className="w-4 h-4" />
            </button>

            {/* Send */}
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-cyan-400 hover:bg-cyan-300 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 transition-all duration-200"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          <p className="text-center text-[11px] text-slate-600 mt-2">
            CoreIQ Sovereign Cognitive Engine • Autonomous Swarm Integration
          </p>
        </div>
      </div>
    </div>
  );
};
