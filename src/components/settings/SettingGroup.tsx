import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface SettingGroupProps {
  title: string;
  Icon?: LucideIcon;
  children: ReactNode;
}

export function SettingGroup({ title, Icon, children }: SettingGroupProps) {
  return (
    <section
      className="rounded-card px-4 pt-3 pb-1"
      style={{ background: "var(--eg-card)", border: "1px solid var(--eg-line)" }}
    >
      <header className="flex items-center gap-2 pb-2">
        {Icon && <Icon size={14} strokeWidth={1.75} style={{ color: "var(--eg-muted)" }} />}
        <h3
          className="text-[11px] font-medium uppercase"
          style={{ letterSpacing: 1.5, color: "var(--eg-muted)" }}
        >
          {title}
        </h3>
      </header>
      <div>{children}</div>
    </section>
  );
}
