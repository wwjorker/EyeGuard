import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTimerStore, formatMMSS } from "../stores/timerStore";

// Module-level flag so the greeting only shows once per app session,
// even if the user navigates timer page → another → timer.
let greetingShown = false;

const greetingKeyForNow = (): string => {
  const h = new Date().getHours();
  if (h < 5) return "timer.greetNight";
  if (h < 12) return "timer.greetMorning";
  if (h < 18) return "timer.greetAfternoon";
  if (h < 23) return "timer.greetEvening";
  return "timer.greetNight";
};

export function HeroTimer() {
  const remainingSec = useTimerStore((s) => s.remainingSec);
  const state = useTimerStore((s) => s.state);
  const workInterval = useTimerStore((s) => s.workIntervalSec);
  const { t } = useTranslation();

  const isPaused = state === "paused" || state === "idle";
  const isWarning = state === "active" && remainingSec > 0 && remainingSec <= 120;
  const isBreathing = state === "active" && !isWarning;
  const display = formatMMSS(remainingSec);

  // Pick microcopy from the progress through the cycle. Warning state
  // wins over the percentage-based copy.
  const pct = workInterval > 0 ? remainingSec / workInterval : 0;
  const labelByPct = (() => {
    if (remainingSec <= 60) return t("timer.lessThanMinute");
    if (remainingSec <= 120) return t("timer.almostDone");
    if (pct < 0.25) return t("timer.wrappingUp");
    if (pct < 0.55) return t("timer.halfwayThere");
    if (pct > 0.92) return t("timer.settlingIn");
    return t("timer.minutesRemaining");
  })();

  const label = (() => {
    if (state === "break") return t("timer.restInProgress");
    if (state === "paused") return t("timer.pausedHint");
    if (state === "idle") return t("timer.awayHint");
    return labelByPct;
  })();

  // Background ring progress
  const progressPct = Math.max(0, Math.min(1, pct));

  // State-aware halo colour
  const haloBg = (() => {
    if (isPaused) return "transparent";
    if (isWarning) return "radial-gradient(circle, rgba(245,158,11,0.20) 0%, transparent 65%)";
    return "radial-gradient(circle, rgba(52,211,153,0.14) 0%, transparent 65%)";
  })();

  // One-shot greeting at session start
  const [showGreeting, setShowGreeting] = useState(!greetingShown);
  const greetTimerRef = useRef<number | null>(null);
  useEffect(() => {
    if (!showGreeting) return;
    greetingShown = true;
    greetTimerRef.current = window.setTimeout(() => setShowGreeting(false), 5000);
    return () => {
      if (greetTimerRef.current != null) window.clearTimeout(greetTimerRef.current);
    };
  }, [showGreeting]);

  return (
    <div className="flex flex-col items-center justify-center flex-1 relative">
      <span aria-hidden className="hero-glow" style={{ background: haloBg, opacity: isPaused ? 0 : 0.85 }} />

      <svg
        className="absolute"
        width="240"
        height="240"
        viewBox="0 0 240 240"
        style={{ opacity: 0.55 }}
      >
        <circle cx="120" cy="120" r="112" fill="none" stroke="var(--eg-track)" strokeWidth="1" />
        <circle
          cx="120"
          cy="120"
          r="112"
          fill="none"
          stroke={isWarning ? "var(--eg-amber)" : "var(--eg-green)"}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 112}`}
          strokeDashoffset={`${2 * Math.PI * 112 * (1 - progressPct)}`}
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

      {showGreeting && state === "active" && (
        <div className="hero-greeting" aria-hidden>
          {t(greetingKeyForNow())}
        </div>
      )}
    </div>
  );
}
