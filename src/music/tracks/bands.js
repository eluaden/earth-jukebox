import { cellCenterLat } from '../../data/grid.js';

export { bandWeightedLat } from '../../data/grid.js';

/** Mean of the cells of a column (index 0 = 89 N) whose centre lies in [south, north); NaN if none has data. */
export function bandMean(col, north, south) {
  let sum = 0;
  let n = 0;
  for (let j = 0; j < col.length; j++) {
    const lat = cellCenterLat(j);
    const v = col[j];
    if (lat < north && lat >= south && Number.isFinite(v)) {
      sum += v;
      n++;
    }
  }
  return n ? sum / n : NaN;
}

/** Offsets (fractions of the pulse) that spread n notes as an arpeggio instead of a chord. */
export function arpeggio(n) {
  return Array.from({ length: n }, (_, k) => k / n);
}
