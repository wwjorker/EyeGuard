// Export footprint + break log to JSON or CSV.

import { getAppUsage, getDailyUsage } from "./db";
import { saveText, type SaveResult } from "./fileSave";

export interface ExportPayload {
  generated_at: string;
  app_usage_today: { process: string; total_seconds: number }[];
  daily_screen_time: { date: string; total_seconds: number }[];
}

export async function buildPayload(): Promise<ExportPayload> {
  const today = Math.floor(Date.now() / 1000) - 24 * 3600;
  const apps = await getAppUsage(today);
  const daily = await getDailyUsage(90);
  return {
    generated_at: new Date().toISOString(),
    app_usage_today: apps.map((a) => ({ process: a.process, total_seconds: a.totalSec })),
    daily_screen_time: daily.map((d) => ({ date: d.date, total_seconds: d.totalSec })),
  };
}

export async function exportJson(): Promise<SaveResult> {
  const payload = await buildPayload();
  return saveText(`eyeguard-stats-${stamp()}.json`, JSON.stringify(payload, null, 2));
}

export async function exportCsv(): Promise<SaveResult> {
  const payload = await buildPayload();
  const lines: string[] = [];
  lines.push("# app_usage_today");
  lines.push("process,total_seconds");
  for (const row of payload.app_usage_today) {
    lines.push(`${csv(row.process)},${row.total_seconds}`);
  }
  lines.push("");
  lines.push("# daily_screen_time");
  lines.push("date,total_seconds");
  for (const row of payload.daily_screen_time) {
    lines.push(`${csv(row.date)},${row.total_seconds}`);
  }
  return saveText(`eyeguard-stats-${stamp()}.csv`, lines.join("\n"));
}

function stamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function csv(value: string): string {
  if (/[,"\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
