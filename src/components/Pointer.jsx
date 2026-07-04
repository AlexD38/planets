import { useContext } from "react";
import { PlanetContext } from "../context/PlanetContext";
import "./styles.css";

// --- SVG Icons for Controls ---

const keyDisplayMap = {
  thrust: {
    name: "Thrust",
    icon: <i className="fa-solid fa-angles-up"></i>,
    pos: "top",
  },
  thrustReverse: {
    name: "Reverse",
    icon: <i className="fa-solid fa-angles-down"></i>,
    pos: "bottom",
  },
  pitchUp: {
    name: "Pitch ▲",
    icon: <i className="fa-solid fa-angle-up"></i>,
    pos: "top",
  },
  pitchDown: {
    name: "Pitch ▼",
    icon: <i className="fa-solid fa-angle-down"></i>,
    pos: "bottom",
  },
  rollLeft: {
    name: "Roll ◀",
    icon: <i className="fa-solid fa-angle-left"></i>,
    pos: "left",
  },
  rollRight: {
    name: "Roll ▶",
    icon: <i className="fa-solid fa-angle-right"></i>,
    pos: "right",
  },
};

export const Pointer = () => {
  const { moveState } = useContext(PlanetContext);

  if (!moveState.isFlyMode) {
    return null;
  }

  const activeKeys = Object.entries(moveState)
    .filter(([key, value]) => value === 1 && keyDisplayMap[key])
    .map(([key]) => keyDisplayMap[key]);

  return (
    <div className="pointer-container">
      <svg
        className="pointer-crosshair"
        viewBox="0 0 100 100"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
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

      {activeKeys.length > 0 && (
        <div className="key-display">
          {activeKeys.map((key) => (
            <div className={`key-item ${key.pos}`} key={key.name}>
              {key.icon}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
