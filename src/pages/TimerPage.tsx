import { Pause, Play, Coffee } from "lucide-react";
import { useTranslation } from "react-i18next";
import { HeroTimer } from "../components/HeroTimer";
import { MetricRingsRow } from "../components/MetricRingsRow";
import { PomodoroProgress } from "../components/PomodoroProgress";
import { useTimerStore } from "../stores/timerStore";

export function TimerPage() {
  const state = useTimerStore((s) => s.state);
  const setState = useTimerStore((s) => s.setState);
  const startBreak = useTimerStore((s) => s.startBreak);
  const { t } = useTranslation();

  const togglePause = () => {
    if (state === "active") setState("paused");
    else if (state === "paused") setState("active");
  };

  return (
    <section className="flex-1 flex flex-col page-enter">
      <HeroTimer />

      <PomodoroProgress />

      <div className="flex items-center justify-center gap-3 pb-4">
        <button className="btn-ghost flex items-center gap-2" onClick={togglePause} disabled={state === "break"}>
          {state === "paused" || state === "idle" ? <Play size={13} /> : <Pause size={13} />}
          <span>
            {state === "paused" || state === "idle" ? t("timer.resume") : t("timer.pause")}
          </span>
        </button>
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => startBreak()}
          disabled={state === "break"}
        >
          <Coffee size={13} />
          <span>{t("timer.breakNow")}</span>
        </button>
      </div>

      <MetricRingsRow />
    </section>
  );
}
