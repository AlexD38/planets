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
    planetObj2,
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
  } = useContext(PlanetContext);

  const animationFrameId = useRef();
  const moonRotationTilt = utils.randomBetween(-0.5, 0.5);
  const moon6RotationTilt = utils.randomBetween(-0.5, 0.5);
  const planetotationTilt = utils.randomBetween(-0.5, 0.5);

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
    camera.position.z = 30;
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

    // if (planetObj) {
    //   planetObj.rotation.y = time * 0.0001;
    //   const orbitPivot = new THREE.Object3D();
    //   scene.add(orbitPivot);
    //   orbitPivot.add(planetObj2);
    //   planetObj2.rotation.y += -0.02;
    //   // planet.rotation.x += 0.01; // bascule
    //   // planet.rotation.y += 0.01; // spin
    //   // planet.rotation.z += 0.01; // roulis
    // }

    if (stars1) {
      stars1.rotation.y += 0.0001;
    }
    if (stars2) stars2.rotation.y += 0.0001;
    if (stars3) stars3.rotation.y += 0.0001;
    if (stars4) stars4.rotation.y += 0.0005;

    if (stars5) {
      stars5.rotation.y += -0.001;
    }
    if (moons) {
      moons.rotation.x = moonRotationTilt;
      moons.rotation.y += 0.02;
      moons.rotation.z = moonRotationTilt;
    }
    if (moons6) {
      moons6.rotation.x = moon6RotationTilt;
      moons6.rotation.y += -0.04;
      moons6.rotation.z = moon6RotationTilt;
    }

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
          <Planet name="planet" rotation={utils.randomBetween(-0.001, 0.007)} />
          <Planet
            name="planet2"
            position={{
              x: utils.randomBetween(-20, 20),
              y: utils.randomBetween(-20, 20),
              z: utils.randomBetween(-20, -20),
            }}
            rotation={utils.randomBetween(-0.001, 0.005)}
          />
          <Planet
            name="planet3"
            position={{
              x: utils.randomBetween(-20, 20),
              y: utils.randomBetween(-20, 20),
              z: utils.randomBetween(-20, -20),
            }}
            rotation={utils.randomBetween(-0.003, 0.005)}
          />
          <Stars />
          <Actions />
        </>
      )}
    </>
  );
}
