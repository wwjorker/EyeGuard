import { useTranslation } from "react-i18next";
import type { HourlyEntry } from "../../lib/db";

interface HourlyHeatmapProps {
  data: HourlyEntry[];
}

/**
 * 24 vertical strips, one per hour of "today". Cell intensity = ratio of
 * hour usage to the busiest hour of the day. Hover the strip for the
 * exact minute count via the native title tooltip.
 */
export function HourlyHeatmap({ data }: HourlyHeatmapProps) {
  const { t } = useTranslation();
  const max = Math.max(1, ...data.map((d) => d.totalSec));
  const hasAny = data.some((d) => d.totalSec > 0);
  const totalMin = Math.round(data.reduce((acc, d) => acc + d.totalSec, 0) / 60);
  const peakHour = data.reduce((best, d) => (d.totalSec > best.totalSec ? d : best), data[0] ?? { hour: 0, totalSec: 0 });

  return (
    <div
      className="rounded-card p-3"
      style={{ background: "var(--eg-card)", border: "1px solid var(--eg-line)" }}
    >
      <header className="flex items-center justify-between mb-2 px-1">
        <h4
          className="text-[11px] uppercase"
          style={{ letterSpacing: 1.2, color: "var(--eg-muted)" }}
        >
          {t("stats.hourly")}
        </h4>
        {hasAny && (
          <span className="text-[10px]" style={{ color: "var(--eg-muted)" }}>
            {t("stats.peak", {
              hour: String(peakHour.hour).padStart(2, "0"),
              minutes: Math.round(peakHour.totalSec / 60),
            })}
          </span>
        )}
      </header>

      {!hasAny ? (
        <div className="text-[11px] py-3" style={{ color: "var(--eg-muted)" }}>
          {t("stats.hourlyEmpty")}
        </div>
      ) : (
        <>
          <div className="flex gap-[2px] items-end" style={{ height: 36 }}>
            {data.map((d) => {
              const intensity = d.totalSec / max;
              const alpha = d.totalSec > 0 ? 0.18 + intensity * 0.72 : 0.06;
              return (
                <div
                  key={d.hour}
                  title={`${String(d.hour).padStart(2, "0")}:00 · ${Math.round(d.totalSec / 60)}m`}
                  style={{
                    flex: 1,
                    height: "100%",
                    background: `rgba(52,211,153,${alpha})`,
                    borderRadius: 3,
                    transition: "background 200ms ease",
                  }}
                />
              );
            })}
          </div>
          <div
            className="flex justify-between text-[9px] mt-1.5 px-[2px]"
            style={{ color: "var(--eg-muted)", letterSpacing: 0.4 }}
          >
            <span>0</span>
            <span>6</span>
            <span>12</span>
            <span>18</span>
            <span>24</span>
          </div>
          <div className="text-[10px] mt-1" style={{ color: "var(--eg-muted)" }}>
            {t("stats.totalToday", { minutes: totalMin })}
          </div>
        </>
      )}
    </div>
  );
}
