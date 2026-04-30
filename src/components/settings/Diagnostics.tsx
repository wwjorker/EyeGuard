import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Copy, Trash2 } from "lucide-react";
import { useDiagnosticsStore, type LogEntry } from "../../stores/diagnosticsStore";
import pkg from "../../../package.json";

interface SystemInfo {
  appVersion: string;
  dbPath: string | null;
  webview: string;
  inTauri: boolean;
}

const LEVEL_COLOR: Record<LogEntry["level"], string> = {
  error: "var(--eg-pink)",
  warn: "var(--eg-amber)",
  info: "var(--eg-purple)",
};

/**
 * In-app diagnostics panel: shows version + DB location + a rolling log
 * of captured errors / warnings so the user can include the relevant
 * context when filing bug reports without opening dev tools.
 */
export function Diagnostics() {
  const { t } = useTranslation();
  const logs = useDiagnosticsStore((s) => s.logs);
  const clearLogs = useDiagnosticsStore((s) => s.clear);
  const [info, setInfo] = useState<SystemInfo>({
    appVersion: pkg.version,
    dbPath: null,
    webview: typeof navigator !== "undefined" ? navigator.userAgent : "",
    inTauri: typeof window !== "undefined" && "__TAURI_INTERNALS__" in window,
  });

  useEffect(() => {
    if (!info.inTauri) return;
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const dbPath = await invoke<string>("get_db_path");
        setInfo((prev) => ({ ...prev, dbPath }));
      } catch (err) {
        console.warn("[diagnostics] failed to read db path", err);
      }
    })();
  }, [info.inTauri]);

  const copyAll = async () => {
    const lines = [
      `EyeGuard ${info.appVersion}`,
      `DB: ${info.dbPath ?? "(not in tauri)"}`,
      `Runtime: ${info.inTauri ? "Tauri webview" : "browser"}`,
      "",
      ...logs.map(formatLog),
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="diag-root">
      <div className="diag-grid">
        <div className="diag-cell">
          <div className="diag-label">{t("diag.version")}</div>
          <div className="diag-value">{info.appVersion}</div>
        </div>
        <div className="diag-cell">
          <div className="diag-label">{t("diag.runtime")}</div>
          <div className="diag-value">
            {info.inTauri ? "Tauri" : "Browser"}
          </div>
        </div>
        <div className="diag-cell" style={{ gridColumn: "1 / -1" }}>
          <div className="diag-label">{t("diag.dbPath")}</div>
          <div className="diag-value diag-mono">{info.dbPath ?? "—"}</div>
        </div>
      </div>

      <div className="diag-log-header">
        <span>
          {t("diag.recentLogs")}{" "}
          <span style={{ color: "var(--eg-faint)" }}>({logs.length})</span>
        </span>
        <span className="flex items-center gap-1">
          <button className="diag-tool" onClick={copyAll} title={t("diag.copy")}>
            <Copy size={11} />
          </button>
          <button
            className="diag-tool"
            onClick={clearLogs}
            disabled={logs.length === 0}
            title={t("diag.clear")}
          >
            <Trash2 size={11} />
          </button>
        </span>
      </div>

      {logs.length === 0 ? (
        <div className="diag-empty">{t("diag.empty")}</div>
      ) : (
        <ul className="diag-log-list">
          {[...logs].reverse().map((entry) => (
            <li key={entry.id} className="diag-log-row">
              <span className="diag-log-time">{formatTime(entry.ts)}</span>
              <span
                className="diag-log-level"
                style={{ color: LEVEL_COLOR[entry.level] }}
              >
                {entry.level}
              </span>
              <span className="diag-log-msg">{entry.msg}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
}

function formatLog(entry: LogEntry): string {
  return `${formatTime(entry.ts)} [${entry.level}] ${entry.msg}`;
}
