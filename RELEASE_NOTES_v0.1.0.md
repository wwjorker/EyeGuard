# EyeGuard v0.1.0 — first release 🌱

> A windowsill that reminds you to rest your eyes. Plant theme, time-aware sky, a snail you can name.
>
> 一只蜗牛守着窗台上的小盆栽，跟着真实时间换天色，偶尔提醒你抬头看看远方。

---

## English

### What is it

EyeGuard is a privacy-first desktop companion for the **20-20-20** eye-care rule (every 20 minutes look 20 feet away for 20 seconds). Instead of yet another nagging tray clock, the entire app is staged as a single windowsill scene — the timer's state lives *in the scene*: the plant wilts as your health score drops, the snail naps during breaks, the sky rolls from dawn to dusk to a starry night across the day.

### Highlights

**🌅 The windowsill scene**
- Time-aware sky: warm dawn, midday cream, peach dusk, navy night with stars and clouds
- Fireflies unlock after 100 completed breaks
- Snail mascot with 5 moods (happy / focused / sleeping / frowning / cheering), always-on micro-animations (breath, antenna sway, blink), drop shadow, click-bounce reactions
- Customizable snail name (`蜗蜗` / `Slow` by default), set in onboarding or settings
- Easter eggs: click the sun to wink, click the plant to shake

**⏱️ The timer**
- Three alert tiers: light pill toast, medium right-bottom paper card with action buttons, hard fullscreen rest scene with a paper countdown + animated eye exercise + sleeping plant
- Five animated eye exercises (figure-8, eye rolls, squeeze-and-release, blink-and-rest, look-away), randomly picked per break
- Pomodoro mode (25/5, long break every 4) with a tomato-vine progress visual
- Cycle completion fires confetti + a butterfly visit; the break sky has a bird flying past every 12–28s

**🛡️ Smart sensing**
- Auto-pause on idle (Win32 `GetLastInputInfo`)
- Auto-defer when a fullscreen app is in front
- Built-in DND for meetings (Zoom / Teams / WeChat / Lark / DingTalk) and games (known launchers + fullscreen)
- Custom process whitelist with one-click "detect foreground" helper
- Smart snooze (configurable cap)

**📊 Garden-journal stats**
- Per-app pie chart, last 7-day bar chart, week-over-week deltas
- Per-app category overrides (work / browser / media / system / etc.)
- One-click export to CSV / JSON

**🩺 Health nudges**
- Post-break drink reminder (water-drop SVG with ripple) — randomly, ~50%
- Posture reminder (swaying potted leaf) every 3rd break
- Both DND-aware and rate-limited

**🔒 Privacy**
- 100% offline. No telemetry, no network calls.
- All data lives in `%APPDATA%\com.eyeguard.app\`
- One-click purge + JSON export of stats and settings

**🌐 Polish**
- Full bilingual zh / en (255 / 255 strings, 100% parity)
- Dark / light / system theme
- Configurable hotkeys (default `Ctrl+Shift+P` pause, `Ctrl+Shift+B` break-now)

### Install (Windows)

Pick **one** of the installers below.
| Installer | When to use |
|---|---|
| `EyeGuard_0.1.0_x64-setup.exe` (NSIS) | Recommended — smallest, picks UI language at install time |
| `EyeGuard_0.1.0_x64_en-US.msi` | If you prefer MSI + English UI |
| `EyeGuard_0.1.0_x64_zh-CN.msi` | If you prefer MSI + 中文 UI |

> **First-run SmartScreen warning** — this build is **not code-signed**, so Windows Defender will show "Unknown publisher". Click *More info* → *Run anyway*. Code signing will land in a later release.

### Tech stack

Tauri v2 (Rust) + React 18 + TypeScript + Zustand + Recharts + react-i18next + SQLite. Quicksand + Caveat fonts. ~2.5 MB installer.

### Checksums (SHA-256)

```
fd0e319abc64d239816bbae30c7eb32ad0515c71d5417b598df065c06dc2c5f2  EyeGuard_0.1.0_x64_en-US.msi
50c0d13ecec8e8b812de5abd6b2106bedff2cb8f59907d4c5ee0e4bd93d5e73d  EyeGuard_0.1.0_x64_zh-CN.msi
bae54c16359bcc6afc6e20f385ea4f55db6dc39cfced09619f760e758069a38d  EyeGuard_0.1.0_x64-setup.exe
```

---

## 中文

### 是什么

EyeGuard 是一个走 20-20-20 用眼规则的桌面伴侣（每 20 分钟看远 20 英尺看 20 秒）。整个应用做成一幅窗台场景——天空在后、盆栽在窗台、蜗牛趴在边上——计时器的状态会变成场景里的事：健康分低了植物会蔫，休息时蜗牛会打瞌睡，跟着真实时间从晨曦到日落到星空。

### 主要功能

**🌅 窗台场景**
- 跟着系统时间换的天空：清晨暖橘、正午奶油、傍晚蜜桃、夜晚深蓝带云带星
- 累计 100 次休息后解锁萤火虫
- 蜗牛 5 种心情（开心 / 专注 / 睡觉 / 难过 / 欢呼），常驻微动（呼吸 / 触角晃动 / 眨眼），地影，点击会一弹一弹
- 蜗牛的名字可以自己取（默认「蜗蜗」），引导页和设置都能改
- 小彩蛋：点太阳会眨眼，点盆栽会抖一下

**⏱️ 计时器**
- 三档提醒：轻：小卡片；中：右下角纸卡 + 行动按钮；强：全屏休息场景 + 纸质倒计时 + 护眼小操 + 睡着的盆栽
- 5 种带动画的护眼小操（8 字眼动 / 转眼球 / 紧闭再放松 / 慢眨眼 / 远眺），每次休息随机一个
- 番茄钟模式（25/5，每 4 轮长休息），用番茄藤做进度条
- 完成一整轮 = 蝴蝶飞过 + 彩纸庆祝；休息场景的天上每 12–28 秒飞一只小鸟

**🛡️ 智能感知**
- 闲置自动暂停（Win32 `GetLastInputInfo`）
- 全屏应用前台时自动延期
- 内置勿扰名单：会议（Zoom / 腾讯会议 / 飞书 / 钉钉 / 微信）+ 游戏（已知启动器 + 全屏）
- 自定义白名单 + 一键「检测当前前台」
- 智能小睡（次数可配）

**📊 花园日记本统计**
- 应用占比环、最近 7 天柱状图、本周对比上周
- 每个 App 可手动改分类（工作 / 浏览器 / 娱乐 / 系统…）
- 一键导出 CSV / JSON

**🩺 健康互动**
- 休息后随机弹饮水提醒（水滴 + 涟漪 SVG），约 50% 概率
- 每 3 次休息一次姿势提醒（晃动的小盆栽 SVG）
- 都受勿扰规则约束、有节流

**🔒 隐私**
- 100% 离线。无遥测、无任何网络请求
- 所有数据存放在 `%APPDATA%\com.eyeguard.app\`
- 一键清除 + 设置 / 统计 JSON 导出

**🌐 打磨**
- 中英双语全字段对齐（各 255 项）
- 深色 / 浅色 / 跟随系统主题
- 快捷键可改（默认 `Ctrl+Shift+P` 暂停 / `Ctrl+Shift+B` 立即休息）

### 安装（Windows）

下面**任选其一**：
| 安装包 | 选哪个 |
|---|---|
| `EyeGuard_0.1.0_x64-setup.exe`（NSIS） | 推荐——体积最小，安装时可选界面语言 |
| `EyeGuard_0.1.0_x64_en-US.msi` | 想用 MSI + 英文界面 |
| `EyeGuard_0.1.0_x64_zh-CN.msi` | 想用 MSI + 中文界面 |

> **首次运行 SmartScreen 警告** —— 这一版**没做代码签名**，Windows 会提示「未知发布者」。点「更多信息」→「仍要运行」即可。下个版本会补上签名。

### 技术栈

Tauri v2 (Rust) + React 18 + TypeScript + Zustand + Recharts + react-i18next + SQLite。字体用 Quicksand + Caveat。安装包约 2.5 MB。

### 校验和（SHA-256）

```
fd0e319abc64d239816bbae30c7eb32ad0515c71d5417b598df065c06dc2c5f2  EyeGuard_0.1.0_x64_en-US.msi
50c0d13ecec8e8b812de5abd6b2106bedff2cb8f59907d4c5ee0e4bd93d5e73d  EyeGuard_0.1.0_x64_zh-CN.msi
bae54c16359bcc6afc6e20f385ea4f55db6dc39cfced09619f760e758069a38d  EyeGuard_0.1.0_x64-setup.exe
```

---

**License:** MIT
