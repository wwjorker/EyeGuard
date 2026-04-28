interface LogoProps {
  size?: number;
  blink?: boolean;
}

/**
 * EyeGuard mark — an almond eye outline with an emerald iris, a small
 * white highlight, and three short lashes. Optional blink animation
 * fires every ~6 s so the mark feels alive without nagging.
 */
export function Logo({ size = 18, blink = true }: LogoProps) {
  return (
    <span
      aria-hidden
      style={{
        display: "inline-flex",
        width: size,
        height: size,
      }}
    >
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className={blink ? "eg-logo-blink" : undefined}
      >
        {/* Lashes */}
        <g
          stroke="var(--eg-text)"
          strokeWidth={1.4}
          strokeLinecap="round"
          opacity={0.85}
        >
          <line x1="11" y1="5" x2="10" y2="2.5" />
          <line x1="16" y1="4" x2="16" y2="1.5" />
          <line x1="21" y1="5" x2="22" y2="2.5" />
        </g>
        {/* Eye almond outline */}
        <path
          d="M 3 16 Q 16 7 29 16 Q 16 25 3 16 Z"
          fill="none"
          stroke="var(--eg-text)"
          strokeWidth={1.6}
          strokeLinejoin="round"
        />
        {/* Iris */}
        <circle cx="16" cy="16" r="4.6" fill="var(--eg-green)" />
        {/* Highlight pupil */}
        <circle cx="17.6" cy="14.4" r="1.2" fill="#FAFAFA" />
      </svg>
    </span>
  );
}
