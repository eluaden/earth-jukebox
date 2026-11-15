/** Light video (1024x512) on touch screens and small screens, sharp one (1536x768) elsewhere. */
export function pickVideo(meta, env) {
  return env.coarsePointer || env.screenMax * env.dpr < 1600 ? meta.video.lo : meta.video.hi;
}

export function currentEnv() {
  const coarsePointer = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;
  const screenMax = Math.max(window.screen?.width || 0, window.screen?.height || 0, window.innerWidth);
  return { coarsePointer, screenMax, dpr: window.devicePixelRatio || 1 };
}
