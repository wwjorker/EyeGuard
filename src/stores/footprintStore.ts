import { create } from "zustand";

export interface FootprintSegment {
  process: string;
  title: string;
  started_at: number;
  ended_at: number;
  duration_s: number;
}

export interface AppUsage {
  process: string;
  totalSec: number;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  totalSec: number;
}

interface FootprintStore {
  appUsage: AppUsage[];
  dailyUsage: DailyUsage[];
  setAppUsage: (rows: AppUsage[]) => void;
  setDailyUsage: (rows: DailyUsage[]) => void;
}

export const useFootprintStore = create<FootprintStore>((set) => ({
  appUsage: [],
  dailyUsage: [],
  setAppUsage: (appUsage) => set({ appUsage }),
  setDailyUsage: (dailyUsage) => set({ dailyUsage }),
}));
