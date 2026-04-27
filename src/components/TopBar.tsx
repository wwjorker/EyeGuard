import { Timer, BarChart3, CircleDot, Settings as SettingsIcon } from "lucide-react";
import type { PageKey } from "../App";
import { useTimerStore } from "../stores/timerStore";

interface TopBarProps {
  page: PageKey;
  onNavigate: (page: PageKey) => void;
}

const TABS: { key: PageKey; label: string; Icon: typeof Timer }[] = [
  { key: "timer", label: "timer", Icon: Timer },
  { key: "stats", label: "stats", Icon: BarChart3 },
  { key: "pomodoro", label: "pomodoro", Icon: CircleDot },
  { key: "settings", label: "settings", Icon: SettingsIcon },
];

export function TopBar({ page, onNavigate }: TopBarProps) {
  const state = useTimerStore((s) => s.state);
  const badgeClass =
    state === "paused" ? "badge-pill paused" : state === "break" ? "badge-pill break" : "badge-pill";
  const badgeLabel = state;

  return (
    <header className="flex items-center justify-between px-5 pt-4">
      <div className="flex items-center gap-4">
        <span className="brand">eyeguard</span>
        <nav className="flex items-center gap-1">
          {TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`tab-btn ${page === key ? "active" : ""}`}
              onClick={() => onNavigate(key)}
              title={label}
            >
              <Icon size={12} strokeWidth={1.75} />
              <span>{label}</span>
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
