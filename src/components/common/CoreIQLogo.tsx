import React from 'react';

interface CoreIQLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const CoreIQLogo: React.FC<CoreIQLogoProps> = ({ size = 'md', className = '' }) => {
  const imgSize = size === 'sm' ? 32 : size === 'lg' ? 52 : 40;
  const textSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-2xl' : 'text-xl';
  const subSize = size === 'sm' ? 'text-[9px]' : size === 'lg' ? 'text-[11px]' : 'text-[10px]';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none group cursor-pointer ${className}`}>
      <img
        src="/logo.png"
        alt="Core IQ Create"
        width={imgSize}
        height={imgSize}
        className="shrink-0 transition-transform duration-300 group-hover:scale-105"
        style={{ objectFit: 'contain' }}
      />
      <div className="flex flex-col leading-none">
        <span className={`font-bold tracking-tight text-white ${textSize} font-display`}>
          Core<span className="text-cyan-300">IQ</span>
        </span>
        <span className={`font-semibold tracking-[0.26em] text-cyan-400 uppercase ${subSize} mt-0.5`}>
          CREATE
        </span>
      </div>
    </div>
  );
};
