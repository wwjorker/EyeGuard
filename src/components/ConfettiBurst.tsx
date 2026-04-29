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
    </div>
  );
}
