// Single helper used by every "Export…" button. In Tauri it asks the
// Rust backend to drop the file in the user's Downloads folder and
// surfaces the absolute path so the user can find it. In a plain
// browser context it falls back to the standard <a download> trick.

export interface SaveResult {
  ok: boolean;
  path?: string;
  reason?: string;
}

export async function saveText(filename: string, contents: string): Promise<SaveResult> {
  if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const path = await invoke<string>("save_to_downloads", { filename, contents });
      return { ok: true, path };
    } catch (err) {
      return { ok: false, reason: String(err) };
    }
  }
  // Browser fallback — Blob + a.download
  try {
    const blob = new Blob([contents], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: String(err) };
  }
}
