import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTimerStore, formatMMSS } from "../stores/timerStore";

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
  const display = formatMMSS(remainingSec);
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
    <div
      className="garden-card"
      style={{
        opacity: isPaused ? 0.55 : 1,
        transition: "opacity 300ms ease",
      }}
    >
      <div
        className="time"
        style={{
          color: isWarning ? "var(--eg-pink)" : "var(--eg-text)",
          transition: "color 600ms ease",
        }}
      >
        {display}
      </div>
      <div className="meta">{label}</div>
      {showGreeting && state === "active" && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            bottom: -22,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "Caveat, cursive",
            fontSize: 13,
            color: "var(--eg-text-soft)",
            whiteSpace: "nowrap",
            animation: "heroGreetingShow 5s ease forwards",
            pointerEvents: "none",
          }}
        >
          {t(greetingKeyForNow())}
        </div>
      )}
    </div>
  );
}
