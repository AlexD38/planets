import { useContext, useEffect, useRef, useCallback, useState } from "react";
import * as THREE from "three";
import { PlanetInfos } from "./PlanetInfos";
import { PlanetContext } from "./context/PlanetContext";
import { Actions } from "./components/Actions";
import { utils } from "./utils/utils";
import "./App.css";
import { Planet } from "./components/Planet";
import { Stars } from "./components/stars";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export default function App() {
  const mountRef = useRef(null);
  const animationFrameId = useRef();
  const mouseRef = useRef(new THREE.Vector2());
  const controlsRef = useRef(null);

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
    moons,
    moons6,
    setCamera,
    renderer,
    setRenderer,
    universe,
  } = useContext(PlanetContext);

  const [bgTexture, setBgTexture] = useState(null);

  const moonRotationTilt = utils.randomBetween(-0.5, 0.5);
  const moon6RotationTilt = utils.randomBetween(-0.5, 0.5);

  /* =========================
     INIT SCENE / CAMERA / RENDERER
     ========================= */
  useEffect(() => {
    const scene = new THREE.Scene();
    setScene(scene);

    // --- CAMERA ---
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 80;
    setCamera(camera);

    // --- RENDERER ---
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: mountRef.current,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    setRenderer(renderer);

    // --- CONTROLS (UNE SEULE FOIS) ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.6;
    controls.minDistance = 20;
    controls.maxDistance = 500;
    controlsRef.current = controls;

    // --- BACKGROUND ---
    scene.background = new THREE.Color(0x000000);

    // // --- LIGHT ---
    // const directionalLight = new THREE.DirectionalLight(0xffffff, 2, 0);
    // const { x, y, z } = utils.getRandomLightPosition();
    // directionalLight.position.set(x, 0, z);
    // scene.add(directionalLight);

    // --- LIGHT ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    // Lumière rouge au centre
    const light = new THREE.PointLight(0xffffff, 5000, 0);
    light.position.set(0, 0, 0);
    scene.add(light);

    // --- MOUSE ---
    const onMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    // --- CLEANUP ---
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      controls.dispose();
      renderer.dispose();
      scene.clear();
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    };
  }, [setScene, setCamera, setRenderer]);

  /* =========================
     ANIMATION LOOP
     ========================= */
  const animate = useCallback(() => {
    if (!renderer || !scene || !camera) return;

    // --- STARS ---
    stars1 && (stars1.rotation.y += 0.0001);
    stars2 && (stars2.rotation.y += 0.0001);
    stars3 && (stars3.rotation.y += 0.0001);
    stars4 && (stars4.rotation.y += 0.0005);
    stars5 && (stars5.rotation.y -= 0.001);

    // --- MOONS ---
    if (moons) {
      moons.rotation.x = moonRotationTilt;
      moons.rotation.y += 0.02;
      moons.rotation.z = moonRotationTilt;
    }

    if (moons6) {
      moons6.rotation.x = moon6RotationTilt;
      moons6.rotation.y -= 0.04;
      moons6.rotation.z = moon6RotationTilt;
    }

    // --- BACKGROUND PARALLAX (LIÉ À LA CAMÉRA) ---
    if (bgTexture) {
      bgTexture.offset.x = camera.position.x * 0.002;
      bgTexture.offset.y = camera.position.y * 0.002;
    }
    // const idleStrength = 0.5; // → très subtil
    const idleStrength = 3.5; //→ plus expressif
    const idleLerp = 0.01; // → cinématique
    // const idleLerp = 0.05; //→ réactif
    if (!controlsRef.current?.dragging) {
      camera.position.x +=
        (mouseRef.current.x * idleStrength - camera.position.x) * idleLerp;
      camera.position.y +=
        (mouseRef.current.y * idleStrength - camera.position.y) * idleLerp;
    }
    controlsRef.current?.update();
    renderer.render(scene, camera);

    animationFrameId.current = requestAnimationFrame(animate);
  }, [
    renderer,
    scene,
    camera,
    stars1,
    stars2,
    stars3,
    stars4,
    stars5,
    moons,
    moons6,
    bgTexture,
  ]);

  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    };
  }, [animate]);

  return (
    <>
      <canvas ref={mountRef} className="three-canvas" />
      <PlanetInfos />

      {scene && (
        <>
          {universe?.map((p) => (
            <Planet
              key={p.name}
              name={p.name}
              position={{ x: p.x, y: p.y, z: p.z }}
              rotation={p.rotation}
              size={p.size}
              texture={p.texture}
              color={p.color}
              orbit={p.orbit}
            />
          ))}

          <Planet
            name="sun"
            position={{ x: 0, y: 0, z: 0 }}
            rotation={-0.001}
            size={5}
            texture="sun"
          />

          <Stars />
          <Actions />
        </>
      )}
    </>
  );
}
