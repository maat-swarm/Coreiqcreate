import React, { useState, useRef, useEffect } from 'react';
import {
  Paperclip, Mic, Send, Sparkles, Plus,
  Zap, Globe, Code, ChevronDown, X
} from 'lucide-react';
import { CoreIQLogo } from '../components/common/CoreIQLogo';
import { coreiqRuntime } from '../services/coreiqRuntime';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AskPageProps {
  onNavigate: (route: string) => void;
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

export const AskPage: React.FC<AskPageProps> = ({ onNavigate }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await coreiqRuntime.processQuery(content);
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.assistantMessage,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Something went wrong. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const removeAttachment = (i: number) => {
    setAttachments(prev => prev.filter((_, idx) => idx !== i));
  };

  return (
    <div className="flex flex-col h-screen bg-[#050814] relative overflow-hidden">

      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-[100px]" />
      </div>

      {/* Message area */}
      <div className="flex-1 overflow-y-auto">
        {!hasMessages ? (
          /* Empty state — greeting */
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-16 text-center">
            <div className="mb-6 opacity-90">
              <CoreIQLogo size="lg" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight">
              {getGreeting()}
            </h1>
            <p className="text-slate-400 text-base sm:text-lg mb-12 max-w-md">
              What would you like to build today?
            </p>

            {/* Suggestion chips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.label}
                    onClick={() => send(s.label)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/40 hover:bg-slate-900 text-left text-slate-300 text-sm font-medium transition-all duration-200 group"
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
              <div key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-violet-600 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-500/15 border border-cyan-500/25 text-white rounded-tr-sm'
                    : 'bg-slate-900/80 border border-slate-700/60 text-slate-200 rounded-tl-sm'
                }`}>
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
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{animationDelay:'0ms'}} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{animationDelay:'150ms'}} />
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" style={{animationDelay:'300ms'}} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Bottom input bar */}
      <div className="shrink-0 px-4 pb-6 pt-3 border-t border-slate-800/60 bg-[#050814]/95 backdrop-blur-md">
        <div className="max-w-3xl mx-auto">

          {/* Attachment previews */}
          {attachments.length > 0 && (
            <div className="flex gap-2 mb-2 flex-wrap">
              {attachments.map((f, i) => (
                <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-300">
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
            <input ref={fileRef} type="file" multiple className="hidden"
              onChange={e => setAttachments(prev => [...prev, ...Array.from(e.target.files ?? [])])} />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => { setInput(e.target.value); autoResize(); }}
              onKeyDown={handleKey}
              placeholder="Ask Core IQ anything..."
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
            Core IQ can make mistakes. Verify important information.
          </p>
        </div>
      </div>
    </div>
  );
};
