import * as Tone from 'tone';

/**
 * DRONE — continuous tone. Value 0..1 controls pitch (log scale) and loudness.
 * Pitch: f = fMin * (fMax / fMin) ^ v  -> equal steps in value = equal musical intervals.
 */
export function createDrone(output, { fMin = 110, fMax = 440 } = {}) {
  const mute = new Tone.Gain(1).connect(output);
  const level = new Tone.Gain(0.5).connect(mute);
  const filter = new Tone.Filter({ type: 'lowpass', frequency: 900, Q: 0.4 }).connect(level);

  // Warm pad: detuned triangles + a quiet fifth + a sub octave.
  const main = new Tone.FatOscillator({ type: 'triangle', count: 3, spread: 16, frequency: fMin, volume: -12 });
  const fifth = new Tone.Oscillator({ type: 'sine', frequency: fMin * 1.5, volume: -24 });
  const sub = new Tone.Oscillator({ type: 'sine', frequency: fMin / 2, volume: -18 });
  [main, fifth, sub].forEach((o) => o.connect(filter).start());

  const freqFor = (v) => fMin * Math.pow(fMax / fMin, v);
  const gainFor = (v) => 0.35 + 0.65 * v; // quieter when low, never silent

  return {
    type: 'drone',
    freqFor,
    /** Glide to value v starting at `time`, over `ramp` seconds. */
    set(v, time, ramp) {
      const f = freqFor(v);
      main.frequency.exponentialRampTo(f, ramp, time);
      fifth.frequency.exponentialRampTo(f * 1.5, ramp, time);
      sub.frequency.exponentialRampTo(f / 2, ramp, time);
      filter.frequency.exponentialRampTo(f * 5, ramp, time);
      level.gain.rampTo(gainFor(v), ramp, time);
    },
    setMuted(m, time) { mute.gain.rampTo(m ? 0 : 1, 0.15, time); },
    dispose() { [main, fifth, sub, filter, level, mute].forEach((n) => n.dispose()); },
  };
}
