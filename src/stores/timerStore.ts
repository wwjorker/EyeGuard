import { create } from "zustand";

export type TimerState = "active" | "paused" | "break" | "idle";

export interface TimerSnapshot {
  state: TimerState;
  remainingSec: number;
  workIntervalSec: number;
  breakDurationSec: number;
  completedBreaks: number;
  skippedBreaks: number;
  longestStreakSec: number;
  currentStreakSec: number;
  todayScreenSec: number;
  healthScore: number;
}

interface TimerStore extends TimerSnapshot {
  setState: (state: TimerState) => void;
  tick: () => void;
  startBreak: () => void;
  endBreak: (skipped: boolean) => void;
  resetCycle: () => void;
  setWorkInterval: (sec: number) => void;
  setBreakDuration: (sec: number) => void;
  bumpStreak: (deltaSec: number) => void;
  resetStreak: () => void;
}

const DEFAULT_WORK_SEC = 20 * 60;
const DEFAULT_BREAK_SEC = 20;

export const useTimerStore = create<TimerStore>((set, get) => ({
  state: "active",
  remainingSec: DEFAULT_WORK_SEC,
  workIntervalSec: DEFAULT_WORK_SEC,
  breakDurationSec: DEFAULT_BREAK_SEC,
  completedBreaks: 0,
  skippedBreaks: 0,
  longestStreakSec: 0,
  currentStreakSec: 0,
  todayScreenSec: 0,
  healthScore: 100,

  setState: (state) => set({ state }),

  tick: () => {
    const s = get();
    if (s.state !== "active") return;
    const next = s.remainingSec - 1;
    const nextStreak = s.currentStreakSec + 1;
    set({
      remainingSec: Math.max(0, next),
      currentStreakSec: nextStreak,
      longestStreakSec: Math.max(s.longestStreakSec, nextStreak),
      todayScreenSec: s.todayScreenSec + 1,
    });
    if (next <= 0) {
      get().startBreak();
    }
  },

  startBreak: () =>
    set((s) => ({
      state: "break",
      remainingSec: s.breakDurationSec,
    })),

  endBreak: (skipped) =>
    set((s) => ({
      state: "active",
      remainingSec: s.workIntervalSec,
      completedBreaks: skipped ? s.completedBreaks : s.completedBreaks + 1,
      skippedBreaks: skipped ? s.skippedBreaks + 1 : s.skippedBreaks,
      currentStreakSec: 0,
      healthScore: skipped ? Math.max(0, s.healthScore - 2) : Math.min(100, s.healthScore + 1),
    })),

  resetCycle: () =>
    set((s) => ({
      remainingSec: s.workIntervalSec,
      currentStreakSec: 0,
    })),

  setWorkInterval: (sec) =>
    set((s) => ({
      workIntervalSec: sec,
      remainingSec: s.state === "active" ? sec : s.remainingSec,
    })),

  setBreakDuration: (sec) => set({ breakDurationSec: sec }),

  bumpStreak: (deltaSec) =>
    set((s) => ({
      currentStreakSec: s.currentStreakSec + deltaSec,
      longestStreakSec: Math.max(s.longestStreakSec, s.currentStreakSec + deltaSec),
    })),

  resetStreak: () => set({ currentStreakSec: 0 }),
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
