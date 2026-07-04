import * as THREE from "three";
import { texturesArr } from "../config/config";
import { utils } from "./utils";
import * as rng from "./seededRandom";
import {
  generateMoonsForPlanet,
  getPlanetVisualFlags,
} from "./planetVisuals";

export const SYSTEM_POSITIONS = [{ x: 0, y: 0, z: 0 }];

function generateComets(count = 2) {
  return Array.from({ length: count }).map(() => ({
    semiMajorAxis: utils.randomBetween(180, 350),
    eccentricity: utils.randomBetween(0.6, 0.92),
    angle: rng.random() * Math.PI * 2,
    speed: utils.randomBetween(0.0003, 0.001),
    inclination: utils.randomBetween(-0.3, 0.3),
    nucleusSize: utils.randomBetween(0.3, 0.8),
  }));
}

function generateAsteroidBelt(planets) {
  if (planets.length < 4) return null;

  const mid = Math.floor(planets.length / 2);
  const inner = planets[mid - 1]?.orbit?.radius ?? 70;
  const outer = planets[mid]?.orbit?.radius ?? 90;

  return {
    innerRadius: inner + 5,
    outerRadius: outer - 5,
    count: Math.floor(utils.randomBetween(600, 1200)),
  };
}

function pickStellarType() {
  return rng.random() < 0.08 ? "binary" : "single";
}

export function generateSystemExtras(planets) {
  const cometCount = Math.floor(utils.randomBetween(1, 2));
  return {
    asteroidBelt: generateAsteroidBelt(planets),
    comets: generateComets(cometCount),
    stellarType: pickStellarType(),
  };
}

export function generateUniverse({
  baseRadius = 50,
  orbitGap = 20,
  minPlanets = 3,
  maxPlanets = 15,
} = {}) {
  const needCustomColor = Math.floor(rng.random() * 2) === 0;
  const planetsToGenerate = Math.floor(utils.randomBetween(minPlanets, maxPlanets));
  const generatedUniverse = [];

  const MAX_SPEED = 0.006;
  const MIN_SPEED = 0.0001;

  for (let index = 0; index < planetsToGenerate; index++) {
    const size = utils.randomBetween(0.5, 4);
    const texture = utils.getRandomElement(texturesArr);
    const orbitRadius = baseRadius + index * orbitGap;
    const angle = rng.random() * Math.PI * 2;
    const t = index / Math.max(1, planetsToGenerate - 1);
    const speed = THREE.MathUtils.lerp(MAX_SPEED, MIN_SPEED, t);
    const planetInfo = utils.generatePlanetInfos();
    const visualFlags = getPlanetVisualFlags(planetInfo);
    const planetId = `planet-${index}-${planetInfo.name}`;

    generatedUniverse.push({
      ...planetInfo,
      planetId,
      rotation: utils.randomBetween(-0.005, 0.005),
      x: orbitRadius * Math.cos(angle),
      y: 0,
      z: orbitRadius * Math.sin(angle),
      size,
      texture,
      color: needCustomColor ? utils.getRandomHexColor() : 0xffffff,
      orbit: {
        angle,
        speed,
        radius: orbitRadius,
        inclination: utils.randomBetween(-0.2, 0.2),
      },
      moons: generateMoonsForPlanet(size),
      hasAtmosphere: visualFlags.hasAtmosphere,
      hasClouds: visualFlags.hasClouds,
      cityLights: visualFlags.cityLights,
      hasSatellite: Boolean(planetInfo.inhabited),
    });
  }

  const howManyNeedRing = Math.floor(
    utils.randomBetween(0, generatedUniverse.length / 3),
  );

  for (let index = 0; index < howManyNeedRing; index++) {
    const randomIndex = Math.floor(rng.random() * generatedUniverse.length);
    generatedUniverse[randomIndex].hasRing = true;
  }

  return generatedUniverse;
}

export function createPlanet({
  orbitRadius,
  index = 0,
  needCustomColor = false,
} = {}) {
  const size = utils.randomBetween(0.5, 4);
  const texture = utils.getRandomElement(texturesArr);
  const angle = rng.random() * Math.PI * 2;
  const speed = THREE.MathUtils.lerp(0.006, 0.0001, index / 20);
  const planetInfo = utils.generatePlanetInfos();
  const visualFlags = getPlanetVisualFlags(planetInfo);
  const planetId = `planet-${Date.now()}-${planetInfo.name}`;

  return {
    ...planetInfo,
    planetId,
    rotation: utils.randomBetween(-0.005, 0.005),
    x: orbitRadius * Math.cos(angle),
    y: 0,
    z: orbitRadius * Math.sin(angle),
    size,
    texture,
    color: needCustomColor ? utils.getRandomHexColor() : 0xffffff,
    orbit: {
      angle,
      speed,
      radius: orbitRadius,
      inclination: utils.randomBetween(-0.2, 0.2),
    },
    moons: generateMoonsForPlanet(size),
    hasAtmosphere: visualFlags.hasAtmosphere,
    hasClouds: visualFlags.hasClouds,
    cityLights: visualFlags.cityLights,
    hasSatellite: Boolean(planetInfo.inhabited),
    hasRing: rng.random() < 0.25,
  };
}

export function aggregateSystems(systems) {
  const allPlanets = systems.flat();
  if (allPlanets.length === 0) return null;
  return utils.analyzeUniverse(allPlanets);
}
