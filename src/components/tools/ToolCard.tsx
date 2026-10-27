import React, { useState } from 'react';
import {
  PenLine,
  Image as ImageIcon,
  Code2,
  Briefcase,
  Database,
  Workflow,
  Music,
  Search,
  ArrowRight,
  ExternalLink,
  Download,
  Terminal,
  Layers,
  Sparkles,
} from 'lucide-react';
import { PublicSiteTool } from '../../services/siteTools';
import { NavRoute } from '../../types';

export interface ToolCardProps {
  tool: PublicSiteTool;
  variant?: 'hero' | 'grid';
  heroNumber?: string;
  onNavigate?: (route: NavRoute) => void;
  onSelectTool?: (tool: PublicSiteTool) => void;
}

const CATEGORY_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Writing: PenLine,
  Images: ImageIcon,
  Code: Code2,
  Business: Briefcase,
  Data: Database,
  Automation: Workflow,
  Audio: Music,
  Research: Search,
};

const CATEGORY_GRADIENTS: Record<string, string> = {
  Writing: 'from-cyan-900/60 via-slate-900 to-slate-950',
  Images: 'from-purple-900/60 via-slate-900 to-slate-950',
  Code: 'from-emerald-900/60 via-slate-900 to-slate-950',
  Business: 'from-violet-900/60 via-slate-900 to-slate-950',
  Data: 'from-blue-900/60 via-slate-900 to-slate-950',
  Automation: 'from-teal-900/60 via-slate-900 to-slate-950',
  Audio: 'from-fuchsia-900/60 via-slate-900 to-slate-950',
  Research: 'from-amber-900/60 via-slate-900 to-slate-950',
};

export const ToolCard: React.FC<ToolCardProps> = ({
  tool,
  variant = 'grid',
  heroNumber,
  onNavigate,
  onSelectTool,
}) => {
  const [imageError, setImageError] = useState(false);

  const isComingSoon = tool.launch_type === 'coming_soon';
  const isLive = !isComingSoon;

  const CategoryIcon = CATEGORY_ICONS[tool.category] || Terminal;
  const gradientClass = CATEGORY_GRADIENTS[tool.category] || 'from-slate-900 via-[#070e24] to-slate-950';

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isLive) return;
    if (onSelectTool) {
      onSelectTool(tool);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && isLive) {
      e.preventDefault();
      if (onSelectTool) onSelectTool(tool);
    }
  };

  return (
    <div
      className={`group relative rounded-2xl bg-[#070b1a] border border-slate-800/80 overflow-hidden flex flex-col justify-between h-full transition-all duration-200 ${
        isLive
          ? 'cursor-pointer hover:border-cyan-400/50 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.7),0_0_24px_rgba(25,217,255,0.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070b1a]'
          : 'cursor-default opacity-90'
      }`}
      style={{
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
      }}
      tabIndex={isLive ? 0 : undefined}
      role={isLive ? 'button' : 'article'}
      aria-disabled={!isLive}
      onClick={isLive ? handleClick : undefined}
      onKeyDown={isLive ? handleKeyDown : undefined}
    >
      {/* Top-edge light line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none z-20"
        style={{
          background: isLive
            ? 'linear-gradient(90deg, transparent 0%, rgba(25, 217, 255, 0.4) 50%, transparent 100%)'
            : 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
        }}
        aria-hidden="true"
      />

      {/* Top: Image or Fallback */}
      <div className={`relative w-full ${variant === 'hero' ? 'aspect-video' : 'aspect-[16/10]'} overflow-hidden bg-slate-950`}>
        {tool.image_url && !imageError ? (
          <img
            src={tool.image_url}
            alt={tool.name}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          /* Category fallback panel */
          <div className={`w-full h-full bg-gradient-to-br ${gradientClass} flex flex-col items-center justify-center p-4 relative`}>
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center justify-center shadow-inner">
              <CategoryIcon className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mt-2">
              {tool.category}
            </span>
          </div>
        )}

        {/* Hero Number Overlay top-left */}
        {variant === 'hero' && heroNumber && (
          <div className="absolute top-3 left-3 z-10">
            <span
              className="px-2.5 py-1 rounded-md text-xs sm:text-sm font-mono font-bold text-[#C9A24B] bg-[#04060e]/85 border border-[#C9A24B]/40 shadow-md backdrop-blur-sm"
            >
              {heroNumber}
            </span>
          </div>
        )}

        {/* Badges top-right */}
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 flex-wrap justify-end">
          {tool.is_mock && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40">
              MOCK
            </span>
          )}
          {tool.is_paid && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              {tool.price_amount ? `$${tool.price_amount} ${tool.price_currency}` : 'PAID'}
            </span>
          )}
          <span
            className={`text-[10px] font-mono tracking-wider font-bold px-2 py-0.5 rounded-md uppercase ${
              tool.tier === 'pro'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(25,217,255,0.25)]'
            }`}
          >
            {tool.tier.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-slate-400 uppercase tracking-wider group-hover:text-cyan-300 transition-colors">
              {tool.category}
            </span>
            <div className="flex items-center gap-2">
              {tool.launch_type === 'in_app' && (
                <span className="text-[10px] text-cyan-400 font-mono">Interactive</span>
              )}
              {tool.origin === 'opensource' && (
                <span className="text-[10px] text-emerald-400 font-mono">OSS</span>
              )}
            </div>
          </div>

          <h3 className={`font-bold text-white transition-colors leading-snug ${variant === 'hero' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'} group-hover:text-cyan-300`}>
            {tool.name}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed line-clamp-2">
            {tool.tagline || tool.description}
          </p>
        </div>

        {/* Action Row */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          {isLive ? (
            <>
              <span className="text-cyan-400 font-semibold group-hover:underline flex items-center gap-1.5">
                {tool.cta_label || (tool.launch_type === 'download' ? 'Download' : tool.launch_type === 'in_app' ? 'Use Tool' : 'Open')}
              </span>
              {tool.launch_type === 'download' ? (
                <Download className="w-4 h-4 text-cyan-400 transition-transform group-hover:translate-y-0.5" />
              ) : tool.launch_type === 'in_app' ? (
                <Sparkles className="w-4 h-4 text-cyan-400 transition-transform group-hover:scale-110" />
              ) : (
                <ArrowRight className="w-4 h-4 text-cyan-400 transition-transform group-hover:translate-x-1" />
              )}
            </>
          ) : (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium text-slate-500 bg-slate-900 border border-slate-800">
              Coming soon
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
