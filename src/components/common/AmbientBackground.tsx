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
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#030712]">
      {/* Deep gradient wash */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050b1d] via-[#030712] to-[#02050f]" />

      {/* Primary Cyan volumetric glow (Top Right / Center) */}
      <div 
        className="absolute -top-40 right-[-10%] w-[650px] h-[650px] rounded-full bg-gradient-to-br from-cyan-500/15 via-blue-600/10 to-transparent blur-[130px] animate-ambient-drift-1 transition-transform duration-700 ease-out"
        style={{ transform: `translate(${mouseOffset.x * 0.7}px, ${mouseOffset.y * 0.7}px)` }}
      />

      {/* Violet / Magenta Core glow (Middle / Right) */}
      <div 
        className="absolute top-[25%] right-[5%] w-[550px] h-[550px] rounded-full bg-gradient-to-tr from-purple-600/15 via-pink-600/10 to-transparent blur-[140px] animate-ambient-drift-2 transition-transform duration-1000 ease-out"
        style={{ transform: `translate(${mouseOffset.x * -0.5}px, ${mouseOffset.y * -0.5}px)` }}
      />

      {/* Deep blue accent glow (Bottom Left) */}
      <div 
        className="absolute top-[65%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-blue-700/15 via-indigo-600/10 to-transparent blur-[140px] animate-ambient-drift-3 transition-transform duration-700 ease-out"
        style={{ transform: `translate(${mouseOffset.x * 0.4}px, ${mouseOffset.y * 0.4}px)` }}
      />

      {/* Subtle drifting micro-particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute top-[20%] left-[15%] w-1.5 h-1.5 rounded-full bg-cyan-400 blur-[1px] animate-particle-1" />
        <div className="absolute top-[45%] left-[80%] w-1 h-1 rounded-full bg-purple-400 blur-[1px] animate-particle-2" />
        <div className="absolute top-[75%] left-[30%] w-1.5 h-1.5 rounded-full bg-blue-400 blur-[1px] animate-particle-3" />
        <div className="absolute top-[35%] left-[55%] w-1 h-1 rounded-full bg-cyan-300 blur-[0.5px] animate-particle-2" />
        <div className="absolute top-[60%] left-[65%] w-1.5 h-1.5 rounded-full bg-pink-400 blur-[1px] animate-particle-1" />
      </div>

      {/* Subtle digital grid texture */}
      <div 
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.4) 1px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
};
