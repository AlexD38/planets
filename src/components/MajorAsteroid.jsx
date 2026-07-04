import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { updateOrbit } from "../utils/orbit";

function disposeMesh(mesh) {
  if (!mesh) return;
  mesh.geometry?.dispose();
  mesh.material?.dispose();
}

const COMPOSITION_COLORS = {
  Metallic: 0x9a8f7a,
  Carbonaceous: 0x4a4035,
  Rocky: 0x7a7268,
  Icy: 0xb8c8d8,
};

export const MajorAsteroid = ({ asteroid, orbitCenter }) => {
  const {
    scene,
    timeScale,
    stopOrbits,
    registerSelectable,
    unregisterSelectable,
  } = useContext(PlanetContext);
  const meshRef = useRef(null);
  const spinRef = useRef(Math.random() * 0.02);

  useEffect(() => {
    if (!scene || !asteroid) return;

    const geometry = new THREE.DodecahedronGeometry(asteroid.size * 0.22, 1);
    const material = new THREE.MeshStandardMaterial({
      color: COMPOSITION_COLORS[asteroid.composition] ?? 0x888877,
      roughness: 0.95,
      metalness: asteroid.composition === "Metallic" ? 0.55 : 0.12,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.userData.planetId = asteroid.planetId;
    mesh.userData.planetData = asteroid;
    registerSelectable(mesh, asteroid);
    meshRef.current = mesh;
    scene.add(mesh);

    let frameId;
    const animate = () => {
      if (meshRef.current && !stopOrbits) {
        updateOrbit(meshRef.current, asteroid.orbit, timeScale, orbitCenter);
        meshRef.current.position.y += asteroid.yOffset ?? 0;
        meshRef.current.rotation.x += spinRef.current * timeScale;
        meshRef.current.rotation.y += spinRef.current * 0.7 * timeScale;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      unregisterSelectable(mesh);
      scene.remove(mesh);
      disposeMesh(mesh);
      meshRef.current = null;
    };
  }, [
    scene,
    asteroid,
    orbitCenter,
    timeScale,
    stopOrbits,
    registerSelectable,
    unregisterSelectable,
  ]);

  return null;
};
