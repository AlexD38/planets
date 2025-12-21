import { useContext } from "react";
import { PlanetContext } from "../context/PlanetContext";
import "./styles.css";

export const StopOrbit = () => {
  const { stopOrbits, setStopOrbits } = useContext(PlanetContext);

  const handleStopOrbit = () => {
    stopOrbits ? setStopOrbits(false) : setStopOrbits(true);
  };

  return stopOrbits ? (
    <i className="fa-solid fa-play stop-orbit" onClick={handleStopOrbit}></i>
  ) : (
    <i className="fa-solid fa-pause stop-orbit" onClick={handleStopOrbit}></i>
  );
};
