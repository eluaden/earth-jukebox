import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const sfxDir = join(root, 'public/sfx');

const REQUIRED = [
  'needle-drop.mp3',
  'needle-lift.mp3',
  'platter-spin-up.mp3',
  'record-swap.mp3',
  'glass-tap.mp3',
  'space-whoosh.mp3',
  'vinyl-crackle-loop.mp3',
];

describe('public/sfx (S1–S7)', () => {
  it('ships every effect the engine expects', () => {
    const files = new Set(readdirSync(sfxDir));
    for (const name of REQUIRED) expect(files.has(name), name).toBe(true);
  });
});
