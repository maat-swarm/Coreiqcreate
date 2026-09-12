import React, { useState, useEffect, useRef } from 'react';
import { NavRoute } from '../../types';
import { useMotionPruning } from '../../hooks/useMotionPruning';
import { VideoBackground } from './VideoBackground';
import { AtmosphericLayer } from './AtmosphericLayer';
import { AmbientParticles } from './AmbientParticles';
import { EnergyField } from './EnergyField';
import { InteractiveLightField } from './InteractiveLightField';
import { MascotEnvironment } from './MascotEnvironment';
import { ScrollVisualController } from './ScrollVisualController';

interface SiteVisualEnvironmentProps {
  currentRoute: NavRoute;
}

export const SiteVisualEnvironment: React.FC<SiteVisualEnvironmentProps> = ({
  currentRoute,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isInputFocused, setIsInputFocused] = useState(false);
  const rafRef = useRef<number>(0);

  // 1. Detect prefers-reduced-motion and mobile device constraints
  const { isReducedMotion, shouldPruneRAF } = useMotionPruning();

  // 2. Track pointer position via requestAnimationFrame on desktop only.
  // On mobile devices (Android Chrome, etc.) or when reduced-motion is requested,
  // we prune this high-cost rAF listener to avoid continuous React re-renders during touch scrolling.
  useEffect(() => {
    if (isReducedMotion || shouldPruneRAF) {
      setMousePos({ x: 0, y: 0 });
      return;
    }

    const handlePointerMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setMousePos({
          x: e.clientX / window.innerWidth - 0.5,
          y: e.clientY / window.innerHeight - 0.5,
        });
      });
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isReducedMotion, shouldPruneRAF]);

  // 3. Listen for Ask Core IQ focus & submit events
  useEffect(() => {
    const handleFocus = (e: Event) => {
      const custom = e as CustomEvent<{ focused: boolean }>;
      setIsInputFocused(Boolean(custom.detail?.focused));
    };

    window.addEventListener('coreiq:focus', handleFocus);
    return () => window.removeEventListener('coreiq:focus', handleFocus);
  }, []);

  return (
    <div
      id="site-visual-environment"
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#030712]"
    >
      <ScrollVisualController
        isReducedMotion={isReducedMotion}
        shouldPruneRAF={shouldPruneRAF}
      >
        {({ scrollProgress }) => (
          <>
            {/* LAYER 1: Core IQ Living World Video / Artwork Foundation */}
            <VideoBackground
              isReducedMotion={isReducedMotion}
              mousePos={mousePos}
              scrollProgress={scrollProgress}
            />

            {/* LAYER 2: Atmospheric Lighting, Nebulae & Typography Readability Shields */}
            <AtmosphericLayer
              currentRoute={currentRoute}
              mousePos={mousePos}
              isReducedMotion={isReducedMotion}
            />

            {/* LAYER 3: Organic Energy Ribbons & Celestial Currents */}
            <EnergyField
              isReducedMotion={isReducedMotion}
              mousePos={mousePos}
              intensity={currentRoute === 'solutions' || currentRoute === 'ask' ? 1.2 : 1}
            />

            {/* LAYER 4: Living Mascot Heart Pulse, Visor Gaze & Agent Presence */}
            <MascotEnvironment
              isReducedMotion={isReducedMotion}
              mousePos={mousePos}
              isInputFocused={isInputFocused}
              scrollProgress={scrollProgress}
            />

            {/* LAYER 5: Crystalline Particles, Pixel Fragments & Ambient Motes (Offloaded to CSS on mobile) */}
            <AmbientParticles
              isReducedMotion={isReducedMotion}
              shouldPruneRAF={shouldPruneRAF}
              mousePos={mousePos}
              intensity={currentRoute === 'learn' ? 0.8 : 1}
            />

            {/* LAYER 6: Interactive Cursor Light Bloom & Resonant Input Reaction */}
            <InteractiveLightField
              isReducedMotion={isReducedMotion}
              shouldPruneRAF={shouldPruneRAF}
              mousePos={mousePos}
              isInputFocused={isInputFocused}
            />
          </>
        )}
      </ScrollVisualController>
    </div>
  );
};
