import * as THREE from "three";
import { texturesArr, configPlanetInfos } from "../config/config";
import { utils } from "./utils";
import * as rng from "./seededRandom";
import {
  generateMoonsForPlanet,
  getPlanetVisualFlags,
  getPlanetSurfaceTint,
} from "./planetVisuals";

export const SYSTEM_POSITIONS = [{ x: 0, y: 0, z: 0 }];

export const SUN_SIZE_MIN = 18;
export const SUN_SIZE_MAX = 24;
export const PLANET_SIZE_MIN = 2;
export const PLANET_SIZE_MAX = 12.5;
export const ORBIT_GAP_MIN = 18;
export const ORBIT_GAP_MAX = 26;

const ASTEROID_COMPOSITIONS = ["Metallic", "Carbonaceous", "Rocky", "Icy"];
const BELT_ROTATION_SPEED = 0.00005;

function generateSunName() {
  const star = utils.getRandomElement(configPlanetInfos.name);
  const letter = utils.getRandomElement(configPlanetInfos.letters);
  const num = Math.floor(rng.random() * 900) + 100;
  return `${star} ${letter}-${num}`;
}

export function computeFirstOrbitRadius(sunSize) {
  return sunSize * 3.6 + utils.randomBetween(28, 42);
}

function generateComets(planets, sunSize) {
  const outerRadius =
    planets.reduce((max, p) => Math.max(max, p.orbit?.radius ?? 0), 120) + 80;
  const count = Math.floor(utils.randomBetween(1, 3));

  return Array.from({ length: count }).map((_, index) => {
    const theta = rng.random() * Math.PI * 2;
    const pitch = utils.randomBetween(-0.35, 0.35);
    const dirX = Math.cos(theta) * Math.cos(pitch);
    const dirY = Math.sin(pitch);
    const dirZ = Math.sin(theta) * Math.cos(pitch);
    const len = Math.hypot(dirX, dirY, dirZ) || 1;

    const missRadius = utils.randomBetween(0, outerRadius * 0.45);
    const missAngle = rng.random() * Math.PI * 2;
    const offsetX = Math.cos(missAngle) * missRadius;
    const offsetZ = Math.sin(missAngle) * missRadius;
    const offsetY = utils.randomBetween(-outerRadius * 0.12, outerRadius * 0.12);

    const startDist = outerRadius * 1.4;
    const originX = offsetX - (dirX / len) * startDist;
    const originY = offsetY - (dirY / len) * startDist;
    const originZ = offsetZ - (dirZ / len) * startDist;

    return {
      nucleusSize: utils.randomBetween(0.18, 0.42),
      speed: utils.randomBetween(2.5, 5.5),
      direction: { x: dirX / len, y: dirY / len, z: dirZ / len },
      origin: { x: originX, y: originY, z: originZ },
      pathLength: startDist * 2.2,
      spawnDelay: index * 140 + Math.floor(rng.random() * 90),
      respawnCooldown: 280 + Math.floor(rng.random() * 220),
      outerRadius,
      sunSize,
    };
  });
}

function generateMajorAsteroids(belt) {
  const count = Math.floor(utils.randomBetween(3, 6));
  const usedNames = new Set();

  return Array.from({ length: count }, (_, index) => {
    let name;
    do {
      const base = utils.getRandomElement(configPlanetInfos.name);
      const suffix = Math.floor(rng.random() * 900) + 100;
      name = `${base} ${utils.getRandomElement(configPlanetInfos.letters)}-${suffix}`;
    } while (usedNames.has(name));
    usedNames.add(name);

    const composition = utils.getRandomElement(ASTEROID_COMPOSITIONS);
    const size = utils.randomBetween(0.7, 2.4);

    return {
      planetId: `asteroid-${index}-${name.replace(/\s+/g, "-")}`,
      name,
      type: "Asteroid",
      composition,
      size,
      gravity: utils.getRandomElement(configPlanetInfos.gravity),
      temperature: Math.floor(utils.randomBetween(-210, 60)),
      inhabited: false,
      intelligenceFormsDetected: false,
      cabronDetected: composition === "Carbonaceous" || rng.random() > 0.55,
      orbit: {
        angle: rng.random() * Math.PI * 2,
        radius: utils.randomBetween(belt.innerRadius, belt.outerRadius),
        speed: BELT_ROTATION_SPEED,
        inclination: utils.randomBetween(-0.08, 0.08),
      },
      yOffset: utils.randomBetween(-2.5, 2.5),
    };
  });
}

function generateAsteroidBelt(planets) {
  if (planets.length < 4) return null;

  const mid = Math.floor(planets.length / 2);
  const inner = planets[mid - 1]?.orbit?.radius ?? 70;
  const outer = planets[mid]?.orbit?.radius ?? 90;

  const belt = {
    innerRadius: inner + 5,
    outerRadius: outer - 5,
    count: Math.floor(utils.randomBetween(600, 1200)),
    rotationSpeed: BELT_ROTATION_SPEED,
  };

  belt.majorAsteroids = generateMajorAsteroids(belt);
  return belt;
}

function pickStellarType() {
  const r = rng.random();
  if (r < 0.03) return "pulsar";
  if (r < 0.11) return "binary";
  return "single";
}

export function generateSystemExtras(planets, sunSize) {
  return {
    asteroidBelt: generateAsteroidBelt(planets),
    comets: generateComets(planets, sunSize),
    stellarType: pickStellarType(),
    sunName: generateSunName(),
    sunSize,
  };
}

export function generateUniverse({
  baseRadius = 50,
  orbitGap = 18,
  minPlanets = 2,
  maxPlanets = 5,
} = {}) {
  const needCustomColor = Math.floor(rng.random() * 2) === 0;
  const planetsToGenerate = Math.floor(utils.randomBetween(minPlanets, maxPlanets));
  const generatedUniverse = [];

  const MAX_SPEED = 0.006;
  const MIN_SPEED = 0.0001;

  for (let index = 0; index < planetsToGenerate; index++) {
    const size = utils.randomBetween(PLANET_SIZE_MIN, PLANET_SIZE_MAX);
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
      color: needCustomColor ? getPlanetSurfaceTint() : 0xf0eeea,
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

  for (const planet of generatedUniverse) {
    if (rng.random() < 0.38) planet.hasRing = true;
  }

  return generatedUniverse;
}

export function createPlanet({
  orbitRadius,
  index = 0,
  needCustomColor = false,
} = {}) {
  const size = utils.randomBetween(PLANET_SIZE_MIN, PLANET_SIZE_MAX);
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
    color: needCustomColor ? getPlanetSurfaceTint() : 0xf0eeea,
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
    hasRing: rng.random() < 0.38,
  };
}

export function aggregateSystems(systems) {
  const allPlanets = systems.flat();
  if (allPlanets.length === 0) return null;
  return utils.analyzeUniverse(allPlanets);
}
