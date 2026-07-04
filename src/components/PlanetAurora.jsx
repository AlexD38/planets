import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";

function disposeMesh(mesh) {
  if (!mesh) return;
  mesh.geometry?.dispose();
  mesh.material?.dispose();
}

export const PlanetAurora = ({ size, parentRef, planetId, orbitCenter }) => {
  const { auroraPlanetId } = useContext(PlanetContext);
  const meshRef = useRef(null);
  const intensityRef = useRef(0);
  const planetIdRef = useRef(planetId);
  const auroraIdRef = useRef(auroraPlanetId);

  planetIdRef.current = planetId;
  auroraIdRef.current = auroraPlanetId;

  useEffect(() => {
    if (!parentRef.current) return;

    const geometry = new THREE.SphereGeometry(size * 1.04, 48, 48);
    const sunPosition = new THREE.Vector3(
      orbitCenter?.x ?? 0,
      orbitCenter?.y ?? 0,
      orbitCenter?.z ?? 0,
    );

    const material = new THREE.ShaderMaterial({
      uniforms: {
        sunPosition: { value: sunPosition },
        intensity: { value: 0 },
        auroraColor: { value: new THREE.Color(0x44ff88) },
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
        uniform float intensity;
        uniform vec3 auroraColor;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPos;
        void main() {
          if (intensity < 0.01) discard;
          vec3 toSun = normalize(sunPosition - vWorldPos);
          float nightSide = 1.0 - smoothstep(-0.15, 0.1, dot(vWorldNormal, toSun));
          float pole = pow(abs(vWorldNormal.y), 2.5);
          float bands = sin(vWorldPos.x * 3.0 + vWorldPos.z * 2.0) * 0.5 + 0.5;
          float alpha = nightSide * pole * bands * intensity * 0.55;
          if (alpha < 0.01) discard;
          gl_FragColor = vec4(auroraColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.FrontSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    meshRef.current = mesh;
    parentRef.current.add(mesh);

    let frameId;
    const animate = () => {
      if (meshRef.current) {
        const target = auroraIdRef.current === planetIdRef.current ? 1 : 0;
        intensityRef.current += (target - intensityRef.current) * 0.03;
        meshRef.current.material.uniforms.intensity.value = intensityRef.current;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      parentRef.current?.remove(mesh);
      disposeMesh(mesh);
      meshRef.current = null;
    };
  }, [parentRef, size, orbitCenter]);

  return null;
};
