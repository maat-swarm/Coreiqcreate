import React, { useEffect, useRef, useState } from 'react';

export const AmbientBackground: React.FC = () => {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf.current);
      raf.current = requestAnimationFrame(() =>
        setMouse({ x: e.clientX / window.innerWidth - 0.5, y: e.clientY / window.innerHeight - 0.5 })
      );
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf.current); };
  }, []);

  const t = (f: number) => ({
    transform: `translate(${mouse.x * f}px, ${mouse.y * f}px)`,
    transition: 'transform 0.9s cubic-bezier(0.16,1,0.3,1)',
  });

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[#030712]" />
      <div className="absolute inset-0 bg-gradient-to-br from-[#06102a] via-[#030712] to-[#02050f]" />

      {/* Layer 1 — cyan/blue top-right */}
      <div className="absolute -top-48 right-[-15%] w-[700px] h-[700px] rounded-full animate-ambient-drift-1 will-change-transform"
        style={{ background:'radial-gradient(ellipse at center,rgba(25,217,255,0.16) 0%,rgba(57,123,255,0.10) 40%,transparent 70%)', filter:'blur(70px)', ...t(12) }} />

      {/* Layer 2 — violet/magenta mid */}
      <div className="absolute top-[20%] right-[0%] w-[600px] h-[600px] rounded-full animate-ambient-drift-2 will-change-transform"
        style={{ background:'radial-gradient(ellipse at center,rgba(134,88,255,0.18) 0%,rgba(228,71,255,0.10) 45%,transparent 72%)', filter:'blur(80px)', ...t(-8) }} />

      {/* Layer 3 — deep blue bottom-left */}
      <div className="absolute top-[60%] -left-[12%] w-[650px] h-[650px] rounded-full animate-ambient-drift-3 will-change-transform"
        style={{ background:'radial-gradient(ellipse at center,rgba(57,123,255,0.15) 0%,rgba(25,217,255,0.06) 50%,transparent 72%)', filter:'blur(75px)', ...t(6) }} />

      {/* Layer 4 — warm bottom-right */}
      <div className="absolute top-[75%] right-[10%] w-[350px] h-[350px] rounded-full animate-ambient-drift-1 will-change-transform"
        style={{ background:'radial-gradient(ellipse at center,rgba(255,155,66,0.08) 0%,transparent 65%)', filter:'blur(60px)', animationDelay:'3s', ...t(4) }} />

      {/* Layer 5 — magenta upper-left */}
      <div className="absolute -top-20 -left-[5%] w-[500px] h-[500px] rounded-full animate-ambient-drift-2 will-change-transform"
        style={{ background:'radial-gradient(ellipse at center,rgba(228,71,255,0.07) 0%,transparent 70%)', filter:'blur(90px)', animationDelay:'8s', ...t(-5) }} />

      {/* Topology dot grid */}
      <div className="absolute inset-0 opacity-[0.028]"
        style={{ backgroundImage:'radial-gradient(circle at 1px 1px,rgba(56,189,248,0.5) 1px,transparent 0)', backgroundSize:'44px 44px' }} />

      {/* Scan lines */}
      <div className="absolute inset-0 opacity-[0.016]"
        style={{ backgroundImage:'repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(25,217,255,0.08) 3px,rgba(25,217,255,0.08) 4px)' }} />

      {/* Square particles */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute top-[18%] left-[12%] w-[5px] h-[5px] bg-cyan-400 animate-particle-1 rotate-12" style={{boxShadow:'0 0 6px #19d9ff'}} />
        <div className="absolute top-[42%] left-[78%] w-[3px] h-[3px] bg-blue-400 animate-particle-2" style={{boxShadow:'0 0 5px #397bff'}} />
        <div className="absolute top-[72%] left-[28%] w-[4px] h-[4px] bg-cyan-300 animate-particle-3 -rotate-6" style={{boxShadow:'0 0 5px #19d9ff'}} />
        <div className="absolute top-[30%] left-[52%] w-[3px] h-[3px] bg-violet-400 animate-particle-2" style={{animationDelay:'1s',boxShadow:'0 0 4px #8658ff'}} />
        <div className="absolute top-[58%] left-[65%] w-[5px] h-[5px] bg-purple-400 animate-particle-1 rotate-45" style={{animationDelay:'2.5s',boxShadow:'0 0 6px #8658ff'}} />
        <div className="absolute top-[85%] left-[45%] w-[3px] h-[3px] bg-pink-400 animate-particle-3" style={{animationDelay:'1.5s',boxShadow:'0 0 4px #e447ff'}} />
        <div className="absolute top-[22%] left-[88%] w-[4px] h-[4px] bg-fuchsia-400 animate-particle-1 -rotate-12" style={{animationDelay:'4s',boxShadow:'0 0 5px #e447ff'}} />
        <div className="absolute top-[65%] left-[8%] w-[3px] h-[3px] bg-orange-400 animate-particle-2" style={{animationDelay:'6s',boxShadow:'0 0 4px #ff9b42'}} />
      </div>

      {/* Centre vignette */}
      <div className="absolute inset-0"
        style={{ background:'radial-gradient(ellipse 80% 80% at 50% 40%,transparent 40%,rgba(2,5,20,0.55) 100%)' }} />
    </div>
  );
};
