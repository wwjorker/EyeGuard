import { useEffect } from "react";
import { insertFootprint } from "../lib/db";
import type { FootprintSegment } from "../stores/footprintStore";
import { useSettingsStore } from "../stores/settingsStore";

/**
 * Listens for `footprint://segment` events from the Rust sampler and inserts
 * each completed segment into SQLite. Also propagates the `appFootprintEnabled`
 * setting to the Rust side so sampling can be turned off from the UI.
 */
export function useFootprintBridge() {
  const enabled = useSettingsStore((s) => s.appFootprintEnabled);

  useEffect(() => {
    const inTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
    if (!inTauri) return;

    let unlisten: (() => void) | null = null;
    let cancelled = false;

    (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("set_footprint_enabled", { enabled });
        const off = await listen<FootprintSegment>("footprint://segment", (e) => {
          void insertFootprint(e.payload);
        });
        if (cancelled) {
          off();
          return;
        }
        unlisten = off;
      } catch (err) {
        console.warn("[eyeguard] footprint bridge", err);
      }
    })();

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [enabled]);
}
