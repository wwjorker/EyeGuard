import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import type { AppUsage } from "../../stores/footprintStore";

const COLORS = ["#34D399", "#6366F1", "#F59E0B", "#EC4899", "#A1A1AA"];

interface AppDistributionProps {
  data: AppUsage[];
}

export function AppDistribution({ data }: AppDistributionProps) {
  const { t } = useTranslation();
  const top5 = data.slice(0, 5);
  const rest = data.slice(5);
  const restTotal = rest.reduce((acc, d) => acc + d.totalSec, 0);
  const slices = restTotal > 0 ? [...top5, { process: t("stats.other"), totalSec: restTotal }] : top5;
  const total = slices.reduce((acc, d) => acc + d.totalSec, 0);

  if (total === 0) {
    return (
      <div
        className="rounded-card flex flex-col items-center justify-center py-8"
        style={{ background: "var(--eg-card)", border: "1px solid var(--eg-line)" }}
      >
        <span className="text-[11px]" style={{ color: "var(--eg-muted)" }}>
          {t("stats.noAppData")}
        </span>
      </div>
    );
  }

  const totalLabel = formatHours(total);

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
          {t("stats.appDistribution")}
        </h4>
      </header>
      <div className="flex items-center gap-3">
        <div className="relative" style={{ width: 130, height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="totalSec"
                nameKey="process"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={60}
                stroke="none"
                paddingAngle={2}
              >
                {slices.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-bold tabular-nums" style={{ fontSize: 16, color: "var(--eg-text)" }}>
              {totalLabel}
            </span>
          </div>
        </div>
        <ul className="flex-1 flex flex-col gap-1.5 text-[11px]">
          {slices.map((s, i) => (
            <li key={s.process} className="flex items-center gap-2">
              <span
                className="inline-block"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: COLORS[i % COLORS.length],
                }}
              />
              <span className="flex-1 truncate" style={{ color: "var(--eg-text)" }}>
                {s.process}
              </span>
              <span className="tabular-nums" style={{ color: "var(--eg-muted)" }}>
                {Math.round((s.totalSec / total) * 100)}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function formatHours(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h${m}m` : `${m}m`;
}
