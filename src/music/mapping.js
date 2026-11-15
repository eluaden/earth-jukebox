// Data -> notes. Pure and tested; the Tone.js engine only plays what this returns.
//
// Temperature -> pitch: one C major pentatonic of 16 notes for 0..32 C (about 2.1 C per step),
// the same for the three voices (same temperature = same scale degree); each instrument sounds in
// its own octave. Warmer -> louder and brighter. Clarity caps (direcionamento 6.3): at most
// 2 notes per voice and 6 in total.

export const SCALE = [48, 50, 52, 55, 57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84];
export const T_MIN = 0;
export const T_MAX = 32;
export const VOICE_OCTAVE = { strings: 0, piano: 0, glock: 2 };
export const MAX_NOTES_PER_VOICE = 2;
export const MAX_NOTES_TOTAL = 6;

const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function tempToDegree(t) {
  return Math.round(clamp01((t - T_MIN) / (T_MAX - T_MIN)) * (SCALE.length - 1));
}

export function noteFor(voice, t) {
  return SCALE[tempToDegree(t)] + 12 * VOICE_OCTAVE[voice];
}

export function velocityFor(t) {
  return 0.35 + 0.5 * clamp01((t - T_MIN) / (T_MAX - T_MIN));
}

export function emptyHeld() {
  return { strings: [null, null] };
}

const hit = (voice, b, bandIndex) => ({
  voice,
  kind: 'hit',
  midi: noteFor(voice, b.temp),
  velocity: velocityFor(b.temp),
  band: bandIndex,
  lat: b.lat,
  temp: b.temp,
  duration: '4n',
});

/**
 * One eighth-note pulse.
 * zones: output of zonesFromColumn; tick: pulse counter; held: string notes sounding per band.
 * Strings sustain and change only when their degree changes; the piano alternates its two bands on
 * every pulse; the glockenspiel alternates its bands on even pulses.
 */
export function planTick(zones, tick, held) {
  const events = [];
  const [north, tropics, south] = zones;

  const targets = north.bands.map((b) => (Number.isFinite(b.temp) ? noteFor('strings', b.temp) : null));
  if (targets[0] !== null && targets[0] === targets[1]) targets[1] = null; // a unison adds nothing
  const nextHeld = [...held.strings];
  north.bands.forEach((b, i) => {
    const prev = held.strings[i];
    const next = targets[i];
    if (prev === next) return;
    if (prev !== null) events.push({ voice: 'strings', kind: 'release', midi: prev, velocity: 0, band: i, lat: b.lat, temp: b.temp });
    if (next !== null)
      events.push({ voice: 'strings', kind: 'attack', midi: next, velocity: velocityFor(b.temp), band: i, lat: b.lat, temp: b.temp });
    nextHeld[i] = next;
  });

  const pb = tick % 2;
  if (Number.isFinite(tropics.bands[pb].temp)) events.push(hit('piano', tropics.bands[pb], pb));

  if (tick % 2 === 0) {
    const gb = (tick / 2) % 2;
    if (Number.isFinite(south.bands[gb].temp)) events.push(hit('glock', south.bands[gb], gb));
  }

  return { events, held: { strings: nextHeld } };
}
