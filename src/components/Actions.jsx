import { useContext } from "react";
import { PlanetContext } from "../context/PlanetContext";
import "../styles.css";

export const Actions = () => {
  const { generateNewPlanet } = useContext(PlanetContext);

  return (
    <div className="actions-container">
      <button onClick={generateNewPlanet}>New planet</button>
    </div>
  );
};
