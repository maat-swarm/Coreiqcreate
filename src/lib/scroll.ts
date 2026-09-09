import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

let registered = false;

/**
 * Registers the ScrollTrigger plugin exactly once. Safe to call from every
 * component that needs scroll-linked timelines — GSAP no-ops on repeat
 * registration, but we guard anyway to keep HMR reloads cheap.
 */
export const ensureScrollTrigger = () => {
  if (!registered) {
    gsap.registerPlugin(ScrollTrigger);
    registered = true;
  }
};

/**
 * Live prefers-reduced-motion check. GSAP/ScrollTrigger timelines don't
 * respect this automatically (unlike Framer's MotionConfig), so every
 * pinned/scrubbed sequence in the app must branch on this explicitly and
 * fall back to a simple, non-pinned reveal.
 */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export { gsap, ScrollTrigger };
