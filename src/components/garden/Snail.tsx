import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useTimerStore } from "../../stores/timerStore";
import { useSettingsStore } from "../../stores/settingsStore";

/**
 * Mascot snail living on the windowsill. Has 5 moods that derive from the
 * user's current state + recent behaviour:
 *
 *   - happy:   default; healthy score, no pressure
 *   - focused: timer is actively counting down, < 25% remaining
 *   - sleeping: state="break"
 *   - frowning: skipped >= 3 breaks today OR healthScore < 50
 *   - cheering: healthScore >= 95 OR just completed a milestone
 *
 * On hover it pops a little speech bubble that varies by mood.
 */
type Mood = "happy" | "focused" | "sleeping" | "frowning" | "cheering";

const SHELL_BY_MOOD: Record<Mood, string> = {
  happy: "#c89a4a",
  focused: "#a87c34",
  sleeping: "#9d8a64",
  frowning: "#9a7a5a",
  cheering: "#e0a046",
};

export function Snail() {
  const state = useTimerStore((s) => s.state);
  const remaining = useTimerStore((s) => s.remainingSec);
  const work = useTimerStore((s) => s.workIntervalSec);
  const skipped = useTimerStore((s) => s.skippedBreaks);
  const score = useTimerStore((s) => s.healthScore);
  const language = useSettingsStore((s) => s.language);
  const { t } = useTranslation();

  const [bubbleVisible, setBubbleVisible] = useState(false);

  // Auto-show bubble briefly whenever the mood changes.
  const mood: Mood = pickMood({ state, remaining, work, skipped, score });
  useEffect(() => {
    setBubbleVisible(true);
    const id = window.setTimeout(() => setBubbleVisible(false), 3500);
    return () => window.clearTimeout(id);
  }, [mood]);

  const message = pickMessage(mood, t, language);

  return (
    <>
      <div className="garden-snail-wrap glide" onMouseEnter={() => setBubbleVisible(true)}>
        <SnailSvg mood={mood} />
      </div>
      <div className={`garden-snail-bubble ${bubbleVisible ? "visible" : ""}`}>{message}</div>
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
  // Prefer i18n if available; fall back to inline copy so the snail
  // never goes silent during this rollout.
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
    <svg viewBox="0 0 56 36" aria-hidden>
      {/* trail dots */}
      <circle cx="2" cy="32" r="0.8" fill="#bb9468" opacity="0.5" />
      <circle cx="6" cy="33" r="0.8" fill="#bb9468" opacity="0.5" />
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
      {/* antennae */}
      <line x1="50" y1="24" x2="54" y2="14" stroke="#7a5230" strokeWidth="1.2" strokeLinecap="round" />
      <line x1="46" y1="24" x2="48" y2="13" stroke="#7a5230" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="54" cy="14" r="1.4" fill="#3a2818" />
      <circle cx="48" cy="13" r="1.4" fill="#3a2818" />
      {/* face */}
      {isSleeping ? (
        <>
          <path d="M 44 28 q 1.4 1.6 2.8 0" fill="none" stroke="#3a2818" strokeWidth="1.1" strokeLinecap="round" />
          <text x="50" y="14" fontFamily="Caveat, cursive" fontSize="8" fill="#3a2818" opacity="0.7">z</text>
        </>
      ) : mood === "frowning" ? (
        <>
          <circle cx="45" cy="27.5" r="0.8" fill="#3a2818" />
          <path d="M 43.5 30 q 1.5 -1.4 3 0" fill="none" stroke="#3a2818" strokeWidth="1.1" strokeLinecap="round" />
        </>
      ) : mood === "cheering" ? (
        <>
          <path d="M 43 27 l 1 1 l 1 -1" stroke="#3a2818" strokeWidth="1.1" strokeLinecap="round" fill="none" />
          <path d="M 43 30 q 1.5 1.6 3 0" fill="none" stroke="#3a2818" strokeWidth="1.1" strokeLinecap="round" />
          {/* sparkle */}
          <text x="20" y="14" fontFamily="Caveat" fontSize="10" fill="#f5b568">✦</text>
        </>
      ) : (
        <>
          <circle cx="45" cy="27.5" r="0.9" fill="#3a2818" />
          <path
            d={mood === "focused" ? "M 43.6 30 q 1.4 1.0 2.8 0" : "M 43.6 30 q 1.4 1.6 2.8 0"}
            fill="none"
            stroke="#3a2818"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}
