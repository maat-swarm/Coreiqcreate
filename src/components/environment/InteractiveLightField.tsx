import React, { useEffect, useState } from 'react';

interface InteractiveLightFieldProps {
  isReducedMotion: boolean;
  mousePos: { x: number; y: number };
  isInputFocused: boolean;
}

export const InteractiveLightField: React.FC<InteractiveLightFieldProps> = ({
  isReducedMotion,
  mousePos,
  isInputFocused,
}) => {
  const [pulseActive, setPulseActive] = useState(false);

  // Listen for query submission or high interaction event
  useEffect(() => {
    const handleAction = () => {
      setPulseActive(true);
      const timer = setTimeout(() => setPulseActive(false), 1200);
      return () => clearTimeout(timer);
    };

    window.addEventListener('coreiq:submit', handleAction);
    return () => window.removeEventListener('coreiq:submit', handleAction);
  }, []);

  if (isReducedMotion) return null;

  // Convert normalized mouse (-0.5 to 0.5) to viewport percentages
  const posX = (mousePos.x + 0.5) * 100;
  const posY = (mousePos.y + 0.5) * 100;

  return (
    <div className="absolute inset-0 pointer-events-none z-[3] overflow-hidden select-none">
      {/* 1. Dynamic Cursor Light Bloom (Follows cursor smoothly) */}
      <div
        className="absolute w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none transition-all duration-700 ease-out will-change-transform"
        style={{
          left: `${posX}%`,
          top: `${posY}%`,
          background: isInputFocused
            ? 'radial-gradient(circle, rgba(25, 217, 255, 0.18) 0%, rgba(134, 88, 255, 0.12) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(25, 217, 255, 0.10) 0%, rgba(57, 123, 255, 0.05) 45%, transparent 70%)',
          filter: 'blur(50px)',
          transform: `translate(-50%, -50%) scale(${isInputFocused ? 1.35 : pulseActive ? 1.6 : 1})`,
          opacity: isInputFocused ? 0.95 : pulseActive ? 1 : 0.75,
        }}
      />

      {/* 2. Focused Input Resonating Wave */}
      {isInputFocused && (
        <div
          className="absolute inset-x-0 top-1/4 h-[350px] pointer-events-none transition-opacity duration-700"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 35% 50%, rgba(25, 217, 255, 0.12) 0%, rgba(134, 88, 255, 0.08) 50%, transparent 80%)',
            filter: 'blur(60px)',
          }}
        />
      )}

      {/* 3. Action Pulse Ripple (Triggered on query submit) */}
      {pulseActive && (
        <div
          className="absolute inset-0 pointer-events-none animate-pulse-bloom"
          style={{
            background: 'radial-gradient(circle at 60% 50%, rgba(25, 217, 255, 0.22) 0%, rgba(134, 88, 255, 0.15) 40%, transparent 75%)',
          }}
        />
      )}
    </div>
  );
};
