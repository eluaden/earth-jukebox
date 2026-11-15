import * as Tone from 'tone';

/** BELL — rung on "record" events. Classic FM bell (inharmonic ratio). */
export function createBell(output) {
  const synth = new Tone.FMSynth({
    harmonicity: 3.01,
    modulationIndex: 12,
    oscillator: { type: 'sine' },
    envelope: { attack: 0.001, decay: 2.5, sustain: 0, release: 2 },
    modulation: { type: 'sine' },
    modulationEnvelope: { attack: 0.002, decay: 0.4, sustain: 0, release: 0.3 },
    volume: -10,
  }).connect(output);

  return {
    ring(time) { synth.triggerAttackRelease('E5', 1.5, time, 0.7); },
    dispose() { synth.dispose(); },
  };
}
