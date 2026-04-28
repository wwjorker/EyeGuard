import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useTimerStore, formatMMSS } from "../stores/timerStore";
import { EyeExercise } from "./EyeExercise";
import { useSettingsStore } from "../stores/settingsStore";
import { useFollowupStore } from "../stores/followupStore";

export function BreakOverlay() {
  const state = useTimerStore((s) => s.state);
  const remaining = useTimerStore((s) => s.remainingSec);
  const breakDuration = useTimerStore((s) => s.breakDurationSec);
  const longBreakSec = useTimerStore((s) => s.longBreakSec);
  const breakKind = useTimerStore((s) => s.currentBreakKind);
  const completedBreaks = useTimerStore((s) => s.completedBreaks);
  const endBreak = useTimerStore((s) => s.endBreak);

  const strictMode = useSettingsStore((s) => s.strictMode);
  const drinkReminder = useSettingsStore((s) => s.drinkReminder);
  const postureReminder = useSettingsStore((s) => s.postureReminder);
  const queueFollowup = useFollowupStore((s) => s.queue);
  const { t } = useTranslation();

  const totalDuration = breakKind === "long" ? longBreakSec : breakDuration;
  const exerciseSeed = useMemo(() => Math.floor(Math.random() * 1000), [completedBreaks, state]);

  // When the countdown hits zero, finish the break and queue follow-up nudges.
  useEffect(() => {
    if (state !== "break" || remaining > 0) return;
    endBreak(false);
    if (drinkReminder && Math.random() < 0.5) {
      queueFollowup("drink");
    }
    if (postureReminder && (completedBreaks + 1) % 3 === 0) {
      queueFollowup("posture");
    }
  }, [state, remaining, endBreak, drinkReminder, postureReminder, completedBreaks, queueFollowup]);

  // Esc / Enter shortcut to skip the break (unless strict mode).
  useEffect(() => {
    if (state !== "break" || strictMode) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        endBreak(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state, strictMode, endBreak]);

  // While a break is active, blow up the EyeGuard window to cover the
  // primary monitor and float on top, so the rest screen is actually
  // unmissable. Restore the previous size + flags when the break ends.
  useEffect(() => {
    if (state !== "break") return;
    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    if (!isTauri) return;

    let restore: (() => Promise<void>) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const win = getCurrentWindow();

        const prevSize = await win.outerSize();
        const prevPos = await win.outerPosition();
        const prevAlwaysOnTop = false; // we set true below; prev was app default
        const prevDecorations = true;
        const prevSkipTaskbar = false;

        // Make sure the user can see it even if minimised to tray.
        await win.show();
        await win.unminimize();
        await win.setAlwaysOnTop(true);
        await win.setSkipTaskbar(true);
        await win.setDecorations(false);
        await win.setFullscreen(true);
        await win.setFocus();

        if (cancelled) return;

        restore = async () => {
          try {
            await win.setFullscreen(false);
            await win.setDecorations(prevDecorations);
            await win.setSkipTaskbar(prevSkipTaskbar);
            await win.setAlwaysOnTop(prevAlwaysOnTop);
            await win.setSize(prevSize);
            await win.setPosition(prevPos);
          } catch {
            /* ignore */
          }
        };
      } catch (err) {
        console.warn("[eyeguard] could not enter fullscreen for break", err);
      }
    })();

    return () => {
      cancelled = true;
      void restore?.();
    };
  }, [state]);

  if (state !== "break") return null;

  const progress = totalDuration > 0 ? 1 - remaining / totalDuration : 0;
  const SIZE = 320;
  const R = 150;
  const C = 2 * Math.PI * R;
  const display = formatMMSS(remaining);

  return (
    <div className="fixed inset-0 z-50 overlay-enter" role="dialog" aria-label="break">
      <div
        className="absolute inset-0"
        style={{
          background: "#09090B",
        }}
      />
      <div className="relative w-full h-full flex flex-col items-center justify-center text-white">
        <div className="brand mb-3" style={{ color: "rgba(255,255,255,0.18)" }}>
          {t("brand")} · {t(`breakKind.${breakKind}`)}
        </div>

        <div className="relative" style={{ width: SIZE, height: SIZE }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0">
            <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
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
          <div className="absolute orbit-rotor" style={{ inset: 0 }}>
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
          <EyeExercise seed={exerciseSeed} />
        </div>

        {!strictMode && (
          <button
            className="btn-ghost mt-12"
            style={{ color: "rgba(255,255,255,0.7)" }}
            onClick={() => endBreak(true)}
          >
            {t("skip")}
          </button>
        )}
      </div>
    </div>
  );
}
