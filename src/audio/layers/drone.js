import * as Tone from 'tone';

/**
 * DRONE — continuous tone. Value 0..1 controls pitch (log scale) and loudness.
 * Pitch: f = fMin * (fMax / fMin) ^ v  -> equal steps in value = equal musical intervals.
 * `underwater: true` gives a muffled, swaying, submerged timbre (same pitch and loudness mapping).
 */
export function createDrone(output, { fMin = 110, fMax = 440, underwater = false } = {}) {
  const mute = new Tone.Gain(1).connect(output);
  const level = new Tone.Gain(0.5).connect(mute);
  const extra = [];
  let tail = level;
  if (underwater) {
    // Slow sweeping low-pass (light moving through water) + chorus + vibrato (swell).
    const sweep = new Tone.AutoFilter({ frequency: 0.22, baseFrequency: 260, octaves: 2.2, depth: 0.9, wet: 1 })
      .connect(level).start();
    sweep.filter.Q.value = 2.5;
    const chorus = new Tone.Chorus({ frequency: 0.5, delayTime: 6, depth: 0.8, wet: 0.6 }).connect(sweep).start();
    const vibrato = new Tone.Vibrato({ frequency: 0.35, depth: 0.12 }).connect(chorus);
    extra.push(sweep, chorus, vibrato);
    tail = vibrato;
  }
  const cutoff = underwater ? 2.5 : 5; // filter cutoff as a multiple of the pitch
  const filter = new Tone.Filter({ type: 'lowpass', frequency: 900, Q: underwater ? 1.5 : 0.4 }).connect(tail);

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
      filter.frequency.exponentialRampTo(f * cutoff, ramp, time);
      level.gain.rampTo(gainFor(v), ramp, time);
    },
    setMuted(m, time) { mute.gain.rampTo(m ? 0 : 1, 0.15, time); },
    dispose() { [main, fifth, sub, filter, ...extra, level, mute].forEach((n) => n.dispose()); },
  };
}
