import React from 'react';
import { ASSETS } from '../../assets/images';
import { AskCoreIQBar } from './AskCoreIQBar';

interface CosmicCTABannerProps {
  eyebrow?: string;
  headline: string;
  highlightWord?: string;
  subtext: string;
  inputPlaceholder?: string;
  onAsk: (query: string) => void;
  className?: string;
}

export const CosmicCTABanner: React.FC<CosmicCTABannerProps> = ({
  eyebrow = 'HAVE SOMETHING SPECIFIC IN MIND?',
  headline = "Let's build it.",
  highlightWord,
  subtext = "Tell Core IQ what you need and we'll help you find the right tool, or create something custom.",
  inputPlaceholder = "Ask Core IQ anything...",
  onAsk,
  className = '',
}) => {
  return (
    <section className={`relative w-full overflow-hidden py-24 sm:py-28 lg:py-32 ${className}`}>
      {/* Background Cosmic Horizon Graphic */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <img
          src={ASSETS.cosmicHorizon}
          alt="Cosmic Horizon"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-40 mix-blend-screen scale-105 animate-pulse-glow"
        />
        {/* Soft edge gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-transparent to-[#020617]" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#020617] via-transparent to-[#020617]" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#020617] to-transparent" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10 lg:gap-16">
          {/* Left Text */}
          <div className="max-w-xl space-y-4">
            {eyebrow && (
              <span className="text-[11px] sm:text-xs font-semibold tracking-[0.2em] text-cyan-400 uppercase">
                {eyebrow}
              </span>
            )}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-display leading-[1.1]">
              {highlightWord ? (
                <>
                  {headline.replace(highlightWord, '')}
                  <span className="gradient-text-phoenix">{highlightWord}</span>
                </>
              ) : (
                headline
              )}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              {subtext}
            </p>
          </div>

          {/* Right Input Bar */}
          <div className="w-full lg:w-auto lg:min-w-[440px] shrink-0">
            <AskCoreIQBar
              placeholder={inputPlaceholder}
              onAsk={onAsk}
              size="large"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
