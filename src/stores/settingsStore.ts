import { create } from "zustand";

export type AlertLevel = "light" | "medium" | "hard";
export type ThemeMode = "dark" | "light" | "system";
export type LanguageCode = "zh" | "en";

export interface Settings {
  // timer
  workIntervalSec: number;     // 10-120 min
  breakDurationSec: number;    // 10-300 s
  idleThresholdSec: number;    // 1-30 min

  // alerts
  alertLevel: AlertLevel;
  strictMode: boolean;
  soundEnabled: boolean;
  soundVolume: number;         // 0-100

  // smart snooze
  smartSnoozeEnabled: boolean;
  snoozeDurationSec: number;
  snoozeMaxCount: number;

  // pomodoro
  pomodoroEnabled: boolean;
  pomodoroWorkSec: number;
  pomodoroShortBreakSec: number;
  pomodoroLongBreakSec: number;
  pomodoroLongInterval: number;

  // health
  drinkReminder: boolean;
  postureReminder: boolean;

  // privacy
  appFootprintEnabled: boolean;
  dataRetentionDays: number;

  // system
  autostart: boolean;
  hotkeyPause: string;
  hotkeyBreak: string;
  dndWhitelist: string[];

  // ui
  theme: ThemeMode;
  language: LanguageCode;

  // first-run state
  seenOnboarding: boolean;
}

export const DEFAULT_SETTINGS: Settings = {
  workIntervalSec: 20 * 60,
  breakDurationSec: 20,
  idleThresholdSec: 5 * 60,

  alertLevel: "medium",
  strictMode: false,
  soundEnabled: true,
  soundVolume: 60,

  smartSnoozeEnabled: true,
  snoozeDurationSec: 10 * 60,
  snoozeMaxCount: 3,

  pomodoroEnabled: false,
  pomodoroWorkSec: 25 * 60,
  pomodoroShortBreakSec: 5 * 60,
  pomodoroLongBreakSec: 15 * 60,
  pomodoroLongInterval: 4,

  drinkReminder: true,
  postureReminder: true,

  appFootprintEnabled: true,
  dataRetentionDays: 90,

  autostart: false,
  hotkeyPause: "Ctrl+Shift+P",
  hotkeyBreak: "Ctrl+Shift+B",
  dndWhitelist: [],

  theme: "dark",
  language: "zh",

  seenOnboarding: false,
};

const STORAGE_KEY = "eyeguard.settings.v1";

function loadFromStorage(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function persist(s: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* storage full / disabled */
  }
}

interface SettingsStore extends Settings {
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  reset: () => void;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  ...loadFromStorage(),
  update: (key, value) => {
    set({ [key]: value } as Pick<Settings, typeof key>);
    persist({ ...get(), [key]: value });
  },
  reset: () => {
    set({ ...DEFAULT_SETTINGS });
    persist(DEFAULT_SETTINGS);
  },
}));
