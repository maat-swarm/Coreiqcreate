import React, { useState, useEffect, useRef } from 'react';
import { NavRoute } from '../../types';
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
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const rafRef = useRef<number>(0);

  // 1. Detect prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mq.matches);

    const onChange = (e: MediaQueryListEvent) => setIsReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // 2. Track pointer position with gentle normalization (-0.5 to 0.5)
  useEffect(() => {
    if (isReducedMotion) return;

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
  }, [isReducedMotion]);

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
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none bg-[#030712]"
    >
      <ScrollVisualController isReducedMotion={isReducedMotion}>
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

            {/* LAYER 5: Crystalline Particles, Pixel Fragments & Ambient Motes */}
            <AmbientParticles
              isReducedMotion={isReducedMotion}
              mousePos={mousePos}
              intensity={currentRoute === 'learn' ? 0.8 : 1}
            />

            {/* LAYER 6: Interactive Cursor Light Bloom & Resonant Input Reaction */}
            <InteractiveLightField
              isReducedMotion={isReducedMotion}
              mousePos={mousePos}
              isInputFocused={isInputFocused}
            />
          </>
        )}
      </ScrollVisualController>
    </div>
  );
};
