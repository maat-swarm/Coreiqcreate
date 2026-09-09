import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) {
      document.querySelectorAll<HTMLElement>('.reveal-up, .reveal-fade')
        .forEach(el => el.classList.add('is-revealed'));
      return;
    }
    const io = new IntersectionObserver(
      entries => entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll<HTMLElement>('.reveal-up, .reveal-fade')
      .forEach(el => io.observe(el));
    return () => io.disconnect();
  });
}
