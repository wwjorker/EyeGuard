interface LogoProps {
  size?: number;
}

/**
 * EyeGuard mark — a tiny snail (a simplified version of the windowsill
 * mascot). Cream shell with a spiral, two stalk eyes peeking out.
 */
export function Logo({ size = 18 }: LogoProps) {
  return (
    <span
      aria-hidden
      style={{ display: "inline-flex", width: size, height: size * 0.78 }}
    >
      <svg
        viewBox="0 0 32 25"
        width={size}
        height={size * 0.78}
        style={{ overflow: "visible" }}
      >
        {/* trail dots */}
        <circle cx="1.5" cy="22" r="0.6" fill="#bb9468" opacity="0.5" />
        <circle cx="3.5" cy="22.5" r="0.6" fill="#bb9468" opacity="0.5" />
        {/* body */}
        <path
          d="M 5 18 Q 10 16 14 14 L 24 14 Q 28 14 28 18 Q 28 21 24 21 L 8 21 Q 4 21 5 18 Z"
          fill="#dab089"
          stroke="#7a5230"
          strokeWidth="1"
          strokeLinejoin="round"
        />
        {/* shell */}
        <circle cx="18" cy="11" r="9" fill="#c89a4a" stroke="#5a3a1a" strokeWidth="1.2" />
        {/* spiral on shell */}
        <path
          d="M 18 11 m -5.5 0 a 5.5 5.5 0 1 1 11 0 a 3.5 3.5 0 1 1 -7 0 a 1.8 1.8 0 1 1 3.6 0"
          fill="none"
          stroke="#5a3a1a"
          strokeWidth="1.1"
          strokeLinecap="round"
        />
        {/* eye stalks */}
        <line x1="28" y1="14" x2="30.5" y2="6" stroke="#7a5230" strokeWidth="1" strokeLinecap="round" />
        <line x1="25" y1="14" x2="26" y2="5" stroke="#7a5230" strokeWidth="1" strokeLinecap="round" />
        <circle cx="30.5" cy="6" r="1.2" fill="#3a2818" />
        <circle cx="26" cy="5" r="1.2" fill="#3a2818" />
      </svg>
    </span>
  );
}
