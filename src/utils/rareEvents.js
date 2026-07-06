import * as rng from "./seededRandom";
import * as THREE from "three";
import { getOrbitPosition } from "./orbit";
import {
  auroraMessage,
  pulsarSurgeMessage,
  eclipseMessage,
} from "./logMessages";

const EVENT_TYPES = ["aurora", "pulsarSurge", "eclipse"];

export function createRareEventScheduler({ onEvent, onEventEnd }) {
  let simTime = 0;
  let nextEventAt = 60 + rng.random() * 60;
  let activeEvent = null;
  let activeTimer = 0;
  let lastEclipseCheck = 0;

  function pickEvent(system) {
    const available = [];
    const hasAtmosphere = system.planets.some((p) => p.hasAtmosphere);
    if (hasAtmosphere) available.push("aurora");
    if (system.stellarType === "pulsar") available.push("pulsarSurge");
    const hasMoons = system.planets.some((p) => p.moons?.length > 0);
    if (hasMoons) available.push("eclipse");

    if (available.length === 0) return EVENT_TYPES[rng.random() * EVENT_TYPES.length | 0];
    return available[Math.floor(rng.random() * available.length)];
  }

  function buildEventPayload(type, system) {
    switch (type) {
      case "aurora": {
        const candidates = system.planets.filter((p) => p.hasAtmosphere);
        const planet = candidates[Math.floor(rng.random() * candidates.length)];
        return {
          type,
          duration: 30,
          planetId: planet.planetId,
          planetName: planet.name,
        };
      }
      case "pulsarSurge":
        return { type, duration: 2.5 };
      case "eclipse": {
        const withMoons = system.planets.filter((p) => p.moons?.length > 0);
        const planet = withMoons[Math.floor(rng.random() * withMoons.length)];
        return {
          type,
          duration: 6,
          planetId: planet.planetId,
          planetName: planet.name,
        };
      }
      default:
        return { type: "aurora", duration: 20, planetId: null, planetName: "—" };
    }
  }

  function detectEclipse(camera, system) {
    if (!camera || !system) return null;

    const orbitCenter = { x: system.x, y: system.y, z: system.z };
    const sunPos = new THREE.Vector3(system.x, system.y, system.z);
    const camPos = camera.position;
    const toSun = sunPos.clone().sub(camPos);
    const distSun = toSun.length();
    if (distSun < 1) return null;
    toSun.normalize();

    for (const planet of system.planets) {
      if (!planet.moons?.length || !planet.orbit) continue;
      const planetPos = getOrbitPosition(
        planet.orbit,
        planet.orbit.angle,
        orbitCenter,
      );

      for (const moon of planet.moons) {
        const moonOrbit = {
          radius: moon.radius ?? moon.orbitRadius,
          angle: moon.angle ?? 0,
          speed: moon.speed,
        };
        const moonPos = getOrbitPosition(moonOrbit, moonOrbit.angle, {
          x: planetPos.x,
          y: planetPos.y,
          z: planetPos.z,
        });
        const toMoon = moonPos.clone().sub(camPos);
        const distMoon = toMoon.length();
        toMoon.normalize();

        if (toMoon.dot(toSun) > 0.996 && distMoon < distSun * 0.92) {
          return { planetId: planet.planetId, planetName: planet.name };
        }
      }
    }
    return null;
  }

  return {
    tick({ deltaSim, camera, system, stopOrbits }) {
      if (stopOrbits || deltaSim <= 0) {
        return { activeEvent: activeEvent?.type ?? null, simTime };
      }

      simTime += deltaSim;

      if (activeEvent) {
        activeTimer -= deltaSim;
        if (activeTimer <= 0) {
          const ended = activeEvent;
          activeEvent = null;
          onEventEnd?.(ended);
          nextEventAt = simTime + 90 + rng.random() * 90;
        }
        return { activeEvent: activeEvent?.type ?? null, simTime };
      }

      lastEclipseCheck += deltaSim;
      if (lastEclipseCheck > 2) {
        lastEclipseCheck = 0;
        const eclipse = detectEclipse(camera, system);
        if (eclipse && rng.random() < 0.35) {
          activeEvent = {
            type: "eclipse",
            duration: 6,
            ...eclipse,
          };
          activeTimer = activeEvent.duration;
          onEvent?.(activeEvent, eclipseMessage(eclipse.planetName));
          return { activeEvent: "eclipse", simTime };
        }
      }

      if (simTime >= nextEventAt) {
        const type = pickEvent(system);
        activeEvent = buildEventPayload(type, system);
        activeTimer = activeEvent.duration;

        let message;
        if (type === "aurora") message = auroraMessage(activeEvent.planetName);
        else if (type === "pulsarSurge") message = pulsarSurgeMessage();
        else message = eclipseMessage(activeEvent.planetName);

        onEvent?.(activeEvent, message);
      }

      return { activeEvent: activeEvent?.type ?? null, simTime };
    },
    getActiveEvent() {
      return activeEvent;
    },
  };
}
