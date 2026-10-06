import React from 'react';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export interface ContentPlaceholderProps {
  title?: string;
  category?: string;
  contentKey?: string;
  slug?: string;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | string;
  className?: string;
  onClick?: () => void;
}

/**
 * CoreIQ Content Placeholder component.
 * Uses .coreiq-glass-card styling from index.css with exact dimensions and spacing (h-72)
 * to ensure zero layout shift when real content is swapped in.
 * Copy: "Content being prepared · Blueprint & repo finalizing." — an intentional sovereign queue state.
 */
export const ContentPlaceholder: React.FC<ContentPlaceholderProps> = ({
  title = 'Untitled Topic',
  category = 'Curated Guide',
  contentKey,
  slug,
  level = 'Beginner',
  className = '',
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer p-6 rounded-2xl coreiq-glass-card flex flex-col justify-between h-72 relative border border-cyan-500/15 transition-all duration-300 hover:border-cyan-400/50 hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.7),0_0_24px_rgba(34,211,238,0.15)] ${className}`}
      data-content-key={contentKey}
      data-status="PLACEHOLDER"
      data-slug={slug}
    >
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400/80 border border-cyan-500/25 font-mono">
            {category}
          </span>
          <div className="flex items-center gap-1.5 text-cyan-400/70 text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] tracking-wider uppercase font-semibold">IN PRODUCTION</span>
          </div>
        </div>

        <h3 className="text-white font-bold text-lg mb-2 group-hover:text-cyan-300 transition-colors">
          {title}
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
          Content being prepared · Blueprint, code examples &amp; review finalizing.
        </p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-800/80 text-xs">
        <span className="text-slate-400 font-mono text-[11px] tracking-wider uppercase flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-500/60" />
          <span>Level: <strong className={
            level === 'Beginner' ? 'text-emerald-400 font-semibold' :
            level === 'Advanced' ? 'text-purple-400 font-semibold' :
            'text-cyan-300 font-semibold'
          }>{level}</strong></span>
        </span>
        <div className="flex items-center gap-1.5 text-cyan-400/80 font-medium group-hover:text-cyan-300 group-hover:translate-x-0.5 transition-transform text-xs">
          <span>Read preview</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
