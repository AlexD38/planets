import { useContext, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { updateOrbit } from "../utils/orbit";

function disposeMesh(mesh) {
  if (!mesh) return;
  mesh.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((material) => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
    }
  });
}

export const Moon = ({ moon, planetPositionRef }) => {
  const { scene, renderer, camera, stopOrbits, timeScale } =
    useContext(PlanetContext);
  const moonRef = useRef(null);
  const orbitRef = useRef({ ...moon });
  const animationFrameId = useRef();

  useEffect(() => {
    if (!scene) return;

    const geometry = new THREE.SphereGeometry(moon.size, 16, 16);
    const texture = new THREE.TextureLoader().load("/textures/moon.png");
    const material = new THREE.MeshStandardMaterial({ map: texture });
    const mesh = new THREE.Mesh(geometry, material);
    moonRef.current = mesh;
    scene.add(mesh);

    return () => {
      scene.remove(mesh);
      disposeMesh(mesh);
      texture.dispose();
      moonRef.current = null;
    };
  }, [scene, moon.size]);

  const animate = useCallback(() => {
    if (!renderer || !scene || !camera || !moonRef.current) return;

    const planetPos = planetPositionRef.current;
    if (!planetPos) return;

    const orbitCenter = { x: planetPos.x, y: planetPos.y, z: planetPos.z };

    if (!stopOrbits) {
      updateOrbit(
        moonRef.current,
        orbitRef.current,
        timeScale * 0.016,
        orbitCenter,
        0,
      );
    }

    animationFrameId.current = requestAnimationFrame(animate);
  }, [renderer, scene, camera, stopOrbits, timeScale, planetPositionRef]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [animate]);

  return null;
};
