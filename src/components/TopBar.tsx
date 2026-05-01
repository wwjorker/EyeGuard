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
    <header className="garden-topbar">
      <div className="garden-pill garden-pill-nav">
        <span className="garden-brand">{t("brand")}</span>
        <nav className="garden-nav">
          {TABS.map(({ key, Icon }) => (
            <button
              key={key}
              onClick={() => onNavigate(key)}
              title={t(`nav.${key}`)}
              className={`garden-tab ${page === key ? "active" : ""}`}
            >
              <Icon size={11} strokeWidth={2} />
              <span>{t(`nav.${key}`)}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="garden-pill garden-pill-status">
        <span className="garden-status-dot" style={{ background: badgeColor, boxShadow: `0 0 6px ${badgeColor}` }} />
        <span className="garden-status-text">{t(`status.${state}`)}</span>
      </div>
    </header>
  );
}
