import { useContext } from "react";
import { PlanetContext } from "../context/PlanetContext";
import "./Pointer.css";

// --- SVG Icons for Controls ---
const RollIcon = () => <i class="fa-solid fa-angles-right"></i>;

const keyDisplayMap = {
  thrust: { name: "Thrust", icon: <i class="fa-solid fa-angles-up"></i> },
  thrustReverse: {
    name: "Reverse",
    icon: <i class="fa-solid fa-angles-down"></i>,
  },
  pitchUp: { name: "Pitch ▲", icon: <i class="fa-solid fa-angle-up"></i> },
  pitchDown: {
    name: "Pitch ▼",
    icon: <i class="fa-solid fa-angle-down"></i>,
  },
  rollLeft: {
    name: "Roll ◀",
    icon: <i class="fa-solid fa-angle-left"></i>,
  },
  rollRight: {
    name: "Roll ▶",
    icon: <i class="fa-solid fa-angle-right"></i>,
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
    <>
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
      {activeKeys.length > 0 && (
        <div className="key-display">
          {activeKeys.map((key) => (
            <div className="key-item" key={key.name}>
              {key.icon}
            </div>
          ))}
        </div>
      )}
    </>
  );
};
