import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Clock, 
  Sparkles, 
  ShieldCheck, 
  Layers, 
  ExternalLink,
  Cpu
} from 'lucide-react';
import { NavRoute } from '../types';
import { resolveBySlug, ResolvedContent } from '../services/contentResolver';
import { CosmicCTABanner } from '../components/common/CosmicCTABanner';

interface LearnArticlePageProps {
  slug: string;
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

export const LearnArticlePage: React.FC<LearnArticlePageProps> = ({
  slug,
  onNavigate,
  onAsk,
}) => {
  const [content, setContent] = useState<ResolvedContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    resolveBySlug(slug)
      .then((res) => {
        if (isMounted) {
          setContent(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error loading article:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const title = content?.title || slug.replace(/-/g, ' ').toUpperCase();
  const category = content?.category || 'Curated Guide';
  const status = content?.status || 'PLACEHOLDER';
  const isPublished = status === 'PUBLISHED' && Boolean(content?.body);
  const level = content?.metadata?.level || 'All Levels';
  const readTime = content?.metadata?.readTime || '15 min read';

  return (
    <div className="w-full relative min-h-screen pb-20">
      {/* 1. TOP NAV & BREADCRUMB STRIP */}
      <section className="pt-10 pb-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <button
            onClick={() => onNavigate('learn')}
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back to Knowledge Stream</span>
          </button>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <span>LEARN</span>
            <span>/</span>
            <span>GUIDE</span>
            <span>/</span>
            <span className="text-cyan-400">{slug}</span>
          </div>
        </div>
      </section>

      {/* 2. HERO / HEADER SECTION */}
      <section className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Metadata badges */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              {category}
            </span>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>{readTime}</span>
            </div>

            <span className="text-slate-500 text-xs font-mono">
              Level: {level}
            </span>

            {/* Status indicator */}
            {isPublished ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>PUBLISHED (v{content?.version || 1})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/25">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                <span>STATUS: PLACEHOLDER</span>
              </span>
            )}
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-white font-display leading-[1.15]">
            {title}
          </h1>

          {/* Summary */}
          {content?.summary && (
            <p className="text-slate-300 text-base sm:text-lg lg:text-xl leading-relaxed max-w-3xl">
              {content.summary}
            </p>
          )}
        </div>
      </section>

      {/* 3. CONTENT CONTAINER (REAL OR PLACEHOLDER STATE) */}
      <section className="py-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="p-12 rounded-2xl coreiq-glass-card border border-cyan-500/15 flex items-center justify-center">
            <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm">
              <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <span>Resolving CoreIQ Content Blueprint...</span>
            </div>
          </div>
        ) : isPublished && content?.body ? (
          /* REAL PUBLISHED CONTENT */
          <div className="rounded-3xl bg-slate-900/40 border border-cyan-500/20 p-8 sm:p-12 relative overflow-hidden backdrop-blur-md">
            <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed font-sans space-y-6 text-base sm:text-lg">
              {content.body.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>
        ) : (
          /* SOVEREIGN PLACEHOLDER STATE */
          <div className="rounded-3xl coreiq-glass-card border border-cyan-500/20 p-8 sm:p-12 relative overflow-hidden backdrop-blur-md space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                  CONTENT ARCHITECTURE
                </span>
                <h3 className="text-2xl font-bold text-white font-display">
                  Content being prepared.
                </h3>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-xs font-mono text-cyan-300">
                Awaiting Orchestrator Pipeline
              </div>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              This guide is registered in the CoreIQ content manifest. The research orchestrator
              populates these entries with tested architectural walkthroughs, tool pipelines, and production patterns.
            </p>

            {/* Spec & Blueprint metadata */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Manifest Key</span>
                <div className="text-cyan-300 font-semibold truncate">
                  {content?.content_key || `learn.guide.${slug}`}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Node Status</span>
                <div className="text-amber-400 font-semibold">
                  {status}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                <span className="text-slate-500 text-[10px] uppercase">Route Address</span>
                <div className="text-slate-300 truncate">
                  /learn/{slug}
                </div>
              </div>
            </div>

            {/* Action Callout */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
              <button
                onClick={() => onAsk(`Synthesize an in-depth guide on ${title} for production builders.`)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all duration-200 shadow-[0_0_20px_rgba(6,182,212,0.3)] cursor-pointer"
              >
                <Cpu className="w-4 h-4" />
                <span>Ask CoreIQ to synthesize now</span>
              </button>

              <button
                onClick={() => onNavigate('learn')}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-medium border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
              >
                <span>Browse other topics</span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4. BOTTOM CTA BANNER */}
      <CosmicCTABanner
        eyebrow="INTELLIGENT CREATION"
        headline="Learn it. Build it. Deploy it."
        subtext="Have questions about this architecture? Ask CoreIQ to explain the implementation details."
        inputPlaceholder={`Ask about ${title}...`}
        onAsk={onAsk}
      />
    </div>
  );
};
