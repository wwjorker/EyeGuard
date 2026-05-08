# EyeGuard

> A desktop eye-care companion that lives on your windowsill. Plant theme, snail mascot, time-aware sky — built with Tauri v2 + React.
>
> 桌面护眼伴侣，一只蜗牛守着窗台上的小盆栽，跟着真实时间换天色 —— Tauri v2 + React 构建。

[![build](https://github.com/wwjorker/EyeGuard/actions/workflows/build.yml/badge.svg)](https://github.com/wwjorker/EyeGuard/actions/workflows/build.yml)
![license](https://img.shields.io/badge/license-MIT-5a8a6a)

---

## English

### What it is

EyeGuard is a privacy-first desktop reminder for the 20-20-20 eye-care rule (every 20 minutes, look 20 feet away for 20 seconds). The whole app is staged as a single windowsill scene — sky behind, plant in a pot, snail on the sill — and the timer's state is reflected in the scene. Plant wilts when your health score drops, snail naps during breaks, sky rolls from dawn to dusk to a starry night across the day.

### Highlights

- **Plant Windowsill UI** — every page is a scene: timer + paper countdown card on cream sky, stats as a garden journal, pomodoro as a tomato vine, settings as labelled garden plots. Hand-drawn Caveat headings, Quicksand body, no neon-y gradients.
- **Time-aware sky** — sun arcs across the day, dusk peach at sunset, deep navy with stars at night, fireflies unlocked after 100 breaks.
- **Snail mascot with personality** — 5 moods (happy / focused / sleeping / frowning / cheering), always-on micro-animations (breathing, independent antenna sway, slow blinks), drop shadow, click bounce + 7-stage cycling reactions ("hi there~" → "tickles!" → "i'll just leave…"), customizable name.
- **Tiered alerts** — light toast pill, medium right-bottom paper card with action buttons, hard fullscreen rest scene with a paper countdown + animated eye exercise + sleeping plant.
- **Animated eye exercises during breaks** — figure-8 trace, eye rolls, squeeze-and-release, blink-and-rest, look-away. Picked at random per break.
- **Smart sensing** — auto-pause on idle (Win32 `GetLastInputInfo`), auto-defer when a fullscreen app is in front, DND for meetings (Zoom / Teams / WeChat / Lark / DingTalk) and games (known launchers + fullscreen), plus a custom process whitelist with a one-click "detect foreground" helper.
- **Garden-journal stats** — per-app pie chart, last 7-day bar chart, week-over-week deltas, all rendered with paper textures.
- **Pomodoro mode** — 25 / 5 with long break every 4 cycles, fully tunable. Cycle completion fires a butterfly visit + confetti.
- **Health nudges** — post-break drink reminder (water-drop SVG with ripple) and posture reminder (swaying potted leaf), both throttled and DND-aware.
- **Easter eggs** — click the sun to make it wink, click the plant to make it shake.
- **Privacy first** — 100% offline, all data stays in your AppData directory; one-click purge + JSON export of stats and settings.
- **Bilingual** — Chinese / English, plus dark / light / system theme. Full string parity (255 keys each).

### Tech stack

| Layer | Choice |
|---|---|
| Shell | Tauri v2 (Rust) |
| UI | React 18 · TypeScript · Tailwind for layout, hand-CSS for the garden scenes |
| State | Zustand |
| Charts | Recharts (lazy-loaded only on the Stats tab) |
| Storage | SQLite via `tauri-plugin-sql` (footprint + breaks) + JSON in `localStorage` (settings) |
| Icons | lucide-react + custom inline SVGs (drink, posture, snail, plant, bird, butterfly) |
| Fonts | Quicksand (sans) + Caveat (handwritten) — Google Fonts |
| i18n | react-i18next |
| Plugins | global-shortcut, autostart, notification, shell, sql |

### Install (development)

```bash
# Prerequisites: Node 18+, Rust (rustup), Visual Studio Build Tools on Windows
npm install
npm run tauri dev
```

To build a release bundle:
```bash
npm run tauri build
# → src-tauri/target/release/bundle/{msi,nsis}/
```

The icon assets are regenerated from `scripts/generate-icons.mjs` (single source of truth for both `icon.svg` and the PNG / ICO set).

### Project layout

```
src/                       React front-end
  App.tsx                  Main shell + routing across timer/stats/pomodoro/settings
  windows/                 Dedicated Tauri windows (notification toast, fullscreen break)
  components/garden/       Sky, Plant, Snail, Bird (the windowsill scene)
  components/stats/        AppDistribution, WeeklyChart (lazy)
  hooks/                   useAlertOrchestrator, useActivityBridge, useTrayBridge, …
  stores/                  Zustand stores (timer, settings, footprint, diagnostics)
  lib/                     db, dndPresets, categoryPresets, settingsBackup, themeListener
  i18n/                    zh.json + en.json
src-tauri/                 Rust shell (tray, idle monitor, footprint sampler, fullscreen detect, db)
src-tauri/sql/schema.sql   SQLite schema
scripts/generate-icons.mjs Single source for app icon SVG + PNGs + ICO
```

### Hotkeys

| Combo | Action |
|---|---|
| `Ctrl+Shift+P` | Pause / resume |
| `Ctrl+Shift+B` | Break now |

Both are user-configurable from Settings.

### License

MIT

---

## 中文

### 是什么

EyeGuard 是一个走 20-20-20 用眼规则的桌面伴侣（每 20 分钟看远 20 英尺 20 秒），整个应用做成一幅窗台场景——天空在后、盆栽在窗台、蜗牛趴在边上——计时器的状态会变成场景里的事：健康分低了植物会蔫，休息时蜗牛会打瞌睡，跟着真实时间从晨曦到日落到星空。

### 主要功能

- **植物窗台 UI** — 每一页都是一幅场景：计时页是奶油天 + 纸卡倒计时，统计页是花园日记本，番茄钟页是番茄藤，设置页是分块的菜畦。Caveat 手写体大标题 + Quicksand 正文，没有霓虹渐变。
- **时间感天空** — 太阳一天划过天顶，傍晚变蜜桃色，夜晚深蓝带星，累计 100 次休息后解锁萤火虫。
- **会动会接话的蜗牛** — 5 种心情（happy / focused / sleeping / frowning / cheering），常驻微动（呼吸、两根触角各自摆动、独立眨眼），地影、点击会一弹，连点 7 次会从「嗨～」一路到「我要走啦…」，蜗牛的名字可以自己取。
- **分级提醒** — 轻：小卡片；中：右下角纸卡 + 行动按钮；强：全屏休息场景 + 纸质倒计时 + 护眼小操 + 睡着的盆栽。
- **休息时的护眼小操动画** — 8 字眼动、转眼球、紧闭再放松、慢眨眼、远眺，每次休息随机抽一个。
- **智能感知** — 闲置自动暂停（Win32 `GetLastInputInfo`），全屏应用前台时延期，会议中（Zoom / 腾讯会议 / 飞书 / 钉钉 / 微信）和游戏中自动勿扰，另加自定义白名单 + 一键「检测当前前台」。
- **花园日记本统计** — 应用占比环、最近 7 天柱状图、本周对比上周，全部纸质纹理风格。
- **番茄钟模式** — 25/5，每 4 轮长休息 15 分钟，全部可调。完成一整轮 = 蝴蝶飞过 + 彩纸庆祝。
- **健康互动** — 休息后随机弹饮水提醒（水滴 + 涟漪 SVG）或姿势提醒（晃动的小盆栽 SVG），都受勿扰规则约束、有节流。
- **小彩蛋** — 点太阳会眨眼，点盆栽会抖一下。
- **隐私优先** — 100% 离线，数据仅存放在 AppData，一键清除 + 设置 / 统计 JSON 导出。
- **中英双语 + 三种主题**（深色 / 浅色 / 跟随系统），中英文翻译键完全对齐（各 255 项）。

### 技术栈

见上方英文表格。简言之：Tauri v2 + React 18 + TypeScript + Zustand + Recharts + react-i18next + SQLite。

### 开发与打包

```bash
# 前置：Node 18+ / Rust (rustup) / Windows VS Build Tools
npm install
npm run tauri dev

# 打包发布
npm run tauri build
# 产物在 src-tauri/target/release/bundle/{msi,nsis}/
```

应用图标统一由 `scripts/generate-icons.mjs` 生成（同一份螺旋参数同时输出 SVG 和所有 PNG / ICO）。

### 项目结构

见上方目录树。

### 快捷键

| 组合键 | 动作 |
|---|---|
| `Ctrl+Shift+P` | 暂停 / 恢复 |
| `Ctrl+Shift+B` | 立即休息 |

两个组合键都可以在「设置」里改。

### License

MIT
