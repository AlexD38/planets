import { createContext, useState, useEffect } from "react";
import { utils } from "../utils/utils";
import { texturesArr } from "../config/config";
import * as THREE from "three";

export const PlanetContext = createContext();

export const PlanetProvider = ({ children }) => {
  const [planetInfos, setPlanetInfos] = useState(null);
  const [planetObj, setPlanetObj] = useState(null);
  const [planetObj2, setPlanetObj2] = useState(null);
  const [planetSize, setPlanetSize] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [scene, setScene] = useState(null);
  const [stars1, setStars1] = useState(null);
  const [stars2, setStars2] = useState(null);
  const [stars3, setStars3] = useState(null);
  const [stars4, setStars4] = useState(null);
  const [stars5, setStars5] = useState(null);
  const [moons, setMoons] = useState(null);
  const [moons6, setMoons6] = useState(null);
  const [starsNeb, setStarsNeb] = useState(null);
  const [camera, setCamera] = useState(null);
  const [renderer, setRenderer] = useState(null);
  const [universe, setUniverse] = useState(null);
  const [systemInfos, setSystemInfos] = useState(null);

  useEffect(() => {
    const randomTruFalse = Date.now().toLocaleString().at(-1) % 2;
    const needCustomColor = null;
    const planetsToGenerate = +utils.randomBetween(2, 5).toFixed(0);
    const generatedUniverse = [];

    const BASE_RADIUS = 15; // rayon du premier cercle
    const ORBIT_GAP = 25; // distance entre chaque orbite

    const MAX_SPEED = 0.006; // vitesse max (orbite interne)
    const MIN_SPEED = 0.0001; // vitesse min (orbite externe)

    let canHaveRing = true;

    for (let index = 0; index < planetsToGenerate; index++) {
      const size = utils.randomBetween(0.5, 4);
      const texture = utils.getRandomElement(texturesArr);

      const orbitRadius = BASE_RADIUS + index * ORBIT_GAP;
      const angle = Math.random() * Math.PI * 2;

      // facteur de distance normalisé (0 → proche, 1 → loin)
      const t = index / Math.max(1, planetsToGenerate - 1);

      // interpolation inverse : proche = rapide, loin = lent
      const speed = THREE.MathUtils.lerp(MAX_SPEED, MIN_SPEED, t);
      const generatedPlanet = utils.generatePlanetInfos();

      const planetSettings = {
        name: generatedPlanet?.name,
        type: generatedPlanet?.type,
        intelligenceFormsDetected: generatedPlanet?.intelligenceFormsDetected,
        rotation: utils.randomBetween(-0.005, 0.005),

        x: orbitRadius * Math.cos(angle),
        y: 0,
        z: orbitRadius * Math.sin(angle),

        size,
        texture: texture,
        color: needCustomColor ? utils.getRandomHexColor() : 0xffffff,

        orbit: {
          angle,
          speed,
          radius: orbitRadius,
          inclination: utils.randomBetween(-0.2, 0.2),
        },
      };

      if (randomTruFalse && canHaveRing) {
        planetSettings.hasRing = true;
        canHaveRing = false;
      }

      generatedUniverse.push(planetSettings);
    }

    setUniverse(generatedUniverse);
    const analyze = utils.analyzeUniverse(generatedUniverse);
    setSystemInfos(analyze);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const generateNewPlanet = () => {
    const newPlanet = utils.generatePlanetInfos();
    setPlanetInfos(newPlanet);
    setPlanetSize(newPlanet?.size);
  };

  useEffect(() => {
    generateNewPlanet();
  }, []);

  return (
    <PlanetContext.Provider
      value={{
        planetInfos,
        generateNewPlanet,
        planetSize,
        setPlanetSize,
        isMobile,
        scene,
        setScene,
        planetObj,
        setPlanetObj,
        planetObj2,
        setPlanetObj2,
        stars1,
        setStars1,
        stars2,
        setStars2,
        stars3,
        setStars3,
        stars4,
        setStars4,
        stars5,
        setStars5,
        camera,
        setCamera,
        renderer,
        setRenderer,
        moons,
        setMoons,
        moons6,
        setMoons6,
        starsNeb,
        setStarsNeb,
        universe,
        systemInfos,
      }}
    >
      {children}
    </PlanetContext.Provider>
  );
};
