// Which grid step is playing. Three kinds of track time (see track.json):
// - grid.stepEvery: one step every N video frames (SST);
// - grid.stepFrames: the video frame where each step starts, when time is not uniform (lightning);
// - time.secondsPerStep: no video, one still image per step (night lights).

/** Step shown at a frame of the track's video. */
export function stepAtFrame(meta, frame) {
  const g = meta.grid;
  const f = Math.max(0, Math.floor(Number.isFinite(frame) ? frame : 0));
  if (Array.isArray(g.stepFrames)) {
    const s = g.stepFrames;
    let lo = 0;
    let hi = s.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (s[mid] <= f) lo = mid;
      else hi = mid - 1;
    }
    return lo;
  }
  return Math.min(g.steps - 1, Math.floor(f / g.stepEvery));
}

/** Step at a time in seconds for tracks without video; loops over the steps. */
export function stepAtTime(meta, t) {
  const n = meta.grid.steps;
  const s = Math.floor((Number.isFinite(t) ? t : 0) / meta.time.secondsPerStep);
  return ((s % n) + n) % n;
}
