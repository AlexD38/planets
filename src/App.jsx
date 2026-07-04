import { useContext, useEffect, useRef, useCallback, useMemo } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BLOOM_LAYER } from "./utils/bloomLayer";
import { PlanetInfos } from "./PlanetInfos";
import { PlanetContext } from "./context/PlanetContext";
import { Stars } from "./components/stars";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { BottomBar } from "./components/BottomBar";
import { BlackHole } from "./components/BlackHole";
import { PlanetLabels } from "./components/PlanetLabels";
import { SystemMinimap } from "./components/SystemMinimap";
import { Nebula } from "./components/Nebula";
import { SpaceDebris } from "./components/SpaceDebris";
import { Pointer } from "./components/Pointer";
import { Skybox } from "./components/Skybox";
import { usePlanetPicker } from "./hooks/usePlanetPicker";
import { utils } from "./utils/utils";
import {
  startSpaceAudio,
  stopSpaceAudio,
  updateSpaceAudioFromDistance,
} from "./utils/spaceAudio";
import "./App.css";
import { System } from "./components/WholeSystem";
import { getOrbitPosition } from "./utils/orbit";

function disposeObject3D(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];
      materials.forEach((material) => {
        if (material.map) material.map.dispose();
        material.dispose();
      });
    }
  });
}

export default function App() {
  const mountRef = useRef(null);
  const animationFrameId = useRef();
  const bloomComposerRef = useRef(null);
  const bloomOverlayRef = useRef(null);
  const bloomPassRef = useRef(null);
  const sceneInitRef = useRef(false);
  const mouseRef = useRef(new THREE.Vector2());
  const controlsRef = useRef(null);
  const clock = useRef(new THREE.Clock());
  const velocity = useRef(new THREE.Vector3());
  const angularVelocity = useRef(new THREE.Vector3());
  const moonRotationTilt = useRef(utils.randomBetween(-0.5, 0.5));
  const moon6RotationTilt = useRef(utils.randomBetween(-0.5, 0.5));

  const blackHoles = useMemo(() => {
    const count = Math.floor(utils.randomBetween(0, 2));
    return Array.from({ length: count }).map(() => ({
      variant: "full",
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
  }, []);

  const backgroundGalaxies = useMemo(() => {
    const count = Math.floor(utils.randomBetween(3, 5));
    return Array.from({ length: count }).map(() => {
      const distance = utils.randomBetween(420, 750);
      const theta = utils.randomBetween(0, Math.PI * 2);
      const phi = Math.acos(utils.randomBetween(-1, 1));
      return {
        variant: "background",
        numArms: Math.floor(utils.randomBetween(2, 7)),
        tilt: {
          x: utils.randomBetween(0.8, 1.8),
          y: utils.randomBetween(0, Math.PI * 2),
          z: utils.randomBetween(-0.5, 0.5),
        },
        position: {
          x: distance * Math.sin(phi) * Math.cos(theta),
          y: distance * Math.sin(phi) * Math.sin(theta) * 0.45,
          z: distance * Math.cos(phi),
        },
        size: utils.randomBetween(22, 36),
      };
    });
  }, []);

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
    systems,
    moveState,
    audioEnabled,
    isMobile,
    bloomEnabled,
    lowQuality,
    flyToTarget,
    setFlyToTarget,
  } = useContext(PlanetContext);

  usePlanetPicker(mountRef);

  useEffect(() => {
    if (sceneInitRef.current || !mountRef.current) return;
    sceneInitRef.current = true;

    const mobile = window.innerWidth < 768;
    const scene = new THREE.Scene();
    setScene(scene);

    const camera = new THREE.PerspectiveCamera(
      80,
      window.innerWidth / window.innerHeight,
      0.1,
      20000,
    );
    camera.position.set(
      utils.randomBetween(-500, 100),
      utils.randomBetween(-500, 100),
      utils.randomBetween(200, 500),
    );
    camera.layers.enable(BLOOM_LAYER);
    setCamera(camera);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: mountRef.current,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    setRenderer(renderer);

    const bloomComposer = new EffectComposer(renderer);
    bloomComposer.renderToScreen = false;
    bloomComposer.addPass(new RenderPass(scene, camera));
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      mobile ? 0.5 : 0.75,
      0.45,
      0.55,
    );
    bloomComposer.addPass(bloomPass);
    bloomComposerRef.current = bloomComposer;
    bloomPassRef.current = bloomPass;

    const overlayScene = new THREE.Scene();
    const overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const overlayMaterial = new THREE.ShaderMaterial({
      uniforms: {
        bloomTexture: { value: bloomComposer.readBuffer.texture },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D bloomTexture;
        varying vec2 vUv;
        void main() {
          gl_FragColor = vec4(texture2D(bloomTexture, vUv).rgb, 1.0);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
    overlayScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), overlayMaterial));
    bloomOverlayRef.current = { scene: overlayScene, camera: overlayCamera, material: overlayMaterial };

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.6;
    controls.minDistance = 20;
    controls.maxDistance = 1500;
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const light = new THREE.PointLight(0xffffff, 5000, 0);
    light.position.set(0, 0, 0);
    scene.add(light);

    const onMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      bloomComposer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("resize", onResize);

    return () => {
      sceneInitRef.current = false;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);
      controls.dispose();
      bloomComposer.dispose();
      bloomOverlayRef.current?.material.dispose();
      bloomOverlayRef.current?.scene.children[0]?.geometry?.dispose();
      renderer.dispose();
      disposeObject3D(scene);
      bloomComposerRef.current = null;
      bloomOverlayRef.current = null;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
    // Scene must init once only — never re-run on context/UI updates
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!renderer) return;
    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2),
    );
  }, [isMobile, renderer]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !moveState.isFlyMode;
    }
  }, [moveState.isFlyMode]);

  useEffect(() => {
    if (audioEnabled) {
      startSpaceAudio();
    } else {
      stopSpaceAudio();
    }
  }, [audioEnabled]);

  const animate = useCallback(() => {
    if (!renderer || !scene || !camera) return;

    if (stars1) stars1.rotation.y += 0.0001;
    if (stars2) stars2.rotation.y += 0.0001;
    if (stars3) stars3.rotation.y += 0.0001;
    if (stars4) stars4.rotation.y += 0.0005;
    if (stars5) stars5.rotation.y -= 0.001;

    if (moons) {
      moons.rotation.x = moonRotationTilt.current;
      moons.rotation.y += 0.02;
      moons.rotation.z = moonRotationTilt.current;
    }

    if (moons6) {
      moons6.rotation.x = moon6RotationTilt.current;
      moons6.rotation.y -= 0.04;
      moons6.rotation.z = moon6RotationTilt.current;
    }

    if (audioEnabled && camera) {
      const dist = camera.position.length();
      updateSpaceAudioFromDistance(dist);
    }

    if (moveState.isFlyMode) {
      const delta = clock.current.getDelta();
      const rotationSpeed = 3.5;
      const acceleration = 50.0;
      const damping = 2.0;
      const maxSpeed = 500.0;
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
        if (moveState.thrust) {
          velocity.current.addScaledVector(forward, acceleration * delta);
        }
        if (moveState.thrustReverse) {
          velocity.current.addScaledVector(forward, -acceleration * delta);
        }
      }

      velocity.current.addScaledVector(velocity.current, -damping * delta);

      if (velocity.current.length() > maxSpeed) {
        velocity.current.setLength(maxSpeed);
      }

      camera.position.addScaledVector(velocity.current, delta);
    } else {
      velocity.current.set(0, 0, 0);
      angularVelocity.current.set(0, 0, 0);

      if (flyToTarget && controlsRef.current) {
        const { planet, orbitCenter } = flyToTarget;
        const pos = getOrbitPosition(planet.orbit, planet.orbit.angle, orbitCenter);
        const target = new THREE.Vector3(pos.x, pos.y, pos.z);
        const offsetDist = planet.size * 5 + 25;
        const dir = camera.position.clone().sub(target);
        if (dir.lengthSq() < 0.01) dir.set(0.4, 0.3, 1);
        dir.normalize();
        const desired = target.clone().add(dir.multiplyScalar(offsetDist));
        camera.position.lerp(desired, 0.05);
        controlsRef.current.target.lerp(target, 0.07);
        if (camera.position.distanceTo(desired) < 2) {
          setFlyToTarget(null);
        }
      } else {
        const idleStrength = 3.5;
        const idleLerp = 0.01;

        if (!controlsRef.current?.dragging) {
          camera.position.x +=
            (mouseRef.current.x * idleStrength - camera.position.x) * idleLerp;
          camera.position.y +=
            (mouseRef.current.y * idleStrength - camera.position.y) * idleLerp;
        }
      }

      controlsRef.current?.update();
    }

    camera.layers.enable(0);
    camera.layers.enable(BLOOM_LAYER);

    renderer.setRenderTarget(null);
    renderer.render(scene, camera);

    if (bloomEnabled && bloomComposerRef.current && bloomOverlayRef.current) {
      const savedLayers = camera.layers.mask;
      camera.layers.set(BLOOM_LAYER);
      bloomComposerRef.current.render();
      camera.layers.mask = savedLayers;
      camera.layers.enable(0);
      camera.layers.enable(BLOOM_LAYER);

      const { scene: overlayScene, camera: overlayCamera, material } =
        bloomOverlayRef.current;
      material.uniforms.bloomTexture.value =
        bloomComposerRef.current.readBuffer.texture;

      const prevAutoClear = renderer.autoClear;
      renderer.autoClear = false;
      renderer.render(overlayScene, overlayCamera);
      renderer.autoClear = prevAutoClear;
    }
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
    audioEnabled,
    bloomEnabled,
    flyToTarget,
    setFlyToTarget,
  ]);

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
      <div className="viewport-overlay" aria-hidden />
      <div className="viewport-scanlines" aria-hidden />
      <BottomBar />
      <Pointer />
      <PlanetInfos />
      <PlanetLabels />
      <SystemMinimap />

      {scene && (
        <>
          {systems?.map((system, index) => (
            <System
              key={`system-${index}`}
              x={system.x}
              y={system.y}
              z={system.z}
              planets={system.planets}
              asteroidBelt={system.asteroidBelt}
              comets={system.comets}
              stellarType={system.stellarType}
            />
          ))}

          {blackHoles.map((blackHole, index) => (
            <BlackHole
              key={`black-hole-${index}`}
              variant={blackHole.variant}
              color1={blackHole.color1}
              color2={blackHole.color2}
              tilt={blackHole.tilt}
              position={blackHole.position}
              size={blackHole.size}
            />
          ))}

          {backgroundGalaxies
            .slice(0, lowQuality ? 2 : backgroundGalaxies.length)
            .map((galaxy, index) => (
            <BlackHole
              key={`bg-galaxy-${index}`}
              variant={galaxy.variant}
              numArms={galaxy.numArms}
              tilt={galaxy.tilt}
              position={galaxy.position}
              size={galaxy.size}
            />
          ))}

          <Skybox />
          <Nebula count={lowQuality ? 1 : isMobile ? 2 : 3} />
          {!lowQuality && <SpaceDebris />}
          <Stars />
        </>
      )}
    </>
  );
}
