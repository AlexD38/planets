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
  compact,
}) {
  return (
    <button
      type="button"
      className={`bottom-bar-btn ${compact ? "bottom-bar-btn-icon" : ""} ${active ? "active" : ""} ${inactive ? "inactive" : ""}`}
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
    showCaptainLog,
    setShowCaptainLog,
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
      <div className="bottom-bar-group" aria-label="Affichage">
        <BarButton
          icon={`fa-solid ${planetInfosDisplay ? "fa-eye" : "fa-eye-slash"}`}
          label="Infos scan"
          active={planetInfosDisplay}
          onClick={() => setPlanetInfosDisplay(!planetInfosDisplay)}
          ariaLabel="Afficher le panneau scan"
          compact
        />
        <BarButton
          icon="fa-solid fa-tag"
          label="Noms"
          active={showLabels}
          onClick={() => setShowLabels(!showLabels)}
          ariaLabel="Afficher les labels"
          compact
        />
        <BarButton
          icon="fa-solid fa-map"
          label="Carte"
          active={showMinimap}
          onClick={() => setShowMinimap(!showMinimap)}
          ariaLabel="Afficher la minimap"
          compact
        />
        <BarButton
          icon="fa-solid fa-book"
          label="Journal"
          active={showCaptainLog}
          onClick={() => setShowCaptainLog(!showCaptainLog)}
          ariaLabel="Afficher le journal"
          compact
        />
        <BarButton
          icon={`fa-solid ${audioEnabled ? "fa-volume-high" : "fa-volume-xmark"}`}
          label="Audio"
          active={audioEnabled}
          onClick={() => setAudioEnabled(!audioEnabled)}
          ariaLabel="Activer l'audio"
          compact
        />
      </div>

      <div className="bottom-bar-divider" aria-hidden />

      <div className="bottom-bar-group bottom-bar-time" aria-label="Temps">
        <button
          type="button"
          className="bottom-bar-btn bottom-bar-btn-sm"
          onClick={decreaseTime}
          aria-label="Ralentir le temps"
          title="Ralentir"
        >
          −
        </button>
        <span className="bottom-bar-time-value">
          {stopOrbits ? "‖" : `${timeScale.toFixed(1)}×`}
        </span>
        <button
          type="button"
          className="bottom-bar-btn bottom-bar-btn-sm"
          onClick={increaseTime}
          aria-label="Accélérer le temps"
          title="Accélérer"
        >
          +
        </button>
        <button
          type="button"
          className="bottom-bar-btn bottom-bar-btn-sm"
          onClick={handleStopOrbit}
          aria-label={stopOrbits ? "Reprendre" : "Pause"}
          title={stopOrbits ? "Reprendre" : "Pause"}
        >
          <i className={`fa-solid ${stopOrbits ? "fa-play" : "fa-pause"}`} />
        </button>
        <button
          type="button"
          className="bottom-bar-btn bottom-bar-btn-sm"
          onClick={resetTime}
          aria-label="Réinitialiser le temps"
          title="Réinitialiser"
        >
          ↺
        </button>
      </div>

      <div className="bottom-bar-divider" aria-hidden />

      <div className="bottom-bar-group" aria-label="Navigation">
        <BarButton
          icon="fa-brands fa-space-awesome"
          label="Vol libre"
          active={moveState.isFlyMode}
          inactive={!moveState.isFlyMode}
          onClick={toggleFlyMode}
          ariaLabel="Mode vol"
          compact
        />
        <button
          type="button"
          className={`bottom-bar-btn bottom-bar-btn-icon ${!canRemovePlanet ? "inactive" : ""}`}
          onClick={removePlanet}
          disabled={!canRemovePlanet}
          aria-label="Supprimer planète"
          title={
            canRemovePlanet
              ? "Supprimer la planète sélectionnée"
              : "Sélectionne une planète"
          }
        >
          <i className="fa-solid fa-minus" />
        </button>
        <button
          type="button"
          className="bottom-bar-btn bottom-bar-btn-icon"
          onClick={addPlanet}
          aria-label="Ajouter planète"
          title="Ajouter une planète"
        >
          <i className="fa-solid fa-plus" />
        </button>
      </div>
    </nav>
  );
};
