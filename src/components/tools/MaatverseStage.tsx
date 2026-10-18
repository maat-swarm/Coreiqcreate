import React, { useState } from 'react';
import { NavRoute } from '../../types';
import { useMediaSlot } from '../../services/mediaSlots';
import { useMotionPruning } from '../../hooks/useMotionPruning';
import { MaatverseBanner } from './MaatverseBanner';

export interface MaatverseStageProps {
  onNavigate: (route: NavRoute) => void;
}

const DEFAULT_MASCOT_SRC = '/media/maatverse/maatverse-mascot-default.webp';

export const MaatverseStage: React.FC<MaatverseStageProps> = ({ onNavigate }) => {
  const { items: bannerItems } = useMediaSlot('tools.maatverse.banner');
  const { items: mascotItems } = useMediaSlot('tools.maatverse.mascot');
  const { isReducedMotion } = useMotionPruning();

  const [mascotLoadFailed, setMascotLoadFailed] = useState(false);
  const [mascotFallbackAttempted, setMascotFallbackAttempted] = useState(false);

  const bannerItem = bannerItems && bannerItems.length > 0 ? bannerItems[0] : null;
  const mascotItem = mascotItems && mascotItems.length > 0 ? mascotItems[0] : null;

  // Banner EMPTY-caption mode (owner's own finished artwork): caption exists and is blank/empty
  const isArtOnly = Boolean(bannerItem && (!bannerItem.caption || bannerItem.caption.trim() === ''));

  // Cell rules:
  // Banner EMPTY-caption (art-only) mode: the default mascot does NOT show.
  // The mascot cell renders only if a mascot slot item is explicitly published;
  // if not, the banner expands to full width (single cell).
  const shouldRenderMascot = isArtOnly ? Boolean(mascotItem) : true;

  // Handle destination navigation
  const handleDestinationClick = () => {
    const rawLink = bannerItem?.cta_url || bannerItem?.url; // link field in slot item
    const target = (rawLink || '').trim();

    if (!target || target === '/maatverse' || target === 'maatverse') {
      onNavigate('maatverse');
      return;
    }

    if (target.startsWith('https://')) {
      window.open(target, '_blank', 'noopener,noreferrer');
      return;
    }

    const cleanPath = target.replace(/^\//, '');
    const knownRoutes = ['home', 'use-cases', 'solutions', 'apps', 'learn', 'tools', 'about', 'news', 'ask', 'command', 'maatverse'];
    if (knownRoutes.includes(cleanPath)) {
      onNavigate(cleanPath as NavRoute);
      return;
    }

    if (target.startsWith('/') && !target.startsWith('//')) {
      window.location.assign(target);
      return;
    }

    onNavigate('maatverse');
  };

  const isMascotVideo =
    mascotItem &&
    (mascotItem.type === 'video' ||
      (mascotItem.url && (mascotItem.url.endsWith('.mp4') || mascotItem.url.endsWith('.webm'))));

  const mascotSrc = mascotItem
    ? mascotItem.url || DEFAULT_MASCOT_SRC
    : DEFAULT_MASCOT_SRC;

  const handleMascotError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    if (!mascotFallbackAttempted && mascotSrc !== DEFAULT_MASCOT_SRC) {
      setMascotFallbackAttempted(true);
      (e.target as HTMLImageElement).src = DEFAULT_MASCOT_SRC;
    } else {
      setMascotLoadFailed(true);
    }
  };

  return (
    <section className="py-6 sm:py-8 lg:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full overflow-x-clip">
      <div
        className={`w-full grid h-[190px] sm:h-[240px] lg:h-[300px] gap-2 sm:gap-3 lg:gap-4 items-stretch ${
          shouldRenderMascot
            ? 'grid-cols-[62%_38%] sm:grid-cols-[66%_34%] lg:grid-cols-12'
            : 'grid-cols-1'
        }`}
      >
        {/* LEFT CELL: THE BANNER */}
        <div className={shouldRenderMascot ? 'h-full lg:col-span-8' : 'h-full w-full'}>
          <MaatverseBanner
            bannerItem={bannerItem}
            isArtOnly={isArtOnly}
            isReducedMotion={isReducedMotion}
            onClick={handleDestinationClick}
          />
        </div>

        {/* RIGHT CELL: THE MASCOT (IN ITS OWN PANEL) */}
        {shouldRenderMascot && (
          <div className="h-full lg:col-span-4 relative">
            <div
              role="presentation"
              tabIndex={-1}
              aria-hidden="true"
              onClick={handleDestinationClick}
              className="relative w-full h-full rounded-2xl bg-[#060b1e] border border-cyan-500/25 overflow-visible cursor-pointer select-none flex items-end justify-center min-h-[44px] transition-all duration-200"
              style={{
                background: 'linear-gradient(180deg, #060c22 0%, #090e2a 60%, #0d0b28 100%)',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(25, 217, 255, 0.15)',
              }}
            >
              {/* Soft blue/violet radial glow behind the figure */}
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at 50% 65%, rgba(25, 217, 255, 0.22) 0%, rgba(134, 88, 255, 0.15) 45%, transparent 75%)',
                }}
              />

              {/* Faint gold hairline at bottom edge */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[1px] pointer-events-none z-20"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, #C9A24B 25%, #C9A24B 75%, transparent 100%)',
                }}
                aria-hidden="true"
              />

              {/* Mascot Figure */}
              {!mascotLoadFailed && (
                <div
                  className={`relative z-10 w-full h-full flex items-end justify-center pointer-events-none transition-transform sm:-translate-y-2 lg:-translate-y-3.5`}
                  style={{
                    filter: 'drop-shadow(0 10px 20px rgba(25, 217, 255, 0.28)) drop-shadow(0 4px 12px rgba(134, 88, 255, 0.35))',
                  }}
                >
                  {isMascotVideo ? (
                    <video
                      src={mascotItem?.url || undefined}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      autoPlay={!isReducedMotion}
                      className="max-h-[108%] sm:max-h-[114%] w-auto object-contain object-bottom"
                    />
                  ) : (
                    <img
                      src={mascotSrc}
                      alt=""
                      loading="lazy"
                      onError={handleMascotError}
                      className={`max-h-[108%] sm:max-h-[114%] w-auto object-contain object-bottom ${
                        isReducedMotion ? '' : 'animate-[float_6s_ease-in-out_infinite]'
                      }`}
                      style={{
                        animation: isReducedMotion ? 'none' : 'mascotFloat 6s ease-in-out infinite',
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes mascotFloat {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </section>
  );
};
