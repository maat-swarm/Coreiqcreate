import React, { useRef, useEffect, useState } from 'react';

interface Props { onComplete: () => void; }

export function SplashScreen({ onComplete }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [exiting, setExiting] = useState(false);
  const finishedRef = useRef(false);

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setExiting(true);
    setTimeout(() => {
      onComplete();
    }, 400);
  };

  useEffect(() => {
    const v = ref.current;
    // Safety net: if video never loads/plays, don't strand the user
    const fallback = setTimeout(finish, 12000);

    if (!v) return () => clearTimeout(fallback);
    v.muted = true;
    v.defaultMuted = true;
    v.playsInline = true;
    v.setAttribute('playsinline', '');
    v.setAttribute('webkit-playsinline', '');
    v.setAttribute('muted', '');

    v.play().catch(() => finish());
    v.onended = () => { clearTimeout(fallback); finish(); };
    v.onerror = () => { clearTimeout(fallback); finish(); };

    return () => clearTimeout(fallback);
  }, []);

  return (
    <div
      onClick={finish}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: '#050814', cursor: 'pointer',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 0.4s ease',
      }}
    >
      <video
        ref={ref}
        src="/splash.mp4"
        playsInline
        muted
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div style={{
        position: 'absolute', bottom: 24, left: 0, right: 0,
        textAlign: 'center', color: 'rgba(245,247,255,0.4)',
        fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase',
        fontFamily: 'monospace', pointerEvents: 'none',
      }}>
        Tap to skip
      </div>
    </div>
  );
}
