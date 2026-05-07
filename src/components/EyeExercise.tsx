import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type ExerciseKind = "lookAway" | "rolls" | "squeeze" | "blink" | "figure8";

const KINDS: ExerciseKind[] = ["lookAway", "rolls", "squeeze", "blink", "figure8"];

interface EyeExerciseProps {
  seed?: number;
}

export function EyeExercise({ seed }: EyeExerciseProps) {
  const { t } = useTranslation();
  const kind = useMemo<ExerciseKind>(() => {
    const idx = seed != null ? seed % KINDS.length : Math.floor(Math.random() * KINDS.length);
    return KINDS[idx];
  }, [seed]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <div
          style={{
            fontFamily: "Caveat, cursive",
            fontSize: 18,
            fontWeight: 700,
            color: "var(--eg-text)",
            letterSpacing: 0.4,
            lineHeight: 1.2,
          }}
        >
          {t(`exercises.${kind}.title`)}
        </div>
        <div
          style={{
            fontFamily: "Quicksand, sans-serif",
            fontSize: 12.5,
            color: "var(--eg-text-soft)",
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {t(`exercises.${kind}.description`)}
        </div>
      </div>
      <ExerciseAnimation kind={kind} />
    </div>
  );
}

function ExerciseAnimation({ kind }: { kind: ExerciseKind }) {
  switch (kind) {
    case "lookAway":
      return <LookAwayAnim />;
    case "rolls":
      return <RollAnim />;
    case "squeeze":
      return <SqueezeAnim />;
    case "blink":
      return <BlinkAnim />;
    case "figure8":
      return <FigureEightAnim />;
  }
}

const dotStyle: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 4,
  background: "var(--eg-green)",
  boxShadow: "0 0 8px var(--eg-green)",
};

function LookAwayAnim() {
  return (
    <div className="relative" style={{ width: 200, height: 60 }}>
      <span
        className="absolute"
        style={{ ...dotStyle, top: "50%", marginTop: -4, animation: "look-away 4s ease-in-out infinite" }}
      />
      <style>{`@keyframes look-away { 0%,100%{left:0} 50%{left:calc(100% - 8px)} }`}</style>
    </div>
  );
}

function RollAnim() {
  return (
    <div className="relative" style={{ width: 80, height: 80 }}>
      <span
        className="absolute"
        style={{
          ...dotStyle,
          top: 0,
          left: "50%",
          marginLeft: -4,
          animation: "eye-roll 3s linear infinite",
          transformOrigin: "4px 40px",
        }}
      />
      <style>{`@keyframes eye-roll { from{transform:rotate(0)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}

function SqueezeAnim() {
  return (
    <div className="relative" style={{ width: 80, height: 32 }}>
      <span
        className="absolute"
        style={{
          left: 0,
          right: 0,
          top: "50%",
          height: 2,
          marginTop: -1,
          background: "var(--eg-green)",
          animation: "squeeze 2.5s ease-in-out infinite",
          borderRadius: 1,
        }}
      />
      <style>{`@keyframes squeeze { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(0.1)} }`}</style>
    </div>
  );
}

function BlinkAnim() {
  return (
    <div className="relative" style={{ width: 100, height: 20 }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="absolute"
          style={{
            left: i * 36,
            top: 5,
            width: 28,
            height: 10,
            borderRadius: 6,
            background: "var(--eg-green)",
            opacity: 0.6,
            animation: `blink 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
      <style>{`@keyframes blink { 0%,100%{opacity:0.6;transform:scaleY(1)} 50%{opacity:0.1;transform:scaleY(0.2)} }`}</style>
    </div>
  );
}

function FigureEightAnim() {
  return (
    <div style={{ width: 220, height: 120, position: "relative" }}>
      <svg viewBox="0 0 220 120" width="220" height="120" style={{ position: "absolute", inset: 0 }}>
        <path
          d="M 40 60 C 40 10, 110 10, 110 60 C 110 110, 180 110, 180 60 C 180 10, 110 10, 110 60 C 110 110, 40 110, 40 60 Z"
          fill="none"
          stroke="rgba(52,211,153,0.45)"
          strokeWidth="1.5"
          strokeDasharray="3 4"
        />
      </svg>
      <span
        style={{
          position: "absolute",
          width: 14,
          height: 14,
          borderRadius: 8,
          background: "var(--eg-green)",
          boxShadow: "0 0 12px var(--eg-green)",
          top: 0,
          left: 0,
          marginTop: -7,
          marginLeft: -7,
          offsetPath:
            "path('M 40 60 C 40 10, 110 10, 110 60 C 110 110, 180 110, 180 60 C 180 10, 110 10, 110 60 C 110 110, 40 110, 40 60 Z')",
          animation: "fig8-trace 5.5s linear infinite",
        }}
      />
      <style>{`
        @keyframes fig8-trace {
          from { offset-distance: 0%; }
          to   { offset-distance: 100%; }
        }
      `}</style>
    </div>
  );
}
