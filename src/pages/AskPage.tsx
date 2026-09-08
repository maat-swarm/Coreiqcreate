import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Cpu, 
  Layers, 
  Clock, 
  CheckCircle2, 
  HelpCircle, 
  RefreshCw, 
  MessageSquare, 
  Boxes,
  Send
} from 'lucide-react';
import { CoreIQLogo } from '../components/common/CoreIQLogo';
import { coreIQRuntime, CoreIQAnalysisResponse } from '../services/coreiqRuntime';
import { NavRoute } from '../types';

interface AskPageProps {
  initialPrompt?: string;
  onNavigate: (route: NavRoute) => void;
}

interface ChatTurn {
  id: string;
  sender: 'user' | 'coreiq';
  text?: string;
  analysis?: CoreIQAnalysisResponse;
  timestamp: string;
}

export const AskPage: React.FC<AskPageProps> = ({ initialPrompt = '', onNavigate }) => {
  const [inputPrompt, setInputPrompt] = useState(initialPrompt);
  const [loading, setLoading] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);

  const defaultSuggestedPrompts = [
    'I want to automate my business workflows and CRM',
    'I need an AI customer support agent for my store',
    'I want to build a custom web app with user accounts',
    'I need a modern, high-converting website',
    'I want voice AI for inbound phone calls',
    "I don't know what I need yet — help me explore",
  ];

  const handleRunPrompt = async (promptToRun: string) => {
    if (!promptToRun.trim() || loading) return;

    const userTurn: ChatTurn = {
      id: Math.random().toString(),
      sender: 'user',
      text: promptToRun.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setTurns((prev) => [...prev, userTurn]);
    setInputPrompt('');
    setLoading(true);

    try {
      const response = await coreIQRuntime.analyzeIntent(promptToRun.trim());
      const coreiqTurn: ChatTurn = {
        id: Math.random().toString(),
        sender: 'coreiq',
        analysis: response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTurns((prev) => [...prev, coreiqTurn]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim()) {
      handleRunPrompt(initialPrompt);
    } else if (turns.length === 0) {
      // First visit greeting
      handleRunPrompt("Tell us what you're trying to accomplish. We'll help you figure out what to build.");
    }
  }, [initialPrompt]);

  return (
    <div className="w-full min-h-[90vh] flex flex-col py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      
      {/* Top Creation Header */}
      <div className="text-center space-y-3 mb-8 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask Core IQ Creation Interface</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white font-display">
          What are you trying to <span className="gradient-text-phoenix">accomplish?</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
          Describe your problem, idea, or ambition. Core IQ will analyze your intent and draft a complete architecture blueprint.
        </p>
      </div>

      {/* Suggested Starting Pills (if turn list is small) */}
      {turns.length <= 2 && (
        <div className="mb-8">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-3 text-center">
            Common Inquiries
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {defaultSuggestedPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleRunPrompt(p)}
                className="px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 bg-slate-900/80 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-300 transition-all duration-200"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversational Stream */}
      <div className="flex-1 space-y-6 mb-8">
        {turns.map((turn) => {
          if (turn.sender === 'user') {
            return (
              <div key={turn.id} className="flex justify-end">
                <div className="max-w-2xl bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/40 rounded-2xl rounded-tr-sm p-4 text-sm sm:text-base text-white shadow-lg">
                  <div className="flex items-center justify-between gap-4 text-[11px] text-cyan-300/80 mb-1">
                    <span className="font-semibold uppercase tracking-wider">You</span>
                    <span>{turn.timestamp}</span>
                  </div>
                  <p>{turn.text}</p>
                </div>
              </div>
            );
          }

          if (turn.sender === 'coreiq' && turn.analysis) {
            const bp = turn.analysis.recommendedBlueprint;
            return (
              <div key={turn.id} className="flex justify-start">
                <div className="w-full max-w-3xl bg-[#060c24]/90 border border-cyan-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_0_40px_rgba(6,182,212,0.15)]">
                  {/* Message Header */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                    <div className="flex items-center gap-3">
                      <CoreIQLogo size="sm" />
                      <span className="text-xs font-semibold text-cyan-400 tracking-wider uppercase">
                        Synthesis Result
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">{turn.timestamp}</span>
                  </div>

                  {/* Summary */}
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-white font-display">
                      {turn.analysis.title}
                    </h3>
                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                      {turn.analysis.summary}
                    </p>
                  </div>

                  {/* Recommended Architecture Blueprint Card */}
                  <div className="rounded-2xl bg-slate-950/80 border border-cyan-500/30 p-5 sm:p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">
                        Recommended Blueprint
                      </span>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Est: {bp.estimatedTimeline}</span>
                      </div>
                    </div>

                    <h4 className="text-lg font-bold text-white">
                      {bp.title}
                    </h4>

                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      {bp.description}
                    </p>

                    {/* Stack Pills */}
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                        Suggested Technology Stack
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {bp.suggestedStack.map((tech, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-900 border border-slate-700/80 text-cyan-300"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Capabilities */}
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                        Core Capabilities Built In
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {bp.capabilities.map((cap, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-200">
                            <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span>{cap}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Suggested Next Steps */}
                  <div className="space-y-3">
                    <span className="text-xs font-semibold tracking-wider text-cyan-400 uppercase block">
                      Execution Milestones
                    </span>
                    <div className="space-y-2">
                      {turn.analysis.suggestedNextSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-xs sm:text-sm text-slate-200">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive Discovery Follow-up Questions */}
                  {turn.analysis.interactiveQuestions.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase block">
                        Refine this solution (Click to explore):
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {turn.analysis.interactiveQuestions.map((q, i) => (
                          <button
                            key={i}
                            onClick={() => handleRunPrompt(q)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs text-cyan-300 bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 hover:border-cyan-400 transition-colors text-left"
                          >
                            <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{q}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Connected Core IQ Apps / Solutions Button */}
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => onNavigate('solutions')}
                      className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                    >
                      <span>Explore Related Solutions</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onNavigate('apps')}
                      className="px-5 py-2.5 rounded-full text-xs font-semibold text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors"
                    >
                      <span>Browse Applications</span>
                    </button>
                  </div>

                </div>
              </div>
            );
          }

          return null;
        })}

        {/* Loading indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs sm:text-sm">
              <Sparkles className="w-4 h-4 animate-spin" />
              <span>Core IQ is analyzing your request and structuring architecture...</span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Prompt Input Bar */}
      <div className="sticky bottom-6 z-20 w-full pt-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunPrompt(inputPrompt);
          }}
          className="relative flex items-center w-full rounded-full bg-slate-950/90 border border-cyan-500/40 shadow-[0_0_35px_rgba(6,182,212,0.25)] focus-within:border-cyan-400 focus-within:shadow-[0_0_40px_rgba(34,211,238,0.4)] transition-all duration-300 backdrop-blur-2xl p-2 pl-6"
        >
          <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mr-3 animate-pulse" />
          <input
            type="text"
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            placeholder="Tell us what you're trying to accomplish..."
            disabled={loading}
            className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm sm:text-base font-medium pr-3"
          />
          <button
            type="submit"
            disabled={loading || !inputPrompt.trim()}
            className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-[0_0_15px_rgba(34,211,238,0.5)] focus:outline-none"
            aria-label="Send prompt"
          >
            <Send className="w-4 h-4 stroke-[2.5]" />
          </button>
        </form>
      </div>

    </div>
  );
};
