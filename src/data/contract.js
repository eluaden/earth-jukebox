/**
 * TRACK CONTRACT — the boundary between src/data (extraction) and src/audio (sound).
 *
 * Do not change required fields without telling the whole team.
 * Optional fields may be added; consumers must ignore fields they don't know.
 *
 * @typedef {{en: string, pt?: string, es?: string}} I18nText
 *
 * @typedef {Object} LayerMapping
 * @property {'drone'|'texture'|'pulse'} layer  Which sound layer this series drives.
 * @property {I18nText} meaning   Plain-language mapping, e.g. "lower pitch = less ice".
 * @property {{min: I18nText, max: I18nText}} [legend]  What the min / max sound represent
 *            (used by the audio legend: "this is the least ice... this is the most").
 * @property {'high'|'low'} [loudWhen]  texture only: grow louder when the value is high
 *            (default) or low.
 * @property {{min: string, max: string}} [physicalRange]  Real-world values for 0 and 1,
 *            e.g. {"min": "3.4 million km²", "max": "7.5 million km²"}.
 *
 * @typedef {Object} TrackEvent
 * @property {number} frame   0-based frame index.
 * @property {'record'|'milestone'|string} type  record -> bell; milestone -> accented pulse.
 * @property {I18nText} [say] Narration spoken at this frame (step 3).
 *
 * @typedef {Object} Track
 * @property {string} id
 * @property {I18nText} title
 * @property {string} source            NASA dataset name + URL.
 * @property {number} secondsPerFrame
 * @property {string[]} frames          Image file names relative to the track folder (may be
 *                                      empty for synthetic tracks; otherwise one per label).
 * @property {string[]} labels          One label per frame (e.g. years).
 * @property {Object<string, (number|null)[]>} series  Normalized 0..1 values, one per frame.
 *                                      null = no data for that frame (layer holds its value).
 * @property {Object<string, LayerMapping>} mapping    Keyed by series name.
 * @property {TrackEvent[]} [events]
 * @property {{intro?: I18nText, outro?: I18nText}} [narration]
 * @property {boolean} [placeholder]    true = NOT real data. UI must say so.
 * @property {Object} [extraction]      Instead of `series`: how to read the series from the frames
 *                                      (color legend, regions, range). See src/data/extract.js.
 *                                      The loader fills `series`, `values` and `coverage`.
 * @property {Object<string, (number|null)[]>} [values]  Physical values behind each series.
 * @property {{file: string, times: number[]}} [video]  The NASA video the frames were taken
 *                                      from; times[i] = video time (s) of frame i. The player
 *                                      shows it in sync with the sound instead of still frames.
 * @property {number} [clockEvery]      Tick every N frames instead of every frame (default 1).
 * @property {boolean} [clock]          Default true: the pulse layer ticks once per frame
 *                                      (time), accented on "milestone" events. If a series is
 *                                      mapped to "pulse", it also sets the tick pitch.
 */

export const LAYER_TYPES = ['drone', 'texture', 'pulse'];
export const MAX_LAYERS = 3;

/** Returns a list of human-readable problems. Empty list = valid. */
export function validateTrack(t) {
  const errors = [];
  const err = (m) => errors.push(m);

  if (!t || typeof t !== 'object') return ['track is not an object'];
  if (typeof t.id !== 'string' || !t.id) err('id must be a non-empty string');
  if (!t.title || typeof t.title.en !== 'string') err('title.en is required');
  if (typeof t.source !== 'string') err('source is required');
  if (!(t.secondsPerFrame > 0)) err('secondsPerFrame must be > 0');
  if (!Array.isArray(t.labels) || t.labels.length === 0) err('labels must be a non-empty array');
  const n = Array.isArray(t.labels) ? t.labels.length : 0;

  if (!Array.isArray(t.frames)) err('frames must be an array');
  else if (t.frames.length !== 0 && t.frames.length !== n)
    err(`frames has ${t.frames.length} items but labels has ${n}`);

  const series = t.series || {};
  for (const [key, values] of Object.entries(series)) {
    if (!Array.isArray(values)) { err(`series.${key} must be an array`); continue; }
    if (values.length !== n) err(`series.${key} has ${values.length} values, expected ${n}`);
    values.forEach((v, i) => {
      if (v !== null && !(typeof v === 'number' && v >= 0 && v <= 1))
        err(`series.${key}[${i}] = ${v} is not in 0..1 (or null)`);
    });
  }

  const mapping = t.mapping || {};
  const usedLayers = new Set();
  for (const [key, m] of Object.entries(mapping)) {
    if (!(key in series)) err(`mapping.${key} has no matching series`);
    if (!LAYER_TYPES.includes(m.layer)) err(`mapping.${key}.layer must be one of ${LAYER_TYPES}`);
    if (usedLayers.has(m.layer)) err(`layer "${m.layer}" is used by more than one series`);
    usedLayers.add(m.layer);
    if (!m.meaning || typeof m.meaning.en !== 'string') err(`mapping.${key}.meaning.en is required`);
  }
  if (usedLayers.size === 0) err('mapping must map at least one series to a layer');
  if (usedLayers.size > MAX_LAYERS) err(`at most ${MAX_LAYERS} layers per track`);

  (t.events || []).forEach((e, i) => {
    if (!Number.isInteger(e.frame) || e.frame < 0 || e.frame >= n)
      err(`events[${i}].frame out of range`);
  });

  return errors;
}

/** Number of frames (time steps) in a track. */
export function frameCount(t) {
  return t.labels.length;
}
