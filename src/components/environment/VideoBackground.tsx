import React, { useRef, useState, useEffect } from 'react';
import { ImageBackground } from './ImageBackground';
import { useMediaSlot } from '../../services/mediaSlots';

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

  // Switchable Site Background Media Slots
  const { items: bgVideoItems } = useMediaSlot('site.background');
  const { items: bgPosterItems } = useMediaSlot('site.background_poster');

  const publishedVideos = (bgVideoItems || []).filter((v) => v.published);
  const publishedPosters = (bgPosterItems || []).filter((p) => p.published);

  const customVideoUrl = publishedVideos.length > 0 && publishedVideos[0].url ? publishedVideos[0].url : null;
  const customPosterUrl = publishedPosters.length > 0 && publishedPosters[0].url ? publishedPosters[0].url : null;
  const effectivePoster = customPosterUrl || '/assets/backgrounds/coreiq-world.webp';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isReducedMotion) {
      video.pause();
      return;
    }

    // Android & Mobile WebKit autoplay requirements
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.setAttribute('muted', '');

    const tryPlay = () => {
      if (!video) return;
      video.muted = true;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setVideoLoaded(true);
          })
          .catch(() => {
            // Android may restrict autoplay until the user interacts with the screen
            const onUserGesture = () => {
              if (videoRef.current) {
                videoRef.current.muted = true;
                videoRef.current
                  .play()
                  .then(() => setVideoLoaded(true))
                  .catch(() => {});
              }
              window.removeEventListener('touchstart', onUserGesture);
              window.removeEventListener('pointerdown', onUserGesture);
              window.removeEventListener('scroll', onUserGesture);
              window.removeEventListener('click', onUserGesture);
            };

            window.addEventListener('touchstart', onUserGesture, { passive: true, once: true });
            window.addEventListener('pointerdown', onUserGesture, { passive: true, once: true });
            window.addEventListener('scroll', onUserGesture, { passive: true, once: true });
            window.addEventListener('click', onUserGesture, { passive: true, once: true });
          });
      }
    };

    tryPlay();

    // Check visibility to save battery/resources when tab is inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        video.pause();
      } else {
        tryPlay();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isReducedMotion, customVideoUrl]);

  // If user prefers reduced motion, render static image background
  if (isReducedMotion) {
    return (
      <ImageBackground
        isReducedMotion={isReducedMotion}
        mousePos={mousePos}
        scrollProgress={scrollProgress}
        customPosterUrl={customPosterUrl}
      />
    );
  }

  // Delicate parallax offset
  const panX = mousePos.x * 12;
  const panY = mousePos.y * 8;
  const scrollY = scrollProgress * 30;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* Fallback Image layer (underneath, visible immediately on mount) */}
      <ImageBackground
        isReducedMotion={isReducedMotion}
        mousePos={mousePos}
        scrollProgress={scrollProgress}
        customPosterUrl={customPosterUrl}
      />

      {/* Primary Video layer */}
      <div
        className={`absolute inset-[-4%] w-[108%] h-[108%] pointer-events-none transition-opacity duration-1000 ${
          videoLoaded ? 'opacity-90' : 'opacity-0'
        }`}
        style={{
          transform: `translate3d(${panX}px, ${panY - scrollY}px, 0) scale(1.02)`,
          transition: 'transform 0.8s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease',
        }}
      >
        <video
          key={customVideoUrl || 'default-bg-video'}
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster={effectivePoster}
          onPlaying={() => setVideoLoaded(true)}
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoLoaded(false)}
          className="w-full h-full object-cover object-[75%_45%] sm:object-[70%_48%] lg:object-[68%_50%]"
          style={{
            filter: 'brightness(0.96) contrast(1.06) saturate(1.12)',
          }}
        >
          {customVideoUrl ? (
            <>
              <source src={customVideoUrl} type={customVideoUrl.endsWith('.webm') ? 'video/webm' : 'video/mp4'} />
              <source src={customVideoUrl} />
            </>
          ) : (
            <>
              <source src="/assets/backgrounds/coreiq-world.mp4" type="video/mp4" />
              <source src="/hero-bg-clean.mp4" type="video/mp4" />
            </>
          )}
        </video>
      </div>

      {/* Atmospheric depth overlay - lightened for vibrant color pass-through on Android */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(3, 7, 18, 0.20) 0%, rgba(3, 7, 18, 0.05) 40%, rgba(3, 7, 18, 0.45) 85%, #030712 100%)',
        }}
      />
    </div>
  );
};
