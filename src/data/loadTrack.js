import { validateTrack } from './contract.js';
import { extractTrack } from './extract.js';

const BASE = import.meta.env.BASE_URL; // './' in build, '/' in dev — works on any host path

export function trackUrl(id, file = 'track.json') {
  return `${BASE}tracks/${id}/${file}`;
}

/** Loads the list of track ids from public/tracks/index.json. */
export async function loadTrackIndex() {
  const res = await fetch(`${BASE}tracks/index.json`);
  if (!res.ok) throw new Error(`Could not load track index (${res.status})`);
  return res.json();
}

/**
 * Loads and validates one track.
 * If the track has an `extraction` block (frames + color legend) instead of precomputed
 * series, the series are read from the frames' pixels here, in the browser.
 * Either way, callers always receive a contract-valid Track.
 */
export async function loadTrack(id) {
  const res = await fetch(trackUrl(id));
  if (!res.ok) throw new Error(`Could not load track "${id}" (${res.status})`);
  const track = await res.json();
  if (track.extraction) await extractTrack(track, (file) => trackUrl(id, file));
  const errors = validateTrack(track);
  if (errors.length) throw new Error(`Track "${id}" is invalid:\n- ${errors.join('\n- ')}`);
  return track;
}
