import { useContext, useEffect, useRef } from "react";
import { PlanetContext } from "../context/PlanetContext";
import * as THREE from "three";
import { utils } from "../utils/utils";

function disposePoints(points) {
  if (!points) return;
  points.geometry?.dispose();
  if (points.material) {
    if (points.material.map) points.material.map.dispose();
    points.material.dispose();
  }
}

export const Stars = () => {
  const {
    setStars1,
    setStars2,
    setStars3,
    setStars4,
    setStars5,
    setMoons,
    setMoons6,
    scene,
  } = useContext(PlanetContext);
  const objectsRef = useRef([]);

  useEffect(() => {
    if (!scene || objectsRef.current.length > 0) return;

    const starCount = 2000;
    const starCount2 = 250;
    const starCount3 = 15;
    const starCount4 = 8;
    const starCount5 = 10;
    const moonsCount5 = Math.floor(utils.randomBetween(0, 2));
    const moonsCount6 = Math.floor(utils.randomBetween(0, 1));

    const createPositions = (count, spread = 1000) => {
      const positions = [];
      for (let i = 0; i < count; i++) {
        positions.push(
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
          (Math.random() - 0.5) * spread,
        );
      }
      return positions;
    };

    const createOrbitPositions = (count, radius) => {
      const positions = [];
      for (let i = 0; i < count; i++) {
        const angle = count > 0 ? (i / count) * Math.PI * 2 : 0;
        positions.push(
          Math.cos(angle) * radius,
          (Math.random() - 0.5) * 2,
          Math.sin(angle) * radius,
        );
      }
      return positions;
    };

    const starGeometry = new THREE.BufferGeometry();
    starGeometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(createPositions(starCount), 3),
    );

    const starGeometry2 = new THREE.BufferGeometry();
    starGeometry2.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(createPositions(starCount2), 3),
    );

    const starGeometry3 = new THREE.BufferGeometry();
    starGeometry3.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(createPositions(starCount3), 3),
    );

    const starGeometry4 = new THREE.BufferGeometry();
    starGeometry4.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(createPositions(starCount4), 3),
    );

    const starGeometry5 = new THREE.BufferGeometry();
    starGeometry5.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(createPositions(starCount5), 3),
    );

    const moonsGeometry5 = new THREE.BufferGeometry();
    moonsGeometry5.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(createOrbitPositions(moonsCount5, 100), 3),
    );

    const moonsGeometry6 = new THREE.BufferGeometry();
    moonsGeometry6.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(createOrbitPositions(moonsCount6, 50), 3),
    );

    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      sizeAttenuation: false,
    });
    const starMaterial2 = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      sizeAttenuation: false,
    });
    const starMaterial3 = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: false,
    });

    const starTexture = new THREE.TextureLoader().load("/textures/sun_big.png");
    const moonTexture = new THREE.TextureLoader().load("/textures/sun.png");

    starTexture.flipY = false;

    const starMaterial4 = new THREE.PointsMaterial({
      map: starTexture,
      color: 0xffffff,
      size: 3.5,
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const starMaterial5 = new THREE.PointsMaterial({
      map: starTexture,
      color: 0xffffff,
      size: 6,
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const moonsMaterial5 = new THREE.PointsMaterial({
      map: moonTexture,
      color: 0xffffff,
      size: utils.randomBetween(3, 8),
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const moonsMaterial6 = new THREE.PointsMaterial({
      map: moonTexture,
      color: 0xffffff,
      size: utils.randomBetween(2, 10),
      transparent: true,
      alphaTest: 0.01,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    const stars2 = new THREE.Points(starGeometry2, starMaterial2);
    const stars3 = new THREE.Points(starGeometry3, starMaterial3);
    const stars4 = new THREE.Points(starGeometry4, starMaterial4);
    const stars5 = new THREE.Points(starGeometry5, starMaterial5);
    const moons = new THREE.Points(moonsGeometry5, moonsMaterial5);
    const moons6 = new THREE.Points(moonsGeometry6, moonsMaterial6);

    const allObjects = [stars, stars2, stars3, stars4, stars5, moons, moons6];
    objectsRef.current = allObjects;

    setStars1(stars);
    setStars2(stars2);
    setStars3(stars3);
    setStars4(stars4);
    setStars5(stars5);
    setMoons(moons);
    setMoons6(moons6);

    scene.add(...allObjects);

    return () => {
      allObjects.forEach((obj) => {
        scene.remove(obj);
        disposePoints(obj);
      });
      starTexture.dispose();
      moonTexture.dispose();
      objectsRef.current = [];
    };
  }, [
    scene,
    setStars1,
    setStars2,
    setStars3,
    setStars4,
    setStars5,
    setMoons,
    setMoons6,
  ]);

  return null;
};
