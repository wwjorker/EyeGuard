import { useEffect, useState } from "react";

interface BirdState {
  id: number;
  direction: "ltr" | "rtl";
  topPct: number;
  durationSec: number;
}

/**
 * A tiny silhouette bird that occasionally crosses the sky. Used inside the
 * break window — feels like nature drifting past while you rest. Flies a
 * random direction at a random altitude, then unmounts. New flight scheduled
 * on a 12–28s interval.
 */
export function Bird() {
  const [bird, setBird] = useState<BirdState | null>(null);

  useEffect(() => {
    let timer: number | null = null;

    const schedule = (delayMs: number) => {
      timer = window.setTimeout(() => {
        const direction: "ltr" | "rtl" = Math.random() < 0.5 ? "ltr" : "rtl";
        const topPct = 8 + Math.random() * 22; // upper sky band
        const durationSec = 7 + Math.random() * 4;
        setBird({ id: Date.now(), direction, topPct, durationSec });
        timer = window.setTimeout(() => {
          setBird(null);
          schedule(12000 + Math.random() * 16000);
        }, durationSec * 1000 + 300);
      }, delayMs);
    };

    schedule(2500 + Math.random() * 4000);
    return () => {
      if (timer != null) window.clearTimeout(timer);
    };
  }, []);

  if (!bird) return null;

  const fromX = bird.direction === "ltr" ? "-12vw" : "112vw";
  const toX = bird.direction === "ltr" ? "112vw" : "-12vw";
  const flip = bird.direction === "rtl" ? "scaleX(-1)" : "scaleX(1)";

  return (
    <div
      key={bird.id}
      style={{
        position: "absolute",
        top: `${bird.topPct}%`,
        left: 0,
        width: 28,
        height: 18,
        pointerEvents: "none",
        zIndex: 2,
        transform: flip,
        animation: `bird-fly-${bird.direction} ${bird.durationSec}s linear forwards`,
      }}
    >
      <svg viewBox="0 0 28 18" width="28" height="18" aria-hidden>
        <g style={{ transformOrigin: "14px 9px", animation: "bird-flap 0.42s ease-in-out infinite" }}>
          <path
            d="M 2 9 Q 8 2 14 9 Q 20 2 26 9"
            fill="none"
            stroke="#5a3a1a"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
      </svg>
      <style>{`
        @keyframes bird-fly-ltr {
          from { transform: translateX(${fromX}) ${flip}; }
          to   { transform: translateX(${toX}) ${flip}; }
        }
        @keyframes bird-fly-rtl {
          from { transform: translateX(${fromX}) ${flip}; }
          to   { transform: translateX(${toX}) ${flip}; }
        }
        @keyframes bird-flap {
          0%, 100% { transform: scaleY(1); }
          50%      { transform: scaleY(0.55); }
        }
      `}</style>
    </div>
  );
}
