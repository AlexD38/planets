import { utils } from "../utils/utils";

export const universe = [
  {
    name: utils.generatePlanetInfos()?.name,
    rotation: utils.randomBetween(-0.01, 0.005),
    x: utils.randomBetween(-0, 0),
    y: utils.randomBetween(-0, 0),
    z: utils.randomBetween(-0, 0),
    size: utils.randomBetween(2, 6),
  },
  {
    name: utils.generatePlanetInfos()?.name,
    rotation: utils.randomBetween(-0.01, 0.005),
    x: utils.randomBetween(-20, 20),
    y: utils.randomBetween(0, 0),
    z: utils.randomBetween(0, 20),
    size: utils.randomBetween(2, 6),
  },
  {
    name: utils.generatePlanetInfos()?.name,
    rotation: utils.randomBetween(-0.01, 0.005),
    x: utils.randomBetween(-20, 20),
    y: utils.randomBetween(0, 0),
    z: utils.randomBetween(0, 20),
    size: utils.randomBetween(2, 6),
  },
];
