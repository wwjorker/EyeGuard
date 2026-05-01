// Default app categorisation rules. Each process name is mapped to one
// of six broad categories so the stats page can group usage in a way
// that's actually informative ("3 hours of browsers" beats "1.2h of
// chrome.exe + 0.8h of msedge.exe + 0.4h of firefox.exe + …").
//
// The user can override any process via the in-app editor; overrides
// live in the `app_category` SQLite table.

import { GAME_APPS, MEETING_APPS } from "./dndPresets";

export const CATEGORIES = [
  "productivity",
  "browser",
  "communication",
  "entertainment",
  "system",
  "other",
] as const;

export type Category = (typeof CATEGORIES)[number];

/** Brand colour per category, used by AppDistribution and CategoryEditor. */
export const CATEGORY_COLORS: Record<Category, string> = {
  productivity: "#34D399", // emerald
  browser: "#6366F1", // indigo
  communication: "#F59E0B", // amber
  entertainment: "#EC4899", // pink
  system: "#A1A1AA", // zinc
  other: "#52525B", // neutral
};

const norm = (s: string): string => s.trim().toLowerCase().replace(/\.exe$/, "");

const PRODUCTIVITY = new Set(
  [
    // Editors / IDEs
    "code",
    "code - insiders",
    "cursor",
    "windsurf",
    "atom",
    "sublime_text",
    "subl",
    "notepad++",
    "notepad",
    "vim",
    "gvim",
    "emacs",
    // JetBrains
    "idea",
    "idea64",
    "pycharm",
    "pycharm64",
    "webstorm",
    "webstorm64",
    "phpstorm",
    "phpstorm64",
    "rider",
    "rider64",
    "datagrip",
    "datagrip64",
    "clion",
    "clion64",
    "goland",
    "goland64",
    "rubymine",
    "rubymine64",
    "appcode",
    "androidstudio",
    "studio",
    "studio64",
    // Microsoft / Visual Studio
    "devenv",
    "winword",
    "excel",
    "powerpnt",
    "outlook",
    "onenote",
    "msaccess",
    "publisher",
    "visio",
    "msproject",
    // WPS / Chinese office
    "wps",
    "wpsoffice",
    "et",
    "wpp",
    "wpsupdate",
    // Apple
    "xcode",
    "pages",
    "numbers",
    "keynote",
    // Notes / writing
    "notion",
    "obsidian",
    "logseq",
    "anki",
    "typora",
    "yinxiang",
    "youdao",
    "marginnote3",
    "marginnote4",
    "scrivener",
    "ulysses",
    // Design / creative
    "figma",
    "sketchapp",
    "ps",
    "photoshop",
    "illustrator",
    "indesign",
    "ai",
    "afterfx",
    "premiere",
    "audition",
    "lightroom",
    "blender",
    "zbrush",
    "maya",
    "3dsmax",
    // Data / science
    "rstudio",
    "matlab",
    "spss",
    "stata",
    "jupyter-notebook",
    "anacondanavigator",
    "spyder",
    // Reference / research
    "zotero",
    "mendeley",
    "endnote",
    "calibre",
    "mendeleydesktop",
    // Diagram / project
    "miro",
    "drawio",
    "lucidchart",
    "trello",
    "asana",
    "todoist",
    "things3",
    "wrike",
    "monday",
    "linear",
    "github desktop",
    "githubdesktop",
    "sourcetree",
    "fork",
    "tower",
    "gitkraken",
    "tortoisegit",
    // Terminals
    "wt",
    "windowsterminal",
    "alacritty",
    "warp",
    "hyper",
    "tabby",
  ].map(norm),
);

const BROWSER = new Set(
  [
    "chrome",
    "chrome - insiders",
    "msedge",
    "edge",
    "firefox",
    "firefoxesr",
    "brave",
    "arc",
    "safari",
    "vivaldi",
    "opera",
    "operagx",
    "tor",
    "tor browser",
    "torbrowser",
    "iexplore",
    "yandex",
    // Chinese browsers
    "360se",
    "360sd",
    "360chrome",
    "qqbrowser",
    "ucbrowser",
    "sogouexplorer",
    "maxthon",
    "liebao",
    "2345explorer",
    "cmcm",
    "cheetah",
  ].map(norm),
);

const SYSTEM = new Set(
  [
    "explorer",
    "taskmgr",
    "cmd",
    "powershell",
    "regedit",
    "control",
    "msconfig",
    "windowsshellexperiencehost",
    "shellexperiencehost",
    "applicationframehost",
    "searchapp",
    "lockapp",
    "settingshost",
    "systemsettings",
    "ctfmon",
    "fontdrvhost",
    "winlogon",
    "lsass",
    "csrss",
    "wininit",
    "smss",
    "services",
    "dwm",
    "sihost",
    "runtimebroker",
    "startmenuexperiencehost",
    "textinputhost",
    "yourphone",
    "phonelink",
    "snippingtool",
    "snipsketch",
    "magnify",
    "calculator",
    "clock",
    "alarms",
    "notepad",
    "mspaint",
    "wordpad",
  ].map(norm),
);

/**
 * Resolve a process name to a category, preferring an explicit user
 * override when given.
 */
export function categoryForProcess(process: string, override?: string | null): Category {
  if (override && CATEGORIES.includes(override as Category)) {
    return override as Category;
  }
  const k = norm(process);
  // Inaccessible processes (admin / protected) come through as "unknown"
  // — treat them like system.
  if (k === "unknown" || k.startsWith("pid:")) return "system";
  if (PRODUCTIVITY.has(k)) return "productivity";
  if (BROWSER.has(k)) return "browser";
  if (MEETING_APPS.has(k)) return "communication";
  if (GAME_APPS.has(k)) return "entertainment";
  if (SYSTEM.has(k)) return "system";
  return "other";
}
