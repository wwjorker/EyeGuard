import { useEffect, useRef } from "react";
import { useTimerStore } from "../stores/timerStore";
import { insertBreak } from "../lib/db";

/**
 * Records every completed (or skipped) break into SQLite by watching the
 * counters in the timer store. The orchestration is: when state leaves
 * `break`, we compare the new completed/skipped counters against the
 * previous tick to figure out which kind of event happened.
 */
export function useBreakLogger() {
  const snapRef = useRef({
    state: useTimerStore.getState().state,
    completed: useTimerStore.getState().completedBreaks,
    skipped: useTimerStore.getState().skippedBreaks,
  });

  useEffect(() => {
    const unsub = useTimerStore.subscribe((s) => {
      const prev = snapRef.current;
      const justLeftBreak = prev.state === "break" && s.state !== "break";
      if (justLeftBreak) {
        const skipped = s.skippedBreaks > prev.skipped;
        void insertBreak(s.breakDurationSec, skipped);
      }
      snapRef.current = {
        state: s.state,
        completed: s.completedBreaks,
        skipped: s.skippedBreaks,
      };
    });
    return unsub;
  }, []);
}
