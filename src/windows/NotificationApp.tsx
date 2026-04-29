import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Droplet, Eye, PersonStanding, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Variant = "light" | "medium" | "drink" | "posture" | "celebration";

interface NotificationPayload {
  variant: Variant;
  streakSec?: number;
  /** Optional translation keys for celebration / milestone copy. */
  titleKey?: string;
  bodyKey?: string;
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

const VARIANT_TIMEOUT_MS: Record<Variant, number> = {
  light: 4500,
  medium: 8500,
  drink: 5500,
  posture: 5500,
  celebration: 5500,
};

const VARIANT_ACCENT: Record<Variant, string> = {
  light: "var(--eg-green)",
  medium: "var(--eg-amber)",
  drink: "var(--eg-purple)",
  posture: "var(--eg-amber)",
  celebration: "var(--eg-pink)",
};

const VARIANT_ACCENT_BG: Record<Variant, string> = {
  light: "rgba(52,211,153,0.15)",
  medium: "rgba(245,158,11,0.15)",
  drink: "rgba(99,102,241,0.15)",
  posture: "rgba(245,158,11,0.15)",
  celebration: "rgba(236,72,153,0.18)",
};

const VARIANT_ICON: Record<Variant, LucideIcon> = {
  light: Eye,
  medium: Eye,
  drink: Droplet,
  posture: PersonStanding,
  celebration: Sparkles,
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
    const ms = VARIANT_TIMEOUT_MS[state.variant];
    const close = window.setTimeout(() => {
      setState((prev) => (prev && prev.id === state.id ? { ...prev, exiting: true } : prev));
      window.setTimeout(emitDone, 240);
    }, ms);
    return () => window.clearTimeout(close);
  }, [state?.id]);

  const sendAction = async (action: "accept" | "later" | "dismiss") => {
    try {
      const { emit } = await import("@tauri-apps/api/event");
      await emit("notification://action", { action });
    } catch {
      /* ignore */
    }
    setState((prev) => (prev ? { ...prev, exiting: true } : prev));
    window.setTimeout(emitDone, 240);
  };

  if (!state) return null;

  const Icon = VARIANT_ICON[state.variant];
  const accent = VARIANT_ACCENT[state.variant];
  const accentBg = VARIANT_ACCENT_BG[state.variant];

  if (state.variant === "medium") {
    return (
      <div className="notif-root">
        <div
          className={`notif-card medium ${state.exiting ? "notif-out" : "notif-in"}`}
          style={{ ["--notif-accent" as string]: accent }}
        >
          <div className="notif-row">
            <div className="notif-icon" style={{ background: accentBg, color: accent }}>
              <Icon size={16} strokeWidth={1.75} />
            </div>
            <div className="notif-body">
              <div className="notif-title">{t("alerts.title")}</div>
              <div className="notif-sub">
                {t("alerts.body", { streak: formatMMSS(state.streakSec ?? 0) })}
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

  // pill-style variants (light, drink, posture)
  const { title, sub } = pillCopy(state, t);
  return (
    <div className="notif-root">
      <div
        className={`notif-card ${state.exiting ? "notif-out" : "notif-in"}`}
        style={{ ["--notif-accent" as string]: accent }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center"
            style={{
              width: 26,
              height: 26,
              borderRadius: 8,
              background: accentBg,
              color: accent,
              flexShrink: 0,
            }}
          >
            <Icon size={13} strokeWidth={1.75} />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="text-[12px] font-semibold" style={{ color: "var(--eg-text)" }}>
              {title}
            </div>
            <div className="text-[10.5px]" style={{ color: "var(--eg-muted)" }}>
              {sub}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function pillCopy(s: State, t: (key: string, opts?: Record<string, unknown>) => string) {
  // Celebration / milestone variants pass explicit translation keys so a
  // single variant can render multiple flavours of copy.
  if (s.titleKey && s.bodyKey) {
    return { title: t(s.titleKey), sub: t(s.bodyKey) };
  }
  switch (s.variant) {
    case "light":
      return {
        title: t("alerts.lightTitle"),
        sub: t("alerts.lightBody", { streak: formatMMSS(s.streakSec ?? 0) }),
      };
    case "drink":
      return {
        title: t("follow.drinkTitle"),
        sub: t("follow.drinkBody"),
      };
    case "posture":
      return {
        title: t("follow.postureTitle"),
        sub: t("follow.postureBody"),
      };
    case "celebration":
      return {
        title: t("celebrate.cycleTitle"),
        sub: t("celebrate.cycleBody"),
      };
    default:
      return { title: "", sub: "" };
  }
}

async function emitDone() {
  try {
    const { emit } = await import("@tauri-apps/api/event");
    await emit("notification://done", {});
  } catch {
    /* ignore */
  }
}
