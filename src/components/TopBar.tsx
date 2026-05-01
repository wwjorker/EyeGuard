import { Timer, BarChart3, CircleDot, Settings as SettingsIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { PageKey } from "../App";
import { useTimerStore } from "../stores/timerStore";

interface TopBarProps {
  page: PageKey;
  onNavigate: (page: PageKey) => void;
}

const TABS: { key: PageKey; Icon: typeof Timer }[] = [
  { key: "timer", Icon: Timer },
  { key: "stats", Icon: BarChart3 },
  { key: "pomodoro", Icon: CircleDot },
  { key: "settings", Icon: SettingsIcon },
];

export function TopBar({ page, onNavigate }: TopBarProps) {
  const state = useTimerStore((s) => s.state);
  const { t } = useTranslation();

  const badgeColor =
    state === "paused" || state === "idle"
      ? "var(--eg-faint)"
      : state === "break"
        ? "var(--eg-purple)"
        : "var(--eg-leaf)";

  return (
    <header
      style={{
        position: "absolute",
        top: 24,
        left: 14,
        right: 14,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        zIndex: 8,
        gap: 8,
      }}
    >
      <div className="topbar-pill" style={topbarPillStyle}>
        <span
          style={{
            fontFamily: "Caveat, cursive",
            fontSize: 18,
            color: "var(--eg-pink)",
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          {t("brand")}
        </span>
        <span style={{ color: "var(--eg-faint)" }}>·</span>
        <nav style={{ display: "flex", gap: 2 }}>
          {TABS.map(({ key, Icon }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              title={t(`nav.${key}`)}
              style={{
                background: page === key ? "var(--eg-pink)" : "transparent",
                color: page === key ? "#fff" : "var(--eg-text-soft)",
                border: "none",
                cursor: "pointer",
                padding: "3px 9px",
                borderRadius: 8,
                fontFamily: "Quicksand, sans-serif",
                fontWeight: 600,
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: "1.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                transition: "background 200ms ease, color 200ms ease",
              }}
            >
              <Icon size={11} strokeWidth={2} />
              <span>{t(`nav.${key}`)}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="topbar-pill" style={badgePillStyle}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: badgeColor,
            boxShadow: `0 0 6px ${badgeColor}`,
          }}
        />
        <span
          style={{
            fontFamily: "Caveat, cursive",
            fontSize: 13,
            color: "var(--eg-text)",
            lineHeight: 1,
          }}
        >
          {t(`status.${state}`)}
        </span>
      </div>
    </header>
  );
}

const topbarPillStyle: React.CSSProperties = {
  background: "rgba(255, 255, 255, 0.78)",
  backdropFilter: "blur(10px)",
  WebkitBackdropFilter: "blur(10px)",
  padding: "6px 12px",
  borderRadius: 18,
  display: "flex",
  alignItems: "center",
  gap: 8,
  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)",
};

const badgePillStyle: React.CSSProperties = {
  ...topbarPillStyle,
  padding: "5px 10px",
};
