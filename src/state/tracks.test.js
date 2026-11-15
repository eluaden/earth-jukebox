import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { describeValue, engineVoices, narrationLine, TRACK_TEXT, TRACK_VIEW } from './tracks.js';
import { TRACK_MUSIC } from '../music/tracks/index.js';
import { LANGS, t } from '../i18n/strings.js';
import { lineKey } from '../narration/key.js';

const json = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const records = json('../../public/tracks/index.json');
const metaOf = (id) => json(`../../public/tracks/${id}/track.json`);
const manifest = json('../../public/narration/manifest.json').lines;
const samples = json('../../public/samples/samples.json');
// Records whose narration the voice actor has not recorded yet: speech synthesis until then.
const VOICE_PENDING = ['aerosols', 'sea-level'];

describe('the records on the shelf', () => {
  it('lists every track with music, texts and a view in this app', () => {
    expect(records).toEqual(['sst', 'lightning', 'night-lights', 'aerosols', 'sea-level']);
    for (const id of records) {
      expect(TRACK_MUSIC[id], id).toBeDefined();
      expect(TRACK_TEXT[id], id).toBeDefined();
      expect(TRACK_VIEW[id], id).toBeDefined();
    }
  });

  it('plays every voice on an instrument that has samples', () => {
    for (const id of records)
      for (const v of engineVoices(id)) expect(Object.keys(samples), `${id}/${v.id}`).toContain(v.instrument);
  });

  it('names every voice and instrument on the chips, in every language', () => {
    for (const lang of LANGS)
      for (const id of records)
        for (const v of TRACK_MUSIC[id].voices) {
          expect(t(lang, `instrument.${v.instrument}`)).not.toBe(`instrument.${v.instrument}`);
          expect(t(lang, `var.${id}.${v.id}`)).not.toBe(`var.${id}.${v.id}`);
        }
  });
});

describe('narration', () => {
  it('has a recorded voice for every line of every record, with its date filled in', () => {
    for (const id of records) {
      const meta = metaOf(id);
      for (const lang of LANGS)
        for (const key of Object.keys(TRACK_TEXT[id][lang].narration)) {
          const text = narrationLine(id, meta, key, lang);
          expect(text, `${id}/${lang}/${key}`).not.toContain('{');
          if (!VOICE_PENDING.includes(id)) expect(manifest[lineKey(lang, text)], `${id}/${lang}/${key}: "${text}"`).toBeDefined();
        }
    }
  });

  it('has a recorded voice for the opening (N1)', () => {
    for (const lang of LANGS)
      for (const key of ['putOnHeadphones', 'welcome']) expect(manifest[lineKey(lang, t(lang, key))], `${lang}/${key}`).toBeDefined();
  });

  it('fills the place lines of a single instant without a date', () => {
    const meta = metaOf('aerosols');
    expect(meta.markers.every((m) => Number.isFinite(m.lon) && m.step === undefined)).toBe(true);
    expect(narrationLine('aerosols', meta, 'dust', 'en')).toMatch(/^Under the needle/);
  });

  it('says only the year on records with one picture per year', () => {
    const line = narrationLine('night-lights', metaOf('night-lights'), 'brightest', 'en');
    expect(line).toMatch(/^\d{4}: /);
  });
});

describe('describeValue (what the screen reader says for a chip)', () => {
  const cases = [
    ['sst', { voice: 'piano', unit: '°C', value: 17.84 }, '17.8 °C'],
    ['lightning', { voice: 'north', unit: 'share', value: 0.024 }, '2.4'],
    ['night-lights', { voice: 'light', unit: 'brightness', value: 12.34 }, '12.3'],
    ['night-lights', { voice: 'out', unit: 'change', value: 0.04 }, '4'],
    ['night-lights', { voice: 'new', unit: 'change', value: 0.1 }, '10'],
    ['aerosols', { voice: 'smoke', unit: 'strength', value: 0.123 }, '12% of the strongest smoke'],
    ['sea-level', { voice: 'level', unit: 'cm', value: 6.37 }, '6.4 centimetres above'],
    ['sea-level', { voice: 'centimetre', unit: 'cm', value: 6 }, '6 whole centimetres'],
  ];
  it.each(cases)('%s %o says the value in words', (id, sv, expected) => {
    const said = describeValue(id, sv, 'en');
    expect(said).toContain(expected);
    expect(said).not.toContain('{');
  });

  it('explains why there is no value instead of saying a number', () => {
    for (const lang of LANGS)
      for (const id of records)
        for (const v of TRACK_MUSIC[id].voices) {
          const unit = { sst: '°C', lightning: 'share', aerosols: 'strength', 'sea-level': 'cm' }[id] ?? (v.id === 'light' ? 'brightness' : 'change');
          const said = describeValue(id, { voice: v.id, unit, value: NaN }, lang);
          expect(said, `${lang}/${id}/${v.id}`).not.toMatch(/^noValue/);
          expect(said).not.toMatch(/\d/);
        }
  });
});

describe('legend in sound', () => {
  const pulse = 60 / 84 / 2;
  it.each(records)('%s: a short, ordered phrase on real instruments', (id) => {
    const notes = TRACK_VIEW[id].legend(pulse);
    expect(notes.length).toBeGreaterThan(3);
    expect(notes.length).toBeLessThan(40);
    for (const n of notes) {
      expect(Object.keys(samples)).toContain(n.instrument);
      expect(n.midi).toBeGreaterThanOrEqual(21);
      expect(n.midi).toBeLessThanOrEqual(108);
      expect(n.velocity).toBeGreaterThan(0);
      expect(n.velocity).toBeLessThanOrEqual(1);
      expect(n.at).toBeGreaterThanOrEqual(0);
    }
    const last = Math.max(...notes.map((n) => n.at));
    expect(last).toBeLessThan(12);
  });

  it('goes from the lowest value to the highest on SST', () => {
    const midis = TRACK_VIEW.sst.legend(0.36).map((n) => n.midi);
    expect([...midis].sort((a, b) => a - b)).toEqual(midis);
  });

  it('climbs with the sea on sea level, then rings the bell', () => {
    const notes = TRACK_VIEW['sea-level'].legend(0.36);
    const strings = notes.filter((n) => n.instrument === 'strings').map((n) => n.midi);
    expect([...strings].sort((a, b) => a - b)).toEqual(strings);
    expect(notes[notes.length - 1].instrument).toBe('glock');
  });

  it('goes from south to north on lightning', () => {
    const midis = TRACK_VIEW.lightning.legend(0.36).map((n) => n.midi);
    expect(midis[midis.length - 1]).toBeGreaterThan(midis[0]);
  });
});
