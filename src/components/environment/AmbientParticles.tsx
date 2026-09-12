import React, { useEffect, useRef } from 'react';

interface AmbientParticlesProps {
  isReducedMotion: boolean;
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

export const AmbientParticles: React.FC<AmbientParticlesProps> = ({
  isReducedMotion,
  mousePos,
  intensity = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', onResize);

    // Responsive particle count: fewer on mobile screens, restrained overall
    const isMobile = width < 768;
    const count = isMobile ? 24 : 45;

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
        speedY: -(Math.random() * 0.4 + 0.15), // Gentle upward drift
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

      const mouseWorldX = (mousePos.x + 0.5) * width;
      const mouseWorldY = (mousePos.y + 0.5) * height;

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
          // Sharp cybernetic pixel fragment
          ctx.fillStyle = `${p.color}${currentOpacity})`;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          // Subtle glow edge
          ctx.strokeStyle = `${p.color}${currentOpacity * 0.4})`;
          ctx.lineWidth = 0.5;
          ctx.strokeRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else if (p.type === 'spark') {
          // Luminous starlight spark with cross glare
          ctx.fillStyle = `${p.color}${currentOpacity})`;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.8, 0, Math.PI * 2);
          ctx.fill();

          // Horizontal/vertical micro glares
          ctx.strokeStyle = `${p.color}${currentOpacity * 0.6})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(-p.size * 2, 0);
          ctx.lineTo(p.size * 2, 0);
          ctx.moveTo(0, -p.size * 2);
          ctx.lineTo(0, p.size * 2);
          ctx.stroke();
        } else {
          // Soft atmospheric mote
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
  }, [isReducedMotion, mousePos, intensity]);

  if (isReducedMotion) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[2] select-none"
      style={{ opacity: 0.9 }}
    />
  );
};
