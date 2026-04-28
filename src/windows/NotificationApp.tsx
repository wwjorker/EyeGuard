import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye } from "lucide-react";

type Variant = "light" | "medium";

interface NotificationPayload {
  variant: Variant;
  streakSec: number;
  /** unique id so we can dedupe in case multiple events fire close together */
  id: number;
}

interface State extends NotificationPayload {
  exiting: boolean;
}

const formatMMSS = (totalSec: number): string => {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

/**
 * UI rendered inside the dedicated notification window. It is essentially
 * a one-shot toast — listens for `notification://show` events from the main
 * window, displays the requested variant, then sends a `notification://done`
 * back so the main window can hide the OS-level window again.
 */
export function NotificationApp() {
  const { t } = useTranslation();
  const [state, setState] = useState<State | null>(null);

  // Subscribe to the main-window event stream.
  useEffect(() => {
    let unlistenShow: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        unlistenShow = await listen<NotificationPayload>("notification://show", (e) => {
          setState({ ...e.payload, exiting: false });
        });
      } catch (err) {
        console.warn("[notification] listen failed", err);
      }
      if (cancelled) unlistenShow?.();
    })();

    return () => {
      cancelled = true;
      unlistenShow?.();
    };
  }, []);

  // Auto-dismiss after the per-variant timeout.
  useEffect(() => {
    if (!state) return;
    const ms = state.variant === "light" ? 4500 : 8500;
    const close = window.setTimeout(() => {
      setState((prev) => (prev && prev.id === state.id ? { ...prev, exiting: true } : prev));
      window.setTimeout(emitDone, 240);
    }, ms);
    return () => window.clearTimeout(close);
  }, [state?.id]);

  // Dispatch a click action back to the main window so it can decide
  // (start a break, push remainingSec back, etc.).
  const sendAction = async (action: "accept" | "later" | "dismiss") => {
    try {
      const { emit } = await import("@tauri-apps/api/event");
      await emit("notification://action", { action });
    } catch {
      /* ignore — main window may not be listening */
    }
    setState((prev) => (prev ? { ...prev, exiting: true } : prev));
    window.setTimeout(emitDone, 240);
  };

  if (!state) return null;

  if (state.variant === "light") {
    return (
      <div className="notif-root">
        <div className={`notif-card ${state.exiting ? "notif-out" : "notif-in"}`}>
          <div className="notif-icon">
            <Eye size={14} strokeWidth={1.75} />
          </div>
          <div className="notif-body">
            <div className="notif-title">{t("alerts.lightTitle")}</div>
            <div className="notif-sub">
              {t("alerts.lightBody", { streak: formatMMSS(state.streakSec) })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // medium
  return (
    <div className="notif-root">
      <div className={`notif-card medium ${state.exiting ? "notif-out" : "notif-in"}`}>
        <div className="notif-row">
          <div className="notif-icon">
            <Eye size={16} strokeWidth={1.75} />
          </div>
          <div className="notif-body">
            <div className="notif-title">{t("alerts.title")}</div>
            <div className="notif-sub">
              {t("alerts.body", { streak: formatMMSS(state.streakSec) })}
            </div>
          </div>
        </div>
        <div className="notif-actions">
          <button className="btn-ghost notif-btn" onClick={() => sendAction("later")}>
            {t("alerts.later")}
          </button>
          <button className="btn-primary notif-btn" onClick={() => sendAction("accept")}>
            {t("alerts.startBreak")}
          </button>
        </div>
      </div>
    </div>
  );
}

async function emitDone() {
  try {
    const { emit } = await import("@tauri-apps/api/event");
    await emit("notification://done", {});
  } catch {
    /* ignore */
  }
}
