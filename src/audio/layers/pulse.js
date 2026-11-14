import * as Tone from 'tone';

/**
 * PULSE — one soft tick per frame (the clock). Accented ticks mark milestones.
 * If a series is mapped to this layer, its value sets the tick pitch (log scale).
 */
export function createPulse(output, { fMin = 160, fMax = 640 } = {}) {
  const mute = new Tone.Gain(1).connect(output);
  const level = new Tone.Gain(0.6).connect(mute);
  const synth = new Tone.MembraneSynth({
    pitchDecay: 0.01,
    octaves: 2,
    envelope: { attack: 0.001, decay: 0.18, sustain: 0, release: 0.05 },
    volume: -8,
  }).connect(level);

  let value = null;
  const freqFor = (v) => fMin * Math.pow(fMax / fMin, v);

  return {
    type: 'pulse',
    set(v) { value = v; },
    tick(time, accent = false) {
      const base = value == null ? 220 : freqFor(value);
      synth.triggerAttackRelease(accent ? base * 2 : base, 0.08, time, accent ? 0.95 : 0.3);
    },
    setMuted(m, time) { mute.gain.rampTo(m ? 0 : 1, 0.05, time); },
    dispose() { [synth, level, mute].forEach((n) => n.dispose()); },
  };
}
