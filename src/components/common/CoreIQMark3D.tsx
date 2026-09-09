import React, { useEffect, useRef } from 'react';

interface CoreIQMark3DProps {
  className?: string;
  size?: number;
}

export const CoreIQMark3D: React.FC<CoreIQMark3DProps> = ({ className = '', size = 480 }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.matches) return;
    const el = svgRef.current;
    if (!el) return;
    let raf: number;
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
        const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
        el.style.transform = `rotateY(${x * 10}deg) rotateX(${-y * 10}deg)`;
      });
    };
    const onLeave = () => { el.style.transform = 'rotateY(0deg) rotateX(0deg)'; };
    window.addEventListener('mousemove', onMove, { passive: true });
    el.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size, perspective: '900px' }}>

      {/* Ambient glow layers */}
      <div className="absolute inset-[10%] rounded-full bg-cyan-500/25 blur-[70px] animate-mark-pulse pointer-events-none" />
      <div className="absolute inset-[22%] rounded-full bg-violet-600/30 blur-[50px] animate-mark-pulse-delay pointer-events-none" />
      <div className="absolute inset-[38%] rounded-full bg-pink-500/20 blur-[35px] pointer-events-none" />

      {/* Outer particle ring — counter-rotating squares */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 520 520" fill="none" aria-hidden="true">
        <g style={{ transformOrigin: '260px 260px', animation: 'spinVerySlow 60s linear infinite' }}>
          {[0,45,90,135,180,225,270,315].map((deg, i) => {
            const rad = deg * Math.PI / 180;
            const x = 260 + 240 * Math.cos(rad);
            const y = 260 + 240 * Math.sin(rad);
            return <rect key={i} x={x-2} y={y-2} width={i%2===0?4:3} height={i%2===0?4:3}
              fill={['#19d9ff','#397bff','#8658ff','#e447ff'][i%4]} opacity={0.6} />;
          })}
        </g>
        <g style={{ transformOrigin: '260px 260px', animation: 'spinVerySlowReverse 45s linear infinite' }}>
          {[22,67,112,157,202,247].map((deg, i) => {
            const rad = deg * Math.PI / 180;
            const x = 260 + 190 * Math.cos(rad);
            const y = 260 + 190 * Math.sin(rad);
            return <circle key={i} cx={x} cy={y} r={2} fill={['#19d9ff','#8658ff','#e447ff'][i%3]} opacity={0.5} />;
          })}
        </g>
      </svg>

      {/* Main Phoenix SVG mark */}
      <svg ref={svgRef} viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 w-[75%] h-[75%] transition-transform duration-700 ease-out"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
        aria-label="Core IQ emblem">
        <defs>
          <linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#19d9ff" />
            <stop offset="28%" stopColor="#397bff" />
            <stop offset="58%" stopColor="#8658ff" />
            <stop offset="82%" stopColor="#e447ff" />
            <stop offset="100%" stopColor="#ff9b42" />
          </linearGradient>
          <linearGradient id="g2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#397bff" />
            <stop offset="50%" stopColor="#8658ff" />
            <stop offset="100%" stopColor="#e447ff" />
          </linearGradient>
          <linearGradient id="g3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#19d9ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#8658ff" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="gc" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#a8f0ff" />
            <stop offset="55%" stopColor="#19d9ff" />
            <stop offset="80%" stopColor="#8658ff" />
            <stop offset="100%" stopColor="#050814" />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feComposite in="SourceGraphic" in2="b" operator="over" />
          </filter>
          <filter id="oglow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="cb" />
            <feMerge><feMergeNode in="cb"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Orbital ellipses */}
        <ellipse cx="170" cy="170" rx="148" ry="55" stroke="#19d9ff" strokeWidth="1.5" strokeOpacity="0.22" fill="none"
          style={{ transformOrigin: '170px 170px', animation: 'markOrbit1 18s linear infinite' }} />
        <ellipse cx="170" cy="170" rx="148" ry="55" stroke="#8658ff" strokeWidth="1" strokeOpacity="0.18" fill="none"
          style={{ transformOrigin: '170px 170px', animation: 'markOrbit2 24s linear infinite' }} />

        {/* Outer ribbon */}
        <path d="M 170 28 C 225 28, 280 65, 295 118 C 312 178, 278 235, 225 252 C 168 270, 108 242, 82 195 C 56 148, 72 88, 115 65 C 142 50, 168 60, 178 82 C 188 104, 175 130, 155 138 C 138 146, 120 138, 114 122 C 108 108, 116 90, 130 88"
          stroke="url(#g1)" strokeWidth="10" strokeLinecap="round" fill="none" filter="url(#oglow)"
          style={{ animation: 'markRibbon1 6s ease-in-out infinite' }} />

        {/* Counter ribbon */}
        <path d="M 170 52 C 130 52, 95 78, 82 118 C 68 162, 88 210, 128 230 C 168 250, 215 238, 240 202 C 265 166, 258 120, 232 98 C 210 80, 185 88, 178 108"
          stroke="url(#g2)" strokeWidth="6.5" strokeLinecap="round" fill="none" opacity="0.85"
          style={{ animation: 'markRibbon2 8s ease-in-out infinite 1s' }} />

        {/* Inner ribbon */}
        <path d="M 170 88 C 195 88, 218 105, 225 128 C 232 152, 218 178, 196 188 C 174 198, 150 188, 140 168 C 130 148, 138 122, 156 114 C 168 108, 180 114, 184 126"
          stroke="url(#g3)" strokeWidth="4" strokeLinecap="round" fill="none" opacity="0.9"
          style={{ animation: 'markRibbon3 5s ease-in-out infinite 0.5s' }} />

        {/* Core orb */}
        <circle cx="170" cy="170" r="30" fill="url(#gc)" filter="url(#glow)"
          style={{ animation: 'markPulse 3.5s ease-in-out infinite' }} />
        <circle cx="162" cy="162" r="10" fill="white" opacity="0.65" />

        {/* Sparks */}
        <circle cx="170" cy="24" r="4" fill="#19d9ff" filter="url(#glow)" style={{ animation: 'spark1 3.2s ease-in-out infinite' }} />
        <circle cx="298" cy="118" r="3" fill="#e447ff" style={{ animation: 'spark2 4.5s ease-in-out infinite 0.8s' }} />
        <circle cx="78" cy="215" r="2.5" fill="#ff9b42" style={{ animation: 'spark3 5.5s ease-in-out infinite 2s' }} />
        <circle cx="232" cy="248" r="2" fill="#8658ff" style={{ animation: 'spark2 4.5s ease-in-out infinite 1.5s' }} />

        {/* Energy trail — outer ribbon */}
        <circle r="4" fill="#19d9ff" opacity="0.9" filter="url(#glow)">
          <animateMotion dur="4s" repeatCount="indefinite"
            path="M 170 28 C 225 28, 280 65, 295 118 C 312 178, 278 235, 225 252 C 168 270, 108 242, 82 195 C 56 148, 72 88, 115 65 C 142 50, 168 60, 178 82 C 188 104, 175 130, 155 138" />
        </circle>
        {/* Energy trail — counter ribbon */}
        <circle r="2.5" fill="#e447ff" opacity="0.8">
          <animateMotion dur="5.5s" repeatCount="indefinite" begin="1.5s"
            path="M 170 52 C 130 52, 95 78, 82 118 C 68 162, 88 210, 128 230 C 168 250, 215 238, 240 202 C 265 166, 258 120, 232 98 C 210 80, 185 88, 178 108" />
        </circle>
      </svg>
    </div>
  );
};
