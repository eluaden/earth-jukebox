import { bandWeightedLat, cellCenterLat } from './grid.js';

// The column under the needle is split into three zones, one voice each, and every zone into two
// latitude bands (one note each). Bands are [north edge, south edge] in degrees.
export const ZONES = [
  { id: 'north', voice: 'strings', bands: [[80, 45], [45, 23.5]] },
  { id: 'tropics', voice: 'piano', bands: [[23.5, 0], [0, -23.5]] },
  { id: 'south', voice: 'glock', bands: [[-23.5, -45], [-45, -80]] },
];

const MIN_CELLS = 2; // ocean cells (2 degrees each) needed for a value

function meanOf(col, north, south) {
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
  return n >= MIN_CELLS ? sum / n : NaN;
}

/** Column of 90 temperatures (NaN = land / no data) -> zone and band values. */
export function zonesFromColumn(col) {
  return ZONES.map((z) => ({
    id: z.id,
    voice: z.voice,
    mean: meanOf(col, z.bands[0][0], z.bands[1][1]),
    bands: z.bands.map(([north, south]) => ({
      lat: bandWeightedLat(col, north, south),
      temp: meanOf(col, north, south),
    })),
  }));
}
