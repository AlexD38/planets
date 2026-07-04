import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { getOrbitPosition } from "../utils/orbit";

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

export const Comet = ({ comet, orbitCenter, sunPosition }) => {
  const { scene, timeScale, stopOrbits } = useContext(PlanetContext);
  const groupRef = useRef(null);
  const orbitRef = useRef({ ...comet });
  const tailRef = useRef(null);

  useEffect(() => {
    if (!scene) return;

    const group = new THREE.Group();
    groupRef.current = group;

    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(comet.nucleusSize, 12, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
    );
    group.add(nucleus);

    const tailCount = 35;
    const tailPositions = new Float32Array(tailCount * 3);
    const tailGeometry = new THREE.BufferGeometry();
    tailGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(tailPositions, 3),
    );
    const tailMaterial = new THREE.PointsMaterial({
      color: 0xaaddff,
      size: 1.5,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const tail = new THREE.Points(tailGeometry, tailMaterial);
    tailRef.current = tail;
    group.add(tail);

    scene.add(group);

    let frameId;
    const animate = () => {
      if (groupRef.current && !stopOrbits) {
        orbitRef.current.angle += orbitRef.current.speed * timeScale;
        const pos = getOrbitPosition(
          orbitRef.current,
          orbitRef.current.angle,
          orbitCenter,
        );
        groupRef.current.position.copy(pos);

        const sunDir = new THREE.Vector3(
          sunPosition.x - pos.x,
          sunPosition.y - pos.y,
          sunPosition.z - pos.z,
        ).normalize();

        const distToSun = pos.distanceTo(
          new THREE.Vector3(sunPosition.x, sunPosition.y, sunPosition.z),
        );
        const tailIntensity = THREE.MathUtils.clamp(1 - distToSun / 400, 0, 1);

        if (tailRef.current) {
          const positions = tailRef.current.geometry.attributes.position.array;
          for (let i = 0; i < tailCount; i++) {
            const t = i / tailCount;
            positions[i * 3] = -sunDir.x * t * 25 * tailIntensity;
            positions[i * 3 + 1] = -sunDir.y * t * 25 * tailIntensity;
            positions[i * 3 + 2] = -sunDir.z * t * 25 * tailIntensity;
          }
          tailRef.current.geometry.attributes.position.needsUpdate = true;
          tailRef.current.material.opacity = 0.3 + tailIntensity * 0.6;
        }
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
  }, [scene, comet, orbitCenter, sunPosition, timeScale, stopOrbits]);

  return null;
};
