import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { getAtmosphereColor } from "../utils/planetVisuals";

function disposeMesh(mesh) {
  if (!mesh) return;
  mesh.geometry?.dispose();
  mesh.material?.dispose();
}

export const PlanetAtmosphere = ({ size, type, parentRef }) => {
  const { scene } = useContext(PlanetContext);
  const atmosphereRef = useRef(null);

  useEffect(() => {
    if (!scene || !parentRef.current) return;

    const atmosphereSize = size * 1.05;
    const parent = parentRef.current;

    const geometry = new THREE.SphereGeometry(atmosphereSize, 32, 32);
    const atmosphereColor = new THREE.Color(getAtmosphereColor(type));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        atmosphereColor: { value: atmosphereColor },
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec4 worldPos = modelMatrix * vec4(position, 1.0);
          vViewDir = normalize(cameraPosition - worldPos.xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 atmosphereColor;
        varying vec3 vNormal;
        varying vec3 vViewDir;
        void main() {
          float intensity = pow(1.0 - abs(dot(vNormal, vViewDir)), 3.0);
          gl_FragColor = vec4(atmosphereColor, intensity * 0.6);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const mesh = new THREE.Mesh(geometry, material);
    atmosphereRef.current = mesh;
    parent.add(mesh);

    return () => {
      parent?.remove(mesh);
      disposeMesh(mesh);
      atmosphereRef.current = null;
    };
  }, [scene, size, type, parentRef]);

  return null;
};
