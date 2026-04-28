import { useEffect, useRef, useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useTimerStore } from "../stores/timerStore";

export interface AlertOrchestrator {
  toastVisible: boolean;
  lightVisible: boolean;
  acceptToast: () => void;
  dismissToast: () => void;
  dismissLight: () => void;
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
        setToastVisible(true);
        playBeep("medium", soundEnabled, soundVolume);
        return;
      }
      // light: native notification (often eaten on Windows for unsigned dev
      // builds) plus an in-app top-right pill, so the user always sees
      // *something*. Work timer keeps going.
      void fireNativeNotification();
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

  const acceptToast = () => {
    setToastVisible(false);
    startBreak();
  };

  const dismissToast = () => {
    setToastVisible(false);
    useTimerStore.setState({ remainingSec: 5 * 60 });
  };

  const dismissLight = () => setLightVisible(false);

  return { toastVisible, lightVisible, acceptToast, dismissToast, dismissLight };
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

type BeepTier = "light" | "medium" | "hard";

function playBeep(tier: BeepTier, enabled: boolean, volume: number) {
  if (!enabled) return;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();

    // Each tier gets a distinct ascending two-note shape: light = single
    // soft chime, medium = warmer two-tone, hard = double pulse.
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
    const baseGain = Math.max(0, Math.min(0.4, volume / 250)) * profile.gainScale;

    profile.freqs.forEach(([startHz, endHz], i) => {
      const t0 = ctx.currentTime + i * 0.18;
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
      if (i === profile.freqs.length - 1) {
        osc.onended = () => ctx.close();
      }
    });
  } catch {
    /* ignore */
  }
}
