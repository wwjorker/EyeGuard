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

// Plant-theme palette for the per-app slice colours.
const APP_COLORS = [
  "var(--eg-leaf)",
  "var(--eg-purple)",
  "var(--eg-amber)",
  "var(--eg-pink)",
  "var(--eg-soil)",
  "var(--eg-text-soft)",
];

// Resolve CSS-var color tokens to actual hex/rgb so Recharts can paint
// them. Recharts cells require a literal colour string at render time.
const resolveColor = (token: string): string => {
  if (typeof window === "undefined") return token;
  if (!token.startsWith("var(")) return token;
  const name = token.slice(4, -1).trim();
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#5a8c4a";
};

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
        color: resolveColor(APP_COLORS[i % APP_COLORS.length]),
      }));
      if (restTotal > 0) {
        list.push({
          key: "_other",
          label: t("stats.other"),
          totalSec: restTotal,
          color: resolveColor(APP_COLORS[5 % APP_COLORS.length]),
        });
      }
      return list;
    }
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
      <div className="garden-plot" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "18px 12px" }}>
        <SleepingEye size={68} />
        <span style={{ fontFamily: "Caveat, cursive", fontSize: 14, color: "var(--eg-text-soft)" }}>
          {t("stats.noAppData")}
        </span>
      </div>
    );
  }

  return (
    <div className="garden-plot">
      <div className="garden-plot-header">
        <h4>🪴 {t("stats.appDistribution")}</h4>
        <div className="eg-segmented" role="tablist">
          <button aria-selected={mode === "app"} onClick={() => setMode("app")}>
            {t("stats.byApp")}
          </button>
          <button aria-selected={mode === "category"} onClick={() => setMode("category")}>
            {t("stats.byCategory")}
          </button>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative" style={{ width: 120, height: 120, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={slices}
                dataKey="totalSec"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={38}
                outerRadius={56}
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
            <span
              style={{
                fontFamily: "Quicksand, sans-serif",
                fontWeight: 700,
                fontSize: 15,
                color: "var(--eg-text)",
                fontFeatureSettings: '"tnum"',
              }}
            >
              {formatHours(total)}
            </span>
          </div>
        </div>
        <ul className="garden-pie-list">
          {slices.map((s) => (
            <li key={s.key}>
              <span className="dot" style={{ background: s.color }} />
              <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.label}
              </span>
              <span className="pct">{Math.round((s.totalSec / total) * 100)}%</span>
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
