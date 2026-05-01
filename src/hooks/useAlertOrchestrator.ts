import { useCallback, useEffect, useRef } from "react";
import { create } from "zustand";
import { useSettingsStore } from "../stores/settingsStore";
import { useTimerStore } from "../stores/timerStore";
import { isGameProcess, isMeetingProcess } from "../lib/dndPresets";

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

export type CelebrationKind = "cycle" | "milestone";

interface CelebrationState {
  /** monotonically increasing token — components key off this to remount */
  token: number;
  kind: CelebrationKind;
  fire: (kind: CelebrationKind) => void;
}

/**
 * Tiny pub-sub for the in-window confetti burst. The orchestrator calls
 * `fire()` when a celebration moment lands; the confetti component
 * subscribes and re-mounts when `token` changes.
 */
export const useCelebrationStore = create<CelebrationState>((set) => ({
  token: 0,
  kind: "cycle",
  fire: (kind) => set((s) => ({ token: s.token + 1, kind })),
}));

/**
 * Returns the i18n suffix ("milestone1" | "milestone5" | "milestone10")
 * for the day's nth completed break, or null if no milestone landed.
 */
function milestoneFor(n: number): "milestone1" | "milestone5" | "milestone10" | null {
  if (n === 1) return "milestone1";
  if (n === 5) return "milestone5";
  if (n === 10) return "milestone10";
  return null;
}

/**
 * Returns an indexed i18n key like `follow.drinkTitleVariants.2` so the
 * notification window can render one of N copy variants instead of the
 * same line every time.
 */
const VARIANT_COUNT = 4;
function pickVariant(prefix: string): string {
  const i = Math.floor(Math.random() * VARIANT_COUNT);
  return `${prefix}.${i}`;
}

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
  const dndMeetings = useSettingsStore((s) => s.dndMeetings);
  const dndGames = useSettingsStore((s) => s.dndGames);

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
  // break in the main timer store. Also queue post-break health nudges
  // (drink + posture), pomodoro-cycle celebration, and daily milestones.
  // Routes everything through the dedicated notification window so it
  // remains visible while the main window is hidden in the tray.
  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
    let off: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        off = await listen<{ skipped: boolean }>("break://end", async (e) => {
          const skipped = e.payload?.skipped ?? false;
          const ts = useTimerStore.getState();
          const settings = useSettingsStore.getState();
          const wasLongBreak = ts.currentBreakKind === "long";
          const completedAfter = ts.completedBreaks + (skipped ? 0 : 1);

          ts.endBreak(skipped);

          if (skipped) return;

          // Soft chime acknowledging the break just ended. Independent of
          // the celebration / followup decision below.
          playBreakDone(settings.soundEnabled, settings.soundVolume);

          // Hero moment: completed a full pomodoro cycle (only fires when
          // pomodoro mode is on and the break that just ended was a long
          // one). Plays the celebratory bell + an in-window confetti burst.
          if (wasLongBreak && settings.pomodoroEnabled) {
            void showNotificationWindow({ variant: "celebration" });
            playCelebration(settings.soundEnabled, settings.soundVolume);
            useCelebrationStore.getState().fire("cycle");
            return;
          }

          // Daily milestones: 1st / 5th / 10th break of the day. Pick
          // pomodoro-flavoured copy when pomodoro mode is on.
          const milestoneKey = milestoneFor(completedAfter);
          if (milestoneKey) {
            const flavour = settings.pomodoroEnabled ? "Pomo" : "";
            void showNotificationWindow({
              variant: "celebration",
              titleKey: `celebrate.${milestoneKey}${flavour}Title`,
              bodyKey: `celebrate.${milestoneKey}${flavour}Body`,
            });
            useCelebrationStore.getState().fire("milestone");
            return;
          }

          // Don't tack a drink / posture nudge onto the user when they're
          // back in a meeting / game / whitelisted app — same DND rules
          // as the pre-break alert.
          const fg = await getForeground();
          if (fg) {
            const proc = normalize(fg.process);
            const inDnd =
              settings.dndWhitelist.some((p) => normalize(p) === proc) ||
              (settings.dndMeetings && isMeetingProcess(fg.process)) ||
              (settings.dndGames && (isGameProcess(fg.process) || fg.fullscreen === true));
            if (inDnd) return;
          }

          // Drink (50% probability) — a fresh random copy variant per fire
          if (settings.drinkReminder && Math.random() < 0.5) {
            void showNotificationWindow({
              variant: "drink",
              titleKey: pickVariant("follow.drinkTitleVariants"),
              bodyKey: pickVariant("follow.drinkBodyVariants"),
            });
            return;
          }
          // Posture (every 3rd break)
          if (settings.postureReminder && completedAfter > 0 && completedAfter % 3 === 0) {
            void showNotificationWindow({
              variant: "posture",
              titleKey: pickVariant("follow.postureTitleVariants"),
              bodyKey: pickVariant("follow.postureBodyVariants"),
            });
          }
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

      // DND: silently push the alert back without burning a snooze.
      // Three sources of "do not disturb": custom whitelist, built-in
      // meeting list, built-in game list (+ fullscreen heuristic).
      if (fg) {
        const proc = normalize(fg.process);
        const inCustom = dndWhitelist.some((p) => normalize(p) === proc);
        const inMeeting = dndMeetings && isMeetingProcess(fg.process);
        const inGame =
          dndGames && (isGameProcess(fg.process) || fg.fullscreen === true);
        if (inCustom || inMeeting || inGame) {
          useTimerStore.setState({ remainingSec: 60 });
          firedRef.current = false;
          return;
        }
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
    dndMeetings,
    dndGames,
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
  variant: "light" | "medium" | "drink" | "posture" | "celebration";
  streakSec?: number;
  titleKey?: string;
  bodyKey?: string;
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

/**
 * Bell-like additive synthesis: stack a sine fundamental with a few
 * inharmonic partials, each with its own decay envelope. Sounds far less
 * "8-bit beep" than a single sine sweep.
 */
function playChime(
  ctx: AudioContext,
  freq: number,
  amp: number,
  duration: number,
  startOffset = 0,
) {
  const t0 = ctx.currentTime + startOffset;
  // Inharmonic ratios approximate the partials of a tubular bell.
  const partials: Array<{ ratio: number; gain: number; decay: number }> = [
    { ratio: 1.0, gain: 1.0, decay: 1.0 },
    { ratio: 2.0, gain: 0.45, decay: 0.65 },
    { ratio: 2.4, gain: 0.28, decay: 0.5 },
    { ratio: 3.0, gain: 0.18, decay: 0.4 },
    { ratio: 4.2, gain: 0.1, decay: 0.28 },
  ];
  for (const p of partials) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * p.ratio, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(amp * p.gain, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + duration * p.decay);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.05);
  }
}

export function playBeep(tier: BeepTier, enabled: boolean, volume: number) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const baseGain = Math.max(0, Math.min(0.4, volume / 250));

  try {
    if (tier === "light") {
      // Single bright chime — like a wind chime tap.
      playChime(ctx, 880, baseGain * 0.6, 0.9);
    } else if (tier === "medium") {
      // Warmer two-tone (perfect 4th up).
      playChime(ctx, 660, baseGain * 0.8, 1.1);
      playChime(ctx, 880, baseGain * 0.6, 0.95, 0.18);
    } else {
      // Hard: ascending three-note bell — clearly the most assertive.
      playChime(ctx, 587, baseGain * 0.95, 1.1);
      playChime(ctx, 740, baseGain * 0.85, 1.05, 0.2);
      playChime(ctx, 880, baseGain * 0.95, 1.2, 0.4);
    }
  } catch {
    /* ignore */
  }
}

/**
 * A bright "well-done" arpeggio used for the long-break / cycle-complete
 * celebration. Three quick ascending bells in a major triad.
 */
export function playCelebration(enabled: boolean, volume: number) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  const g = Math.max(0, Math.min(0.4, volume / 250));
  try {
    // C5 - E5 - G5 - C6 (major triad + octave)
    playChime(ctx, 523, g * 0.85, 1.1);
    playChime(ctx, 659, g * 0.78, 1.0, 0.12);
    playChime(ctx, 784, g * 0.78, 1.05, 0.24);
    playChime(ctx, 1047, g * 0.85, 1.3, 0.42);
  } catch {
    /* ignore */
  }
}

/**
 * Soft descending two-note chime when a break naturally finishes — the
 * "gentle tap on the shoulder" that says you can resume.
 */
export function playBreakDone(enabled: boolean, volume: number) {
  if (!enabled) return;
  const ctx = getCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  const g = Math.max(0, Math.min(0.4, volume / 250));
  try {
    playChime(ctx, 784, g * 0.6, 0.8); // G5
    playChime(ctx, 523, g * 0.55, 0.95, 0.18); // C5
  } catch {
    /* ignore */
  }
}
