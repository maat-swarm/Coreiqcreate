import React, { useEffect, useRef } from 'react';
import { ASSETS } from '../../assets/images';

export const AmbientBackground: React.FC = () => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (reduceMotion) return;

    const handlePointer = (event: PointerEvent) => {
      target.current.x =
        (event.clientX / window.innerWidth - 0.5) * 2;
      target.current.y =
        (event.clientY / window.innerHeight - 0.5) * 2;
    };

    const animate = () => {
      current.current.x +=
        (target.current.x - current.current.x) * 0.035;
      current.current.y +=
        (target.current.y - current.current.y) * 0.035;

      if (sceneRef.current) {
        sceneRef.current.style.setProperty(
          '--scene-x',
          `${current.current.x * 18}px`
        );
        sceneRef.current.style.setProperty(
          '--scene-y',
          `${current.current.y * 14}px`
        );
        sceneRef.current.style.setProperty(
          '--scene-x-soft',
          `${current.current.x * -9}px`
        );
        sceneRef.current.style.setProperty(
          '--scene-y-soft',
          `${current.current.y * -7}px`
        );
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('pointermove', handlePointer, {
      passive: true,
    });

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('pointermove', handlePointer);

      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={sceneRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[#02040b]"
    >
      {/* Deep cinematic base */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_30%,rgba(28,91,190,0.16),transparent_34%),radial-gradient(circle_at_82%_52%,rgba(137,45,177,0.12),transparent_32%),radial-gradient(circle_at_18%_78%,rgba(17,66,155,0.12),transparent_35%),linear-gradient(180deg,#050a18_0%,#02040b_55%,#010207_100%)]" />

      {/* Existing Core IQ cosmic artwork, used as atmosphere rather than a card/image */}
      <div
        className="absolute inset-[-8%] opacity-[0.13] mix-blend-screen transition-transform duration-1000 ease-out"
        style={{
          transform:
            'translate3d(var(--scene-x-soft), var(--scene-y-soft), 0) scale(1.08)',
        }}
      >
        <img
          src={ASSETS.cosmicHorizon}
          alt=""
          className="h-full w-full object-cover object-center"
        />
      </div>

      {/* Large spatial light fields */}
      <div
        className="absolute -top-[22%] right-[3%] h-[720px] w-[720px] rounded-full blur-[120px] opacity-60"
        style={{
          background:
            'radial-gradient(circle, rgba(34,211,238,.20) 0%, rgba(37,99,235,.10) 35%, transparent 70%)',
          transform:
            'translate3d(var(--scene-x), var(--scene-y), 0)',
        }}
      />

      <div
        className="absolute top-[15%] right-[18%] h-[600px] w-[600px] rounded-full blur-[130px] opacity-50"
        style={{
          background:
            'radial-gradient(circle, rgba(168,85,247,.18) 0%, rgba(236,72,153,.09) 38%, transparent 72%)',
          transform:
            'translate3d(var(--scene-x-soft), var(--scene-y-soft), 0)',
        }}
      />

      <div
        className="absolute bottom-[-25%] left-[-12%] h-[760px] w-[760px] rounded-full blur-[140px] opacity-45"
        style={{
          background:
            'radial-gradient(circle, rgba(37,99,235,.20) 0%, rgba(6,182,212,.07) 40%, transparent 72%)',
          transform:
            'translate3d(var(--scene-x), var(--scene-y), 0)',
        }}
      />

      {/* Fine atmospheric light streak */}
      <div
        className="absolute left-[-10%] top-[48%] h-px w-[120%] opacity-20"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(103,232,249,.55), rgba(167,139,250,.35), transparent)',
          transform:
            'translate3d(var(--scene-x-soft), var(--scene-y-soft), 0) rotate(-7deg)',
        }}
      />

      {/* Sparse intelligent particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 34 }).map((_, index) => {
          const left = (index * 37) % 100;
          const top = (index * 61) % 100;
          const size = 1 + (index % 3);

          return (
            <span
              key={index}
              className="absolute rounded-full bg-cyan-200/40 animate-pulse"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${size}px`,
                height: `${size}px`,
                animationDelay: `${(index % 9) * 0.55}s`,
                animationDuration: `${3 + (index % 5)}s`,
                transform:
                  'translate3d(var(--scene-x-soft), var(--scene-y-soft), 0)',
              }}
            />
          );
        })}
      </div>

      {/* Cinematic vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,.38)_100%)]" />

      {/* Subtle lower horizon */}
      <div className="absolute bottom-0 left-0 right-0 h-[28vh] bg-gradient-to-t from-[#010207] via-[#010207]/65 to-transparent" />
    </div>
  );
};
