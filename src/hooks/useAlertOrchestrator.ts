import { useEffect, useRef, useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useTimerStore } from "../stores/timerStore";

export interface AlertOrchestrator {
  toastVisible: boolean;
  acceptToast: () => void;
  dismissToast: () => void;
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
        playBeep(soundEnabled, soundVolume);
        return;
      }
      if (alertLevel === "medium") {
        setToastVisible(true);
        playBeep(soundEnabled, soundVolume);
        return;
      }
      void fireNativeNotification();
      playBeep(soundEnabled, soundVolume);
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

  const acceptToast = () => {
    setToastVisible(false);
    startBreak();
  };

  const dismissToast = () => {
    setToastVisible(false);
    useTimerStore.setState({ remainingSec: 5 * 60 });
  };

  return { toastVisible, acceptToast, dismissToast };
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

function playBeep(enabled: boolean, volume: number) {
  if (!enabled) return;
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(660, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
    const v = Math.max(0, Math.min(0.4, volume / 250));
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(v, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
    osc.onended = () => ctx.close();
  } catch {
    /* ignore */
  }
}
