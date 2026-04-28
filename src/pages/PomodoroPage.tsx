import { CircleDot, Coffee } from "lucide-react";
import { useTranslation } from "react-i18next";
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

  const pomodoroCount = useTimerStore((s) => s.pomodoroCount);
  const breakKind = useTimerStore((s) => s.currentBreakKind);
  const { t } = useTranslation();

  const minUnit = t("settings.units.min");
  const formatMinutes = (sec: number) => `${Math.round(sec / 60)} ${minUnit}`;

  return (
    <section className="flex-1 page-enter overflow-y-auto px-4 pb-6 pt-2">
      <div
        className="rounded-card mb-3 px-4 py-4 flex items-center justify-between"
        style={{ background: "var(--eg-card)", border: "1px solid var(--eg-line)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              background: "rgba(99,102,241,0.15)",
              color: "var(--eg-purple)",
            }}
          >
            <CircleDot size={16} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[13px]" style={{ color: "var(--eg-text)" }}>
              {t("pomodoro.title")}
            </div>
            <div className="text-[11px]" style={{ color: "var(--eg-muted)" }}>
              {enabled
                ? t("pomodoro.hintOn", { count: pomodoroCount, interval: longInterval })
                : t("pomodoro.hintOff")}
            </div>
          </div>
        </div>
        <Switch checked={enabled} onChange={(v) => update("pomodoroEnabled", v)} />
      </div>

      {enabled && (
        <>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <PomodoroBubble label={t("pomodoro.cycles")} value={pomodoroCount} accent="var(--eg-purple)" />
            <PomodoroBubble
              label={t("pomodoro.nextBreak")}
              value={
                breakKind === "long"
                  ? t("pomodoro.nextLong")
                  : (pomodoroCount + 1) % longInterval === 0
                    ? t("pomodoro.nextLong")
                    : t("pomodoro.nextShort")
              }
              accent="var(--eg-amber)"
            />
            <PomodoroBubble
              label={t("pomodoro.cadence")}
              value={`${Math.round(workSec / 60)}/${Math.round(shortBreak / 60)}`}
              accent="var(--eg-green)"
            />
          </div>

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
        </>
      )}
    </section>
  );
}

function PomodoroBubble({ label, value, accent }: { label: string; value: string | number; accent: string }) {
  return (
    <div
      className="rounded-card px-3 py-3 flex flex-col gap-1"
      style={{ background: "var(--eg-card)", border: "1px solid var(--eg-line)" }}
    >
      <span className="text-[9px] uppercase" style={{ letterSpacing: 1, color: "var(--eg-muted)" }}>
        {label}
      </span>
      <span className="font-bold tabular-nums" style={{ fontSize: 18, color: accent }}>
        {value}
      </span>
    </div>
  );
}
