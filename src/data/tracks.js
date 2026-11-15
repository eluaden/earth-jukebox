import { loadTrackIndex, loadTrackMeta, loadTrack } from './loadTrack.js';

/**
 * The record collection. To add a track, add its folder to public/tracks/ and its id to
 * public/tracks/index.json: the landing sleeves and the record list are built from this list.
 *
 * loadCatalog() -> light metadata of every track (no frames read yet).
 * getTrack(id)  -> the full track, with its series read from the frames (cached).
 */
export async function loadCatalog() {
  const ids = await loadTrackIndex();
  const metas = await Promise.all(ids.map((id) => loadTrackMeta(id).catch((e) => { console.error(e); return null; })));
  return metas.filter(Boolean);
}

const cache = new Map();
export function getTrack(id) {
  if (!cache.has(id)) cache.set(id, loadTrack(id).catch((e) => { cache.delete(id); throw e; }));
  return cache.get(id);
}

/** Which series plays which sound layer: { tone, wind, pulse } -> series key (or undefined). */
export function roles(track) {
  const r = {};
  for (const [key, m] of Object.entries(track.mapping)) {
    if (m.layer === 'drone') r.tone = key;
    else if (m.layer === 'texture') r.wind = key;
    else if (m.layer === 'pulse') r.pulse = key;
  }
  return r;
}
