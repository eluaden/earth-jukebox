import { describe, expect, it } from 'vitest';
import { DUST_RADII, TIME_RING, cameraDistance, dustPositions, ringHintPlacement, ringLabelPlacement } from './layout.js';

describe('ringLabelPlacement', () => {
  const r = TIME_RING + 0.028;

  it('grows the hover date away from the ring instead of centering it on the ring', () => {
    const right = ringLabelPlacement(0.25);
    expect(right.position[0]).toBeCloseTo(r, 5);
    expect(right.position[1]).toBeCloseTo(0, 5);
    expect(right.transform).toBe('translate3d(calc(0.00%), calc(-50.00%), 0) translate(8.00px, 0.00px)');

    const left = ringLabelPlacement(0.75);
    expect(left.position[0]).toBeCloseTo(-r, 5);
    expect(left.transform).toBe('translate3d(calc(-100.00%), calc(-50.00%), 0) translate(-8.00px, 0.00px)');

    const top = ringLabelPlacement(0);
    expect(top.position[1]).toBeCloseTo(r, 5);
    expect(top.transform).toBe('translate3d(calc(-50.00%), calc(-100.00%), 0) translate(0.00px, -8.00px)');

    const bottom = ringLabelPlacement(0.5);
    expect(bottom.position[1]).toBeCloseTo(-r, 5);
    expect(bottom.transform).toBe('translate3d(calc(-50.00%), calc(0.00%), 0) translate(0.00px, 8.00px)');
  });
});

describe('ringHintPlacement', () => {
  it('puts a tutorial balloon wholly outside the ring, its nearest corner on the anchor', () => {
    const lowerRight = ringHintPlacement(0.375);
    expect(lowerRight.position[0]).toBeGreaterThan(TIME_RING * 0.7);
    expect(lowerRight.position[1]).toBeLessThan(-TIME_RING * 0.7);
    expect(lowerRight.transform).toBe('translate3d(0%, 0%, 0) translate(10px, 10px)');
    expect(lowerRight.tip).toBe('tl');

    const lowerLeft = ringHintPlacement(0.625);
    expect(lowerLeft.transform).toBe('translate3d(-100%, 0%, 0) translate(-10px, 10px)');
    expect(lowerLeft.tip).toBe('tr');
  });

  it('centres the balloon on its edge near an axis, the edge pointing at the ring', () => {
    const left = ringHintPlacement(0.7);
    expect(left.transform).toBe('translate3d(-100%, -50%, 0) translate(-10px, 0px)');
    expect(left.tip).toBe('r');

    const top = ringHintPlacement(0);
    expect(top.transform).toBe('translate3d(-50%, -100%, 0) translate(0px, -10px)');
    expect(top.tip).toBe('b');

    const bottom = ringHintPlacement(0.5);
    expect(bottom.transform).toBe('translate3d(-50%, 0%, 0) translate(0px, 10px)');
    expect(bottom.tip).toBe('t');
  });
});

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
