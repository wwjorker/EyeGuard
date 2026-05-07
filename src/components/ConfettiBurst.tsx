import { useEffect, useState } from "react";
import { useCelebrationStore } from "../hooks/useAlertOrchestrator";

const COLORS = [
  "var(--eg-green)",
  "var(--eg-purple)",
  "var(--eg-amber)",
  "var(--eg-pink)",
];

interface Particle {
  id: number;
  left: number; // 0..100 (vw of the main frame)
  delay: number; // ms
  duration: number; // ms
  drift: number; // px horizontal drift
  rotate: number; // deg
  scale: number;
  color: string;
}

function rng(seed: number): () => number {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function makeParticles(seed: number, count: number): Particle[] {
  const r = rng(seed);
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: r() * 100,
    delay: r() * 250,
    duration: 1200 + r() * 900,
    drift: (r() - 0.5) * 80,
    rotate: (r() - 0.5) * 720,
    scale: 0.7 + r() * 0.7,
    color: COLORS[Math.floor(r() * COLORS.length)],
  }));
}

/**
 * Brief celebratory confetti burst over the main app frame. Subscribes
 * to the celebration store; each fire() call increments a token, which
 * forces this component to remount with a fresh particle layout.
 */
export function ConfettiBurst() {
  const token = useCelebrationStore((s) => s.token);
  const [active, setActive] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (token === 0) return;
    setParticles(makeParticles(token, 28));
    setActive(true);
    const id = window.setTimeout(() => setActive(false), 2200);
    return () => window.clearTimeout(id);
  }, [token]);

  if (!active) return null;

  return (
    <div className="confetti-root" aria-hidden>
      {particles.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={
            {
              left: `${p.left}%`,
              background: p.color,
              ["--drift" as string]: `${p.drift}px`,
              ["--rotate" as string]: `${p.rotate}deg`,
              ["--scale" as string]: p.scale,
              animationDelay: `${p.delay}ms`,
              animationDuration: `${p.duration}ms`,
            } as React.CSSProperties
          }
        />
      ))}
      <Butterfly token={token} />
    </div>
  );
}

/**
 * A single butterfly that loops a curved path across the frame whenever
 * a celebration fires. Visits for ~3.4s then fades out — a softer twin
 * to the confetti burst.
 */
function Butterfly({ token }: { token: number }) {
  const r = rng(token + 17);
  const startTop = 35 + r() * 25;
  const endTop = 25 + r() * 35;
  const direction = r() < 0.5 ? "ltr" : "rtl";
  const fromX = direction === "ltr" ? -10 : 110;
  const toX = direction === "ltr" ? 110 : -10;
  return (
    <div
      className="butterfly-visit"
      style={
        {
          ["--bf-from-x" as string]: `${fromX}vw`,
          ["--bf-to-x" as string]: `${toX}vw`,
          ["--bf-from-top" as string]: `${startTop}%`,
          ["--bf-to-top" as string]: `${endTop}%`,
          transform: direction === "rtl" ? "scaleX(-1)" : undefined,
        } as React.CSSProperties
      }
      aria-hidden
    >
      <svg viewBox="0 0 36 28" width="36" height="28">
        <g style={{ transformOrigin: "18px 14px", animation: "butterfly-flap 0.28s ease-in-out infinite" }}>
          <path
            d="M18 14 Q 8 4 3 10 Q 1 16 8 18 Q 14 18 18 14 Z"
            fill="var(--eg-pink)"
            opacity="0.85"
            stroke="#7a3a55"
            strokeWidth="0.6"
          />
          <path
            d="M18 14 Q 28 4 33 10 Q 35 16 28 18 Q 22 18 18 14 Z"
            fill="var(--eg-purple)"
            opacity="0.85"
            stroke="#3a2a55"
            strokeWidth="0.6"
          />
          <circle cx="6" cy="11" r="1.2" fill="#fff" opacity="0.7" />
          <circle cx="30" cy="11" r="1.2" fill="#fff" opacity="0.7" />
        </g>
        <ellipse cx="18" cy="15" rx="1.1" ry="4" fill="#3a2818" />
        <line x1="17.5" y1="11" x2="16" y2="7" stroke="#3a2818" strokeWidth="0.6" strokeLinecap="round" />
        <line x1="18.5" y1="11" x2="20" y2="7" stroke="#3a2818" strokeWidth="0.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}
