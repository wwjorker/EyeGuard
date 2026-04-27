import type { ReactNode } from "react";

interface SettingRowProps {
  label: string;
  hint?: string;
  control: ReactNode;
}

export function SettingRow({ label, hint, control }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-6 py-3" style={{ borderBottom: "1px solid var(--eg-line)" }}>
      <div className="min-w-0 flex-shrink">
        <div className="text-[13px]" style={{ color: "var(--eg-text)" }}>{label}</div>
        {hint && (
          <div className="text-[11px] mt-0.5" style={{ color: "var(--eg-muted)" }}>
            {hint}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 min-w-[160px] justify-end">{control}</div>
    </div>
  );
}
