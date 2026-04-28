import { useTranslation } from "react-i18next";
import { MetricRing } from "./MetricRing";
import { useTimerStore, formatHM } from "../stores/timerStore";

export function MetricRingsRow() {
  const todayScreenSec = useTimerStore((s) => s.todayScreenSec);
  const completedBreaks = useTimerStore((s) => s.completedBreaks);
  const targetBreaks = 6;
  const healthScore = useTimerStore((s) => s.healthScore);
  const longestStreak = useTimerStore((s) => s.longestStreakSec);
  const { t } = useTranslation();

  const screenTarget = 4 * 3600;
  const screenProgress = Math.min(1, todayScreenSec / screenTarget);
  const breakProgress = Math.min(1, completedBreaks / targetBreaks);
  const scoreProgress = Math.min(1, healthScore / 100);
  const streakTargetSec = 60 * 60;
  const streakProgress = Math.min(1, longestStreak / streakTargetSec);

  return (
    <div className="flex items-center justify-between gap-2 px-2 pb-2 pt-3">
      <MetricRing
        value={formatHM(todayScreenSec)}
        label={t("rings.screen")}
        color="var(--eg-green)"
        progress={screenProgress}
      />
      <span className="metric-divider" />
      <MetricRing
        value={`${completedBreaks}/${targetBreaks}`}
        label={t("rings.breaks")}
        color="var(--eg-purple)"
        progress={breakProgress}
      />
      <span className="metric-divider" />
      <MetricRing
        value={String(healthScore)}
        label={t("rings.score")}
        color="var(--eg-amber)"
        progress={scoreProgress}
      />
      <span className="metric-divider" />
      <MetricRing
        value={`${Math.floor(longestStreak / 60)}m`}
        label={t("rings.streak")}
        color="var(--eg-pink)"
        progress={streakProgress}
      />
    </div>
  );
}
