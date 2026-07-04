import { useContext, useEffect, useRef } from "react";
import * as THREE from "three";
import { PlanetContext } from "../context/PlanetContext";
import { utils } from "../utils/utils";

function disposeInstanced(mesh) {
  if (!mesh) return;
  mesh.geometry?.dispose();
  mesh.material?.dispose();
}

export const AsteroidBelt = ({ belt, orbitCenter }) => {
  const { scene, timeScale, stopOrbits, isMobile, lowQuality } =
    useContext(PlanetContext);
  const beltRef = useRef(null);
  const angleRef = useRef(0);

  useEffect(() => {
    if (!scene || !belt) return;

    const count = lowQuality || isMobile
      ? Math.floor(belt.count * 0.25)
      : Math.floor(belt.count * 0.6);
    const geometry = new THREE.DodecahedronGeometry(0.15, 0);
    const material = new THREE.MeshStandardMaterial({
      color: 0x888877,
      roughness: 1,
      metalness: 0.1,
    });
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    const dummy = new THREE.Object3D();

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = utils.randomBetween(belt.innerRadius, belt.outerRadius);
      dummy.position.set(
        orbitCenter.x + Math.cos(angle) * radius,
        orbitCenter.y + (Math.random() - 0.5) * 3,
        orbitCenter.z + Math.sin(angle) * radius,
      );
      dummy.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI,
      );
      const scale = utils.randomBetween(0.3, 1.2);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    beltRef.current = mesh;
    scene.add(mesh);

    let frameId;
    const animate = () => {
      if (!stopOrbits && beltRef.current) {
        angleRef.current += 0.00005 * timeScale;
        beltRef.current.rotation.y = angleRef.current;
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      scene.remove(mesh);
      disposeInstanced(mesh);
      beltRef.current = null;
    };
  }, [scene, belt, orbitCenter, timeScale, stopOrbits, isMobile, lowQuality]);

  return null;
};
