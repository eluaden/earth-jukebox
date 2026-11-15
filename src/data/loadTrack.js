/** Loads public/tracks/<id>/track.json and its grid.bin (written by scripts/pipeline/<id>.py). */
export async function loadTrack(id, base) {
  const dir = `${base}tracks/${id}/`;
  const meta = await (await fetch(`${dir}track.json`)).json();
  const buf = await (await fetch(`${dir}${meta.grid.file}`)).arrayBuffer();
  const grid = new Uint8Array(buf);
  const want = meta.grid.steps * meta.grid.lats * meta.grid.lons;
  if (grid.length !== want) throw new Error(`${id}: grid has ${grid.length} bytes, expected ${want}`);
  return { meta, grid, dir };
}

/** NASA colour bar colour for a temperature (stops every 1 degree, from track.json). */
export function legendColor(meta, t) {
  const stops = meta.legend.stops;
  if (!Number.isFinite(t)) return '#ffffff';
  const i = Math.min(stops.length - 1, Math.max(0, Math.round(t - stops[0][0])));
  return stops[i][1];
}
