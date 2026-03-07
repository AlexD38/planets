import { useContext } from "react";
import { PlanetContext } from "../context/PlanetContext";
import "../styles.css";

export const FlyMode = () => {
  const { isFlyMode, toggleFlyMode } = useContext(PlanetContext);
  const className = "fa-brands fa-space-awesome fly-mode";

  const handleToggleFlyMode = () => {
    isFlyMode ? toggleFlyMode(false) : toggleFlyMode(true);
  };

  return (
    <i
      class={isFlyMode ? className : `${className} inactive`}
      onClick={handleToggleFlyMode}
    ></i>
  );
};
