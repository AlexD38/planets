import { useContext, useEffect, useState, useRef, useCallback } from "react";
import { PlanetContext } from "../context/PlanetContext";
import * as THREE from "three";
import { utils } from "../utils/utils";
import { texturesArr } from "../config/config";

export const Planet = ({ position, name, rotation, size, texture }) => {
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
  const [planet, setPlanet] = useState(null);

  useEffect(() => {
    if (scene) {
      if (!planetRef.current) {
        const planetGeometry = new THREE.SphereGeometry(size, 64, 64);
        const textureLoader = new THREE.TextureLoader();

        const nebTexture = textureLoader.load(`/hd/${texture}.jpg`);
        const planetMaterial = new THREE.MeshStandardMaterial({
          map: nebTexture,
          color: utils.getRandomHexColor(),
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
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
  const animate = useCallback(() => {
    if (!renderer || !scene || !camera) {
      return;
    }

    const time = Date.now();

    // planetRef.current.rotation.y = time * rotation;
    planetRef.current.rotation.y += rotation;
    // planet.rotation.x += 0.01; // bascule
    // planet.rotation.y += 0.01; // spin
    // planet.rotation.z += 0.01; // roulis

    renderer.render(scene, camera);
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
