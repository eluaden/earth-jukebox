import { describe, expect, it } from 'vitest';
import { DUST_RADII, cameraDistance, dustPositions } from './layout.js';

describe('dustPositions', () => {
  const { positions, sizes, seeds } = dustPositions(500);

  it('keeps every grain inside the shell, beyond the camera once the opening ends', () => {
    const closestCamera = Math.max(cameraDistance(16 / 9), cameraDistance(9 / 19.5));
    expect(DUST_RADII[0]).toBeGreaterThan(closestCamera + 3);
    for (let i = 0; i < positions.length; i += 3) {
      const r = Math.hypot(positions[i], positions[i + 1], positions[i + 2]);
      expect(r).toBeGreaterThanOrEqual(DUST_RADII[0] - 1e-4);
      expect(r).toBeLessThanOrEqual(DUST_RADII[1] + 1e-4);
    }
  });

  it('gives each grain a size and a seed', () => {
    expect(sizes.length).toBe(500);
    expect(seeds.length).toBe(500);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(1);
    expect(Math.max(...seeds)).toBeLessThan(1);
  });
});
