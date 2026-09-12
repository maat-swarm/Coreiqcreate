import React, { useEffect, useState } from 'react';

interface MascotEnvironmentProps {
  isReducedMotion: boolean;
  mousePos: { x: number; y: number };
  isInputFocused: boolean;
  scrollProgress: number;
}

export const MascotEnvironment: React.FC<MascotEnvironmentProps> = ({
  isReducedMotion,
  mousePos,
  isInputFocused,
  scrollProgress,
}) => {
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    const handleAction = () => {
      setPulseActive(true);
      const timer = setTimeout(() => setPulseActive(false), 1400);
      return () => clearTimeout(timer);
    };

    window.addEventListener('coreiq:submit', handleAction);
    return () => window.removeEventListener('coreiq:submit', handleAction);
  }, []);

  // Calculate mouse proximity to the mascot's location (desktop right: ~70% x, ~60% y)
  const mascotTarget = { x: 0.22, y: 0.12 }; // in -0.5 to 0.5 normalized coordinates
  const dist = Math.hypot(mousePos.x - mascotTarget.x, mousePos.y - mascotTarget.y);
  const proximityGlow = Math.max(0, 1 - dist * 1.5);

  // Subtle gaze and breathing offsets
  const gazeX = isReducedMotion ? 0 : mousePos.x * 6;
  const gazeY = isReducedMotion ? 0 : mousePos.y * 4;
  const scrollOffset = isReducedMotion ? 0 : scrollProgress * 25;

  return (
    <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden select-none">
      {/* Container anchored to the Mascot's position on the right ridge */}
      <div
        className="absolute left-[64%] sm:left-[68%] lg:left-[71%] top-[55%] sm:top-[55%] lg:top-[56%] -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-72 sm:h-72 pointer-events-none"
        style={{
          transform: `translate3d(calc(-50% + ${gazeX * 0.5}px), calc(-50% + ${-scrollOffset * 0.4 + gazeY * 0.5}px), 0)`,
          transition: 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* =========================================================================
            1. CORE IQ HEART / CHEST ENERGY CORE
            ========================================================================= */}
        {/* Ambient chest illumination cast onto armor */}
        <div
          className="absolute top-[58%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none transition-all duration-500 will-change-transform"
          style={{
            background: isInputFocused
              ? 'radial-gradient(circle, rgba(25, 217, 255, 0.70) 0%, rgba(134, 88, 255, 0.45) 40%, transparent 70%)'
              : `radial-gradient(circle, rgba(25, 217, 255, ${0.35 + proximityGlow * 0.28}) 0%, rgba(134, 88, 255, 0.22) 45%, transparent 70%)`,
            filter: 'blur(20px)',
            transform: `scale(${isInputFocused ? 1.5 : pulseActive ? 1.85 : 1 + proximityGlow * 0.3})`,
          }}
        />

        {/* Luminous Inner Core Heart Emblem */}
        <div
          className="absolute top-[58%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center pointer-events-none"
          style={{
            animation: isReducedMotion ? 'none' : 'coreOrbBreathe 3.2s ease-in-out infinite',
          }}
        >
          {/* Holographic Diamond Node */}
          <div
            className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-45 border border-cyan-300/90 rounded-xs transition-all duration-300"
            style={{
              background: isInputFocused
                ? 'radial-gradient(circle, #ffffff 0%, #19d9ff 70%, #8658ff 100%)'
                : 'radial-gradient(circle, #cffafe 0%, #06b6d4 70%, #3b82f6 100%)',
              boxShadow: isInputFocused
                ? '0 0 16px #19d9ff, 0 0 28px #8658ff'
                : '0 0 8px #19d9ff, 0 0 16px rgba(134, 88, 255, 0.6)',
            }}
          />

          {/* Micro Energy Pulse Ring */}
          <div
            className="absolute inset-[-4px] rounded-full border border-cyan-400/50"
            style={{
              animation: isReducedMotion ? 'none' : 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite',
              opacity: isInputFocused ? 0.9 : 0.45,
            }}
          />
        </div>

        {/* =========================================================================
            2. VISOR / INTELLIGENT GAZE
            ========================================================================= */}
        {/* Subtle luminous visor flare that aligns with his eyes */}
        <div
          className="absolute top-[34%] left-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            transform: `translate(calc(-50% + ${gazeX}px), ${gazeY}px)`,
            transition: 'transform 0.3s ease-out',
          }}
        >
          <div
            className="w-6 h-2 rounded-full blur-[3px] transition-opacity duration-300"
            style={{
              background: 'linear-gradient(90deg, #19d9ff 0%, #8658ff 100%)',
              opacity: isInputFocused ? 0.95 : 0.65 + proximityGlow * 0.25,
              boxShadow: '0 0 12px #19d9ff',
            }}
          />
        </div>

        {/* =========================================================================
            3. FLOWING SCARF MICRO-SHIMMER
            ========================================================================= */}
        {/* Organic trailing light aura along his scarf */}
        <div
          className="absolute top-[48%] left-[24%] w-24 h-12 pointer-events-none opacity-50"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(25, 217, 255, 0.25) 0%, rgba(134, 88, 255, 0.15) 50%, transparent 80%)',
            filter: 'blur(8px)',
            animation: isReducedMotion ? 'none' : 'scarfFlutter 5s ease-in-out infinite alternate',
          }}
        />
      </div>

      {/* 4. Subtle Cybernetic Agent Status HUD (Discrete indicator near bottom-right) */}
      <div className="flex absolute bottom-3 sm:bottom-6 right-3 sm:right-8 items-center gap-2 sm:gap-2.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-cyan-500/20 bg-[#030712]/85 backdrop-blur-md text-[9px] sm:text-[11px] font-mono tracking-wider sm:tracking-widest text-cyan-300/80 shadow-[0_0_20px_rgba(25,217,255,0.08)]">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#19d9ff] animate-pulse" />
        <span className="text-slate-400">CORE IQ AGENT //</span>
        <span className="text-cyan-300 font-semibold">{isInputFocused ? 'RESONATING' : 'SENTINEL ACTIVE'}</span>
      </div>
    </div>
  );
};
