import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { PlanetContext } from "../context/PlanetContext";
import * as THREE from "three";
import { utils } from "../utils/utils";
import { texturesArr } from "../config/config";

export const Planet = ({
  position,
  name,
  rotation,
  size,
  texture,
  color,
  orbit,
  hasRing,
}) => {
  const {
    planetInfos,
    setPlanetObj,
    planetObj,
    scene,
    planetObj2,
    setPlanetObj2,
    renderer,
    camera,
  } = useContext(PlanetContext);
  const animationFrameId = useRef();

  const planetRef = useRef(null);
  const ringGroupRef = useRef(null);
  const [planet, setPlanet] = useState(null);

  useEffect(() => {
    if (scene) {
      if (!planetRef.current) {
        const planetGeometry = new THREE.SphereGeometry(size, 64, 64);
        const textureLoader = new THREE.TextureLoader();

        const nebTexture = textureLoader.load(`/hd/${texture}.jpg`);
        const options = {
          map: nebTexture,
          color: color || 0xffffff,
        };
        if (name == "sun") {
          options.emissive = 0xffffaa; // couleur lumineuse
          options.emissiveMap = nebTexture; // couleur lumineuse
          options.emissiveIntensity = utils.randomBetween(0.5, 5);
        }
        const planetMaterial = new THREE.MeshStandardMaterial(options);
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);

        if (hasRing) {
          const innerDodecahedronGroup = new THREE.Group();

          for (let i = 0; i < 900; i++) {
            const dodecahedronGeometry = new THREE.DodecahedronGeometry(
              utils.randomBetween(0.01, 0.09),
              0
            );

            const dodecahedronMaterial = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 0.8,
              roughness: 1,
            });
            const dodecahedron = new THREE.Mesh(
              dodecahedronGeometry,
              dodecahedronMaterial
            );

            const angle = (i / 900) * Math.PI * 2;
            let radius = size + 0.5 + Math.random() * 2;

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 0.2; // small random height

            dodecahedron.position.set(x, y, z);
            innerDodecahedronGroup.add(dodecahedron);
          }
          for (let i = 0; i < 200; i++) {
            const dodecahedronGeometry = new THREE.DodecahedronGeometry(
              utils.randomBetween(0.01, 0.09),
              0
            );

            const dodecahedronMaterial = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 0.8,
              roughness: 1,
            });
            const dodecahedron = new THREE.Mesh(
              dodecahedronGeometry,
              dodecahedronMaterial
            );

            const angle = (i / 200) * Math.PI * 2;
            let radius = size + 0.5 + Math.random() * 3;

            if (i % 2 == 0) {
              radius = radius * 1;
            }

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 0.2; // small random height

            dodecahedron.position.set(x, y, z);
            innerDodecahedronGroup.add(dodecahedron);
          }
          for (let i = 0; i < 200; i++) {
            const dodecahedronGeometry = new THREE.DodecahedronGeometry(
              utils.randomBetween(0.01, 0.09),
              0
            );

            const dodecahedronMaterial = new THREE.MeshStandardMaterial({
              color: 0xffffff,
              metalness: 0.8,
              roughness: 1,
            });
            const dodecahedron = new THREE.Mesh(
              dodecahedronGeometry,
              dodecahedronMaterial
            );

            const angle = (i / 100) * Math.PI * 2;
            let radius = size + 0.5 + Math.random() * 6;

            if (i % 2 == 0) {
              radius = radius * 1.2;
            }

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 0.2; // small random height

            dodecahedron.position.set(x, y, z);
            innerDodecahedronGroup.add(dodecahedron);
          }
          innerDodecahedronGroup.rotation.y = 1.7; // Tilt the whole group
          ringGroupRef.current = innerDodecahedronGroup;
          planet.add(innerDodecahedronGroup);
        }
        planetRef.current = planet;
        if (position) {
          planet.position.set(position.x, position.y, position.z);
        }
        if (name !== "planet") {
          setPlanetObj2(planet);
        } else {
          setPlanetObj(planet);
        }
        setPlanet(planet);
        scene.add(planet);
      } else {
        planetRef.current.geometry.dispose();
        planetRef.current.geometry = new THREE.SphereGeometry(size, 64, 64);
      }
    }
  }, [scene, size, setPlanetObj, setPlanetObj2]);
  function updateOrbit(mesh, orbit, delta) {
    if (orbit?.angle) orbit.angle += orbit.speed * delta;

    if (orbit?.radius) {
      const x = orbit.radius * Math.cos(orbit.angle);
      const z = orbit.radius * Math.sin(orbit.angle);
      mesh.position.set(x, 0, z);
      // rotation propre de la planète
      mesh.rotation.y += rotation;
      // inclinaison du plan orbital (optionnelle)
      mesh.rotation.z = orbit.inclination;
    }
  }
  const animate = useCallback(() => {
    if (!renderer || !scene || !camera) {
      return;
    }

    if (ringGroupRef.current) {
      ringGroupRef.current.rotation.y += utils.randomBetween(0.001, 0.005);
    }

    const time = Date.now();

    // planetRef.current.rotation.y = time * rotation;
    planetRef.current.rotation.y += rotation;
    updateOrbit(planetRef.current, orbit, 1);
    // planet.rotation.x += 0.01; // bascule
    // planet.rotation.y += 0.01; // spin
    // planet.rotation.z += 0.01; // roulis

    // renderer.render(scene, camera);
    animationFrameId.current = requestAnimationFrame(animate);
  }, [renderer, scene, camera, planetObj]);
  useEffect(() => {
    animationFrameId.current = requestAnimationFrame(animate);
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [animate]);

  return null;
};
