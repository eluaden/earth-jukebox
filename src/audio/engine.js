/**
 * Sound engine (Web Audio, synthesized live). Knows nothing about images or the page:
 * it receives values 0..1 and plays them.
 *   layers(v)  steady tone (pitch + loudness follow v) and wind (grows as v falls)
 *   tick()     one step of time; bell() a record; duck() lowers the music under the voice
 */
let ctx, master, analyser, drone, sub, dGain, dFilt, wGain, wFilt;

export function ensureAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = .8;
  analyser = ctx.createAnalyser(); analyser.fftSize = 256;
  master.connect(analyser); analyser.connect(ctx.destination);
  dFilt = ctx.createBiquadFilter(); dFilt.type = 'lowpass'; dFilt.frequency.value = 900;
  dGain = ctx.createGain(); dGain.gain.value = 0;
  drone = ctx.createOscillator(); drone.type = 'sawtooth'; sub = ctx.createOscillator(); sub.type = 'sine';
  const sg = ctx.createGain(); sg.gain.value = .6;
  drone.connect(dFilt); sub.connect(sg); sg.connect(dFilt); dFilt.connect(dGain); dGain.connect(master); drone.start(); sub.start();
  const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  const nz = ctx.createBufferSource(); nz.buffer = buf; nz.loop = true;
  wFilt = ctx.createBiquadFilter(); wFilt.type = 'bandpass'; wFilt.Q.value = .8;
  wGain = ctx.createGain(); wGain.gain.value = 0;
  nz.connect(wFilt); wFilt.connect(wGain); wGain.connect(master); nz.start();
}

/** Call from a user gesture before any sound. */
export async function resume() { ensureAudio(); await ctx.resume(); }
export const hasAudio = () => !!ctx;

const f = (v) => 98 * Math.pow(2, 2 * v);

export function layers(v) {
  const n = ctx.currentTime;
  drone.frequency.setTargetAtTime(f(v), n, .08); sub.frequency.setTargetAtTime(f(v) / 2, n, .08);
  dGain.gain.setTargetAtTime(.06 + .12 * v, n, .1); wGain.gain.setTargetAtTime(.02 + .5 * (1 - v) ** 2, n, .15); wFilt.frequency.setTargetAtTime(300 + 900 * (1 - v), n, .2);
}

export function silence(tc) {
  if (!ctx) return;
  const n = ctx.currentTime; dGain.gain.setTargetAtTime(0, n, tc); wGain.gain.setTargetAtTime(0, n, tc);
}

export function tick(strong) {
  const o = ctx.createOscillator(), g = ctx.createGain(), n = ctx.currentTime;
  o.frequency.value = strong ? 1600 : 2400; g.gain.setValueAtTime(strong ? .25 : .08, n); g.gain.exponentialRampToValueAtTime(.0001, n + (strong ? .08 : .04));
  o.connect(g); g.connect(master); o.start(n); o.stop(n + .1);
}

export function bell() {
  const n = ctx.currentTime;
  [[1, 1], [2.76, .45], [5.4, .2]].forEach(([r, w], i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 880 * r; g.gain.setValueAtTime(.18 * w, n); g.gain.exponentialRampToValueAtTime(.0001, n + 2 - i * .5);
    o.connect(g); g.connect(master); o.start(n); o.stop(n + 2.2);
  });
}

export const duck = (on) => master && master.gain.setTargetAtTime(on ? .35 : .8, ctx.currentTime, .15);

/** Short demos of each layer for the "How to listen" cards: 'tone' | 'wind' | 'bell'. */
export async function demo(k) {
  await resume();
  const n = ctx.currentTime;
  if (k === 'tone') { wGain.gain.setValueAtTime(0, n); layers(1); wGain.gain.setValueAtTime(0, n); setTimeout(() => { layers(0); wGain.gain.setTargetAtTime(0, ctx.currentTime, .05); }, 1500); setTimeout(() => silence(.2), 3000); }
  if (k === 'wind') { dGain.gain.setValueAtTime(0, n); wFilt.frequency.value = 900; wGain.gain.setTargetAtTime(.45, n, .3); setTimeout(() => silence(.3), 2500); }
  if (k === 'bell') { for (let i = 0; i < 4; i++) setTimeout(() => tick(i === 0), i * 300); setTimeout(bell, 1300); }
}
