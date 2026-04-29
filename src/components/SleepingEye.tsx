interface SleepingEyeProps {
  size?: number;
}

/**
 * Friendly empty-state illustration: a closed eye with three "Z" puffs
 * floating up. Used on the stats / app-distribution / weekly-chart cards
 * when there's no data yet.
 */
export function SleepingEye({ size = 72 }: SleepingEyeProps) {
  const w = size;
  const h = Math.round(size * 0.85);
  return (
    <svg
      viewBox="0 0 100 88"
      width={w}
      height={h}
      aria-hidden
      className="eg-sleeping-eye"
    >
      {/* Closed eye — gentle smile-shaped curve */}
      <path
        d="M 14 50 Q 50 70 86 50"
        fill="none"
        stroke="var(--eg-muted)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* Lashes pointing down */}
      <g stroke="var(--eg-muted)" strokeWidth="1.6" strokeLinecap="round" opacity="0.7">
        <line x1="26" y1="60" x2="22" y2="68" />
        <line x1="40" y1="64" x2="40" y2="73" />
        <line x1="54" y1="64" x2="54" y2="73" />
        <line x1="68" y1="60" x2="72" y2="68" />
      </g>
      {/* Three Z puffs drifting up to the right */}
      <g fontFamily="'Space Grotesk', 'Inter', sans-serif" fill="var(--eg-faint)" fontWeight="600">
        <text x="62" y="34" fontSize="14" className="eg-sleeping-z eg-z1">z</text>
        <text x="74" y="22" fontSize="11" className="eg-sleeping-z eg-z2">z</text>
        <text x="84" y="12" fontSize="9" className="eg-sleeping-z eg-z3">z</text>
      </g>
    </svg>
  );
}
