interface LogoProps {
  size?: number;
}

// Compute the spiral polyline once. Mirrors scripts/generate-icons.mjs so the
// topbar mark is the same curve as the app icon, just at a tiny scale.
const SPIRAL_PATH = (() => {
  const cx = 12;
  const cy = 12;
  const a = 0.85;
  const b = 0.115;
  const thetaMax = 5 * Math.PI;
  const samples = 56;
  const phi = -Math.PI / 2 - Math.PI / 6;
  const raw: { x: number; y: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (thetaMax * i) / samples;
    const r = a * Math.exp(b * t);
    raw.push({
      x: cx + r * Math.cos(t + phi),
      y: cy + r * Math.sin(t + phi),
    });
  }
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of raw) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  const dx = cx - (minX + maxX) / 2;
  const dy = cy - (minY + maxY) / 2;
  const pts = raw.map((p) => ({ x: p.x + dx, y: p.y + dy }));
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
  }
  return { d, inner: pts[0] };
})();

/**
 * EyeGuard mark — a mini sage chip with the cream spiral, matching the
 * desktop app icon. Used in the topbar so the brand reads at a glance.
 */
export function Logo({ size = 24 }: LogoProps) {
  return (
    <span aria-hidden style={{ display: "inline-flex", width: size, height: size }}>
      <svg viewBox="0 0 24 24" width={size} height={size}>
        <defs>
          <linearGradient id="eg-logo-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3f6e55" />
            <stop offset="100%" stopColor="#294c39" />
          </linearGradient>
        </defs>
        <rect width="24" height="24" rx="5.5" fill="url(#eg-logo-bg)" />
        <path
          d={SPIRAL_PATH.d}
          fill="none"
          stroke="#f5e2bf"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={SPIRAL_PATH.inner.x}
          cy={SPIRAL_PATH.inner.y}
          r="1.05"
          fill="#f5e2bf"
        />
      </svg>
    </span>
  );
}
