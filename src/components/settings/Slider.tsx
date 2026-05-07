interface SliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}

/** Vine slider: green stem track + flower-bud thumb + handwritten readout. */
export function Slider({ value, min, max, step = 1, onChange, format }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="vine-slider"
        style={{ ["--pct" as string]: `${pct}%` } as React.CSSProperties}
      />
      <span className="vine-slider-readout">{format ? format(value) : value}</span>
    </div>
  );
}
