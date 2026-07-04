import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { utils } from "../utils/utils";

function disposeObject(obj) {
  if (!obj) return;
  obj.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (child.material.map) child.material.map.dispose();
      child.material.dispose();
    }
  });
}

export const StellarObjects = ({ stellarType, orbitCenter, sunSize }) => {
  const { scene, timeScale, stopOrbits } = useContext(PlanetContext);
  const groupRef = useRef(null);

  useEffect(() => {
    if (!scene || stellarType === "single") return;

    const group = new THREE.Group();
    groupRef.current = group;

    if (stellarType === "binary") {
      const companion = new THREE.Mesh(
        new THREE.SphereGeometry(sunSize * 0.5, 32, 32),
        new THREE.MeshStandardMaterial({
          emissive: 0xff8844,
          emissiveIntensity: 2,
          color: 0xffaa66,
        }),
      );
      companion.position.set(sunSize * 2.5, 0, 0);
      group.add(companion);
    }

    const dustCount = 80;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = utils.randomBetween(sunSize * 3, sunSize * 15);
      dustPositions[i * 3] = Math.cos(angle) * radius;
      dustPositions[i * 3 + 1] = (Math.random() - 0.5) * sunSize;
      dustPositions[i * 3 + 2] = Math.sin(angle) * radius;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(dustPositions, 3),
    );
    group.add(
      new THREE.Points(
        dustGeometry,
        new THREE.PointsMaterial({
          color: 0x888899,
          size: 0.8,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        }),
      ),
    );

    group.position.set(orbitCenter.x, orbitCenter.y, orbitCenter.z);
    scene.add(group);

    let frameId;
    const animate = () => {
      if (groupRef.current && !stopOrbits) {
        groupRef.current.rotation.y += 0.002 * timeScale;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      scene.remove(group);
      disposeObject(group);
      groupRef.current = null;
    };
  }, [scene, stellarType, orbitCenter, sunSize, timeScale, stopOrbits]);

  return null;
};
