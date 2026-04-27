import { useTimerStore, formatMMSS } from "../stores/timerStore";

export function HeroTimer() {
  const remainingSec = useTimerStore((s) => s.remainingSec);
  const state = useTimerStore((s) => s.state);
  const workInterval = useTimerStore((s) => s.workIntervalSec);

  const isPaused = state === "paused";
  const isWarning = state === "active" && remainingSec > 0 && remainingSec <= 120;
  const display = formatMMSS(remainingSec);
  const minutes = Math.ceil(remainingSec / 60);

  // soft progress text
  const label = (() => {
    if (state === "break") return "rest in progress";
    if (state === "paused") return "paused — move to resume";
    if (state === "idle") return "you're away";
    return minutes <= 1 ? "less than a minute" : "minutes remaining";
  })();

  // background ring progress for visual depth
  const pct = Math.max(0, Math.min(1, remainingSec / Math.max(1, workInterval)));

  return (
    <div className="flex flex-col items-center justify-center flex-1 relative">
      {/* faint orbital ring behind timer */}
      <svg
        className="absolute"
        width="240"
        height="240"
        viewBox="0 0 240 240"
        style={{ opacity: 0.55 }}
      >
        <circle
          cx="120"
          cy="120"
          r="112"
          fill="none"
          stroke="var(--eg-track)"
          strokeWidth="1"
        />
        <circle
          cx="120"
          cy="120"
          r="112"
          fill="none"
          stroke={isWarning ? "var(--eg-amber)" : "var(--eg-green)"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 112}`}
          strokeDashoffset={`${2 * Math.PI * 112 * (1 - pct)}`}
          transform="rotate(-90 120 120)"
          style={{ transition: "stroke-dashoffset 800ms ease, stroke 600ms ease" }}
        />
      </svg>

      <div className={`hero-timer ${isPaused ? "paused" : ""} ${isWarning ? "warning" : ""}`}>
        {display}
      </div>
      <div className="tag-label mt-3">{label}</div>
    </div>
  );
}
