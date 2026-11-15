import { legendColor } from '../data/loadTrack.js';
import { chipValue, formatTemp, longDate } from '../lib/format.js';
import { t } from '../i18n/strings.js';
import { noteFor, T_MAX } from '../music/mapping.js';
import { TRACK_MUSIC } from '../music/tracks/index.js';
import { LIGHTNING_BANDS } from '../music/tracks/lightning.js';
import { NIGHT_BANDS } from '../music/tracks/nightLights.js';
import { AEROSOL_VOICES, velocityFor } from '../music/tracks/aerosols.js';
import { bellNote, levelNote } from '../music/tracks/seaLevel.js';
import { SST_TEXT } from '../i18n/tracks/sst.js';
import { LIGHTNING_TEXT } from '../i18n/tracks/lightning.js';
import { NIGHT_LIGHTS_TEXT } from '../i18n/tracks/nightLights.js';
import { AEROSOLS_TEXT } from '../i18n/tracks/aerosols.js';
import { SEA_LEVEL_TEXT } from '../i18n/tracks/seaLevel.js';

// How each track is presented by the app (front B). Data, music and texts come from front A
// (public/tracks/<id>/, src/music/tracks/, src/i18n/tracks/); this file only decides how they look
// and sound on screen: voice tone, needle dot colours, filters and the "Hear the legend" sequence.
// dimLand: the globe dims grey/white pixels, for maps where grey is land without data (SST); off
// where white is the data itself (night lights) or the base map is the picture (lightning).
// porthole: the record is NASA's round video in a glass porthole instead of a map on the globe
// (sea level, direction 5.4): no column, no meridian line, no drag.

export const TRACK_TEXT = {
  sst: SST_TEXT,
  lightning: LIGHTNING_TEXT,
  'night-lights': NIGHT_LIGHTS_TEXT,
  aerosols: AEROSOLS_TEXT,
  'sea-level': SEA_LEVEL_TEXT,
};

const LIGHTNING_YELLOW = '#ffe94a'; // NASA's lightning dots, brightened to read as light on the line
const NIGHT_COLOURS = { light: '#ffd9a0', out: '#ff8a3d', new: '#b58cff' }; // NASA's change map: orange = out, purple = new
const SEA_COLOURS = { level: '#7fdcff', centimetre: '#ffffff' }; // the porthole's water; the bell is white

/** NASA's legend colour of an aerosol voice's type (track.json legend.categories). */
function aerosolColour(meta, voice) {
  const layer = AEROSOL_VOICES.find((v) => v.id === voice)?.layer;
  return meta.legend?.categories?.find((c) => c.id === layer)?.color || '#ffffff';
}

/** Column of 90 values (index 0 = 89 N) from a function of latitude. */
const column = (f) => Float32Array.from({ length: 90 }, (_, j) => f(89 - 2 * j));
const inBand = (b, v, rest) => (lat) => (lat < b.north && lat >= b.south ? v : rest);

/** Plans one pulse of a track on a synthetic reading; the legend plays the track's own notes. */
function planOnce(id, col, prev) {
  const m = TRACK_MUSIC[id];
  return m.plan(m.read(col, prev), 0, m.initialState()).events;
}

const brightness = (t) => 1200 + 6800 * Math.min(1, Math.max(0, t / T_MAX));

export const TRACK_VIEW = {
  sst: {
    dimLand: true,
    voiceTone: { strings: { filter: 4000 }, piano: { filter: 4000 }, glock: { filter: 4000 } },
    /** Warmer water, brighter timbre (direction 6.2). */
    filters: (summary) => Object.fromEntries(summary.filter((s) => Number.isFinite(s.value)).map((s) => [s.voice, brightness(s.value)])),
    dotColor: (meta, e) => legendColor(meta, e.temp),
    // Global mean SST by month under the date (direction 5.2.1).
    trend: { bucket: 'month', unit: '°C', label: 'trend.sst' },
    legend() {
      const notes = [];
      for (let d = 0; d <= 15; d++) notes.push({ instrument: 'piano', midi: noteFor('piano', (d * T_MAX) / 15), velocity: 0.7, at: d * 0.22, duration: '8n' });
      return notes;
    },
  },
  lightning: {
    dimLand: false,
    voiceTone: {},
    filters: null,
    dotColor: () => LIGHTNING_YELLOW,
    trend: { bucket: 'month', unit: 'share', label: 'trend.lightning' },
    legend() {
      return [...LIGHTNING_BANDS].reverse().map((b, k) => {
        const [e] = planOnce('lightning', column(inBand(b, 1, 0)));
        return { instrument: 'marimba', midi: e.midi, velocity: e.velocity, at: k * 0.3, duration: e.duration };
      });
    },
  },
  'night-lights': {
    // A falling figure needs a clear start: strings speak faster here than as held notes.
    dimLand: false,
    voiceTone: { out: { attack: 0.06 } },
    filters: null,
    dotColor: (meta, e) => NIGHT_COLOURS[e.voice] || NIGHT_COLOURS.light,
    trend: { bucket: 'year', unit: 'brightness', label: 'trend.nightLights' },
    legend(pulse) {
      const notes = [];
      let at = 0;
      for (const b of [...NIGHT_BANDS].reverse()) {
        const col = column(inBand(b, 40, NaN));
        const [e] = planOnce('night-lights', col, col).filter((x) => x.voice === 'light');
        notes.push({ instrument: 'piano', midi: e.midi, velocity: e.velocity, at, duration: e.duration });
        at += 0.32;
      }
      const band = NIGHT_BANDS[1];
      const prev = column(inBand(band, 20, NaN));
      for (const [voice, instrument, level] of [
        ['out', 'strings', 10],
        ['new', 'glock', 30],
      ]) {
        at += 0.6;
        const figure = planOnce('night-lights', column(inBand(band, level, NaN)), prev).filter((x) => x.voice === voice);
        for (const e of figure) notes.push({ instrument, midi: e.midi, velocity: e.velocity, at: at + e.offset * pulse, duration: e.duration });
        at += pulse;
      }
      return notes;
    },
  },
  aerosols: {
    dimLand: false,
    voiceTone: {},
    filters: null,
    dotColor: (meta, e) => aerosolColour(meta, e.voice),
    trend: null, // one instant: no series (direction 5.2.1)
    // Each voice's six bands from south to north at full strength: smoke, then dust, then sea salt.
    legend() {
      const notes = [];
      let at = 0;
      for (const v of AEROSOL_VOICES) {
        for (const midi of [...v.notes].reverse()) {
          notes.push({ instrument: v.instrument, midi, velocity: velocityFor(v.full, v.full), at, duration: v.id === 'smoke' ? '4n' : v.duration });
          at += v.id === 'smoke' ? 0.42 : 0.26;
        }
        at += 0.5;
      }
      return notes;
    },
  },
  'sea-level': {
    dimLand: false,
    porthole: true,
    voiceTone: {},
    filters: null,
    dotColor: (meta, e) => SEA_COLOURS[e.voice] || SEA_COLOURS.level,
    trend: { bucket: 'year', unit: 'cm', label: 'trend.seaLevel' },
    // The strings climb from 0 to 11 cm, one step per centimetre; then the bell of a new centimetre.
    legend() {
      const notes = [];
      for (let cm = 0; cm <= 11; cm++) notes.push({ instrument: 'strings', midi: levelNote(cm), velocity: 0.45 + 0.35 * (cm / 12), at: cm * 0.3, duration: '8n' });
      notes.push({ instrument: 'glock', midi: bellNote(1), velocity: 0.75, at: 12 * 0.3 + 0.4, duration: '4n' });
      return notes;
    },
  },
};

/** Voices for the engine: the track's voices plus this app's tone settings. */
export function engineVoices(id) {
  const view = TRACK_VIEW[id];
  return TRACK_MUSIC[id].voices.map((v) => ({ ...v, ...(view.voiceTone[v.id] || {}) }));
}

/** Sign shown on a chip: lights going out is a loss. */
export const chipSign = (voice) => (voice === 'out' ? -1 : 1);

/**
 * A narration line of a track with its {date} filled in: the month and year ("August 2017") or, on
 * tracks with one step per year, the year alone. Must match the recorded text exactly
 * (public/narration/manifest.json), or the line falls back to speech synthesis.
 */
export function narrationLine(trackId, meta, id, lang) {
  const text = TRACK_TEXT[trackId][lang].narration[id];
  const marker = meta.markers.find((m) => m.id === id);
  // Place markers (aerosols: {id, lat, lon}) have no step and no {date} in their text.
  const date = marker && Number.isInteger(marker.step) ? longDate(meta.dates[marker.step], lang, meta.time?.unit) : '';
  return text.replace('{date}', date.charAt(0).toUpperCase() + date.slice(1));
}

/** A value in words, for the screen reader ("2.4% of the area lit by lightning"). */
export function describeValue(trackId, sv, lang) {
  if (!Number.isFinite(sv.value)) {
    const own = `noValue.${trackId}.${sv.unit}`;
    return t(lang, own) !== own ? t(lang, own) : t(lang, `noValue.${trackId}`);
  }
  if (sv.unit === '°C') return formatTemp(sv.value, lang);
  const v = chipValue('share', sv.value, lang).value;
  if (sv.unit === 'share') return t(lang, 'long.share', { v });
  if (sv.unit === 'brightness') return t(lang, 'long.brightness', { v: chipValue('brightness', sv.value, lang).value });
  if (sv.unit === 'change') return t(lang, `long.change.${sv.voice}`, { v });
  if (sv.unit === 'strength') return t(lang, `long.strength.${sv.voice}`, { v: chipValue('strength', sv.value, lang).value });
  if (sv.unit === 'cm') {
    const n = Number.isInteger(sv.value) ? String(sv.value) : chipValue('cm', Math.abs(sv.value), lang).value.slice(1);
    return t(lang, `long.cm.${sv.voice}`, { v: sv.value < 0 ? `−${n}` : n });
  }
  return chipValue(sv.unit, sv.value, lang).value;
}
