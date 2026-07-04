import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";

function createSeamlessSkyTexture() {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#020208");
  gradient.addColorStop(0.45, "#050514");
  gradient.addColorStop(0.7, "#080818");
  gradient.addColorStop(1, "#010106");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle star noise — seamless horizontally (equirectangular wraps on X)
  for (let i = 0; i < 350; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const r = Math.random() * 1.2;
    const alpha = Math.random() * 0.35;
    ctx.fillStyle = `rgba(200,210,255,${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const Skybox = () => {
  const { scene } = useContext(PlanetContext);
  const initRef = useRef(false);

  useEffect(() => {
    if (!scene || initRef.current) return;
    initRef.current = true;

    const texture = createSeamlessSkyTexture();
    scene.background = texture;

    return () => {
      texture.dispose();
      scene.background = null;
      initRef.current = false;
    };
  }, [scene]);

  return null;
};
