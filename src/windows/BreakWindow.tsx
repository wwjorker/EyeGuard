import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { EyeExercise } from "../components/EyeExercise";
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
 * Owns its own countdown so it doesn't matter whether the main window is
 * showing, hidden in the tray, minimised, or covered. Communicates back
 * via `break://end` events when the user skips or the timer hits zero.
 */
export function BreakWindow() {
  const { t } = useTranslation();
  const [state, setState] = useState<State | null>(null);
  useSatelliteTheme();

  // Listen for show events from main.
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

  // Tick down every second while we have a state.
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

  // When countdown hits zero, finish naturally.
  useEffect(() => {
    if (!state) return;
    if (state.remaining > 0) return;
    void emitEnd(false);
  }, [state?.remaining]);

  // Esc / Enter / click-outside skip (unless strict).
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

  const progress = state.duration > 0 ? 1 - state.remaining / state.duration : 0;
  const SIZE = 360;
  const R = 168;
  const C = 2 * Math.PI * R;
  const display = formatMMSS(state.remaining);

  return (
    <div className="break-root">
      <div className="break-bg" />
      <div className="break-content">
        <div className="brand mb-3" style={{ color: "rgba(255,255,255,0.18)" }}>
          {t("brand")} · {t(`breakKind.${state.kind}`)}
        </div>

        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              stroke="rgba(52,211,153,0.4)"
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
                width: 10,
                height: 10,
                marginLeft: -5,
                marginTop: -5 - R,
                background: "var(--eg-green)",
                borderRadius: "50%",
                boxShadow: "0 0 12px var(--eg-green), 0 0 22px rgba(52,211,153,0.5)",
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
          <ExerciseMemo seed={state.exerciseSeed} />
        </div>

        {!state.strict && (
          <button
            className="btn-ghost mt-12"
            style={{ color: "rgba(255,255,255,0.7)" }}
            onClick={() => emitEnd(true)}
          >
            {t("skip")}
          </button>
        )}
      </div>
    </div>
  );
}

// Memoise the exercise so re-rendering due to ticking doesn't re-roll it.
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
