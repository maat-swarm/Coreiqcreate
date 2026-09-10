import React, { useEffect, useState } from 'react';

export const AmbientBackground: React.FC = () => {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Only track on fine pointer devices, respect reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) return;

    let rafId: number;
    const handleMouseMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const xRel = (e.clientX / window.innerWidth - 0.5) * 20;
        const yRel = (e.clientY / window.innerHeight - 0.5) * 20;
        setMouseOffset({ x: xRel, y: yRel });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#050814]">
      {/* Layer 1 (deepest): Pure #050814 base */}
      <div className="absolute inset-0 bg-[#050814]" />

      {/* Layer 2: Large radial gradient, deep violet-blue (#1a0a3e), positioned bottom-left, covering 60% of viewport */}
      <div
        className="absolute -bottom-[12%] -left-[12%] w-[60vw] h-[60vh] min-w-[520px] min-h-[520px] rounded-full pointer-events-none transition-transform duration-1000 ease-out"
        style={{
          background: 'radial-gradient(circle at 35% 65%, #1a0a3e 0%, rgba(26, 10, 62, 0.55) 40%, transparent 70%)',
          filter: 'blur(90px)',
          transform: `translate(${mouseOffset.x * 0.5}px, ${mouseOffset.y * 0.5}px)`,
        }}
      />

      {/* Layer 3: Second radial gradient, deep cyan-blue (#0a1a3e), positioned top-right, 40% viewport */}
      <div
        className="absolute -top-[10%] -right-[10%] w-[40vw] h-[40vh] min-w-[380px] min-h-[380px] rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{
          background: 'radial-gradient(circle at 65% 35%, #0a1a3e 0%, rgba(10, 26, 62, 0.6) 40%, transparent 70%)',
          filter: 'blur(80px)',
          transform: `translate(${mouseOffset.x * -0.6}px, ${mouseOffset.y * -0.6}px)`,
        }}
      />

      {/* Layer 4: Animated SVG noise texture, 3% opacity, very slow drift (60s cycle) */}
      <div
        className="absolute -inset-[60px] opacity-[0.03] pointer-events-none animate-noise-drift"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 300 300' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* Subtle digital coordinate grid for high-tech spatial fidelity */}
      <div
        className="absolute inset-0 opacity-[0.025]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.4) 1px, transparent 0)`,
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
};
