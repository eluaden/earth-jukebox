import { stepAtFrame, stepAtTime } from '../data/steps.js';

// The data clock. Video tracks: the NASA video's currentTime (frame = floor(t * fps), step from the
// frame, see src/data/steps.js). Still-image tracks (night lights): the app's own time,
// time.secondsPerStep per step, looping.

export const isStills = (meta) => meta.texture?.kind === 'stills';

/** Length of one pass through the record, in seconds. */
export function trackDuration(meta) {
  return isStills(meta) ? meta.grid.steps * meta.time.secondsPerStep : meta.video.duration;
}

/** Grid step at a time of the data clock. */
export function stepAt(meta, t) {
  if (isStills(meta)) return stepAtTime(meta, t);
  const frame = Math.floor((Number.isFinite(t) ? t : 0) * meta.video.fps);
  return Math.min(meta.grid.steps - 1, Math.max(0, stepAtFrame(meta, frame)));
}

/** First video frame of a step (video tracks). */
function frameOfStep(meta, s) {
  const g = meta.grid;
  if (Array.isArray(g.stepFrames)) return s < g.stepFrames.length ? g.stepFrames[s] : meta.video.frames;
  return Math.min(s * g.stepEvery, meta.video.frames);
}

/**
 * Time to seek to for a step (arrow keys): the middle of the step on video tracks, so a frame
 * boundary cannot land on the step before; the start of the step on still-image tracks, so the
 * year is heard whole.
 */
export function timeOfStep(meta, step) {
  const s = Math.min(meta.grid.steps - 1, Math.max(0, step));
  if (isStills(meta)) return s * meta.time.secondsPerStep + 0.01;
  const mid = (frameOfStep(meta, s) + frameOfStep(meta, s + 1)) / 2;
  return mid / meta.video.fps;
}

export function clampTime(t, duration, fps) {
  return Math.min(duration - 1 / fps, Math.max(0, t));
}

const TURN = 2 * Math.PI;

/**
 * Globe turn for a jump of the data clock, at most one turn and in the jump's direction: only the
 * angle under the needle matters, so a jump across the whole record does not spin the globe ten times.
 */
export function turnLimited(radians) {
  return Math.sign(radians) * (Math.abs(radians) % TURN);
}

const MAX_NORMAL_ADVANCE = 3; // steps between two animation frames; more than this is a seek

/** A narration marker fires once, when normal playback crosses its step (not on loops or seeks). */
export function shouldFireMarker(markerStep, prevStep, step, fired, id) {
  if (fired.has(id)) return false;
  if (step < prevStep || step - prevStep > MAX_NORMAL_ADVANCE) return false;
  return prevStep < markerStep && markerStep <= step;
}
