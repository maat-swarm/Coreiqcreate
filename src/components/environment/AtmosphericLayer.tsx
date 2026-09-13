import React from 'react';
import { NavRoute } from '../../types';

interface AtmosphericLayerProps {
  currentRoute: NavRoute;
  mousePos: { x: number; y: number };
  isReducedMotion: boolean;
}

export const AtmosphericLayer: React.FC<AtmosphericLayerProps> = ({
  currentRoute,
  mousePos,
  isReducedMotion,
}) => {
  // Route-specific atmosphere accent colors
  const routeAccents: Record<NavRoute, { primary: string; secondary: string; glow: string }> = {
    home: {
      primary: 'rgba(25, 217, 255, 0.16)', // Electric Cyan
      secondary: 'rgba(134, 88, 255, 0.14)', // Violet
      glow: 'rgba(228, 71, 255, 0.08)', // Magenta
    },
    solutions: {
      primary: 'rgba(25, 217, 255, 0.20)', // Cyan infrastructure
      secondary: 'rgba(57, 123, 255, 0.15)', // Blue
      glow: 'rgba(134, 88, 255, 0.10)',
    },
    apps: {
      primary: 'rgba(134, 88, 255, 0.18)', // Violet
      secondary: 'rgba(228, 71, 255, 0.15)', // Magenta
      glow: 'rgba(25, 217, 255, 0.12)',
    },
    learn: {
      primary: 'rgba(57, 123, 255, 0.14)', // Deep calm blue
      secondary: 'rgba(134, 88, 255, 0.16)', // Violet wisdom
      glow: 'rgba(25, 217, 255, 0.08)',
    },
    tools: {
      primary: 'rgba(25, 217, 255, 0.22)', // Precision cyan
      secondary: 'rgba(34, 211, 238, 0.16)',
      glow: 'rgba(57, 123, 255, 0.12)',
    },
    about: {
      primary: 'rgba(134, 88, 255, 0.16)', // Cosmic violet
      secondary: 'rgba(255, 155, 66, 0.08)', // Warm starlight accent
      glow: 'rgba(57, 123, 255, 0.12)',
    },
    ask: {
      primary: 'rgba(25, 217, 255, 0.24)', // High reactive cyan
      secondary: 'rgba(134, 88, 255, 0.20)', // Responsive violet
      glow: 'rgba(228, 71, 255, 0.14)',
    },
    command: {
      primary: 'rgba(25, 217, 255, 0.22)', // Cyan cockpit
      secondary: 'rgba(57, 123, 255, 0.18)', // Electric Blue
      glow: 'rgba(134, 88, 255, 0.12)',
    },
  };

  const accent = routeAccents[currentRoute] || routeAccents.home;

  // Soft pointer parallax offset
  const shiftX = isReducedMotion ? 0 : mousePos.x * 15;
  const shiftY = isReducedMotion ? 0 : mousePos.y * 12;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 1. Deep Midnight Base Vignette */}
      <div 
        className="absolute inset-0 bg-[#030712]/20"
        style={{
          background: 'radial-gradient(circle at 50% 40%, transparent 35%, rgba(3, 7, 18, 0.45) 85%, rgba(3, 7, 18, 0.85) 100%)',
        }}
      />

      {/* 2. Mandatory Typography Protection Gradient (Desktop Left Side & Mobile Top) */}
      {/* On desktop: balanced dark shield on left side so headlines like "Build what matters." always pass WCAG contrast */}
      <div 
        className="absolute inset-0 hidden lg:block"
        style={{
          background: 'linear-gradient(90deg, rgba(3,7,18,0.85) 0%, rgba(3,7,18,0.70) 38%, rgba(3,7,18,0.30) 60%, rgba(3,7,18,0.05) 80%, transparent 100%)',
        }}
      />
      {/* On mobile/tablet: translucent atmospheric shield on top of viewport allowing artwork and video colors to pop */}
      <div 
        className="absolute inset-0 lg:hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(3,7,18,0.60) 0%, rgba(3,7,18,0.30) 38%, rgba(3,7,18,0.12) 65%, rgba(3,7,18,0.55) 100%)',
        }}
      />

      {/* 3. Volumetric Cyan Sky Bloom (Top-Left / Island Area) */}
      <div 
        className="absolute -top-32 -left-24 w-[750px] h-[650px] rounded-full blur-[110px] transition-transform duration-1000 ease-out will-change-transform"
        style={{
          background: `radial-gradient(circle, ${accent.primary} 0%, rgba(25, 217, 255, 0.04) 50%, transparent 75%)`,
          transform: `translate3d(${shiftX * 0.8}px, ${shiftY * 0.8}px, 0)`,
        }}
      />

      {/* 4. Cosmic Violet / Magenta Horizon Bloom (Top-Right / Planet Area) */}
      <div 
        className="absolute top-0 right-[-10%] w-[850px] h-[750px] rounded-full blur-[120px] transition-transform duration-1000 ease-out will-change-transform"
        style={{
          background: `radial-gradient(circle, ${accent.secondary} 0%, ${accent.glow} 45%, transparent 70%)`,
          transform: `translate3d(${-shiftX * 0.6}px, ${-shiftY * 0.6}px, 0)`,
        }}
      />

      {/* 5. Mascot Presence Rim Light (Bottom-Right) */}
      <div 
        className="absolute bottom-[-10%] right-[10%] w-[600px] h-[500px] rounded-full blur-[90px] pointer-events-none transition-transform duration-1000 ease-out"
        style={{
          background: 'radial-gradient(circle, rgba(25, 217, 255, 0.12) 0%, rgba(134, 88, 255, 0.08) 50%, transparent 70%)',
          transform: `translate3d(${shiftX * 1.2}px, ${shiftY * 1.2}px, 0)`,
        }}
      />

      {/* 6. Subtle Cyber-Grid Topography Texture */}
      <div 
        className="absolute inset-0 opacity-[0.022]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(56, 189, 248, 0.7) 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* 7. Fine Scan Horizon Lines (Restrained & Sophisticated) */}
      <div 
        className="absolute inset-0 opacity-[0.012]"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(25, 217, 255, 0.15) 3px, rgba(25, 217, 255, 0.15) 4px)',
        }}
      />
    </div>
  );
};
