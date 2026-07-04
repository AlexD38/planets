import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { getOrbitPosition } from "../utils/orbit";
import { enableBloomLayer } from "../utils/bloomLayer";

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

function getNearestPlanetDistance(cometPos, planets, orbitCenter) {
  let minDist = Infinity;
  planets.forEach((planet) => {
    if (!planet.orbit) return;
    const planetPos = getOrbitPosition(
      planet.orbit,
      planet.orbit.angle,
      orbitCenter,
    );
    minDist = Math.min(minDist, cometPos.distanceTo(planetPos));
  });
  return minDist;
}

export const Comet = ({ comet, orbitCenter, sunPosition, planets = [] }) => {
  const { scene, timeScale, stopOrbits } = useContext(PlanetContext);
  const groupRef = useRef(null);
  const tailRef = useRef(null);
  const nucleusRef = useRef(null);
  const stateRef = useRef({
    progress: 0,
    wait: comet.spawnDelay ?? 0,
  });

  useEffect(() => {
    if (!scene) return;

    const group = new THREE.Group();
    groupRef.current = group;
    group.visible = false;

    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(comet.nucleusSize, 10, 10),
      new THREE.MeshBasicMaterial({
        color: 0xe8f4ff,
        transparent: true,
        opacity: 0.9,
        toneMapped: false,
      }),
    );
    nucleusRef.current = nucleus;
    enableBloomLayer(nucleus);
    group.add(nucleus);

    const tailCount = 48;
    const tailPositions = new Float32Array(tailCount * 3);
    const tailGeometry = new THREE.BufferGeometry();
    tailGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(tailPositions, 3),
    );
    const tailMaterial = new THREE.PointsMaterial({
      color: 0x88ccff,
      size: 2.2,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
      sizeAttenuation: true,
    });
    const tail = new THREE.Points(tailGeometry, tailMaterial);
    tailRef.current = tail;
    enableBloomLayer(tail);
    group.add(tail);

    scene.add(group);

    const sunVec = new THREE.Vector3(sunPosition.x, sunPosition.y, sunPosition.z);
    const direction = new THREE.Vector3(
      comet.direction.x,
      comet.direction.y,
      comet.direction.z,
    ).normalize();
    const origin = new THREE.Vector3(
      comet.origin.x + orbitCenter.x,
      comet.origin.y + orbitCenter.y,
      comet.origin.z + orbitCenter.z,
    );
    const tailDir = new THREE.Vector3();

    let frameId;
    const animate = () => {
      if (!groupRef.current || stopOrbits) {
        frameId = requestAnimationFrame(animate);
        return;
      }

      const state = stateRef.current;

      if (state.wait > 0) {
        state.wait -= timeScale;
        groupRef.current.visible = false;
        frameId = requestAnimationFrame(animate);
        return;
      }

      state.progress += comet.speed * timeScale;
      const pos = origin.clone().addScaledVector(direction, state.progress);
      groupRef.current.position.copy(pos);

      if (state.progress >= comet.pathLength) {
        state.progress = 0;
        state.wait = comet.respawnCooldown ?? 300;
        groupRef.current.visible = false;
        frameId = requestAnimationFrame(animate);
        return;
      }

      tailDir.copy(direction).negate();

      const distToSun = pos.distanceTo(sunVec);
      const sunHeat = THREE.MathUtils.clamp(1 - (distToSun - 50) / 320, 0, 1);
      const nearestPlanet = getNearestPlanetDistance(pos, planets, orbitCenter);
      const planetFade = THREE.MathUtils.smoothstep(nearestPlanet, 12, 55);
      const tailIntensity = sunHeat * planetFade;
      const tailLength = 22 + tailIntensity * 50;

      groupRef.current.visible = tailIntensity > 0.02;

      if (tailRef.current) {
        const positions = tailRef.current.geometry.attributes.position.array;
        for (let i = 0; i < tailCount; i++) {
          const t = i / tailCount;
          const falloff = 1 - t * t;
          positions[i * 3] = tailDir.x * t * tailLength * falloff;
          positions[i * 3 + 1] = tailDir.y * t * tailLength * falloff;
          positions[i * 3 + 2] = tailDir.z * t * tailLength * falloff;
        }
        tailRef.current.geometry.attributes.position.needsUpdate = true;
        tailRef.current.material.opacity = tailIntensity * 0.85;
        tailRef.current.material.size = 1.2 + tailIntensity * 2.2;
      }

      if (nucleusRef.current) {
        nucleusRef.current.material.opacity = 0.25 + tailIntensity * 0.75;
        nucleusRef.current.visible = tailIntensity > 0.02;
      }

      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      scene.remove(group);
      disposeObject(group);
      groupRef.current = null;
      stateRef.current = { progress: 0, wait: comet.spawnDelay ?? 0 };
    };
  }, [scene, comet, orbitCenter, sunPosition, planets, timeScale, stopOrbits]);

  return null;
};
