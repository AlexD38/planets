import { configPlanetInfos } from "../config/config";
import * as rng from "./seededRandom";

export const utils = {
  generatePlanetInfos() {
    const newPlanet = {};

    for (const key in configPlanetInfos) {
      if (key === "temperatureRanges" || key === "type") continue;

      let newInfos = this.getRandomElement(configPlanetInfos[key]);

      if (key === "name") {
        const useAdditionalName = Math.floor(rng.random() * 2) === 0;
        const suffix = `${this.getRandomElement(configPlanetInfos.letters)}-${Math.floor(rng.random() * 1000)}`;
        newInfos = useAdditionalName
          ? `${newInfos} ${this.getRandomElement(configPlanetInfos.additionalName)}`
          : `${newInfos} ${suffix}`;
      }

      newPlanet[key] = newInfos;
    }

    const range = this.getRandomElement(configPlanetInfos.temperatureRanges);
    newPlanet.type = Object.keys(range)[0];
    const [min, max] = Object.values(range)[0];
    newPlanet.temperature = this.randomBetween(min, max);

    return newPlanet;
  },
  getRandomElement(array) {
    if (!Array.isArray(array) || array.length === 0) {
      throw new Error("Le paramètre doit être un tableau non vide");
    }

    const randomIndex = Math.floor(rng.random() * array.length);
    return array[randomIndex];
  },
  getRandomHexColor() {
    return Math.floor(rng.random() * 0x1000000);
  },
  getRandomLightPosition() {
    const x = (rng.random() - 0.5) * 100;
    const y = rng.random() * 50 + 10;
    const z = (rng.random() - 0.5) * 100;
    return { x, y, z };
  },
  randomBetween(min, max) {
    return +(rng.random() * (max - min) + min).toFixed(3);
  },
  distance3D(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  },
  analyzeUniverse(universe) {
    let inhabitedPlanetCount = 0;

    for (const planet of universe) {
      if (planet.intelligenceFormsDetected) inhabitedPlanetCount++;
    }

    const analyze = {
      name: universe[0]?.name ?? "Unknown System",
      numberOfPlanets: universe.length,
      planetTypes: [...new Set(universe.map((x) => x.type).filter(Boolean))],
      lifeDetected: inhabitedPlanetCount > 0,
      infos: `At least ${inhabitedPlanetCount} planet${
        inhabitedPlanetCount > 1 ? "s" : ""
      } of this system is inhabited by intelligent life form`,
    };

    const randomCommentsNeeded = Math.floor(utils.randomBetween(1, 3));
    const randomComments = new Set();

    for (let index = 0; index < randomCommentsNeeded; index++) {
      randomComments.add(utils.getRandomElement(configPlanetInfos.comments));
    }

    analyze.comments = Array.from(randomComments);

    if (!analyze.lifeDetected) {
      delete analyze.infos;
    }
    return analyze;
  },
};
