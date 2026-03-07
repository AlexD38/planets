import { useContext } from "react";
import { PlanetContext } from "../context/PlanetContext";
import "./styles.css";

export const FlyMode = () => {
  const { moveState, toggleFlyMode } = useContext(PlanetContext);
  const clasName = "fa-brands fa-space-awesome fly-mode";

  const handleToggleFlyMode = () => {
    moveState
      ? toggleFlyMode(false)
      : toggleFlyMode({ ...moveState, isFlyMode: true });
  };

  return (
    <i
      class={moveState.isFlyMode ? clasName : `${clasName} inactive`}
      onClick={handleToggleFlyMode}
    ></i>
  );
};
