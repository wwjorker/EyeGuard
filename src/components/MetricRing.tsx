interface MetricRingProps {
  value: string;
  label: string;
  color: string;
  progress: number; // 0..1
  size?: number;
  stroke?: number;
}

export function MetricRing({
  value,
  label,
  color,
  progress,
  size = 60,
  stroke = 3,
}: MetricRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dashOffset = c * (1 - Math.max(0, Math.min(1, progress)));

  return (
    <div
      className="metric-ring-wrap flex flex-col items-center gap-2"
      style={{ ["--ring-color" as string]: color }}
    >
      <div className="relative metric-ring-svg" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--eg-track)"
            strokeWidth={stroke}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 800ms ease, filter 200ms ease" }}
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center font-bold text-white metric-ring-value"
          style={{ fontSize: 13 }}
        >
          {value}
        </span>
      </div>
      <span className="ring-label">{label}</span>
    </div>
  );
}
