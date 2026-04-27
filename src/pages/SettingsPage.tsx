import {
  Bell,
  Clock,
  Coffee,
  Download,
  EyeOff,
  Hourglass,
  Palette,
  Power,
  ShieldOff,
  Trash2,
  Volume2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { WhitelistEditor } from "../components/settings/WhitelistEditor";
import { exportCsv, exportJson } from "../lib/export";
import { Slider } from "../components/settings/Slider";
import { Switch } from "../components/settings/Switch";
import { SettingRow } from "../components/settings/SettingRow";
import { SettingGroup } from "../components/settings/SettingGroup";
import { useSettingsStore, AlertLevel } from "../stores/settingsStore";
import { purgeAll } from "../lib/db";

const formatMinutes = (sec: number) => `${Math.round(sec / 60)} min`;
const formatSeconds = (sec: number) => `${sec} s`;
const formatMinutesShort = (sec: number) => `${Math.round(sec / 60)}m`;

const ALERT_LEVELS: { key: AlertLevel; label: string }[] = [
  { key: "light", label: "light" },
  { key: "medium", label: "medium" },
  { key: "hard", label: "hard" },
];

export function SettingsPage() {
  const s = useSettingsStore();
  const update = s.update;
  const { t } = useTranslation();

  return (
    <section className="flex-1 page-enter overflow-y-auto px-4 pb-6 pt-2">
      <div className="flex flex-col gap-3">
        <SettingGroup title="timing" Icon={Clock}>
          <SettingRow
            label="Work interval"
            hint="Time between breaks"
            control={
              <Slider
                value={s.workIntervalSec}
                min={10 * 60}
                max={120 * 60}
                step={5 * 60}
                onChange={(v) => update("workIntervalSec", v)}
                format={formatMinutes}
              />
            }
          />
          <SettingRow
            label="Break duration"
            hint="How long each rest lasts"
            control={
              <Slider
                value={s.breakDurationSec}
                min={10}
                max={300}
                step={5}
                onChange={(v) => update("breakDurationSec", v)}
                format={formatSeconds}
              />
            }
          />
          <SettingRow
            label="Idle threshold"
            hint="Pause when away for…"
            control={
              <Slider
                value={s.idleThresholdSec}
                min={60}
                max={30 * 60}
                step={30}
                onChange={(v) => update("idleThresholdSec", v)}
                format={formatMinutesShort}
              />
            }
          />
        </SettingGroup>

        <SettingGroup title="alerts" Icon={Bell}>
          <SettingRow
            label="Alert level"
            hint="Light · Medium · Hard"
            control={
              <div className="eg-segmented" role="tablist">
                {ALERT_LEVELS.map((l) => (
                  <button
                    key={l.key}
                    aria-selected={s.alertLevel === l.key}
                    onClick={() => update("alertLevel", l.key)}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            }
          />
          <SettingRow
            label="Strict mode"
            hint="Hard alerts can't be skipped"
            control={
              <Switch
                checked={s.strictMode}
                onChange={(v) => update("strictMode", v)}
              />
            }
          />
        </SettingGroup>

        <SettingGroup title="sound" Icon={Volume2}>
          <SettingRow
            label="Sound effects"
            control={
              <Switch
                checked={s.soundEnabled}
                onChange={(v) => update("soundEnabled", v)}
              />
            }
          />
          <SettingRow
            label="Volume"
            control={
              <Slider
                value={s.soundVolume}
                min={0}
                max={100}
                onChange={(v) => update("soundVolume", v)}
                format={(v) => `${v}%`}
              />
            }
          />
        </SettingGroup>

        <SettingGroup title="smart snooze" Icon={Hourglass}>
          <SettingRow
            label="Auto-defer when fullscreen"
            hint="Skip alert if a video / game is playing"
            control={
              <Switch
                checked={s.smartSnoozeEnabled}
                onChange={(v) => update("smartSnoozeEnabled", v)}
              />
            }
          />
          <SettingRow
            label="Defer duration"
            control={
              <Slider
                value={s.snoozeDurationSec}
                min={5 * 60}
                max={30 * 60}
                step={60}
                onChange={(v) => update("snoozeDurationSec", v)}
                format={formatMinutes}
              />
            }
          />
          <SettingRow
            label="Max consecutive defers"
            control={
              <Slider
                value={s.snoozeMaxCount}
                min={1}
                max={6}
                onChange={(v) => update("snoozeMaxCount", v)}
                format={(v) => `${v}x`}
              />
            }
          />
        </SettingGroup>

        <SettingGroup title="health" Icon={Coffee}>
          <SettingRow
            label="Drink reminder"
            control={
              <Switch
                checked={s.drinkReminder}
                onChange={(v) => update("drinkReminder", v)}
              />
            }
          />
          <SettingRow
            label="Posture reminder"
            control={
              <Switch
                checked={s.postureReminder}
                onChange={(v) => update("postureReminder", v)}
              />
            }
          />
        </SettingGroup>

        <SettingGroup title="privacy" Icon={EyeOff}>
          <SettingRow
            label="App footprint tracking"
            hint="Record which apps you spend time in"
            control={
              <Switch
                checked={s.appFootprintEnabled}
                onChange={(v) => update("appFootprintEnabled", v)}
              />
            }
          />
          <SettingRow
            label="Data retention"
            control={
              <Slider
                value={s.dataRetentionDays}
                min={7}
                max={365}
                step={1}
                onChange={(v) => update("dataRetentionDays", v)}
                format={(v) => `${v}d`}
              />
            }
          />
          <SettingRow
            label="Clear all stats"
            hint="Wipes app footprint and break history"
            control={
              <button
                className="btn-ghost flex items-center gap-2"
                style={{ color: "var(--eg-pink)", borderColor: "rgba(236,72,153,0.25)" }}
                onClick={() => {
                  void purgeAll();
                }}
              >
                <Trash2 size={12} />
                <span>purge</span>
              </button>
            }
          />
        </SettingGroup>

        <SettingGroup title={t("settings.groups.dnd")} Icon={ShieldOff}>
          <div className="py-3">
            <div className="text-[11px] mb-2" style={{ color: "var(--eg-muted)" }}>
              {t("common.dndHint")}
            </div>
            <WhitelistEditor />
          </div>
        </SettingGroup>

        <SettingGroup title={t("settings.groups.appearance")} Icon={Palette}>
          <SettingRow
            label={t("settings.rows.theme")}
            control={
              <div className="eg-segmented" role="tablist">
                {(["dark", "light", "system"] as const).map((opt) => (
                  <button
                    key={opt}
                    aria-selected={s.theme === opt}
                    onClick={() => update("theme", opt)}
                  >
                    {t(`settings.themeOptions.${opt}`)}
                  </button>
                ))}
              </div>
            }
          />
          <SettingRow
            label={t("settings.rows.language")}
            control={
              <div className="eg-segmented" role="tablist">
                {(["zh", "en"] as const).map((opt) => (
                  <button
                    key={opt}
                    aria-selected={s.language === opt}
                    onClick={() => update("language", opt)}
                  >
                    {t(`settings.langOptions.${opt}`)}
                  </button>
                ))}
              </div>
            }
          />
        </SettingGroup>

        <SettingGroup title={t("settings.groups.system")} Icon={Power}>
          <SettingRow
            label={t("settings.rows.autostart")}
            control={
              <Switch checked={s.autostart} onChange={(v) => update("autostart", v)} />
            }
          />
          <SettingRow
            label={t("settings.rows.exportJson")}
            control={
              <button
                className="btn-ghost flex items-center gap-2"
                onClick={() => {
                  void exportJson();
                }}
              >
                <Download size={12} />
                JSON
              </button>
            }
          />
          <SettingRow
            label={t("settings.rows.exportCsv")}
            control={
              <button
                className="btn-ghost flex items-center gap-2"
                onClick={() => {
                  void exportCsv();
                }}
              >
                <Download size={12} />
                CSV
              </button>
            }
          />
        </SettingGroup>
      </div>
    </section>
  );
}
