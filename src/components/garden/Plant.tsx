import { useState } from "react";
import { useTimerStore } from "../../stores/timerStore";

/**
 * The plant on the windowsill. Wilts (slight desaturation + droop)
 * when the user's health score is low. Has a pot underneath.
 * Easter egg: clicking the plant shakes it (leaves rustle).
 */
export function Plant() {
  const healthScore = useTimerStore((s) => s.healthScore);
  const wilting = healthScore < 60;
  const [shaking, setShaking] = useState(false);

  const shake = () => {
    if (shaking) return;
    setShaking(true);
    window.setTimeout(() => setShaking(false), 700);
  };

  return (
    <>
      <button
        type="button"
        className={`garden-plant garden-plant-btn ${wilting ? "wilting" : ""} ${shaking ? "is-shaking" : ""}`}
        onClick={shake}
        aria-label="plant"
      >
        <div className="garden-stem" />
        <div className="garden-leaf garden-leaf-1" />
        <div className="garden-leaf garden-leaf-2" />
        <div className="garden-leaf garden-leaf-3" />
        <div className="garden-leaf garden-leaf-4" />
        <div className="garden-flower" />
      </button>
      <div className="garden-pot">
        <div className="garden-pot-body" />
        <div className="garden-pot-rim" />
        <div className="garden-pot-soil" />
      </div>
    </>
  );
}
