import { useContext, useEffect, useState, useRef } from "react";
import { PlanetContext } from "../context/PlanetContext";
import * as THREE from "three";

export const Planet = () => {
  const { planetInfos, setPlanetObj, scene } = useContext(PlanetContext);
  const [size, setSize] = useState(5);
  const planetRef = useRef(null);

  const handlePlanetSize = (size) => {
    if (size === "xs") setSize(4);
    else if (size === "s") setSize(4.5);
    else if (size === "m") setSize(5);
    else if (size === "l") setSize(5.5);
    else if (size === "xl") setSize(6);
    else if (size === "xxl") setSize(7);
  };

  useEffect(() => {
    if (planetInfos?.size) {
      handlePlanetSize(planetInfos.size);
    }
  }, [planetInfos]);

  useEffect(() => {
    if (scene) {
      if (!planetRef.current) {
        const planetGeometry = new THREE.SphereGeometry(size, 64, 64);
        const textureLoader = new THREE.TextureLoader();
        const nebTexture = textureLoader.load(
          "/textures/neb.jpg",
          (texture) => {
            const grid = 4;
            const randomX = Math.floor(Math.random() * grid);
            const randomY = Math.floor(Math.random() * grid);
            texture.repeat.set(1 / grid, 1 / grid);
            texture.offset.set(randomX / grid, randomY / grid);
          }
        );
        const planetMaterial = new THREE.MeshStandardMaterial({
          map: nebTexture,
        });
        const planet = new THREE.Mesh(planetGeometry, planetMaterial);
        planetRef.current = planet;
        setPlanetObj(planet);
        scene.add(planet);
      } else {
        planetRef.current.geometry.dispose();
        planetRef.current.geometry = new THREE.SphereGeometry(size, 64, 64);
      }
    }
  }, [scene, size, setPlanetObj]);

  return null;
};
