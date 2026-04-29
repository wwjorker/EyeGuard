import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useTranslation } from "react-i18next";
import type { AppUsage } from "../../stores/footprintStore";
import { SleepingEye } from "../SleepingEye";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  categoryForProcess,
  type Category,
} from "../../lib/categoryPresets";

const APP_COLORS = ["#34D399", "#6366F1", "#F59E0B", "#EC4899", "#A1A1AA"];

type Mode = "app" | "category";

interface AppDistributionProps {
  data: AppUsage[];
  overrides: Map<string, string>;
}

interface Slice {
  key: string;
  label: string;
  totalSec: number;
  color: string;
}

export function AppDistribution({ data, overrides }: AppDistributionProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("app");

  const slices: Slice[] = useMemo(() => {
    if (mode === "app") {
      const top5 = data.slice(0, 5);
      const rest = data.slice(5);
      const restTotal = rest.reduce((acc, d) => acc + d.totalSec, 0);
      const list = top5.map((d, i) => ({
        key: d.process,
        label: d.process,
        totalSec: d.totalSec,
        color: APP_COLORS[i % APP_COLORS.length],
      }));
      if (restTotal > 0) {
        list.push({
          key: "_other",
          label: t("stats.other"),
          totalSec: restTotal,
          color: APP_COLORS[5 % APP_COLORS.length] ?? "#52525B",
        });
      }
      return list;
    }
    // category mode: aggregate by category
    const totals = new Map<Category, number>();
    for (const d of data) {
      const cat = categoryForProcess(d.process, overrides.get(d.process.toLowerCase()));
      totals.set(cat, (totals.get(cat) ?? 0) + d.totalSec);
    }
    return CATEGORIES.filter((c) => (totals.get(c) ?? 0) > 0)
      .map((c) => ({
        key: c,
        label: t(`category.${c}`),
        totalSec: totals.get(c) ?? 0,
        color: CATEGORY_COLORS[c],
      }))
      .sort((a, b) => b.totalSec - a.totalSec);
  }, [data, overrides, mode, t]);

  const total = slices.reduce((acc, d) => acc + d.totalSec, 0);

  if (total === 0) {
    return (
      <div
        className="rounded-card flex flex-col items-center justify-center gap-3 py-7"
        style={{ background: "var(--eg-card)", border: "1px solid var(--eg-line)" }}
      >
        <SleepingEye size={68} />
        <span className="text-[11px]" style={{ color: "var(--eg-muted)" }}>
          {t("stats.noAppData")}
        </span>
      </div>
    );
  }

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
        <div className="eg-segmented" role="tablist">
          <button aria-selected={mode === "app"} onClick={() => setMode("app")}>
            {t("stats.byApp")}
          </button>
          <button aria-selected={mode === "category"} onClick={() => setMode("category")}>
            {t("stats.byCategory")}
          </button>
        </div>
      </header>
      <div className="flex items-center gap-3">
        <div className="relative" style={{ width: 130, height: 130 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="totalSec"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={60}
                stroke="none"
                paddingAngle={2}
              >
                {slices.map((s) => (
                  <Cell key={s.key} fill={s.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="font-bold tabular-nums" style={{ fontSize: 16, color: "var(--eg-text)" }}>
              {formatHours(total)}
            </span>
          </div>
        </div>
        <ul className="flex-1 flex flex-col gap-1.5 text-[11px]">
          {slices.map((s) => (
            <li key={s.key} className="flex items-center gap-2">
              <span
                className="inline-block"
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 2,
                  background: s.color,
                }}
              />
              <span className="flex-1 truncate" style={{ color: "var(--eg-text)" }}>
                {s.label}
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
