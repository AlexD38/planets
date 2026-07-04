import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { updateOrbit } from "../utils/orbit";

function disposeMesh(mesh) {
  if (!mesh) return;
  mesh.geometry?.dispose();
  mesh.material?.dispose();
}

export const Satellite = ({ planetPositionRef, planetSize }) => {
  const { scene, timeScale, stopOrbits } = useContext(PlanetContext);
  const satRef = useRef(null);
  const orbitRef = useRef({
    radius: planetSize + 1.2,
    angle: 0,
    speed: 0.02,
  });
  const blinkRef = useRef(0);

  useEffect(() => {
    orbitRef.current.radius = planetSize + 1.2;
    orbitRef.current.angle = Math.random() * Math.PI * 2;
  }, [planetSize]);

  useEffect(() => {
    if (!scene) return;

    const geometry = new THREE.BoxGeometry(0.15, 0.08, 0.15);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    const mesh = new THREE.Mesh(geometry, material);
    satRef.current = mesh;
    scene.add(mesh);

    let frameId;
    const animate = () => {
      const planetPos = planetPositionRef.current;
      if (satRef.current && planetPos && !stopOrbits) {
        const orbitCenter = { x: planetPos.x, y: planetPos.y, z: planetPos.z };
        updateOrbit(
          satRef.current,
          orbitRef.current,
          timeScale * 0.016,
          orbitCenter,
        );
        blinkRef.current += 0.05;
        satRef.current.material.color.setHex(
          Math.sin(blinkRef.current) > 0 ? 0xffffaa : 0x444422,
        );
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      scene.remove(mesh);
      disposeMesh(mesh);
      satRef.current = null;
    };
  }, [scene, planetPositionRef, timeScale, stopOrbits]);

  return null;
};
