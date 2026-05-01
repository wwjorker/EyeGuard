import { useEffect, useState } from "react";
import { useTimerStore } from "../../stores/timerStore";

interface SkyPalette {
  sky1: string;
  sky2: string;
  sky3: string;
  isNight: boolean;
}

/**
 * Returns a sky gradient that changes with the local hour.
 * Morning (5–10): pink-orange dawn
 * Midday  (10–16): warm cream + soft amber
 * Dusk    (16–19): peach to coral
 * Night   (19–5):  deep navy → indigo with stars + moon
 */
function paletteForHour(h: number): SkyPalette {
  if (h >= 5 && h < 10) {
    return { sky1: "#fdd9b3", sky2: "#f9b07c", sky3: "#e07f4a", isNight: false };
  }
  if (h >= 10 && h < 16) {
    return { sky1: "#fde6c4", sky2: "#f9c98f", sky3: "#e0a06c", isNight: false };
  }
  if (h >= 16 && h < 19) {
    return { sky1: "#fbc99d", sky2: "#e89058", sky3: "#a85540", isNight: false };
  }
  return { sky1: "#1a2d4a", sky2: "#0e1c33", sky3: "#051028", isNight: true };
}

interface SkyProps {
  /** When true, fireflies layer is permitted (unlocked at 100+ breaks). */
  fireflyUnlocked?: boolean;
}

export function Sky({ fireflyUnlocked = false }: SkyProps) {
  const [palette, setPalette] = useState(() => paletteForHour(new Date().getHours()));
  const completedBreaks = useTimerStore((s) => s.completedBreaks);

  // Re-pick the palette every minute (and immediately when state updates).
  useEffect(() => {
    const id = window.setInterval(
      () => setPalette(paletteForHour(new Date().getHours())),
      60 * 1000,
    );
    return () => window.clearInterval(id);
  }, []);

  const showFireflies = palette.isNight && (fireflyUnlocked || completedBreaks >= 100);

  return (
    <div
      className="garden-sky"
      style={{
        ["--eg-sky-1" as string]: palette.sky1,
        ["--eg-sky-2" as string]: palette.sky2,
        ["--eg-sky-3" as string]: palette.sky3,
      }}
    >
      {!palette.isNight && (
        <span className="garden-sun" style={sunPosition(new Date().getHours())} />
      )}
      {palette.isNight && <span className="garden-moon" style={{ top: 50, right: 60 }} />}
      {palette.isNight && stars}

      <span className="garden-cloud" style={{ top: 80, width: 80, animationDuration: "55s" }} />
      <span
        className="garden-cloud"
        style={{ top: 130, width: 50, animationDuration: "75s", animationDelay: "-25s" }}
      />

      {showFireflies && fireflies}
    </div>
  );
}

function sunPosition(hour: number): React.CSSProperties {
  // Arc the sun left → top → right across the day window.
  // 6am = far left, 12pm = top centre, 6pm = far right.
  const t = Math.min(1, Math.max(0, (hour - 6) / 12));
  const left = 30 + t * 320;
  const top = 50 + Math.sin(Math.PI * t) * -20;
  return { top: `${top}px`, left: `${left}px` };
}

const stars = [
  { top: 30, left: 60 },
  { top: 50, left: 140 },
  { top: 80, left: 280 },
  { top: 40, left: 350 },
  { top: 100, left: 200 },
  { top: 60, left: 380 },
].map((s, i) => (
  <span
    key={i}
    className="garden-star"
    style={{ ...s, animationDelay: `${(i * 0.4) % 3}s` }}
  />
));

const fireflies = Array.from({ length: 4 }, (_, i) => (
  <span
    key={i}
    className="garden-firefly"
    style={{
      bottom: 140 + (i % 2) * 30,
      left: 60 + i * 80,
      animationDelay: `${i * 1.6}s`,
    }}
  />
));
