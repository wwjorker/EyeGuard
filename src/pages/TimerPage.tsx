import { Pause, Play, Coffee } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HeroTimer } from "../components/HeroTimer";
import { MetricRingsRow } from "../components/MetricRingsRow";
import { PomodoroProgress } from "../components/PomodoroProgress";
import { Sky } from "../components/garden/Sky";
import { Plant } from "../components/garden/Plant";
import { Snail } from "../components/garden/Snail";
import { useTimerStore } from "../stores/timerStore";

export function TimerPage() {
  const state = useTimerStore((s) => s.state);
  const setState = useTimerStore((s) => s.setState);
  const startBreak = useTimerStore((s) => s.startBreak);
  const completedBreaks = useTimerStore((s) => s.completedBreaks);
  const { t } = useTranslation();

  const togglePause = () => {
    if (state === "active") setState("paused");
    else if (state === "paused" || state === "idle") setState("active");
  };

  const showCat = completedBreaks >= 10;

  return (
    <section className="relative flex-1 page-enter overflow-hidden" style={{ minHeight: 0 }}>
      <Sky />

      {/* Hero card sits in the upper-middle, well clear of the topbar. */}
      <div
        style={{
          position: "absolute",
          top: 78,
          left: 0,
          right: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          zIndex: 5,
        }}
      >
        <HeroTimer />
        <PomodoroProgress />
      </div>

      {/* Action row sits clear of the plant top, well above the sill. */}
      <div
        className="garden-actions"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 200,
          zIndex: 5,
        }}
      >
        <button
          className="garden-btn ghost"
          onClick={togglePause}
          disabled={state === "break"}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          {state === "paused" || state === "idle" ? <Play size={13} /> : <Pause size={13} />}
          <span>{state === "paused" || state === "idle" ? t("timer.resume") : t("timer.pause")}</span>
        </button>
        <button
          className="garden-btn primary"
          onClick={() => startBreak()}
          disabled={state === "break"}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Coffee size={13} />
          <span>{t("timer.breakNow")}</span>
        </button>
      </div>

      {/* The windowsill at the bottom. */}
      <div className="garden-sill">
        <Plant />
        <Snail />
        {showCat && <CatVisitor />}
        <MetricRingsRow />
      </div>
    </section>
  );
}

function CatVisitor() {
  return (
    <svg className="garden-visitor-cat" viewBox="0 0 60 50" aria-hidden>
      <path
        d="M 8 36 Q 16 24 30 24 Q 44 24 52 36 L 52 44 Q 30 48 8 44 Z"
        fill="#3a2818"
        stroke="#1f1208"
        strokeWidth="1.2"
      />
      <circle cx="40" cy="22" r="11" fill="#3a2818" stroke="#1f1208" strokeWidth="1.2" />
      <path d="M 31 14 L 35 6 L 38 16 Z" fill="#3a2818" stroke="#1f1208" strokeWidth="1" />
      <path d="M 47 14 L 45 6 L 42 16 Z" fill="#3a2818" stroke="#1f1208" strokeWidth="1" />
      <path d="M 36 21 q 1.4 -1 2.8 0" stroke="#f5e645" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <path d="M 42 21 q 1.4 -1 2.8 0" stroke="#f5e645" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <circle cx="40" cy="25" r="1" fill="#f5b568" />
      <line x1="32" y1="26" x2="28" y2="25" stroke="#1f1208" strokeWidth="0.8" />
      <line x1="48" y1="26" x2="52" y2="25" stroke="#1f1208" strokeWidth="0.8" />
      <path
        d="M 6 38 q -4 -6 0 -10 q 4 -2 4 4"
        fill="none"
        stroke="#3a2818"
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  );
}
