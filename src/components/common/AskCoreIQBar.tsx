import React, { useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface AskCoreIQBarProps {
  placeholder?: string;
  pills?: { label: string; query?: string }[];
  onAsk: (query: string) => void;
  className?: string;
  size?: 'default' | 'large';
}

export const AskCoreIQBar: React.FC<AskCoreIQBarProps> = ({
  placeholder = 'Ask Core IQ anything...',
  pills = [],
  onAsk,
  className = '',
  size = 'default',
}) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onAsk(query.trim());
    } else {
      onAsk("Tell me what I can build with Core IQ");
    }
  };

  const handlePillClick = (pillQuery: string) => {
    onAsk(pillQuery);
  };

  const isLarge = size === 'large';

  return (
    <div className={`w-full max-w-2xl relative ${className}`}>
      {/* Dynamic ambient energy glow behind the bar */}
      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-blue-500/20 blur-lg opacity-40 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* The Luminous Input Pill */}
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center w-full rounded-full bg-slate-950/80 border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] focus-within:border-cyan-400 focus-within:shadow-[0_0_40px_rgba(34,211,238,0.35)] transition-all duration-300 backdrop-blur-xl ${
          isLarge ? 'p-2 pl-6' : 'p-1.5 pl-5'
        }`}
      >
        <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mr-3 animate-pulse" />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm sm:text-base font-medium pr-3"
        />

        <button
          type="submit"
          className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(34,211,238,0.5)] focus:outline-none"
          aria-label="Submit prompt"
        >
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </button>
      </form>

      {/* Suggestion Pills */}
      {pills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mt-3.5">
          {pills.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handlePillClick(pill.query || pill.label)}
              className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium text-slate-300 bg-slate-900/70 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-500/40 hover:text-cyan-300 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>{pill.label}</span>
              <ArrowRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-cyan-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
