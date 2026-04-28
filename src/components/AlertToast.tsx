import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTimerStore, formatMMSS } from "../stores/timerStore";

interface AlertToastProps {
  visible: boolean;
  onAccept: () => void;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function AlertToast({ visible, onAccept, onDismiss, autoDismissMs = 8000 }: AlertToastProps) {
  const [exiting, setExiting] = useState(false);
  const streak = useTimerStore((s) => s.currentStreakSec);
  const { t } = useTranslation();

  useEffect(() => {
    if (!visible) return;
    setExiting(false);
    const id = window.setTimeout(() => {
      setExiting(true);
      window.setTimeout(onDismiss, 220);
    }, autoDismissMs);
    return () => window.clearTimeout(id);
  }, [visible, autoDismissMs, onDismiss]);

  if (!visible) return null;

  return (
    <div
      className="fixed z-40"
      style={{ right: 18, bottom: 18 }}
    >
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
              window.setTimeout(onAccept, 220);
            }}
          >
            {t("alerts.startBreak")}
          </button>
        </div>
      </div>
    </div>
  );
}
