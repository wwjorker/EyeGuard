import { Pause, Play, Coffee } from "lucide-react";
import { HeroTimer } from "../components/HeroTimer";
import { MetricRingsRow } from "../components/MetricRingsRow";
import { useTimerStore } from "../stores/timerStore";

export function TimerPage() {
  const state = useTimerStore((s) => s.state);
  const setState = useTimerStore((s) => s.setState);
  const startBreak = useTimerStore((s) => s.startBreak);

  const togglePause = () => {
    if (state === "active") setState("paused");
    else if (state === "paused") setState("active");
  };

  return (
    <section className="flex-1 flex flex-col page-enter">
      <HeroTimer />

      <div className="flex items-center justify-center gap-3 pb-4">
        <button className="btn-ghost flex items-center gap-2" onClick={togglePause}>
          {state === "paused" ? <Play size={13} /> : <Pause size={13} />}
          <span>{state === "paused" ? "resume" : "pause"}</span>
        </button>
        <button className="btn-primary flex items-center gap-2" onClick={startBreak}>
          <Coffee size={13} />
          <span>break now</span>
        </button>
      </div>

      <MetricRingsRow />
    </section>
  );
}
