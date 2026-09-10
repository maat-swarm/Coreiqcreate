import React, { useRef, useEffect } from 'react';

interface Props { onComplete: () => void; }

export function SplashScreen({ onComplete }: Props) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.play().catch(() => {});
    v.onended = onComplete;
  }, [onComplete]);

  return (
    <div
      onClick={onComplete}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#050814', cursor: 'pointer'
      }}
    >
      <video
        ref={ref}
        src="/splash.mp4"
        playsInline
        muted={true}
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain', display: 'block'
        }}
      />
    </div>
  );
}
