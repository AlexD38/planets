import { useContext, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { updateOrbit } from "../utils/orbit";

function disposeObject(object) {
  if (!object) return;
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      if (child.material.map) child.material.map.dispose();
      child.material.dispose();
    }
  });
}

export const Moon = ({ moon, planetPositionRef }) => {
  const { scene, renderer, camera, stopOrbits, timeScale } =
    useContext(PlanetContext);
  const moonRef = useRef(null);
  const orbitRef = useRef({
    radius: moon.radius ?? moon.orbitRadius,
    speed: moon.speed,
    angle: moon.angle,
  });
  const animationFrameId = useRef();

  useEffect(() => {
    orbitRef.current.radius = moon.radius ?? moon.orbitRadius;
    orbitRef.current.speed = moon.speed;
    orbitRef.current.angle = moon.angle;
  }, [moon.radius, moon.orbitRadius, moon.speed, moon.angle]);

  useEffect(() => {
    if (!scene) return;

    const geometry = new THREE.SphereGeometry(moon.size, 20, 20);
    const texture = new THREE.TextureLoader().load("/textures/moon.png");
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      color: 0xffffff,
      roughness: 0.92,
      metalness: 0.04,
      emissive: 0x222228,
      emissiveIntensity: 0.12,
    });
    const mesh = new THREE.Mesh(geometry, material);
    moonRef.current = mesh;
    scene.add(mesh);

    return () => {
      scene.remove(mesh);
      disposeObject(mesh);
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
