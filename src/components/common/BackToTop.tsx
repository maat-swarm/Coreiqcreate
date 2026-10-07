import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-5 right-5 z-40 p-3 rounded-full bg-slate-900/90 text-cyan-300 border border-cyan-500/40 shadow-[0_4px_20px_rgba(0,0,0,0.5)] hover:bg-cyan-950/80 hover:text-white hover:border-cyan-400 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center ${
        isVisible
          ? 'opacity-100 pointer-events-auto translate-y-0 scale-100'
          : 'opacity-0 pointer-events-none translate-y-3 scale-90'
      }`}
    >
      <ArrowUp className="w-5 h-5" aria-hidden="true" />
    </button>
  );
};
