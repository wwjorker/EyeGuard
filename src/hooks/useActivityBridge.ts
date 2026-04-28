import { useEffect } from "react";
import { useTimerStore } from "../stores/timerStore";

/**
 * Listens for system idle/active events emitted from the Rust monitor task.
 * Maps inactivity to the "idle" timer state so the UI can distinguish
 * "auto-paused because you walked away" from "I tapped pause myself".
 *
 * Manual pauses keep state="paused"; this hook only flips between
 * active <-> idle. Break state is never overridden — the break countdown
 * keeps running even if the user stops touching the keyboard.
 */
export function useActivityBridge() {
  const setState = useTimerStore((s) => s.setState);

  useEffect(() => {
    const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

    if (isTauri) {
      let unlistenFns: Array<() => void> = [];
      let cancelled = false;
      (async () => {
        try {
          const { listen } = await import("@tauri-apps/api/event");
          const u1 = await listen("activity://idle", () => {
            const cur = useTimerStore.getState().state;
            if (cur === "active") setState("idle");
          });
          const u2 = await listen("activity://active", () => {
            const cur = useTimerStore.getState().state;
            if (cur === "idle") setState("active");
          });
          if (cancelled) {
            u1();
            u2();
            return;
          }
          unlistenFns = [u1, u2];
        } catch {
          /* not available */
        }
      })();
      return () => {
        cancelled = true;
        unlistenFns.forEach((fn) => fn());
      };
    }

    // Browser fallback (5min idle on document events)
    let lastInput = Date.now();
    const ping = () => {
      lastInput = Date.now();
      const cur = useTimerStore.getState().state;
      if (cur === "idle") setState("active");
    };
    ["mousemove", "mousedown", "keydown", "wheel", "touchstart"].forEach((evt) =>
      window.addEventListener(evt, ping, { passive: true }),
    );
    const id = window.setInterval(() => {
      if (Date.now() - lastInput > 5 * 60 * 1000) {
        const cur = useTimerStore.getState().state;
        if (cur === "active") setState("idle");
      }
    }, 5_000);

    return () => {
      ["mousemove", "mousedown", "keydown", "wheel", "touchstart"].forEach((evt) =>
        window.removeEventListener(evt, ping),
      );
      window.clearInterval(id);
    };
  }, [setState]);
}
