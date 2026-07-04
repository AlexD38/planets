const STELLAR_LABELS = {
  single: "Étoile simple",
  binary: "Système binaire",
  pulsar: "Pulsar",
};

const TYPE_LABELS = {
  EarthLike: "Tellurique",
  Ocean: "Océanique",
  Gas: "Gazeuse",
  Ice: "Glacée",
  Lava: "Volcanique",
  Toxic: "Toxique",
  RadioActive: "Radioactive",
  Storms: "Tempétueuse",
  Inhabitable: "Habitable",
  Desert: "Désertique",
  Rocky: "Rocheuse",
};

function yesNo(value) {
  return value ? "Oui" : "Non";
}

function formatOrbitalPeriod(speed) {
  if (!speed) return "—";
  const days = Math.round((2 * Math.PI) / speed / 8);
  return `~${days} jours`;
}

function formatDiameter(size) {
  if (!size) return "—";
  const km = Math.round(size * 12_740);
  if (km >= 1000) return `~${(km / 1000).toFixed(1)} Mkm`;
  return `~${km} km`;
}

function formatInclination(inclination) {
  if (inclination == null) return "—";
  return `${(inclination * (180 / Math.PI)).toFixed(1)}°`;
}

function planetFeatures(planet) {
  const features = [];
  if (planet.hasAtmosphere) features.push("Atmosphère");
  if (planet.hasClouds) features.push("Nuages");
  if (planet.hasRing) features.push("Anneaux");
  if (planet.moons?.length) features.push(`${planet.moons.length} lune(s)`);
  if (planet.hasSatellite) features.push("Satellite artificiel");
  if (planet.cityLights) features.push("Lumières urbaines");
  return features.length ? features.join(" · ") : "Aucune particularité";
}

function sizeCategory(radius) {
  if (!radius) return "—";
  if (radius < 0.7) return "XS — naine";
  if (radius < 1.0) return "S — petite";
  if (radius < 1.5) return "M — moyenne";
  if (radius < 2.0) return "L — grande";
  return "XL — géante";
}

function row(label, value) {
  return { label, value: value ?? "—" };
}

export function buildPlanetScanSections(planet) {
  if (!planet) return [];

  if (planet.type === "Asteroid") {
    return [
      {
        title: "Identification",
        rows: [
          row("Désignation", `"${planet.name}"`),
          row("Type", "Astéroïde"),
          row("Composition", planet.composition),
        ],
      },
      {
        title: "Mesures",
        rows: [
          row("Diamètre estimé", formatDiameter(planet.size)),
          row("Gravité", planet.gravity),
          row("Température", `${planet.temperature} °C`),
          row("Carbone", planet.cabronDetected ? "Détecté" : "Absent"),
        ],
      },
      {
        title: "Orbite",
        rows: [
          row(
            "Distance au soleil",
            planet.orbit?.radius ? `${planet.orbit.radius.toFixed(0)} Mkm` : "—",
          ),
          row("Inclinaison", formatInclination(planet.orbit?.inclination)),
          row("Zone", "Ceinture d'astéroïdes"),
        ],
      },
    ];
  }

  const typeLabel = TYPE_LABELS[planet.type] ?? planet.type;

  return [
    {
      title: "Identification",
      rows: [
        row("Désignation", `"${planet.name}"`),
        row("Classe", typeLabel),
        row("Catégorie taille", sizeCategory(planet.size)),
      ],
    },
    {
      title: "Mesures physiques",
      rows: [
        row("Diamètre estimé", formatDiameter(planet.size)),
        row("Gravité", planet.gravity),
        row("Température surface", `${planet.temperature} °C`),
        row("Carbone", planet.cabronDetected ? "Détecté" : "Absent"),
      ],
    },
    {
      title: "Orbite",
      rows: [
        row(
          "Distance au soleil",
          planet.orbit?.radius ? `${planet.orbit.radius.toFixed(0)} Mkm` : "—",
        ),
        row("Période orbitale", formatOrbitalPeriod(planet.orbit?.speed)),
        row("Inclinaison", formatInclination(planet.orbit?.inclination)),
      ],
    },
    {
      title: "Environnement",
      rows: [
        row("Habitée", yesNo(planet.inhabited)),
        row(
          "Vie intelligente",
          planet.intelligenceFormsDetected ? "Signal détecté" : "Aucun signal",
        ),
        row("Particularités", planetFeatures(planet)),
      ],
    },
  ];
}

export function buildSystemScanSections(system, systemInfos) {
  const planets = system?.planets ?? [];
  const radii = planets.map((p) => p.orbit?.radius ?? 0).filter(Boolean);
  const minOrbit = radii.length ? Math.min(...radii) : 0;
  const maxOrbit = radii.length ? Math.max(...radii) : 0;
  const inhabited = planets.filter((p) => p.inhabited);
  const intelligent = planets.filter((p) => p.intelligenceFormsDetected);
  const withRings = planets.filter((p) => p.hasRing);
  const belt = system?.asteroidBelt;
  const cometCount = system?.comets?.length ?? 0;

  const planetList = planets
    .map((p) => `${p.name} (${TYPE_LABELS[p.type] ?? p.type})`)
    .join(" · ");

  const sections = [
    {
      title: "Étoile centrale",
      rows: [
        row("Désignation", `"${system?.sunName ?? systemInfos?.name ?? "—"}"`),
        row(
          "Type stellaire",
          STELLAR_LABELS[system?.stellarType] ?? system?.stellarType ?? "—",
        ),
        row(
          "Rayon stellaire",
          system?.sunSize ? `~${(system.sunSize * 696).toFixed(0)} Mkm` : "—",
        ),
      ],
    },
    {
      title: "Composition",
      rows: [
        row("Planètes recensées", `${planets.length}`),
        row(
          "Types présents",
          systemInfos?.planetTypes?.length
            ? systemInfos.planetTypes
                .map((t) => TYPE_LABELS[t] ?? t)
                .join(", ")
            : "—",
        ),
        row(
          "Orbite intérieure",
          minOrbit ? `${minOrbit.toFixed(0)} Mkm` : "—",
        ),
        row(
          "Orbite extérieure",
          maxOrbit ? `${maxOrbit.toFixed(0)} Mkm` : "—",
        ),
      ],
    },
    {
      title: "Corps célestes",
      rows: [
        row("Ceinture d'astéroïdes", belt ? "Présente" : "Absente"),
        row(
          "Astéroïdes majeurs",
          belt?.majorAsteroids?.length
            ? belt.majorAsteroids.map((a) => a.name).join(", ")
            : "—",
        ),
        row("Comètes actives", cometCount > 0 ? `${cometCount}` : "Aucune"),
        row(
          "Anneaux planétaires",
          withRings.length
            ? withRings.map((p) => p.name).join(", ")
            : "Aucun",
        ),
      ],
    },
    {
      title: "Biosignatures",
      rows: [
        row(
          "Vie intelligente",
          intelligent.length
            ? `Signal sur ${intelligent.map((p) => p.name).join(", ")}`
            : "Aucune détectée",
        ),
        row(
          "Mondes habités",
          inhabited.length
            ? inhabited.map((p) => p.name).join(", ")
            : "Aucun",
        ),
        row(
          "Carbone organique",
          planets.some((p) => p.cabronDetected) ? "Présent" : "Non détecté",
        ),
      ],
    },
  ];

  if (planetList) {
    sections.push({
      title: "Recensement planétaire",
      rows: [row("Corps catalogués", planetList)],
    });
  }

  if (systemInfos?.comments?.length) {
    sections.push({
      title: "Notes du scan",
      rows: systemInfos.comments.map((comment, i) => row(`Note ${i + 1}`, comment)),
    });
  }

  return sections;
}
