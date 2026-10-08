import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    if (typeof document === 'undefined') return;

    const revealAll = () => {
      document.querySelectorAll<HTMLElement>('.reveal-up, .reveal-fade')
        .forEach(el => el.classList.add('is-revealed'));
    };

    revealAll();

    // Use MutationObserver so that when splash screen unmounts and HomePage / lazy pages mount,
    // all elements with .reveal-up and .reveal-fade immediately get .is-revealed
    let observer: MutationObserver | null = null;
    if (typeof MutationObserver !== 'undefined' && document.body) {
      observer = new MutationObserver(() => {
        revealAll();
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      if (observer) observer.disconnect();
    };
  }, []);
}
