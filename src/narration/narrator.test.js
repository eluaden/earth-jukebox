import { describe, expect, it } from 'vitest';
import { captionLines } from './narrator.js';
import { lineKey } from './key.js';
import { SST_TEXT } from '../i18n/tracks/sst.js';

describe('captionLines', () => {
  const lines = Object.values(SST_TEXT).flatMap((t) => Object.values(t.narration));

  it('splits every narration line into captions of at most 46 characters', () => {
    for (const text of lines) for (const l of captionLines(text)) expect(l.text.length).toBeLessThanOrEqual(46);
  });

  it('keeps every word, in order', () => {
    for (const text of lines) {
      const parts = captionLines(text);
      expect(parts.map((p) => p.text).join(' ')).toBe(text);
      for (let i = 1; i < parts.length; i++) expect(parts[i].start).toBeGreaterThan(parts[i - 1].start);
    }
  });
});

describe('lineKey', () => {
  it('is a stable 16-hex key per language and text', () => {
    const k = lineKey('en', 'One year of ocean has passed under the needle.');
    expect(k).toMatch(/^[0-9a-f]{16}$/);
    expect(lineKey('en', 'One year of ocean has passed under the needle.')).toBe(k);
    expect(lineKey('pt', 'One year of ocean has passed under the needle.')).not.toBe(k);
  });
});
