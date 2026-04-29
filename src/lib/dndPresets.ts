// Built-in process name lists for the auto-DND toggles. Intentionally
// generous — false positives just delay an alert while the user is in a
// meeting / game, never the other way round.
//
// All names are lowercase + stripped of `.exe` to match the
// `normalize()` helper used in the orchestrator.

const norm = (s: string) => s.trim().toLowerCase().replace(/\.exe$/, "");

export const MEETING_APPS = new Set(
  [
    // Western
    "zoom",
    "msteams",
    "teams",
    "skype",
    "discord",
    "slack",
    "webex",
    "ciscowebexstart",
    "google meet",
    "googlemeet",
    "googlechrome", // common when meeting in browser — not enabled unless user picks
    // Chinese
    "wechat",
    "weixin",
    "wemeetapp",
    "tencentmeeting",
    "tim",
    "qq",
    "dingtalk",
    "dingtalkapp",
    "lark",
    "larksuite",
    "feishu",
    "feishu meet",
  ].map(norm),
);

export const GAME_APPS = new Set(
  [
    // Launchers / storefronts
    "steam",
    "steamwebhelper",
    "epicgameslauncher",
    "epicwebhelper",
    "battle.net",
    "battlenet",
    "origin",
    "eadesktop",
    "ubisoftconnect",
    "upc",
    "uplay",
    "gog galaxy",
    "galaxyclient",
    "rockstargameslauncher",
    "riotclientservices",
    "leagueclient",
    "leagueclientux",
    // Common big-name games (covers windowed mode where the heuristic
    // fails). Intentionally a small list — fullscreen heuristic catches
    // the long tail.
    "valorant-win64-shipping",
    "valorant",
    "league of legends",
    "leagueoflegends",
    "csgo",
    "cs2",
    "dota2",
    "fortniteclient-win64-shipping",
    "fortnite",
    "minecraft",
    "javaw",
    "overwatch",
    "starcraft",
    "wow",
    "diablo iv",
    "destiny2",
    "apexlegends",
    "r6_vulkan",
    "rocketleague",
    "genshinimpact",
    "yuanshen",
    "zenlesszonezeronlauncher",
    "starrail",
    "honkai",
    "wuwa",
    "wutheringwaves",
    // Chinese / mainstream Steam staples
    "naraka",
    "pubg",
    "tslgame",
  ].map(norm),
);

export const isMeetingProcess = (process: string): boolean =>
  MEETING_APPS.has(norm(process));

export const isGameProcess = (process: string): boolean =>
  GAME_APPS.has(norm(process));
