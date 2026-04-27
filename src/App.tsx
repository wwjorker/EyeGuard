import { useCallback, useEffect, useState } from "react";
import { TopBar } from "./components/TopBar";
import { TimerPage } from "./pages/TimerPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { BreakOverlay } from "./components/BreakOverlay";
import { useTimerStore } from "./stores/timerStore";
import { useTrayBridge } from "./hooks/useTrayBridge";
import { useActivityBridge } from "./hooks/useActivityBridge";

export type PageKey = "timer" | "stats" | "pomodoro" | "settings";

function App() {
  const [page, setPage] = useState<PageKey>("timer");
  const tick = useTimerStore((s) => s.tick);

  const handleNavigate = useCallback((next: string) => {
    if (next === "timer" || next === "stats" || next === "pomodoro" || next === "settings") {
      setPage(next);
    }
  }, []);
  useTrayBridge(handleNavigate);
  useActivityBridge();

  useEffect(() => {
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [tick]);

  return (
    <main className="relative h-full w-full bg-bg">
      <div className="app-frame">
        <TopBar page={page} onNavigate={setPage} />
        <div className="flex-1 flex flex-col">
          {page === "timer" && <TimerPage />}
          {page === "stats" && <PlaceholderPage title="stats" hint="phase 5 will bring app-level analytics" />}
          {page === "pomodoro" && <PlaceholderPage title="pomodoro" hint="phase 6 will introduce focus cycles" />}
          {page === "settings" && <PlaceholderPage title="settings" hint="phase 3 will unlock all preferences" />}
        </div>
      </div>
      <BreakOverlay />
    </main>
  );
}

export default App;
