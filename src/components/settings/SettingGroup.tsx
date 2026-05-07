import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface SettingGroupProps {
  title: string;
  Icon?: LucideIcon;
  children: ReactNode;
}

/** Garden plot: paper card with a handwritten title + leaf-coloured icon. */
export function SettingGroup({ title, Icon, children }: SettingGroupProps) {
  return (
    <section className="garden-group">
      <header className="garden-group-header">
        {Icon && <Icon size={14} strokeWidth={1.75} />}
        <span>{title}</span>
      </header>
      <div>{children}</div>
    </section>
  );
}
