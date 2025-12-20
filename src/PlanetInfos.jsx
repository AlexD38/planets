import { useContext, useEffect, useRef, useState } from "react";
import { PlanetContext } from "./context/PlanetContext";
import "./styles.css";
import Typewriter from "typewriter-effect/dist/core";

export const PlanetInfos = () => {
  const { planetInfos, isMobile } = useContext(PlanetContext);
  const typewriterRef = useRef(null);
  const typewriterInstanceRef = useRef(null);
  const [canDisplayInfos, setCanDisplayInfos] = useState(false);
  const [displayInfos, setDisplayInfos] = useState(false);

  const handleUserChoice = (e) => {
    if (e.key == "y") {
      typewriterInstanceRef.current
        .typeString("<br>")
        .typeString("Loading data")
        .pauseFor(200)
        .typeString(".")
        .pauseFor(200)
        .typeString(".")
        .pauseFor(200)
        .typeString(".")
        .pauseFor(1000)
        .start();

      setTimeout(() => {
        setDisplayInfos(true);
      }, 2000);
    }
    if (e.key == "n") {
      typewriterInstanceRef.current
        .deleteAll(1)
        .typeString("System name : ")
        .pauseFor(500)
        .typeString(`${planetInfos.name}.`)
        .start();
    }
    return;
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!canDisplayInfos) return;
      handleUserChoice(e);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [canDisplayInfos]);

  useEffect(() => {
    if (!planetInfos || !typewriterRef.current) return;

    const typewriter = new Typewriter(typewriterRef.current, {
      autoStart: true,
      delay: 40,
      cursor: "▌",
    });

    typewriterInstanceRef.current = typewriter;

    typewriter
      .typeString("Scanning System")
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
      .typeString("System name : ")
      .pauseFor(500)
      .typeString(`${planetInfos.name}.`)
      .pauseFor(1000)
      .start();

    setCanDisplayInfos(true);

    if (!isMobile) {
      typewriter
        .typeString("<br>")
        .typeString("<br>")
        .typeString("Display system infos ? [y, n]");
    } else {
      setTimeout(() => {
        handleUserChoice({ key: "y" });
      }, 6000);
    }

    return () => typewriter.stop();
  }, [planetInfos]);

  if (!planetInfos) return null;

  return (
    <>
      {!displayInfos && (
        <div className="planet-infos-container" ref={typewriterRef}></div>
      )}
      {displayInfos && (
        <>
          <div className="planet-infos-container">
            <input
              type="hidden"
              name=""
              onKeyDown={(e) => handleUserChoice(e)}
              autoFocus={true}
            />
            <div className="planet-infos-infos">Infos :</div>
            <div className="planet-infos-name">Name : "{planetInfos.name}"</div>
            <div className="planet-infos-temp">
              Average Temp : {planetInfos.temperature} °C
            </div>
            <div className="planet-infos-type">Type : {planetInfos.type}</div>
            <div className="planet-infos-gravity">
              Gravity : {planetInfos.gravity}
            </div>
            <div className="planet-infos-size">
              Size :{planetInfos.size.toUpperCase()}
            </div>
            {"_".repeat(40)}
            <br></br>
            <br></br>
            <div className="planet-infos-comments">Comments : </div>
            <div className="planet-infos-inhabited">
              {planetInfos.inhabited
                ? "Life forms live here"
                : "No life form live here"}
            </div>
            <div className="planet-infos-cabronDetected">
              {planetInfos.cabronDetected
                ? "Carbon detected"
                : "No Carbon detected"}
            </div>
            <div className="planet-infos-intelligenceFormsDetected">
              {planetInfos.intelligenceFormsDetected
                ? "Intelligence forms have been detected"
                : "No intelligence form have been detected"}
            </div>
            <div className="planet-infos-note">{planetInfos.observations}</div>
          </div>
        </>
      )}
    </>
  );
};
