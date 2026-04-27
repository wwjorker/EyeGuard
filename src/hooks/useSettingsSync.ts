import { useEffect } from "react";
import i18n from "i18next";
import { useSettingsStore } from "../stores/settingsStore";
import { useTimerStore } from "../stores/timerStore";
import { purgeOlderThan } from "../lib/db";

/**
 * Propagates settings changes to: (1) the timer store work/break durations,
 * (2) the Rust monitor's idle threshold (when running under Tauri),
 * (3) the document `:root` theme class.
 */
export function useSettingsSync() {
  const workIntervalSec = useSettingsStore((s) => s.workIntervalSec);
  const breakDurationSec = useSettingsStore((s) => s.breakDurationSec);
  const idleThresholdSec = useSettingsStore((s) => s.idleThresholdSec);
  const theme = useSettingsStore((s) => s.theme);
  const pomodoroEnabled = useSettingsStore((s) => s.pomodoroEnabled);
  const pomodoroWorkSec = useSettingsStore((s) => s.pomodoroWorkSec);
  const pomodoroShortBreakSec = useSettingsStore((s) => s.pomodoroShortBreakSec);
  const pomodoroLongBreakSec = useSettingsStore((s) => s.pomodoroLongBreakSec);
  const pomodoroLongInterval = useSettingsStore((s) => s.pomodoroLongInterval);
  const dataRetentionDays = useSettingsStore((s) => s.dataRetentionDays);
  const language = useSettingsStore((s) => s.language);
  const autostart = useSettingsStore((s) => s.autostart);

  // Timer mode reflects pomodoro toggle
  useEffect(() => {
    useTimerStore.getState().setMode(pomodoroEnabled ? "pomodoro" : "free");
  }, [pomodoroEnabled]);

  // Timer durations come from either the free-mode or pomodoro settings.
  useEffect(() => {
    const work = pomodoroEnabled ? pomodoroWorkSec : workIntervalSec;
    useTimerStore.getState().setWorkInterval(work);
  }, [pomodoroEnabled, pomodoroWorkSec, workIntervalSec]);

  useEffect(() => {
    const brk = pomodoroEnabled ? pomodoroShortBreakSec : breakDurationSec;
    useTimerStore.getState().setBreakDuration(brk);
  }, [pomodoroEnabled, pomodoroShortBreakSec, breakDurationSec]);

  useEffect(() => {
    useTimerStore.getState().setLongBreak(pomodoroLongBreakSec);
  }, [pomodoroLongBreakSec]);

  useEffect(() => {
    useTimerStore.getState().setLongBreakInterval(pomodoroLongInterval);
  }, [pomodoroLongInterval]);

  // Roll off old footprint rows on launch + once a day.
  useEffect(() => {
    void purgeOlderThan(dataRetentionDays);
    const id = window.setInterval(() => purgeOlderThan(dataRetentionDays), 24 * 3600 * 1000);
    return () => window.clearInterval(id);
  }, [dataRetentionDays]);

  // Push idle threshold to Rust
  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
    (async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("set_idle_threshold", { seconds: idleThresholdSec });
      } catch {
        /* not in tauri */
      }
    })();
  }, [idleThresholdSec]);

  // Theme
  useEffect(() => {
    const root = document.documentElement;
    const apply = (mode: "dark" | "light") => {
      root.classList.toggle("dark", mode === "dark");
      root.classList.toggle("light", mode === "light");
    };
    if (theme === "system") {
      const m = window.matchMedia("(prefers-color-scheme: light)");
      apply(m.matches ? "light" : "dark");
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? "light" : "dark");
      m.addEventListener("change", handler);
      return () => m.removeEventListener("change", handler);
    }
    apply(theme);
  }, [theme]);

  // i18n language
  useEffect(() => {
    void i18n.changeLanguage(language);
  }, [language]);

  // Autostart (registry/login item via tauri-plugin-autostart)
  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
    (async () => {
      try {
        const mod = await import("@tauri-apps/plugin-autostart");
        const enabled = await mod.isEnabled();
        if (autostart && !enabled) await mod.enable();
        if (!autostart && enabled) await mod.disable();
      } catch (err) {
        console.warn("[eyeguard] autostart toggle failed", err);
      }
    })();
  }, [autostart]);
}
