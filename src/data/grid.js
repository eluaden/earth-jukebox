// The temperature grid written by scripts/pipeline/sst.py:
// uint8[step][lat][lon], lat 0 = 90-88 N, lon 0 = 180-178 W; value q -> q * scale degrees C, 255 = no data.

export const DEFAULT_GRID = { lats: 90, lons: 180, scale: 0.125984, noData: 255 };

export function decodeValue(q, scale = DEFAULT_GRID.scale, noData = DEFAULT_GRID.noData) {
  return q === noData ? NaN : q * scale;
}

/** North-to-south column (one value per 2-degree row) at one step and longitude column. */
export function readColumn(bytes, step, lonIdx, g = DEFAULT_GRID) {
  const { lats, lons } = g;
  const scale = g.scale ?? DEFAULT_GRID.scale;
  const noData = g.noData ?? DEFAULT_GRID.noData;
  const out = new Float32Array(lats);
  const base = step * lats * lons + lonIdx;
  for (let j = 0; j < lats; j++) out[j] = decodeValue(bytes[base + j * lons], scale, noData);
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
