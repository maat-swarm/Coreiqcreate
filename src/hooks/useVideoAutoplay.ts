import { useEffect, useState, useRef, useCallback } from 'react';

export interface UseVideoAutoplayOptions {
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
  onAutoplayBlocked?: () => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

export function useVideoAutoplay(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  options: UseVideoAutoplayOptions = {}
) {
  const {
    enabled = true,
    threshold = 0.4,
    rootMargin = '200px',
    onAutoplayBlocked,
    onPlayStateChange,
  } = options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;

  const updatePlayingState = useCallback(
    (playing: boolean) => {
      setIsPlaying(playing);
      onPlayStateChange?.(playing);
    },
    [onPlayStateChange]
  );

  const safePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !enabled) return;

    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      video.pause();
      updatePlayingState(false);
      return;
    }

    try {
      video.preload = 'auto';
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            updatePlayingState(true);
          })
          .catch((err) => {
            updatePlayingState(false);
            onAutoplayBlocked?.();
          });
      }
    } catch (err) {
      updatePlayingState(false);
      onAutoplayBlocked?.();
    }
  }, [videoRef, enabled, updatePlayingState, onAutoplayBlocked]);

  const safePause = useCallback(
    (resetTime = false) => {
      const video = videoRef.current;
      if (!video) return;

      try {
        video.pause();
        if (resetTime) {
          video.currentTime = 0;
        }
      } catch {}
      updatePlayingState(false);
    },
    [videoRef, updatePlayingState]
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      safePlay();
    } else {
      safePause(false);
    }
  }, [videoRef, safePlay, safePause]);

  // Observer 1: Near viewport (rootMargin="200px") to lazily upgrade preload="metadata"
  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === 'undefined') return;

    // Ensure initial lazy attribute
    if (video.preload !== 'metadata' && video.preload !== 'auto') {
      video.preload = 'none';
    }

    const nearObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsNearViewport(true);
          if (video.preload === 'none') {
            video.preload = 'metadata';
          }
        } else {
          setIsNearViewport(false);
        }
      },
      { rootMargin }
    );

    nearObserver.observe(video);
    return () => {
      nearObserver.disconnect();
    };
  }, [videoRef, rootMargin]);

  // Observer 2: Active viewport threshold (default 0.4) for visibility-driven play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video || typeof IntersectionObserver === 'undefined') return;

    const playObserver = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);

        if (entry.isIntersecting && enabled) {
          safePlay();
        } else {
          safePause(true);
        }
      },
      { threshold }
    );

    playObserver.observe(video);
    return () => {
      playObserver.disconnect();
    };
  }, [videoRef, enabled, threshold, safePlay, safePause]);

  // React to enabled changes (e.g. carousel slide active state)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!enabled) {
      safePause(true);
    } else if (isIntersecting) {
      safePlay();
    }
  }, [enabled, isIntersecting, safePlay, safePause, videoRef]);

  // Keep video listener synchronized
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => updatePlayingState(true);
    const handlePause = () => updatePlayingState(false);
    const handleEnded = () => {
      updatePlayingState(false);
      video.currentTime = 0;
    };
    const handleError = () => {
      setHasError(true);
      updatePlayingState(false);
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [videoRef, updatePlayingState]);

  return {
    isPlaying,
    isNearViewport,
    isIntersecting,
    hasError,
    setHasError,
    play: safePlay,
    pause: safePause,
    togglePlay,
  };
}
