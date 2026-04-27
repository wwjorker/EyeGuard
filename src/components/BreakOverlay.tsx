import { useEffect, useMemo } from "react";
import { useTimerStore, formatMMSS } from "../stores/timerStore";
import { EyeExercise } from "./EyeExercise";
import { useSettingsStore } from "../stores/settingsStore";
import { useFollowupStore } from "../stores/followupStore";

export function BreakOverlay() {
  const state = useTimerStore((s) => s.state);
  const remaining = useTimerStore((s) => s.remainingSec);
  const breakDuration = useTimerStore((s) => s.breakDurationSec);
  const longBreakSec = useTimerStore((s) => s.longBreakSec);
  const breakKind = useTimerStore((s) => s.currentBreakKind);
  const completedBreaks = useTimerStore((s) => s.completedBreaks);
  const endBreak = useTimerStore((s) => s.endBreak);

  const strictMode = useSettingsStore((s) => s.strictMode);
  const drinkReminder = useSettingsStore((s) => s.drinkReminder);
  const postureReminder = useSettingsStore((s) => s.postureReminder);
  const queueFollowup = useFollowupStore((s) => s.queue);

  const totalDuration = breakKind === "long" ? longBreakSec : breakDuration;
  const exerciseSeed = useMemo(() => Math.floor(Math.random() * 1000), [completedBreaks, state]);

  // When the countdown hits zero, finish the break and queue follow-up nudges.
  useEffect(() => {
    if (state !== "break" || remaining > 0) return;
    endBreak(false);
    if (drinkReminder && Math.random() < 0.5) {
      queueFollowup({ kind: "drink", title: "Hydrate", body: "Grab a sip of water — your eyes will thank you." });
    }
    if (postureReminder && (completedBreaks + 1) % 3 === 0) {
      queueFollowup({
        kind: "posture",
        title: "Check your posture",
        body: "Sit tall, drop your shoulders, and adjust your screen distance.",
      });
    }
  }, [state, remaining, endBreak, drinkReminder, postureReminder, completedBreaks, queueFollowup]);

  if (state !== "break") return null;

  const progress = totalDuration > 0 ? 1 - remaining / totalDuration : 0;
  const SIZE = 320;
  const R = 150;
  const C = 2 * Math.PI * R;
  const display = formatMMSS(remaining);

  return (
    <div className="fixed inset-0 z-50 overlay-enter" role="dialog" aria-label="break">
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(9, 9, 11, 0.94)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
        }}
      />
      <div className="relative w-full h-full flex flex-col items-center justify-center text-white">
        <div className="brand mb-3" style={{ color: "rgba(255,255,255,0.18)" }}>
          eyeguard · {breakKind === "long" ? "long break" : breakKind === "short" ? "short break" : "rest"}
        </div>

        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="rgba(52,211,153,0.35)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          </svg>
          <div className="absolute orbit-rotor" style={{ inset: 0 }}>
            <span
              className="absolute"
              style={{
                top: "50%",
                left: "50%",
                width: 8,
                height: 8,
                marginLeft: -4,
                marginTop: -4 - R,
                background: "var(--eg-green)",
                borderRadius: "50%",
                boxShadow: "0 0 10px var(--eg-green), 0 0 18px rgba(52,211,153,0.5)",
              }}
            />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="break-countdown">
              {display.split(":").map((part, idx) => (
                <span key={idx}>
                  {idx > 0 && <span className="colon">:</span>}
                  {part}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 max-w-md">
          <EyeExercise seed={exerciseSeed} />
        </div>

        {!strictMode && (
          <button
            className="btn-ghost mt-12"
            style={{ color: "rgba(255,255,255,0.7)" }}
            onClick={() => endBreak(true)}
          >
            skip
          </button>
        )}
      </div>
    </div>
  );
}
