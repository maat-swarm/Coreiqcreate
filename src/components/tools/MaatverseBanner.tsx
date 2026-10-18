import React from 'react';
import { ArrowRight } from 'lucide-react';
import { MediaSlotItem } from '../../types/command';
import { MaatverseButton } from './maatverseButtons';

export interface MaatverseBannerProps {
  bannerItem: MediaSlotItem | null;
  isArtOnly: boolean;
  isReducedMotion: boolean;
  onClick: () => void;
}

export const MaatverseBanner: React.FC<MaatverseBannerProps> = ({
  bannerItem,
  isArtOnly,
  isReducedMotion,
  onClick,
}) => {
  const isVideo =
    bannerItem &&
    (bannerItem.type === 'video' ||
      (bannerItem.url && (bannerItem.url.endsWith('.mp4') || bannerItem.url.endsWith('.webm'))));

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="Enter the Ma'atverse"
      className="relative w-full h-full rounded-2xl bg-[#060b1c] border border-cyan-500/30 overflow-hidden cursor-pointer select-none group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#060b1c] min-h-[44px] transition-all duration-200"
      style={{
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(201, 162, 75, 0.4)',
      }}
    >
      {/* Top gold hairline accent */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-20"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #C9A24B 25%, #C9A24B 75%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Layer A: Art */}
      <div className="absolute inset-0 z-0 bg-[#060b1c]">
        {bannerItem ? (
          isVideo ? (
            <video
              src={bannerItem.url || undefined}
              poster={bannerItem.alt || undefined}
              muted
              loop
              playsInline
              preload="metadata"
              autoPlay={!isReducedMotion}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={bannerItem.url || undefined}
              alt=""
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            />
          )
        ) : (
          /* Generated CSS banner: deep navy to violet gradient with faint CSS stars */
          <div
            className="w-full h-full"
            style={{
              background: 'linear-gradient(135deg, #070e28 0%, #0d1238 45%, #180f38 100%)',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  radial-gradient(1px 1px at 30px 40px, rgba(255, 255, 255, 0.7), transparent),
                  radial-gradient(1.5px 1.5px at 150px 100px, rgba(201, 162, 75, 0.8), transparent),
                  radial-gradient(1px 1px at 280px 60px, rgba(120, 160, 255, 0.7), transparent),
                  radial-gradient(1.5px 1.5px at 420px 180px, rgba(255, 255, 255, 0.7), transparent),
                  radial-gradient(1px 1px at 580px 120px, rgba(201, 162, 75, 0.85), transparent),
                  radial-gradient(1px 1px at 720px 80px, rgba(120, 160, 255, 0.6), transparent),
                  radial-gradient(1.5px 1.5px at 860px 160px, rgba(255, 255, 255, 0.75), transparent)
                `,
                backgroundSize: '450px 250px',
              }}
            />
            <div
              className="absolute -top-16 -left-16 w-80 h-80 rounded-full blur-[80px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(25, 217, 255, 0.15) 0%, transparent 70%)' }}
            />
            <div
              className="absolute -bottom-16 -right-16 w-80 h-80 rounded-full blur-[80px] pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(134, 88, 255, 0.18) 0%, transparent 70%)' }}
            />
          </div>
        )}
      </div>

      {/* Layer B & C: Scrim & Text (rendered only if NOT art-only mode) */}
      {!isArtOnly && (
        <>
          {/* Layer B: Scrim */}
          <div
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, rgba(4,6,14,0.92) 0%, rgba(4,6,14,0.60) 55%, transparent 100%)',
            }}
          />

          {/* Layer C: Text */}
          <div className="absolute inset-0 z-20 flex flex-col justify-between p-4 sm:p-6 lg:p-7 max-w-[85%] sm:max-w-[80%] pointer-events-none">
            <div className="space-y-1 sm:space-y-2">
              <span className="text-[10px] sm:text-xs font-mono tracking-[0.25em] text-[#C9A24B] uppercase font-bold">
                MA'ATVERSE
              </span>
              <h2 className="text-lg sm:text-2xl lg:text-3xl font-extrabold text-white font-display leading-tight line-clamp-2">
                {bannerItem?.caption ? bannerItem.caption : 'Enter the Ma\'atverse'}
              </h2>
              {!bannerItem && (
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-2 hidden sm:block">
                  The universe behind CoreIQ. Meet the builders, the lore and the Swarm.
                </p>
              )}
            </div>

            <div className="pt-2">
              <MaatverseButton
                variant="chip"
                icon={<ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />}
                className="group-hover:brightness-110"
              >
                Enter
              </MaatverseButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
