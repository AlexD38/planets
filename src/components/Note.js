const audioCtx = new AudioContext();

export function playNote(frequency = 440, duration = 1) {
  const ctx = audioCtx;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = "sine";
  osc.frequency.value = frequency;

  // attaque
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);

  // tenue
  gain.gain.setValueAtTime(0.4, ctx.currentTime + duration - 0.2);

  // release
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}
