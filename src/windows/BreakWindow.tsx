import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { EyeExercise } from "../components/EyeExercise";
import { Sky } from "../components/garden/Sky";
import { Plant } from "../components/garden/Plant";
import { useSatelliteTheme } from "../lib/themeListener";

type BreakKind = "long" | "short" | "free";

interface ShowPayload {
  duration: number;
  kind: BreakKind;
  strict: boolean;
}

interface State extends ShowPayload {
  remaining: number;
  exerciseSeed: number;
  startedAt: number;
}

const formatMMSS = (totalSec: number): string => {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/**
 * Fullscreen rest UI rendered inside the dedicated `break` Tauri window.
 * Now a fullscreen window scene: sky behind, sleeping plant on a wood
 * sill, paper countdown card centred, exercise prompt below.
 */
export function BreakWindow() {
  const { t } = useTranslation();
  const [state, setState] = useState<State | null>(null);
  useSatelliteTheme();

  useEffect(() => {
    let off: (() => void) | null = null;
    let cancelled = false;
    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        off = await listen<ShowPayload>("break://show", (e) => {
          setState({
            ...e.payload,
            remaining: e.payload.duration,
            exerciseSeed: Math.floor(Math.random() * 1000),
            startedAt: Date.now(),
          });
        });
      } catch (err) {
        console.warn("[break] listen failed", err);
      }
      if (cancelled) off?.();
    })();
    return () => {
      cancelled = true;
      off?.();
    };
  }, []);

  useEffect(() => {
    if (!state || state.remaining <= 0) return;
    const id = window.setInterval(() => {
      setState((prev) => {
        if (!prev) return prev;
        const elapsed = Math.floor((Date.now() - prev.startedAt) / 1000);
        const next = Math.max(0, prev.duration - elapsed);
        return { ...prev, remaining: next };
      });
    }, 250);
    return () => window.clearInterval(id);
  }, [state?.startedAt]);

  useEffect(() => {
    if (!state) return;
    if (state.remaining > 0) return;
    void emitEnd(false);
  }, [state?.remaining]);

  useEffect(() => {
    if (!state || state.strict) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        void emitEnd(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state?.strict]);

  if (!state) return null;

  const display = formatMMSS(state.remaining);

  return (
    <div className="break-root">
      <Sky />

      <div className="break-content">
        <div className="break-card">
          <div className="break-tag">
            {t("brand")} · {t(`breakKind.${state.kind}`)}
          </div>
          <div className="break-countdown">
            {display.split(":").map((part, idx) => (
              <span key={idx}>
                {idx > 0 && <span className="colon">:</span>}
                {part}
              </span>
            ))}
          </div>
        </div>

        <div className="break-exercise">
          <ExerciseMemo seed={state.exerciseSeed} />
        </div>

        {!state.strict && (
          <button className="break-skip" onClick={() => emitEnd(true)}>
            {t("skip")}
          </button>
        )}
      </div>

      {/* sleeping plant on the sill */}
      <div className="break-sill">
        <Plant />
      </div>
    </div>
  );
}

function ExerciseMemo({ seed }: { seed: number }) {
  return useMemo(() => <EyeExercise seed={seed} />, [seed]);
}

async function emitEnd(skipped: boolean) {
  try {
    const { emit } = await import("@tauri-apps/api/event");
    await emit("break://end", { skipped });
  } catch {
    /* ignore */
  }
}
