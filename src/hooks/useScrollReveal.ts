import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Respect user motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      document
        .querySelectorAll<HTMLElement>('.reveal, .reveal-up, .reveal-fade')
        .forEach((el) => {
          el.classList.add('visible', 'is-revealed');
        });
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible', 'is-revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    const observeElements = () => {
      document
        .querySelectorAll<HTMLElement>('.reveal, .reveal-up, .reveal-fade')
        .forEach((el) => {
          if (!el.classList.contains('visible') && !el.classList.contains('is-revealed')) {
            observer.observe(el);
          }
        });
    };

    observeElements();

    let mutationObserver: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined' && document.body) {
      mutationObserver = new MutationObserver(() => {
        observeElements();
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
      if (mutationObserver) mutationObserver.disconnect();
    };
  }, []);
}

