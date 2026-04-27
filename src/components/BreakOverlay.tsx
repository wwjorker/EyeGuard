import { useEffect, useMemo, useState } from "react";
import { useTimerStore, formatMMSS } from "../stores/timerStore";

const EXERCISES = [
  "Look 20 feet away — for 20 seconds.",
  "Slowly roll your eyes clockwise, then counter-clockwise.",
  "Squeeze your eyes shut firmly, then open wide.",
  "Blink rapidly for 10 seconds to refresh your tear film.",
  "Trace a slow figure-8 with your gaze.",
];

export function BreakOverlay() {
  const state = useTimerStore((s) => s.state);
  const remaining = useTimerStore((s) => s.remainingSec);
  const breakDuration = useTimerStore((s) => s.breakDurationSec);
  const endBreak = useTimerStore((s) => s.endBreak);

  const [exercise, setExercise] = useState(EXERCISES[0]);
  useEffect(() => {
    if (state === "break") {
      setExercise(EXERCISES[Math.floor(Math.random() * EXERCISES.length)]);
    }
  }, [state]);

  // Auto-end when countdown finishes.
  useEffect(() => {
    if (state === "break" && remaining <= 0) {
      endBreak(false);
    }
  }, [state, remaining, endBreak]);

  const display = useMemo(() => formatMMSS(remaining), [remaining]);
  const progress = breakDuration > 0 ? 1 - remaining / breakDuration : 0;

  if (state !== "break") return null;

  // SVG ring sizing
  const SIZE = 320;
  const R = 150;
  const C = 2 * Math.PI * R;

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
        <div className="brand mb-6" style={{ color: "rgba(255,255,255,0.18)" }}>
          eyeguard
        </div>

        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0">
            {/* faint orbit */}
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth="1"
            />
            {/* progress arc */}
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

          {/* rotating photon */}
          <div
            className="absolute orbit-rotor"
            style={{ inset: 0 }}
          >
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

          {/* countdown */}
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

        <p
          className="mt-10 max-w-md text-center"
          style={{
            fontSize: 13,
            letterSpacing: 0.5,
            color: "rgba(255,255,255,0.45)",
          }}
        >
          {exercise}
        </p>

        <button
          className="btn-ghost mt-12"
          style={{ color: "rgba(255,255,255,0.7)" }}
          onClick={() => endBreak(true)}
        >
          skip
        </button>
      </div>
    </div>
  );
}
