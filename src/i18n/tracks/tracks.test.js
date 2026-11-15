import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { SST_TEXT } from './sst.js';
import { LIGHTNING_TEXT } from './lightning.js';
import { NIGHT_LIGHTS_TEXT } from './nightLights.js';
import { AEROSOLS_TEXT } from './aerosols.js';

const TEXTS = { sst: SST_TEXT, lightning: LIGHTNING_TEXT, 'night-lights': NIGHT_LIGHTS_TEXT, aerosols: AEROSOLS_TEXT };

function shape(v) {
  if (Array.isArray(v)) return v.map(shape);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, shape(v[k])]));
  return typeof v;
}

const track = (id) => JSON.parse(readFileSync(new URL(`../../../public/tracks/${id}/track.json`, import.meta.url), 'utf8'));

describe('track texts', () => {
  for (const [id, text] of Object.entries(TEXTS)) {
    it(`${id}: same structure in EN, PT and ES`, () => {
      expect(shape(text.pt)).toEqual(shape(text.en));
      expect(shape(text.es)).toEqual(shape(text.en));
    });

    it(`${id}: a narration line for every marker the pipeline found, plus intro and outro`, () => {
      const ids = ['intro', 'outro', ...track(id).markers.map((m) => m.id)];
      for (const lang of ['en', 'pt', 'es']) expect(Object.keys(text[lang].narration).sort()).toEqual([...new Set(ids)].sort());
    });
  }
});
