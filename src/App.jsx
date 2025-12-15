import { useContext, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { PlanetInfos } from "./PlanetInfos";
import { PlanetContext } from "./context/PlanetContext";
import { Actions } from "./components/Actions";
import { utils } from "./utils/utils";
import "./App.css";

export default function App() {
  const mountRef = useRef(null);
  const { planetInfos, planetSize, isMobile } = useContext(PlanetContext);

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // fond noir

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 20;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: mountRef.current,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // --- PLANÈTE ---
    let calculatedPLanetSize = 5;
    if (planetSize) {
      if (planetSize == "xs") {
        calculatedPLanetSize = 2;
      }
      if (planetSize == "s") {
        calculatedPLanetSize = 3;
      }
      if (planetSize == "m") {
        calculatedPLanetSize = 5;
      }
      if (planetSize == "l") {
        calculatedPLanetSize = 7;
      }
      if (planetSize == "xl") {
        calculatedPLanetSize = 8.5;
      }
      if (planetSize == "xxl") {
        calculatedPLanetSize = 10;
      }
    }
    const planetGeometry = new THREE.SphereGeometry(
      calculatedPLanetSize,
      64,
      64
    );
    const textureLoader = new THREE.TextureLoader();
    const nebTexture = textureLoader.load("/textures/neb.jpg", (texture) => {
      const grid = 4; // 4x4 grid
      const randomX = Math.floor(Math.random() * grid);
      const randomY = Math.floor(Math.random() * grid);

      texture.repeat.set(1 / grid, 1 / grid);
      texture.offset.set(randomX / grid, randomY / grid);
    });
    const planetMaterial = new THREE.MeshStandardMaterial({
      map: nebTexture,
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    scene.add(planet);

    // --- LUMIÈRES ---
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    const { x, y, z } = utils.getRandomLightPosition();
    directionalLight.position.set(x, y, z);
    scene.add(directionalLight);
    scene.add(new THREE.AmbientLight(utils.getRandomHexColor()));

    // --- ÉTOILES PROCÉDURALES ---
    const starCount = 6000;
    const starCount2 = 600;
    const starCount3 = 600;
    const starCount4 = 60;
    const starGeometry = new THREE.BufferGeometry();
    const starGeometry2 = new THREE.BufferGeometry();
    const starGeometry3 = new THREE.BufferGeometry();
    const starGeometry4 = new THREE.BufferGeometry();
    const starPositions = [];
    const starPositions2 = [];
    const starPositions3 = [];
    const starPositions4 = [];

    for (let i = 0; i < starCount; i++) {
      starPositions.push(
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 1000
      );
    }
    for (let i = 0; i < starCount2; i++) {
      starPositions2.push(
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 1000
      );
    }
    for (let i = 0; i < starCount3; i++) {
      starPositions3.push(
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 1000
      );
    }
    for (let i = 0; i < starCount4; i++) {
      starPositions4.push(
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 1000,
        (Math.random() - 0.5) * 1000
      );
    }

    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions, 3)
    );

    starGeometry2.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions2, 3)
    );

    starGeometry3.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions3, 3)
    );
    starGeometry4.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(starPositions3, 3)
    );

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      sizeAttenuation: false,
    });
    const starMaterial2 = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: false,
    });
    const starMaterial3 = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: false,
    });

    const starTexture = new THREE.TextureLoader().load("/textures/sun_big.png");

    const starMaterial4 = new THREE.PointsMaterial({
      map: starTexture,
      color: 0xffffff,
      size: 4,
      transparent: true,
      alphaTest: 0.5,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    const stars2 = new THREE.Points(starGeometry2, starMaterial2);
    const stars3 = new THREE.Points(starGeometry3, starMaterial3);
    const stars4 = new THREE.Points(starGeometry4, starMaterial4);
    scene.add(stars);
    scene.add(stars2);
    scene.add(stars3);
    scene.add(stars4);

    // --- ANIMATION LOOP ---
    const animate = () => {
      requestAnimationFrame(animate);

      planet.rotation.y += 0.002;

      // on peut faire tourner légèrement les étoiles pour l'effet dynamique
      stars.rotation.y += 0.0001;
      stars2.rotation.y += 0.0001;
      stars3.rotation.y += 0.0001;
      stars4.rotation.y += 0.0001;
      const time = Date.now();

      planet.rotation.y = time * 0.0001;
      planet.rotation.x = Math.sin(time * 0.00005) * 0.05;

      const t = Date.now() * 0.0002;
      directionalLight.position.set(Math.cos(t) * 30, 10, Math.sin(t) * 30);

      renderer.render(scene, camera);
    };
    animate();

    // --- CLEANUP ---
    return () => {
      renderer.dispose();
      scene.clear();
    };
  }, [planetSize, planetInfos]);

  return (
    <>
      <canvas ref={mountRef} className="three-canvas" />
      <PlanetInfos />
    </>
  );
}
