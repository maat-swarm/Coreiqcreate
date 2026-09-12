import React from 'react';

interface EnergyFieldProps {
  isReducedMotion: boolean;
  mousePos: { x: number; y: number };
  intensity?: number;
}

export const EnergyField: React.FC<EnergyFieldProps> = ({
  isReducedMotion,
  mousePos,
  intensity = 1,
}) => {
  // Parallax distortion
  const shiftX = isReducedMotion ? 0 : mousePos.x * 20;
  const shiftY = isReducedMotion ? 0 : mousePos.y * 15;

  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden select-none opacity-85">
      <svg
        className="w-full h-full"
        viewBox="0 0 1920 1080"
        fill="none"
        preserveAspectRatio="xMidYMid slice"
        style={{
          transform: `translate3d(${shiftX * 0.4}px, ${shiftY * 0.4}px, 0)`,
          transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <defs>
          {/* Primary Cyan-Blue Ribbon Gradient */}
          <linearGradient id="stream-cyan-blue" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#19d9ff" stopOpacity="0" />
            <stop offset="25%" stopColor="#19d9ff" stopOpacity="0.75" />
            <stop offset="55%" stopColor="#397bff" stopOpacity="0.8" />
            <stop offset="85%" stopColor="#8658ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#e447ff" stopOpacity="0" />
          </linearGradient>

          {/* Violet-Magenta Secondary Aurora Stream */}
          <linearGradient id="stream-violet-pink" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#8658ff" stopOpacity="0" />
            <stop offset="30%" stopColor="#a855f7" stopOpacity="0.65" />
            <stop offset="65%" stopColor="#ec4899" stopOpacity="0.6" />
            <stop offset="90%" stopColor="#19d9ff" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#19d9ff" stopOpacity="0" />
          </linearGradient>

          {/* Tertiary Gold Energy Pulse */}
          <linearGradient id="stream-gold-energy" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#ffb03a" stopOpacity="0" />
            <stop offset="50%" stopColor="#ffb03a" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#19d9ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#397bff" stopOpacity="0" />
          </linearGradient>

          <filter id="ribbon-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 1. Main Celestial Stream (Cascades from top-left islands towards center-right) */}
        <path
          d="M -100 280 C 400 120, 850 480, 1400 320 C 1680 230, 1850 390, 2050 420"
          stroke="url(#stream-cyan-blue)"
          strokeWidth="3.5"
          strokeLinecap="round"
          filter="url(#ribbon-glow)"
          style={{
            strokeDasharray: '300 300',
            animation: isReducedMotion ? 'none' : 'journeyLineStream 24s linear infinite',
            opacity: 0.8 * intensity,
          }}
        />

        {/* Ambient Halo behind Main Celestial Stream */}
        <path
          d="M -100 280 C 400 120, 850 480, 1400 320 C 1680 230, 1850 390, 2050 420"
          stroke="#19d9ff"
          strokeWidth="14"
          strokeOpacity="0.08"
          strokeLinecap="round"
          filter="url(#ribbon-glow)"
        />

        {/* 2. Counter-flowing Violet Aurora Ribbon */}
        <path
          d="M 2100 200 C 1600 350, 1200 150, 750 420 C 450 600, 150 520, -100 680"
          stroke="url(#stream-violet-pink)"
          strokeWidth="2.5"
          strokeLinecap="round"
          filter="url(#ribbon-glow)"
          style={{
            strokeDasharray: '250 250',
            animation: isReducedMotion ? 'none' : 'journeyLineStreamReverse 28s linear infinite',
            opacity: 0.7 * intensity,
          }}
        />

        {/* 3. Lower Ground Energy Pulse (Near the Mascot's ridge & crystal flora) */}
        <path
          d="M 600 950 C 950 820, 1300 890, 1650 780 C 1820 720, 1950 750, 2100 700"
          stroke="url(#stream-gold-energy)"
          strokeWidth="2"
          strokeLinecap="round"
          filter="url(#ribbon-glow)"
          style={{
            strokeDasharray: '200 400',
            animation: isReducedMotion ? 'none' : 'journeyLineStream 18s linear infinite',
            opacity: 0.65 * intensity,
          }}
        />

        {/* 4. High Orbital Micro-Filament */}
        <path
          d="M 200 80 C 650 40, 1100 120, 1550 60 C 1780 20, 1920 90, 2050 110"
          stroke="url(#stream-cyan-blue)"
          strokeWidth="1.5"
          strokeOpacity="0.45"
          strokeLinecap="round"
          style={{
            strokeDasharray: '150 450',
            animation: isReducedMotion ? 'none' : 'journeyLineStream 35s linear infinite',
          }}
        />
      </svg>
    </div>
  );
};
