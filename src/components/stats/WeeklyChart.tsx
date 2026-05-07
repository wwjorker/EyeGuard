import { useTranslation } from "react-i18next";
import type { DailyUsage } from "../../stores/footprintStore";
import { SleepingEye } from "../SleepingEye";

interface WeeklyChartProps {
  data: DailyUsage[];
}

/**
 * Last 7 days as a row of flower stems. Each stem's height is
 * proportional to that day's screen time; the tallest stem grows a
 * little gold flower on top. Today's label is highlighted in coral.
 */
export function WeeklyChart({ data }: WeeklyChartProps) {
  const { t, i18n } = useTranslation();
  if (!data.length) {
    return (
      <div className="garden-plot" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "16px 12px" }}>
        <SleepingEye size={64} />
        <span style={{ fontFamily: "Caveat, cursive", fontSize: 14, color: "var(--eg-text-soft)" }}>
          {t("stats.noChartData")}
        </span>
      </div>
    );
  }

  const today = new Date();
  const filled: DailyUsage[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = data.find((row) => row.date === key);
    filled.push({ date: key, totalSec: found?.totalSec ?? 0 });
  }

  const max = Math.max(1, ...filled.map((d) => d.totalSec));
  const locale = i18n.language === "zh" ? "zh-CN" : "en-US";
  const todayKey = today.toISOString().slice(0, 10);

  // Highlight the bar with the most usage as the "blooming" one.
  const peakDate = filled.reduce(
    (best, d) => (d.totalSec > best.totalSec ? d : best),
    filled[0],
  );

  return (
    <div className="garden-plot">
      <div className="garden-plot-header">
        <h4>📅 {t("stats.last7Days")}</h4>
      </div>
      <div className="week-stems">
        {filled.map((d) => {
          const ratio = d.totalSec / max;
          const stemH = Math.max(6, Math.round(ratio * 60));
          const isToday = d.date === todayKey;
          const isPeak = d.date === peakDate.date && d.totalSec > 0;
          const dayLabel = isToday
            ? t("stats.today") !== "stats.today"
              ? t("stats.today")
              : "today"
            : new Date(d.date + "T00:00").toLocaleDateString(locale, { weekday: "short" });
          return (
            <div
              key={d.date}
              className="week-stem"
              title={`${d.date} · ${Math.round(d.totalSec / 60)}m`}
            >
              <div
                className="week-stem-bar"
                style={{ ["--stem-h" as string]: `${stemH}px` }}
              >
                {isPeak && <div className="week-stem-flower" />}
              </div>
              <div className={`week-stem-label ${isToday ? "today" : ""}`}>{dayLabel}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
