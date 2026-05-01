import { useTranslation } from "react-i18next";
import { useTimerStore, formatHM } from "../stores/timerStore";

const COLORS = ["var(--eg-leaf)", "var(--eg-purple)", "var(--eg-amber)", "var(--eg-pink)"];

/**
 * Four small "stickers" sitting along the windowsill — replaces the
 * old SVG metric rings. Each sticker shows a coloured dot + value +
 * tiny handwritten label.
 */
export function MetricRingsRow() {
  const todayScreenSec = useTimerStore((s) => s.todayScreenSec);
  const completedBreaks = useTimerStore((s) => s.completedBreaks);
  const targetBreaks = 6;
  const healthScore = useTimerStore((s) => s.healthScore);
  const longestStreak = useTimerStore((s) => s.longestStreakSec);
  const { t } = useTranslation();

  const items = [
    { value: formatHM(todayScreenSec), label: t("rings.screen"), color: COLORS[0] },
    { value: `${completedBreaks}/${targetBreaks}`, label: t("rings.breaks"), color: COLORS[1] },
    { value: String(healthScore), label: t("rings.score"), color: COLORS[2] },
    { value: `${Math.floor(longestStreak / 60)}m`, label: t("rings.streak"), color: COLORS[3] },
  ];

  return (
    <div className="garden-badges">
      {items.map((it) => (
        <div
          key={it.label}
          className="garden-badge"
          style={{ ["--badge-c" as string]: it.color }}
        >
          <div className="v">{it.value}</div>
          <div className="l">{it.label}</div>
        </div>
      ))}
    </div>
  );
}
