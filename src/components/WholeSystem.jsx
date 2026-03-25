import { use, useContext, useState, useEffect } from "react";
import { PlanetContext } from "../context/PlanetContext";
import "./styles.css";
import { Planet } from "./Planet";
import { utils } from "../utils/utils";
import { texturesArr } from "../config/config";
import * as THREE from "three";

export const System = ({ x, y, z }) => {
  const [universe, setUniverse] = useState([]);
  const { moveState, toggleFlyMode } = useContext(PlanetContext);

  const generateUniverse = () => {
    const randomTruFalse = Date.now().toLocaleString().at(-1) % 2;
    const needCustomColor = randomTruFalse === 0;
    const planetsToGenerate = +utils.randomBetween(3, 15).toFixed(0);
    const generatedUniverse = [];

    const BASE_RADIUS = 50; // rayon du premier cercle
    const ORBIT_GAP = 20; // distance entre chaque orbite

    const MAX_SPEED = 0.006; // vitesse max (orbite interne)
    const MIN_SPEED = 0.0001; // vitesse min (orbite externe)

    for (let index = 0; index < planetsToGenerate; index++) {
      const size = utils.randomBetween(0.5, 4);
      const texture = utils.getRandomElement(texturesArr);

      const orbitRadius = BASE_RADIUS + index * ORBIT_GAP;
      const angle = Math.random() * Math.PI * 1;

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

      generatedUniverse.push(planetSettings);
    }

    const howManyNeedRing = utils.randomBetween(
      0,
      generatedUniverse.length / 3,
    );

    for (let index = 0; index < howManyNeedRing; index++) {
      const randomIndex = Math.floor(Math.random() * generatedUniverse.length);
      generatedUniverse[randomIndex].hasRing = true;
    }

    // setUniverse(generatedUniverse);
    return generatedUniverse;
  };
  useEffect(() => {
    const universe = generateUniverse();
    setUniverse(universe);
  }, []);

  return (
    <>
      {universe?.map((p) => (
        <Planet
          key={p.name}
          name={p.name}
          position={{
            x: p.x + x,
            y: p.y + y,
            z: p.z + z,
          }}
          orbitCenter={{ x, y, z }}
          rotation={p.rotation}
          size={p.size}
          texture={p.texture}
          color={p.color}
          orbit={p.orbit}
          hasRing={p.hasRing}
        />
      ))}

      <Planet
        name="sun"
        position={{ x, y, z }}
        rotation={utils.randomBetween(-0.005, 0.005)}
        size={utils.randomBetween(10, 40)}
        texture="sun"
      />
    </>
  );
};
