// Wrapper around `tauri-plugin-sql`. Falls back to a no-op in-browser stub so
// the app still renders during plain Vite dev (without the Tauri shell).

import type { FootprintSegment, AppUsage, DailyUsage } from "../stores/footprintStore";

const DB_URL = "sqlite:eyeguard.db";

interface SqlDb {
  execute: (sql: string, args?: unknown[]) => Promise<unknown>;
  select: <T>(sql: string, args?: unknown[]) => Promise<T>;
  close: () => Promise<void>;
}

let _db: SqlDb | null = null;
let _opening: Promise<SqlDb | null> | null = null;
let _attempted = false;

function inTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

async function open(): Promise<SqlDb | null> {
  if (_db) return _db;
  if (_opening) return _opening;
  if (!inTauri()) return null;
  _opening = (async () => {
    if (_attempted && !_db) return null;
    _attempted = true;
    try {
      const { default: Database } = await import("@tauri-apps/plugin-sql");
      _db = (await Database.load(DB_URL)) as unknown as SqlDb;
      return _db;
    } catch (err) {
      console.warn("[eyeguard] failed to open db", err);
      return null;
    }
  })();
  return _opening;
}

export async function insertFootprint(seg: FootprintSegment) {
  const db = await open();
  if (!db) return;
  try {
    await db.execute(
      "INSERT INTO app_footprint (started_at, ended_at, duration_s, process, title) VALUES (?, ?, ?, ?, ?)",
      [seg.started_at, seg.ended_at, seg.duration_s, seg.process, seg.title],
    );
  } catch (err) {
    console.warn("[eyeguard] insertFootprint", err);
  }
}

export async function insertBreak(durationSec: number, skipped: boolean) {
  const db = await open();
  if (!db) return;
  try {
    await db.execute(
      "INSERT INTO break_log (occurred_at, duration_s, skipped) VALUES (?, ?, ?)",
      [Math.floor(Date.now() / 1000), durationSec, skipped ? 1 : 0],
    );
  } catch (err) {
    console.warn("[eyeguard] insertBreak", err);
  }
}

export interface RawUsageRow {
  process: string;
  total: number;
}

export async function getAppUsage(sinceUnix: number): Promise<AppUsage[]> {
  const db = await open();
  if (!db) return [];
  try {
    const rows = (await db.select<RawUsageRow[]>(
      "SELECT process, SUM(duration_s) as total FROM app_footprint WHERE started_at >= ? GROUP BY process ORDER BY total DESC",
      [sinceUnix],
    )) as RawUsageRow[];
    return rows.map((r) => ({ process: r.process, totalSec: r.total }));
  } catch (err) {
    console.warn("[eyeguard] getAppUsage", err);
    return [];
  }
}

export interface RawDailyRow {
  date: string;
  total: number;
}

export async function getDailyUsage(daysBack: number): Promise<DailyUsage[]> {
  const db = await open();
  if (!db) return [];
  try {
    const since = Math.floor(Date.now() / 1000) - daysBack * 24 * 3600;
    const rows = (await db.select<RawDailyRow[]>(
      "SELECT date(started_at, 'unixepoch', 'localtime') as date, SUM(duration_s) as total FROM app_footprint WHERE started_at >= ? GROUP BY date ORDER BY date",
      [since],
    )) as RawDailyRow[];
    return rows.map((r) => ({ date: r.date, totalSec: r.total }));
  } catch (err) {
    console.warn("[eyeguard] getDailyUsage", err);
    return [];
  }
}

export async function purgeAll() {
  const db = await open();
  if (!db) return;
  try {
    await db.execute("DELETE FROM app_footprint");
    await db.execute("DELETE FROM break_log");
    await db.execute("DELETE FROM app_category");
  } catch (err) {
    console.warn("[eyeguard] purgeAll", err);
  }
}

export async function purgeOlderThan(days: number) {
  const db = await open();
  if (!db) return;
  const cutoff = Math.floor(Date.now() / 1000) - days * 24 * 3600;
  try {
    await db.execute("DELETE FROM app_footprint WHERE started_at < ?", [cutoff]);
    await db.execute("DELETE FROM break_log WHERE occurred_at < ?", [cutoff]);
  } catch (err) {
    console.warn("[eyeguard] purgeOlderThan", err);
  }
}

/**
 * Rewrite legacy `pid:NNN` process names that we used to store before
 * we knew how to label inaccessible processes. Idempotent.
 */
export async function tidyLegacyPidRows() {
  const db = await open();
  if (!db) return;
  try {
    await db.execute(
      "UPDATE app_footprint SET process = 'unknown' WHERE process LIKE 'pid:%'",
    );
  } catch (err) {
    console.warn("[eyeguard] tidyLegacyPidRows", err);
  }
}

// ─── App-category overrides ───

interface RawCategoryRow {
  process: string;
  category: string;
}

export async function getCategoryOverrides(): Promise<Map<string, string>> {
  const db = await open();
  if (!db) return new Map();
  try {
    const rows = (await db.select<RawCategoryRow[]>(
      "SELECT process, category FROM app_category",
    )) as RawCategoryRow[];
    return new Map(rows.map((r) => [r.process.toLowerCase(), r.category]));
  } catch (err) {
    console.warn("[eyeguard] getCategoryOverrides", err);
    return new Map();
  }
}

export async function setCategoryOverride(process: string, category: string) {
  const db = await open();
  if (!db) return;
  try {
    await db.execute(
      "INSERT OR REPLACE INTO app_category (process, category) VALUES (?, ?)",
      [process.toLowerCase(), category],
    );
  } catch (err) {
    console.warn("[eyeguard] setCategoryOverride", err);
  }
}

export async function clearCategoryOverride(process: string) {
  const db = await open();
  if (!db) return;
  try {
    await db.execute("DELETE FROM app_category WHERE process = ?", [process.toLowerCase()]);
  } catch (err) {
    console.warn("[eyeguard] clearCategoryOverride", err);
  }
}

// ─── Hourly heat map for today ───

interface RawHourRow {
  hour: string;
  total: number;
}

export interface HourlyEntry {
  hour: number; // 0..23
  totalSec: number;
}

export async function getHourlyToday(): Promise<HourlyEntry[]> {
  const db = await open();
  const empty: HourlyEntry[] = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    totalSec: 0,
  }));
  if (!db) return empty;
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const since = Math.floor(todayStart.getTime() / 1000);
    const rows = (await db.select<RawHourRow[]>(
      `SELECT strftime('%H', started_at, 'unixepoch', 'localtime') AS hour,
              SUM(duration_s) AS total
         FROM app_footprint
        WHERE started_at >= ?
     GROUP BY hour`,
      [since],
    )) as RawHourRow[];
    const map = new Map<number, number>();
    for (const r of rows) map.set(parseInt(r.hour, 10), r.total);
    return empty.map((e) => ({ hour: e.hour, totalSec: map.get(e.hour) ?? 0 }));
  } catch (err) {
    console.warn("[eyeguard] getHourlyToday", err);
    return empty;
  }
}
