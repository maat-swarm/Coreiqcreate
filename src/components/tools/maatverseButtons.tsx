import React from 'react';

export interface MaatverseButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'chip';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

export const MaatverseButton: React.FC<MaatverseButtonProps> = ({
  variant = 'primary',
  children,
  icon,
  className = '',
  ...props
}) => {
  if (variant === 'chip') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-4 h-9 min-h-[44px] rounded-full text-xs font-semibold text-[#04060e] transition-all duration-150 select-none ${className}`}
        style={{
          background: 'linear-gradient(180deg, #d4af55 0%, #C9A24B 50%, #a9842f 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.4)',
        }}
      >
        <span>{children}</span>
        {icon && <span className="shrink-0">{icon}</span>}
      </div>
    );
  }

  if (variant === 'secondary') {
    return (
      <button
        type="button"
        className={`inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full text-sm font-semibold text-[#e6edff] bg-transparent border border-[rgba(25,217,255,0.6)] hover:brightness-110 active:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19d9ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04050b] transition-all min-h-[44px] min-w-[44px] cursor-pointer ${className}`}
        {...props}
      >
        <span>{children}</span>
        {icon && <span className="shrink-0">{icon}</span>}
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full text-sm font-semibold text-[#04060e] hover:brightness-110 active:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#19d9ff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#04050b] transition-all min-h-[44px] min-w-[44px] cursor-pointer ${className}`}
      style={{
        background: 'linear-gradient(180deg, #d4af55 0%, #C9A24B 50%, #a9842f 100%)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.45)',
      }}
      {...props}
    >
      <span>{children}</span>
      {icon && <span className="shrink-0">{icon}</span>}
    </button>
  );
};

export interface MaatverseDoorProps {
  label: string;
}

export const MaatverseDoor: React.FC<MaatverseDoorProps> = ({ label }) => {
  return (
    <div
      role="group"
      aria-disabled="true"
      className="relative rounded-2xl bg-[#080b18] border border-[rgba(120,160,255,0.25)] min-h-[120px] p-5 flex flex-col justify-between overflow-hidden select-none"
    >
      {/* Single decorative top hairline */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #C9A24B 30%, #C9A24B 70%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Door Title (System serif display stack) */}
      <div className="pt-1">
        <h3
          className="text-lg sm:text-xl font-normal text-white tracking-wide"
          style={{ fontFamily: 'ui-serif, Georgia, "Times New Roman", serif' }}
        >
          {label}
        </h3>
      </div>

      {/* Pill bottom-left */}
      <div className="pt-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium text-[#C9A24B] bg-[#C9A24B]/10 border border-[#C9A24B]/30">
          Opening soon
        </span>
      </div>
    </div>
  );
};
