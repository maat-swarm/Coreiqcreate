import React from 'react';
import { ASSETS } from '../../assets/images';

interface ImageBackgroundProps {
  isReducedMotion: boolean;
  mousePos: { x: number; y: number };
  scrollProgress: number;
  customPosterUrl?: string | null;
}

export const ImageBackground: React.FC<ImageBackgroundProps> = ({
  isReducedMotion,
  mousePos,
  scrollProgress,
  customPosterUrl,
}) => {
  // Delicate camera pan based on mouse coordinates (-0.5 to 0.5)
  const panX = isReducedMotion ? 0 : mousePos.x * 12;
  const panY = isReducedMotion ? 0 : mousePos.y * 8;
  const scrollY = isReducedMotion ? 0 : scrollProgress * 30;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 
        High Definition Master World Artwork
        Responsive Object Positioning:
        - Desktop: centered with slight bias right (72% 50%) so the mascot is visible on the right while left is celestial dark space
        - Mobile: cropped at 78% 40% so the mascot figure & waterfall remain visible while top is protected for typography
      */}
      <div
        className="absolute inset-[-4%] w-[108%] h-[108%] pointer-events-none transition-transform duration-1000 ease-out will-change-transform"
        style={{
          transform: `translate3d(${panX}px, ${panY - scrollY}px, 0) scale(${isReducedMotion ? 1 : 1.02})`,
        }}
      >
        {customPosterUrl ? (
          <img
            src={customPosterUrl}
            alt="Core IQ Living World"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-[75%_45%] sm:object-[70%_48%] lg:object-[68%_50%] transition-opacity duration-1000"
            style={{
              filter: 'brightness(0.92) contrast(1.08) saturate(1.12)',
            }}
          />
        ) : (
          <picture>
            <source srcSet="/assets/backgrounds/coreiq-world.webp" type="image/webp" />
            <img
              src={ASSETS.worldArt || '/assets/backgrounds/coreiq-world.jpg'}
              alt="Core IQ Living World"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover object-[75%_45%] sm:object-[70%_48%] lg:object-[68%_50%] transition-opacity duration-1000"
              style={{
                filter: 'brightness(0.92) contrast(1.08) saturate(1.12)',
              }}
            />
          </picture>
        )}
      </div>

      {/* Atmospheric color grade overlay that connects the world seamlessly with the Core IQ midnight theme */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(3, 7, 18, 0.20) 0%, rgba(3, 7, 18, 0.05) 40%, rgba(3, 7, 18, 0.45) 85%, #030712 100%)',
        }}
      />
    </div>
  );
};
