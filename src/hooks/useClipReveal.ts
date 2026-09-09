import { useLayoutEffect, RefObject } from 'react';
import { gsap, ScrollTrigger, ensureScrollTrigger, prefersReducedMotion } from '../lib/scroll';

export type RevealVariant = 'wipe-up' | 'wipe-down' | 'wipe-left' | 'wipe-right' | 'radial';

const CLIP_FROM: Record<RevealVariant, string> = {
  'wipe-up': 'inset(0% 0% 100% 0%)',
  'wipe-down': 'inset(100% 0% 0% 0%)',
  'wipe-left': 'inset(0% 100% 0% 0%)',
  'wipe-right': 'inset(0% 0% 0% 100%)',
  radial: 'circle(0% at 50% 50%)',
};

const CLIP_TO: Record<RevealVariant, string> = {
  'wipe-up': 'inset(0% 0% 0% 0%)',
  'wipe-down': 'inset(0% 0% 0% 0%)',
  'wipe-left': 'inset(0% 0% 0% 0%)',
  'wipe-right': 'inset(0% 0% 0% 0%)',
  radial: 'circle(150% at 50% 50%)',
};

interface UseClipRevealOptions {
  duration?: number;
  start?: string;
  delay?: number;
}

/**
 * Scroll-triggered clip-path/mask reveal for section boundaries — a hard
 * geometric wipe rather than an opacity/translate fade. Falls back to a
 * fully visible, static element under prefers-reduced-motion since
 * ScrollTrigger does not honor that automatically.
 */
export function useClipReveal<T extends HTMLElement>(
  ref: RefObject<T | null>,
  variant: RevealVariant = 'wipe-up',
  options?: UseClipRevealOptions
) {
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.style.clipPath = 'none';
      el.style.opacity = '1';
      return;
    }

    ensureScrollTrigger();
    const duration = options?.duration ?? 1.1;
    const start = options?.start ?? 'top 82%';

    gsap.set(el, { clipPath: CLIP_FROM[variant], opacity: 0.4 });

    const tween = gsap.to(el, {
      clipPath: CLIP_TO[variant],
      opacity: 1,
      duration,
      delay: options?.delay ?? 0,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: el,
        start,
        toggleActions: 'play none none none',
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ref identity + static options are intentional
  }, [ref.current]);
}

export { ScrollTrigger };
