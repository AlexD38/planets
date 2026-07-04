import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { utils } from "../utils/utils";
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

function addDustCloud(group, sunSize, count) {
  const dustPositions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
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
        opacity: 0.4,
        depthWrite: false,
      }),
    ),
  );
}

export const StellarObjects = ({ stellarType, orbitCenter, sunSize }) => {
  const { scene, timeScale, stopOrbits, pulsarSurgeActive } =
    useContext(PlanetContext);
  const groupRef = useRef(null);
  const beamMaterialsRef = useRef([]);
  const surgeRef = useRef(false);
  surgeRef.current = pulsarSurgeActive;

  useEffect(() => {
    if (!scene || stellarType === "single") return;

    const group = new THREE.Group();
    groupRef.current = group;
    beamMaterialsRef.current = [];

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
      addDustCloud(group, sunSize, 80);
    }

    if (stellarType === "pulsar") {
      const beamGeometry = new THREE.ConeGeometry(
        sunSize * 0.3,
        sunSize * 8,
        8,
        1,
        true,
      );
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const beam1 = new THREE.Mesh(beamGeometry, beamMaterial);
      beam1.rotation.x = Math.PI / 2;
      const beam2 = beam1.clone();
      beam2.material = beamMaterial.clone();
      beam2.rotation.x = -Math.PI / 2;
      beamMaterialsRef.current = [beam1.material, beam2.material];
      enableBloomLayer(beam1);
      enableBloomLayer(beam2);
      group.add(beam1, beam2);
      addDustCloud(group, sunSize, 800);
    }

    group.position.set(orbitCenter.x, orbitCenter.y, orbitCenter.z);
    scene.add(group);

    let frameId;
    const animate = () => {
      if (groupRef.current && !stopOrbits) {
        const rotSpeed = surgeRef.current ? 0.012 : 0.002;
        groupRef.current.rotation.y += rotSpeed * timeScale;
      }
      for (const mat of beamMaterialsRef.current) {
        const target = surgeRef.current ? 0.9 : 0.35;
        mat.opacity += (target - mat.opacity) * 0.08;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      scene.remove(group);
      disposeObject(group);
      groupRef.current = null;
      beamMaterialsRef.current = [];
    };
  }, [scene, stellarType, orbitCenter, sunSize, timeScale, stopOrbits]);

  return null;
};
