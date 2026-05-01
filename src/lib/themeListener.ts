// Used by the break / notification windows to follow the main window's
// active theme. Main window emits `theme://changed` whenever the user
// flips theme or system colour preference resolves; each satellite
// window subscribes and applies the right `:root` class.

import { useEffect } from "react";

type Theme = "dark" | "light";

function applyThemeClass(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
}

export function useSatelliteTheme() {
  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;

    let unlisten: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { listen, emit } = await import("@tauri-apps/api/event");
        unlisten = await listen<{ theme: Theme }>("theme://changed", (e) => {
          if (e.payload?.theme) applyThemeClass(e.payload.theme);
        });
        // Ask main to broadcast the current theme so we can sync at boot.
        await emit("theme://request", {});
        if (cancelled) unlisten();
      } catch {
        /* ignore */
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);
}
