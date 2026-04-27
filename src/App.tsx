import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { TopBar } from "./components/TopBar";
import { TimerPage } from "./pages/TimerPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PomodoroPage } from "./pages/PomodoroPage";

const StatsPage = lazy(() => import("./pages/StatsPage").then((m) => ({ default: m.StatsPage })));
import { BreakOverlay } from "./components/BreakOverlay";
import { AlertToast } from "./components/AlertToast";
import { FollowupToast } from "./components/FollowupToast";
import { useTimerStore } from "./stores/timerStore";
import { useTrayBridge } from "./hooks/useTrayBridge";
import { useActivityBridge } from "./hooks/useActivityBridge";
import { useSettingsSync } from "./hooks/useSettingsSync";
import { useAlertOrchestrator } from "./hooks/useAlertOrchestrator";
import { useFootprintBridge } from "./hooks/useFootprintBridge";
import { useBreakLogger } from "./hooks/useBreakLogger";
import { useHotkeys } from "./hooks/useHotkeys";

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
  useSettingsSync();
  useFootprintBridge();
  useBreakLogger();
  useHotkeys();
  const alerts = useAlertOrchestrator();

  useEffect(() => {
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [tick]);

  return (
    <main className="relative h-full w-full bg-bg">
      <div className="app-frame">
        <TopBar page={page} onNavigate={setPage} />
        <div className="flex-1 flex flex-col min-h-0">
          {page === "timer" && <TimerPage />}
          {page === "stats" && (
            <Suspense fallback={<div className="flex-1" />}>
              <StatsPage />
            </Suspense>
          )}
          {page === "pomodoro" && <PomodoroPage />}
          {page === "settings" && <SettingsPage />}
        </div>
      </div>
      <BreakOverlay />
      <AlertToast
        visible={alerts.toastVisible}
        onAccept={alerts.acceptToast}
        onDismiss={alerts.dismissToast}
      />
      <FollowupToast />
    </main>
  );
}

export default App;
