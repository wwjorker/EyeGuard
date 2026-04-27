import { useMemo } from "react";

type ExerciseKind = "lookAway" | "rolls" | "squeeze" | "blink" | "figure8";

interface Exercise {
  kind: ExerciseKind;
  title: string;
  description: string;
}

const EXERCISES: Exercise[] = [
  { kind: "lookAway", title: "Look 20 feet away", description: "Pick a distant object — soften your gaze for 20 seconds." },
  { kind: "rolls", title: "Eye rolls", description: "Roll your eyes slowly clockwise, then counter-clockwise." },
  { kind: "squeeze", title: "Squeeze & release", description: "Close your eyes firmly for 3 seconds, then open wide." },
  { kind: "blink", title: "Refresh blinks", description: "Blink rapidly for 10 seconds to refresh tear film." },
  { kind: "figure8", title: "Figure-eight", description: "Trace a slow figure-8 with your gaze." },
];

interface EyeExerciseProps {
  seed?: number;
}

export function EyeExercise({ seed }: EyeExerciseProps) {
  const exercise = useMemo(() => {
    const idx = seed != null ? seed % EXERCISES.length : Math.floor(Math.random() * EXERCISES.length);
    return EXERCISES[idx];
  }, [seed]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="text-center">
        <div
          className="text-[12px] uppercase"
          style={{ color: "rgba(255,255,255,0.45)", letterSpacing: 1.5 }}
        >
          {exercise.title}
        </div>
        <div
          className="text-[12px] mt-1"
          style={{ color: "rgba(255,255,255,0.35)" }}
        >
          {exercise.description}
        </div>
      </div>
      <ExerciseAnimation kind={exercise.kind} />
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
    <div style={{ width: 100, height: 60 }}>
      <svg viewBox="0 0 100 60" width="100" height="60">
        <path
          d="M 20 30 C 20 10, 50 10, 50 30 C 50 50, 80 50, 80 30 C 80 10, 50 10, 50 30 C 50 50, 20 50, 20 30 Z"
          fill="none"
          stroke="rgba(52,211,153,0.4)"
          strokeWidth="1"
        />
        <circle r="3" fill="var(--eg-green)" style={{ filter: "drop-shadow(0 0 5px var(--eg-green))" }}>
          <animateMotion
            dur="4s"
            repeatCount="indefinite"
            path="M 20 30 C 20 10, 50 10, 50 30 C 50 50, 80 50, 80 30 C 80 10, 50 10, 50 30 C 50 50, 20 50, 20 30 Z"
          />
        </circle>
      </svg>
    </div>
  );
}
