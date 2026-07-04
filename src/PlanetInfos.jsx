import { useContext, useEffect, useRef, useState, useCallback, useMemo } from "react";
import { PlanetContext } from "./context/PlanetContext";
import {
  buildPlanetScanSections,
  buildSystemScanSections,
} from "./utils/scanDetails";
import "./styles.css";
import Typewriter from "typewriter-effect/dist/core";

function ScanSections({ sections }) {
  return (
    <div className="scan-sections">
      {sections.map((section) => (
        <div key={section.title} className="scan-section">
          <div className="planet-infos-infos">{section.title}</div>
          {section.rows.map((entry) => (
            <div key={`${section.title}-${entry.label}`} className="planet-infos-row">
              <span className="planet-infos-row-label">{entry.label}</span>
              <span className="planet-infos-row-value">{entry.value}</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export const PlanetInfos = () => {
  const {
    systemInfos,
    planetInfos,
    selectedPlanet,
    planetInfosDisplay,
    systems,
  } = useContext(PlanetContext);
  const typewriterRef = useRef(null);
  const typewriterInstanceRef = useRef(null);
  const [scanDone, setScanDone] = useState(false);
  const [displayInfos, setDisplayInfos] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const activePlanet = selectedPlanet ?? planetInfos;
  const activePlanetKey =
    selectedPlanet?.planetId ?? planetInfos?.name ?? "system";
  const currentSystem = systems?.[0];

  const detailSections = useMemo(() => {
    if (selectedPlanet) {
      return buildPlanetScanSections(selectedPlanet);
    }
    return buildSystemScanSections(currentSystem, systemInfos);
  }, [selectedPlanet, currentSystem, systemInfos]);

  const scanTitle = selectedPlanet?.type === "Asteroid"
    ? "Scan astéroïde"
    : selectedPlanet
      ? "Scan planétaire"
      : "Scan système";

  const detailTitle = selectedPlanet?.type === "Asteroid"
    ? "Fiche astéroïde"
    : selectedPlanet
      ? "Fiche planète"
      : "Fiche système";

  const handleShowDetails = useCallback(() => {
    if (!typewriterInstanceRef.current) {
      setDisplayInfos(true);
      return;
    }

    setLoadingDetails(true);
    typewriterInstanceRef.current
      .typeString("<br>")
      .typeString("Décompression des données")
      .pauseFor(200)
      .typeString(".")
      .pauseFor(200)
      .typeString(".")
      .pauseFor(200)
      .typeString(".")
      .pauseFor(800)
      .start();

    setTimeout(() => {
      setDisplayInfos(true);
      setLoadingDetails(false);
    }, 1800);
  }, []);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  const handleCollapse = useCallback(() => {
    setDisplayInfos(false);
    setDismissed(false);
    setScanDone(true);
  }, []);

  useEffect(() => {
    if (!activePlanet || !typewriterRef.current) return;

    setDisplayInfos(false);
    setScanDone(false);
    setLoadingDetails(false);
    setDismissed(false);

    const typewriter = new Typewriter(typewriterRef.current, {
      autoStart: true,
      delay: 40,
      cursor: "▌",
    });

    typewriterInstanceRef.current = typewriter;

    const scanLabel =
      selectedPlanet?.type === "Asteroid"
        ? "Scan astéroïde"
        : selectedPlanet
          ? "Scan planétaire"
          : "Scan système";

    const targetLabel =
      selectedPlanet?.type === "Asteroid"
        ? "Cible : "
        : selectedPlanet
          ? "Planète : "
          : "Système : ";

    typewriter
      .typeString(scanLabel)
      .pauseFor(200)
      .typeString(".")
      .pauseFor(200)
      .typeString(".")
      .pauseFor(200)
      .typeString(".")
      .pauseFor(800)
      .typeString(" Données acquises.")
      .pauseFor(500)
      .typeString("<br>")
      .typeString(targetLabel)
      .pauseFor(400)
      .typeString(`${activePlanet.name}.`)
      .pauseFor(400)
      .callFunction(() => setScanDone(true))
      .start();

    return () => typewriter.stop();
  }, [activePlanetKey, selectedPlanet, activePlanet]);

  if (!activePlanet || !planetInfosDisplay) return null;

  return (
    <>
      {!displayInfos && (
        <div className="planet-infos-container hud-panel">
          <div className="hud-panel-header">
            <i className="fa-solid fa-satellite-dish" />
            {scanTitle}
          </div>
          <div ref={typewriterRef} />
          {scanDone && !dismissed && !loadingDetails && (
            <div className="planet-infos-actions">
              <button
                type="button"
                className="planet-infos-btn"
                onClick={handleShowDetails}
              >
                Afficher détails
              </button>
              <button
                type="button"
                className="planet-infos-btn planet-infos-btn-muted"
                onClick={handleDismiss}
              >
                Ignorer
              </button>
            </div>
          )}
        </div>
      )}
      {displayInfos && (
        <div className="planet-infos-container hud-panel">
          <div className="hud-panel-header">
            <i className="fa-solid fa-database" />
            {detailTitle}
          </div>
          <ScanSections sections={detailSections} />
          <div className="planet-infos-actions">
            <button
              type="button"
              className="planet-infos-btn planet-infos-btn-muted"
              onClick={handleCollapse}
            >
              Réduire
            </button>
          </div>
        </div>
      )}
    </>
  );
};
