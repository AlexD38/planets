import { useContext } from "react";
import { PlanetContext } from "../context/PlanetContext";
import "./Pointer.css";

export const Pointer = () => {
  const { isFlyMode } = useContext(PlanetContext);

  if (!isFlyMode) {
    return null;
  }

  return (
    <div className="pointer-container">
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        fill="none"
        stroke="chartreuse"
        strokeWidth="2"
        style={{ filter: "drop-shadow(0 0 3px chartreuse)" }}
      >
        {/* Central Circle */}
        <circle cx="50" cy="50" r="3" />

        {/* Main crosshair lines with gap */}
        <path d="M50 25 V0" />
        <path d="M50 75 V100" />
        <path d="M25 50 H0" />
        <path d="M75 50 H100" />

        {/* Corner Brackets */}
        <path d="M20 20 H30 V30" />
        <path d="M80 20 H70 V30" />
        <path d="M20 80 H30 V70" />
        <path d="M80 80 H70 V70" />
      </svg>
    </div>
  );
};
