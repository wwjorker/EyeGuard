import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { TopBar } from "./components/TopBar";
import { TimerPage } from "./pages/TimerPage";
import { SettingsPage } from "./pages/SettingsPage";
import { PomodoroPage } from "./pages/PomodoroPage";
import { OnboardingCard } from "./components/OnboardingCard";
import { ConfettiBurst } from "./components/ConfettiBurst";
import { useTimerStore } from "./stores/timerStore";
import { useTrayBridge } from "./hooks/useTrayBridge";
import { useActivityBridge } from "./hooks/useActivityBridge";
import { useSettingsSync } from "./hooks/useSettingsSync";
import { useAlertOrchestrator, primeAudio } from "./hooks/useAlertOrchestrator";
import { useFootprintBridge } from "./hooks/useFootprintBridge";
import { useBreakLogger } from "./hooks/useBreakLogger";
import { useHotkeys } from "./hooks/useHotkeys";

const StatsPage = lazy(() =>
  import("./pages/StatsPage").then((m) => ({ default: m.StatsPage })),
);

export type PageKey = "timer" | "stats" | "pomodoro" | "settings";
const TAB_ORDER: PageKey[] = ["timer", "stats", "pomodoro", "settings"];

function App() {
  const [page, setPage] = useState<PageKey>("timer");
  const prevPageRef = useRef<PageKey>("timer");
  const tick = useTimerStore((s) => s.tick);

  const navigate = useCallback((next: PageKey) => {
    setPage((cur) => {
      prevPageRef.current = cur;
      return next;
    });
  }, []);

  const handleNavigate = useCallback(
    (next: string) => {
      if (next === "timer" || next === "stats" || next === "pomodoro" || next === "settings") {
        navigate(next);
      }
    },
    [navigate],
  );

  const direction =
    TAB_ORDER.indexOf(page) >= TAB_ORDER.indexOf(prevPageRef.current) ? "right" : "left";

  useTrayBridge(handleNavigate);
  useActivityBridge();
  useSettingsSync();
  useFootprintBridge();
  useBreakLogger();
  useHotkeys();
  useAlertOrchestrator();

  useEffect(() => {
    const id = window.setInterval(() => tick(), 1000);
    return () => window.clearInterval(id);
  }, [tick]);

  // Mark the active page on <body> so CSS can adapt the window-pane
  // crossbar (only visible on the timer scene).
  useEffect(() => {
    document.body.dataset.page = page;
  }, [page]);

  // Prime the shared AudioContext on the first user gesture so future
  // alert beeps actually play (Webview2 starts contexts in suspended state).
  useEffect(() => {
    const handler = () => {
      primeAudio();
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
    window.addEventListener("pointerdown", handler, { once: true });
    window.addEventListener("keydown", handler, { once: true });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  return (
    <main className="relative h-full w-full bg-bg">
      <div className="app-frame">
        <TopBar page={page} onNavigate={navigate} />
        <div
          key={page}
          data-direction={direction}
          className="page-shell flex-1 flex flex-col min-h-0"
        >
          {page === "timer" && <TimerPage />}
          {page === "stats" && (
            <Suspense fallback={<div className="flex-1" />}>
              <StatsPage />
            </Suspense>
          )}
          {page === "pomodoro" && <PomodoroPage />}
          {page === "settings" && <SettingsPage />}
        </div>
        <ConfettiBurst />
        <OnboardingCard />
      </div>
    </main>
  );
}

export default App;
