import { useContext, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { PlanetInfos } from "./PlanetInfos";
import { PlanetContext } from "./context/PlanetContext";
import { Planet } from "./components/Planet";
import { Stars } from "./components/stars";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Parameters } from "./components/Parameters";
import { StopOrbit } from "./components/StopOrbits";
import { BlackHole } from "./components/BlackHole";
import { FlyMode } from "./components/FlyMode";
import { Pointer } from "./components/Pointer";
import { utils } from "./utils/utils";
import "./App.css";

export default function App() {
  const mountRef = useRef(null);
  const animationFrameId = useRef();
  const mouseRef = useRef(new THREE.Vector2());
  const controlsRef = useRef(null);
  const clock = useRef(new THREE.Clock());
  const velocity = useRef(new THREE.Vector3());
  const angularVelocity = useRef(new THREE.Vector3());
  const blackHolesRef = useRef([]);

  const {
    scene,
    setScene,
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
    moveState,
  } = useContext(PlanetContext);

  const moonRotationTilt = utils.randomBetween(-0.5, 0.5);
  const moon6RotationTilt = utils.randomBetween(-0.5, 0.5);

  /* =========================
     INIT SCENE / CAMERA / RENDERER
     ========================= */
  useEffect(() => {
    const scene = new THREE.Scene();
    setScene(scene);

    const camera = new THREE.PerspectiveCamera(
      80,
      window.innerWidth / window.innerHeight,
      0.1,
      20000,
    );
    camera.position.set(
      utils.randomBetween(-70, 100),
      utils.randomBetween(-70, 100),
      utils.randomBetween(40, 40),
    );
    setCamera(camera);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: mountRef.current,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    setRenderer(renderer);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.6;
    controls.minDistance = 20;
    controls.maxDistance = 500;
    controlsRef.current = controls;

    scene.background = new THREE.Color(0x000000);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const light = new THREE.PointLight(0xffffff, 5000, 0);
    light.position.set(0, 0, 0);
    scene.add(light);

    const onMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      controls.dispose();
      renderer.dispose();
      scene.clear();
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    };
  }, [setScene, setCamera, setRenderer]);

  // --- FLY MODE CONTROLS ---
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !moveState.isFlyMode;
    }
  }, [moveState.isFlyMode]);

  /* =========================
     INIT BLACKHOLES (une fois)
     ========================= */
  useEffect(() => {
    if (blackHolesRef.current.length === 0) {
      const count = utils.randomBetween(1, 10);
      blackHolesRef.current = Array.from({ length: count }).map(() => ({
        color1: new THREE.Color(utils.getRandomHexColor()),
        color2: new THREE.Color(utils.getRandomHexColor()),
        tilt: {
          x: 0,
          y: utils.randomBetween(0, 9),
          z: utils.randomBetween(0, 9),
        },
        position: {
          x: utils.randomBetween(-1000, 1000),
          y: utils.randomBetween(-1000, 1000),
          z: utils.randomBetween(-1000, 1000),
        },
        size: 10,
      }));
    }
  }, []);

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

    // --- FLY MODE MOVEMENT ---
    if (moveState.isFlyMode) {
      const delta = clock.current.getDelta();
      const rotationSpeed = 1.5;
      const acceleration = 200.0;
      const damping = 3.0;
      const maxSpeed = 50.0;
      const angularDamping = 0.95;

      const pitchInput = moveState.pitchUp - moveState.pitchDown;
      const rollInput = moveState.rollLeft - moveState.rollRight;

      angularVelocity.current.x += pitchInput * rotationSpeed * delta;
      angularVelocity.current.z += rollInput * rotationSpeed * delta;
      angularVelocity.current.multiplyScalar(angularDamping);

      const deltaRotation = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          angularVelocity.current.x * delta,
          0,
          angularVelocity.current.z * delta,
          "XYZ",
        ),
      );
      camera.quaternion.multiply(deltaRotation);

      if (moveState.thrust || moveState.thrustReverse) {
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        if (moveState.thrust)
          velocity.current.addScaledVector(forward, acceleration * delta);
        if (moveState.thrustReverse)
          velocity.current.addScaledVector(forward, -acceleration * delta);
      }

      const dampingVector = velocity.current
        .clone()
        .multiplyScalar(-damping * delta);
      velocity.current.add(dampingVector);

      if (velocity.current.length() > maxSpeed)
        velocity.current.setLength(maxSpeed);

      camera.position.addScaledVector(velocity.current, delta);
    } else {
      velocity.current.set(0, 0, 0);
      angularVelocity.current.set(0, 0, 0);

      const idleStrength = 3.5;
      const idleLerp = 0.01;

      if (!controlsRef.current?.dragging) {
        camera.position.x +=
          (mouseRef.current.x * idleStrength - camera.position.x) * idleLerp;
        camera.position.y +=
          (mouseRef.current.y * idleStrength - camera.position.y) * idleLerp;
      }

      controlsRef.current?.update();
    }

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
    moveState,
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
      <Parameters />
      <FlyMode />
      <Pointer />
      <StopOrbit />
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
              hasRing={p.hasRing}
            />
          ))}

          <Planet
            name="sun"
            position={{ x: 0, y: 0, z: 0 }}
            rotation={-0.001}
            size={5}
            texture="sun"
          />

          {blackHolesRef.current.map((bh, index) => (
            <BlackHole
              key={index}
              color1={bh.color1}
              color2={bh.color2}
              tilt={bh.tilt}
              position={bh.position}
              size={bh.size}
            />
          ))}

          <Stars />
        </>
      )}
    </>
  );
}
