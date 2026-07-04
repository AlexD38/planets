import * as rng from "./seededRandom";

const ATMOSPHERE_TYPES = new Set(["Gas", "EarthLike", "Ocean", "Ice", "Storms"]);
const CLOUD_TYPES = new Set(["EarthLike", "Ocean", "Storms", "Inhabitable"]);

export function getPlanetVisualFlags(planetInfo) {
  const type = planetInfo?.type ?? "";
  return {
    hasAtmosphere: ATMOSPHERE_TYPES.has(type),
    hasClouds: CLOUD_TYPES.has(type),
    cityLights:
      Boolean(planetInfo?.inhabited) ||
      Boolean(planetInfo?.intelligenceFormsDetected),
  };
}

export function getAtmosphereColor(type) {
  switch (type) {
    case "Gas":
      return 0xffcc66;
    case "Storms":
      return 0xccaa88;
    case "Ice":
      return 0xccddff;
    case "Ocean":
      return 0x66aaff;
    case "EarthLike":
    case "Inhabitable":
      return 0x88bbff;
    default:
      return 0xaaccff;
  }
}

export function getMaterialOptionsForType(type, baseOptions) {
  const options = { ...baseOptions };

  switch (type) {
    case "Lava":
      options.emissive = 0xff4400;
      options.emissiveIntensity = 0.6;
      break;
    case "Ice":
      options.metalness = 0.7;
      options.roughness = 0.2;
      break;
    case "Toxic":
      options.color = 0x88ff44;
      options.emissive = 0x224400;
      options.emissiveIntensity = 0.15;
      break;
    case "RadioActive":
      options.color = 0xcc44ff;
      options.emissive = 0x440066;
      options.emissiveIntensity = 0.2;
      break;
    case "Gas":
    case "Storms":
      options.roughness = 0.9;
      break;
    default:
      break;
  }

  return options;
}

export function generateMoonsForPlanet(size) {
  if (size <= 1.5) return [];

  const moonCount = Math.floor(rng.random() * 4);
  const moons = [];

  for (let i = 0; i < moonCount; i++) {
    moons.push({
      size: size * 0.08 + rng.random() * 0.15,
      orbitRadius: size + 1.5 + i * 1.2 + rng.random(),
      speed: 0.01 + rng.random() * 0.02,
      angle: rng.random() * Math.PI * 2,
    });
  }

  return moons;
}
