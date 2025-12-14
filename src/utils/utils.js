import { configPlanetInfos } from "../config/config";

export const utils = {
  generatePlanetInfos() {
    const newPlanet = {};
    for (const key in configPlanetInfos) {
      const newInfos = this.getRandomElement(configPlanetInfos[key]);
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
};
