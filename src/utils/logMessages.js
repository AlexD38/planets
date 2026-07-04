const TYPE_LABELS = {
  EarthLike: "tellurique",
  Ocean: "océanique",
  Gas: "gazeuse",
  Ice: "glacée",
  Lava: "volcanique",
  Toxic: "toxique",
  RadioActive: "radioactive",
  Storms: "tempétueuse",
  Inhabitable: "habitable",
  Asteroid: "astéroïde",
};

export function formatPlanetType(type) {
  return TYPE_LABELS[type] ?? type ?? "inconnue";
}

export function systemLoadedMessage(sunName, planetCount) {
  return `Système ${sunName} — ${planetCount} planète${planetCount > 1 ? "s" : ""} cataloguée${planetCount > 1 ? "s" : ""}`;
}

export function approachPlanetMessage(planet) {
  if (planet.type === "Asteroid") {
    return `Cible ceinture : ${planet.name} (${planet.composition ?? "rocheux"})`;
  }
  return `Approche : ${planet.name} (${formatPlanetType(planet.type)})`;
}

export function auroraMessage(planetName) {
  return `Aurore polaire détectée — ${planetName}`;
}

export function pulsarSurgeMessage() {
  return "Surge électromagnétique — pulsar en éruption";
}

export function eclipseMessage(planetName) {
  return `Éclipse partielle — ombre de ${planetName}`;
}

export function flyModeMessage(enabled) {
  return enabled ? "Propulsion manuelle engagée" : "Stabilisation orbitale";
}
