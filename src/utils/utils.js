import { split } from "three/tsl";
import { configPlanetInfos } from "../config/config";

export const utils = {
  generatePlanetInfos() {
    const newPlanet = {};
    const NeedAdditionalName = Date.now().toLocaleString().at(-1) % 2;
    for (const key in configPlanetInfos) {
      let newInfos = this.getRandomElement(configPlanetInfos[key]);

      if (key === "temperatureRanges") {
        const range = this.getRandomElement(
          configPlanetInfos.temperatureRanges
        );

        newPlanet.type = Object.keys(range)[0];
        const rangeValues = Object.values(range);
        const [min, max] = rangeValues[0];
        newPlanet.temperature = this.randomBetween(min, max);
      }

      if (key === "name") {
        newInfos = `${newInfos} ${this.getRandomElement(
          configPlanetInfos.letters
        )}-${Math.random(0, 1000).toFixed(
          this.getRandomElement(configPlanetInfos.numbers)
        )}`.replace(".", "");
      }

      newPlanet[key] = newInfos;
    }
    return newPlanet;
  },
  getRandomElement(array) {
    if (!Array.isArray(array) || array.length === 0) {
      throw new Error("Le paramètre doit être un tableau non vide");
    }

    const randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
  },
  getRandomHexColor() {
    return Math.floor(Math.random() * 0x1000000);
  },
  getRandomLightPosition() {
    const x = (Math.random() - 0.5) * 100; // entre -50 et 50
    const y = Math.random() * 50 + 10; // entre 10 et 60 pour être au-dessus
    const z = (Math.random() - 0.5) * 100; // entre -50 et 50
    return { x, y, z };
  },
  randomBetween(min, max) {
    const result = Math.floor(Math.random() * (max - min + 1)) + min;
    return result;
  },
};
