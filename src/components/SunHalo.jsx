import { useContext, useEffect } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { enableBloomLayer } from "../utils/bloomLayer";

function disposeMesh(mesh) {
  if (!mesh) return;
  mesh.geometry?.dispose();
  mesh.material?.dispose();
}

export const SunHalo = ({ size, parentRef }) => {
  const { scene } = useContext(PlanetContext);

  useEffect(() => {
    if (!scene || !parentRef.current) return;

    const parent = parentRef.current;
    const geometry = new THREE.SphereGeometry(size * 1.4, 32, 32);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(0xffaa44) },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(glowColor, intensity * 0.5);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(geometry, material);
    enableBloomLayer(mesh);
    parent.add(mesh);

    return () => {
      parent?.remove(mesh);
      disposeMesh(mesh);
    };
  }, [scene, size, parentRef]);

  return null;
};
