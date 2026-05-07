import { useEffect, useRef, useState } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  numericValue?: number;
  /** Small handwritten subtitle below the value (e.g., "+1 from yesterday"). */
  subtitle?: string;
  /** Stripe color along the top of the seed packet. */
  accent?: string;
}

/**
 * A "seed packet" card: white paper rectangle with a colored stripe on
 * top (the seed packet header), Caveat label, big tabular-num value,
 * and an optional handwritten subtitle.
 */
export function MetricCard({ label, value, numericValue, subtitle, accent }: MetricCardProps) {
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

  return (
    <div
      className="seed-packet"
      style={{ ["--seed-c" as string]: accent ?? "var(--eg-leaf)" }}
    >
      <div className="seed-label">{label}</div>
      <div className="seed-value">{display}</div>
      {subtitle && <div className="seed-sub">{subtitle}</div>}
    </div>
  );
}
