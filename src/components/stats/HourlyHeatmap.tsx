import { useTranslation } from "react-i18next";
import type { HourlyEntry } from "../../lib/db";

interface HourlyHeatmapProps {
  data: HourlyEntry[];
}

/**
 * Today's screen time, hour by hour, rendered as a row of growing
 * plants on a paper card. Bar height + opacity scales with usage,
 * a small leaf-tip dot sits on top of each bar.
 */
export function HourlyHeatmap({ data }: HourlyHeatmapProps) {
  const { t } = useTranslation();
  const max = Math.max(1, ...data.map((d) => d.totalSec));
  const hasAny = data.some((d) => d.totalSec > 0);
  const totalMin = Math.round(data.reduce((acc, d) => acc + d.totalSec, 0) / 60);
  const peakHour = data.reduce(
    (best, d) => (d.totalSec > best.totalSec ? d : best),
    data[0] ?? { hour: 0, totalSec: 0 },
  );

  return (
    <div className="garden-plot">
      <div className="garden-plot-header">
        <h4>
          🌱 {t("stats.hourly")}
        </h4>
        {hasAny && (
          <span className="meta">
            {t("stats.peak", {
              hour: String(peakHour.hour).padStart(2, "0"),
              minutes: Math.round(peakHour.totalSec / 60),
            })}
          </span>
        )}
      </div>

      {!hasAny ? (
        <div
          style={{
            fontFamily: "Caveat, cursive",
            fontSize: 14,
            color: "var(--eg-text-soft)",
            padding: "10px 0",
          }}
        >
          {t("stats.hourlyEmpty")}
        </div>
      ) : (
        <>
          <div className="hourly-row">
            {data.map((d) => {
              const ratio = d.totalSec / max;
              const opacity = d.totalSec > 0 ? 0.25 + ratio * 0.75 : 0.08;
              const height = Math.max(3, ratio * 36);
              return (
                <div
                  key={d.hour}
                  className="hourly-cell"
                  title={`${String(d.hour).padStart(2, "0")}:00 · ${Math.round(d.totalSec / 60)}m`}
                  style={{
                    height: `${height}px`,
                    ["--cell-o" as string]: opacity,
                  }}
                />
              );
            })}
          </div>
          <div className="hourly-axis">
            <span>0</span>
            <span>6</span>
            <span>12</span>
            <span>18</span>
            <span>24</span>
          </div>
          <div className="hourly-total">
            {t("stats.totalToday", { minutes: totalMin })}
          </div>
        </>
      )}
    </div>
  );
}
