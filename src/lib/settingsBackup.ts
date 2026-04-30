// Export / import / reset for the settings JSON in localStorage.
// Stats data (footprint, breaks) lives in SQLite and is exported
// separately from `lib/export.ts`.

import { DEFAULT_SETTINGS } from "../stores/settingsStore";

const STORAGE_KEY = "eyeguard.settings.v1";

function stamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportSettings() {
  const raw = localStorage.getItem(STORAGE_KEY) ?? JSON.stringify(DEFAULT_SETTINGS);
  let pretty: string;
  try {
    pretty = JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    pretty = raw;
  }
  const blob = new Blob([pretty], { type: "application/json" });
  triggerDownload(blob, `eyeguard-settings-${stamp()}.json`);
}

export interface ImportResult {
  ok: boolean;
  reason?: string;
}

export async function importSettings(file: File): Promise<ImportResult> {
  let text: string;
  try {
    text = await file.text();
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    return { ok: false, reason: `not valid JSON: ${String(err)}` };
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: "expected an object" };
  }
  // Merge with defaults so older exports without newer keys still work.
  const merged = { ...DEFAULT_SETTINGS, ...(parsed as Record<string, unknown>) };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch (err) {
    return { ok: false, reason: `localStorage write failed: ${String(err)}` };
  }
  // Reload so every store rehydrates from the new payload cleanly.
  window.location.reload();
  return { ok: true };
}

export function resetSettingsToDefaults() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
  } catch {
    /* ignore */
  }
  window.location.reload();
}
