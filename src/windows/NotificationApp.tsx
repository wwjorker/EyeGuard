import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Eye, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSatelliteTheme } from "../lib/themeListener";

type Variant = "light" | "medium" | "drink" | "posture" | "celebration";

type IconComponent = LucideIcon | React.FC<{ size?: number; strokeWidth?: number }>;

// Water drop with a ripple ring underneath. Replaces Lucide's Droplet so the
// drink reminder reads as part of the plant theme (rain on a leaf).
const DropletIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <ellipse cx="12" cy="20" rx="6" ry="1.4" fill="currentColor" opacity="0.18">
      <animate attributeName="rx" values="3;6;3" dur="2.4s" repeatCount="indefinite" />
      <animate attributeName="opacity" values="0.4;0.05;0.4" dur="2.4s" repeatCount="indefinite" />
    </ellipse>
    <path
      d="M12 3 C 12 3 6 10 6 14 C 6 17.3 8.7 20 12 20 C 15.3 20 18 17.3 18 14 C 18 10 12 3 12 3 Z"
      fill="currentColor"
      opacity="0.92"
    />
    <ellipse cx="10" cy="12" rx="1.6" ry="2.2" fill="#fff" opacity="0.55" />
  </svg>
);

// A small potted leaf gently swaying. Replaces Lucide PersonStanding so the
// posture reminder feels like the windowsill plant nudging you to sit up.
const PostureIcon: React.FC<{ size?: number }> = ({ size = 16 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
    <g style={{ transformOrigin: "12px 18px", animation: "posture-sway 3.2s ease-in-out infinite" }}>
      <path d="M12 18 L12 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path
        d="M12 12 C 8 12 6.5 9 7 6 C 10 6.5 12 8 12 12 Z"
        fill="currentColor"
        opacity="0.85"
      />
      <path
        d="M12 9 C 16 9 17.5 6 17 3 C 14 3.5 12 5 12 9 Z"
        fill="currentColor"
        opacity="0.7"
      />
    </g>
    <path
      d="M7 18 L17 18 L15.5 22 L8.5 22 Z"
      fill="currentColor"
      opacity="0.45"
    />
    <style>{`@keyframes posture-sway { 0%,100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }`}</style>
  </svg>
);

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

const VARIANT_ICON: Record<Variant, IconComponent> = {
  light: Eye,
  medium: Eye,
  drink: DropletIcon,
  posture: PostureIcon,
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
  useSatelliteTheme();

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
