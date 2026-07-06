import { useContext, useCallback } from "react";
import { PlanetContext } from "../context/PlanetContext";
import "./styles.css";

function TouchButton({ label, icon, className, onPress, onRelease, ariaLabel }) {
  const start = useCallback(
    (e) => {
      e.preventDefault();
      onPress();
    },
    [onPress],
  );
  const end = useCallback(
    (e) => {
      e.preventDefault();
      onRelease();
    },
    [onRelease],
  );

  return (
    <button
      type="button"
      className={`fly-touch-btn ${className ?? ""}`}
      aria-label={ariaLabel ?? label}
      onTouchStart={start}
      onTouchEnd={end}
      onTouchCancel={end}
      onMouseDown={start}
      onMouseUp={end}
      onMouseLeave={end}
    >
      <i className={icon} aria-hidden />
      {label && <span className="fly-touch-label">{label}</span>}
    </button>
  );
}

export const FlyTouchControls = () => {
  const { moveState, setMoveState, isMobile } = useContext(PlanetContext);

  if (!isMobile || !moveState.isFlyMode) return null;

  const setAxis = (key, value) => {
    setMoveState((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="fly-touch-controls" aria-label="Contrôles de vol">
      <div className="fly-touch-cluster fly-touch-cluster-left">
        <TouchButton
          icon="fa-solid fa-angle-up"
          ariaLabel="Pitch haut"
          onPress={() => setAxis("pitchUp", 1)}
          onRelease={() => setAxis("pitchUp", 0)}
        />
        <TouchButton
          icon="fa-solid fa-angle-down"
          ariaLabel="Pitch bas"
          onPress={() => setAxis("pitchDown", 1)}
          onRelease={() => setAxis("pitchDown", 0)}
        />
      </div>

      <div className="fly-touch-cluster fly-touch-cluster-bottom">
        <TouchButton
          icon="fa-solid fa-angle-left"
          ariaLabel="Roll gauche"
          onPress={() => setAxis("rollLeft", 1)}
          onRelease={() => setAxis("rollLeft", 0)}
        />
        <TouchButton
          icon="fa-solid fa-angle-right"
          ariaLabel="Roll droite"
          onPress={() => setAxis("rollRight", 1)}
          onRelease={() => setAxis("rollRight", 0)}
        />
      </div>

      <div className="fly-touch-cluster fly-touch-cluster-right">
        <TouchButton
          className="fly-touch-btn-thrust"
          icon="fa-solid fa-angles-up"
          label="Poussée"
          ariaLabel="Poussée avant"
          onPress={() => setAxis("thrust", 1)}
          onRelease={() => setAxis("thrust", 0)}
        />
        <TouchButton
          icon="fa-solid fa-angles-down"
          ariaLabel="Marche arrière"
          onPress={() => setAxis("thrustReverse", 1)}
          onRelease={() => setAxis("thrustReverse", 0)}
        />
      </div>
    </div>
  );
};
