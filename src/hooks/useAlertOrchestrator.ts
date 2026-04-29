import { useCallback, useEffect, useRef } from "react";
import { create } from "zustand";
import { useSettingsStore } from "../stores/settingsStore";
import { useTimerStore } from "../stores/timerStore";

interface AlertCommander {
  fireTest: () => void;
  setFireTest: (fn: () => void) => void;
}

/**
 * Lightweight bridge so any component (e.g. SettingsPage) can request
 * the orchestrator to fire a test alert without prop-drilling.
 */
export const useAlertCommander = create<AlertCommander>((set) => ({
  fireTest: () => {},
  setFireTest: (fn) => set({ fireTest: fn }),
}));

export interface AlertOrchestrator {
  fireTest: () => void;
}

export function useAlertOrchestrator(): AlertOrchestrator {
  const remaining = useTimerStore((s) => s.remainingSec);
  const state = useTimerStore((s) => s.state);
  const startBreak = useTimerStore((s) => s.startBreak);
  const resetCycle = useTimerStore((s) => s.resetCycle);
  const noteSnooze = useTimerStore((s) => s.noteSnooze);

  const alertLevel = useSettingsStore((s) => s.alertLevel);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const soundVolume = useSettingsStore((s) => s.soundVolume);
  const smartSnooze = useSettingsStore((s) => s.smartSnoozeEnabled);
  const snoozeDur = useSettingsStore((s) => s.snoozeDurationSec);
  const snoozeMax = useSettingsStore((s) => s.snoozeMaxCount);
  const dndWhitelist = useSettingsStore((s) => s.dndWhitelist);

  const firedRef = useRef(false);

  // Listen for action events coming back from the notification window
  // (e.g. user clicked "Start break" in the medium toast).
  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
    let off: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        off = await listen<{ action: "accept" | "later" | "dismiss" }>(
          "notification://action",
          (e) => {
            const action = e.payload?.action;
            if (action === "accept") {
              startBreak();
            } else if (action === "later") {
              // Push the alert back by min(5 minutes, current work interval)
              // so testing with very short cycles isn't drowned in 5-min snoozes.
              const work = useTimerStore.getState().workIntervalSec;
              const snooze = Math.min(5 * 60, Math.max(15, work));
              useTimerStore.setState({ remainingSec: snooze });
            }
          },
        );
      } catch {
        /* ignore */
      }
      if (cancelled) off?.();
    })();
    return () => {
      cancelled = true;
      off?.();
    };
  }, [startBreak]);

  // Hide the OS-level notification window when the inner UI says it's done.
  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
    let off: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        off = await listen("notification://done", () => {
          void hideNotificationWindow();
        });
      } catch {
        /* ignore */
      }
      if (cancelled) off?.();
    })();
    return () => {
      cancelled = true;
      off?.();
    };
  }, []);

  // Drive the dedicated `break` window from the timer state. Whenever the
  // store transitions into "break", show the window with the current
  // duration and break kind. Whenever it leaves "break", hide it.
  useEffect(() => {
    let prevState = useTimerStore.getState().state;
    const unsub = useTimerStore.subscribe((s) => {
      if (s.state === "break" && prevState !== "break") {
        const settings = useSettingsStore.getState();
        const duration = s.currentBreakKind === "long" ? s.longBreakSec : s.breakDurationSec;
        void showBreakWindow({
          duration,
          kind: s.currentBreakKind,
          strict: settings.strictMode,
        });
      } else if (s.state !== "break" && prevState === "break") {
        void hideBreakWindow();
      }
      prevState = s.state;
    });
    return unsub;
  }, []);

  // Listen for break-end events from the break window and close out the
  // break in the main timer store.
  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
    let off: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        off = await listen<{ skipped: boolean }>("break://end", (e) => {
          const skipped = e.payload?.skipped ?? false;
          useTimerStore.getState().endBreak(skipped);
        });
      } catch {
        /* ignore */
      }
      if (cancelled) off?.();
    })();
    return () => {
      cancelled = true;
      off?.();
    };
  }, []);

  useEffect(() => {
    // Reset the "already fired" latch any time the timer is back in a
    // healthy state — either we're not actively counting down, or the
    // remaining time is positive again (after a resetCycle / snooze).
    // Without this reset, a light alert (which leaves state="active")
    // would lock the latch on, and the next cycle hitting 0 would
    // silently no-op.
    if (state !== "active" || remaining > 0) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current) return;
    firedRef.current = true;

    const decideAndFire = async () => {
      const fg = await getForeground();

      // DND whitelist: silently push the alert back without burning a snooze.
      if (fg && dndWhitelist.some((p) => normalize(p) === normalize(fg.process))) {
        useTimerStore.setState({ remainingSec: 60 });
        firedRef.current = false;
        return;
      }

      const snoozeCount = useTimerStore.getState().snoozeUsed;
      const canSnooze = smartSnooze && snoozeCount < snoozeMax;
      const shouldSnooze = canSnooze && (fg?.fullscreen ?? false);

      if (shouldSnooze) {
        noteSnooze();
        useTimerStore.setState({ remainingSec: snoozeDur });
        firedRef.current = false;
        return;
      }

      if (alertLevel === "hard") {
        startBreak();
        playBeep("hard", soundEnabled, soundVolume);
        return;
      }
      if (alertLevel === "medium") {
        await showNotificationWindow({
          variant: "medium",
          streakSec: useTimerStore.getState().currentStreakSec,
        });
        playBeep("medium", soundEnabled, soundVolume);
        return;
      }
      // light: just our own notification window (Windows native would be
      // a duplicate, since we already render the same content with more
      // control)
      await showNotificationWindow({
        variant: "light",
        streakSec: useTimerStore.getState().currentStreakSec,
      });
      playBeep("light", soundEnabled, soundVolume);
      resetCycle();
    };

    void decideAndFire();
  }, [
    remaining,
    state,
    alertLevel,
    soundEnabled,
    soundVolume,
    smartSnooze,
    snoozeDur,
    snoozeMax,
    dndWhitelist,
    noteSnooze,
    startBreak,
    resetCycle,
  ]);

  const fireTest = useCallback(() => {
    primeAudio();
    if (alertLevel === "hard") {
      startBreak();
      playBeep("hard", soundEnabled, soundVolume);
    } else if (alertLevel === "medium") {
      void showNotificationWindow({
        variant: "medium",
        streakSec: useTimerStore.getState().currentStreakSec,
      });
      playBeep("medium", soundEnabled, soundVolume);
    } else {
      void showNotificationWindow({
        variant: "light",
        streakSec: useTimerStore.getState().currentStreakSec,
      });
      playBeep("light", soundEnabled, soundVolume);
    }
  }, [alertLevel, soundEnabled, soundVolume, startBreak]);

  // Publish the test trigger so the Settings page can call it.
  useEffect(() => {
    useAlertCommander.getState().setFireTest(fireTest);
  }, [fireTest]);

  return { fireTest };
}

interface ForegroundInfo {
  process: string;
  title: string;
  fullscreen: boolean;
}

async function getForeground(): Promise<ForegroundInfo | null> {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return null;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return (await invoke("current_foreground")) as ForegroundInfo | null;
  } catch {
    return null;
  }
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\.exe$/, "");

interface NotificationPayload {
  variant: "light" | "medium";
  streakSec: number;
}

let notifSeq = 0;

/**
 * Position the dedicated notification window at the bottom-right of the
 * primary monitor, then show it and emit the payload. Falls back to a
 * silent no-op outside the Tauri runtime.
 */
async function showNotificationWindow(payload: NotificationPayload) {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
  try {
    const winMod = await import("@tauri-apps/api/window");
    const { emit } = await import("@tauri-apps/api/event");
    const win = await winMod.Window.getByLabel("notification");
    if (!win) {
      console.warn("[eyeguard] notification window not found");
      return;
    }

    const monitor = await winMod.primaryMonitor();
    if (monitor) {
      const scale = monitor.scaleFactor || 1;
      const sizeWidth = monitor.size.width / scale;
      const sizeHeight = monitor.size.height / scale;
      const wWidth = 340;
      const wHeight = 130;
      const x = Math.max(0, sizeWidth - wWidth - 16);
      const y = Math.max(0, sizeHeight - wHeight - 56); // 56px above taskbar
      await win.setPosition(new winMod.LogicalPosition(x, y));
    }

    await win.show();
    // Always-on-top is already declared in conf.json but reaffirming after
    // show helps Windows respect it from the very first frame.
    try {
      await win.setAlwaysOnTop(true);
    } catch {
      /* ignore */
    }

    notifSeq += 1;
    await emit("notification://show", { ...payload, id: notifSeq });
  } catch (err) {
    console.warn("[eyeguard] failed to show notification window", err);
  }
}

async function hideNotificationWindow() {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
  try {
    const { Window } = await import("@tauri-apps/api/window");
    const win = await Window.getByLabel("notification");
    if (win) await win.hide();
  } catch {
    /* ignore */
  }
}

interface BreakPayload {
  duration: number;
  kind: "long" | "short" | "free";
  strict: boolean;
}

/**
 * Bring up the dedicated fullscreen break window. Always-on-top, no
 * decorations, and (because it's its own window) it works regardless of
 * whether the main window is hidden, minimised, or behind something else.
 */
async function showBreakWindow(payload: BreakPayload) {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
  try {
    const winMod = await import("@tauri-apps/api/window");
    const { emit } = await import("@tauri-apps/api/event");
    const win = await winMod.Window.getByLabel("break");
    if (!win) {
      console.warn("[eyeguard] break window not found");
      return;
    }
    // Show first so the OS gives us the dimensions we need.
    await win.show();
    try {
      await win.setFullscreen(true);
    } catch {
      /* ignore — fall back to declared size */
    }
    await win.setAlwaysOnTop(true);
    await win.setFocus();
    // Fire the show event so the React side starts its countdown. Use
    // setTimeout(0) so listeners attached on first paint catch it.
    setTimeout(() => {
      void emit("break://show", payload);
    }, 50);
  } catch (err) {
    console.warn("[eyeguard] failed to show break window", err);
  }
}

async function hideBreakWindow() {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
  try {
    const winMod = await import("@tauri-apps/api/window");
    const win = await winMod.Window.getByLabel("break");
    if (!win) return;
    try {
      await win.setFullscreen(false);
    } catch {
      /* ignore */
    }
    await win.hide();
  } catch {
    /* ignore */
  }
}


export type BeepTier = "light" | "medium" | "hard";

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (sharedCtx) return sharedCtx;
  const Ctor =
    typeof window === "undefined"
      ? null
      : window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    sharedCtx = new Ctor();
    return sharedCtx;
  } catch {
    return null;
  }
}

/**
 * Web Audio in Webview2 starts in `suspended` state and stays muted until
 * a user gesture has resumed it. Calling this once on app boot from any
 * click handler primes the shared context so later beeps actually play.
 */
export function primeAudio() {
  const ctx = getCtx();
  if (ctx && ctx.state === "suspended") {
    void ctx.resume();
  }
}

export function playBeep(tier: BeepTier, enabled: boolean, volume: number) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  // Resume in case the gesture priming hasn't happened yet — some beeps
  // are scheduled by timers, not user clicks.
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  // Each tier gets a distinct shape: light = single soft chime, medium =
  // warmer two-tone, hard = double pulse with a louder envelope.
  const profiles: Record<BeepTier, { freqs: [number, number][]; gainScale: number }> = {
    light: { freqs: [[760, 920]], gainScale: 0.55 },
    medium: { freqs: [[620, 820]], gainScale: 0.85 },
    hard: {
      freqs: [
        [660, 880],
        [880, 660],
      ],
      gainScale: 1,
    },
  };
  const profile = profiles[tier];
  const baseGain = Math.max(0, Math.min(0.5, volume / 200)) * profile.gainScale;

  try {
    profile.freqs.forEach(([startHz, endHz], i) => {
      const t0 = ctx.currentTime + i * 0.2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(startHz, t0);
      osc.frequency.exponentialRampToValueAtTime(endHz, t0 + 0.18);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(baseGain, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.45);
      osc.start(t0);
      osc.stop(t0 + 0.5);
    });
  } catch {
    /* ignore */
  }
}
