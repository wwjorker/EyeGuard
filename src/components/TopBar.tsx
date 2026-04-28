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

  const badgeClass =
    state === "paused" || state === "idle"
      ? "badge-pill paused"
      : state === "break"
        ? "badge-pill break"
        : "badge-pill";
  const badgeLabel = t(`status.${state}`);

  return (
    <header className="flex items-center justify-between px-5 pt-4">
      <div className="flex items-center gap-4">
        <span className="brand">{t("brand")}</span>
        <nav className="flex items-center gap-1">
          {TABS.map(({ key, Icon }) => (
            <button
              key={key}
              className={`tab-btn ${page === key ? "active" : ""}`}
              onClick={() => onNavigate(key)}
              title={t(`nav.${key}`)}
            >
              <Icon size={12} strokeWidth={1.75} />
              <span>{t(`nav.${key}`)}</span>
            </button>
          ))}
        </nav>
      </div>
      <span className={badgeClass}>
        <span className="dot" />
        <span>{badgeLabel}</span>
      </span>
    </header>
  );
}
