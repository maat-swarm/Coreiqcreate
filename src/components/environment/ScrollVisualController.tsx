import React, { useEffect, useState, useRef } from 'react';

interface ScrollVisualControllerProps {
  children: (state: { scrollY: number; scrollProgress: number; velocity: number }) => React.ReactNode;
  isReducedMotion: boolean;
  shouldPruneRAF?: boolean;
}

export const ScrollVisualController: React.FC<ScrollVisualControllerProps> = ({
  children,
  isReducedMotion,
  shouldPruneRAF = false,
}) => {
  const [scrollState, setScrollState] = useState({
    scrollY: 0,
    scrollProgress: 0,
    velocity: 0,
  });

  const lastScrollY = useRef(0);
  const lastTime = useRef(Date.now());
  const rafRef = useRef<number>(0);
  const throttleTimerRef = useRef<number>(0);

  useEffect(() => {
    if (isReducedMotion) return;

    // Mobile / Reduced-motion optimization:
    // Prune high-cost per-frame requestAnimationFrame during touch scrolling.
    // CSS transitions on child layers (VideoBackground, MascotEnvironment) smoothly interpolate
    // the transform on the GPU compositor thread without JS main-thread contention.
    if (shouldPruneRAF) {
      const handleMobileScroll = () => {
        if (throttleTimerRef.current) return;

        throttleTimerRef.current = window.setTimeout(() => {
          throttleTimerRef.current = 0;
          const currentY = window.scrollY || window.pageYOffset;
          const maxScroll = Math.max(
            1,
            document.documentElement.scrollHeight - window.innerHeight
          );
          const progress = Math.min(1, Math.max(0, currentY / maxScroll));

          setScrollState({
            scrollY: currentY,
            scrollProgress: progress,
            velocity: 0,
          });
        }, 80); // ~12fps throttle; CSS transition smoothly interpolates over 800ms
      };

      window.addEventListener('scroll', handleMobileScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleMobileScroll);
        if (throttleTimerRef.current) clearTimeout(throttleTimerRef.current);
      };
    }

    // Desktop mode: full fidelity scroll tracking via rAF
    const handleScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const currentY = window.scrollY || window.pageYOffset;
        const maxScroll = Math.max(
          1,
          document.documentElement.scrollHeight - window.innerHeight
        );
        const progress = Math.min(1, Math.max(0, currentY / maxScroll));

        const now = Date.now();
        const dt = Math.max(1, now - lastTime.current);
        const vel = (currentY - lastScrollY.current) / dt;

        lastScrollY.current = currentY;
        lastTime.current = now;

        setScrollState({
          scrollY: currentY,
          scrollProgress: progress,
          velocity: vel,
        });
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isReducedMotion, shouldPruneRAF]);

  return <>{children(scrollState)}</>;
};
