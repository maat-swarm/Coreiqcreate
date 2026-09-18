import { useRef, useEffect, type RefObject } from 'react';

export function useMagneticHover<T extends HTMLElement = HTMLElement>(
  strength = 0.35
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if touch device / mobile — skip magnetic hover on touch
    if (window.matchMedia('(hover: none)').matches) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const deltaX = (e.clientX - centerX) * strength;
      const deltaY = (e.clientY - centerY) * strength;

      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
      el.style.transition = 'transform 0.1s ease-out';
    };

    const handleMouseLeave = () => {
      el.style.transform = 'translate(0px, 0px)';
      el.style.transition = 'transform 0.35s ease-out';
    };

    el.addEventListener('mousemove', handleMouseMove);
    el.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      el.removeEventListener('mousemove', handleMouseMove);
      el.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  return ref;
}

export default useMagneticHover;
