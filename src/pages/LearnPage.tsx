import React, { useState, useEffect, useMemo } from 'react';
import { Play, Download, X, ArrowRight } from 'lucide-react';
import { NavRoute } from '../types';
import { CoreIQSentinel } from '../components/common/CoreIQSentinel';
import { useLearnLessons, LearnLesson } from '../hooks/useLearnLessons';

export interface LearnPageProps {
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

function isDirectVideoFile(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url);
}

interface LessonVideoModalProps {
  lesson: LearnLesson;
  onClose: () => void;
}

const LessonVideoModal: React.FC<LessonVideoModalProps> = ({ lesson, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!lesson.video_url) return null;

  const isDirectVideo = isDirectVideoFile(lesson.video_url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={lesson.title}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl rounded-2xl bg-[#070d1f] border border-cyan-500/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-slate-800">
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 block">
              {lesson.category}
            </span>
            <h3 className="text-base sm:text-lg font-bold text-white font-display truncate">
              {lesson.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close video modal"
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="relative w-full aspect-[16/9] bg-slate-950">
          {isDirectVideo ? (
            <video
              controls
              autoPlay
              playsInline
              preload="metadata"
              poster={lesson.poster_url || undefined}
              className="w-full h-full object-cover"
            >
              <source src={lesson.video_url} />
              <p className="p-4 text-center text-slate-400 text-sm">
                Your browser does not support HTML video playback.
              </p>
            </video>
          ) : (
            <iframe
              src={getEmbedUrl(lesson.video_url)}
              title={lesson.title}
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          )}
        </div>
      </div>
    </div>
  );
};

interface LessonCardProps {
  lesson: LearnLesson;
  onWatch: (lesson: LearnLesson) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, onWatch }) => {
  const hasActions = Boolean(lesson.video_url || lesson.pdf_url);

  return (
    <article className="flex flex-col rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition-colors overflow-hidden">
      {/* Poster Image / Placeholder */}
      <div className="relative w-full aspect-[16/9] bg-slate-950 overflow-hidden">
        {lesson.poster_url ? (
          <img
            src={lesson.poster_url}
            alt={lesson.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-slate-950 flex items-center justify-center px-4 text-center">
            <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
              {lesson.category}
            </span>
          </div>
        )}

        {/* Top-left category tag */}
        <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded bg-slate-950/90 border border-slate-800 text-[11px] font-mono uppercase tracking-wider text-cyan-400">
          {lesson.category}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between gap-4">
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-white font-display leading-snug">
            {lesson.title}
          </h3>
          {lesson.description && (
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-2">
              {lesson.description}
            </p>
          )}
        </div>

        {hasActions && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {lesson.video_url && (
              <button
                type="button"
                onClick={() => onWatch(lesson)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-cyan-500/50 hover:border-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 text-xs sm:text-sm font-semibold transition-colors min-h-[44px] cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Watch</span>
              </button>
            )}

            {lesson.pdf_url && (
              <a
                href={lesson.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-500 bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-medium transition-colors min-h-[44px]"
              >
                <Download className="w-4 h-4 text-slate-300" />
                <span>{lesson.pdf_label || 'Download Guide'}</span>
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
};

export const LearnPage: React.FC<LearnPageProps> = ({ onNavigate, onAsk }) => {
  const { lessons, loading } = useLearnLessons();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeVideoLesson, setActiveVideoLesson] = useState<LearnLesson | null>(null);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(lessons.map((l) => l.category).filter(Boolean))
    );
    return ['All', ...unique];
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    if (selectedCategory === 'All') return lessons;
    return lessons.filter((l) => l.category === selectedCategory);
  }, [lessons, selectedCategory]);

  // Reset selected category if it disappears from data
  useEffect(() => {
    if (selectedCategory !== 'All' && !categories.includes(selectedCategory)) {
      setSelectedCategory('All');
    }
  }, [categories, selectedCategory]);

  return (
    <div className="w-full relative">
      {/* 1. HERO + SHOWCASE */}
      <section className="relative pt-10 pb-8 lg:pt-16 lg:pb-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-8">
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

          <CoreIQSentinel page="learn" onAsk={onAsk} onNavigate={onNavigate} />

          {/* A. CATEGORY FILTER BAR */}
          <div className="flex items-center gap-6 overflow-x-auto no-scrollbar border-b border-slate-800/80 pt-2">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`pb-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors min-h-[44px] cursor-pointer ${
                    isActive
                      ? 'border-cyan-400 text-cyan-300'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* B. LESSON CARD GRID */}
      <section className="pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((idx) => (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden animate-pulse"
              >
                <div className="w-full aspect-[16/9] bg-slate-800/80" />
                <div className="p-6 space-y-3">
                  <div className="h-5 w-3/4 bg-slate-800 rounded" />
                  <div className="h-4 w-full bg-slate-800/70 rounded" />
                  <div className="h-4 w-2/3 bg-slate-800/70 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredLessons.length === 0 ? (
          <div className="rounded-2xl bg-slate-900/40 border border-slate-800/80 py-14 px-6 text-center">
            <p className="text-slate-300 text-base font-medium">
              Lessons coming soon. Check back shortly.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson) => (
              <LessonCard
                key={lesson.id}
                lesson={lesson}
                onWatch={setActiveVideoLesson}
              />
            ))}
          </div>
        )}
      </section>

      {/* C. CTA STRIP */}
      <section className="w-full bg-slate-900/60 border-t border-slate-800 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-lg sm:text-xl font-bold text-white font-display">
            Not sure where to start?
          </p>
          <button
            type="button"
            onClick={() => onAsk('Not sure where to start with learning AI — what do you recommend?')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all min-h-[44px] cursor-pointer shrink-0"
          >
            <span>Ask CoreIQ</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Inline Video Modal */}
      {activeVideoLesson && (
        <LessonVideoModal
          lesson={activeVideoLesson}
          onClose={() => setActiveVideoLesson(null)}
        />
      )}
    </div>
  );
};

export default LearnPage;
