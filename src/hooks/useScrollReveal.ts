import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const revealAll = () => {
      document.querySelectorAll<HTMLElement>('.reveal-up, .reveal-fade')
        .forEach(el => el.classList.add('is-revealed'));
    };

    if (mq.matches) {
      revealAll();
      return;
    }

    // Immediately reveal elements already in viewport on load
    const elements = document.querySelectorAll<HTMLElement>('.reveal-up, .reveal-fade');
    
    const io = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      }),
      { threshold: 0.05, rootMargin: '0px 0px 0px 0px' }
    );

    elements.forEach(el => io.observe(el));

    // Fallback: reveal all after 800ms in case observer misses
    const fallback = setTimeout(revealAll, 800);

    return () => {
      io.disconnect();
      clearTimeout(fallback);
    };
  }, []); // empty array — run once on mount only
}
