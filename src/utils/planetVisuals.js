import * as THREE from "three";
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

const PLANET_TINT_PRESETS = [
  { h: 0.08, s: 0.16, l: 0.7 },
  { h: 0.12, s: 0.14, l: 0.72 },
  { h: 0.55, s: 0.14, l: 0.68 },
  { h: 0.33, s: 0.12, l: 0.66 },
  { h: 0.05, s: 0.1, l: 0.74 },
  { h: 0.62, s: 0.12, l: 0.67 },
  { h: 0.18, s: 0.15, l: 0.69 },
  { h: 0.0, s: 0.06, l: 0.72 },
];

export function getPlanetSurfaceTint() {
  const base = PLANET_TINT_PRESETS[Math.floor(rng.random() * PLANET_TINT_PRESETS.length)];
  const color = new THREE.Color();
  color.setHSL(
    base.h + (rng.random() - 0.5) * 0.04,
    Math.max(0.06, base.s + (rng.random() - 0.5) * 0.05),
    Math.max(0.58, Math.min(0.78, base.l + (rng.random() - 0.5) * 0.06)),
  );
  return color.getHex();
}

export function getAtmosphereColor(type) {
  switch (type) {
    case "Gas":
      return 0xe8d8b8;
    case "Storms":
      return 0xd8ccc0;
    case "Ice":
      return 0xd8e4f0;
    case "Ocean":
      return 0xb8cce0;
    case "EarthLike":
    case "Inhabitable":
      return 0xc4d4e8;
    default:
      return 0xd0dce8;
  }
}

export function getMaterialOptionsForType(type, baseOptions) {
  const options = { ...baseOptions };

  switch (type) {
    case "Lava":
      options.emissive = 0xbb5530;
      options.emissiveIntensity = 0.28;
      break;
    case "Ice":
      options.metalness = 0.35;
      options.roughness = 0.45;
      options.color = 0xd8e4ec;
      break;
    case "Toxic":
      options.color = 0xb0b8a4;
      options.emissive = 0x2a3020;
      options.emissiveIntensity = 0.06;
      break;
    case "RadioActive":
      options.color = 0xb4aab0;
      options.emissive = 0x2a2430;
      options.emissiveIntensity = 0.08;
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

  const moonCount = Math.floor((1 + Math.floor(rng.random() * 3)) / 3);
  if (moonCount === 0) return [];

  const moons = [];

  for (let i = 0; i < moonCount; i++) {
    const fast = rng.random() < 0.45;
    moons.push({
      size: size * 0.18 + rng.random() * 0.24,
      radius: size + 3 + i * (size * 0.4 + 1.5) + rng.random() * 2,
      speed: fast
        ? 0.05 + rng.random() * 0.04
        : 0.008 + rng.random() * 0.012,
      angle: rng.random() * Math.PI * 2,
    });
  }

  return moons;
}
