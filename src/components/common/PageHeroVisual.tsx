import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'motion/react';

interface PageHeroVisualProps {
  children: React.ReactNode;
  className?: string;
}

export const PageHeroVisual: React.FC<PageHeroVisualProps> = ({
  children,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Parallax: hero visual moves slightly slower than scroll (0.85x scroll speed)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });

  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const opacity = useTransform(scrollYProgress, [0, 0.9], [1, 0]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 50]); // 0.85x relative scroll rate

  return (
    <motion.div
      ref={containerRef}
      style={{ scale, opacity, y }}
      className={`relative w-full max-w-[480px] aspect-square flex items-center justify-center select-none ${className}`}
    >
      {/* Luminous glow behind hero visual that slowly shifts between cyan and violet (duration 8s) */}
      <div 
        className="absolute inset-0 rounded-full blur-[90px] pointer-events-none"
        style={{
          animation: 'glowShift 8s ease-in-out infinite',
        }}
      />
      <div 
        className="absolute inset-8 rounded-full blur-[70px] pointer-events-none opacity-60"
        style={{
          animation: 'glowShift 8s ease-in-out infinite reverse',
          animationDelay: '4s',
        }}
      />

      {/* 3-4 small ambient particles around the hero visual with slow orbital / drift movement */}
      <div className="absolute inset-0 overflow-visible pointer-events-none">
        <div className="absolute top-[12%] left-[18%] w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#19d9ff] animate-particle-1" />
        <div className="absolute bottom-[16%] right-[14%] w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_#8658ff] animate-particle-2" />
        <div className="absolute top-[48%] -right-2 w-1.5 h-1.5 rounded-full bg-sky-300 shadow-[0_0_8px_#38bdf8] animate-particle-3" />
        <div className="absolute bottom-[24%] left-[10%] w-1 h-1 rounded-full bg-pink-400 shadow-[0_0_8px_#ec4899] animate-particle-2" />
      </div>

      {/* Hero visual floats with a slow breath animation (duration 6s, translateY -8px to 0, ease-in-out infinite) */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{
          animation: 'heroFloatBreath 6s ease-in-out infinite',
        }}
      >
        {children}
      </div>
    </motion.div>
  );
};
