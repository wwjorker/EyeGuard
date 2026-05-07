import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { MetricCard } from "../components/stats/MetricCard";
import { AppDistribution } from "../components/stats/AppDistribution";
import { HourlyHeatmap } from "../components/stats/HourlyHeatmap";
import { WeeklyChart } from "../components/stats/WeeklyChart";
import {
  getAppUsage,
  getCategoryOverrides,
  getDailyUsage,
  getHourlyToday,
  type HourlyEntry,
} from "../lib/db";
import { useFootprintStore } from "../stores/footprintStore";
import { useTimerStore, formatHM } from "../stores/timerStore";

const ONE_DAY = 24 * 3600;

export function StatsPage() {
  const todayScreenSec = useTimerStore((s) => s.todayScreenSec);
  const completedBreaks = useTimerStore((s) => s.completedBreaks);
  const skippedBreaks = useTimerStore((s) => s.skippedBreaks);
  const longestStreak = useTimerStore((s) => s.longestStreakSec);

  const appUsage = useFootprintStore((s) => s.appUsage);
  const dailyUsage = useFootprintStore((s) => s.dailyUsage);
  const setAppUsage = useFootprintStore((s) => s.setAppUsage);
  const setDailyUsage = useFootprintStore((s) => s.setDailyUsage);
  const { t } = useTranslation();

  const [refreshNonce, setRefreshNonce] = useState(0);
  const [hourly, setHourly] = useState<HourlyEntry[]>([]);
  const [overrides, setOverrides] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const since = Math.floor(Date.now() / 1000) - ONE_DAY;
    void getAppUsage(since).then(setAppUsage);
    void getDailyUsage(7).then(setDailyUsage);
    void getHourlyToday().then(setHourly);
    void getCategoryOverrides().then(setOverrides);
  }, [refreshNonce, setAppUsage, setDailyUsage]);

  useEffect(() => {
    const id = window.setInterval(() => setRefreshNonce((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const weekDelta = useMemo(() => computeWeekDelta(dailyUsage), [dailyUsage]);

  return (
    <section
      className="flex-1 page-enter overflow-y-auto"
      style={{
        padding: "60px 14px 18px",
        background:
          "linear-gradient(180deg, var(--eg-card-2) 0%, var(--eg-bg) 100%)",
      }}
    >
      <div className="grid grid-cols-2 gap-2 mb-3">
        <MetricCard
          label={t("stats.screenToday")}
          value={formatHM(todayScreenSec)}
          accent="var(--eg-leaf)"
        />
        <MetricCard
          label={t("stats.breaksDone")}
          value={completedBreaks}
          numericValue={completedBreaks}
          accent="var(--eg-purple)"
        />
        <MetricCard
          label={t("stats.breaksSkipped")}
          value={skippedBreaks}
          numericValue={skippedBreaks}
          accent="var(--eg-pink)"
        />
        <MetricCard
          label={t("stats.longestStreak")}
          value={`${Math.round(longestStreak / 60)}m`}
          accent="var(--eg-amber)"
        />
      </div>

      {weekDelta !== null && (
        <div
          className="garden-plot"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px" }}
        >
          <span style={{ fontFamily: "Caveat, cursive", fontSize: 16, color: "var(--eg-text)" }}>
            🌿 {t("stats.weekVsLast")}
          </span>
          <span
            style={{
              fontFamily: "Quicksand, sans-serif",
              fontWeight: 700,
              fontSize: 17,
              color: weekDelta < 0 ? "var(--eg-leaf)" : "var(--eg-pink)",
            }}
          >
            {weekDelta > 0 ? "+" : ""}
            {weekDelta.toFixed(0)}%
          </span>
        </div>
      )}

      <HourlyHeatmap data={hourly} />
      <AppDistribution data={appUsage} overrides={overrides} />
      <WeeklyChart data={dailyUsage} />
    </section>
  );
}

function computeWeekDelta(daily: { date: string; totalSec: number }[]): number | null {
  if (!daily.length) return null;
  const today = new Date();
  const startThis = new Date(today);
  startThis.setDate(today.getDate() - 6);
  const startLast = new Date(today);
  startLast.setDate(today.getDate() - 13);
  let thisWk = 0;
  let lastWk = 0;
  for (const d of daily) {
    const date = new Date(d.date + "T00:00");
    if (date >= startThis) thisWk += d.totalSec;
    else if (date >= startLast) lastWk += d.totalSec;
  }
  if (lastWk === 0) return null;
  return ((thisWk - lastWk) / lastWk) * 100;
}
