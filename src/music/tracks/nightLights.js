import { arpeggio, bandMean } from './bands.js';

// Night lights (SVS 5313). Direction 6.2: amount of light -> density of piano notes; lights going out ->
// a falling minor figure; new lights -> rising bells. Direction 6.1 (emotional rule): loss of light
// sounds darker (minor, low strings) than gain (major, bells). Value = mean brightness that the lights
// add to NASA's image (0..254), one step per year; change = this year against the year before.

/** Six latitude bands, north to south; piano pitch on C major pentatonic, north highest. */
export const NIGHT_BANDS = [
  { north: 70, south: 50, midi: 79 },
  { north: 50, south: 35, midi: 76 },
  { north: 35, south: 20, midi: 74 },
  { north: 20, south: 0, midi: 72 },
  { north: 0, south: -20, midi: 69 },
  { north: -20, south: -45, midi: 67 },
];

export const MIN_LIGHT = 0.5; // below this a band is dark
export const FULL_LIGHT = 15; // a band this bright plays on every pulse (~90th percentile of the brightest bands)
export const MIN_CHANGE = 0.1; // relative change from the year before that counts as lights out / new lights
export const MIN_DELTA = 0.5; // ... and in absolute brightness
const PERIODS = [8, 4, 2, 1]; // pulses between notes, dim -> bright
const CHANGE_EVERY = 4; // change figures start every half bar
const OUT_DOWN = -3; // minor third down
const NEW_UP = 4; // major third up

export function periodFor(light) {
  if (!(light >= MIN_LIGHT)) return Infinity;
  const level = Math.min(1, light / FULL_LIGHT);
  return PERIODS[Math.min(PERIODS.length - 1, Math.floor(level * PERIODS.length))];
}

function relChange(b) {
  if (!Number.isFinite(b.value) || !Number.isFinite(b.prev) || b.prev <= 0) return NaN;
  const delta = b.value - b.prev;
  return Math.abs(delta) >= MIN_DELTA ? delta / b.prev : 0;
}

function changeFigure(voice, bands, tick, sign) {
  if (tick % CHANGE_EVERY !== 0) return [];
  const changed = bands
    .map((b) => ({ b, r: relChange(b) }))
    .filter(({ r }) => Number.isFinite(r) && sign * r >= MIN_CHANGE)
    .sort((x, y) => Math.abs(y.r) - Math.abs(x.r));
  if (!changed.length) return [];
  const { b, r } = changed[(tick / CHANGE_EVERY) % changed.length];
  const base = sign < 0 ? b.midi - 12 : b.midi + 12; // low strings for loss, high bells for gain
  const step = sign < 0 ? OUT_DOWN : NEW_UP;
  const velocity = 0.4 + 0.4 * Math.min(1, Math.abs(r) / 0.5);
  return [0, 1].map((k) => ({
    voice,
    kind: 'hit',
    midi: base + k * step,
    velocity,
    lat: b.lat,
    value: r,
    offset: k / 2,
    duration: '8n',
  }));
}

export const NIGHT_LIGHTS_MUSIC = {
  voices: [
    { id: 'light', instrument: 'piano' },
    { id: 'out', instrument: 'strings' },
    { id: 'new', instrument: 'glock' },
  ],

  read(col, prevCol) {
    return NIGHT_BANDS.map((b) => ({
      ...b,
      lat: (b.north + b.south) / 2,
      value: bandMean(col, b.north, b.south),
      prev: prevCol ? bandMean(prevCol, b.north, b.south) : NaN,
    }));
  },

  summary(bands) {
    const lit = bands.filter((b) => Number.isFinite(b.value));
    const light = lit.length ? lit.reduce((a, b) => a + b.value, 0) / lit.length : NaN;
    const both = bands.filter((b) => Number.isFinite(b.value) && Number.isFinite(b.prev));
    const prev = both.reduce((a, b) => a + b.prev, 0);
    const change = both.length && prev > 0 ? both.reduce((a, b) => a + b.value, 0) / prev - 1 : NaN;
    return [
      { voice: 'light', value: light, unit: 'brightness' },
      { voice: 'out', value: Number.isFinite(change) ? Math.max(0, -change) : NaN, unit: 'change' },
      { voice: 'new', value: Number.isFinite(change) ? Math.max(0, change) : NaN, unit: 'change' },
    ];
  },

  initialState() {
    return {};
  },

  plan(bands, tick, state) {
    const playing = bands
      .filter((b) => Number.isFinite(periodFor(b.value)) && tick % periodFor(b.value) === 0)
      .sort((a, b) => a.midi - b.midi);
    const offsets = arpeggio(playing.length);
    const events = playing.map((b, k) => ({
      voice: 'light',
      kind: 'hit',
      midi: b.midi,
      velocity: 0.3 + 0.5 * Math.min(1, b.value / FULL_LIGHT),
      lat: b.lat,
      value: b.value,
      offset: offsets[k],
      duration: '4n',
    }));
    events.push(...changeFigure('out', bands, tick, -1), ...changeFigure('new', bands, tick, +1));
    return { events, state };
  },
};
