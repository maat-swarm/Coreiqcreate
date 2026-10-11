import React from 'react';

/**
 * Editorial inline SVG newsroom / newspaper icon.
 * Sharp, crisp lines, square joins, muted aesthetic.
 */
export const NewsroomIcon: React.FC<{
  className?: string;
  size?: number | string;
  color?: string;
}> = ({ className = 'w-10 h-10', color = '#9aa3b2', size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.75"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
    aria-hidden="true"
  >
    <path d="M3 4h18v16H3V4z" />
    <path d="M6 8h12" />
    <path d="M6 12h6" />
    <path d="M6 16h6" />
    <path d="M14 12h4v4h-4v-4z" />
  </svg>
);

export const ExternalLinkIcon: React.FC<{
  className?: string;
  size?: number | string;
}> = ({ className = 'w-3.5 h-3.5', size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
    aria-hidden="true"
  >
    <path d="M7 17L17 7" />
    <path d="M7 7h10v10" />
  </svg>
);

export const ArrowRightIcon: React.FC<{
  className?: string;
  size?: number | string;
}> = ({ className = 'w-4 h-4', size }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="square"
    strokeLinejoin="miter"
    className={className}
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="M12 5l7 7-7 7" />
  </svg>
);
