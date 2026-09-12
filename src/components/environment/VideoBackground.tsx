import React, { useRef, useState, useEffect } from 'react';
import { ImageBackground } from './ImageBackground';

interface VideoBackgroundProps {
  isReducedMotion: boolean;
  mousePos: { x: number; y: number };
  scrollProgress: number;
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  isReducedMotion,
  mousePos,
  scrollProgress,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  useEffect(() => {
    if (isReducedMotion) {
      if (videoRef.current) videoRef.current.pause();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // Check visibility to save battery/resources when tab is inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
      } else {
        video.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setVideoLoaded(true);
        })
        .catch(() => {
          // Autoplay was prevented or video format not supported in this client
          // Gracefully fallback to ImageBackground
          setVideoFailed(true);
        });
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isReducedMotion]);

  // If video failed or user prefers reduced motion, render image background
  if (videoFailed || isReducedMotion) {
    return (
      <ImageBackground
        isReducedMotion={isReducedMotion}
        mousePos={mousePos}
        scrollProgress={scrollProgress}
      />
    );
  }

  // Slight parallax offset
  const panX = mousePos.x * 12;
  const panY = mousePos.y * 8;
  const scrollY = scrollProgress * 30;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* Fallback Image layer (underneath, visible until video renders or if video loading) */}
      <ImageBackground
        isReducedMotion={isReducedMotion}
        mousePos={mousePos}
        scrollProgress={scrollProgress}
      />

      {/* Primary Video layer */}
      <div
        className={`absolute inset-[-4%] w-[108%] h-[108%] pointer-events-none transition-opacity duration-1000 ${
          videoLoaded ? 'opacity-85' : 'opacity-0'
        }`}
        style={{
          transform: `translate3d(${panX}px, ${panY - scrollY}px, 0) scale(1.02)`,
          transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 1s ease',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="/assets/backgrounds/coreiq-world.jpg"
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoFailed(true)}
          className="w-full h-full object-cover object-[75%_45%] sm:object-[70%_48%] lg:object-[68%_50%]"
          style={{
            filter: 'brightness(0.95) contrast(1.05) saturate(1.1)',
          }}
        >
          <source src="/assets/backgrounds/coreiq-world.mp4" type="video/mp4" />
          <source src="/hero-bg-clean.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Atmospheric depth overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(3, 7, 18, 0.35) 0%, rgba(3, 7, 18, 0.15) 40%, rgba(3, 7, 18, 0.55) 85%, #030712 100%)',
          mixBlendMode: 'multiply',
        }}
      />
    </div>
  );
};
