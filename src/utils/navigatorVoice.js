import welcomeUrl from "../assets/welcome-aboard.wav";
import { getSfxAudioBus } from "./spaceAudio";

let welcomeBufferPromise = null;

function makeDistortionCurve(amount = 6) {
  const samples = 44100;
  const curve = new Float32Array(samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < samples; i++) {
    const x = (i * 2) / samples - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

function loadWelcomeBuffer(ctx) {
  if (!welcomeBufferPromise) {
    welcomeBufferPromise = fetch(welcomeUrl)
      .then((res) => res.arrayBuffer())
      .then((ab) => ctx.decodeAudioData(ab))
      .catch(() => null);
  }
  return welcomeBufferPromise;
}

function playRadioBurst(
  ctx,
  destination,
  { duration = 0.14, peak = 0.09, freq = 1100, when = 0 } = {},
) {
  const sampleCount = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < sampleCount; i++) {
    const t = i / sampleCount;
    const env = t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85;
    data[i] = (Math.random() * 2 - 1) * env * 0.55;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = freq;
  filter.Q.value = 1.1;

  const gain = ctx.createGain();
  gain.gain.value = peak;

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(when);
}

function playRadioNoiseBed(ctx, destination, startTime, duration) {
  const grain = Math.floor(ctx.sampleRate * 0.04);
  const buffer = ctx.createBuffer(1, grain, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < grain; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.value = 780;
  filter.Q.value = 0.85;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.038, startTime + 0.03);
  gain.gain.setValueAtTime(0.038, startTime + duration - 0.04);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(destination);
  source.start(startTime);
  source.stop(startTime + duration + 0.05);
}

function createRadioChain(ctx, destination, startTime) {
  const input = ctx.createGain();

  const bandpass = ctx.createBiquadFilter();
  bandpass.type = "bandpass";
  bandpass.frequency.value = 1050;
  bandpass.Q.value = 2.8;

  const lfo = ctx.createOscillator();
  lfo.type = "sine";
  lfo.frequency.value = 4.2;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 220;
  lfo.connect(lfoDepth);
  lfoDepth.connect(bandpass.frequency);

  const highpass = ctx.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 520;

  const lowpass = ctx.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 1900;
  lowpass.Q.value = 1.4;

  const midBoost = ctx.createBiquadFilter();
  midBoost.type = "peaking";
  midBoost.frequency.value = 1450;
  midBoost.Q.value = 1.6;
  midBoost.gain.value = 5;

  const distortion = ctx.createWaveShaper();
  distortion.curve = makeDistortionCurve(32);
  distortion.oversample = "4x";

  const compressor = ctx.createDynamicsCompressor();
  compressor.threshold.value = -30;
  compressor.ratio.value = 16;
  compressor.attack.value = 0.002;
  compressor.release.value = 0.08;

  const output = ctx.createGain();
  output.gain.value = 1.05;

  input.connect(bandpass);
  bandpass.connect(highpass);
  highpass.connect(lowpass);
  lowpass.connect(midBoost);
  midBoost.connect(distortion);
  distortion.connect(compressor);
  compressor.connect(output);
  output.connect(destination);

  lfo.start(startTime);
  const voiceEnd = startTime + 2;
  lfo.stop(voiceEnd);

  return input;
}

export async function playNavigatorWelcome() {
  const { ctx, sfx, active } = getSfxAudioBus();
  if (!ctx || !sfx || !active) return;

  if (ctx.state === "suspended") await ctx.resume();

  const buffer = await loadWelcomeBuffer(ctx);
  if (!buffer) return;

  const now = ctx.currentTime;
  const voiceStart = now + 0.1;
  const voiceDuration = buffer.duration;

  playRadioBurst(ctx, sfx, { duration: 0.18, peak: 0.11, freq: 950, when: now });
  playRadioNoiseBed(ctx, sfx, voiceStart - 0.02, voiceDuration + 0.2);

  const radioIn = createRadioChain(ctx, sfx, voiceStart);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(radioIn);
  source.start(voiceStart);

  playRadioBurst(ctx, sfx, {
    duration: 0.1,
    peak: 0.07,
    freq: 1300,
    when: voiceStart + voiceDuration + 0.06,
  });
}
