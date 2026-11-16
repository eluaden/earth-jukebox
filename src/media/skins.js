import { clampTime, isStills, trackDuration } from '../state/clock.js';
import { currentEnv, pickVideo } from './pickVideo.js';

// The skin of the globe: what the NASA map is made of, and the data clock that goes with it.
//   video  (SST, lightning): a muted, looping <video>; its currentTime is the data clock.
//   stills (night lights):   one image per step; the clock is the app's own, advanced by advance(dt).
// Common interface: kind, meta, ready (Promise, resolves when the first picture can be shown),
// time(), seek(t), play(), pause(), playing, advance(dt), dispose(), disposed.

const READY_TIMEOUT = 8000; // ms: a slow network still gets the track (the poster shows meanwhile)

function timeout(promise) {
  return Promise.race([promise, new Promise((resolve) => setTimeout(resolve, READY_TIMEOUT))]);
}

function createVideoSkin(meta, dir) {
  const el = document.createElement('video');
  el.src = dir + pickVideo(meta, currentEnv());
  el.poster = dir + meta.poster;
  el.crossOrigin = 'anonymous';
  el.muted = true;
  el.loop = true;
  el.playsInline = true;
  el.preload = 'auto';
  el.setAttribute('aria-hidden', 'true');
  let disposed = false;
  let pending = null; // a seek asked for while the previous one is still running (drags seek every frame)
  el.addEventListener('seeked', () => {
    if (pending == null || disposed) return;
    const t = pending;
    pending = null;
    el.currentTime = t;
  });
  const ready = timeout(
    new Promise((resolve) => {
      el.addEventListener('loadeddata', resolve, { once: true });
      el.addEventListener('error', resolve, { once: true });
    }),
  );
  return {
    kind: 'video',
    meta,
    el,
    poster: dir + meta.poster,
    ready,
    time: () => pending ?? (el.currentTime || 0),
    seek(t) {
      const to = clampTime(t, meta.video.duration, meta.video.fps);
      if (el.seeking) pending = to;
      else el.currentTime = to;
    },
    play() {
      if (!disposed) el.play().catch(() => {});
    },
    pause() {
      el.pause();
    },
    get playing() {
      return !el.paused;
    },
    advance() {},
    dispose() {
      disposed = true;
      el.pause();
      el.removeAttribute('src');
      el.load();
      el.remove();
    },
    get disposed() {
      return disposed;
    },
  };
}

function createStillsSkin(meta, dir) {
  const images = meta.texture.images.map((file) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.decoding = 'async';
    img.src = dir + file;
    return img;
  });
  const decoded = images.map((img) => img.decode().then(
    () => true,
    () => false,
  ));
  const duration = trackDuration(meta);
  let t = 0;
  let laps = 0; // times the record has looped; from the second lap on, the first year fades in too
  let playing = false;
  let disposed = false;
  return {
    kind: 'stills',
    meta,
    images,
    ready: timeout(decoded[0]),
    /** True once image i can be drawn. */
    isLoaded: (i) => images[i].complete && images[i].naturalWidth > 0,
    time: () => t,
    get laps() {
      return laps;
    },
    seek(s) {
      t = ((s % duration) + duration) % duration;
      laps = 0;
    },
    play() {
      playing = !disposed;
    },
    pause() {
      playing = false;
    },
    get playing() {
      return playing;
    },
    /** Moves the clock while playing; long gaps (tab in the background) are capped. */
    advance(dt) {
      if (!playing) return;
      t += Math.min(dt, 0.5);
      if (t >= duration) {
        t -= duration;
        laps++;
      }
    },
    dispose() {
      disposed = true;
      playing = false;
    },
    get disposed() {
      return disposed;
    },
  };
}

/** The skin for a track's metadata (track.json) served from dir. */
export function createSkin(meta, dir) {
  return isStills(meta) ? createStillsSkin(meta, dir) : createVideoSkin(meta, dir);
}

export const STILLS_FADE = 1.2; // s: crossfade from one year's image to the next

/**
 * For a stills skin: which images to show and how far the fade has gone at the current time.
 * Returns { from, to, mix } (image indices, mix 0 = from, 1 = to). The fade runs during the first
 * STILLS_FADE seconds of each step, from the step before; the first step of the first lap has
 * nothing before it and starts sharp.
 */
export function stillsFrame(meta, t, laps = 0) {
  const per = meta.time.secondsPerStep;
  const n = meta.grid.steps;
  const step = Math.floor(t / per) % n;
  const into = t - Math.floor(t / per) * per;
  if ((t < per && laps === 0) || into >= STILLS_FADE) return { from: step, to: step, mix: 1 };
  return { from: (step - 1 + n) % n, to: step, mix: into / STILLS_FADE };
}
