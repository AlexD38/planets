import { useContext, useEffect, useState } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { getOrbitPosition } from "../utils/orbit";
import "./styles.css";

export const PlanetLabels = () => {
  const { systems, camera, renderer, showLabels } = useContext(PlanetContext);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    if (!showLabels || !camera || !renderer) return;

    let frameId;
    const update = () => {
      const bodies = systems.flatMap((system) => {
        const orbitCenter = { x: system.x, y: system.y, z: system.z };
        const sunLabel = system.sunName
          ? [
              {
                id: `sun-${system.x}-${system.y}-${system.z}`,
                name: system.sunName,
                x: system.x,
                y: system.y,
                z: system.z,
                isSun: true,
              },
            ]
          : [];

        const planetLabels = system.planets.map((planet) => {
          const pos = getOrbitPosition(
            planet.orbit,
            planet.orbit.angle,
            orbitCenter,
          );
          return {
            id: planet.planetId,
            name: planet.name,
            x: pos.x,
            y: pos.y,
            z: pos.z,
            isSun: false,
          };
        });

        return [...sunLabel, ...planetLabels];
      });

      const projected = bodies
        .map((body) => {
          const vector = new THREE.Vector3(body.x, body.y, body.z);
          vector.project(camera);

          const behind = vector.z > 1;
          const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

          return {
            id: body.id,
            name: body.name,
            isSun: body.isSun,
            x,
            y,
            visible: !behind && vector.z < 1,
          };
        })
        .filter((label) => label.visible);

      setLabels(projected);
      frameId = requestAnimationFrame(update);
    };

    frameId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frameId);
  }, [systems, camera, renderer, showLabels]);

  if (!showLabels) return null;

  return (
    <div className="planet-labels">
      {labels.map((label) => (
        <div
          key={label.id}
          className={`planet-label ${label.isSun ? "planet-label-sun" : ""}`}
          style={{ left: label.x, top: label.y }}
        >
          {label.name}
        </div>
      ))}
    </div>
  );
};
