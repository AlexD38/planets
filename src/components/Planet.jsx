import { useContext, useEffect, useRef, useCallback, useState } from "react";
import { PlanetContext } from "../context/PlanetContext";
import * as THREE from "three";
import { utils } from "../utils/utils";
import { updateOrbit } from "../utils/orbit";
import { getMaterialOptionsForType } from "../utils/planetVisuals";
import { enableBloomLayer } from "../utils/bloomLayer";
import { PlanetAtmosphere } from "./PlanetAtmosphere";
import { PlanetAurora } from "./PlanetAurora";
import { PlanetClouds } from "./PlanetClouds";
import { Moon } from "./Moon";
import { Satellite } from "./Satellite";
import { SunHalo } from "./SunHalo";

function createRockRingBand(count, planetSize, radiusMin, radiusMax, angleSteps) {
  const rockSize = Math.max(0.08, planetSize * 0.05);
  const spreadY = Math.max(0.15, planetSize * 0.035);
  const geometry = new THREE.DodecahedronGeometry(rockSize, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0xc4b5a0,
    metalness: 0.55,
    roughness: 0.88,
    emissive: 0x332211,
    emissiveIntensity: 0.15,
  });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  const dummy = new THREE.Object3D();
  const radiusScale = Math.max(1, planetSize * 0.08);

  for (let i = 0; i < count; i++) {
    const angle = (i / angleSteps) * Math.PI * 2;
    const radius =
      planetSize + utils.randomBetween(radiusMin, radiusMax) * radiusScale;
    dummy.position.set(
      Math.cos(angle) * radius,
      (Math.random() - 0.5) * spreadY,
      Math.sin(angle) * radius,
    );
    dummy.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    );
    dummy.scale.setScalar(utils.randomBetween(0.5, 2.4));
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }

  mesh.instanceMatrix.needsUpdate = true;
  return mesh;
}

function disposeMesh(mesh) {
  if (!mesh) return;
  mesh.traverse((child) => {
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

export const Planet = ({
  position,
  name,
  rotation,
  size,
  orbitCenter,
  texture,
  color,
  orbit,
  hasRing,
  planetData,
  hasAtmosphere,
  hasClouds,
  cityLights,
  moons = [],
  hasSatellite,
  type,
}) => {
  const {
    scene,
    renderer,
    camera,
    stopOrbits,
    timeScale,
    registerSelectable,
    unregisterSelectable,
    lowQuality,
    isMobile,
  } = useContext(PlanetContext);
  const animationFrameId = useRef();
  const planetRef = useRef(null);
  const ringGroupRef = useRef(null);
  const ringSpeedRef = useRef(utils.randomBetween(0.001, 0.005));
  const textureRef = useRef(null);
  const positionRef = useRef({ x: 0, y: 0, z: 0 });
  const cityLightsRef = useRef(null);
  const [meshReady, setMeshReady] = useState(false);

  useEffect(() => {
    setMeshReady(false);
    if (!scene) return;

    const planetGeometry = new THREE.SphereGeometry(size, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    const planetTexture = textureLoader.load(`/hd/${texture}.jpg`);
    textureRef.current = planetTexture;

    let baseOptions = {
      map: planetTexture,
      color: color || 0xffffff,
    };

    if (name === "sun") {
      baseOptions.emissive = 0xffffaa;
      baseOptions.emissiveMap = planetTexture;
      baseOptions.emissiveIntensity = utils.randomBetween(0.1, 50);
    } else if (type) {
      baseOptions = getMaterialOptionsForType(type, baseOptions);
    }

    const planetMaterial = new THREE.MeshStandardMaterial({
      ...baseOptions,
      roughness: baseOptions.roughness ?? 0.82,
      metalness: baseOptions.metalness ?? 0.04,
      transparent: false,
      opacity: 1,
      depthWrite: true,
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);

    if (name === "sun") {
      enableBloomLayer(planet);
    }

    if (planetData) {
      planet.userData.planetId = planetData.planetId;
      planet.userData.planetData = planetData;
      registerSelectable(planet, planetData);
    }

    if (cityLights && name !== "sun") {
      const lightsGeometry = new THREE.SphereGeometry(size * 1.003, 64, 64);
      const lightsMaterial = new THREE.ShaderMaterial({
        uniforms: {
          sunPosition: { value: new THREE.Vector3(orbitCenter.x, orbitCenter.y, orbitCenter.z) },
        },
        vertexShader: `
          varying vec3 vWorldNormal;
          varying vec3 vWorldPos;
          void main() {
            vec4 worldPos = modelMatrix * vec4(position, 1.0);
            vWorldPos = worldPos.xyz;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 sunPosition;
          varying vec3 vWorldNormal;
          varying vec3 vWorldPos;
          void main() {
            vec3 toSun = normalize(sunPosition - vWorldPos);
            float nightSide = 1.0 - smoothstep(-0.12, 0.04, dot(vWorldNormal, toSun));
            if (nightSide < 0.01) discard;
            float city = fract(sin(dot(vWorldPos * 0.35, vec2(12.9898, 78.233))) * 43758.5453);
            city = step(0.94, city) * nightSide;
            if (city < 0.01) discard;
            gl_FragColor = vec4(1.0, 0.9, 0.5, city * 0.7);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        depthTest: true,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      });
      const lightsMesh = new THREE.Mesh(lightsGeometry, lightsMaterial);
      cityLightsRef.current = lightsMesh;
      planet.add(lightsMesh);
    }

    if (hasRing) {
      const ringGroup = new THREE.Group();
      const density = lowQuality || isMobile ? 0.55 : 1;
      const bands = [
        { count: Math.floor(600 * density), min: 0.5, max: 2, steps: 600 },
        { count: Math.floor(150 * density), min: 0.5, max: 3, steps: 150 },
        { count: Math.floor(150 * density), min: 0.5, max: 6, steps: 100 },
      ];

      for (const band of bands) {
        if (band.count > 0) {
          ringGroup.add(
            createRockRingBand(
              band.count,
              size,
              band.min,
              band.max,
              band.steps,
            ),
          );
        }
      }

      ringGroup.rotation.y = 1.7;
      ringGroupRef.current = ringGroup;
      planet.add(ringGroup);
    }

    planetRef.current = planet;

    if (position) {
      planet.position.set(position.x, position.y, position.z);
      positionRef.current = { ...position };
    }

    scene.add(planet);
    setMeshReady(true);

    return () => {
      setMeshReady(false);
      if (planetData) unregisterSelectable(planet);
      scene.remove(planet);
      disposeMesh(planet);
      if (textureRef.current) textureRef.current.dispose();
      planetRef.current = null;
      ringGroupRef.current = null;
      cityLightsRef.current = null;
    };
    // planetData.planetId ensures added planets mount their Three.js mesh
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene, size, texture, color, hasRing, name, type, cityLights, lowQuality, isMobile, planetData?.planetId]);

  const animate = useCallback(() => {
    if (!renderer || !scene || !camera || !planetRef.current) return;

    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.y += ringSpeedRef.current * timeScale;
    }

    if (!stopOrbits) {
      planetRef.current.rotation.y += rotation * timeScale;
      if (orbit && orbitCenter) {
        updateOrbit(
          planetRef.current,
          orbit,
          timeScale,
          orbitCenter,
          0,
        );
      }
    }

    const p = planetRef.current.position;
    positionRef.current = { x: p.x, y: p.y, z: p.z };

    if (cityLightsRef.current) {
      cityLightsRef.current.material.uniforms.sunPosition.value.set(
        orbitCenter.x,
        orbitCenter.y,
        orbitCenter.z,
      );
    }

    animationFrameId.current = requestAnimationFrame(animate);
  }, [
    renderer,
    scene,
    camera,
    rotation,
    orbit,
    orbitCenter,
    stopOrbits,
    timeScale,
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
      {meshReady && name === "sun" && (
        <SunHalo size={size} parentRef={planetRef} />
      )}
      {meshReady && hasAtmosphere && name !== "sun" && (
        <>
          <PlanetAtmosphere size={size} type={type} parentRef={planetRef} />
          {planetData?.planetId && (
            <PlanetAurora
              size={size}
              parentRef={planetRef}
              planetId={planetData.planetId}
              orbitCenter={orbitCenter}
            />
          )}
        </>
      )}
      {meshReady && hasClouds && name !== "sun" && (
        <PlanetClouds
          size={size}
          parentRef={planetRef}
          timeScale={timeScale}
          stopOrbits={stopOrbits}
        />
      )}
      {moons.map((moon, i) => (
        <Moon
          key={`moon-${planetData?.planetId ?? name}-${i}`}
          moon={moon}
          planetPositionRef={positionRef}
        />
      ))}
      {hasSatellite && (
        <Satellite planetPositionRef={positionRef} planetSize={size} />
      )}
    </>
  );
};
