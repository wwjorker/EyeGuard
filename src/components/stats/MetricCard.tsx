import { useEffect, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface MetricCardProps {
  label: string;
  value: string | number;
  numericValue?: number;
  delta?: number; // percentage change
  accent?: string;
}

export function MetricCard({ label, value, numericValue, delta, accent = "var(--eg-text)" }: MetricCardProps) {
  const [display, setDisplay] = useState<string | number>(value);
  const fromRef = useRef<number | null>(null);
  const animRef = useRef<number | null>(null);

  // Smooth count animation if numericValue is provided.
  useEffect(() => {
    if (numericValue == null) {
      setDisplay(value);
      return;
    }
    const start = performance.now();
    const from = fromRef.current ?? numericValue;
    const to = numericValue;
    fromRef.current = to;
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 400);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (to - from) * eased;
      setDisplay(Math.round(v).toString());
      if (t < 1) animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [numericValue, value]);

  const positive = (delta ?? 0) >= 0;
  const Arrow = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className="rounded-card p-4"
      style={{ background: "var(--eg-card)", border: "1px solid var(--eg-line)" }}
    >
      <div
        className="text-[9px] uppercase"
        style={{ letterSpacing: 1, color: "var(--eg-muted)" }}
      >
        {label}
      </div>
      <div className="flex items-end justify-between mt-2">
        <div className="font-bold tabular-nums" style={{ fontSize: 22, color: accent }}>
          {display}
        </div>
        {delta !== undefined && Math.abs(delta) > 0.01 && (
          <div
            className="flex items-center gap-1 text-[10px]"
            style={{
              color: positive ? "var(--eg-green)" : "var(--eg-pink)",
            }}
          >
            <Arrow size={11} strokeWidth={2} />
            <span>{Math.abs(delta).toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
