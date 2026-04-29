import { useTranslation } from "react-i18next";
import { useTimerStore, formatMMSS } from "../stores/timerStore";

export function HeroTimer() {
  const remainingSec = useTimerStore((s) => s.remainingSec);
  const state = useTimerStore((s) => s.state);
  const workInterval = useTimerStore((s) => s.workIntervalSec);
  const { t } = useTranslation();

  const isPaused = state === "paused" || state === "idle";
  const isWarning = state === "active" && remainingSec > 0 && remainingSec <= 120;
  const isBreathing = state === "active" && !isWarning;
  const display = formatMMSS(remainingSec);
  const minutes = Math.ceil(remainingSec / 60);

  const label = (() => {
    if (state === "break") return t("timer.restInProgress");
    if (state === "paused") return t("timer.pausedHint");
    if (state === "idle") return t("timer.awayHint");
    return minutes <= 1 ? t("timer.lessThanMinute") : t("timer.minutesRemaining");
  })();

  // Background ring progress
  const pct = Math.max(0, Math.min(1, remainingSec / Math.max(1, workInterval)));

  // State-aware halo color behind the hero number
  const haloBg = (() => {
    if (isPaused) return "transparent";
    if (isWarning) return "radial-gradient(circle, rgba(245,158,11,0.20) 0%, transparent 65%)";
    return "radial-gradient(circle, rgba(52,211,153,0.14) 0%, transparent 65%)";
  })();

  return (
    <div className="flex flex-col items-center justify-center flex-1 relative">
      {/* state-aware halo */}
      <span
        aria-hidden
        className="hero-glow"
        style={{ background: haloBg, opacity: isPaused ? 0 : 0.85 }}
      />

      {/* faint orbital ring */}
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

      <div
        className={`hero-timer ${isPaused ? "paused" : ""} ${isWarning ? "warning" : ""} ${isBreathing ? "breathing" : ""}`}
      >
        {display}
      </div>
      <div className="tag-label mt-3">{label}</div>
    </div>
  );
}
