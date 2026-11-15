// The grid written by every track pipeline (scripts/pipeline/<id>.py):
// uint8[step][lat][lon], lat 0 = 90-88 N, lon 0 = 180-178 W; value q -> q * scale, 255 = no data.
// A layered grid (grid.layers > 1, aerosols) is uint8[step][layer][lat][lon]: its column holds every
// layer's 90 rows back to back.

export const DEFAULT_GRID = { lats: 90, lons: 180, scale: 0.125984, noData: 255 };

export function decodeValue(q, scale = DEFAULT_GRID.scale, noData = DEFAULT_GRID.noData) {
  return q === noData ? NaN : q * scale;
}

/** North-to-south column (one value per 2-degree row, per layer) at one step and longitude column. */
export function readColumn(bytes, step, lonIdx, g = DEFAULT_GRID) {
  const { lats, lons } = g;
  const rows = lats * (g.layers ?? 1);
  const scale = g.scale ?? DEFAULT_GRID.scale;
  const noData = g.noData ?? DEFAULT_GRID.noData;
  const out = new Float32Array(rows);
  const base = step * rows * lons + lonIdx;
  for (let j = 0; j < rows; j++) out[j] = decodeValue(bytes[base + j * lons], scale, noData);
  return out;
}

/** Longitude in degrees (any range) -> 2-degree column 0..179. */
export function lonToIndex(lon, lons = DEFAULT_GRID.lons) {
  const wrapped = (((lon + 180) % 360) + 360) % 360;
  return Math.floor((wrapped / 360) * lons) % lons;
}

export function cellCenterLat(j) {
  return 89 - 2 * j;
}

/**
 * Latitude for a needle flash in [south, north): weighted by positive cell values.
 * Pulls the point toward where the data is (e.g. city lights), not the geometric band centre.
 * Falls back to the mid-latitude of the band when nothing weighs.
 */
export function bandWeightedLat(col, north, south) {
  let wSum = 0;
  let latSum = 0;
  for (let j = 0; j < col.length; j++) {
    const lat = cellCenterLat(j);
    const v = col[j];
    if (lat < north && lat >= south && Number.isFinite(v) && v > 0) {
      wSum += v;
      latSum += lat * v;
    }
  }
  return wSum > 0 ? latSum / wSum : (north + south) / 2;
}
