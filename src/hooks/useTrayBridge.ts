import { useEffect } from "react";
import { useTimerStore } from "../stores/timerStore";

/**
 * Bridges Tauri tray-emitted events to the timer store.
 * No-ops when not running inside a Tauri webview (e.g. plain `vite dev`).
 */
export function useTrayBridge(onNavigate: (page: string) => void) {
  const setState = useTimerStore((s) => s.setState);
  const startBreak = useTimerStore((s) => s.startBreak);

  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;

    let unlistenFns: Array<() => void> = [];
    let cancelled = false;

    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        const u1 = await listen("tray://pause-toggle", () => {
          const cur = useTimerStore.getState().state;
          setState(cur === "active" ? "paused" : "active");
        });
        const u2 = await listen("tray://break-now", () => startBreak());
        const u3 = await listen<string>("nav://goto", (e) => onNavigate(e.payload));
        const u4 = await listen<number>("tray://break-custom", (e) => {
          const seconds = Number(e.payload);
          if (Number.isFinite(seconds) && seconds > 0) {
            useTimerStore.getState().startCustomBreak(seconds);
          }
        });
        if (cancelled) {
          u1();
          u2();
          u3();
          u4();
          return;
        }
        unlistenFns = [u1, u2, u3, u4];
      } catch {
        /* runtime not available */
      }
    })();

    return () => {
      cancelled = true;
      unlistenFns.forEach((fn) => fn());
    };
  }, [setState, startBreak, onNavigate]);
}
