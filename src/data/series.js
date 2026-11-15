import { cellCenterLat, DEFAULT_GRID, decodeValue } from './grid.js';

/**
 * Area-weighted global mean of every grid step (layer 0 when the grid has layers).
 * Cells with no data are skipped; latitude weight is cos(lat) so polar rows don't dominate.
 */
export function stepMeans(bytes, g = DEFAULT_GRID) {
  const { steps, lats, lons } = g;
  const layers = g.layers ?? 1;
  const scale = g.scale ?? DEFAULT_GRID.scale;
  const noData = g.noData ?? DEFAULT_GRID.noData;
  const weights = new Float64Array(lats);
  for (let j = 0; j < lats; j++) weights[j] = Math.cos((cellCenterLat(j) * Math.PI) / 180);

  const out = new Float64Array(steps);
  const stepStride = layers * lats * lons;
  for (let s = 0; s < steps; s++) {
    let sum = 0;
    let wSum = 0;
    const base = s * stepStride; // layer 0 only
    for (let j = 0; j < lats; j++) {
      const w = weights[j];
      const row = base + j * lons;
      for (let i = 0; i < lons; i++) {
        const v = decodeValue(bytes[row + i], scale, noData);
        if (!Number.isFinite(v)) continue;
        sum += v * w;
        wSum += w;
      }
    }
    out[s] = wSum > 0 ? sum / wSum : NaN;
  }
  return out;
}

/** Period key for one ISO date: 'YYYY-MM', 'YYYY', or the raw string for 'step'. */
export function periodKey(iso, bucket) {
  if (bucket === 'year') return iso.slice(0, 4);
  if (bucket === 'month') return iso.slice(0, 7);
  return String(iso);
}

/**
 * Means for steps 0..step, aggregated into month/year/step buckets in chronological order.
 * Incomplete current periods use only the steps reached so far.
 */
export function seriesThrough(means, dates, step, bucket) {
  const last = Math.min(step, means.length - 1);
  if (last < 0) return [];
  const order = [];
  const acc = new Map();
  for (let i = 0; i <= last; i++) {
    const v = means[i];
    if (!Number.isFinite(v)) continue;
    const key = periodKey(dates[i], bucket);
    let b = acc.get(key);
    if (!b) {
      b = { sum: 0, n: 0 };
      acc.set(key, b);
      order.push(key);
    }
    b.sum += v;
    b.n++;
  }
  return order.map((key) => {
    const b = acc.get(key);
    return { key, value: b.sum / b.n };
  });
}

// Centre-to-centre gap, as a fraction of the axis, below which two labels would touch
// (a 4-digit year is about 26px; the plot is about 230px).
const MIN_TICK_SEP = 0.24;

/** Drop interior ticks until every pair is at least MIN_TICK_SEP apart. First and last stay. */
function spreadTicks(indices, n) {
  const out = [...indices];
  const apart = (a, b) => (b - a) / (n - 1) >= MIN_TICK_SEP;
  let guard = out.length;
  while (guard-- > 0 && out.length > 2) {
    let drop = -1;
    for (let i = 1; i < out.length; i++) {
      if (apart(out[i - 1], out[i])) continue;
      drop = i === out.length - 1 ? i - 1 : i;
      if (drop === 0) drop = i;
      break;
    }
    if (drop <= 0 || drop >= out.length - 1) break;
    out.splice(drop, 1);
  }
  return out;
}

/**
 * Indices of the periods that get a label on the X axis (at most `max`, first and last included).
 * Long monthly series (more than 18 months) are labelled at each January, so the axis reads in years.
 * Neighbours closer than MIN_TICK_SEP are removed so labels never touch (e.g. 2021 against 2023).
 */
export function xTickIndices(keys, bucket, max = 5) {
  const n = keys.length;
  if (n <= 1) return n ? [0] : [];
  const january = bucket === 'month' && n > 18 ? keys.map((k, i) => (k.slice(5, 7) === '01' ? i : -1)).filter((i) => i >= 0) : [];
  const source = january.length > 1 ? january : [...Array(n).keys()];
  const step = Math.max(1, Math.ceil((source.length - 1) / (max - 1)));
  const picked = [];
  for (let k = 0; k < source.length; k += step) picked.push(source[k]);
  const last = source[source.length - 1];
  if (picked[picked.length - 1] !== last) picked.push(last);
  return spreadTicks(picked, n);
}

/**
 * Polyline and area path for a fixed-size chart: X fills the plot width, Y spans min..max
 * (with a floor range so a flat series still has room). `pad` may be a number or
 * `{ l, r, t, b }` so axis labels can sit outside the plot.
 */
export function sparkPaths(values, width = 200, height = 48, pad = 2) {
  const p = typeof pad === 'number' ? { l: pad, r: pad, t: pad, b: pad } : pad;
  const n = values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(max - min, Math.abs(max) * 0.02, 0.05);
  const mid = (min + max) / 2;
  const yLo = mid - span / 2;
  const yHi = mid + span / 2;
  const x0 = p.l;
  const x1 = width - p.r;
  const yTop = p.t;
  const yBot = height - p.b;
  const innerW = x1 - x0;
  const innerH = yBot - yTop;
  const yAt = (v) => yTop + innerH - ((v - yLo) / (yHi - yLo)) * innerH;
  const pts = values.map((v, i) => {
    const x = x0 + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    return [x, yAt(v)];
  });
  const line = pts.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0].toFixed(2)} ${pt[1].toFixed(2)}`).join(' ');
  const [lx, ly] = pts[pts.length - 1];
  const area = `${line} L${lx.toFixed(2)} ${yBot.toFixed(2)} L${pts[0][0].toFixed(2)} ${yBot.toFixed(2)} Z`;
  return {
    line,
    area,
    lastX: lx,
    lastY: ly,
    firstY: pts[0][1],
    min,
    max,
    plot: { x0, x1, yTop, yBot, yAt },
  };
}
