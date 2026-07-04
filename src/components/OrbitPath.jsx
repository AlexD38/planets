import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";

function disposeLine(line) {
  if (!line) return;
  line.geometry?.dispose();
  line.material?.dispose();
}

export const OrbitPath = ({ orbit, orbitCenter }) => {
  const { scene, showOrbitPaths } = useContext(PlanetContext);
  const lineRef = useRef(null);

  useEffect(() => {
    if (!scene || !orbit || !showOrbitPaths) return;

    const segments = 128;
    const points = [];

    if (orbit.eccentricity !== undefined) {
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        const a = orbit.semiMajorAxis;
        const e = orbit.eccentricity;
        const r = (a * (1 - e * e)) / (1 + e * Math.cos(angle));
        points.push(
          new THREE.Vector3(
            orbitCenter.x + r * Math.cos(angle),
            orbitCenter.y,
            orbitCenter.z + r * Math.sin(angle),
          ),
        );
      }
    } else {
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        points.push(
          new THREE.Vector3(
            orbitCenter.x + orbit.radius * Math.cos(angle),
            orbitCenter.y,
            orbitCenter.z + orbit.radius * Math.sin(angle),
          ),
        );
      }
    }

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.25,
    });
    const line = new THREE.Line(geometry, material);
    lineRef.current = line;
    scene.add(line);

    return () => {
      scene.remove(line);
      disposeLine(line);
      lineRef.current = null;
    };
  }, [scene, orbit, orbitCenter, showOrbitPaths]);

  return null;
};
