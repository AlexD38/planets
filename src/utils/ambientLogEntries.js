import * as rng from "./seededRandom";
import { formatPlanetType } from "./logMessages";

const STELLAR_LABELS = {
  single: "simple",
  binary: "binaire",
  pulsar: "pulsar",
};

function pick(arr) {
  if (!arr?.length) return null;
  return arr[Math.floor(rng.random() * arr.length)];
}

function pickPlanet(system) {
  return pick(system?.planets ?? []);
}

function pickTwoPlanets(system) {
  const planets = system?.planets ?? [];
  if (planets.length < 2) return [planets[0] ?? null, null];
  const i = Math.floor(rng.random() * planets.length);
  let j = Math.floor(rng.random() * (planets.length - 1));
  if (j >= i) j += 1;
  return [planets[i], planets[j]];
}

function withAtmosphere(system) {
  return (system?.planets ?? []).filter((p) => p.hasAtmosphere);
}

function inhabitedPlanets(system) {
  return (system?.planets ?? []).filter((p) => p.inhabited);
}

function intelligentPlanets(system) {
  return (system?.planets ?? []).filter((p) => p.intelligenceFormsDetected);
}

function organicPlanets(system) {
  return (system?.planets ?? []).filter((p) => p.cabronDetected);
}

function buildPhysicsMessages(system) {
  const sun = system?.sunName ?? "l'étoile locale";
  const stellar = STELLAR_LABELS[system?.stellarType] ?? "inconnue";
  const planet = pickPlanet(system);
  const [p1, p2] = pickTwoPlanets(system);
  const messages = [
    `Vent solaire modéré — ${sun} dans les paramètres attendus pour une étoile ${stellar}`,
    "Flux de particules chargées : intensité stable, pas d'éruption imminente",
    "Fond diffus cosmique — bruit de fond conforme aux mesures de référence",
    "Gravimètre embarqué : champ local homogène à l'échelle du système",
    "Rayonnement cosmique secondaire : dose absorbée sous le seuil d'alerte",
    "Lentille gravitationnelle faible — déflexion lumineuse dans les normes",
    "Poussière interstellaire : absorption optique négligeable sur la bande visible",
  ];

  if (planet) {
    messages.push(
      `Thermographie de ${planet.name} : ${planet.temperature ?? "—"}°C en surface — cohérent avec un profil ${formatPlanetType(planet.type)}`,
    );
    if (planet.hasAtmosphere) {
      messages.push(
        `Magnétosphère active autour de ${planet.name} — couplage vent solaire / ionosphère nominal`,
      );
    }
    if (planet.moons?.length) {
      messages.push(
        `Effet de marée sur ${planet.name} : ${planet.moons.length} satellite${planet.moons.length > 1 ? "s" : ""} en interaction gravitationnelle`,
      );
    }
    if (planet.hasRing) {
      messages.push(
        `Anneaux de ${planet.name} : particules en équilibre de Roche, pas de collision majeure détectée`,
      );
    }
  }

  if (p1 && p2) {
    messages.push(
      `Résonance orbitale possible entre ${p1.name} et ${p2.name} — période de Laplace à confirmer`,
    );
  }

  if (system?.asteroidBelt) {
    const count = system.asteroidBelt.majorAsteroids?.length ?? 0;
    messages.push(
      `Ceinture d'astéroïdes : ${count} corps majeurs recensés, densité globale modérée`,
    );
    const asteroid = pick(system.asteroidBelt.majorAsteroids);
    if (asteroid) {
      messages.push(
        `Astéroïde ${asteroid.name} : spectre ${asteroid.composition?.toLowerCase() ?? "rocheux"} compatible avec les modèles thermiques`,
      );
    }
  }

  if (system?.comets?.length) {
    messages.push(
      "Comète hyperbolique en transit — trajectoire calculée, aucun risque de franchissement",
    );
  }

  if (system?.stellarType === "binary") {
    messages.push(
      `Éclipse stellaire partielle imminente — binaire autour de ${sun}`,
    );
  }

  if (system?.stellarType === "pulsar") {
    messages.push(
      `Pulsar ${sun} : période de rotation stable, faisceau radio balaie le plan orbital`,
    );
  }

  return messages;
}

function buildUnexplainedMessages(system) {
  const planet = pickPlanet(system);
  const messages = [
    "Signal harmonique faible à 1,42 GHz — origine non localisée",
    "Anomalie thermique ponctuelle — aucune source optique dans le champ",
    "Micro-oscillations gravitationnelles — corrélation avec un corps non catalogué ?",
    "Bande étroite dans le spectre radio — motif répétitif non identifié",
    "Silence radio de 4,2 s puis reprise du bruit de fond — cause indéterminée",
    "Émission infrarouge discontinue — durée 37 min, puis extinction",
    "Structure quasi circulaire dans la poussière — vélocité supersonique, origine inconnue",
    "Gradient de polarisation lumineuse — axe préférentiel sans astre visible",
    "Onde de densité dans le milieu interplanétaire — vitesse de phase anormale",
    "Écho radar fantôme — retour sans obstacle réfléchissant identifié",
  ];

  if (planet) {
    messages.push(
      `Pulsation lumineuse près de ${planet.name} — période irrégulière, modèle inexistant`,
      `Anomalie magnétique localisée sur ${planet.name} — écart de 0,003 % non expliqué`,
      `Formation géométrique fugace dans l'atmosphère de ${planet.name} — durée 12 min`,
    );
    if (planet.hasRing) {
      messages.push(
        `Onde de densité dans les anneaux de ${planet.name} — propagation sans cause apparente`,
      );
    }
  }

  const atmospheric = pick(withAtmosphere(system));
  if (atmospheric) {
    messages.push(
      `Voile lumineux au-dessus de ${atmospheric.name} — spectre non répertorié dans la base`,
    );
  }

  return messages;
}

function buildLifeMessages(system) {
  const messages = [
    "Bio-scanner : traces organiques volatiles en orbite haute — concentration faible",
    "Spectre méthane/atmosphère — signature compatible avec un métabolisme microbien",
    "Écho chlorophyllien diffus — origine planétaire probable mais non confirmée",
    "Phénomène bioluminescent détecté — intensité variable, pas de source optique directe",
    "Molécules complexes en phase gazeuse — chaîne carbonée non attribuée",
    "Activité photosynthétique hypothétique — bande rouge anormale dans le spectre",
  ];

  for (const planet of inhabitedPlanets(system)) {
    messages.push(
      `Civilisation détectée sur ${planet.name} — émissions électromagnétiques en bandes civiles`,
      `Nuits illuminées sur ${planet.name} — réseau urbain visible depuis l'orbite basse`,
    );
  }

  for (const planet of intelligentPlanets(system)) {
    messages.push(
      `Vie intelligente sur ${planet.name} — signaux structurés, protocole de contact en attente`,
      `Architecture organique ou artificielle sur ${planet.name} — classification biosphère de type III`,
    );
  }

  for (const planet of organicPlanets(system)) {
    messages.push(
      `Composés organiques sur ${planet.name} — hypothèse d'une biosphère primitive`,
      `Cycle du carbone actif sur ${planet.name} — indices de vie unicellulaire possible`,
    );
  }

  const ocean = (system?.planets ?? []).find((p) => p.type === "Ocean" || p.type === "EarthLike");
  if (ocean) {
    messages.push(
      `Océans sur ${ocean.name} — marées biologiques détectées dans l'infrarouge côtier`,
    );
  }

  const toxic = (system?.planets ?? []).find((p) => p.type === "Toxic");
  if (toxic) {
    messages.push(
      `Atmosphère toxique sur ${toxic.name} — forme de vie extrêmophile non exclue`,
    );
  }

  if (inhabitedPlanets(system).length === 0 && intelligentPlanets(system).length === 0) {
    messages.push(
      "Aucune civilisation détectée pour l'instant — le silence biologique persiste",
      "Écoute passive : pas de salut radio structuré dans ce secteur",
    );
  }

  return messages;
}

function buildCaptainPresenceMessages(system) {
  const planet = pickPlanet(system);
  const inhabited = pick(inhabitedPlanets(system));
  const intelligent = pick(intelligentPlanets(system));
  const messages = [
    "Votre présence semble avoir été remarquée",
    "Un observateur passif semble suivre votre trajectoire",
    "On dirait que quelqu'un — ou quelque chose — vous observe",
    "Votre vaisseau laisse une signature thermique reconnaissable à grande distance",
    "Le système réagit à votre passage : micro-variations dans le bruit de fond",
    "Vos capteurs enregistrent un silence… puis un léger pic d'attention",
    "Vous avez l'impression d'être attendu ici",
    "Une onde faible semble se propager depuis votre position — comme un écho",
    "Votre ombre orbitale est peut-être visible depuis certaines surfaces",
    "Quelque chose dans ce secteur semble s'être réveillé à votre arrivée",
    "Votre présence perturbe à peine l'équilibre local — assez pour être sentie",
    "Le journal automatique note : « intrus bienveillant ? »",
    "Vous n'êtes peut-être pas seul à regarder les étoiles ce soir",
    "Un frisson traverse les instruments — réaction à votre proximité, peut-être",
    "On vous conseille de rester vigilant : vous êtes remarquable",
  ];

  if (inhabited) {
    messages.push(
      `Des habitants de ${inhabited.name} pourraient venir de voir votre vaisseau traverser le ciel`,
      `${inhabited.name} enregistre peut-être déjà votre passage dans ses annales`,
    );
  }

  if (intelligent) {
    messages.push(
      `Votre présence n'a pas échappé à ${intelligent.name} — signal dirigé vers vous ?`,
      `${intelligent.name} semble vous sonder : « qui êtes-vous ? »`,
      `Quelqu'un sur ${intelligent.name} vient peut-être de vous repérer`,
    );
  }

  if (planet) {
    messages.push(
      `En approchant de ${planet.name}, vous sentez le poids d'un regard invisible`,
      `${planet.name} semble plus silencieuse depuis que vous êtes là`,
    );
  }

  if (system?.stellarType === "pulsar") {
    messages.push(
      "Le pulsar balaie votre coque à chaque rotation — comme un projecteur sur vous",
    );
  }

  return messages;
}

export function pickAmbientLogMessage(system, recentTexts = []) {
  if (!system) return null;

  const pools = [
    ...buildPhysicsMessages(system),
    ...buildUnexplainedMessages(system),
    ...buildLifeMessages(system),
    ...buildCaptainPresenceMessages(system),
    ...buildCaptainPresenceMessages(system),
  ];

  const unique = [...new Set(pools)];
  const available = unique.filter((text) => !recentTexts.includes(text));
  const pool = available.length > 0 ? available : unique;

  return pool[Math.floor(rng.random() * pool.length)] ?? null;
}

export function createAmbientLogScheduler({
  onLog,
  minInterval = 5,
  maxInterval = 20,
} = {}) {
  let nextAt = null;
  const recent = [];
  const RECENT_MAX = 6;

  function scheduleNext(fromTime) {
    nextAt = fromTime + minInterval + rng.random() * (maxInterval - minInterval);
  }

  return {
    tick({ deltaSim, simTime, system }) {
      if (!system || deltaSim <= 0) return;

      if (nextAt == null) {
        scheduleNext(simTime);
        return;
      }

      if (simTime < nextAt) return;

      const message = pickAmbientLogMessage(system, recent);
      if (message) {
        onLog(message);
        recent.unshift(message);
        if (recent.length > RECENT_MAX) recent.pop();
      }

      scheduleNext(simTime);
    },
    reset() {
      nextAt = null;
      recent.length = 0;
    },
  };
}
