import { useContext } from "react";
import { PlanetContext } from "../context/PlanetContext";
import "./styles.css";

function BarButton({
  icon,
  label,
  active,
  inactive,
  onClick,
  ariaLabel,
}) {
  return (
    <button
      type="button"
      className={`bottom-bar-btn ${active ? "active" : ""} ${inactive ? "inactive" : ""}`}
      onClick={onClick}
      aria-label={ariaLabel}
      title={label}
    >
      <i className={icon} />
      <span className="bottom-bar-label">{label}</span>
    </button>
  );
}

export const BottomBar = () => {
  const {
    planetInfosDisplay,
    setPlanetInfosDisplay,
    showLabels,
    setShowLabels,
    showMinimap,
    setShowMinimap,
    audioEnabled,
    setAudioEnabled,
    moveState,
    toggleFlyMode,
    stopOrbits,
    setStopOrbits,
    timeScale,
    setTimeScale,
    addPlanet,
    removePlanet,
    selectedPlanet,
    systems,
  } = useContext(PlanetContext);

  const canRemovePlanet =
    Boolean(selectedPlanet?.planetId) &&
    (systems[0]?.planets.length ?? 0) > 1;

  const handleStopOrbit = () => {
    if (stopOrbits) {
      setStopOrbits(false);
      if (timeScale === 0) setTimeScale(1);
    } else {
      setStopOrbits(true);
      setTimeScale(0);
    }
  };

  const decreaseTime = () => setTimeScale((prev) => Math.max(0, prev - 0.5));
  const increaseTime = () => setTimeScale((prev) => Math.min(50, prev + 0.5));
  const resetTime = () => {
    setTimeScale(1);
    setStopOrbits(false);
  };

  return (
    <nav className="bottom-bar" aria-label="Controls">
      <div className="bottom-bar-section">
        <BarButton
          icon={`fa-solid ${planetInfosDisplay ? "fa-eye" : "fa-eye-slash"}`}
          label="Infos"
          active={planetInfosDisplay}
          onClick={() => setPlanetInfosDisplay(!planetInfosDisplay)}
          ariaLabel="Toggle infos panel"
        />
        <BarButton
          icon="fa-solid fa-tag"
          label="Labels"
          active={showLabels}
          onClick={() => setShowLabels(!showLabels)}
          ariaLabel="Toggle planet labels"
        />
        <BarButton
          icon="fa-solid fa-map"
          label="Carte"
          active={showMinimap}
          onClick={() => setShowMinimap(!showMinimap)}
          ariaLabel="Toggle minimap"
        />
        <BarButton
          icon={`fa-solid ${audioEnabled ? "fa-volume-high" : "fa-volume-xmark"}`}
          label="Audio"
          active={audioEnabled}
          onClick={() => setAudioEnabled(!audioEnabled)}
          ariaLabel="Toggle audio"
        />
      </div>

      <div className="bottom-bar-divider" />

      <div className="bottom-bar-section bottom-bar-time">
        <button
          type="button"
          className="bottom-bar-btn bottom-bar-btn-sm"
          onClick={decreaseTime}
          aria-label="Slow time"
        >
          −
        </button>
        <span className="bottom-bar-time-value">
          {stopOrbits ? "pause" : `${timeScale.toFixed(1)}x`}
        </span>
        <button
          type="button"
          className="bottom-bar-btn bottom-bar-btn-sm"
          onClick={increaseTime}
          aria-label="Speed up time"
        >
          +
        </button>
        <button
          type="button"
          className="bottom-bar-btn bottom-bar-btn-sm"
          onClick={resetTime}
          aria-label="Reset time"
          title="Reset"
        >
          ↺
        </button>
        <BarButton
          icon={`fa-solid ${stopOrbits ? "fa-play" : "fa-pause"}`}
          label={stopOrbits ? "Play" : "Pause"}
          active={stopOrbits}
          onClick={handleStopOrbit}
          ariaLabel={stopOrbits ? "Resume orbits" : "Pause orbits"}
        />
      </div>

      <div className="bottom-bar-divider" />

      <div className="bottom-bar-section">
        <BarButton
          icon="fa-brands fa-space-awesome"
          label="Vol"
          active={moveState.isFlyMode}
          inactive={!moveState.isFlyMode}
          onClick={toggleFlyMode}
          ariaLabel="Toggle fly mode"
        />
        <button
          type="button"
          className={`bottom-bar-btn bottom-bar-btn-text ${!canRemovePlanet ? "inactive" : ""}`}
          onClick={removePlanet}
          disabled={!canRemovePlanet}
          aria-label="Remove selected planet"
          title={
            canRemovePlanet
              ? "Supprimer la planète sélectionnée"
              : "Sélectionne une planète (il doit en rester au moins une)"
          }
        >
          <i className="fa-solid fa-minus" />
          <span className="bottom-bar-label">Planète</span>
        </button>
        <button
          type="button"
          className="bottom-bar-btn bottom-bar-btn-text"
          onClick={addPlanet}
          aria-label="Add planet to system"
        >
          <i className="fa-solid fa-plus" />
          <span className="bottom-bar-label">Planète</span>
        </button>
      </div>
    </nav>
  );
};
