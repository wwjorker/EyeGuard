import { useTranslation } from "react-i18next";
import { Coffee } from "lucide-react";
import { Slider } from "../components/settings/Slider";
import { Switch } from "../components/settings/Switch";
import { SettingRow } from "../components/settings/SettingRow";
import { SettingGroup } from "../components/settings/SettingGroup";
import { useSettingsStore } from "../stores/settingsStore";
import { useTimerStore } from "../stores/timerStore";

export function PomodoroPage() {
  const enabled = useSettingsStore((s) => s.pomodoroEnabled);
  const workSec = useSettingsStore((s) => s.pomodoroWorkSec);
  const shortBreak = useSettingsStore((s) => s.pomodoroShortBreakSec);
  const longBreak = useSettingsStore((s) => s.pomodoroLongBreakSec);
  const longInterval = useSettingsStore((s) => s.pomodoroLongInterval);
  const update = useSettingsStore((s) => s.update);

  const pomoCount = useTimerStore((s) => s.pomodoroCount);
  const breakKind = useTimerStore((s) => s.currentBreakKind);
  const state = useTimerStore((s) => s.state);
  const { t } = useTranslation();

  const minUnit = t("settings.units.min");
  const formatMinutes = (sec: number) => `${Math.round(sec / 60)} ${minUnit}`;

  // Tomato vine — what's done, what's ripening, what's still growing
  const inCycle = pomoCount % longInterval; // completed in current cycle
  const isLong = state === "break" && breakKind === "long";
  const filled = isLong ? longInterval : inCycle;
  const activeIdx = state === "break" ? -1 : inCycle; // currently focusing on this slot
  const remainingToHarvest = Math.max(0, longInterval - filled - (activeIdx >= 0 ? 1 : 0));

  return (
    <section
      className="flex-1 page-enter overflow-y-auto"
      style={{
        padding: "60px 14px 18px",
        background:
          "linear-gradient(180deg, var(--eg-card-2) 0%, var(--eg-bg) 100%)",
      }}
    >
      <div className="flex flex-col gap-3">
        {/* === Top toggle card === */}
        <div className="garden-group" style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  width: 32, height: 32,
                  borderRadius: 10,
                  background: "rgba(195, 97, 63, 0.14)",
                  color: "var(--eg-pink)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 16,
                }}
              >🍅</span>
              <div>
                <div className="garden-row-label">{t("pomodoro.title")}</div>
                <div className="garden-row-hint">
                  {enabled
                    ? t("pomodoro.hintOn", { count: pomoCount, interval: longInterval })
                    : t("pomodoro.hintOff")}
                </div>
              </div>
            </div>
            <Switch checked={enabled} onChange={(v) => update("pomodoroEnabled", v)} />
          </div>

          {enabled && (
            <>
              <div className="tomato-vine-wrap">
                <div className="tomato-vine-line" />
                {Array.from({ length: longInterval }, (_, i) => {
                  const done = i < filled;
                  const active = i === activeIdx;
                  const labelKey = active
                    ? "pomodoro.tomatoRipening"
                    : done
                      ? "pomodoro.tomatoPicked"
                      : "pomodoro.tomatoGrowing";
                  return (
                    <div key={i} className="tomato-spot" title={`#${i + 1}`}>
                      <div className="tomato-stem" />
                      <div className={`tomato ${active ? "now" : done ? "done" : "future"}`} />
                      <span className={`tomato-label ${active ? "now" : ""}`}>{t(labelKey)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="tomato-vine-end">
                {isLong
                  ? t("pomodoro.harvested")
                  : remainingToHarvest > 0
                    ? t("pomodoro.harvestIn", { count: remainingToHarvest })
                    : t("pomodoro.harvestNow")}
              </div>
            </>
          )}
        </div>

        {enabled && (
          <SettingGroup title={t("pomodoro.groupCadence")} Icon={Coffee}>
            <SettingRow
              label={t("pomodoro.rowWork")}
              control={
                <Slider
                  value={workSec}
                  min={15 * 60}
                  max={60 * 60}
                  step={5 * 60}
                  onChange={(v) => update("pomodoroWorkSec", v)}
                  format={formatMinutes}
                />
              }
            />
            <SettingRow
              label={t("pomodoro.rowShort")}
              control={
                <Slider
                  value={shortBreak}
                  min={2 * 60}
                  max={15 * 60}
                  step={60}
                  onChange={(v) => update("pomodoroShortBreakSec", v)}
                  format={formatMinutes}
                />
              }
            />
            <SettingRow
              label={t("pomodoro.rowLong")}
              control={
                <Slider
                  value={longBreak}
                  min={5 * 60}
                  max={45 * 60}
                  step={60}
                  onChange={(v) => update("pomodoroLongBreakSec", v)}
                  format={formatMinutes}
                />
              }
            />
            <SettingRow
              label={t("pomodoro.rowInterval")}
              hint={t("pomodoro.intervalHint")}
              control={
                <Slider
                  value={longInterval}
                  min={2}
                  max={8}
                  onChange={(v) => update("pomodoroLongInterval", v)}
                  format={(v) => `${v} ${t("pomodoro.cycles")}`}
                />
              }
            />
          </SettingGroup>
        )}
      </div>
    </section>
  );
}
