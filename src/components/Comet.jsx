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

export const Comet = ({
  comet,
  orbitCenter,
  sunPosition,
  planets = [],
  sunSize = 20,
  systemOuterRadius = 200,
}) => {
  const { scene, timeScale, stopOrbits } = useContext(PlanetContext);
  const groupRef = useRef(null);
  const tailRef = useRef(null);
  const dustTailRef = useRef(null);
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

    const tailCount = 80;
    const createTail = (color, baseSize) => {
      const positions = new Float32Array(tailCount * 3);
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const material = new THREE.PointsMaterial({
        color,
        size: baseSize,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
        sizeAttenuation: true,
      });
      const points = new THREE.Points(geometry, material);
      enableBloomLayer(points);
      return points;
    };

    const ionTail = createTail(0x88ccff, 2.4);
    const dustTail = createTail(0xd4c4a0, 3.2);
    tailRef.current = ionTail;
    dustTailRef.current = dustTail;
    group.add(ionTail);
    group.add(dustTail);

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
    const awayFromSun = new THREE.Vector3();
    const binormal = new THREE.Vector3();
    const spreadAxis = new THREE.Vector3();

    const heatFalloff = Math.max(systemOuterRadius * 0.85, sunSize * 12, 120);

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

      awayFromSun.copy(pos).sub(sunVec).normalize();
      tailDir.copy(awayFromSun);

      spreadAxis.set(direction.y, -direction.x, direction.z * 0.35).normalize();
      binormal.crossVectors(tailDir, spreadAxis).normalize();

      const distToSun = pos.distanceTo(sunVec);
      const sunHeat = THREE.MathUtils.clamp(1 - distToSun / heatFalloff, 0, 1);
      const nearestPlanet = getNearestPlanetDistance(pos, planets, orbitCenter);
      const planetFade = THREE.MathUtils.smoothstep(nearestPlanet, 8, 45);
      const tailIntensity = sunHeat * sunHeat * planetFade;

      const ionLength = 18 + sunHeat * sunHeat * 140;
      const dustLength = 28 + sunHeat * sunHeat * 95;
      const dustSpread = 1.5 + sunHeat * 8;

      groupRef.current.visible = tailIntensity > 0.015;

      const updateTailPoints = (points, length, spread, curveBias) => {
        const positions = points.geometry.attributes.position.array;
        for (let i = 0; i < tailCount; i++) {
          const t = i / (tailCount - 1);
          const falloff = (1 - t) * (1 - t);
          const along = t * length * falloff;
          const wave = Math.sin(t * 11.3 + state.progress * 0.04) * spread * t;
          const lateral =
            Math.sin(i * 2.17 + curveBias) * spread * t * t +
            Math.cos(i * 1.43) * spread * 0.35 * t;
          positions[i * 3] =
            tailDir.x * along + binormal.x * lateral + spreadAxis.x * wave;
          positions[i * 3 + 1] =
            tailDir.y * along + binormal.y * lateral + spreadAxis.y * wave;
          positions[i * 3 + 2] =
            tailDir.z * along + binormal.z * lateral + spreadAxis.z * wave;
        }
        points.geometry.attributes.position.needsUpdate = true;
        points.material.opacity = tailIntensity * (curveBias > 0 ? 0.55 : 0.9);
        points.material.size =
          (curveBias > 0 ? 1.4 : 1.1) + tailIntensity * (curveBias > 0 ? 2.8 : 2.4);
      };

      if (tailRef.current) {
        updateTailPoints(tailRef.current, ionLength, dustSpread * 0.25, 0);
      }
      if (dustTailRef.current) {
        updateTailPoints(dustTailRef.current, dustLength, dustSpread, 1.7);
      }

      if (nucleusRef.current) {
        nucleusRef.current.material.opacity = 0.2 + tailIntensity * 0.8;
        nucleusRef.current.visible = tailIntensity > 0.015;
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
  }, [
    scene,
    comet,
    orbitCenter,
    sunPosition,
    planets,
    sunSize,
    systemOuterRadius,
    timeScale,
    stopOrbits,
  ]);

  return null;
};
