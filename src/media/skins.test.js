import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { STILLS_FADE, stillsFrame } from './skins.js';

const meta = JSON.parse(readFileSync(new URL('../../public/tracks/night-lights/track.json', import.meta.url), 'utf8'));
const per = meta.time.secondsPerStep;
const n = meta.grid.steps;

describe('stillsFrame (night lights: one picture per year)', () => {
  it('starts sharp on the first year of the first lap', () => {
    expect(stillsFrame(meta, 0, 0)).toEqual({ from: 0, to: 0, mix: 1 });
  });

  it('fades from the year before during the first seconds of a year', () => {
    const f = stillsFrame(meta, per + STILLS_FADE / 2, 0);
    expect(f.from).toBe(0);
    expect(f.to).toBe(1);
    expect(f.mix).toBeCloseTo(0.5);
  });

  it('holds the year once the fade is over', () => {
    expect(stillsFrame(meta, per * 3 + STILLS_FADE + 0.01, 0)).toEqual({ from: 3, to: 3, mix: 1 });
  });

  it('fades from the last year back to the first when the record loops', () => {
    const f = stillsFrame(meta, 0.3, 1);
    expect(f.from).toBe(n - 1);
    expect(f.to).toBe(0);
  });

  it('has one picture per data step', () => {
    expect(meta.texture.images).toHaveLength(n);
  });
});
