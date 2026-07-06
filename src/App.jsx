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
import { CaptainLog } from "./components/CaptainLog";
import { FlyTouchControls } from "./components/FlyTouchControls";
import { CockpitOverlay } from "./components/CockpitOverlay";
import { RareEvents } from "./components/RareEvents";
import { AmbientCaptainLog } from "./components/AmbientCaptainLog";
import { BlackHole, STELLAR_CORE_COLORS } from "./components/BlackHole";
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
  updateSpaceAudioAmbience,
} from "./utils/spaceAudio";
import {
  createCinematicPost,
  updateCinematicUniforms,
} from "./utils/cinematicPost";
import "./App.css";
import "./hud-layout.css";
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

function isSunObject(object) {
  let node = object;
  while (node) {
    if (node.userData?.planetId === "sun") return true;
    node = node.parent;
  }
  return false;
}

function renderSunDepthMap(renderer, scene, camera, target) {
  const toggled = [];
  scene.traverse((obj) => {
    if (!obj.isMesh) return;
    toggled.push([obj, obj.visible]);
    obj.visible = isSunObject(obj);
  });

  const prevTarget = renderer.getRenderTarget();
  renderer.setRenderTarget(target);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(prevTarget);

  toggled.forEach(([obj, visible]) => {
    obj.visible = visible;
  });
}

function createDepthRenderTarget(width, height) {
  const depthTexture = new THREE.DepthTexture(width, height);
  return new THREE.WebGLRenderTarget(width, height, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    depthTexture,
    depthBuffer: true,
  });
}

function getNearestBodyDistance(camera, system) {
  if (!camera || !system) return 500;
  const orbitCenter = { x: system.x, y: system.y, z: system.z };
  let min = Infinity;

  for (const planet of system.planets ?? []) {
    if (!planet.orbit) continue;
    const pos = getOrbitPosition(planet.orbit, planet.orbit.angle, orbitCenter);
    min = Math.min(min, camera.position.distanceTo(pos));
  }

  for (const asteroid of system.asteroidBelt?.majorAsteroids ?? []) {
    if (!asteroid.orbit) continue;
    const pos = getOrbitPosition(asteroid.orbit, asteroid.orbit.angle, orbitCenter);
    pos.y += asteroid.yOffset ?? 0;
    min = Math.min(min, camera.position.distanceTo(pos));
  }

  return Number.isFinite(min) ? min : 500;
}

export default function App() {
  const mountRef = useRef(null);
  const animationFrameId = useRef();
  const bloomComposerRef = useRef(null);
  const bloomOverlayRef = useRef(null);
  const bloomPassRef = useRef(null);
  const captureRTRef = useRef(null);
  const sunDepthRTRef = useRef(null);
  const sunLightRef = useRef(null);
  const cinematicPostRef = useRef(null);
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
        x: utils.randomBetween(-700, 700),
        y: utils.randomBetween(-400, 400),
        z: utils.randomBetween(-700, 700),
      },
      size: 18,
    }));
  }, []);

  const backgroundGalaxies = useMemo(() => {
    const count = Math.floor(utils.randomBetween(3, 5));
    return Array.from({ length: count }).map(() => {
      const brightCore = Math.random() < 0.38;
      const isDistant = Math.random() < 0.5;
      const distance = isDistant
        ? utils.randomBetween(1500, 3200)
        : utils.randomBetween(420, 900);
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
        size: isDistant
          ? utils.randomBetween(40, 62)
          : utils.randomBetween(18, 32),
        armSpread: utils.randomBetween(0.7, 9.5),
        brightCore,
        coreColor:
          STELLAR_CORE_COLORS[
            Math.floor(Math.random() * STELLAR_CORE_COLORS.length)
          ],
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
    activeEvent,
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
        sceneDepthTexture: { value: null },
        sunDepthTexture: { value: null },
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
        uniform sampler2D sceneDepthTexture;
        uniform sampler2D sunDepthTexture;
        varying vec2 vUv;

        void main() {
          vec3 bloom = texture2D(bloomTexture, vUv).rgb;
          float sceneZ = texture2D(sceneDepthTexture, vUv).r;
          float sunZ = texture2D(sunDepthTexture, vUv).r;
          float sunVisible = step(sunZ, sceneZ + 0.00015);
          gl_FragColor = vec4(bloom * sunVisible, 1.0);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthTest: false,
      depthWrite: false,
    });
    overlayScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), overlayMaterial));
    bloomOverlayRef.current = { scene: overlayScene, camera: overlayCamera, material: overlayMaterial };

    const captureRT = createDepthRenderTarget(
      window.innerWidth,
      window.innerHeight,
    );
    captureRTRef.current = captureRT;
    const sunDepthRT = createDepthRenderTarget(
      window.innerWidth,
      window.innerHeight,
    );
    sunDepthRTRef.current = sunDepthRT;
    overlayMaterial.uniforms.sceneDepthTexture.value = captureRT.depthTexture;
    overlayMaterial.uniforms.sunDepthTexture.value = sunDepthRT.depthTexture;
    cinematicPostRef.current = createCinematicPost();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = mobile ? 0.45 : 0.6;
    controls.zoomSpeed = mobile ? 0.8 : 1;
    controls.minDistance = 20;
    controls.maxDistance = 1500;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0x8899bb, 0.28);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x6688cc, 0x221111, 0.18);
    scene.add(hemiLight);

    const sunLight = new THREE.PointLight(0xfff4e8, 6, 0, 0);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);
    sunLightRef.current = sunLight;

    const onMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      bloomComposer.setSize(window.innerWidth, window.innerHeight);
      captureRTRef.current?.setSize(window.innerWidth, window.innerHeight);
      sunDepthRTRef.current?.setSize(window.innerWidth, window.innerHeight);
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
      captureRTRef.current?.dispose();
      sunDepthRTRef.current?.dispose();
      cinematicPostRef.current?.dispose();
      captureRTRef.current = null;
      sunDepthRTRef.current = null;
      cinematicPostRef.current = null;
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

    if (audioEnabled && camera && systems[0]) {
      const system = systems[0];
      const sunPos = new THREE.Vector3(system.x, system.y, system.z);
      const distToSun = camera.position.distanceTo(sunPos);
      const distToNearestBody = getNearestBodyDistance(camera, system);
      updateSpaceAudioAmbience({
        distToSun,
        distToNearestBody,
        flySpeed: moveState.isFlyMode ? velocity.current.length() : 0,
        stellarType: system.stellarType,
      });
    }

    const system = systems?.[0];
    const sunPos = system
      ? new THREE.Vector3(system.x, system.y, system.z)
      : new THREE.Vector3(0, 0, 0);
    const distToSun = camera.position.distanceTo(sunPos);
    const isEclipse = activeEvent?.type === "eclipse";

    if (sunLightRef.current) {
      sunLightRef.current.position.copy(sunPos);
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

    const captureRT = captureRTRef.current;
    const cinematicPost = cinematicPostRef.current;

    if (captureRT && cinematicPost) {
      renderer.setRenderTarget(captureRT);
      renderer.clear();
      renderer.render(scene, camera);

      if (bloomEnabled && bloomComposerRef.current && bloomOverlayRef.current) {
        const savedLayers = camera.layers.mask;
        camera.layers.set(BLOOM_LAYER);
        bloomComposerRef.current.render();
        camera.layers.mask = savedLayers;
        camera.layers.enable(0);
        camera.layers.enable(BLOOM_LAYER);

        if (sunDepthRTRef.current) {
          renderSunDepthMap(renderer, scene, camera, sunDepthRTRef.current);
        }

        const { scene: overlayScene, camera: overlayCamera, material } =
          bloomOverlayRef.current;
        material.uniforms.bloomTexture.value =
          bloomComposerRef.current.readBuffer.texture;
        if (captureRT.depthTexture) {
          material.uniforms.sceneDepthTexture.value = captureRT.depthTexture;
        }
        if (sunDepthRTRef.current?.depthTexture) {
          material.uniforms.sunDepthTexture.value =
            sunDepthRTRef.current.depthTexture;
        }

        const prevAutoClear = renderer.autoClear;
        renderer.autoClear = false;
        renderer.render(overlayScene, overlayCamera);
        renderer.autoClear = prevAutoClear;
      }

      renderer.setRenderTarget(null);
      cinematicPost.uniforms.tDiffuse.value = captureRT.texture;
      updateCinematicUniforms(cinematicPost.uniforms, {
        vignetteStrength: isEclipse ? 0.6 : 0.25,
        grainStrength: lowQuality ? 0 : 0.04,
        chromaticAberration: Math.min(0.012, 50 / Math.max(distToSun, 30)),
        exposure: isEclipse ? 0.65 : 1.0,
        time: clock.current.getElapsedTime(),
      });
      renderer.render(cinematicPost.scene, cinematicPost.camera);
    } else {
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      if (bloomEnabled && bloomComposerRef.current && bloomOverlayRef.current) {
        const savedLayers = camera.layers.mask;
        camera.layers.set(BLOOM_LAYER);
        bloomComposerRef.current.render();
        camera.layers.mask = savedLayers;
        camera.layers.enable(0);
        camera.layers.enable(BLOOM_LAYER);

        if (sunDepthRTRef.current) {
          renderSunDepthMap(renderer, scene, camera, sunDepthRTRef.current);
        }

        const { scene: overlayScene, camera: overlayCamera, material } =
          bloomOverlayRef.current;
        material.uniforms.bloomTexture.value =
          bloomComposerRef.current.readBuffer.texture;
        if (captureRTRef.current?.depthTexture) {
          material.uniforms.sceneDepthTexture.value =
            captureRTRef.current.depthTexture;
        }
        if (sunDepthRTRef.current?.depthTexture) {
          material.uniforms.sunDepthTexture.value =
            sunDepthRTRef.current.depthTexture;
        }

        const prevAutoClear = renderer.autoClear;
        renderer.autoClear = false;
        renderer.render(overlayScene, overlayCamera);
        renderer.autoClear = prevAutoClear;
      }
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
    systems,
    activeEvent,
    lowQuality,
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

      <div className="hud-shell">
        <div className="hud-zone hud-zone-tl">
          <PlanetInfos />
        </div>
        <div className="hud-zone hud-zone-tr">
          <SystemMinimap />
        </div>
        <div className="hud-zone hud-zone-bl">
          <CaptainLog />
        </div>
      </div>

      <BottomBar />
      <CockpitOverlay />
      <Pointer />
      <FlyTouchControls />
      <PlanetLabels />
      <RareEvents />
      <AmbientCaptainLog />

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
              sunName={system.sunName}
              sunSize={system.sunSize}
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
            .slice(0, lowQuality ? 2 : isMobile ? 3 : backgroundGalaxies.length)
            .map((galaxy, index) => (
            <BlackHole
              key={`bg-galaxy-${index}`}
              variant={galaxy.variant}
              numArms={galaxy.numArms}
              tilt={galaxy.tilt}
              position={galaxy.position}
              size={galaxy.size}
              armSpread={galaxy.armSpread}
              brightCore={galaxy.brightCore}
              coreColor={galaxy.coreColor}
            />
          ))}

          <Skybox />
          <Nebula count={lowQuality ? 18 : isMobile ? 24 : 33} />
          {!lowQuality && <SpaceDebris />}
          <Stars />
        </>
      )}
    </>
  );
}
