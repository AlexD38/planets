let audioContext = null;
let masterGain = null;
let sfxGain = null;
let droneGain = null;
let warmthGain = null;
let noiseNode = null;
let lowpassFilter = null;
let warmthOsc = null;
let audioActive = false;

function getAudioNodes() {
  if (!audioContext) {
    audioContext = new AudioContext();

    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.08;
    masterGain.connect(audioContext.destination);

    sfxGain = audioContext.createGain();
    sfxGain.gain.value = 0;
    sfxGain.connect(audioContext.destination);

    droneGain = audioContext.createGain();
    droneGain.gain.value = 0.7;
    warmthGain = audioContext.createGain();
    warmthGain.gain.value = 0;

    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    noiseNode = audioContext.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    lowpassFilter = audioContext.createBiquadFilter();
    lowpassFilter.type = "lowpass";
    lowpassFilter.frequency.value = 150;
    lowpassFilter.Q.value = 0.7;

    noiseNode.connect(lowpassFilter);
    lowpassFilter.connect(droneGain);
    droneGain.connect(masterGain);

    warmthOsc = audioContext.createOscillator();
    warmthOsc.type = "sine";
    warmthOsc.frequency.value = 55;
    const warmthFilter = audioContext.createBiquadFilter();
    warmthFilter.type = "lowpass";
    warmthFilter.frequency.value = 120;
    warmthOsc.connect(warmthFilter);
    warmthFilter.connect(warmthGain);
    warmthGain.connect(masterGain);
    warmthOsc.start();
    warmthOsc._started = true;
  }
  return {
    audioContext,
    masterGain,
    sfxGain,
    droneGain,
    warmthGain,
    noiseNode,
    lowpassFilter,
  };
}

export function startSpaceAudio() {
  const { audioContext: ctx, noiseNode: noise, masterGain: master, sfxGain: sfx } =
    getAudioNodes();
  if (ctx.state === "suspended") ctx.resume();
  if (noise && !noise._started) {
    noise.start();
    noise._started = true;
  }
  audioActive = true;
  if (master) master.gain.value = 0.08;
  if (sfx) sfx.gain.value = 0.14;
}

export function stopSpaceAudio() {
  audioActive = false;
  if (masterGain) masterGain.gain.value = 0;
  if (sfxGain) sfxGain.gain.value = 0;
}

export function setSpaceAudioVolume(volume) {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(0.2, volume));
}

function playSfxTone({ frequency, peakGain, attack = 0.01, decay = 0.14 }) {
  const { audioContext: ctx, sfxGain: sfx } = getAudioNodes();
  if (!ctx || !sfx || !audioActive) return;
  if (ctx.state === "suspended") ctx.resume();

  const osc = ctx.createOscillator();
  const toneGain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  toneGain.gain.value = 0.0001;
  osc.connect(toneGain);
  toneGain.connect(sfx);

  const now = ctx.currentTime;
  toneGain.gain.exponentialRampToValueAtTime(peakGain, now + attack);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, now + decay);
  osc.start(now);
  osc.stop(now + decay + 0.03);
}

export function playRadarPing() {
  playSfxTone({ frequency: 820, peakGain: 0.12, attack: 0.02, decay: 0.35 });
}

export function playLogBeep() {
  playSfxTone({ frequency: 620, peakGain: 0.09, attack: 0.008, decay: 0.1 });
}

export function updateSpaceAudioAmbience({
  distToSun = 500,
  distToNearestBody = 500,
  flySpeed = 0,
  stellarType = "single",
} = {}) {
  const { lowpassFilter: lp, warmthGain: warm, masterGain: master, droneGain: drone } =
    getAudioNodes();
  if (!master || !audioActive) return;

  const sunProx = 1 - Math.min(distToSun / 400, 1);
  const bodyProx = 1 - Math.min(distToNearestBody / 80, 1);
  const speedFactor = Math.min(flySpeed / 200, 1);

  const lpFreq = 120 + sunProx * 280 - bodyProx * 60;
  lp.frequency.value = Math.max(80, Math.min(450, lpFreq));

  warm.gain.value = sunProx * 0.12 + (stellarType === "pulsar" ? 0.03 : 0);

  const baseVol = 0.04 + sunProx * 0.06 - bodyProx * 0.03 + speedFactor * 0.02;
  master.gain.value = Math.max(0.02, Math.min(0.18, baseVol));
  drone.gain.value = 0.5 + bodyProx * 0.2;
}

/** @deprecated use updateSpaceAudioAmbience */
export function updateSpaceAudioFromDistance(distance, maxDistance = 500) {
  updateSpaceAudioAmbience({
    distToSun: distance,
    distToNearestBody: distance,
  });
}
