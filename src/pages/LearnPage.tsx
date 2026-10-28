import React, { useState } from 'react';
import { 
  Play, 
  Lock, 
  Download, 
  FileText, 
  ExternalLink, 
  Smartphone, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { NavRoute } from '../types';
import { useMediaSlot } from '../services/mediaSlots';
import { getManifestEntry } from '../data/contentManifest';
import { useContent } from '../services/contentResolver';

/**
 * Manifest Key Check Report (against src/data/contentManifest.ts):
 * - Checked for 'learn.step1.title', 'learn.step2.title', 'learn.step3.title':
 *   STATUS: NOT FOUND in CONTENT_MANIFEST.
 *   Action: Rendering clearly marked placeholder text '[Placeholder: Step N Title]', not invented final copy.
 * - Checked for 'learn.app.*' (e.g. 'learn.app.name', 'learn.app.description', 'learn.app.store_url'):
 *   STATUS: NOT FOUND in CONTENT_MANIFEST.
 *   Action: Rendering clearly marked placeholder text '[Placeholder: Learn AI App]' and leaving destination URL empty/disabled.
 * - Autoplay check: Confirmed NO autoplay exists anywhere on this page on initial load.
 *   All video slots use click-to-load facades with user-initiated play triggers.
 */

interface LearnPageProps {
  onNavigate: (route: NavRoute) => void;
  onAsk: (query: string) => void;
}

function getEmbedUrl(rawUrl: string): string {
  try {
    const ytMatch = rawUrl.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
    }
    const vmMatch = rawUrl.match(
      /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/
    );
    if (vmMatch && vmMatch[3]) {
      return `https://player.vimeo.com/video/${vmMatch[3]}?autoplay=1`;
    }
    if (rawUrl.includes('autoplay=1')) return rawUrl;
    return `${rawUrl}${rawUrl.includes('?') ? '&' : '?'}autoplay=1`;
  } catch {}
  return rawUrl;
}

// -----------------------------------------------------------------------------
// 1. LESSON OF THE WEEK CARD (learn.lesson_of_week)
// Click-to-load facade, no autoplay, full-width large media block
// -----------------------------------------------------------------------------
function LessonOfTheWeekCard() {
  const { items } = useMediaSlot('learn.lesson_of_week');
  const [isPlaying, setIsPlaying] = useState(false);

  const published = (items || []).filter((i) => i.published);
  const item = published.length > 0 ? published[0] : null;

  const posterUrl = item?.storage_path || item?.url || '/assets/backgrounds/coreiq-world.webp';
  const posterAlt = item?.alt || 'Lesson of the Week video';
  const title = item?.title || '[Placeholder: Lesson of the Week]';
  const caption = item?.caption || '[Placeholder: Featured practical video lesson on AI architecture and workflows.]';
  const ctaLabel = item?.cta_label;
  const ctaUrl = item?.cta_url;

  return (
    <div className="w-full rounded-3xl bg-slate-900/60 border border-cyan-500/20 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.12)]">
      {/* Video Viewport: Large 16:9 full-width media container */}
      <div className="relative w-full aspect-[16/9] bg-slate-950 overflow-hidden flex items-center justify-center">
        {!isPlaying ? (
          <div className="relative w-full h-full flex items-center justify-center group overflow-hidden">
            <img
              src={posterUrl}
              alt={posterAlt}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Dark gradient overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent pointer-events-none" />

            {/* Click-to-load play trigger — NO AUTOPLAY on initial load */}
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              aria-label="Play Lesson of the Week"
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:scale-110 hover:shadow-[0_0_50px_rgba(6,182,212,0.7)] shadow-[0_0_35px_rgba(6,182,212,0.4)] text-slate-950 flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300 min-h-[44px] min-w-[44px] cursor-pointer"
            >
              <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current text-slate-950 ml-1.5" />
            </button>

            {/* Top-left slot indicator badge */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono tracking-widest text-cyan-300 uppercase">
                LESSON OF THE WEEK
              </span>
            </div>

            {!item && (
              <div className="absolute bottom-4 left-4 z-20 text-xs font-mono text-slate-400 bg-slate-900/80 px-3 py-1 rounded border border-slate-800">
                [Slot: learn.lesson_of_week — click to preview player]
              </div>
            )}
          </div>
        ) : item && item.type === 'url' && item.url ? (
          // Injected only upon user tap
          <iframe
            src={getEmbedUrl(item.url)}
            title={title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : item && item.url ? (
          <video
            controls
            autoPlay
            playsInline
            preload="metadata"
            poster={posterUrl}
            className="w-full h-full object-cover"
          >
            <source src={item.url} type="video/mp4" />
            <p className="p-4 text-center text-slate-400 text-sm">
              Your browser does not support HTML video playback.
            </p>
          </video>
        ) : (
          <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <Play className="w-12 h-12 text-cyan-400 opacity-60" />
            <p className="text-base text-slate-300 font-medium">Video Player Loaded</p>
            <p className="text-xs text-slate-500 font-mono">
              [learn.lesson_of_week slot has no published media URL yet]
            </p>
            <button
              onClick={() => setIsPlaying(false)}
              className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Return to poster facade
            </button>
          </div>
        )}
      </div>

      {/* Lesson Details: Title, Caption, CTA */}
      <div className="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-t border-slate-800/80 bg-slate-950/70">
        <div className="space-y-1.5 max-w-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white font-display">
            {title}
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            {caption}
          </p>
        </div>

        {ctaLabel && ctaUrl && (
          <a
            href={ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all shrink-0 min-h-[44px]"
          >
            <span>{ctaLabel}</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 2. STEP CARD (Step 1, 2, 3)
// Numbered badge, title (manifest/placeholder), video (slot), PDF download (slot, hidden if empty)
// -----------------------------------------------------------------------------
interface StepCardProps {
  stepNumber: number;
  videoSlotKey: string;
  pdfSlotKey: string;
}

function StepCard({ stepNumber, videoSlotKey, pdfSlotKey }: StepCardProps) {
  const { items: videoItems } = useMediaSlot(videoSlotKey);
  const { items: pdfItems } = useMediaSlot(pdfSlotKey);
  const [isPlaying, setIsPlaying] = useState(false);

  // Check dynamic resolved content, falling back to manifest default
  const manifestTitleEntry = getManifestEntry(`learn.step${stepNumber}.title`);
  const { content: dynamicContent } = useContent(`learn.step${stepNumber}.title`);
  const stepTitle =
    dynamicContent?.title ||
    dynamicContent?.body ||
    manifestTitleEntry?.defaultTitle ||
    `[Placeholder: Step ${stepNumber} Title]`;

  const publishedVideos = (videoItems || []).filter((v) => v.published);
  const videoItem = publishedVideos.length > 0 ? publishedVideos[0] : null;

  const publishedPdfs = (pdfItems || []).filter((p) => p.published && (p.url || p.storage_path));
  const pdfItem = publishedPdfs.length > 0 ? publishedPdfs[0] : null;

  const posterUrl = videoItem?.storage_path || videoItem?.url || '/assets/backgrounds/coreiq-world.webp';
  const posterAlt = videoItem?.alt || `Step ${stepNumber} video poster`;

  return (
    <div className="flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition-colors overflow-hidden">
      {/* Top Header: Numbered Badge + Title */}
      <div className="p-5 sm:p-6 pb-4 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-mono font-bold text-lg flex items-center justify-center shrink-0">
          {stepNumber}
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
            STEP {stepNumber}
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-white font-display">
            {stepTitle}
          </h3>
        </div>
      </div>

      {/* Video Player: Click-to-load facade, NO AUTOPLAY */}
      <div className="relative w-full aspect-[16/9] bg-slate-950 overflow-hidden flex items-center justify-center">
        {!isPlaying ? (
          <div className="relative w-full h-full flex items-center justify-center group overflow-hidden">
            <img
              src={posterUrl}
              alt={posterAlt}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

            {/* Click-to-load play trigger */}
            <button
              type="button"
              onClick={() => setIsPlaying(true)}
              aria-label={`Play Step ${stepNumber} Video`}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 w-14 h-14 rounded-full bg-cyan-500/90 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:scale-110 transition-all focus:outline-none focus:ring-2 focus:ring-cyan-300 min-h-[44px] min-w-[44px] cursor-pointer"
            >
              <Play className="w-6 h-6 fill-current text-slate-950 ml-1" />
            </button>

            {!videoItem && (
              <div className="absolute bottom-3 left-3 z-10 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                [Slot: {videoSlotKey}]
              </div>
            )}
          </div>
        ) : videoItem && videoItem.type === 'url' && videoItem.url ? (
          <iframe
            src={getEmbedUrl(videoItem.url)}
            title={`Step ${stepNumber} video`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : videoItem && videoItem.url ? (
          <video
            controls
            autoPlay
            playsInline
            preload="metadata"
            poster={posterUrl}
            className="w-full h-full object-cover"
          >
            <source src={videoItem.url} type="video/mp4" />
            <p className="p-4 text-center text-slate-400 text-sm">
              Your browser does not support HTML video playback.
            </p>
          </video>
        ) : (
          <div className="p-6 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
            <Play className="w-8 h-8 text-cyan-400 opacity-60" />
            <p className="text-xs text-slate-400 font-mono">
              [No published media in {videoSlotKey}]
            </p>
            <button
              onClick={() => setIsPlaying(false)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Return to facade
            </button>
          </div>
        )}
      </div>

      {/* PDF Download Button: Hidden completely if slot is empty (no dead link!) */}
      {pdfItem && (pdfItem.url || pdfItem.storage_path) && (
        <div className="p-4 sm:p-5 pt-3 border-t border-slate-800/80 bg-slate-950/40">
          <a
            href={pdfItem.url || pdfItem.storage_path || '#'}
            target="_blank"
            rel="noopener noreferrer"
            download
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-cyan-500/40 hover:border-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs sm:text-sm font-medium transition-all duration-200 cursor-pointer min-h-[44px]"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download PDF Guide</span>
            {pdfItem.title && (
              <span className="text-slate-400 text-xs truncate max-w-[120px]">
                ({pdfItem.title})
              </span>
            )}
          </a>
        </div>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// 3. LEARN AI APP PROMO CARD
// Bound to manifest key if exists (learn.app.*), else clearly marked placeholder copy.
// Store destination disabled/empty (no fabricated URLs).
// -----------------------------------------------------------------------------
function LearnAppPromoCard() {
  const appNameEntry = getManifestEntry('learn.app.name');
  const appDescEntry = getManifestEntry('learn.app.description');
  const { content: nameContent } = useContent('learn.app.name');
  const { content: descContent } = useContent('learn.app.description');

  const appName =
    nameContent?.title ||
    nameContent?.body ||
    appNameEntry?.defaultTitle ||
    '[Placeholder: Learn AI App]';
  const appDescription =
    descContent?.summary ||
    descContent?.body ||
    descContent?.title ||
    appDescEntry?.defaultSummary ||
    '[Placeholder: Companion mobile app for on-the-go lessons, flash scenarios, and workflow exercises.]';

  return (
    <div className="w-full rounded-2xl bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-950 border border-slate-800 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div className="flex items-start gap-4 max-w-xl">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/30 flex items-center justify-center text-cyan-400 shrink-0">
          <Smartphone className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono tracking-widest text-cyan-400 uppercase">
              MOBILE COMPANION
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              Coming Soon
            </span>
          </div>
          <h3 className="text-xl font-bold text-white font-display">
            {appName}
          </h3>
          <p className="text-sm text-slate-400 leading-relaxed">
            {appDescription}
          </p>
        </div>
      </div>

      {/* App Store badge button — destination disabled until a real link exists */}
      <div className="shrink-0">
        <button
          type="button"
          disabled
          aria-disabled="true"
          className="inline-flex items-center gap-3 px-5 py-3 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-400 text-xs sm:text-sm font-medium cursor-not-allowed opacity-75 min-h-[44px]"
        >
          <Smartphone className="w-4 h-4 text-slate-400" />
          <div className="text-left">
            <div className="text-[10px] uppercase text-slate-400">Download on</div>
            <div className="font-semibold text-slate-300">App Store & Google Play</div>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 ml-1">
            [Link not yet active]
          </span>
        </button>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// 4. INTERMEDIATE & ADVANCED LOCKED SECTION
// Visually locked cards, "Unlock with [Plan]" label, clearly marked not functional
// -----------------------------------------------------------------------------
function LockedCurriculumSection() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <span className="text-xs font-mono tracking-[0.25em] text-slate-500 uppercase">
          ADVANCED TIERS
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
          Deepen your expertise
        </h2>
        <p className="text-sm text-slate-400">
          Structured tracks beyond foundational knowledge. Locked until subsequent releases.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Intermediate Card */}
        <div className="relative rounded-2xl bg-slate-900/30 border border-slate-800/80 p-6 sm:p-8 flex flex-col justify-between opacity-60">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">
                TIER 02
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-xs">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Locked</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-300 font-display">
                Intermediate AI Systems
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Autonomous task chaining, vector retrieval architectures, and deterministic tool synthesis.
              </p>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
            {/* Exact requested label: "Unlock with [Plan]" */}
            <span className="text-xs font-mono text-slate-400">
              Unlock with [Plan]
            </span>
            <span className="text-xs font-mono text-cyan-400/80">
              [Not yet functional]
            </span>
          </div>
        </div>

        {/* Advanced Card */}
        <div className="relative rounded-2xl bg-slate-900/30 border border-slate-800/80 p-6 sm:p-8 flex flex-col justify-between opacity-60">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">
                TIER 03
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-400 text-xs">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Locked</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-bold text-slate-300 font-display">
                Advanced Swarm Orchestration
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Decentralized multi-agent consensus, self-healing code synthesis, and multi-model routing.
              </p>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800/80 flex items-center justify-between">
            {/* Exact requested label: "Unlock with [Plan]" */}
            <span className="text-xs font-mono text-slate-400">
              Unlock with [Plan]
            </span>
            <span className="text-xs font-mono text-cyan-400/80">
              [Not yet functional]
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// MAIN LEARN PAGE COMPONENT
// -----------------------------------------------------------------------------
export const LearnPage: React.FC<LearnPageProps> = ({ onNavigate, onAsk }) => {
  const [lockedTooltip, setLockedTooltip] = useState<string | null>(null);

  const handleLockedClick = (tier: string) => {
    setLockedTooltip(tier);
    setTimeout(() => {
      setLockedTooltip((current) => (current === tier ? null : current));
    }, 2500);
  };

  return (
    <div className="w-full relative pb-20">
      {/* 1. HERO SECTION */}
      <section className="relative pt-10 pb-8 lg:pt-16 lg:pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
          <div className="space-y-3">
            <span className="text-xs font-mono tracking-[0.3em] text-cyan-400 uppercase block">
              EDUCATION & CURRICULUM
            </span>
            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight text-white font-display">
              Learn AI
            </h1>
            <p className="text-slate-300 text-base sm:text-lg lg:text-xl max-w-2xl leading-relaxed">
              Practical video lessons, step-by-step guides, and workflows for artificial intelligence.
            </p>
          </div>

          {/* Three Tier Pills: Beginner (active), Intermediate (locked), Advanced (locked) */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Beginner Pill (active/selected) */}
            <button
              type="button"
              className="px-5 py-2 rounded-full text-xs sm:text-sm font-semibold bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.5)] cursor-pointer min-h-[44px]"
            >
              Beginner
            </button>

            {/* Intermediate Pill (locked, disabled with "Coming soon" tooltip) */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => handleLockedClick('Intermediate')}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs sm:text-sm font-medium bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700 transition-colors cursor-pointer min-h-[44px]"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Intermediate</span>
              </button>
              {lockedTooltip === 'Intermediate' && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs shadow-xl whitespace-nowrap z-30 animate-fade-in">
                  Coming soon
                </div>
              )}
            </div>

            {/* Advanced Pill (locked, disabled with "Coming soon" tooltip) */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => handleLockedClick('Advanced')}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-xs sm:text-sm font-medium bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700 transition-colors cursor-pointer min-h-[44px]"
              >
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                <span>Advanced</span>
              </button>
              {lockedTooltip === 'Advanced' && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 rounded-md bg-slate-900 border border-cyan-500/40 text-cyan-300 text-xs shadow-xl whitespace-nowrap z-30 animate-fade-in">
                  Coming soon
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 2. LESSON OF THE WEEK SECTION */}
      <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LessonOfTheWeekCard />
      </section>

      {/* 3. THREE STEP CARDS IN SEQUENCE */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-mono tracking-[0.25em] text-cyan-400 uppercase">
            FOUNDATIONAL SEQUENCE
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white font-display">
            Three steps to practical AI execution
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StepCard
            stepNumber={1}
            videoSlotKey="learn.step1.video"
            pdfSlotKey="learn.step1.pdf"
          />
          <StepCard
            stepNumber={2}
            videoSlotKey="learn.step2.video"
            pdfSlotKey="learn.step2.pdf"
          />
          <StepCard
            stepNumber={3}
            videoSlotKey="learn.step3.video"
            pdfSlotKey="learn.step3.pdf"
          />
        </div>
      </section>

      {/* 4. LEARN AI APP PROMO CARD */}
      <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LearnAppPromoCard />
      </section>

      {/* 5. INTERMEDIATE / ADVANCED LOCKED SECTION */}
      <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <LockedCurriculumSection />
      </section>
    </div>
  );
};

export default LearnPage;
