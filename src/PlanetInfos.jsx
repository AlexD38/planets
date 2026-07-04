import { useContext, useEffect, useRef, useState, useCallback } from "react";
import { PlanetContext } from "./context/PlanetContext";
import "./styles.css";
import Typewriter from "typewriter-effect/dist/core";

export const PlanetInfos = () => {
  const {
    systemInfos,
    planetInfos,
    selectedPlanet,
    planetInfosDisplay,
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

  const handleShowDetails = useCallback(() => {
    if (!typewriterInstanceRef.current) {
      setDisplayInfos(true);
      return;
    }

    setLoadingDetails(true);
    typewriterInstanceRef.current
      .typeString("<br>")
      .typeString("Loading data")
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

    typewriter
      .typeString(selectedPlanet ? "Planet scan" : "Scanning System")
      .pauseFor(200)
      .typeString(".")
      .pauseFor(200)
      .typeString(".")
      .pauseFor(200)
      .typeString(".")
      .pauseFor(800)
      .typeString("Data acquired.")
      .pauseFor(500)
      .typeString("<br>")
      .typeString(selectedPlanet ? "Planet : " : "System name : ")
      .pauseFor(500)
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
            {selectedPlanet ? "Scan planétaire" : "Scan système"}
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
            {selectedPlanet ? "Fiche planète" : "Fiche système"}
          </div>
          {selectedPlanet ? (
            <>
              <div className="planet-infos-infos">Planet scan :</div>
              <div className="planet-infos-name">Name : &quot;{selectedPlanet.name}&quot;</div>
              <div className="planet-infos-type">Type : {selectedPlanet.type}</div>
              <div className="planet-infos-gravity">
                Gravity : {selectedPlanet.gravity}
              </div>
              <div className="planet-infos-cabronDetected">
                Temperature : {selectedPlanet.temperature}°C
              </div>
              <div className="planet-infos-inhabited">
                Inhabited : {selectedPlanet.inhabited ? "yes" : "no"}
              </div>
              <div className="planet-infos-comments">
                Intelligence :{" "}
                {selectedPlanet.intelligenceFormsDetected ? "detected" : "none"}
              </div>
            </>
          ) : (
            systemInfos && (
              <>
                <div className="planet-infos-infos">Infos :</div>
                <div className="planet-infos-name">
                  Name : &quot;{systemInfos.name}&quot;
                </div>
                <div className="planet-infos-name">
                  {systemInfos.numberOfPlanets} planets detected
                </div>
                <div className="planet-infos-type">
                  Types : {systemInfos.planetTypes.join(", ")}
                </div>
                <div className="planet-infos-cabronDetected">
                  {activePlanet.cabronDetected
                    ? "Carbon detected"
                    : "No Carbon detected"}
                </div>
                <br />
                <div className="planet-infos-gravity">
                  Life detected : {systemInfos.lifeDetected ? "yes" : "none"}
                </div>
                {"_".repeat(40)}
                <br />
                <br />
                <div className="planet-infos-comments">Comments : </div>
                {systemInfos.infos && (
                  <div className="planet-infos-inhabited">{systemInfos.infos}</div>
                )}
                {systemInfos.comments?.map((comment, index) => (
                  <div key={index} className="planet-infos-cabronDetected">
                    {comment}
                  </div>
                ))}
              </>
            )
          )}
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
