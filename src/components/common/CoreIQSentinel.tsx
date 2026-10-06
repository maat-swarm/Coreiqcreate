import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, Sparkles, Activity, Play, Pause, Volume2, VolumeX, Video as VideoIcon } from 'lucide-react';
import { useMediaSlot } from '../../services/mediaSlots';
import { NavRoute } from '../../types';
import { ASSETS } from '../../assets/images';

export interface CoreIQSentinelProps {
  page?: 'home' | 'solutions' | 'apps' | 'learn' | 'tools' | 'about' | 'news';
  onAsk?: (query: string) => void;
  onNavigate?: (route: NavRoute) => void;
  className?: string;
  style?: React.CSSProperties;
}

// Fallback high-fidelity showcase items when database slot has no custom published uploads
const DEFAULT_PAGE_SHOWCASES: Record<string, Array<{
  id: string;
  url: string;
  alt: string;
  title: string;
  caption: string;
  cta_label?: string;
  cta_url?: string;
  published: boolean;
  sort_order: number;
}>> = {
  home: [
    {
      id: 'default-home-1',
      url: ASSETS.energyCore,
      alt: 'CoreIQ Autonomous Intelligence Matrix',
      title: 'Autonomous Multi-Agent Synthesis',
      caption: 'Self-orchestrating intelligence swarms coordinating tasks in real time across your ecosystem.',
      cta_label: 'Explore Solutions',
      cta_url: '/solutions',
      published: true,
      sort_order: 1,
    },
    {
      id: 'default-home-2',
      url: ASSETS.agentHead,
      alt: 'Cognitive Swarm Orchestration',
      title: 'Neural Action Engine',
      caption: 'Seamless reasoning loops connecting tools, APIs, and business automation workflows.',
      cta_label: 'View AI Agents',
      cta_url: '/solutions',
      published: true,
      sort_order: 2,
    },
    {
      id: 'default-home-3',
      url: ASSETS.hypercubeCrystal,
      alt: 'Quantum Interface Dynamics',
      title: 'Adaptive Application Fabric',
      caption: 'Full-stack dynamic software environments constructed on demand from natural language.',
      cta_label: 'Explore Apps',
      cta_url: '/apps',
      published: true,
      sort_order: 3,
    },
  ],
  solutions: [
    {
      id: 'default-sol-1',
      url: ASSETS.agentHead,
      alt: 'Autonomous Operations',
      title: 'Enterprise AI Workforce',
      caption: 'Deploy specialized AI agents that autonomously monitor, reason, and act across business domains.',
      cta_label: 'Configure Agents',
      cta_url: '/solutions',
      published: true,
      sort_order: 1,
    },
    {
      id: 'default-sol-2',
      url: ASSETS.energyCore,
      alt: 'Integration Core',
      title: 'Universal API Pipeline',
      caption: 'Bridge legacy infrastructure and modern LLMs with zero-latency streaming pipelines.',
      cta_label: 'View Integrations',
      cta_url: '/solutions',
      published: true,
      sort_order: 2,
    },
  ],
  apps: [
    {
      id: 'default-apps-1',
      url: ASSETS.appsShowcase,
      alt: 'Applications Showcase',
      title: 'Intelligent Web Applications',
      caption: 'Production-ready React & Node software built at high velocity with built-in AI intelligence.',
      cta_label: 'Browse Directory',
      cta_url: '/apps',
      published: true,
      sort_order: 1,
    },
  ],
  learn: [
    {
      id: 'default-learn-1',
      url: ASSETS.learnBook,
      alt: 'CoreIQ Knowledge Codex',
      title: 'Master Modern AI Architecture',
      caption: 'Comprehensive guides, code templates, and blueprints for building with modern AI agents.',
      cta_label: 'Start Reading',
      cta_url: '/learn',
      published: true,
      sort_order: 1,
    },
  ],
  tools: [
    {
      id: 'default-tools-1',
      url: ASSETS.toolsCube,
      alt: 'CoreIQ Developer Tools',
      title: 'High-Velocity Developer Suite',
      caption: 'Interactive prompts, schema generators, and live sandbox diagnostics for rapid building.',
      cta_label: 'Open Tools',
      cta_url: '/tools',
      published: true,
      sort_order: 1,
    },
  ],
  about: [
    {
      id: 'default-about-1',
      url: ASSETS.cosmicHorizon,
      alt: 'About CoreIQ',
      title: 'Architecting the Future of Creation',
      caption: 'We believe intelligence should amplify human creativity without friction or gatekeeping.',
      cta_label: 'Our Story',
      cta_url: '/about',
      published: true,
      sort_order: 1,
    },
  ],
  news: [
    {
      id: 'default-news-1',
      url: ASSETS.agentHead,
      alt: 'Frontier AI Intelligence',
      title: 'Real-Time Frontier Signals',
      caption: 'Decoded intelligence reports tracking autonomous agents, reasoning models, and production workflows.',
      cta_label: 'Latest News',
      cta_url: '/news',
      published: true,
      sort_order: 1,
    },
    {
      id: 'default-news-2',
      url: ASSETS.energyCore,
      alt: 'Autonomous Swarms & Infrastructure',
      title: 'Decentralized Swarm Architecture',
      caption: 'Benchmarking multi-agent reasoning, open protocols, and edge intelligence deployment.',
      cta_label: 'Read Analysis',
      cta_url: '/news',
      published: true,
      sort_order: 2,
    },
  ],
};

// Helper to derive page matching the existing App.tsx routing mechanism
function getDerivedPage(): 'home' | 'solutions' | 'apps' | 'learn' | 'tools' | 'about' | 'news' {
  if (typeof window === 'undefined') return 'home';
  const p = window.location.pathname.replace(/^\//, '').toLowerCase();
  if (p.startsWith('learn/')) return 'learn';
  if (p === 'solutions') return 'solutions';
  if (p === 'apps') return 'apps';
  if (p === 'learn') return 'learn';
  if (p === 'tools') return 'tools';
  if (p === 'about') return 'about';
  if (p === 'news') return 'news';
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

  // Filter and sort published items from database, or fallback to default high-res showcase
  const dbPublishedItems = (items || [])
    .filter((item) => item.published)
    .sort((a, b) => a.sort_order - b.sort_order);

  const fallbackItems = DEFAULT_PAGE_SHOWCASES[activePage] || DEFAULT_PAGE_SHOWCASES.home;
  const publishedItems = dbPublishedItems.length > 0 ? dbPublishedItems : fallbackItems;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchDelta, setTouchDelta] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoadError, setVideoLoadError] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);
        const listener = (e: any) => setPrefersReducedMotion(e.matches);
        if (typeof mediaQuery.addEventListener === 'function') {
          mediaQuery.addEventListener('change', listener);
          return () => mediaQuery.removeEventListener('change', listener);
        } else if (typeof (mediaQuery as any).addListener === 'function') {
          (mediaQuery as any).addListener(listener);
          return () => (mediaQuery as any).removeListener(listener);
        }
      } catch {}
    }
  }, []);

  // Reset index if items change or index is out of bounds
  useEffect(() => {
    if (currentIndex >= publishedItems.length && publishedItems.length > 0) {
      setCurrentIndex(0);
    }
  }, [publishedItems.length, currentIndex]);

  const count = publishedItems.length;

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % count);
  };

  // Check if current item is a video
  const currentItem = publishedItems[currentIndex] || publishedItems[0];
  const isCurrentVideo = Boolean(
    currentItem && (
      (currentItem as any).type === 'video' ||
      (currentItem.url && /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(currentItem.url))
    )
  );

  // When active slide changes, pause video and reset error state
  useEffect(() => {
    setVideoLoadError(false);
    setIsVideoPlaying(false);
    if (activeVideoRef.current) {
      try {
        activeVideoRef.current.pause();
        activeVideoRef.current.currentTime = 0;
      } catch {}
    }
  }, [currentIndex]);

  // Autoplay video only when this slide is active and within viewport
  useEffect(() => {
    if (!isCurrentVideo || prefersReducedMotion) return;
    const video = activeVideoRef.current;
    if (!video) return;

    video.preload = 'auto';
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsVideoPlaying(true);
        })
        .catch(() => {
          setIsVideoPlaying(false);
        });
    }
  }, [currentIndex, isCurrentVideo, prefersReducedMotion]);

  // Subtle auto-play cycle every 6.5s when not hovered, not playing video, and not reduced motion
  useEffect(() => {
    if (count <= 1 || isPaused || prefersReducedMotion || isVideoPlaying) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 6500);
    return () => clearInterval(timer);
  }, [count, isPaused, prefersReducedMotion, isVideoPlaying]);

  const toggleVideoPlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = activeVideoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsVideoPlaying(true)).catch(() => setIsVideoPlaying(false));
    } else {
      video.pause();
      setIsVideoPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = activeVideoRef.current;
    if (!video) return;
    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setIsMuted(nextMuted);
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
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`group/sentinel relative p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-cyan-500/25 hover:border-cyan-400/50 bg-gradient-to-b from-[#091533]/85 via-[#050d24]/90 to-[#020614]/95 backdrop-blur-2xl shadow-[0_12px_36px_rgba(0,0,0,0.65),0_0_28px_rgba(6,182,212,0.12)] hover:shadow-[0_16px_44px_rgba(0,0,0,0.75),0_0_36px_rgba(6,182,212,0.2)] w-full text-left space-y-3.5 transition-all duration-500 overflow-hidden ${className}`}
      style={style}
    >
      {/* Top subtle dynamic glowing laser beam */}
      <div className="absolute top-0 inset-x-8 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/80 to-transparent pointer-events-none opacity-80 group-hover/sentinel:opacity-100 transition-opacity" />
      
      {/* Subtle corner cyber accent glow */}
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Header row: COREIQ SENTINEL / SYSTEM STATUS */}
      <div className="relative z-10 flex items-center justify-between pb-2 border-b border-cyan-500/15">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono tracking-widest text-cyan-300 font-semibold uppercase">
              COREIQ SENTINEL
            </span>
            <span className="text-[10px] text-cyan-500/60 font-mono hidden sm:inline">// SHOWCASE</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-300 text-[10px] font-mono tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse" />
            <span>ONLINE</span>
          </div>
          {count > 1 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-cyan-500/25 bg-cyan-950/50 text-cyan-300/90 tracking-wider">
              {currentIndex + 1}/{count}
            </span>
          )}
        </div>
      </div>

      {/* Carousel Container */}
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
        className="space-y-3 focus:outline-none focus:ring-1 focus:ring-cyan-400/50 rounded-xl select-none"
      >
        {/* Slide Viewport: 16:9 aspect, crisp corners, subtle hover zoom */}
        <div className="relative w-full aspect-[16/9] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-950/90 border border-cyan-500/25 shadow-xl group/viewport">
          <div
            role="group"
            aria-roledescription="slide"
            aria-label={`${currentIndex + 1} of ${count}`}
            className="w-full h-full relative flex items-center justify-center overflow-hidden"
          >
            {currentItem && (
              isCurrentVideo && !videoLoadError ? (
                <div className="relative w-full h-full flex items-center justify-center bg-slate-950">
                  <video
                    ref={activeVideoRef}
                    key={currentItem.url || currentItem.id}
                    src={currentItem.url || undefined}
                    poster={
                      (currentItem as any).poster_url ||
                      'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='
                    }
                    muted={isMuted}
                    loop
                    playsInline
                    preload="none"
                    onError={() => setVideoLoadError(true)}
                    onEnded={() => setIsVideoPlaying(false)}
                    className="w-full h-full object-cover"
                  />
                  {/* Floating Video Overlay Controls: Play/Pause and Mute/Unmute */}
                  <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleVideoPlayback}
                      aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
                      className="p-2 min-h-[36px] min-w-[36px] rounded-full bg-slate-950/80 hover:bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      {isVideoPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5 fill-current" />}
                    </button>
                    <button
                      type="button"
                      onClick={toggleMute}
                      aria-label={isMuted ? 'Unmute video audio' : 'Mute video audio'}
                      className="p-2 min-h-[36px] min-w-[36px] rounded-full bg-slate-950/80 hover:bg-cyan-950/90 text-cyan-300 border border-cyan-500/40 backdrop-blur-md flex items-center justify-center transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    >
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              ) : (
                <img
                  src={
                    videoLoadError && (currentItem as any).poster_url
                      ? (currentItem as any).poster_url
                      : currentItem.url || ''
                  }
                  alt={currentItem.alt || (currentItem as any).alt_text || 'CoreIQ Showcase slide'}
                  loading="eager"
                  width="800"
                  height="450"
                  className={`w-full h-full object-cover transition-all ${
                    prefersReducedMotion ? 'duration-0' : 'duration-500'
                  } group-hover/viewport:scale-[1.02]`}
                />
              )
            )}

            {/* Gradient edge and vignette depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/40 pointer-events-none" />

            {/* In-bounds Carousel Navigation Arrows */}
            {count > 1 && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevSlide();
                  }}
                  aria-label="Previous slide"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 p-2 min-h-[38px] min-w-[38px] rounded-full bg-slate-950/80 hover:bg-cyan-950/90 text-slate-200 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-400/60 backdrop-blur-md flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-[0_4px_16px_rgba(0,0,0,0.7)] hover:scale-105 active:scale-95"
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
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 p-2 min-h-[38px] min-w-[38px] rounded-full bg-slate-950/80 hover:bg-cyan-950/90 text-slate-200 hover:text-cyan-200 border border-cyan-500/30 hover:border-cyan-400/60 backdrop-blur-md flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-cyan-400 shadow-[0_4px_16px_rgba(0,0,0,0.7)] hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {/* In-bounds Bottom Progress Indicators */}
            {count > 1 && (
              <div className="absolute bottom-2.5 inset-x-0 z-20 flex items-center justify-center gap-1.5 pointer-events-none">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/25 pointer-events-auto shadow-md">
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
                      className="p-0.5 flex items-center justify-center focus:outline-none rounded-full"
                    >
                      <span
                        className={`block rounded-full transition-all duration-300 ${
                          currentIndex === idx
                            ? 'w-5 h-1.5 bg-gradient-to-r from-cyan-400 to-blue-400 shadow-[0_0_8px_#22d3ee]'
                            : 'w-1.5 h-1.5 bg-slate-600 hover:bg-slate-400'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Caption & Action Block: ALWAYS below the media inside the panel */}
        {currentItem && (currentItem.title || currentItem.caption || (currentItem as any).alt_text || currentItem.alt || (currentItem.cta_label && currentItem.cta_url)) && (
          <div className="space-y-2 pt-1 border-t border-cyan-500/15">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="space-y-0.5 max-w-md">
                {currentItem.title && (
                  <h4 className="text-xs sm:text-sm font-bold text-white font-display flex items-center gap-1.5">
                    {isCurrentVideo ? (
                      <VideoIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    )}
                    <span>{currentItem.title}</span>
                  </h4>
                )}
                {(currentItem.caption || (currentItem as any).alt_text || currentItem.alt) && (
                  <p className="text-[11px] sm:text-xs text-slate-300/90 leading-relaxed line-clamp-2">
                    {currentItem.caption || (currentItem as any).alt_text || currentItem.alt}
                  </p>
                )}
              </div>

              {currentItem.cta_label && currentItem.cta_url && (
                <div className="shrink-0">
                  {currentItem.cta_url.startsWith('/') ? (
                    <button
                      type="button"
                      onClick={() => handleCtaClick(currentItem.cta_url!)}
                      className="w-full sm:w-auto px-3.5 py-1.5 min-h-[36px] rounded-lg bg-gradient-to-r from-cyan-500/25 to-blue-500/25 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-400/40 hover:border-cyan-300 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>{currentItem.cta_label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
                    </button>
                  ) : (
                    <a
                      href={currentItem.cta_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:w-auto px-3.5 py-1.5 min-h-[36px] rounded-lg bg-gradient-to-r from-cyan-500/25 to-blue-500/25 hover:from-cyan-500/40 hover:to-blue-500/40 border border-cyan-400/40 hover:border-cyan-300 text-cyan-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(34,211,238,0.15)] hover:shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>{currentItem.cta_label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-300" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoreIQSentinel;
