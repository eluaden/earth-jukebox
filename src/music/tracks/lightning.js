import { arpeggio, bandMean, bandWeightedLat } from './bands.js';

// Lightning (SVS 5011). Direction 6.2: every lightning band is a hit of tuned percussion (marimba) and
// latitude sets the pitch, so the yearly north-south migration is heard as the register moving.
// Direction 6.3: each latitude band hits at most once per pulse, louder with more lightning; within a
// voice several bands play as an arpeggio, never as a chord. Value = share of the cell covered by
// lightning dots in NASA's 10-day window (0..1). The sensor sees up to ~55 degrees.

/** Ten 10-degree-ish bands from 55 N to 55 S, north to south; pitch on C major pentatonic, north highest. */
export const LIGHTNING_BANDS = [
  { north: 55, south: 45, voice: 'north', midi: 76 },
  { north: 45, south: 35, voice: 'north', midi: 74 },
  { north: 35, south: 23.5, voice: 'north', midi: 72 },
  { north: 23.5, south: 12, voice: 'tropics', midi: 69 },
  { north: 12, south: 0, voice: 'tropics', midi: 67 },
  { north: 0, south: -12, voice: 'tropics', midi: 64 },
  { north: -12, south: -23.5, voice: 'tropics', midi: 62 },
  { north: -23.5, south: -35, voice: 'south', midi: 60 },
  { north: -35, south: -45, voice: 'south', midi: 57 },
  { north: -45, south: -55, voice: 'south', midi: 55 },
];

const ZONES = { north: [55, 23.5], tropics: [23.5, -23.5], south: [-23.5, -55] };
export const MIN_HIT = 0.01; // below 1% of a cell it is a speck, not a dot
export const FULL = 0.4; // ~99th percentile of a cell's coverage: full velocity

export const velocityFor = (share) => 0.3 + 0.6 * Math.sqrt(Math.min(1, share / FULL));

export const LIGHTNING_MUSIC = {
  voices: [
    { id: 'north', instrument: 'marimba', zone: 'north' },
    { id: 'tropics', instrument: 'marimba', zone: 'tropics' },
    { id: 'south', instrument: 'marimba', zone: 'south' },
  ],

  read(col) {
    return LIGHTNING_BANDS.map((b) => ({
      ...b,
      lat: bandWeightedLat(col, b.north, b.south),
      value: bandMean(col, b.north, b.south),
    }));
  },

  summary(bands) {
    // Zone value = the zone's bands averaged, weighted by their width in latitude.
    return Object.entries(ZONES).map(([voice, [n, s]]) => {
      const inZone = bands.filter((b) => b.voice === voice && Number.isFinite(b.value));
      const width = inZone.reduce((a, b) => a + (b.north - b.south), 0);
      const value = width ? inZone.reduce((a, b) => a + b.value * (b.north - b.south), 0) / width : NaN;
      return { voice, value, unit: 'share', range: [n, s] };
    });
  },

  initialState() {
    return {};
  },

  plan(bands, tick, state) {
    const events = [];
    for (const v of this.voices) {
      const active = bands
        .filter((b) => b.voice === v.id && Number.isFinite(b.value) && b.value >= MIN_HIT)
        .sort((a, b) => a.midi - b.midi);
      const offsets = arpeggio(active.length);
      active.forEach((b, k) =>
        events.push({
          voice: v.id,
          kind: 'hit',
          midi: b.midi,
          velocity: velocityFor(b.value),
          lat: b.lat,
          value: b.value,
          offset: offsets[k],
          duration: '16n',
        }),
      );
    }
    return { events, state };
  },
};
