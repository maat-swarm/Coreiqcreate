import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CoreIQLogo } from './CoreIQLogo';
import { NavRoute } from '../../types';

interface HeaderProps {
  currentRoute: NavRoute;
  onNavigate: (route: NavRoute) => void;
}

const NAV_ITEMS: { id: NavRoute; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'solutions', label: 'Solutions' },
  { id: 'apps', label: 'Apps' },
  { id: 'learn', label: 'Learn' },
  { id: 'tools', label: 'Tools' },
  { id: 'about', label: 'About' },
  { id: 'news', label: 'News' },
  { id: 'command', label: 'Command' },
];

export const Header: React.FC<HeaderProps> = ({ currentRoute, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [observedActiveNav, setObservedActiveNav] = useState<NavRoute | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const sections = document.querySelectorAll<HTMLElement>('section[id], [data-nav-section]');
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const navId = (entry.target.getAttribute('data-nav-section') || entry.target.id) as NavRoute;
            if (NAV_ITEMS.some((i) => i.id === navId)) {
              setObservedActiveNav(navId);
            }
          }
        });
      },
      { threshold: 0.5 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [currentRoute]);

  const handleNavClick = (route: NavRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeNavId = observedActiveNav || (NAV_ITEMS.some((i) => i.id === currentRoute) ? currentRoute : null);
  const targetUnderlineId = hoveredNav || activeNavId;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        isScrolled
          ? 'nav-scrolled bg-[rgba(var(--nav-bg-rgb),0.92)] backdrop-blur-[12px] shadow-[0_1px_12px_rgba(0,0,0,0.1)] border-b border-[rgba(255,255,255,0.1)]'
          : 'nav-frosted bg-[rgba(var(--nav-bg-rgb),0.75)] backdrop-blur-[12px] backdrop-saturate-[1.4] border-b border-[rgba(255,255,255,0.1)]'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <a 
          href="/"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('home');
          }} 
          className="focus:outline-none transition-transform duration-200 active:scale-95 cursor-pointer block"
        >
          <CoreIQLogo size="md" />
        </a>

        {/* Desktop Navigation Links */}
        <nav 
          className="hidden md:flex items-center gap-6 lg:gap-8 relative py-2"
          onMouseLeave={() => setHoveredNav(null)}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentRoute === item.id;
            const isHovered = hoveredNav === item.id;
            const isUnderlined = targetUnderlineId === item.id;

            if (item.id === 'command') {
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`group relative text-sm font-medium px-3 py-1 rounded-md border border-cyan-400/60 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-white transition-all duration-200 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    isActive ? 'bg-cyan-500/20 text-white border-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.3)]' : ''
                  }`}
                >
                  <span className="relative z-10 flex items-center gap-1.5 font-mono text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>Command</span>
                  </span>
                </button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                onMouseEnter={() => setHoveredNav(item.id)}
                className="group relative text-sm font-medium py-2 px-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg cursor-pointer select-none"
              >
                {/* Text with smooth 0.2s color transition to white on hover */}
                <span 
                  className={`relative z-10 transition-colors duration-200 inline-block ${
                    isActive
                      ? 'nav-link-active text-white font-semibold'
                      : isHovered
                      ? 'text-white'
                      : 'text-slate-400'
                  }`}
                >
                  {item.label}
                </span>

                {/* Active/Hover cyan underline with a soft glow */}
                {isUnderlined && (
                  <motion.div
                    layoutId="navSlidingUnderline"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 32,
                      mass: 0.6,
                    }}
                    className="absolute -bottom-1 left-2 right-2 h-[2px] rounded-full bg-[#19d9ff] shadow-[0_0_10px_#19d9ff,0_0_20px_rgba(25,217,255,0.6)] pointer-events-none z-20"
                  />
                )}

                {/* Subtle persistent active beacon when hovered on another link */}
                {isActive && !isUnderlined && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#19d9ff] shadow-[0_0_8px_#19d9ff] pointer-events-none" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Button: Ask CoreIQ */}
        <div className="hidden md:flex items-center gap-4">
          <a
            href="/ask"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('ask');
            }}
            className={`group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 active:scale-95 cursor-pointer ${
              currentRoute === 'ask'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.4)]'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-[rgba(150,185,255,0.2)] hover:border-cyan-400 hover:shadow-[0_0_22px_rgba(34,211,238,0.3)]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            <span className="relative z-10 font-semibold tracking-wide">Ask CoreIQ</span>
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/0 via-cyan-400/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </a>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex md:hidden items-center gap-3">
          <a
            href="/ask"
            onClick={(e) => {
              e.preventDefault();
              handleNavClick('ask');
            }}
            className="p-2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 active:scale-90 transition-transform flex items-center justify-center"
            aria-label="Ask CoreIQ"
          >
            <Sparkles className="w-4 h-4 animate-pulse" aria-hidden="true" />
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white focus:outline-none active:scale-90 transition-transform"
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" aria-hidden="true" /> : <Menu className="w-6 h-6" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden border-b border-[rgba(150,185,255,0.1)] bg-[#050814]/95 backdrop-blur-2xl overflow-hidden"
          >
            <div className="px-4 pt-3 pb-6 space-y-2">
              {NAV_ITEMS.map((item) => {
                const isActive = currentRoute === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-500/15 text-white border border-cyan-500/30'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-[#19d9ff] shadow-[0_0_8px_#19d9ff]" />}
                  </button>
                );
              })}
              <div className="pt-4">
                <a
                  href="/ask"
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavClick('ask');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold text-sm shadow-[0_0_20px_rgba(34,211,238,0.4)] active:scale-98 transition-transform cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Ask CoreIQ</span>
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
