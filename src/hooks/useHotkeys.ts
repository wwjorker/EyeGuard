import { useEffect, useRef } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useTimerStore } from "../stores/timerStore";

/**
 * Registers the user's global shortcuts (default: Ctrl+Shift+P pause/resume,
 * Ctrl+Shift+B break-now). Re-registers whenever the bindings change.
 *
 * Pure browser fallback: also wires the same combos via window keydown so the
 * timer can be controlled while EyeGuard's window has focus during dev.
 */
export function useHotkeys() {
  const pauseBinding = useSettingsStore((s) => s.hotkeyPause);
  const breakBinding = useSettingsStore((s) => s.hotkeyBreak);

  const lastRegistered = useRef<string[]>([]);

  // -------- Tauri global path --------
  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
    let cancelled = false;

    (async () => {
      try {
        const { register, unregisterAll } = await import("@tauri-apps/plugin-global-shortcut");
        // Drop previous ones
        try {
          await unregisterAll();
        } catch {
          /* ignore */
        }
        if (cancelled) return;

        const bindings: Array<[string, () => void]> = [
          [
            pauseBinding,
            () => {
              const cur = useTimerStore.getState().state;
              useTimerStore.getState().setState(cur === "active" ? "paused" : "active");
            },
          ],
          [
            breakBinding,
            () => {
              useTimerStore.getState().startBreak();
            },
          ],
        ];

        const registered: string[] = [];
        for (const [combo, fn] of bindings) {
          if (!combo) continue;
          try {
            await register(combo, fn);
            registered.push(combo);
          } catch (err) {
            console.warn(`[eyeguard] failed to register ${combo}`, err);
          }
        }
        lastRegistered.current = registered;
      } catch (err) {
        console.warn("[eyeguard] global shortcut plugin unavailable", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pauseBinding, breakBinding]);

  // -------- Window-level fallback --------
  useEffect(() => {
    const matches = (e: KeyboardEvent, combo: string) => {
      const parts = combo.toLowerCase().split("+").map((p) => p.trim());
      const hasCtrl = parts.includes("ctrl");
      const hasShift = parts.includes("shift");
      const hasAlt = parts.includes("alt");
      const hasMeta = parts.includes("meta") || parts.includes("cmd") || parts.includes("super");
      const last = parts[parts.length - 1];
      return (
        e.ctrlKey === hasCtrl &&
        e.shiftKey === hasShift &&
        e.altKey === hasAlt &&
        e.metaKey === hasMeta &&
        e.key.toLowerCase() === last
      );
    };

    const handler = (e: KeyboardEvent) => {
      if (matches(e, pauseBinding)) {
        e.preventDefault();
        const cur = useTimerStore.getState().state;
        useTimerStore.getState().setState(cur === "active" ? "paused" : "active");
      } else if (matches(e, breakBinding)) {
        e.preventDefault();
        useTimerStore.getState().startBreak();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pauseBinding, breakBinding]);
}
