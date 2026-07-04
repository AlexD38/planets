import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";

function createCloudTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 20 + Math.random() * 40;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
    gradient.addColorStop(0, "rgba(255,255,255,0.5)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

function disposeMesh(mesh) {
  if (!mesh) return;
  mesh.geometry?.dispose();
  if (mesh.material?.map) mesh.material.map.dispose();
  mesh.material?.dispose();
}

export const PlanetClouds = ({ size, parentRef, timeScale, stopOrbits }) => {
  const { scene } = useContext(PlanetContext);
  const cloudsRef = useRef(null);

  useEffect(() => {
    if (!scene || !parentRef.current) return;

    const parent = parentRef.current;
    const cloudTexture = createCloudTexture();
    const geometry = new THREE.SphereGeometry(size * 1.01, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    cloudsRef.current = mesh;
    parent.add(mesh);

    let frameId;
    const animate = () => {
      if (cloudsRef.current && !stopOrbits) {
        cloudsRef.current.rotation.y += 0.0003 * timeScale;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      parent?.remove(mesh);
      disposeMesh(mesh);
      cloudsRef.current = null;
    };
  }, [scene, size, parentRef, timeScale, stopOrbits]);

  return null;
};
