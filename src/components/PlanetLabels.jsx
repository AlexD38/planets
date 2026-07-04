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
      const allPlanets = systems.flatMap((s) =>
        s.planets.map((p) => {
          const orbitCenter = { x: s.x, y: s.y, z: s.z };
          const pos = getOrbitPosition(p.orbit, p.orbit.angle, orbitCenter);
          return { planetId: p.planetId, name: p.name, x: pos.x, y: pos.y, z: pos.z };
        }),
      );

      const projected = allPlanets
        .map((p) => {
          const vector = new THREE.Vector3(p.x, p.y, p.z);
          vector.project(camera);

          const behind = vector.z > 1;
          const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
          const y = (-vector.y * 0.5 + 0.5) * window.innerHeight;

          return { name: p.name, x, y, visible: !behind && vector.z < 1 };
        })
        .filter((l) => l.visible);

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
          key={label.planetId ?? label.name}
          className="planet-label"
          style={{ left: label.x, top: label.y }}
        >
          {label.name}
        </div>
      ))}
    </div>
  );
};
