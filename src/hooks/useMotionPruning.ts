import { useState, useEffect } from 'react';

export interface MotionPruningState {
  /** True when the operating system or browser requests reduced motion */
  isReducedMotion: boolean;
  /** True when the device is mobile/touch-primary (e.g., Android Chrome on phone/tablet) */
  isMobileDevice: boolean;
  /** True when high-cost requestAnimationFrame animations should be pruned */
  shouldPruneRAF: boolean;
}

// Media query to specifically prune high-cost JS rAF animations on mobile devices or reduced-motion environments
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const MOBILE_PRUNING_QUERY = '(max-width: 820px) and (pointer: coarse), (prefers-reduced-motion: reduce)';

export function useMotionPruning(): MotionPruningState {
  const [state, setState] = useState<MotionPruningState>(() => {
    if (typeof window === 'undefined') {
      return {
        isReducedMotion: false,
        isMobileDevice: false,
        shouldPruneRAF: false,
      };
    }

    const reducedMotionMatch = window.matchMedia(REDUCED_MOTION_QUERY).matches;
    const mobilePruningMatch = window.matchMedia(MOBILE_PRUNING_QUERY).matches;

    return {
      isReducedMotion: reducedMotionMatch,
      isMobileDevice: mobilePruningMatch && !reducedMotionMatch,
      shouldPruneRAF: mobilePruningMatch,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const reducedMotionMQ = window.matchMedia(REDUCED_MOTION_QUERY);
    const mobilePruningMQ = window.matchMedia(MOBILE_PRUNING_QUERY);

    const updateState = () => {
      const reducedMotionMatch = reducedMotionMQ.matches;
      const mobilePruningMatch = mobilePruningMQ.matches;

      setState({
        isReducedMotion: reducedMotionMatch,
        isMobileDevice: mobilePruningMatch && !reducedMotionMatch,
        shouldPruneRAF: mobilePruningMatch,
      });
    };

    updateState();

    try {
      reducedMotionMQ.addEventListener('change', updateState);
      mobilePruningMQ.addEventListener('change', updateState);
    } catch {
      // Fallback for older WebKit / Android WebViews
      reducedMotionMQ.addListener(updateState);
      mobilePruningMQ.addListener(updateState);
    }

    return () => {
      try {
        reducedMotionMQ.removeEventListener('change', updateState);
        mobilePruningMQ.removeEventListener('change', updateState);
      } catch {
        reducedMotionMQ.removeListener(updateState);
        mobilePruningMQ.removeListener(updateState);
      }
    };
  }, []);

  return state;
}
