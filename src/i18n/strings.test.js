import { describe, expect, it } from 'vitest';
import { STRINGS, t } from './strings.js';
import { SST_TEXT } from './tracks/sst.js';

function shape(v) {
  if (Array.isArray(v)) return v.map(shape);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map((k) => [k, shape(v[k])]));
  return typeof v;
}

describe('translations', () => {
  it('interface strings have the same keys in EN, PT and ES', () => {
    expect(shape(STRINGS.pt)).toEqual(shape(STRINGS.en));
    expect(shape(STRINGS.es)).toEqual(shape(STRINGS.en));
  });

  it('track texts have the same structure in EN, PT and ES', () => {
    expect(shape(SST_TEXT.pt)).toEqual(shape(SST_TEXT.en));
    expect(shape(SST_TEXT.es)).toEqual(shape(SST_TEXT.en));
  });

  it('fills placeholders', () => {
    expect(t('pt', 'mute', { voice: 'Cordas' })).toBe('Silenciar Cordas');
    expect(t('en', 'missing.key')).toBe('missing.key');
  });
});
