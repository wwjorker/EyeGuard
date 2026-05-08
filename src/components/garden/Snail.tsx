import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTimerStore } from "../../stores/timerStore";
import { useSettingsStore } from "../../stores/settingsStore";

/**
 * Mascot snail living on the windowsill. Has 5 moods derived from timer
 * state + recent behaviour, plus a layer of always-on micro-animations
 * (breathing, blinking, antennae sway) so it feels alive rather than a
 * flat sticker. Clicking it pops a bounce + a cycling click-message
 * (different copy on the 1st / 2nd / 3rd+ tap).
 */
type Mood = "happy" | "focused" | "sleeping" | "frowning" | "cheering";

const SHELL_BY_MOOD: Record<Mood, string> = {
  happy: "#c89a4a",
  focused: "#a87c34",
  sleeping: "#9d8a64",
  frowning: "#9a7a5a",
  cheering: "#e0a046",
};

const CLICK_MESSAGES: Record<string, string[]> = {
  zh: ["嗨～", "你戳我啦～", "嘻嘻嘻～", "够啦够啦", "好痒啊…", "蜗壳要碎啦", "我要走啦…"],
  en: ["hi there~", "you poked me!", "hehe stop~", "okay okay", "that tickles…", "my shell!", "i'll just leave…"],
};

export function Snail() {
  const state = useTimerStore((s) => s.state);
  const remaining = useTimerStore((s) => s.remainingSec);
  const work = useTimerStore((s) => s.workIntervalSec);
  const skipped = useTimerStore((s) => s.skippedBreaks);
  const score = useTimerStore((s) => s.healthScore);
  const language = useSettingsStore((s) => s.language);
  const snailName = useSettingsStore((s) => s.snailName);
  const { t } = useTranslation();

  const [bubbleVisible, setBubbleVisible] = useState(false);
  const [clickIdx, setClickIdx] = useState(-1);
  const [bouncing, setBouncing] = useState(false);
  const clickResetRef = useRef<number | null>(null);
  const bounceClearRef = useRef<number | null>(null);

  const mood: Mood = pickMood({ state, remaining, work, skipped, score });

  // Auto-show bubble briefly whenever the mood changes.
  useEffect(() => {
    setClickIdx(-1);
    setBubbleVisible(true);
    const id = window.setTimeout(() => setBubbleVisible(false), 3500);
    return () => window.clearTimeout(id);
  }, [mood]);

  // Cleanup on unmount.
  useEffect(
    () => () => {
      if (clickResetRef.current) window.clearTimeout(clickResetRef.current);
      if (bounceClearRef.current) window.clearTimeout(bounceClearRef.current);
    },
    [],
  );

  const handleClick = () => {
    setClickIdx((i) => Math.min(i + 1, CLICK_MESSAGES.en.length - 1));
    setBubbleVisible(true);
    setBouncing(true);
    if (bounceClearRef.current) window.clearTimeout(bounceClearRef.current);
    bounceClearRef.current = window.setTimeout(() => setBouncing(false), 600);
    if (clickResetRef.current) window.clearTimeout(clickResetRef.current);
    clickResetRef.current = window.setTimeout(() => {
      setClickIdx(-1);
      setBubbleVisible(false);
    }, 4000);
  };

  const moodMessage = pickMessage(mood, t, language);
  const lang = language === "zh" || language === "en" ? language : "en";
  const message = clickIdx >= 0 ? CLICK_MESSAGES[lang][clickIdx] : moodMessage;

  return (
    <>
      <div
        className={`garden-snail-wrap glide ${bouncing ? "snail-bouncing" : ""}`}
        onClick={handleClick}
        onMouseEnter={() => setBubbleVisible(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <SnailSvg mood={mood} />
      </div>
      <div className={`garden-snail-bubble ${bubbleVisible ? "visible" : ""}`}>
        {snailName?.trim() && <span className="garden-snail-name">{snailName.trim()}</span>}
        {message}
      </div>
    </>
  );
}

interface MoodInputs {
  state: string;
  remaining: number;
  work: number;
  skipped: number;
  score: number;
}

function pickMood({ state, remaining, work, skipped, score }: MoodInputs): Mood {
  if (state === "break") return "sleeping";
  if (skipped >= 3 || score < 50) return "frowning";
  if (score >= 95) return "cheering";
  if (state === "active" && work > 0 && remaining < work * 0.25) return "focused";
  return "happy";
}

function pickMessage(mood: Mood, t: (key: string) => string, lang: string): string {
  const tryKey = (key: string) => {
    const v = t(key);
    return v === key ? null : v;
  };
  const k = tryKey(`snail.${mood}`);
  if (k) return k;

  const fallback: Record<string, Record<Mood, string>> = {
    zh: {
      happy: "慢慢来，没什么急的～",
      focused: "再坚持几分钟～",
      sleeping: "嘘…我也要小睡一会",
      frowning: "你跳过太多啦…",
      cheering: "你今天棒极啦！",
    },
    en: {
      happy: "no rush, take it slow ~",
      focused: "almost there… stay with it",
      sleeping: "shh… i'm napping too",
      frowning: "too many skips today…",
      cheering: "you're absolutely crushing it!",
    },
  };
  return (fallback[lang] ?? fallback.en)[mood];
}

function SnailSvg({ mood }: { mood: Mood }) {
  const shell = SHELL_BY_MOOD[mood];
  const isSleeping = mood === "sleeping";
  return (
    <svg viewBox="0 0 56 40" aria-hidden>
      {/* ground shadow — shrinks during bounce via CSS */}
      <ellipse className="snail-shadow" cx="28" cy="37" rx="20" ry="1.5" fill="rgba(58,40,24,0.22)" />

      {/* trail dots */}
      <circle cx="2" cy="33" r="0.8" fill="#bb9468" opacity="0.5" />
      <circle cx="6" cy="34" r="0.8" fill="#bb9468" opacity="0.5" />

      <g className="snail-bounce">
        <g className="snail-breathe">
          {/* body */}
          <path
            d="M 8 28 Q 16 26 22 24 L 44 24 Q 50 24 50 30 Q 50 34 44 34 L 12 34 Q 6 34 8 28 Z"
            fill="#dab089"
            stroke="#7a5230"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* shell */}
          <circle cx="32" cy="20" r="13" fill={shell} stroke="#5a3a1a" strokeWidth="1.4" />
          <path
            d="M 32 20 m -8 0 a 8 8 0 1 1 16 0 a 5 5 0 1 1 -10 0 a 3 3 0 1 1 6 0"
            fill="none"
            stroke="#5a3a1a"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* shell highlight (gives a touch of dimension) */}
          <ellipse cx="27" cy="14" rx="3.5" ry="2" fill="rgba(255,255,255,0.28)" />

          {/* antenna 1 (longer, swings more) */}
          <g className="snail-antenna snail-antenna-1" style={{ transformOrigin: "50px 24px" }}>
            <line
              x1="50"
              y1="24"
              x2="54"
              y2="14"
              stroke="#7a5230"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <g
              className={`snail-eye ${isSleeping ? "snail-eye-closed" : ""}`}
              style={{ transformOrigin: "54px 14px" }}
            >
              <circle cx="54" cy="14" r="1.4" fill="#3a2818" />
              <circle cx="54.4" cy="13.6" r="0.4" fill="#fff" opacity="0.85" />
            </g>
          </g>

          {/* antenna 2 (shorter, opposite phase) */}
          <g className="snail-antenna snail-antenna-2" style={{ transformOrigin: "46px 24px" }}>
            <line
              x1="46"
              y1="24"
              x2="48"
              y2="13"
              stroke="#7a5230"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <g
              className={`snail-eye ${isSleeping ? "snail-eye-closed" : ""}`}
              style={{ transformOrigin: "48px 13px" }}
            >
              <circle cx="48" cy="13" r="1.4" fill="#3a2818" />
              <circle cx="48.3" cy="12.6" r="0.4" fill="#fff" opacity="0.85" />
            </g>
          </g>

          {/* mouth — varies by mood */}
          {isSleeping ? (
            <>
              <path
                d="M 44 28 q 1.4 1.6 2.8 0"
                fill="none"
                stroke="#3a2818"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
              <text
                x="50"
                y="14"
                fontFamily="Caveat, cursive"
                fontSize="8"
                fill="#3a2818"
                opacity="0.7"
              >
                z
              </text>
            </>
          ) : mood === "frowning" ? (
            <path
              d="M 43.5 30 q 1.5 -1.4 3 0"
              fill="none"
              stroke="#3a2818"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          ) : mood === "cheering" ? (
            <>
              <path
                d="M 43 30 q 1.5 1.6 3 0"
                fill="none"
                stroke="#3a2818"
                strokeWidth="1.1"
                strokeLinecap="round"
              />
              <text x="20" y="14" fontFamily="Caveat" fontSize="10" fill="#f5b568">
                ✦
              </text>
            </>
          ) : (
            <path
              d={mood === "focused" ? "M 43.6 30 q 1.4 1.0 2.8 0" : "M 43.6 30 q 1.4 1.6 2.8 0"}
              fill="none"
              stroke="#3a2818"
              strokeWidth="1.1"
              strokeLinecap="round"
            />
          )}
        </g>
      </g>
    </svg>
  );
}
