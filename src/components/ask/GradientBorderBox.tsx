import React, { CSSProperties } from 'react';

export interface GradientBorderBoxProps {
  children: React.ReactNode;
  radius?: number;
  fast?: boolean;
  className?: string;
  style?: CSSProperties;
}

export const GradientBorderBox = React.memo(function GradientBorderBox({
  children,
  radius = 18,
  fast = false,
  className = '',
  style = {},
}: GradientBorderBoxProps) {
  return (
    <div
      className={`gradient-border-box ${fast ? 'gradient-border-box-fast' : ''} ${className}`.trim()}
      style={{ borderRadius: radius, ...style }}
    >
      <div
        style={{
          background: '#0c0c0c',
          borderRadius: radius,
          position: 'relative',
          zIndex: 0,
          height: '100%',
        }}
      >
        {children}
      </div>
    </div>
  );
});

export default GradientBorderBox;
