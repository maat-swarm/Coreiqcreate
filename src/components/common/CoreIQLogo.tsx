import React from 'react';

interface CoreIQLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CoreIQLogo: React.FC<CoreIQLogoProps> = ({ size = 'md', className = '' }) => {
  const imgSize = size === 'sm' ? 44 : size === 'lg' ? 64 : 52;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none group cursor-pointer ${className}`}>
      <img
        src="/logo.png"
        alt="Core IQ Create"
        width={imgSize}
        height={imgSize}
        className="shrink-0 transition-transform duration-300 group-hover:scale-105 drop-shadow-[0_0_12px_rgba(34,211,238,0.4)]"
        style={{ objectFit: 'contain' }}
      />
      <div className="flex flex-col leading-none">
        <span className="font-bold tracking-tight text-white text-xl font-display">
          Core<span className="text-cyan-300">IQ</span>
        </span>
        <span className="font-semibold tracking-[0.26em] text-cyan-400 uppercase text-[10px] mt-0.5">
          CREATE
        </span>
      </div>
    </div>
  );
};
