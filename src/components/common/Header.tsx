import React, { useState } from 'react';
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
];

export const Header: React.FC<HeaderProps> = ({ currentRoute, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);

  const handleNavClick = (route: NavRoute) => {
    onNavigate(route);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeNavId = NAV_ITEMS.some((i) => i.id === currentRoute) ? currentRoute : null;
  const targetUnderlineId = hoveredNav || activeNavId;

  return (
    <header className="sticky top-0 z-50 w-full bg-[#030712]/80 backdrop-blur-xl border-b border-cyan-500/10 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <div 
          onClick={() => handleNavClick('home')} 
          className="focus:outline-none transition-transform duration-200 active:scale-95 cursor-pointer"
        >
          <CoreIQLogo size="md" />
        </div>

        {/* Desktop Navigation Links */}
        <nav 
          className="hidden md:flex items-center gap-6 lg:gap-8 relative py-2"
          onMouseLeave={() => setHoveredNav(null)}
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentRoute === item.id;
            const isHovered = hoveredNav === item.id;
            const isUnderlined = targetUnderlineId === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                onMouseEnter={() => setHoveredNav(item.id)}
                className="group relative text-sm font-medium py-2 px-2.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-lg cursor-pointer select-none transition-transform duration-200"
              >
                {/* Sliding ambient backdrop highlight */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.span
                      layoutId="navHoverBacklight"
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      className="absolute inset-0 -my-1 -mx-2 rounded-xl bg-gradient-to-b from-cyan-500/[0.09] to-cyan-500/[0.02] border border-cyan-400/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] pointer-events-none -z-0"
                    />
                  )}
                </AnimatePresence>

                {/* Subtle text-gradient shift on hover and active */}
                <span 
                  className={`relative z-10 transition-transform duration-200 inline-block group-hover:-translate-y-0.5 nav-text-gradient ${
                    isActive ? 'is-active' : ''
                  } ${isHovered ? 'is-hovered' : ''}`}
                >
                  {item.label}
                </span>

                {/* Sliding underline effect: glides between links with physics spring */}
                {isUnderlined && (
                  <motion.div
                    layoutId="navSlidingUnderline"
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 30,
                      mass: 0.65,
                    }}
                    className="absolute -bottom-1 left-1.5 right-1.5 h-[2.5px] pointer-events-none z-20"
                  >
                    {/* Luminous multi-stop gradient energy beam */}
                    <div className="w-full h-full rounded-full bg-gradient-to-r from-transparent via-cyan-400 via-sky-300 to-transparent shadow-[0_0_12px_rgba(34,211,238,0.9),0_0_22px_rgba(6,182,212,0.45)]" />
                    {/* High-intensity micro center beam pip */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-[3.5px] rounded-full bg-white shadow-[0_0_6px_#ffffff,0_0_12px_#22d3ee]" />
                  </motion.div>
                )}

                {/* Subtle persistent active beacon when hovered on another link */}
                {isActive && !isUnderlined && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-[0_0_6px_#22d3ee] pointer-events-none" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Action Button: Ask Core IQ */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => handleNavClick('ask')}
            className={`group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 active:scale-95 cursor-pointer ${
              currentRoute === 'ask'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 shadow-[0_0_24px_rgba(34,211,238,0.4)]'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-cyan-500/30 hover:border-cyan-400 hover:shadow-[0_0_22px_rgba(34,211,238,0.3)]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-cyan-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            <span className="relative z-10 font-semibold tracking-wide">Ask Core IQ</span>
            <span className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/0 via-cyan-400/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          </button>
        </div>

        {/* Mobile Menu Trigger */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => handleNavClick('ask')}
            className="p-2 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 active:scale-90 transition-transform"
            aria-label="Ask Core IQ"
          >
            <Sparkles className="w-4 h-4 animate-pulse" />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-white focus:outline-none active:scale-90 transition-transform"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer with Smooth Animation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden bg-[#040816]/98 border-b border-cyan-500/20 backdrop-blur-2xl"
          >
            <div className="px-6 py-6 space-y-3">
              {NAV_ITEMS.map((item, idx) => {
                const isActive = currentRoute === item.id;
                return (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03, duration: 0.2 }}
                    onClick={() => handleNavClick(item.id)}
                    className={`flex items-center justify-between w-full text-left py-2.5 px-4 rounded-xl text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]'
                        : 'text-slate-300 hover:bg-slate-800/60 active:bg-slate-800'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isActive && <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />}
                  </motion.button>
                );
              })}

              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.2 }}
                onClick={() => handleNavClick('ask')}
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500/25 via-blue-600/25 to-purple-600/25 border border-cyan-400/50 text-cyan-200 font-semibold text-base shadow-[0_0_20px_rgba(34,211,238,0.25)] active:scale-95 transition-transform"
              >
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Ask Core IQ</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
