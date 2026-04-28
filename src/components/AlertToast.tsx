import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTimerStore, formatMMSS } from "../stores/timerStore";

interface AlertToastProps {
  visible: boolean;
  variant?: "medium" | "light";
  onAccept?: () => void;
  onDismiss: () => void;
  autoDismissMs?: number;
}

/**
 * Two visual variants share this component:
 *  - "medium" — bottom-right card with Start break / Later actions (8s).
 *  - "light"  — top-right pill, no buttons, briefer (4s). Used as a
 *               fallback when system notifications are silently dropped
 *               by Windows for an unsigned dev build.
 */
export function AlertToast({
  visible,
  variant = "medium",
  onAccept,
  onDismiss,
  autoDismissMs,
}: AlertToastProps) {
  const [exiting, setExiting] = useState(false);
  const streak = useTimerStore((s) => s.currentStreakSec);
  const { t } = useTranslation();

  const ms = autoDismissMs ?? (variant === "light" ? 4000 : 8000);

  useEffect(() => {
    if (!visible) return;
    setExiting(false);
    const id = window.setTimeout(() => {
      setExiting(true);
      window.setTimeout(onDismiss, 220);
    }, ms);
    return () => window.clearTimeout(id);
  }, [visible, ms, onDismiss]);

  if (!visible) return null;

  if (variant === "light") {
    return (
      <div
        className="fixed z-40"
        style={{ right: 18, top: 18 }}
      >
        <div
          className={`toast-card ${exiting ? "toast-exit" : "toast-enter"}`}
          style={{
            minWidth: 220,
            padding: "10px 14px",
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center"
              style={{
                width: 24,
                height: 24,
                borderRadius: 8,
                background: "rgba(52,211,153,0.12)",
                color: "var(--eg-green)",
              }}
            >
              <Eye size={12} strokeWidth={1.75} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="text-[12px] font-semibold" style={{ color: "var(--eg-text)" }}>
                {t("alerts.lightTitle")}
              </div>
              <div className="text-[10px]" style={{ color: "var(--eg-muted)" }}>
                {t("alerts.lightBody", { streak: formatMMSS(streak) })}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // medium
  return (
    <div className="fixed z-40" style={{ right: 18, bottom: 18 }}>
      <div className={`toast-card ${exiting ? "toast-exit" : "toast-enter"}`}>
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "rgba(52,211,153,0.12)",
              color: "var(--eg-green)",
            }}
          >
            <Eye size={16} strokeWidth={1.75} />
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="text-[13px] font-semibold" style={{ color: "var(--eg-text)" }}>
              {t("alerts.title")}
            </div>
            <div className="text-[11px]" style={{ color: "var(--eg-muted)" }}>
              {t("alerts.body", { streak: formatMMSS(streak) })}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2 mt-3">
          <button
            className="btn-ghost"
            onClick={() => {
              setExiting(true);
              window.setTimeout(onDismiss, 220);
            }}
          >
            {t("alerts.later")}
          </button>
          <button
            className="btn-primary"
            onClick={() => {
              setExiting(true);
              window.setTimeout(() => onAccept?.(), 220);
            }}
          >
            {t("alerts.startBreak")}
          </button>
        </div>
      </div>
    </div>
  );
}
