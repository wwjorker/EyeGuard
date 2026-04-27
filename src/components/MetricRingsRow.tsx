import { MetricRing } from "./MetricRing";
import { useTimerStore, formatHM } from "../stores/timerStore";

export function MetricRingsRow() {
  const todayScreenSec = useTimerStore((s) => s.todayScreenSec);
  const completedBreaks = useTimerStore((s) => s.completedBreaks);
  const targetBreaks = 6;
  const healthScore = useTimerStore((s) => s.healthScore);
  const longestStreak = useTimerStore((s) => s.longestStreakSec);

  const screenTarget = 4 * 3600; // 4h target
  const screenProgress = Math.min(1, todayScreenSec / screenTarget);
  const breakProgress = Math.min(1, completedBreaks / targetBreaks);
  const scoreProgress = Math.min(1, healthScore / 100);
  const streakTargetSec = 60 * 60; // 1h baseline
  const streakProgress = Math.min(1, longestStreak / streakTargetSec);

  return (
    <div className="flex items-center justify-between gap-2 px-2 pb-2 pt-3">
      <MetricRing
        value={formatHM(todayScreenSec)}
        label="screen"
        color="var(--eg-green)"
        progress={screenProgress}
      />
      <span className="metric-divider" />
      <MetricRing
        value={`${completedBreaks}/${targetBreaks}`}
        label="breaks"
        color="var(--eg-purple)"
        progress={breakProgress}
      />
      <span className="metric-divider" />
      <MetricRing
        value={String(healthScore)}
        label="score"
        color="var(--eg-amber)"
        progress={scoreProgress}
      />
      <span className="metric-divider" />
      <MetricRing
        value={`${Math.floor(longestStreak / 60)}m`}
        label="streak"
        color="var(--eg-pink)"
        progress={streakProgress}
      />
    </div>
  );
}
