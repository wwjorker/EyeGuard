# EyeGuard

> Smart eye-care assistant for the desktop. Type + Rings dashboard, tiered alerts, app-level analytics — built with Tauri v2 + React.
>
> 智能护眼桌面助手。Type + Rings 仪表盘、分级提醒、应用级用眼统计 —— Tauri v2 + React 构建。

[![build](https://github.com/wwjorker/EyeGuard/actions/workflows/build.yml/badge.svg)](https://github.com/wwjorker/EyeGuard/actions/workflows/build.yml)
![license](https://img.shields.io/badge/license-MIT-34D399)

---

## English

### Highlights
- **Type + Rings UI** — gradient-fade hero timer + four-color metric rings (green / purple / amber / pink).
- **Tiered alerts** — light system notification, medium right-bottom toast, hard full-screen overlay with 80px countdown and rotating photon orbit.
- **Smart sensing** — auto-pause on idle (Win32 `GetLastInputInfo`), auto-defer when a fullscreen app is in front, DND whitelist for meetings.
- **App-level analytics** — per-app usage pie chart, last 7-day bar chart, week-over-week comparison.
- **Pomodoro mode** — 25/5 with long break every 4 cycles, fully tunable.
- **Health nudges** — animated eye exercises during breaks, optional drink + posture follow-ups.
- **Privacy first** — 100% offline, all data stays in your AppData directory; one-click purge.
- **Bilingual** — Chinese / English with theme switching (dark · light · system).

### Tech stack
| Layer | Choice |
|---|---|
| Shell | Tauri v2 (Rust) |
| UI | React 18 · TypeScript · Tailwind CSS |
| State | Zustand |
| Charts | Recharts (lazy-loaded) |
| Storage | SQLite via `tauri-plugin-sql` + JSON in `localStorage` |
| Icons | lucide-react |
| Fonts | Inter (Google Fonts) |
| i18n | react-i18next |

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

### Project layout
```
src/                 React front-end
src-tauri/           Tauri Rust shell (tray, monitor, footprint, fullscreen, db)
src-tauri/sql/       SQLite migrations
DESIGN.md            Type + Rings design system reference
```

### Hotkeys
| Combo | Action |
|---|---|
| `Ctrl+Shift+P` | Pause / resume |
| `Ctrl+Shift+B` | Break now |

### License
MIT

---

## 中文

### 特色
- **Type + Rings 视觉风格** — 渐变淡出超大计时器 + 四色指标环（绿/紫/黄/粉）。
- **分级提醒** — 轻：系统通知；中：右下角浮窗；强：全屏 80px 倒计时遮罩 + 旋转光点。
- **智能感知** — 闲置自动暂停（Win32 `GetLastInputInfo`），全屏应用自动延期，勿扰白名单。
- **应用级用眼统计** — 应用占比环形图、最近 7 天柱状图、本周/上周对比。
- **番茄钟模式** — 25/5，每 4 轮长休息 15 分钟，全部可调。
- **健康互动** — 休息时随机展示带动画的护眼小操，可选饮水 / 姿势提醒。
- **隐私优先** — 100% 离线，数据仅存放在 AppData，一键清除。
- **中英双语 + 三种主题**（深色 / 浅色 / 跟随系统）。

### 技术栈
见上方英文表格。

### 开发与打包
```bash
# 前置：Node 18+ / Rust (rustup) / Windows VS Build Tools
npm install
npm run tauri dev

# 打包发布
npm run tauri build
```

### 项目结构
见上方目录树。

### 快捷键
| 组合键 | 动作 |
|---|---|
| `Ctrl+Shift+P` | 暂停 / 恢复 |
| `Ctrl+Shift+B` | 立即休息 |

### License
MIT
