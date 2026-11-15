import { describe, expect, it } from 'vitest';
import { stepAtFrame, stepAtTime } from '../../data/steps.js';
import { TRACK_MUSIC } from './index.js';
import { LIGHTNING_BANDS } from './lightning.js';
import { NIGHT_BANDS } from './nightLights.js';

const MAX_PER_VOICE_AT_ONCE = 2;
const MAX_AT_ONCE = 6;

/** Column of 90 values (index 0 = 89 N) built from a function of latitude. */
const column = (f) => Float32Array.from({ length: 90 }, (_, j) => f(89 - 2 * j));

function checkCaps(events) {
  const at = new Map();
  for (const e of events) {
    if (e.kind === 'release') continue;
    const k = e.offset ?? 0;
    at.set(k, [...(at.get(k) || []), e]);
  }
  for (const group of at.values()) {
    expect(group.length).toBeLessThanOrEqual(MAX_AT_ONCE);
    for (const v of new Set(group.map((e) => e.voice)))
      expect(group.filter((e) => e.voice === v).length).toBeLessThanOrEqual(MAX_PER_VOICE_AT_ONCE);
  }
  for (const e of events) {
    expect(Number.isFinite(e.midi)).toBe(true);
    if (e.offset !== undefined) {
      expect(e.offset).toBeGreaterThanOrEqual(0);
      expect(e.offset).toBeLessThan(1);
    }
  }
}

describe('steps', () => {
  it('uses a fixed step size when the track has one (SST)', () => {
    const meta = { video: { fps: 30 }, grid: { steps: 334, stepEvery: 6 } };
    expect(stepAtFrame(meta, 0)).toBe(0);
    expect(stepAtFrame(meta, 13)).toBe(2);
    expect(stepAtFrame(meta, 99999)).toBe(333);
  });

  it('uses the frame list when time is not uniform (lightning)', () => {
    const meta = { grid: { steps: 4, stepFrames: [0, 10, 11, 40] } };
    expect(stepAtFrame(meta, 0)).toBe(0);
    expect(stepAtFrame(meta, 9)).toBe(0);
    expect(stepAtFrame(meta, 10)).toBe(1);
    expect(stepAtFrame(meta, 39)).toBe(2);
    expect(stepAtFrame(meta, 500)).toBe(3);
    expect(stepAtFrame(meta, -5)).toBe(0);
  });

  it('turns time into a step for tracks made of still images (night lights)', () => {
    const meta = { grid: { steps: 12 }, time: { secondsPerStep: 10 } };
    expect(stepAtTime(meta, 0)).toBe(0);
    expect(stepAtTime(meta, 19.9)).toBe(1);
    expect(stepAtTime(meta, 125)).toBe(0); // loops
  });
});

describe('track music interface', () => {
  for (const [id, m] of Object.entries(TRACK_MUSIC)) {
    it(`${id}: at most 3 voices, each with an instrument`, () => {
      expect(m.voices.length).toBeLessThanOrEqual(3);
      for (const v of m.voices) expect(typeof v.instrument).toBe('string');
    });

    it(`${id}: over land or no data it plays nothing and never NaN`, () => {
      const empty = column(() => NaN);
      const read = m.read(empty, empty);
      let state = m.initialState();
      for (let tick = 0; tick < 16; tick++) {
        const r = m.plan(read, tick, state);
        state = r.state;
        expect(r.events.filter((e) => e.kind !== 'release')).toEqual([]);
      }
      for (const s of m.summary(read)) expect(Number.isNaN(s.value)).toBe(true);
    });

    it(`${id}: respects the clarity caps on random columns`, () => {
      let seed = 3;
      const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      let state = m.initialState();
      for (let tick = 0; tick < 400; tick++) {
        const col = column(() => (rand() < 0.3 ? NaN : rand() * (id === 'lightning' ? 0.6 : id === 'sst' ? 32 : 60)));
        const prev = column(() => (rand() < 0.3 ? NaN : rand() * 60));
        const r = m.plan(m.read(col, prev), tick, state);
        state = r.state;
        checkCaps(r.events);
      }
    });
  }
});

describe('lightning', () => {
  const m = TRACK_MUSIC.lightning;

  it('latitude sets the pitch: further north is higher', () => {
    const pitches = LIGHTNING_BANDS.map((b) => b.midi);
    for (let i = 1; i < pitches.length; i++) expect(pitches[i]).toBeLessThan(pitches[i - 1]); // listed north to south
  });

  it('each band with lightning hits once per pulse, louder with more lightning, as an arpeggio per voice', () => {
    const col = column((lat) => (lat > 0 && lat < 12 ? 0.3 : lat < 0 && lat > -12 ? 0.02 : 0));
    const { events } = m.plan(m.read(col), 0, m.initialState());
    const tropics = events.filter((e) => e.voice === 'tropics');
    expect(tropics.length).toBe(2);
    const north = tropics.find((e) => e.lat > 0);
    const south = tropics.find((e) => e.lat < 0);
    expect(north.velocity).toBeGreaterThan(south.velocity);
    expect(north.midi).toBeGreaterThan(south.midi);
    expect(new Set(tropics.map((e) => e.offset)).size).toBe(2);
  });

  it('ignores specks below 1% of a cell', () => {
    const col = column(() => 0.005);
    expect(m.plan(m.read(col), 0, m.initialState()).events).toEqual([]);
  });

  it('summary shows the share of the zone covered by lightning', () => {
    const col = column((lat) => (lat > 23.5 && lat < 55 ? 0.1 : 0));
    const north = m.summary(m.read(col)).find((s) => s.voice === 'north');
    expect(north.value).toBeCloseTo(0.1, 5);
    expect(north.unit).toBe('share');
  });
});

describe('night lights', () => {
  const m = TRACK_MUSIC['night-lights'];

  it('latitude sets the pitch of the piano', () => {
    const pitches = NIGHT_BANDS.map((b) => b.midi);
    for (let i = 1; i < pitches.length; i++) expect(pitches[i]).toBeLessThan(pitches[i - 1]);
  });

  it('puts the flash where the light is inside the band, not at the geometric centre', () => {
    const col = column((lat) => (lat === -23 ? 40 : 0));
    const band = m.read(col, col).find((b) => b.south === -45);
    expect(band.lat).toBe(-23);
  });

  it('more light means more piano notes over a bar', () => {
    const count = (level) => {
      const col = column((lat) => (lat > 35 && lat < 50 ? level : NaN));
      const read = m.read(col, col);
      let n = 0;
      let state = m.initialState();
      for (let tick = 0; tick < 8; tick++) {
        const r = m.plan(read, tick, state);
        state = r.state;
        n += r.events.filter((e) => e.voice === 'light').length;
      }
      return n;
    };
    expect(count(40)).toBeGreaterThan(count(3));
    expect(count(0)).toBe(0);
  });

  it('lights going out play a falling minor figure, new lights a rising one', () => {
    const prev = column((lat) => (lat > 35 && lat < 50 ? 20 : NaN));
    const dimmer = column((lat) => (lat > 35 && lat < 50 ? 14 : NaN));
    const brighter = column((lat) => (lat > 35 && lat < 50 ? 26 : NaN));
    const out = m.plan(m.read(dimmer, prev), 0, m.initialState()).events.filter((e) => e.voice === 'out');
    const nw = m.plan(m.read(brighter, prev), 0, m.initialState()).events.filter((e) => e.voice === 'new');
    expect(out.length).toBe(2);
    expect(out[1].midi - out[0].midi).toBe(-3);
    expect(nw.length).toBe(2);
    expect(nw[1].midi - nw[0].midi).toBe(4);
    expect(m.plan(m.read(prev, prev), 0, m.initialState()).events.filter((e) => e.voice !== 'light')).toEqual([]);
  });

  it('the first year has nothing to compare with: no change voices', () => {
    const col = column((lat) => (lat > 35 && lat < 50 ? 20 : NaN));
    const empty = column(() => NaN);
    expect(m.plan(m.read(col, empty), 0, m.initialState()).events.filter((e) => e.voice !== 'light')).toEqual([]);
  });

  it('summary gives the light under the needle and its change from the year before', () => {
    const prev = column((lat) => (lat > 35 && lat < 50 ? 20 : NaN));
    const now = column((lat) => (lat > 35 && lat < 50 ? 25 : NaN));
    const s = Object.fromEntries(m.summary(m.read(now, prev)).map((x) => [x.voice, x]));
    expect(s.light.value).toBeCloseTo(25, 5);
    expect(s.new.value).toBeCloseTo(0.25, 5);
    expect(s.new.unit).toBe('change');
    expect(s.out.value).toBe(0);
  });
});
