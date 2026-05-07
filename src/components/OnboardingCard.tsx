import { Bell, Coffee, Keyboard, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSettingsStore } from "../stores/settingsStore";

/**
 * Cold-start onboarding card. Renders a fullscreen-within-the-frame overlay
 * the very first time the user opens the app (or any time they manually
 * reset `seenOnboarding`). Single page, no carousel — every detail is
 * visible at a glance, dismiss closes it for good.
 */
export function OnboardingCard() {
  const seen = useSettingsStore((s) => s.seenOnboarding);
  const update = useSettingsStore((s) => s.update);
  const { t } = useTranslation();

  if (seen) return null;

  return (
    <div className="onboard-root">
      <div className="onboard-card">
        <div
          style={{
            fontFamily: "Caveat, cursive",
            fontSize: 13,
            color: "var(--eg-text-soft)",
            letterSpacing: 0.5,
            marginBottom: 4,
          }}
        >
          — a letter from {t("brand")} —
        </div>
        <h2 className="onboard-title">{t("onboarding.welcome")}</h2>
        <p className="onboard-tagline">{t("onboarding.tagline")}</p>

        <section className="onboard-section">
          <header>
            <Bell size={14} strokeWidth={1.75} />
            <span>{t("onboarding.tierTitle")}</span>
          </header>
          <ul>
            <li>
              <span className="onboard-dot" style={{ background: "var(--eg-leaf)" }} />
              <span>{t("onboarding.tierLight")}</span>
            </li>
            <li>
              <span className="onboard-dot" style={{ background: "var(--eg-amber)" }} />
              <span>{t("onboarding.tierMedium")}</span>
            </li>
            <li>
              <span className="onboard-dot" style={{ background: "var(--eg-pink)" }} />
              <span>{t("onboarding.tierHard")}</span>
            </li>
          </ul>
        </section>

        <section className="onboard-section">
          <header>
            <Keyboard size={14} strokeWidth={1.75} />
            <span>{t("onboarding.hotkeysTitle")}</span>
          </header>
          <ul>
            <li>
              <kbd>{t("onboarding.hotkey1")}</kbd>
            </li>
            <li>
              <kbd>{t("onboarding.hotkey2")}</kbd>
            </li>
          </ul>
        </section>

        <section className="onboard-section">
          <header>
            <Coffee size={14} strokeWidth={1.75} />
            <span>{t("onboarding.trayTitle")}</span>
          </header>
          <p className="onboard-hint">{t("onboarding.trayHint")}</p>
        </section>

        <button
          className="onboard-cta"
          onClick={() => update("seenOnboarding", true)}
        >
          <Sparkles size={13} strokeWidth={1.75} />
          <span>{t("onboarding.cta")}</span>
        </button>
      </div>
    </div>
  );
}
