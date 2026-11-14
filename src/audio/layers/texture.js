import * as Tone from 'tone';

/**
 * TEXTURE — filtered noise ("wind"). Intensity grows when the value is high
 * (loudWhen: 'high', default) or low (loudWhen: 'low').
 * Intensity controls loudness and brightness (filter cutoff).
 */
export function createTexture(output, { loudWhen = 'high' } = {}) {
  const mute = new Tone.Gain(1).connect(output);
  const level = new Tone.Gain(0).connect(mute);
  const panner = new Tone.AutoPanner({ frequency: 0.07, depth: 0.6 }).connect(level).start();
  const filter = new Tone.Filter({ type: 'lowpass', frequency: 500, Q: 1.2 }).connect(panner);
  const noise = new Tone.Noise({ type: 'pink', volume: -6 }).connect(filter).start();

  const intensity = (v) => (loudWhen === 'low' ? 1 - v : v);

  return {
    type: 'texture',
    set(v, time, ramp) {
      const i = intensity(v);
      level.gain.rampTo(0.03 + 0.5 * Math.pow(i, 1.5), ramp, time);
      filter.frequency.exponentialRampTo(300 + 2700 * i, ramp, time);
    },
    setMuted(m, time) { mute.gain.rampTo(m ? 0 : 1, 0.15, time); },
    dispose() { [noise, filter, panner, level, mute].forEach((n) => n.dispose()); },
  };
}
