import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../stores/settingsStore";
import { useTimerStore } from "../stores/timerStore";

/**
 * Cycle indicator shown above the timer controls when pomodoro mode is on.
 * Renders `longBreakInterval` dots; the active focus session pulses, the
 * completed ones are filled emerald-purple, the future ones are an empty
 * outline. The label flips between "focus N/total" while working and the
 * break kind while resting.
 */
export function PomodoroProgress() {
  const enabled = useSettingsStore((s) => s.pomodoroEnabled);
  const count = useTimerStore((s) => s.pomodoroCount);
  const interval = useTimerStore((s) => s.longBreakInterval);
  const state = useTimerStore((s) => s.state);
  const breakKind = useTimerStore((s) => s.currentBreakKind);
  const { t } = useTranslation();

  if (!enabled) return null;

  const inCycle = count % interval; // 0..interval-1, or 0 right after a long break
  const isBreak = state === "break";
  const isLong = isBreak && breakKind === "long";

  // What's filled in the dot row
  const filledDots = isLong ? interval : inCycle;
  // Active dot only highlighted while focusing
  const activeIdx = isBreak ? -1 : inCycle;

  const label = isBreak
    ? t(`breakKind.${breakKind}`)
    : t("pomodoro.focusLabel", { n: inCycle + 1, total: interval });

  return (
    <div className="flex items-center justify-center gap-3 pt-1 pb-2">
      <div className="flex items-center gap-2">
        {Array.from({ length: interval }, (_, i) => {
          const filled = i < filledDots;
          const active = i === activeIdx;
          return (
            <span
              key={i}
              className={active ? "eg-pomo-active" : ""}
              style={{
                display: "inline-block",
                width: active ? 9 : 6,
                height: active ? 9 : 6,
                borderRadius: "50%",
                background: filled || active ? "var(--eg-purple)" : "transparent",
                border: filled || active ? "none" : "1.5px solid var(--eg-line)",
                boxShadow: active ? "0 0 10px rgba(99,102,241,0.55)" : "none",
                transition: "width 200ms ease, height 200ms ease, background 200ms ease",
              }}
            />
          );
        })}
      </div>
      <span
        className="text-[10px] uppercase font-medium"
        style={{ color: "var(--eg-muted)", letterSpacing: 1.4 }}
      >
        {label}
      </span>
    </div>
  );
}
