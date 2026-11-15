import { describe, expect, it } from 'vitest';
import { periodKey, seriesThrough, sparkPaths, stepMeans, xTickIndices } from './series.js';

describe('series', () => {
  it('computes area-weighted global means per step, skipping no-data', () => {
    const g = { steps: 2, lats: 2, lons: 2, scale: 1, noData: 255 };
    // row 0 = 89 N, row 1 = 87 N; step 0: all 10; step 1: one cell 20, rest no-data
    const bytes = new Uint8Array([10, 10, 10, 10, 20, 255, 255, 255]);
    const means = stepMeans(bytes, g);
    expect(means[0]).toBeCloseTo(10, 6);
    expect(means[1]).toBeCloseTo(20, 6);
  });

  it('reads only layer 0 of a layered grid', () => {
    const g = { steps: 1, lats: 1, lons: 1, layers: 2, scale: 1, noData: 255 };
    const bytes = new Uint8Array([40, 80]);
    expect(stepMeans(bytes, g)[0]).toBe(40);
  });

  it('buckets means by month through the current step', () => {
    const means = new Float64Array([10, 12, 20, 22]);
    const dates = ['2007-03-01T00:00Z', '2007-03-15T00:00Z', '2007-04-01T00:00Z', '2007-04-20T00:00Z'];
    expect(seriesThrough(means, dates, 1, 'month')).toEqual([{ key: '2007-03', value: 11 }]);
    expect(seriesThrough(means, dates, 3, 'month')).toEqual([
      { key: '2007-03', value: 11 },
      { key: '2007-04', value: 21 },
    ]);
    expect(periodKey(dates[0], 'year')).toBe('2007');
  });

  it('labels several X periods, first and last included', () => {
    const months = ['2007-03', '2007-04', '2007-05', '2007-06', '2007-07', '2007-08', '2007-09', '2007-10', '2007-11', '2007-12', '2008-01', '2008-02', '2008-03'];
    expect(xTickIndices(months, 'month')).toEqual([0, 3, 6, 9, 12]);
    const years = Array.from({ length: 12 }, (_, i) => String(2012 + i));
    const yearTicks = xTickIndices(years, 'year');
    expect(yearTicks[0]).toBe(0);
    expect(yearTicks[yearTicks.length - 1]).toBe(11);
    // 2021 and 2023 are two steps apart: that pair must not both be labelled.
    for (let i = 1; i < yearTicks.length; i++) expect(yearTicks[i] - yearTicks[i - 1]).toBeGreaterThanOrEqual(3);
  });

  it('labels long monthly series by January (years)', () => {
    const keys = [];
    for (let y = 2017; y <= 2023; y++) for (let m = 1; m <= 12; m++) keys.push(`${y}-${String(m).padStart(2, '0')}`);
    const ticks = xTickIndices(keys, 'month');
    expect(ticks.length).toBeLessThanOrEqual(5);
    expect(ticks.every((i) => keys[i].endsWith('-01'))).toBe(true);
  });

  it('keeps chart size fixed while X fills the plot as points grow', () => {
    const pad = { l: 30, r: 8, t: 4, b: 16 };
    const a = sparkPaths([1, 2], 220, 72, pad);
    const b = sparkPaths([1, 2, 3, 4], 220, 72, pad);
    expect(a.lastX).toBeCloseTo(212, 1);
    expect(b.lastX).toBeCloseTo(212, 1);
    expect(a.plot.x0).toBe(30);
    expect(a.firstY).toBeGreaterThan(b.lastY); // 1 is below 4 on a rising series
    expect(a.line.startsWith('M')).toBe(true);
    expect(b.area.endsWith('Z')).toBe(true);
  });
});
