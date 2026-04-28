import { useEffect, useState } from "react";
import { Droplet, PersonStanding } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFollowupStore } from "../stores/followupStore";

const ICONS = {
  drink: Droplet,
  posture: PersonStanding,
};

const ACCENT = {
  drink: "var(--eg-purple)",
  posture: "var(--eg-amber)",
};

export function FollowupToast() {
  const items = useFollowupStore((s) => s.items);
  const dismiss = useFollowupStore((s) => s.dismiss);
  const head = items[0];
  const [exiting, setExiting] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!head) return;
    setExiting(false);
    const id = window.setTimeout(() => {
      setExiting(true);
      window.setTimeout(() => dismiss(head.id), 220);
    }, 6500);
    return () => window.clearTimeout(id);
  }, [head, dismiss]);

  if (!head) return null;

  const Icon = ICONS[head.kind];
  const accent = ACCENT[head.kind];
  const title = head.kind === "drink" ? t("follow.drinkTitle") : t("follow.postureTitle");
  const body = head.kind === "drink" ? t("follow.drinkBody") : t("follow.postureBody");

  return (
    <div className="fixed z-40" style={{ right: 18, bottom: 18 }}>
      <div
        className={`toast-card ${exiting ? "toast-exit" : "toast-enter"}`}
        style={{ borderColor: "var(--eg-line)" }}
      >
        <div className="flex items-start gap-3">
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: `color-mix(in srgb, ${accent} 15%, transparent)`,
              color: accent,
            }}
          >
            <Icon size={16} strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold" style={{ color: "var(--eg-text)" }}>
              {title}
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "var(--eg-muted)" }}>
              {body}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end mt-2">
          <button
            className="btn-ghost"
            onClick={() => {
              setExiting(true);
              window.setTimeout(() => dismiss(head.id), 220);
            }}
          >
            {t("follow.gotIt")}
          </button>
        </div>
        <style>{`.toast-card::before { background: ${accent} !important; }`}</style>
      </div>
    </div>
  );
}
