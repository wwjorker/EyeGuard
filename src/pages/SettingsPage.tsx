import {
  Bell,
  Clock,
  Coffee,
  Download,
  EyeOff,
  FolderTree,
  Hourglass,
  Palette,
  Power,
  ShieldOff,
  Trash2,
  Volume2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { WhitelistEditor } from "../components/settings/WhitelistEditor";
import { CategoryEditor } from "../components/settings/CategoryEditor";
import { exportCsv, exportJson } from "../lib/export";
import { useAlertCommander } from "../hooks/useAlertOrchestrator";
import { Slider } from "../components/settings/Slider";
import { Switch } from "../components/settings/Switch";
import { SettingRow } from "../components/settings/SettingRow";
import { SettingGroup } from "../components/settings/SettingGroup";
import { useSettingsStore, AlertLevel } from "../stores/settingsStore";
import { purgeAll } from "../lib/db";

const ALERT_LEVELS: AlertLevel[] = ["light", "medium", "hard"];

export function SettingsPage() {
  const s = useSettingsStore();
  const update = s.update;
  const { t } = useTranslation();
  const fireTest = useAlertCommander((c) => c.fireTest);

  const minUnit = t("settings.units.min");
  const secUnit = t("settings.units.sec");
  const minShort = t("settings.units.minShort");
  const daysUnit = t("settings.units.days");
  const timesUnit = t("settings.units.times");

  const formatMinutes = (sec: number) => `${Math.round(sec / 60)} ${minUnit}`;
  const formatSeconds = (sec: number) => `${sec} ${secUnit}`;
  const formatMinutesShort = (sec: number) => `${Math.round(sec / 60)}${minShort}`;

  return (
    <section className="flex-1 page-enter overflow-y-auto px-4 pb-6 pt-2">
      <div className="flex flex-col gap-3">
        <SettingGroup title={t("settings.groups.timing")} Icon={Clock}>
          <SettingRow
            label={t("settings.rows.workInterval")}
            hint={t("settings.rows.workIntervalHint")}
            control={
              <Slider
                value={s.workIntervalSec}
                min={30}
                max={120 * 60}
                step={30}
                onChange={(v) => update("workIntervalSec", v)}
                format={(sec) => (sec < 60 ? `${sec} ${secUnit}` : formatMinutes(sec))}
              />
            }
          />
          <SettingRow
            label={t("settings.rows.breakDuration")}
            hint={t("settings.rows.breakDurationHint")}
            control={
              <Slider
                value={s.breakDurationSec}
                min={5}
                max={300}
                step={5}
                onChange={(v) => update("breakDurationSec", v)}
                format={formatSeconds}
              />
            }
          />
          <SettingRow
            label={t("settings.rows.idleThreshold")}
            hint={t("settings.rows.idleThresholdHint")}
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

        <SettingGroup title={t("settings.groups.alerts")} Icon={Bell}>
          <SettingRow
            label={t("settings.rows.alertLevel")}
            hint={t("settings.rows.alertLevelHint")}
            control={
              <div className="eg-segmented" role="tablist">
                {ALERT_LEVELS.map((key) => (
                  <button
                    key={key}
                    aria-selected={s.alertLevel === key}
                    onClick={() => update("alertLevel", key)}
                  >
                    {t(`settings.alertLevels.${key}`)}
                  </button>
                ))}
              </div>
            }
          />
          <SettingRow
            label={t("settings.rows.strictMode")}
            hint={t("settings.rows.strictModeHint")}
            control={
              <Switch
                checked={s.strictMode}
                onChange={(v) => update("strictMode", v)}
              />
            }
          />
          <SettingRow
            label={t("settings.rows.testAlert")}
            hint={t("settings.rows.testAlertHint")}
            control={
              <button className="btn-ghost" onClick={() => fireTest()}>
                {t("settings.actions.trigger")}
              </button>
            }
          />
        </SettingGroup>

        <SettingGroup title={t("settings.groups.sound")} Icon={Volume2}>
          <SettingRow
            label={t("settings.rows.soundEffects")}
            control={
              <Switch
                checked={s.soundEnabled}
                onChange={(v) => update("soundEnabled", v)}
              />
            }
          />
          <SettingRow
            label={t("settings.rows.volume")}
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

        <SettingGroup title={t("settings.groups.smartSnooze")} Icon={Hourglass}>
          <SettingRow
            label={t("settings.rows.smartSnooze")}
            hint={t("settings.rows.smartSnoozeHint")}
            control={
              <Switch
                checked={s.smartSnoozeEnabled}
                onChange={(v) => update("smartSnoozeEnabled", v)}
              />
            }
          />
          <SettingRow
            label={t("settings.rows.snoozeDur")}
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
            label={t("settings.rows.snoozeMax")}
            control={
              <Slider
                value={s.snoozeMaxCount}
                min={1}
                max={6}
                onChange={(v) => update("snoozeMaxCount", v)}
                format={(v) => `${v}${timesUnit}`}
              />
            }
          />
        </SettingGroup>

        <SettingGroup title={t("settings.groups.health")} Icon={Coffee}>
          <SettingRow
            label={t("settings.rows.drink")}
            control={
              <Switch
                checked={s.drinkReminder}
                onChange={(v) => update("drinkReminder", v)}
              />
            }
          />
          <SettingRow
            label={t("settings.rows.posture")}
            control={
              <Switch
                checked={s.postureReminder}
                onChange={(v) => update("postureReminder", v)}
              />
            }
          />
        </SettingGroup>

        <SettingGroup title={t("settings.groups.privacy")} Icon={EyeOff}>
          <SettingRow
            label={t("settings.rows.footprint")}
            hint={t("settings.rows.footprintHint")}
            control={
              <Switch
                checked={s.appFootprintEnabled}
                onChange={(v) => update("appFootprintEnabled", v)}
              />
            }
          />
          <SettingRow
            label={t("settings.rows.retention")}
            control={
              <Slider
                value={s.dataRetentionDays}
                min={7}
                max={365}
                step={1}
                onChange={(v) => update("dataRetentionDays", v)}
                format={(v) => `${v}${daysUnit}`}
              />
            }
          />
          <SettingRow
            label={t("settings.rows.purge")}
            hint={t("settings.rows.purgeHint")}
            control={
              <button
                className="btn-ghost flex items-center gap-2"
                style={{ color: "var(--eg-pink)", borderColor: "rgba(236,72,153,0.25)" }}
                onClick={() => {
                  if (window.confirm(t("settings.actions.purgeConfirm"))) {
                    void purgeAll();
                  }
                }}
              >
                <Trash2 size={12} />
                <span>{t("settings.actions.purge")}</span>
              </button>
            }
          />
        </SettingGroup>

        <SettingGroup title={t("settings.groups.dnd")} Icon={ShieldOff}>
          <SettingRow
            label={t("settings.rows.autoDndMeetings")}
            hint={t("settings.rows.autoDndMeetingsHint")}
            control={
              <Switch
                checked={s.dndMeetings}
                onChange={(v) => update("dndMeetings", v)}
              />
            }
          />
          <SettingRow
            label={t("settings.rows.autoDndGames")}
            hint={t("settings.rows.autoDndGamesHint")}
            control={
              <Switch
                checked={s.dndGames}
                onChange={(v) => update("dndGames", v)}
              />
            }
          />
          <div className="py-3">
            <div className="text-[11px] mb-2" style={{ color: "var(--eg-muted)" }}>
              {t("common.dndHint")}
            </div>
            <WhitelistEditor />
          </div>
        </SettingGroup>

        <SettingGroup title={t("settings.groups.categories")} Icon={FolderTree}>
          <CategoryEditor />
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
          <SettingRow
            label={t("settings.rows.showOnboarding")}
            hint={t("settings.rows.showOnboardingHint")}
            control={
              <button
                className="btn-ghost"
                onClick={() => update("seenOnboarding", false)}
                disabled={!s.seenOnboarding}
              >
                {t("settings.actions.trigger")}
              </button>
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
