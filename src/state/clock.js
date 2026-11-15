// The NASA video's currentTime is the data clock: frame = floor(t * fps), step = floor(frame / stepEvery).

export function stepFromTime(t, meta) {
  if (!Number.isFinite(t)) return 0;
  const frame = Math.floor(t * meta.video.fps);
  const step = Math.floor(frame / meta.grid.stepEvery);
  return Math.min(meta.grid.steps - 1, Math.max(0, step));
}

export function clampTime(t, duration, fps) {
  return Math.min(duration - 1 / fps, Math.max(0, t));
}

const MAX_NORMAL_ADVANCE = 3; // steps between two animation frames; more than this is a seek

/** A narration marker fires once, when normal playback crosses its step (not on loops or seeks). */
export function shouldFireMarker(markerStep, prevStep, step, fired, id) {
  if (fired.has(id)) return false;
  if (step < prevStep || step - prevStep > MAX_NORMAL_ADVANCE) return false;
  return prevStep < markerStep && markerStep <= step;
}
