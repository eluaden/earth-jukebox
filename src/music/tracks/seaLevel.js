// Sea level (SVS 5235, bonus record in a porthole). Direction 6.2: the level -> a held tone that climbs;
// milestones along the way. One global value per step (grid of 1 x 1): centimetres of global mean sea
// level above 1993, read from the blue bar on NASA's ruler. Strings hold one long note that climbs one
// step of C major pentatonic per whole centimetre (a little louder as it rises); the first time the
// sea reaches a new whole centimetre, a glockenspiel bell rings, higher for each one.

/** C major pentatonic from C3 upwards. */
export const SCALE = Array.from({ length: 25 }, (_, i) => 48 + 12 * Math.floor(i / 5) + [0, 2, 4, 7, 9][i % 5]);
const BELL_FROM = 12; // bell for centimetre n = SCALE[n + 12]: 1 cm -> G5, the glockenspiel's lowest
const BAR = 8; // pulses (eighth notes) in a bar: the held note is struck again every bar
const MAX_CM = 12; // the ruler's top of the record (the sea reached 11.5 cm)

export const levelNote = (cm) => SCALE[Math.max(0, Math.min(MAX_CM, Math.floor(cm)))];
export const bellNote = (n) => SCALE[Math.min(SCALE.length - 1, BELL_FROM + n)];

export const SEA_LEVEL_MUSIC = {
  voices: [
    { id: 'level', instrument: 'strings' },
    { id: 'centimetre', instrument: 'glock' },
  ],

  read(col) {
    return { level: col.length ? col[0] : NaN };
  },

  summary({ level }) {
    const ok = Number.isFinite(level);
    return [
      { voice: 'level', value: ok ? level : NaN, unit: 'cm' },
      { voice: 'centimetre', value: ok ? Math.max(0, Math.floor(level)) : NaN, unit: 'cm' },
    ];
  },

  initialState() {
    return { note: null, best: null };
  },

  plan({ level }, tick, state) {
    if (!Number.isFinite(level)) return { events: [], state: { note: null, best: state.best } };
    const events = [];
    const note = levelNote(level);
    if (note !== state.note || tick % BAR === 0) {
      const velocity = 0.45 + 0.35 * Math.min(1, Math.max(0, level) / MAX_CM);
      events.push({ voice: 'level', kind: 'hit', midi: note, velocity, lat: 0, value: level, duration: '1n' });
    }
    const whole = Math.max(0, Math.floor(level));
    // The record looped (back near 1993): the milestones start again.
    let best = state.best == null || whole < state.best - 2 ? whole : state.best;
    if (whole > best) {
      best = whole;
      events.push({ voice: 'centimetre', kind: 'hit', midi: bellNote(whole), velocity: 0.75, lat: 0, value: whole, duration: '4n' });
    }
    return { events, state: { note, best } };
  },
};
