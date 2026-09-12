import React, { useEffect, useState, useRef } from 'react';

interface ScrollVisualControllerProps {
  children: (state: { scrollY: number; scrollProgress: number; velocity: number }) => React.ReactNode;
  isReducedMotion: boolean;
}

export const ScrollVisualController: React.FC<ScrollVisualControllerProps> = ({
  children,
  isReducedMotion,
}) => {
  const [scrollState, setScrollState] = useState({
    scrollY: 0,
    scrollProgress: 0,
    velocity: 0,
  });

  const lastScrollY = useRef(0);
  const lastTime = useRef(Date.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (isReducedMotion) return;

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
  }, [isReducedMotion]);

  return <>{children(scrollState)}</>;
};
