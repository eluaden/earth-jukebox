import { arpeggio, bandMean, bandWeightedLat } from './bands.js';

// Aerosols (SVS 5669). One instant (19 Aug 2025, 20:00 UTC): the needle sweeps the same picture on every
// turn, so what changes is the place, not the time. Direction 6.2: one instrument per aerosol type -
// smoke (black carbon) -> low strings, dust -> marimba, sea salt -> glockenspiel (VSCO 2 CE has no
// celesta). Q2 (15/11/2026): three voices; sulfate, which covers more than a third of the map, stays on
// the globe but silent (direction 6.1: at most 3 voices). Latitude sets the pitch (north higher), the
// strength of the type's colour sets how hard the note is played. Value = strength of the type's
// colour in NASA's image relative to its strongest (0..1, no unit), averaged over the band.

/** Layers of grid.bin, in order (scripts/pipeline/aerosols.py); each is 90 rows of the column. */
export const AEROSOL_LAYERS = ['black-carbon', 'dust', 'sea-salt', 'sulfate'];
const ROWS = 90;

/** Six latitude bands, north to south (the image reaches the poles; aerosols barely pass 70 degrees). */
export const AEROSOL_BANDS = [
  { north: 70, south: 45 },
  { north: 45, south: 23.5 },
  { north: 23.5, south: 0 },
  { north: 0, south: -23.5 },
  { north: -23.5, south: -45 },
  { north: -45, south: -70 },
];

// Per voice: its layer, pitches for the six bands (north to south, C major pentatonic), how often it
// plays (pulses), how many bands at most per turn, the note length, the level below which a band is
// silent and the level that plays at full force (~95th percentile of the band means of this image).
export const AEROSOL_VOICES = [
  { id: 'smoke', instrument: 'strings', layer: 'black-carbon', notes: [57, 55, 52, 50, 48, 45], every: 4, max: 2, duration: '2n', min: 0.03, full: 0.3 },
  { id: 'dust', instrument: 'marimba', layer: 'dust', notes: [72, 69, 67, 64, 62, 60], every: 1, max: 4, duration: '16n', min: 0.03, full: 0.35 },
  { id: 'salt', instrument: 'glock', layer: 'sea-salt', notes: [91, 88, 86, 84, 81, 79], every: 2, max: 4, duration: '16n', min: 0.1, full: 0.45 },
];

export const velocityFor = (v, full) => 0.3 + 0.6 * Math.sqrt(Math.min(1, v / full));

/** The rows of one layer in a column read from a layered grid (empty if the column is shorter). */
export function layerOf(col, layerId) {
  const k = AEROSOL_LAYERS.indexOf(layerId);
  return col.subarray(k * ROWS, (k + 1) * ROWS);
}

export const AEROSOLS_MUSIC = {
  voices: AEROSOL_VOICES.map(({ id, instrument }) => ({ id, instrument })),

  read(col) {
    const out = [];
    for (const v of AEROSOL_VOICES) {
      const rows = layerOf(col, v.layer);
      AEROSOL_BANDS.forEach((b, i) =>
        out.push({ ...b, voice: v.id, midi: v.notes[i], lat: bandWeightedLat(rows, b.north, b.south), value: bandMean(rows, b.north, b.south) }),
      );
    }
    return out;
  },

  summary(bands) {
    // Voice value = its bands averaged, weighted by their width in latitude.
    return AEROSOL_VOICES.map(({ id }) => {
      const mine = bands.filter((b) => b.voice === id && Number.isFinite(b.value));
      const width = mine.reduce((a, b) => a + (b.north - b.south), 0);
      const value = width ? mine.reduce((a, b) => a + b.value * (b.north - b.south), 0) / width : NaN;
      return { voice: id, value, unit: 'strength' };
    });
  },

  initialState() {
    return {};
  },

  plan(bands, tick, state) {
    const events = [];
    for (const v of AEROSOL_VOICES) {
      if (tick % v.every !== 0) continue;
      const playing = bands
        .filter((b) => b.voice === v.id && Number.isFinite(b.value) && b.value >= v.min)
        .sort((a, b) => b.value - a.value)
        .slice(0, v.max)
        .sort((a, b) => a.midi - b.midi);
      const offsets = arpeggio(playing.length);
      playing.forEach((b, k) =>
        events.push({
          voice: v.id,
          kind: 'hit',
          midi: b.midi,
          velocity: velocityFor(b.value, v.full),
          lat: b.lat,
          value: b.value,
          offset: offsets[k],
          duration: v.duration,
        }),
      );
    }
    return { events, state };
  },
};
