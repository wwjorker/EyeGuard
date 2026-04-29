import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import {
  CATEGORIES,
  CATEGORY_COLORS,
  categoryForProcess,
  type Category,
} from "../../lib/categoryPresets";
import {
  clearCategoryOverride,
  getAppUsage,
  getCategoryOverrides,
  setCategoryOverride,
} from "../../lib/db";

interface AppRow {
  process: string;
  totalSec: number;
  category: Category;
  /** true when the category came from a user override (not the preset). */
  customised: boolean;
}

const LOOKBACK_DAYS = 30;

/**
 * Lists every process the user touched in the last 30 days, sorted by
 * total time, and lets them assign a category via a dropdown. Overrides
 * persist to the `app_category` SQLite table.
 *
 * The list grows over time — there's a search filter for power users
 * with hundreds of processes.
 */
export function CategoryEditor() {
  const { t } = useTranslation();
  const [rows, setRows] = useState<AppRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const ov = await getCategoryOverrides();
      const since = Math.floor(Date.now() / 1000) - LOOKBACK_DAYS * 86400;
      const usage = await getAppUsage(since);
      if (cancelled) return;
      setRows(buildRows(usage, ov));
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAssign = async (process: string, cat: Category) => {
    await setCategoryOverride(process, cat);
    setRows((prev) =>
      prev.map((r) =>
        r.process === process ? { ...r, category: cat, customised: true } : r,
      ),
    );
  };

  const handleReset = async (process: string) => {
    await clearCategoryOverride(process);
    setRows((prev) =>
      prev.map((r) =>
        r.process === process
          ? { ...r, category: categoryForProcess(process), customised: false }
          : r,
      ),
    );
  };

  const visible = rows.filter(
    (r) => !filter || r.process.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <div className="py-3 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          className="eg-input flex-1"
          placeholder={t("settings.rows.categorySearch")}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <span className="text-[10px]" style={{ color: "var(--eg-muted)" }}>
          {visible.length} / {rows.length}
        </span>
      </div>

      {loading && (
        <div className="text-[11px] py-3" style={{ color: "var(--eg-muted)" }}>
          {t("common.loading")}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <div className="text-[11px] py-2" style={{ color: "var(--eg-muted)" }}>
          {t("settings.rows.categoryEmpty")}
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="cat-editor-list">
          {visible.map((row) => (
            <div key={row.process} className="cat-editor-row">
              <span
                className="cat-dot"
                style={{ background: CATEGORY_COLORS[row.category] }}
              />
              <span className="cat-process">{row.process}</span>
              <span className="cat-time">{formatMin(row.totalSec)}</span>
              <select
                className="eg-input cat-select"
                value={row.category}
                onChange={(e) => handleAssign(row.process, e.target.value as Category)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {t(`category.${c}`)}
                  </option>
                ))}
              </select>
              <button
                className="cat-reset"
                disabled={!row.customised}
                onClick={() => handleReset(row.process)}
                title={t("settings.rows.categoryReset")}
              >
                <RotateCcw size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function buildRows(
  usage: { process: string; totalSec: number }[],
  overrides: Map<string, string>,
): AppRow[] {
  return usage.map((u) => {
    const override = overrides.get(u.process.toLowerCase());
    return {
      process: u.process,
      totalSec: u.totalSec,
      category: categoryForProcess(u.process, override),
      customised: !!override,
    };
  });
}

function formatMin(sec: number): string {
  const m = Math.round(sec / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r === 0 ? `${h}h` : `${h}h${r}m`;
  }
  return `${m}m`;
}
