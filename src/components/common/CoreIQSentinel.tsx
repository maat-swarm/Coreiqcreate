import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { useMediaSlot } from '../../services/mediaSlots';
import { NavRoute } from '../../types';

export interface CoreIQSentinelProps {
  page?: 'home' | 'solutions' | 'apps' | 'learn' | 'tools' | 'about';
  onAsk?: (query: string) => void;
  onNavigate?: (route: NavRoute) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Helper to derive page matching the existing App.tsx routing mechanism
function getDerivedPage(): 'home' | 'solutions' | 'apps' | 'learn' | 'tools' | 'about' {
  if (typeof window === 'undefined') return 'home';
  const p = window.location.pathname.replace(/^\//, '').toLowerCase();
  if (p.startsWith('learn/')) return 'learn';
  if (p === 'solutions') return 'solutions';
  if (p === 'apps') return 'apps';
  if (p === 'learn') return 'learn';
  if (p === 'tools') return 'tools';
  if (p === 'about') return 'about';
  return 'home';
}

export const CoreIQSentinel: React.FC<CoreIQSentinelProps> = ({
  page: pageProp,
  onAsk,
  onNavigate,
  className = '',
  style,
}) => {
  const activePage = pageProp || getDerivedPage();
  const slotKey = `${activePage}.showcase`;
  const { items } = useMediaSlot(slotKey);

  // Filter and sort published items only
  const publishedItems = (items || [])
    .filter((item) => item.published)
    .sort((a, b) => a.sort_order - b.sort_order);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, []);

  // Reset index if items change or index is out of bounds
  useEffect(() => {
    if (currentIndex >= publishedItems.length && publishedItems.length > 0) {
      setCurrentIndex(0);
    }
  }, [publishedItems.length, currentIndex]);

  const count = publishedItems.length;
  const hasItems = count > 0;

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % count);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (count <= 1) return;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prevSlide();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      nextSlide();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (count <= 1) return;
    setTouchStart(e.touches[0].clientX);
    setTouchDelta(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    setTouchDelta(e.touches[0].clientX - touchStart);
  };

  const handleTouchEnd = () => {
    if (touchStart === null) return;
    if (touchDelta < -40) {
      nextSlide();
    } else if (touchDelta > 40) {
      prevSlide();
    }
    setTouchStart(null);
    setTouchDelta(0);
  };

  const currentItem = hasItems ? publishedItems[currentIndex] || publishedItems[0] : null;

  const handleCtaClick = (ctaUrl: string) => {
    if (ctaUrl.startsWith('/')) {
      const targetRoute = ctaUrl.replace(/^\//, '') as NavRoute;
      if (onNavigate) {
        onNavigate(targetRoute);
      } else {
        window.history.pushState({}, '', ctaUrl);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    }
  };

  return (
    <div
      className={`relative p-4 sm:p-5 rounded-xl border border-cyan-500/25 bg-[#030712]/70 backdrop-blur-xl shadow-[0_0_40px_rgba(25,217,255,0.06)] w-full text-left space-y-3 transition-all duration-500 hover:border-cyan-400/50 overflow-hidden ${className}`}
      style={style}
    >
      {/* Label row: COREIQ SENTINEL / SYSTEM // ONLINE - kept exactly as original */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#19d9ff] animate-pulse" />
          <span className="text-[11px] font-mono tracking-widest text-cyan-300 font-semibold uppercase">
            COREIQ SENTINEL
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400 tracking-wider">SYSTEM // ONLINE</span>
      </div>

      {/* Panel Body: Carousel when 1+ published items, original body when 0 published items */}
      {hasItems && currentItem ? (
        <div
          ref={carouselRef}
          role="region"
          aria-roledescription="carousel"
          aria-label="CoreIQ Showcase Carousel"
          tabIndex={0}
          onKeyDown={handleKeyDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="space-y-3 focus:outline-none focus:ring-1 focus:ring-cyan-400/60 rounded-lg select-none"
        >
          {/* Slide Track & Image Viewport (Aspect Ratio 16/9, Inset Controls inside bounds) */}
          <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-slate-950/80 border border-slate-800">
            <div
              role="group"
              aria-roledescription="slide"
              aria-label={`${currentIndex + 1} of ${count}`}
              className="w-full h-full relative flex items-center justify-center overflow-hidden"
            >
              <img
                src={currentItem.url || ''}
                alt={currentItem.alt || 'CoreIQ Showcase slide'}
                loading={currentIndex === 0 ? 'eager' : 'lazy'}
                width="800"
                height="450"
                className={`w-full h-full object-cover transition-opacity ${
                  prefersReducedMotion ? 'duration-0' : 'duration-300'
                }`}
              />

              {/* Gradient depth edge */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

              {/* Slide Counter Badge */}
              {count > 1 && (
                <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/80 text-[10px] font-mono text-cyan-300 pointer-events-none">
                  {currentIndex + 1} / {count}
                </div>
              )}

              {/* In-bounds Carousel Navigation Arrows (8px inset from panel edges, z-20) */}
              {count > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      prevSlide();
                    }}
                    aria-label="Previous slide"
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 min-h-[44px] min-w-[44px] rounded-full bg-slate-950/80 hover:bg-cyan-950/90 text-slate-300 hover:text-cyan-200 border border-slate-700/80 hover:border-cyan-500/50 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      nextSlide();
                    }}
                    aria-label="Next slide"
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 min-h-[44px] min-w-[44px] rounded-full bg-slate-950/80 hover:bg-cyan-950/90 text-slate-300 hover:text-cyan-200 border border-slate-700/80 hover:border-cyan-500/50 flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {/* In-bounds Carousel Dots (8px bottom inset, z-20) */}
            {count > 1 && (
              <div className="absolute bottom-2 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
                <div className="flex items-center gap-1 p-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 pointer-events-auto">
                  {publishedItems.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(idx);
                      }}
                      aria-label={`Go to slide ${idx + 1}`}
                      aria-current={currentIndex === idx ? 'true' : undefined}
                      className="p-1 min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-1 focus:ring-cyan-400 rounded-full"
                    >
                      <span
                        className={`block rounded-full transition-all ${
                          currentIndex === idx
                            ? 'w-4 h-1.5 bg-cyan-400 shadow-[0_0_6px_#22d3ee]'
                            : 'w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Caption Block ALWAYS sits BELOW the image inside the panel (never over it) */}
          {(currentItem.title || currentItem.caption || (currentItem.cta_label && currentItem.cta_url)) && (
            <div className="space-y-2 pt-1 border-t border-slate-800/60">
              {currentItem.title && (
                <h4 className="text-xs sm:text-sm font-bold text-white font-display truncate">
                  {currentItem.title}
                </h4>
              )}
              {currentItem.caption && (
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed line-clamp-2">
                  {currentItem.caption}
                </p>
              )}
              {currentItem.cta_label && currentItem.cta_url && (
                <div className="pt-1">
                  {currentItem.cta_url.startsWith('/') ? (
                    <button
                      type="button"
                      onClick={() => handleCtaClick(currentItem.cta_url!)}
                      className="w-full sm:w-auto px-4 py-2 min-h-[44px] rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      <span>{currentItem.cta_label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </button>
                  ) : (
                    <a
                      href={currentItem.cta_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-4 py-2 min-h-[44px] rounded-lg bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-400/40 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      <span>{currentItem.cta_label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Original panel body - rendered unchanged when 0 published items */
        <>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            Intelligent environmental presence active. Connect your intent to synthesize agents, workflows, and tools.
          </p>

          {/* Micro Quick Actions connected to Ask CoreIQ */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                if (onAsk) {
                  onAsk('I want to build an AI agent');
                } else {
                  window.dispatchEvent(
                    new CustomEvent('coreiq:ask', { detail: 'I want to build an AI agent' })
                  );
                }
              }}
              className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 text-[11px] text-slate-300 hover:text-cyan-200 transition-colors truncate flex items-center gap-1.5 min-h-[44px]"
            >
              <span className="text-cyan-400 font-mono text-[10px]">01</span>
              <span>AI Agent</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (onAsk) {
                  onAsk('I want to build a custom web app');
                } else {
                  window.dispatchEvent(
                    new CustomEvent('coreiq:ask', { detail: 'I want to build a custom web app' })
                  );
                }
              }}
              className="text-left px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-500/50 text-[11px] text-slate-300 hover:text-purple-200 transition-colors truncate flex items-center gap-1.5 min-h-[44px]"
            >
              <span className="text-purple-400 font-mono text-[10px]">02</span>
              <span>Web App</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CoreIQSentinel;
