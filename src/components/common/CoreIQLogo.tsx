import React from 'react';

interface CoreIQLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CoreIQLogo: React.FC<CoreIQLogoProps> = ({ size = 'md', className = '' }) => {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const subSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-[11px]' : 'text-[10px]';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none group cursor-pointer ${className}`}>
      {/* Iridescent Phoenix Energy Swirl Icon */}
      <div 
        className="relative flex items-center justify-center shrink-0 rounded-full transition-transform duration-300 group-hover:scale-105"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg 
          viewBox="0 0 100 100" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg" 
          className="w-full h-full drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]"
        >
          <defs>
            <linearGradient id="phoenixGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="30%" stopColor="#38bdf8" />
              <stop offset="60%" stopColor="#a855f7" />
              <stop offset="85%" stopColor="#ec4899" />
              <stop offset="100%" stopColor="#fb923c" />
            </linearGradient>
            <linearGradient id="phoenixGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#ec4899" />
            </linearGradient>
            <radialGradient id="phoenixCore" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="80%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#030712" />
            </radialGradient>
          </defs>

          {/* Outer luminous energy curve */}
          <path 
            d="M 50 10 C 75 10 92 30 88 56 C 85 75 66 90 46 88 C 26 86 12 70 14 48 C 16 32 30 22 45 23 C 58 24 67 34 65 48 C 63 60 52 68 40 65 C 32 63 28 54 31 46 C 34 38 42 36 48 40" 
            stroke="url(#phoenixGrad1)" 
            strokeWidth="8.5" 
            strokeLinecap="round" 
            className="filter drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
          />

          {/* Inner counter-swirl crest */}
          <path 
            d="M 50 18 C 30 20 20 38 22 58 C 24 74 38 84 56 82 C 72 80 82 66 80 50" 
            stroke="url(#phoenixGrad2)" 
            strokeWidth="5" 
            strokeLinecap="round" 
            opacity="0.85"
          />

          {/* Central luminous core orb */}
          <circle 
            cx="50" 
            cy="52" 
            r="10.5" 
            fill="url(#phoenixCore)" 
            className="animate-pulse-glow"
          />

          {/* Spark particle */}
          <circle cx="78" cy="26" r="3" fill="#22d3ee" className="animate-ping" style={{ animationDuration: '3s' }} />
          <circle cx="88" cy="38" r="2" fill="#ec4899" />
        </svg>
      </div>

      {/* Brand Text */}
      <div className="flex flex-col leading-none">
        <span className={`font-bold tracking-tight text-white ${textSize} font-display`}>
          Core<span className="text-cyan-300">IQ</span>
        </span>
        <span className={`font-semibold tracking-[0.26em] text-cyan-400 uppercase ${subSize} mt-0.5`}>
          CREATE
        </span>
      </div>
    </div>
  );
};
