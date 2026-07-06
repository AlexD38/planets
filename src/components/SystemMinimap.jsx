import { useContext, useEffect, useState } from "react";
import { PlanetContext } from "../context/PlanetContext";
import { getOrbitPosition } from "../utils/orbit";
import "./styles.css";

const MAP_SIZE = 100;
const PADDING = 10;

export const SystemMinimap = () => {
  const {
    systems,
    showMinimap,
    flyToPlanet,
    selectedPlanet,
  } = useContext(PlanetContext);
  const [planets, setPlanets] = useState([]);
  const [maxRadius, setMaxRadius] = useState(100);

  useEffect(() => {
    if (!showMinimap) return;

    let frameId;
    const update = () => {
      const system = systems[0];
      if (!system) return;

      const all = system.planets.map((p) => {
        const pos = getOrbitPosition(
          p.orbit,
          p.orbit.angle,
          { x: system.x, y: system.y, z: system.z },
        );
        return {
          ...p,
          worldX: pos.x,
          worldZ: pos.z,
        };
      });
      const maxR = Math.max(...all.map((p) => p.orbit?.radius ?? 50), 50);
      setPlanets(all);
      setMaxRadius(maxR);
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [systems, showMinimap]);

  if (!showMinimap || planets.length === 0) return null;

  const toMap = (x, z) => {
    const scale = (MAP_SIZE - PADDING * 2) / (maxRadius * 2.2);
    return {
      x: MAP_SIZE / 2 + x * scale,
      y: MAP_SIZE / 2 + z * scale,
    };
  };

  const outerRingR = (MAP_SIZE - PADDING * 2) / 2.2;

  return (
    <div className="system-minimap hud-panel">
      <div className="system-minimap-header">
        <i className="fa-solid fa-satellite" />
        Carte système
      </div>
      <svg width={MAP_SIZE} height={MAP_SIZE} viewBox={`0 0 ${MAP_SIZE} ${MAP_SIZE}`}>
        <circle
          cx={MAP_SIZE / 2}
          cy={MAP_SIZE / 2}
          r={outerRingR}
          fill="none"
          stroke="rgba(56, 189, 248, 0.12)"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <circle
          cx={MAP_SIZE / 2}
          cy={MAP_SIZE / 2}
          r={3}
          fill="#fbbf24"
          style={{ filter: "drop-shadow(0 0 4px rgba(251, 191, 36, 0.8))" }}
        />
        {planets.map((p) => {
          const pos = toMap(p.worldX, p.worldZ);
          const isSelected = selectedPlanet?.planetId === p.planetId;
          return (
            <circle
              key={p.planetId}
              cx={pos.x}
              cy={pos.y}
              r={isSelected ? 4 : 2.5}
              fill={isSelected ? "#34d399" : "#38bdf8"}
              style={{
                cursor: "pointer",
                filter: isSelected
                  ? "drop-shadow(0 0 5px rgba(52, 211, 153, 0.9))"
                  : "drop-shadow(0 0 3px rgba(56, 189, 248, 0.5))",
              }}
              onClick={() => flyToPlanet(p)}
            />
          );
        })}
      </svg>
    </div>
  );
};
