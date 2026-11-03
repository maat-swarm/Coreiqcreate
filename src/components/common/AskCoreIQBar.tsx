import React, { useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface AskCoreIQBarProps {
  placeholder?: string;
  pills?: { label: string; query?: string }[];
  onAsk: (query: string) => void;
  className?: string;
  size?: 'default' | 'large';
  disabled?: boolean;
}

export const AskCoreIQBar: React.FC<AskCoreIQBarProps> = ({
  placeholder = 'Ask Core IQ anything...',
  pills = [],
  onAsk,
  className = '',
  size = 'default',
  disabled = false,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleFocusChange = (focused: boolean) => {
    setIsFocused(focused);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coreiq:focus', { detail: { focused } }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetQuery = query.trim();
    if (!targetQuery || disabled) return;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coreiq:submit', { detail: { query: targetQuery } }));
    }
    onAsk(targetQuery);
  };

  const handlePillClick = (pillQuery: string) => {
    const targetQuery = pillQuery.trim();
    if (!targetQuery || disabled) return;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('coreiq:submit', { detail: { query: targetQuery } }));
    }
    onAsk(targetQuery);
  };

  const isLarge = size === 'large';

  return (
    <MotionConfig reducedMotion="user">
      <div className={`w-full max-w-2xl relative ${className}`}>
        {/* Activation rings on focus */}
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
                initial={{ opacity: 0.35, scale: 0.94 }}
                animate={{ opacity: 0, scale: 1.7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
                className="absolute inset-0 rounded-full border border-purple-400/35 pointer-events-none"
              />
            </>
          )}
        </AnimatePresence>

        {/* Dynamic ambient energy glow behind the bar */}
        <motion.div
          aria-hidden
          className="absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-blue-500/20 blur-lg pointer-events-none"
          animate={{ opacity: isFocused ? 0.9 : 0.35, scale: isFocused ? 1.05 : 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />

        {/* The Luminous Input Pill */}
        <motion.form
          onSubmit={handleSubmit}
          animate={{ scale: isFocused ? 1.01 : 1 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={`relative flex items-center w-full rounded-full transition-all duration-300 backdrop-blur-xl animate-input-gradient ${
            isLarge ? 'p-2 pl-6' : 'p-1.5 pl-5'
          }`}
          style={{
            border: isFocused
              ? '1px solid #19d9ff'
              : '1px solid rgba(150, 185, 255, 0.2)',
            boxShadow: isFocused
              ? '0 0 0 3px rgba(25, 217, 255, 0.15), 0 0 32px rgba(25, 217, 255, 0.3), inset 0 0 16px rgba(25, 217, 255, 0.12)'
              : 'inset 0 0 16px rgba(25, 217, 255, 0.08), 0 4px 20px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Star/spark icon */}
          <motion.div
            className="shrink-0 mr-3"
            animate={isFocused ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <Sparkles
              className={`w-5 h-5 transition-colors duration-300 ${
                isFocused ? 'text-[#19d9ff]' : 'text-cyan-400'
              }`}
            />
          </motion.div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => handleFocusChange(true)}
            onBlur={() => handleFocusChange(false)}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full bg-transparent text-white placeholder-slate-400 focus:outline-none text-sm sm:text-base font-medium pr-3 disabled:opacity-50"
          />

          <motion.button
            type="submit"
            disabled={disabled || !query.trim()}
            whileHover={!disabled && query.trim() ? { scale: 1.05 } : undefined}
            whileTap={!disabled && query.trim() ? { scale: 0.95 } : undefined}
            animate={{
              boxShadow: isFocused
                ? '0 0 24px rgba(25, 217, 255, 0.6)'
                : '0 0 14px rgba(25, 217, 255, 0.4)',
            }}
            transition={{ duration: 0.25 }}
            className="shrink-0 w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 flex items-center justify-center focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
                disabled={disabled}
                className="group inline-flex items-center gap-1.5 px-4 py-2.5 min-h-[44px] rounded-full text-xs font-medium text-slate-300 bg-[#091129]/80 hover:bg-cyan-500/10 border border-[rgba(150,185,255,0.16)] hover:border-cyan-400/60 hover:text-cyan-300 transition-all duration-200 hover:-translate-y-0.5 shadow-sm cursor-pointer disabled:opacity-50"
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
