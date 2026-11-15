import * as Tone from 'tone';
import { EMPTY_ZONES, useStore, VOICES } from './store.js';
import { live } from './live.js';
import { loadTrack, legendColor } from '../data/loadTrack.js';
import { readColumn, lonToIndex } from '../data/grid.js';
import { lonUnderNeedle, SECONDS_PER_TURN } from '../data/needle.js';
import { zonesFromColumn } from '../data/zones.js';
import { clampTime, shouldFireMarker, stepFromTime } from './clock.js';
import { createEngine } from '../music/engine.js';
import { emptyHeld, noteFor, planTick } from '../music/mapping.js';
import { createNarrator } from '../narration/narrator.js';
import { currentEnv, pickVideo } from '../media/pickVideo.js';
import { formatTemp, longDate } from '../lib/format.js';
import { t } from '../i18n/strings.js';
import { SST_TEXT } from '../i18n/tracks/sst.js';

// Orchestrates video (data clock), engine (sound), narration and the per-frame reading under the needle.

const TRACK = 'sst';
const BASE = import.meta.env.BASE_URL;
const c = {
  ready: null,
  video: null,
  engine: null,
  narrator: null,
  held: emptyHeld(),
  fired: new Set(),
  dir: '',
};

export const controller = c;

function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function introSeen() {
  try {
    return localStorage.getItem('ej-intro-seen') === '1';
  } catch {
    return false;
  }
}

function markIntroSeen() {
  try {
    localStorage.setItem('ej-intro-seen', '1');
  } catch {
    /* storage blocked: the opening plays again next visit */
  }
}

function createVideo(src, poster) {
  const v = document.createElement('video');
  v.src = src;
  v.poster = poster;
  v.crossOrigin = 'anonymous';
  v.muted = true;
  v.loop = true;
  v.playsInline = true;
  v.preload = 'auto';
  v.setAttribute('aria-hidden', 'true');
  return v;
}

/** Loads the track, the video and the samples. Safe to call many times. */
export function preload() {
  if (c.ready) return c.ready;
  c.ready = (async () => {
    const { meta, grid, dir } = await loadTrack(TRACK, BASE);
    c.dir = dir;
    c.video = createVideo(dir + pickVideo(meta, currentEnv()), dir + meta.poster);
    useStore.setState({ meta, grid, base: BASE });
    c.engine = createEngine(BASE);
    c.narrator = createNarrator({
      base: BASE,
      duck: (on) => c.engine.duck(on),
      setCaption: (line) => useStore.setState({ caption: line }),
      announce: (text) => useStore.setState({ announcement: text }),
    });
    useStore.subscribe((s, prev) => {
      if (s.mute !== prev.mute || s.solo !== prev.solo) c.engine.setMix(s.mute, s.solo);
    });
    await c.engine.load();
    useStore.setState({ loading: false });
  })().catch((err) => {
    console.error(err);
    useStore.setState({ error: String(err), loading: false });
    throw err;
  });
  return c.ready;
}

/** Cold open click: unlock audio, then the camera descent (or straight in for returning visitors). */
export async function begin() {
  await Tone.start();
  await preload();
  const animated = !prefersReducedMotion() && !introSeen();
  useStore.setState({ phase: 'intro', introAnimated: animated, arm: 'away' });
}

/** End of the descent: the needle drops and the record starts. */
export function introDone() {
  markIntroSeen();
  const s = useStore.getState();
  useStore.setState({ arm: 'down' });
  setTimeout(() => c.engine.needleDrop(), 650);
  if (s.phase === 'playing') return; // replayed from About: the music never stopped
  setTimeout(startPlayback, 900);
}

function startPlayback() {
  useStore.setState({ phase: 'playing', playing: true });
  c.video.play().catch(() => {});
  c.engine.start(onTick);
  if (!c.fired.has('intro')) {
    c.fired.add('intro');
    say('intro');
  }
}

export function togglePlay() {
  const s = useStore.getState();
  if (s.phase !== 'playing') return;
  if (s.playing) {
    c.video.pause();
    c.engine.pause();
    c.narrator.stop();
  } else {
    c.video.play().catch(() => {});
    c.engine.start(onTick);
  }
  useStore.setState({ playing: !s.playing });
}

export function replayOpening() {
  useStore.setState((s) => ({ panel: null, arm: 'away', introAnimated: true, introKey: s.introKey + 1 }));
}

export function setPanel(panel) {
  const s = useStore.getState();
  const next = s.panel === panel ? null : panel;
  if (s.phase === 'playing') {
    if (next === 'records' && s.arm === 'down') {
      useStore.setState({ arm: 'up' });
      c.engine.needleLift();
    } else if (next !== 'records' && s.arm === 'up') {
      useStore.setState({ arm: 'down' });
      setTimeout(() => c.engine.needleDrop(), 650);
    }
  }
  useStore.setState({ panel: next });
}

/** Move the data clock by whole steps (arrow keys). */
export function seekBySteps(delta) {
  const { meta } = useStore.getState();
  if (!meta || !c.video) return;
  const secPerStep = meta.grid.stepEvery / meta.video.fps;
  const step = Math.min(meta.grid.steps - 1, Math.max(0, live.step + delta));
  useStore.getState().requestSeek(step * secPerStep + secPerStep / 2);
}

export function progress() {
  const { meta } = useStore.getState();
  if (!meta || !c.video) return 0;
  return (c.video.currentTime || 0) / meta.video.duration;
}

function say(id) {
  const { lang, meta } = useStore.getState();
  const marker = meta.markers.find((m) => m.id === id);
  const date = marker ? longDate(meta.dates[marker.step], lang) : '';
  const text = SST_TEXT[lang].narration[id].replace('{date}', date.charAt(0).toUpperCase() + date.slice(1));
  c.narrator.say(text, lang);
}

/** "V": speak the date and the three zone values (screen reader live region). */
export function announceValues() {
  const { lang, meta, zones } = useStore.getState();
  if (!meta) return;
  const date = longDate(meta.dates[Math.max(0, live.step)], lang);
  const n = Math.round(Math.abs(live.lon));
  const lon = t(lang, live.lon >= 0 ? 'lonEast' : 'lonWest', { n });
  const list = zones
    .map((z) => {
      const v = Number.isFinite(z.mean) ? formatTemp(z.mean, lang) : t(lang, 'noValue');
      return `${t(lang, `voice.${z.voice}`)}, ${t(lang, `zone.${z.id}`)}: ${v}`;
    })
    .join('; ');
  useStore.getState().announce('');
  setTimeout(() => useStore.getState().announce(t(lang, 'announce', { date, lon, zones: list })), 30);
}

/** "Hear the legend": the scale from the coldest to the warmest value of NASA's colour bar. */
export function playLegend() {
  const midis = [];
  for (let d = 0; d <= 15; d++) midis.push(noteFor('piano', (d * 32) / 15));
  return c.engine.playLegend(midis);
}

function onTick(tick, time) {
  const s = useStore.getState();
  if (!s.playing || !s.meta) return null;
  // Needle up (Records open, opening replay): nothing is read, so held notes release and nothing plays.
  const zones = s.arm === 'down' ? live.zones : EMPTY_ZONES;
  const r = planTick(zones, tick, c.held);
  c.held = r.held;
  const starts = r.events.filter((e) => e.kind !== 'release');
  if (starts.length) {
    Tone.getDraw().schedule(() => {
      const now = performance.now();
      for (const e of starts) live.dots.push({ lat: e.lat, color: legendColor(s.meta, e.temp), t0: now });
      if (live.dots.length > 24) live.dots.splice(0, live.dots.length - 24);
    }, time);
  }
  return { events: r.events, zones };
}

/** Called every animation frame (3D or 2D): spin, seek, and read the column under the needle. */
export function advance(dt) {
  const s = useStore.getState();
  if (!s.meta || !c.video || s.phase !== 'playing') return;
  const { meta, grid } = s;
  // Long gaps (tab in the background) are capped so the globe does not jump half a turn.
  if (s.playing) live.rotation -= Math.min(dt, 0.5) * ((2 * Math.PI) / SECONDS_PER_TURN);
  if (s.seekTo != null) {
    c.video.currentTime = clampTime(s.seekTo, meta.video.duration, meta.video.fps);
    useStore.setState({ seekTo: null });
  }
  const step = stepFromTime(c.video.currentTime, meta);
  live.lon = lonUnderNeedle(live.rotation);
  const lonIdx = lonToIndex(live.lon, meta.grid.lons);
  if (step === live.step && lonIdx === live.lonIdx) return;
  const prev = live.step;
  live.step = step;
  live.lonIdx = lonIdx;
  live.zones = zonesFromColumn(readColumn(grid, step, lonIdx, meta.grid));
  useStore.setState({ step, lon: live.lon, zones: live.zones });

  if (prev < 0 || !s.playing) return;
  for (const m of meta.markers) {
    if (shouldFireMarker(m.step, prev, step, c.fired, m.id)) {
      c.fired.add(m.id);
      say(m.id);
    }
  }
  if (step < prev - meta.grid.steps / 2 && !c.fired.has('outro')) {
    c.fired.add('outro');
    say('outro');
  }
}

export { VOICES };
