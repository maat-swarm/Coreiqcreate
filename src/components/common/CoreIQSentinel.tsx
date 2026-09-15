import { useEffect, useRef, useState } from "react";

type SentinelState = "idle" | "listening" | "processing" | "ready";

interface CoreIQSentinelProps {
  state?: SentinelState;
}

const PARTICLES = [
  { x: 18, y: 32, delay: "0s" },
  { x: 82, y: 27, delay: "1.2s" },
  { x: 12, y: 68, delay: "2.1s" },
  { x: 88, y: 65, delay: "0.7s" },
  { x: 28, y: 15, delay: "1.8s" },
  { x: 72, y: 84, delay: "2.8s" },
  { x: 52, y: 8, delay: "1s" },
  { x: 48, y: 91, delay: "2.4s" },
];

export default function CoreIQSentinel({
  state = "idle",
}: CoreIQSentinelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const handlePointerMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();

      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;

      setPointer({
        x: Math.max(-1, Math.min(1, x)),
        y: Math.max(-1, Math.min(1, y)),
      });
    };

    const handlePointerLeave = () => {
      setPointer({ x: 0, y: 0 });
    };

    element.addEventListener("pointermove", handlePointerMove);
    element.addEventListener("pointerleave", handlePointerLeave);

    return () => {
      element.removeEventListener("pointermove", handlePointerMove);
      element.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, []);

  const intensity =
    state === "listening"
      ? "sentinel-listening"
      : state === "processing"
        ? "sentinel-processing"
        : state === "ready"
          ? "sentinel-ready"
          : "sentinel-idle";

  return (
    <div
      ref={containerRef}
      className={`coreiq-sentinel ${intensity}`}
      style={
        {
          "--pointer-x": pointer.x,
          "--pointer-y": pointer.y,
        } as React.CSSProperties
      }
      aria-label={`CoreIQ Sentinel ${state}`}
    >
      {/* Ambient energy field */}
      <div className="sentinel-ambient" />

      {/* SVG signal network */}
      <svg
        className="sentinel-signals"
        viewBox="0 0 500 500"
        fill="none"
        aria-hidden="true"
      >
        <path
          className="sentinel-signal signal-one"
          d="M20 245 C120 180 155 275 250 235 C340 198 390 285 480 220"
        />
        <path
          className="sentinel-signal signal-two"
          d="M45 330 C130 390 180 275 250 305 C330 340 375 245 455 290"
        />
        <path
          className="sentinel-signal signal-three"
          d="M105 85 C170 145 205 110 250 145 C305 185 350 115 405 155"
        />
      </svg>

      {/* Concentric energy rings */}
      <div className="sentinel-ring sentinel-ring-one" />
      <div className="sentinel-ring sentinel-ring-two" />
      <div className="sentinel-ring sentinel-ring-three" />

      {/* Floating energy particles */}
      <div className="sentinel-particles" aria-hidden="true">
        {PARTICLES.map((particle, index) => (
          <span
            key={index}
            className="sentinel-particle"
            style={
              {
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                animationDelay: particle.delay,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Sentinel character */}
      <div className="sentinel-character">
        <img
          src="/mascot.png"
          alt="CoreIQ Sentinel"
          draggable={false}
        />
      </div>

      {/* Core pulse */}
      <div className="sentinel-core">
        <span />
      </div>

      {/* Small telemetry label */}
      <div className="sentinel-telemetry">
        <span className="sentinel-status-dot" />
        <span>COREIQ SENTINEL</span>
        <span className="sentinel-divider">//</span>
        <span>{state.toUpperCase()}</span>
      </div>
    </div>
  );
}
