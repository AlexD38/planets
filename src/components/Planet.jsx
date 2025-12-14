import { useContext, useEffect, useState } from "react";
import { PlanetContext } from "../context/PlanetContext";
import * as THREE from "three";

export const Planet = ({ scene }) => {
  const { planetInfos, setPlanetObj } = useContext(PlanetContext);
  const [size, setsize] = useState(5);

  useEffect(() => {
    // --- PLANÈTE ---

    if (planetInfos?.size) {
      if (planetInfos.size == "xs") {
        setsize(2);
      }
      if (planetInfos.size == "s") {
        setsize(3);
      }
      if (planetInfos.size == "m") {
        setsize(5);
      }
      if (planetInfos.size == "l") {
        setsize(7);
      }
      if (planetInfos.size == "xl") {
        setsize(8.5);
      }
      if (planetInfos.size == "xxl") {
        setsize(10);
      }
    }
    const planetGeometry = new THREE.SphereGeometry(size, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    const nebTexture = textureLoader.load("/textures/neb.jpg", (texture) => {
      const grid = 4; // 4x4 grid
      const randomX = Math.floor(Math.random() * grid);
      const randomY = Math.floor(Math.random() * grid);

      texture.repeat.set(1 / grid, 1 / grid);
      texture.offset.set(randomX / grid, randomY / grid);
    });
    const planetMaterial = new THREE.MeshStandardMaterial({
      map: nebTexture,
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    setPlanetObj(planet);
    scene.add(planet);
  }, [scene, planetInfos]);
  return <></>;
};
