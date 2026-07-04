let audioContext = null;
let gainNode = null;
let noiseNode = null;

function getAudioContext() {
  if (!audioContext) {
    audioContext = new AudioContext();
    gainNode = audioContext.createGain();
    gainNode.gain.value = 0.08;
    gainNode.connect(audioContext.destination);

    const bufferSize = 2 * audioContext.sampleRate;
    const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    noiseNode = audioContext.createBufferSource();
    noiseNode.buffer = noiseBuffer;
    noiseNode.loop = true;

    const filter = audioContext.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 150;
    filter.Q.value = 0.7;

    noiseNode.connect(filter);
    filter.connect(gainNode);
  }
  return { audioContext, gainNode, noiseNode };
}

export function startSpaceAudio() {
  const { audioContext: ctx, noiseNode: noise } = getAudioContext();
  if (ctx.state === "suspended") ctx.resume();
  if (noise && !noise._started) {
    noise.start();
    noise._started = true;
  }
}

export function stopSpaceAudio() {
  if (gainNode) gainNode.gain.value = 0;
}

export function setSpaceAudioVolume(volume) {
  if (gainNode) gainNode.gain.value = Math.max(0, Math.min(0.2, volume));
}

export function updateSpaceAudioFromDistance(distance, maxDistance = 500) {
  const normalized = 1 - Math.min(distance / maxDistance, 1);
  setSpaceAudioVolume(0.04 + normalized * 0.12);
}
