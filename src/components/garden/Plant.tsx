import { useTimerStore } from "../../stores/timerStore";

/**
 * The plant on the windowsill. Wilts (slight desaturation + droop)
 * when the user's health score is low. Has a pot underneath.
 */
export function Plant() {
  const healthScore = useTimerStore((s) => s.healthScore);
  const wilting = healthScore < 60;

  return (
    <>
      <div className={`garden-plant ${wilting ? "wilting" : ""}`}>
        <div className="garden-stem" />
        <div className="garden-leaf garden-leaf-1" />
        <div className="garden-leaf garden-leaf-2" />
        <div className="garden-leaf garden-leaf-3" />
        <div className="garden-leaf garden-leaf-4" />
        <div className="garden-flower" />
      </div>
      <div className="garden-pot">
        <div className="garden-pot-body" />
        <div className="garden-pot-rim" />
        <div className="garden-pot-soil" />
      </div>
    </>
  );
}
