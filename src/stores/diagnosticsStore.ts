import { create } from "zustand";

export type LogLevel = "error" | "warn" | "info";

export interface LogEntry {
  id: number;
  ts: number;
  level: LogLevel;
  msg: string;
}

interface DiagState {
  logs: LogEntry[];
  log: (level: LogLevel, msg: string) => void;
  clear: () => void;
}

let nextId = 1;
const MAX_LOGS = 40;

export const useDiagnosticsStore = create<DiagState>((set) => ({
  logs: [],
  log: (level, msg) =>
    set((s) => ({
      logs: [
        ...s.logs.slice(-(MAX_LOGS - 1)),
        { id: nextId++, ts: Date.now(), level, msg: msg.slice(0, 600) },
      ],
    })),
  clear: () => set({ logs: [] }),
}));

let installed = false;

/**
 * Wires `console.error / console.warn`, `window.error`, and
 * `unhandledrejection` to the diagnostics store so the in-app
 * diagnostics panel can display the last few problems without the
 * user having to open dev tools.
 */
export function installDiagnosticsHooks() {
  if (installed) return;
  installed = true;

  const log = useDiagnosticsStore.getState().log;

  const origError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    log("error", args.map(stringify).join(" "));
    origError(...args);
  };
  const origWarn = console.warn.bind(console);
  console.warn = (...args: unknown[]) => {
    log("warn", args.map(stringify).join(" "));
    origWarn(...args);
  };

  if (typeof window !== "undefined") {
    window.addEventListener("error", (e) => {
      const detail = e.error instanceof Error ? `${e.error.message}` : e.message;
      log("error", `[window.error] ${detail}`);
    });
    window.addEventListener("unhandledrejection", (e) => {
      const reason = e.reason instanceof Error ? e.reason.message : String(e.reason);
      log("error", `[promise] ${reason}`);
    });
  }
}

function stringify(v: unknown): string {
  if (v instanceof Error) return v.message;
  if (typeof v === "object") {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
}
