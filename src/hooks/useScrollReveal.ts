import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    // Immediately reveal everything - CSS handles the animation
    document.querySelectorAll<HTMLElement>('.reveal-up, .reveal-fade')
      .forEach(el => el.classList.add('is-revealed'));
  }, []);
}
