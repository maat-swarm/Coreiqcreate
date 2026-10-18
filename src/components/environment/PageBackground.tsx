import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useMediaSlot } from '../../services/mediaSlots';
import { useMotionPruning } from '../../hooks/useMotionPruning';

export interface PageBackgroundProps {
  slotKey: string;
  variant: 'tools' | 'maatverse';
}

export const PageBackground: React.FC<PageBackgroundProps> = ({ slotKey, variant }) => {
  const [mounted, setMounted] = useState(false);
  const { items } = useMediaSlot(slotKey);
  const { isReducedMotion } = useMotionPruning();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Pause video if tab becomes hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && videoRef.current) {
        videoRef.current.pause();
      } else if (!document.hidden && videoRef.current && !isReducedMotion) {
        videoRef.current.play().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isReducedMotion]);

  if (!mounted || typeof document === 'undefined') return null;

  const publishedItem = items && items.length > 0 ? items[0] : null;
  const isVideo =
    publishedItem &&
    (publishedItem.type === 'video' ||
      (publishedItem.url && (publishedItem.url.endsWith('.mp4') || publishedItem.url.endsWith('.webm'))));

  return createPortal(
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    >
      {publishedItem ? (
        <div className="relative w-full h-full">
          {isVideo ? (
            <video
              ref={videoRef}
              src={publishedItem.url || undefined}
              poster={publishedItem.alt || undefined}
              muted
              loop
              playsInline
              preload="metadata"
              autoPlay={!isReducedMotion}
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={publishedItem.url || undefined}
              alt=""
              className="w-full h-full object-cover"
            />
          )}

          {/* Readability scrim */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(4,6,14,0.55) 0%, rgba(4,6,14,0.82) 100%)',
            }}
          />
        </div>
      ) : variant === 'tools' ? (
        /* Tools Page Default Background: Deep ink-teal to indigo gradient with 48px blueprint grid & cyan/violet radial glows */
        <div
          className="relative w-full h-full"
          style={{
            background: 'linear-gradient(155deg, #061018 0%, #080d24 50%, #0a1030 100%)',
          }}
        >
          {/* Blueprint grid (48px repeating linear gradients at ~6% opacity) */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(25, 217, 255, 0.06) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(25, 217, 255, 0.06) 1px, transparent 1px)
              `,
              backgroundSize: '48px 48px',
            }}
          />

          {/* Soft Cyan radial glow top-left */}
          <div
            className="absolute -top-32 -left-32 w-[650px] h-[650px] rounded-full blur-[140px] pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(25, 217, 255, 0.16) 0%, transparent 70%)' }}
          />

          {/* Soft Violet radial glow bottom-right */}
          <div
            className="absolute -bottom-32 -right-32 w-[650px] h-[650px] rounded-full blur-[140px] pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(134, 88, 255, 0.14) 0%, transparent 70%)' }}
          />

          {/* Subtle vignette */}
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at 50% 30%, transparent 0%, rgba(4, 7, 20, 0.6) 100%)',
            }}
          />
        </div>
      ) : (
        /* Ma'atverse Default Background: Near-black #04050b with CSS star field & faint gold radial glow at top centre */
        <div
          className="relative w-full h-full"
          style={{
            background: '#04050b',
          }}
        >
          {/* CSS Star field via radial-gradients */}
          <div
            className={`absolute inset-0 ${isReducedMotion ? '' : 'animate-pulse'}`}
            style={{
              backgroundImage: `
                radial-gradient(1px 1px at 25px 35px, rgba(255, 255, 255, 0.75), transparent),
                radial-gradient(1.5px 1.5px at 120px 80px, rgba(201, 162, 75, 0.9), transparent),
                radial-gradient(1px 1px at 210px 190px, rgba(120, 160, 255, 0.8), transparent),
                radial-gradient(1.5px 1.5px at 340px 140px, rgba(255, 255, 255, 0.7), transparent),
                radial-gradient(1px 1px at 450px 280px, rgba(201, 162, 75, 0.85), transparent),
                radial-gradient(1px 1px at 80px 320px, rgba(255, 255, 255, 0.6), transparent),
                radial-gradient(1.5px 1.5px at 280px 420px, rgba(120, 160, 255, 0.75), transparent),
                radial-gradient(1px 1px at 520px 70px, rgba(255, 255, 255, 0.8), transparent),
                radial-gradient(1.5px 1.5px at 640px 220px, rgba(201, 162, 75, 0.8), transparent),
                radial-gradient(1px 1px at 780px 150px, rgba(255, 255, 255, 0.7), transparent),
                radial-gradient(1px 1px at 910px 330px, rgba(120, 160, 255, 0.65), transparent)
              `,
              backgroundSize: '550px 550px',
              animationDuration: isReducedMotion ? '0s' : '8s',
            }}
          />

          {/* Faint gold radial glow at top centre */}
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full blur-[120px] pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at center, rgba(201, 162, 75, 0.15) 0%, transparent 70%)' }}
          />

          {/* Deep celestial atmosphere overlay */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, rgba(8, 11, 24, 0.4) 0%, rgba(4, 5, 11, 0.85) 100%)',
            }}
          />
        </div>
      )}
    </div>,
    document.body
  );
};
