import { utils } from "../utils/utils";

export const universe = [
  {
    name: utils.generatePlanetInfos()?.name,
    rotation: utils.randomBetween(-0.01, 0.005),
    x: utils.randomBetween(-20, 20),
    y: utils.randomBetween(-20, 20),
    z: utils.randomBetween(-20, 20),
  },
  {
    name: utils.generatePlanetInfos()?.name,
    rotation: utils.randomBetween(-0.01, 0.005),
    x: utils.randomBetween(-20, 20),
    y: utils.randomBetween(-20, 20),
    z: utils.randomBetween(-20, 20),
  },
  {
    name: utils.generatePlanetInfos()?.name,
    rotation: utils.randomBetween(-0.01, 0.005),
    x: utils.randomBetween(-20, 20),
    y: utils.randomBetween(-20, 20),
    z: utils.randomBetween(-20, 20),
  },
];
