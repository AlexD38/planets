let randomFn = Math.random;
let currentSeed = null;

function mulberry32(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function parseSeed(value) {
  if (value == null || value === "") return null;

  const numeric = Number(value);
  if (!Number.isNaN(numeric) && Number.isFinite(numeric)) {
    return Math.floor(Math.abs(numeric)) || 1;
  }

  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (Math.imul(31, hash) + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) || 1;
}

export function getSeedFromUrl() {
  return new URLSearchParams(window.location.search).get("seed");
}

export function updateUrlSeed(seed) {
  const url = new URL(window.location.href);
  url.searchParams.set("seed", String(seed));
  window.history.replaceState({}, "", url);
}

export function createRandomSeed() {
  return Math.floor(Math.random() * 1_000_000_000);
}

export function setSeed(seed) {
  const parsed = parseSeed(seed);
  if (parsed == null) {
    currentSeed = null;
    randomFn = Math.random;
    return null;
  }

  currentSeed = parsed;
  randomFn = mulberry32(parsed);
  return parsed;
}

export function getSeed() {
  return currentSeed;
}

export function random() {
  return randomFn();
}
