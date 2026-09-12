import React, { useEffect, useRef } from 'react';

interface AmbientParticlesProps {
  isReducedMotion: boolean;
  shouldPruneRAF?: boolean;
  mousePos: { x: number; y: number };
  intensity?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  opacity: number;
  maxOpacity: number;
  type: 'pixel' | 'mote' | 'spark';
  color: string;
  rotation: number;
  rotationSpeed: number;
  pulseSpeed: number;
  phase: number;
}

/**
 * Lightweight, GPU-accelerated CSS particle layer.
 * Replaces high-cost requestAnimationFrame canvas drawing on mobile devices & reduced-motion,
 * maintaining the Core IQ celestial aesthetic while offloading animation to the hardware compositor.
 */
const CSSAmbientParticles: React.FC<{ intensity?: number }> = ({ intensity = 1 }) => {
  const cssParticles = [
    // Cyan pixel fragments
    { top: '18%', left: '22%', size: 4, type: 'pixel', color: 'rgba(25, 217, 255, 0.7)', delay: '0s', duration: '18s' },
    { top: '65%', left: '15%', size: 3, type: 'pixel', color: 'rgba(25, 217, 255, 0.6)', delay: '3s', duration: '22s' },
    { top: '42%', left: '82%', size: 3.5, type: 'pixel', color: 'rgba(25, 217, 255, 0.75)', delay: '7s', duration: '19s' },
    // Violet / Magenta sparks
    { top: '28%', left: '74%', size: 5, type: 'spark', color: 'rgba(134, 88, 255, 0.8)', delay: '2s', duration: '14s' },
    { top: '80%', left: '68%', size: 4, type: 'spark', color: 'rgba(228, 71, 255, 0.75)', delay: '5s', duration: '16s' },
    { top: '50%', left: '35%', size: 4.5, type: 'spark', color: 'rgba(57, 123, 255, 0.8)', delay: '9s', duration: '15s' },
    // Warm celestial motes
    { top: '35%', left: '55%', size: 3, type: 'mote', color: 'rgba(255, 180, 80, 0.7)', delay: '1s', duration: '17s' },
    { top: '72%', left: '42%', size: 3.5, type: 'mote', color: 'rgba(255, 180, 80, 0.65)', delay: '6s', duration: '21s' },
    { top: '15%', left: '60%', size: 2.5, type: 'mote', color: 'rgba(25, 217, 255, 0.55)', delay: '4s', duration: '20s' },
  ];

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none z-[2] select-none overflow-hidden css-particles-container"
      style={{ opacity: intensity }}
    >
      {cssParticles.map((p, idx) => {
        if (p.type === 'pixel') {
          return (
            <div
              key={idx}
              className="ambient-css-pixel"
              style={{
                top: p.top,
                left: p.left,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 8px ${p.color}`,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          );
        }

        if (p.type === 'spark') {
          return (
            <div
              key={idx}
              className="ambient-css-spark"
              style={{
                top: p.top,
                left: p.left,
                width: `${p.size}px`,
                height: `${p.size}px`,
                backgroundColor: p.color,
                boxShadow: `0 0 10px ${p.color}`,
                animationDelay: p.delay,
                animationDuration: p.duration,
              }}
            />
          );
        }

        return (
          <div
            key={idx}
            className="ambient-css-mote"
            style={{
              top: p.top,
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              boxShadow: `0 0 6px ${p.color}`,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }}
          />
        );
      })}
    </div>
  );
};

export const AmbientParticles: React.FC<AmbientParticlesProps> = ({
  isReducedMotion,
  shouldPruneRAF = false,
  mousePos,
  intensity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef(mousePos);

  // Keep mousePos updated without re-running the animation setup effect
  useEffect(() => {
    mousePosRef.current = mousePos;
  }, [mousePos]);

  useEffect(() => {
    // If high-cost rAF should be pruned (mobile devices or reduced-motion), skip canvas initialization completely
    if (isReducedMotion || shouldPruneRAF) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const setupCanvas = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    setupCanvas();

    const onResize = () => {
      if (!canvas) return;
      setupCanvas();
    };

    window.addEventListener('resize', onResize);

    const count = 40;

    const colors = [
      'rgba(25, 217, 255, ',   // Electric Cyan
      'rgba(134, 88, 255, ',   // Violet
      'rgba(57, 123, 255, ',   // Blue
      'rgba(228, 71, 255, ',   // Magenta
      'rgba(255, 180, 80, ',   // Warm gold mote
    ];

    const particles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const typeChoice = Math.random();
      const type: 'pixel' | 'mote' | 'spark' =
        typeChoice < 0.45 ? 'pixel' : typeChoice < 0.85 ? 'mote' : 'spark';
      
      const maxOp = type === 'pixel' ? 0.6 : type === 'spark' ? 0.85 : 0.45;

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: type === 'pixel' ? Math.random() * 3 + 2.5 : type === 'spark' ? Math.random() * 2 + 1.5 : Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: -(Math.random() * 0.4 + 0.15),
        opacity: Math.random() * maxOp,
        maxOpacity: maxOp,
        type,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.02,
        pulseSpeed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2,
      });
    }

    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min(now - lastTime, 64) / 1000;
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      const currentMouse = mousePosRef.current;
      const mouseWorldX = (currentMouse.x + 0.5) * width;
      const mouseWorldY = (currentMouse.y + 0.5) * height;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Interaction deflection: gently drift away if cursor gets close
        const dx = p.x - mouseWorldX;
        const dy = p.y - mouseWorldY;
        const distSq = dx * dx + dy * dy;
        const radius = 180;
        if (distSq < radius * radius && distSq > 1) {
          const force = (1 - Math.sqrt(distSq) / radius) * 18;
          p.x += (dx / Math.sqrt(distSq)) * force * dt;
          p.y += (dy / Math.sqrt(distSq)) * force * dt;
        }

        p.x += p.speedX * (60 * dt);
        p.y += p.speedY * (60 * dt);
        p.phase += p.pulseSpeed * (60 * dt);
        p.rotation += p.rotationSpeed * (60 * dt);

        // Wrap around viewport edges smoothly
        if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        const currentOpacity = Math.max(
          0.05,
          (p.maxOpacity * 0.6 + Math.sin(p.phase) * (p.maxOpacity * 0.4)) * intensity
        );

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);

        if (p.type === 'pixel') {
          ctx.fillStyle = `${p.color}${currentOpacity})`;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.strokeStyle = `${p.color}${currentOpacity * 0.4})`;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.type === 'spark') {
          ctx.fillStyle = `${p.color}${currentOpacity})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = `${p.color}${currentOpacity * 0.6})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(-p.size * 2, 0);
          ctx.lineTo(p.size * 2, 0);
          ctx.moveTo(0, -p.size * 2);
          ctx.lineTo(0, p.size * 2);
          ctx.stroke();
        } else {
          ctx.fillStyle = `${p.color}${currentOpacity})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, [isReducedMotion, shouldPruneRAF, intensity]);

  // When high-cost rAF should be pruned, offload particles to GPU-composited CSS transitions/animations
  if (isReducedMotion || shouldPruneRAF) {
    return <CSSAmbientParticles intensity={intensity} />;
  }

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[2] select-none"
      style={{ opacity: 0.9 }}
    />
  );
};
