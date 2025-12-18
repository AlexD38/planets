import { useContext, useEffect, useRef } from "react";
import { PlanetContext } from "../context/PlanetContext";
import * as THREE from "three";
import { utils } from "../utils/utils";

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
  const starsRef = useRef(null);

  useEffect(() => {
    if (scene && !starsRef.current) {
      // --- ÉTOILES PROCÉDURALES ---
      const starCount = 6000;
      const starCount2 = 600;
      const starCount3 = 25;
      const starCount4 = 15;
      const starCount5 = 20;
      const moonsCount5 = utils.randomBetween(0, 2);
      const moonsCount6 = utils.randomBetween(0, 1);
      const starGeometry = new THREE.BufferGeometry();
      const starGeometry2 = new THREE.BufferGeometry();
      const starGeometry3 = new THREE.BufferGeometry();
      const starGeometry4 = new THREE.BufferGeometry();
      const starGeometry5 = new THREE.BufferGeometry();
      const moonsGeometry5 = new THREE.BufferGeometry();
      const moonsGeometry6 = new THREE.BufferGeometry();
      const starPositions = [];
      const starPositions2 = [];
      const starPositions3 = [];
      const starPositions4 = [];
      const starPositions5 = [];
      const moonsPositions5 = [];
      const moonsPositions6 = [];

      for (let i = 0; i < starCount; i++) {
        starPositions.push(
          (Math.random() - 0.5) * 1000,
          (Math.random() - 0.5) * 1000,
          (Math.random() - 0.5) * 1000
        );
      }
      for (let i = 0; i < starCount2; i++) {
        starPositions2.push(
          (Math.random() - 0.5) * 1000,
          (Math.random() - 0.5) * 1000,
          (Math.random() - 0.5) * 1000
        );
      }
      for (let i = 0; i < starCount3; i++) {
        starPositions3.push(
          (Math.random() - 0.5) * 1000,
          (Math.random() - 0.5) * 1000,
          (Math.random() - 0.5) * 1000
        );
      }
      for (let i = 0; i < starCount4; i++) {
        starPositions4.push(
          (Math.random() - 0.5) * 1000,
          (Math.random() - 0.5) * 1000,
          (Math.random() - 0.5) * 1000
        );
      }
      for (let i = 0; i < starCount5; i++) {
        starPositions5.push(
          (Math.random() - 0.5) * 1000,
          (Math.random() - 0.5) * 1000,
          (Math.random() - 0.5) * 1000
        );
      }
      for (let i = 0; i < moonsCount5; i++) {
        const angle = (i / moonsCount5) * Math.PI * 2; // Répartit les 4 étoiles
        const radius = utils.randomBetween(1, 15); // Rayon de l'anneau
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * 2; // Légère variation verticale
        moonsPositions5.push(x, y, z);
      }
      for (let i = 0; i < moonsCount6; i++) {
        const angle = (i / moonsCount6) * Math.PI * 2; // Répartit les 4 étoiles
        const radius = utils.randomBetween(5, 20); // Rayon de l'anneau
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = (Math.random() - 0.5) * 2; // Légère variation verticale
        moonsPositions6.push(x, y, z);
      }

      starGeometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(starPositions, 3)
      );

      starGeometry2.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(starPositions2, 3)
      );

      starGeometry3.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(starPositions3, 3)
      );
      starGeometry4.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(starPositions4, 3)
      );
      starGeometry5.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(starPositions5, 3)
      );
      moonsGeometry5.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(moonsPositions5, 3)
      );
      moonsGeometry6.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(moonsPositions6, 3)
      );

      const starMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1,
        sizeAttenuation: false,
        blendColor: 0xffffff,
      });
      const starMaterial2 = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.5,
        sizeAttenuation: false,
        blendColor: 0xffffff,
      });
      const starMaterial3 = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 2,
        sizeAttenuation: false,
        blendColor: 0xffffff,
      });

      const starTexture = new THREE.TextureLoader().load(
        "/textures/sun_big.png"
      );
      const moonTexture = new THREE.TextureLoader().load("/textures/sun.png");

      starTexture.flipY = false;
      starTexture.premultiplyAlpha = false;
      starTexture.colorSpace = THREE.SRGBColorSpace;

      const starMaterial4 = new THREE.PointsMaterial({
        map: starTexture, // halo radial
        color: 0xffffff,
        size: 3.5,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      const starMaterial5 = new THREE.PointsMaterial({
        map: starTexture, // halo radial
        color: 0xffffff,
        size: 6,
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const moonsMaterial5 = new THREE.PointsMaterial({
        map: moonTexture, // halo radial
        color: 0xffffff,
        size: utils.randomBetween(3, 8),
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });
      const moonsMaterial6 = new THREE.PointsMaterial({
        map: moonTexture, // halo radial
        color: 0xffffff,
        size: utils.randomBetween(2, 10),
        transparent: true,
        alphaTest: 0.01,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      });

      const stars = new THREE.Points(starGeometry, starMaterial);
      starsRef.current = stars;
      const stars2 = new THREE.Points(starGeometry2, starMaterial2);
      const stars3 = new THREE.Points(starGeometry3, starMaterial3);
      const stars4 = new THREE.Points(starGeometry4, starMaterial4);
      const stars5 = new THREE.Points(starGeometry5, starMaterial5);
      const moons = new THREE.Points(moonsGeometry5, moonsMaterial5);
      const moons6 = new THREE.Points(moonsGeometry6, moonsMaterial6);

      setStars1(stars);
      setStars2(stars2);
      setStars3(stars3);
      setStars4(stars4);
      setStars5(stars5);
      setMoons(moons);
      setMoons6(moons6);

      scene.add(/*stars, stars2, */ stars3, stars4, stars5, moons, moons6);
    }
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
