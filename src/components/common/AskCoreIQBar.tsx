import React, { useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
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
  const [isFocused, setIsFocused] = useState(false);

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
    <MotionConfig reducedMotion="user">
    <div className={`w-full max-w-2xl relative ${className}`}>
      {/* Activation rings — the environment visibly "switches on" around the bar on focus */}
      <AnimatePresence>
        {isFocused && (
          <>
            <motion.span
              key="activation-ring-1"
              initial={{ opacity: 0.5, scale: 0.94 }}
              animate={{ opacity: 0, scale: 1.35 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full border border-cyan-400/50 pointer-events-none"
            />
            <motion.span
              key="activation-ring-2"
              initial={{ opacity: 0.4, scale: 0.94 }}
              animate={{ opacity: 0, scale: 1.7 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
              className="absolute inset-0 rounded-full border border-purple-400/35 pointer-events-none"
            />
          </>
        )}
      </AnimatePresence>

      {/* Dynamic ambient energy glow behind the bar — intensifies and widens on focus */}
      <motion.div
        aria-hidden
        className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-blue-500/20 blur-lg pointer-events-none"
        animate={{ opacity: isFocused ? 1 : 0.4, scale: isFocused ? 1.08 : 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* The Luminous Input Pill */}
      <motion.form
        onSubmit={handleSubmit}
        animate={{ scale: isFocused ? 1.012 : 1 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className={`relative flex items-center w-full rounded-full bg-slate-950/80 border shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-300 backdrop-blur-xl ${
          isFocused ? 'border-cyan-400 shadow-[0_0_45px_rgba(34,211,238,0.4)]' : 'border-cyan-500/30'
        } ${isLarge ? 'p-2 pl-6' : 'p-1.5 pl-5'}`}
      >
        <motion.div
          className="shrink-0 mr-3"
          animate={isFocused ? { rotate: [0, -14, 14, 0], scale: [1, 1.2, 1] } : { rotate: 0, scale: 1 }}
          transition={isFocused ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        >
          <Sparkles className={`w-5 h-5 transition-colors duration-300 ${isFocused ? 'text-cyan-300' : 'text-cyan-400'}`} />
        </motion.div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm sm:text-base font-medium pr-3"
        />

        <motion.button
          type="submit"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{ boxShadow: isFocused ? '0 0 26px rgba(34,211,238,0.65)' : '0 0 15px rgba(34,211,238,0.5)' }}
          transition={{ duration: 0.3 }}
          className="shrink-0 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 flex items-center justify-center focus:outline-none"
          aria-label="Submit prompt"
        >
          <ArrowRight className="w-5 h-5 stroke-[2.5]" />
        </motion.button>
      </motion.form>

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
    </MotionConfig>
  );
};
