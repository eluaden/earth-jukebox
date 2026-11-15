import { describe, expect, it } from 'vitest';
import { MAX_NOTES_PER_VOICE, MAX_NOTES_TOTAL, SCALE, emptyHeld, noteFor, planTick, tempToDegree, velocityFor } from './mapping.js';
import { isAudible } from './mix.js';

const band = (lat, temp) => ({ lat, temp });
const zones = (n0, n1, t0, t1, s0, s1) => [
  { id: 'north', voice: 'strings', mean: NaN, bands: [band(62.5, n0), band(34.25, n1)] },
  { id: 'tropics', voice: 'piano', mean: NaN, bands: [band(11.75, t0), band(-11.75, t1)] },
  { id: 'south', voice: 'glock', mean: NaN, bands: [band(-34.25, s0), band(-62.5, s1)] },
];

describe('temperature to note', () => {
  it('uses one 16-note C major pentatonic for every voice', () => {
    expect(SCALE).toEqual([48, 50, 52, 55, 57, 60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84]);
    expect(tempToDegree(0)).toBe(0);
    expect(tempToDegree(32)).toBe(15);
    expect(tempToDegree(-3)).toBe(0);
    expect(tempToDegree(40)).toBe(15);
  });

  it('known latitude and value give the expected note (direcionamento 17.2)', () => {
    expect(noteFor('strings', 0)).toBe(48);
    expect(noteFor('strings', 32)).toBe(84);
    expect(noteFor('glock', 0)).toBe(72);
    expect(noteFor('piano', 27.8)).toBe(79);
    const { events } = planTick(zones(10, NaN, NaN, NaN, NaN, NaN), 1, emptyHeld());
    expect(events).toEqual([
      expect.objectContaining({ voice: 'strings', kind: 'attack', midi: 60, lat: 62.5, temp: 10, band: 0 }),
    ]);
  });

  it('makes warmer water louder', () => {
    expect(velocityFor(30)).toBeGreaterThan(velocityFor(5));
    expect(velocityFor(0)).toBeCloseTo(0.35, 6);
  });
});

describe('planTick', () => {
  it('holds a string note while the value stays on the same degree', () => {
    const z = zones(10, 20, NaN, NaN, NaN, NaN);
    let r = planTick(z, 1, emptyHeld());
    expect(r.events.filter((e) => e.kind === 'attack').length).toBe(2);
    r = planTick(z, 3, r.held);
    expect(r.events.length).toBe(0);
  });

  it('releases and re-attacks strings when the degree changes', () => {
    let r = planTick(zones(10, NaN, NaN, NaN, NaN, NaN), 1, emptyHeld());
    r = planTick(zones(20, NaN, NaN, NaN, NaN, NaN), 3, r.held);
    expect(r.events.map((e) => [e.kind, e.midi])).toEqual([['release', 60], ['attack', noteFor('strings', 20)]]);
  });

  it('arpeggiates the piano and plays the glockenspiel on even ticks only', () => {
    const z = zones(NaN, NaN, 27, 28, 15, 5);
    const at = (tick) => planTick(z, tick, emptyHeld()).events.map((e) => [e.voice, e.band]);
    expect(at(0)).toEqual([['piano', 0], ['glock', 0]]);
    expect(at(1)).toEqual([['piano', 1]]);
    expect(at(2)).toEqual([['piano', 0], ['glock', 1]]);
  });

  it('only releases (never plays NaN) when the needle moves onto land', () => {
    let r = planTick(zones(10, 12, 27, 28, 15, 5), 0, emptyHeld());
    r = planTick(zones(NaN, NaN, NaN, NaN, NaN, NaN), 1, r.held);
    expect(r.events.every((e) => e.kind === 'release')).toBe(true);
    expect(r.events.length).toBe(2);
    for (const e of r.events) expect(Number.isFinite(e.midi)).toBe(true);
  });

  it('never exceeds 2 notes per voice or 6 in total (direcionamento 6.3)', () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const v = () => (rand() < 0.25 ? NaN : rand() * 32);
    let held = emptyHeld();
    const sounding = { strings: 0 };
    for (let tick = 0; tick < 800; tick++) {
      const r = planTick(zones(v(), v(), v(), v(), v(), v()), tick, held);
      held = r.held;
      const starts = r.events.filter((e) => e.kind !== 'release');
      expect(starts.length).toBeLessThanOrEqual(MAX_NOTES_TOTAL);
      for (const voice of ['strings', 'piano', 'glock'])
        expect(starts.filter((e) => e.voice === voice).length).toBeLessThanOrEqual(MAX_NOTES_PER_VOICE);
      for (const e of r.events) {
        if (e.voice !== 'strings') continue;
        sounding.strings += e.kind === 'attack' ? 1 : -1;
      }
      expect(sounding.strings).toBeLessThanOrEqual(MAX_NOTES_PER_VOICE);
      expect(sounding.strings).toBeGreaterThanOrEqual(0);
      for (const e of r.events) expect(Number.isFinite(e.midi)).toBe(true);
    }
  });
});

describe('isAudible', () => {
  const none = { strings: false, piano: false, glock: false };
  it('plays everything by default', () => {
    expect(isAudible('piano', none, none)).toBe(true);
  });
  it('silences muted voices', () => {
    expect(isAudible('piano', { ...none, piano: true }, none)).toBe(false);
    expect(isAudible('glock', { ...none, piano: true }, none)).toBe(true);
  });
  it('plays only soloed voices when any solo is on', () => {
    const solo = { ...none, glock: true };
    expect(isAudible('glock', none, solo)).toBe(true);
    expect(isAudible('strings', none, solo)).toBe(false);
  });
});
