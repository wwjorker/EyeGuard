import { useState } from "react";
import { Plus, X } from "lucide-react";
import { useSettingsStore } from "../../stores/settingsStore";

export function WhitelistEditor() {
  const list = useSettingsStore((s) => s.dndWhitelist);
  const update = useSettingsStore((s) => s.update);
  const [input, setInput] = useState("");

  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (list.includes(v)) {
      setInput("");
      return;
    }
    update("dndWhitelist", [...list, v]);
    setInput("");
  };

  const remove = (item: string) => {
    update(
      "dndWhitelist",
      list.filter((x) => x !== item),
    );
  };

  const detect = async () => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const fg = (await invoke("current_foreground")) as { process: string } | null;
      if (fg?.process) setInput(fg.process);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2">
        <input
          className="eg-input flex-1"
          placeholder="zoom.exe"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
        />
        <button className="btn-ghost" onClick={detect} title="Detect current foreground app">
          detect
        </button>
        <button className="btn-primary flex items-center gap-1" onClick={add}>
          <Plus size={12} />
          add
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {list.length === 0 && (
          <span className="text-[11px]" style={{ color: "var(--eg-muted)" }}>
            no whitelisted apps yet
          </span>
        )}
        {list.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md"
            style={{
              background: "var(--eg-hover)",
              color: "var(--eg-text)",
            }}
          >
            {item}
            <button
              onClick={() => remove(item)}
              style={{ background: "transparent", border: "none", color: "var(--eg-muted)", cursor: "pointer" }}
            >
              <X size={11} />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
