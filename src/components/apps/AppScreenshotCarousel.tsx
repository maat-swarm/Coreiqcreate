import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

interface AppScreenshotCarouselProps {
  screenshots: string[];
  appTitle: string;
  fallbackIconUrl?: string | null;
  accentColor?: string;
}

export const AppScreenshotCarousel: React.FC<AppScreenshotCarouselProps> = ({
  screenshots,
  appTitle,
  fallbackIconUrl,
  accentColor = '#06b6d4'
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const images = screenshots && screenshots.length > 0 ? screenshots : [];

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Touch gesture handling
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > 45;
    const isRightSwipe = distance < -45;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev]);

  if (images.length === 0) {
    return (
      <div className="w-full aspect-video rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 flex items-center justify-center p-8 relative overflow-hidden shadow-2xl">
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, ${accentColor} 0%, transparent 70%)`,
          }}
        />
        <div className="flex flex-col items-center gap-3 relative z-10 text-center">
          {fallbackIconUrl ? (
            <img src={fallbackIconUrl} alt="" className="w-20 h-20 rounded-2xl object-cover border border-slate-700 shadow-xl" />
          ) : (
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center border"
              style={{
                backgroundColor: `${accentColor}20`,
                borderColor: `${accentColor}40`,
              }}
            >
              <Sparkles className="w-10 h-10" style={{ color: accentColor }} />
            </div>
          )}
          <span className="text-sm font-mono text-slate-400">{appTitle} Preview Screen</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-slate-800/80 shadow-[0_20px_50px_rgba(0,0,0,0.8)] group select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Current Screenshot */}
      <img
        src={images[currentIndex]}
        alt={`${appTitle} preview ${currentIndex + 1}`}
        loading="lazy"
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Navigation Buttons (visible when > 1 image) */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700/60 backdrop-blur-md opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg"
            title="Previous preview"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-950/70 hover:bg-slate-900 text-white border border-slate-700/60 backdrop-blur-md opacity-80 sm:opacity-0 group-hover:opacity-100 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shadow-lg"
            title="Next preview"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots Indicator */}
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrentIndex(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all rounded-full min-h-[32px] min-w-[32px] flex items-center justify-center`}
              >
                <span
                  className={`block rounded-full transition-all ${
                    currentIndex === i ? 'w-5 h-2 bg-cyan-400' : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                  }`}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
