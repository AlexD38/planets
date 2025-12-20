import { useContext } from "react";
import { PlanetContext } from "../context/PlanetContext";
import "./styles.css";

export const Parameters = () => {
  const { planetInfosDisplay, setPlanetInfosDisplay } =
    useContext(PlanetContext);

  const handleDisplayInfos = () => {
    planetInfosDisplay
      ? setPlanetInfosDisplay(false)
      : setPlanetInfosDisplay(true);
  };

  return planetInfosDisplay ? (
    <i className="fa-solid fa-eye parameters" onClick={handleDisplayInfos}></i>
  ) : (
    <i
      className="fa-solid fa-eye-slash parameters"
      onClick={handleDisplayInfos}
    ></i>
  );
};
