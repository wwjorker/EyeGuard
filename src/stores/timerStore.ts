import { create } from "zustand";

export type TimerState = "active" | "paused" | "break" | "idle";
export type TimerMode = "free" | "pomodoro";
export type BreakKind = "short" | "long" | "free";

export interface TimerSnapshot {
  mode: TimerMode;
  state: TimerState;
  remainingSec: number;
  workIntervalSec: number;
  breakDurationSec: number;
  longBreakSec: number;
  longBreakInterval: number;
  pomodoroCount: number;     // completed work sessions in current cycle
  currentBreakKind: BreakKind;
  completedBreaks: number;
  skippedBreaks: number;
  longestStreakSec: number;
  currentStreakSec: number;
  todayScreenSec: number;
  healthScore: number;
  snoozeUsed: number;        // consecutive snoozes since last break
}

interface TimerStore extends TimerSnapshot {
  lastDayKey: string;
  setState: (state: TimerState) => void;
  setMode: (mode: TimerMode) => void;
  tick: () => void;
  startBreak: (kind?: BreakKind) => void;
  endBreak: (skipped: boolean) => void;
  resetCycle: () => void;
  setWorkInterval: (sec: number) => void;
  setBreakDuration: (sec: number) => void;
  setLongBreak: (sec: number) => void;
  setLongBreakInterval: (n: number) => void;
  bumpStreak: (deltaSec: number) => void;
  resetStreak: () => void;
  noteSnooze: () => void;
  resetSnooze: () => void;
}

const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

const DEFAULT_WORK_SEC = 20 * 60;
const DEFAULT_BREAK_SEC = 20;
const DEFAULT_LONG_BREAK_SEC = 15 * 60;
const DEFAULT_LONG_INTERVAL = 4;

export const useTimerStore = create<TimerStore>((set, get) => ({
  mode: "free",
  state: "active",
  remainingSec: DEFAULT_WORK_SEC,
  workIntervalSec: DEFAULT_WORK_SEC,
  breakDurationSec: DEFAULT_BREAK_SEC,
  longBreakSec: DEFAULT_LONG_BREAK_SEC,
  longBreakInterval: DEFAULT_LONG_INTERVAL,
  pomodoroCount: 0,
  currentBreakKind: "free",
  completedBreaks: 0,
  skippedBreaks: 0,
  longestStreakSec: 0,
  currentStreakSec: 0,
  todayScreenSec: 0,
  healthScore: 100,
  snoozeUsed: 0,
  lastDayKey: todayKey(),

  setState: (state) => set({ state }),

  setMode: (mode) =>
    set((s) => ({
      mode,
      remainingSec: s.workIntervalSec,
      pomodoroCount: 0,
      currentBreakKind: "free",
      state: "active",
    })),

  tick: () => {
    const s = get();

    // Roll the daily counters when the calendar day changes (covers an app
    // that was left running across midnight).
    const today = todayKey();
    if (today !== s.lastDayKey) {
      set({
        lastDayKey: today,
        todayScreenSec: 0,
        healthScore: 100,
        completedBreaks: 0,
        skippedBreaks: 0,
        longestStreakSec: 0,
      });
    }

    if (s.state === "break") {
      // Break-state tick only decrements the rest countdown — do not
      // accumulate streak / screen time.
      set({ remainingSec: Math.max(0, s.remainingSec - 1) });
      return;
    }
    if (s.state !== "active") return;
    const next = s.remainingSec - 1;
    const nextStreak = s.currentStreakSec + 1;
    set({
      remainingSec: Math.max(0, next),
      currentStreakSec: nextStreak,
      longestStreakSec: Math.max(s.longestStreakSec, nextStreak),
      todayScreenSec: s.todayScreenSec + 1,
    });
    // Note: actual break trigger is handled by useAlertOrchestrator so the
    // alert tier (light/medium/hard) is honoured.
  },

  startBreak: (kind?) => {
    const s = get();
    let breakKind: BreakKind = kind ?? "free";
    let duration = s.breakDurationSec;
    if (s.mode === "pomodoro" && !kind) {
      const nextCount = s.pomodoroCount + 1;
      if (nextCount % s.longBreakInterval === 0) {
        breakKind = "long";
        duration = s.longBreakSec;
      } else {
        breakKind = "short";
      }
      set({ pomodoroCount: nextCount });
    }
    set({
      state: "break",
      remainingSec: duration,
      currentBreakKind: breakKind,
      snoozeUsed: 0,
    });
  },

  endBreak: (skipped) =>
    set((s) => ({
      state: "active",
      remainingSec: s.workIntervalSec,
      completedBreaks: skipped ? s.completedBreaks : s.completedBreaks + 1,
      skippedBreaks: skipped ? s.skippedBreaks + 1 : s.skippedBreaks,
      currentStreakSec: 0,
      currentBreakKind: "free",
      healthScore: skipped ? Math.max(0, s.healthScore - 2) : Math.min(100, s.healthScore + 1),
    })),

  resetCycle: () =>
    set((s) => ({
      remainingSec: s.workIntervalSec,
      currentStreakSec: 0,
    })),

  setWorkInterval: (sec) =>
    set((s) => {
      // Only snap remainingSec to the new value if we haven't started
      // ticking the current cycle yet (i.e. it's exactly the previous
      // workIntervalSec). This avoids yanking the timer when the user
      // adjusts the slider mid-cycle.
      const fresh = s.remainingSec === s.workIntervalSec;
      return {
        workIntervalSec: sec,
        remainingSec: fresh ? sec : s.remainingSec,
      };
    }),

  setBreakDuration: (sec) => set({ breakDurationSec: sec }),
  setLongBreak: (sec) => set({ longBreakSec: sec }),
  setLongBreakInterval: (n) => set({ longBreakInterval: n }),

  bumpStreak: (deltaSec) =>
    set((s) => ({
      currentStreakSec: s.currentStreakSec + deltaSec,
      longestStreakSec: Math.max(s.longestStreakSec, s.currentStreakSec + deltaSec),
    })),

  resetStreak: () => set({ currentStreakSec: 0 }),

  noteSnooze: () => set((s) => ({ snoozeUsed: s.snoozeUsed + 1 })),
  resetSnooze: () => set({ snoozeUsed: 0 }),
}));

export const formatMMSS = (totalSec: number): string => {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const formatHM = (totalSec: number): string => {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}`;
  return `0:${String(m).padStart(2, "0")}`;
};
