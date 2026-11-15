import { describe, expect, it } from 'vitest';
import { bandWeightedLat, cellCenterLat, decodeValue, lonToIndex, readColumn } from './grid.js';
import { lonUnderNeedle } from './needle.js';
import { ZONES, zonesFromColumn } from './zones.js';

describe('grid', () => {
  it('decodes stored bytes to degrees C, 255 = no data', () => {
    expect(decodeValue(254)).toBeCloseTo(32, 3);
    expect(decodeValue(0)).toBe(0);
    expect(Number.isNaN(decodeValue(255))).toBe(true);
  });

  it('reads the north-to-south column of one step and longitude', () => {
    const g = { lats: 90, lons: 180 };
    const bytes = new Uint8Array(2 * 90 * 180);
    for (let s = 0; s < 2; s++)
      for (let j = 0; j < 90; j++)
        for (let i = 0; i < 180; i++) bytes[(s * 90 + j) * 180 + i] = s === 1 && i === 7 ? j : 200;
    const col = readColumn(bytes, 1, 7, g);
    expect(col.length).toBe(90);
    expect(col[0]).toBe(0);
    expect(col[89]).toBeCloseTo(89 * 0.125984, 4);
  });

  it('maps longitude to 2-degree columns, wrapping at the date line', () => {
    expect(lonToIndex(-180)).toBe(0);
    expect(lonToIndex(-178.1)).toBe(0);
    expect(lonToIndex(179.9)).toBe(179);
    expect(lonToIndex(180)).toBe(0);
    expect(lonToIndex(-181)).toBe(179);
  });

  it('gives the centre latitude of each row', () => {
    expect(cellCenterLat(0)).toBe(89);
    expect(cellCenterLat(89)).toBe(-89);
  });

  it('weights the flash latitude by positive cell values inside the band', () => {
    const col = Float32Array.from({ length: 90 }, () => 0);
    col[56] = 40; // cell centre -23° (São Paulo–ish)
    expect(bandWeightedLat(col, -20, -45)).toBe(-23);
    expect(bandWeightedLat(col, 70, 50)).toBe(60); // empty band -> geometric mid
  });
});

describe('needle', () => {
  it('reads longitude -90 when the globe is not rotated (three.js sphere, camera on +Z)', () => {
    expect(lonUnderNeedle(0)).toBeCloseTo(-90, 6);
    expect(lonUnderNeedle(-Math.PI / 2)).toBeCloseTo(0, 6);
    expect(Math.abs(lonUnderNeedle(Math.PI / 2))).toBeCloseTo(180, 6);
  });

  it('sweeps eastwards (Pacific, Americas, Atlantic) as the globe turns clockwise', () => {
    const a = lonUnderNeedle(0.2);
    const b = lonUnderNeedle(0);
    const c = lonUnderNeedle(-0.2);
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });

  it('always returns a longitude in [-180, 180)', () => {
    for (let r = -30; r <= 30; r += 0.37) {
      const lon = lonUnderNeedle(r);
      expect(lon).toBeGreaterThanOrEqual(-180);
      expect(lon).toBeLessThan(180);
    }
  });
});

describe('zones', () => {
  const empty = () => new Float32Array(90).fill(NaN);
  const rowOf = (lat) => (89 - lat) / 2;

  it('has three voices, two latitude bands each', () => {
    expect(ZONES.map((z) => z.voice)).toEqual(['strings', 'piano', 'glock']);
    for (const z of ZONES) expect(z.bands.length).toBe(2);
  });

  it('keeps every value NaN over land without throwing', () => {
    const zones = zonesFromColumn(empty());
    expect(zones.length).toBe(3);
    for (const z of zones) {
      expect(Number.isNaN(z.mean)).toBe(true);
      for (const b of z.bands) expect(Number.isNaN(b.temp)).toBe(true);
    }
  });

  it('averages the ocean cells of each band and places the flash at the value-weighted latitude', () => {
    const col = empty();
    for (const lat of [61, 63, 65]) col[rowOf(lat)] = 20;
    col[rowOf(1)] = 27;
    col[rowOf(3)] = 29;
    const [north, tropics] = zonesFromColumn(col);
    expect(north.bands[0].temp).toBe(20);
    expect(north.bands[0].lat).toBe(63); // (61+63+65)/3, not the geometric mid of [80, 45]
    expect(Number.isNaN(north.bands[1].temp)).toBe(true);
    expect(north.mean).toBe(20);
    expect(tropics.bands[0].temp).toBe(28);
  });

  it('needs at least two ocean cells for a band value', () => {
    const col = empty();
    col[rowOf(61)] = 20;
    expect(Number.isNaN(zonesFromColumn(col)[0].bands[0].temp)).toBe(true);
  });
});
