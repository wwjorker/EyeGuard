import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useTranslation } from "react-i18next";
import type { DailyUsage } from "../../stores/footprintStore";
import { SleepingEye } from "../SleepingEye";

interface WeeklyChartProps {
  data: DailyUsage[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const { t, i18n } = useTranslation();
  if (!data.length) {
    return (
      <div
        className="rounded-card flex flex-col items-center justify-center gap-3 py-6"
        style={{ background: "var(--eg-card)", border: "1px solid var(--eg-line)" }}
      >
        <SleepingEye size={64} />
        <span className="text-[11px]" style={{ color: "var(--eg-muted)" }}>
          {t("stats.noChartData")}
        </span>
      </div>
    );
  }

  // ensure 7 days, fill missing with zero
  const today = new Date();
  const filled: DailyUsage[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const found = data.find((row) => row.date === key);
    filled.push({
      date: key,
      totalSec: found?.totalSec ?? 0,
    });
  }

  const locale = i18n.language === "zh" ? "zh-CN" : "en-US";
  const formatted = filled.map((d) => ({
    label: new Date(d.date + "T00:00").toLocaleDateString(locale, { weekday: "short" }),
    minutes: Math.round(d.totalSec / 60),
  }));

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
          {t("stats.last7Days")}
        </h4>
      </header>
      <div style={{ width: "100%", height: 150 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" stroke="rgba(255,255,255,0.25)" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.25)" fontSize={11} tickLine={false} axisLine={false} width={32} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: "#18181B",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 8,
                fontSize: 11,
              }}
              labelStyle={{ color: "rgba(255,255,255,0.5)" }}
              itemStyle={{ color: "#FAFAFA" }}
              formatter={(value: number) => [`${value}m`, t("stats.screenTooltip")]}
            />
            <Bar dataKey="minutes" fill="#34D399" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
