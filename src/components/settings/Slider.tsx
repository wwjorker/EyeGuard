interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

export function Slider({ value, min, max, step = 1, onChange, format }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="flex items-center gap-3 w-full">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="eg-slider flex-1"
        style={
          {
            "--pct": `${pct}%`,
          } as React.CSSProperties
        }
      />
      <span className="text-[11px] tabular-nums w-14 text-right" style={{ color: "var(--eg-text)" }}>
        {format ? format(value) : value}
      </span>
    </div>
  );
}
