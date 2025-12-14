import { useEffect, useState } from "react";
import { utils } from "./utils/utils";
import "./styles.css";

export const PlanetInfos = () => {
  const [planetInfos, setPlanetInfos] = useState(null);

  useEffect(() => {
    const newPlanet = utils.generatePlanetInfos();
    setPlanetInfos(newPlanet);
  }, []);

  return (
    <>
      {planetInfos && (
        <div className="planet-infos-container">
          <div className="planet-infos-infos">Infos :</div>
          <div className="planet-infos-name">Name : "{planetInfos.name}"</div>
          <div className="planet-infos-temp">
            Temp :{planetInfos.temperature} °C
          </div>
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
      )}
    </>
  );
};
