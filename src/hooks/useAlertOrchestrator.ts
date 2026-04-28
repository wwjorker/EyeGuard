import { useCallback, useEffect, useRef, useState } from "react";
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
  toastVisible: boolean;
  lightVisible: boolean;
  acceptToast: () => void;
  dismissToast: () => void;
  dismissLight: () => void;
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

  const [toastVisible, setToastVisible] = useState(false);
  const [lightVisible, setLightVisible] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    if (state !== "active") {
      firedRef.current = false;
      return;
    }
    if (remaining > 0) return;
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
        // Pop the main window if it's hidden in the tray so the user
        // can actually see the toast.
        await ensureMainWindowVisible();
        setToastVisible(true);
        playBeep("medium", soundEnabled, soundVolume);
        return;
      }
      // light: native notification (often eaten on Windows for unsigned dev
      // builds) plus an in-app top-right pill, so the user always sees
      // *something*. Work timer keeps going.
      void fireNativeNotification();
      await ensureMainWindowVisible();
      setLightVisible(true);
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

  // These are wrapped in useCallback so the AlertToast useEffect dep
  // array stays stable — otherwise a new function each parent render
  // (every 1s tick) keeps resetting the auto-dismiss timeout and the
  // toast never closes.
  const acceptToast = useCallback(() => {
    setToastVisible(false);
    startBreak();
  }, [startBreak]);

  const dismissToast = useCallback(() => {
    setToastVisible(false);
    useTimerStore.setState({ remainingSec: 5 * 60 });
  }, []);

  const dismissLight = useCallback(() => setLightVisible(false), []);

  const fireTest = () => {
    primeAudio();
    if (alertLevel === "hard") {
      startBreak();
      playBeep("hard", soundEnabled, soundVolume);
    } else if (alertLevel === "medium") {
      setToastVisible(true);
      playBeep("medium", soundEnabled, soundVolume);
    } else {
      void fireNativeNotification();
      setLightVisible(true);
      playBeep("light", soundEnabled, soundVolume);
    }
  };

  // Publish the test trigger so the Settings page can call it.
  useEffect(() => {
    useAlertCommander.getState().setFireTest(fireTest);
    // recreated each render — that's fine, it just refreshes the captured closure
    // eslint-disable-next-line react-hooks/exhaustive-deps
  });

  return { toastVisible, lightVisible, acceptToast, dismissToast, dismissLight, fireTest };
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

/**
 * Pop the main window out of the tray and bring it to the front so the
 * user can see the alert toast. Quietly no-ops outside Tauri.
 */
async function ensureMainWindowVisible() {
  if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    const win = getCurrentWindow();
    await win.show();
    await win.unminimize();
    await win.setFocus();
  } catch {
    /* ignore */
  }
}

const normalize = (s: string) => s.trim().toLowerCase().replace(/\.exe$/, "");

async function fireNativeNotification() {
  if (typeof window === "undefined") return;
  if ("__TAURI_INTERNALS__" in window) {
    try {
      const mod = await import("@tauri-apps/plugin-notification");
      const granted =
        (await mod.isPermissionGranted()) || (await mod.requestPermission()) === "granted";
      if (granted) {
        mod.sendNotification({ title: "EyeGuard", body: "Time to look away — quick eye break!" });
      }
      return;
    } catch {
      /* ignore */
    }
  }
  if (typeof Notification !== "undefined") {
    try {
      if (Notification.permission === "default") await Notification.requestPermission();
      if (Notification.permission === "granted") {
        new Notification("EyeGuard", { body: "Time to look away — quick eye break!" });
      }
    } catch {
      /* ignore */
    }
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
