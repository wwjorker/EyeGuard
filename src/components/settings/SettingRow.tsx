import type { ReactNode } from "react";

interface SettingRowProps {
  label: string;
  hint?: string;
  control: ReactNode;
}

/** A single row inside a SettingGroup (garden plot). */
export function SettingRow({ label, hint, control }: SettingRowProps) {
  return (
    <div className="garden-row">
      <div className="garden-row-info">
        <div className="garden-row-label">{label}</div>
        {hint && <div className="garden-row-hint">{hint}</div>}
      </div>
      <div className="garden-row-control">{control}</div>
    </div>
  );
}
