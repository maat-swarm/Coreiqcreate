import React, { useState, useEffect } from 'react';

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';

interface ScrambleTextProps {
  text: string;
  duration?: number;
  delay?: number;
  className?: string;
}

export function ScrambleText({
  text,
  duration = 800,
  delay = 0,
  className = '',
}: ScrambleTextProps) {
  const [displayed, setDisplayed] = useState(text);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;
    let startTime: number | null = null;

    timeoutId = setTimeout(() => {
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = Math.min(elapsed / duration, 1);

        setDisplayed(
          text
            .split('')
            .map((char, index) => {
              if (char === ' ') return ' ';
              if (index / text.length < progress) return char;
              return CHARS[Math.floor(Math.random() * CHARS.length)];
            })
            .join('')
        );

        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          setDisplayed(text);
          setIsDone(true);
        }
      };
      rafId = requestAnimationFrame(step);
    }, delay);

    return () => {
      if (timeoutId !== null) clearTimeout(timeoutId);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [text, duration, delay]);

  if (isDone) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={`inline-grid grid-cols-1 grid-rows-1 ${className}`}>
      {/* Invisible full text reserving exact layout dimensions and line wrap from frame 0 */}
      <span className="col-start-1 row-start-1 invisible select-none pointer-events-none" aria-hidden="true">
        {text}
      </span>
      {/* Animated scrambling layer in same grid cell */}
      <span className="col-start-1 row-start-1" aria-hidden="true">
        {displayed}
      </span>
    </span>
  );
}

export default ScrambleText;
