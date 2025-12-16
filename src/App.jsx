import { useContext, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { PlanetInfos } from "./PlanetInfos";
import { PlanetContext } from "./context/PlanetContext";
import { Actions } from "./components/Actions";
import { utils } from "./utils/utils";
import "./App.css";
import { Planet } from "./components/Planet";
import { Stars } from "./components/stars";

export default function App() {
  const mountRef = useRef(null);
  const {
    scene,
    setScene,
    planetObj,
    stars1,
    stars2,
    stars3,
    stars4,
    stars5,
    camera,
    setCamera,
    renderer,
    setRenderer,
  } = useContext(PlanetContext);

  const animationFrameId = useRef();

  useEffect(() => {
    const scene = new THREE.Scene();
    setScene(scene);
    scene.background = new THREE.Color(0x000000); // fond noir

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 20;
    setCamera(camera);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: mountRef.current,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    setRenderer(renderer);

    // --- LUMIÈRES ---
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    const { x, y, z } = utils.getRandomLightPosition();

    directionalLight.position.set(x, y, z);

    scene.add(directionalLight);
    scene.add(new THREE.AmbientLight(utils.getRandomHexColor()));

    // --- CLEANUP ---
    return () => {
      renderer.dispose();
      scene.clear();
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [setScene, setCamera, setRenderer]);

  const animate = useCallback(() => {
    if (!renderer || !scene || !camera) {
      return;
    }

    const time = Date.now();

    if (planetObj) {
      planetObj.rotation.y = time * 0.0001;
      planetObj.rotation.x = Math.sin(time * 0.00005) * 0.05;
    }

    if (stars1) {
      stars1.rotation.y += 0.0001;
    }
    if (stars2) stars2.rotation.y += 0.0001;
    if (stars3) stars3.rotation.y += 0.0001;
    if (stars4) stars4.rotation.y += 0.0001;
    if (stars5) stars5.rotation.y += 0.0001;

    const t = Date.now() * 0.0002;
    const light = scene.children.find(
      (child) => child instanceof THREE.DirectionalLight
    );
    if (light) {
      light.position.set(Math.cos(t) * 30, 10, Math.sin(t) * 30);
    }

    renderer.render(scene, camera);
    animationFrameId.current = requestAnimationFrame(animate);
  }, [renderer, scene, camera, planetObj, stars1]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [animate]);

  return (
    <>
      <canvas ref={mountRef} className="three-canvas" />
      <PlanetInfos />
      {scene && (
        <>
          <Planet />
          <Stars />
          <Actions />
        </>
      )}
    </>
  );
}
