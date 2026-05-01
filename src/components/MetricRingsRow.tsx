import { useTranslation } from "react-i18next";
import { useTimerStore, formatHM } from "../stores/timerStore";

const COLORS = ["var(--eg-leaf)", "var(--eg-purple)", "var(--eg-amber)", "var(--eg-pink)"];

/**
 * Four small "stickers" on the windowsill — split into two pairs that
 * sit on either side of the pot so the pot in the middle never covers
 * the middle stickers.
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
      <div className="garden-badges-pair">
        {items.slice(0, 2).map((it) => (
          <Badge key={it.label} {...it} />
        ))}
      </div>
      <div className="garden-badges-pair">
        {items.slice(2, 4).map((it) => (
          <Badge key={it.label} {...it} />
        ))}
      </div>
    </div>
  );
}

function Badge({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <div className="garden-badge" style={{ ["--badge-c" as string]: color }}>
      <div className="v">{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}
