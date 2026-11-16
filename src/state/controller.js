import * as Tone from 'tone';
import { allOff, useStore } from './store.js';
import { live } from './live.js';
import { loadTrack } from '../data/loadTrack.js';
import { readColumn, lonToIndex } from '../data/grid.js';
import { lonUnderNeedle, SECONDS_PER_TURN } from '../data/needle.js';
import { INSTRUMENTS } from '../music/instruments.js';
import { shouldFireMarker, stepAt, timeOfStep, trackDuration, turnLimited } from './clock.js';
import { createEngine } from '../music/engine.js';
import { TRACK_MUSIC } from '../music/tracks/index.js';
import { createNarrator } from '../narration/narrator.js';
import { createSkin } from '../media/skins.js';
import { longDate } from '../lib/format.js';
import { stepMeans } from '../data/series.js';
import { t } from '../i18n/strings.js';
import { TRACK_TEXT, TRACK_VIEW, describeValue, engineVoices, narrationLine } from './tracks.js';
import { bindUiSounds } from '../ui/sounds.js';

// Orchestrates the current track: its skin (data clock and globe texture), the engine (sound), the
// narration and the per-frame reading under the needle; and the change of record (Records).

const BASE = import.meta.env.BASE_URL;
const SWAP_MS = 1200; // globe crossfade between two records (direction 5.4)
const ARM_MS = 650; // tonearm swing before the stylus touches
const INTRO_GAP_MS = 2500; // music alone between the welcome and the track's opening narration
const PREFETCH_MS = 5000; // after the music starts, the other records load in the background
const INSTANT_OUTRO_TURNS = 4; // a single-instant record (aerosols) closes after this many turns
// First visit: music rises under the welcome + first-disc intro; full level only after that ends.
const INTRO_MUSIC_START = 0.06;
const INTRO_MUSIC_MID = 0.28;
const INTRO_SWELL_SEC = 22; // soft rise while the narrator still has the floor
const INTRO_FINISH_SEC = 4.5; // last climb to normal after the track intro
const TUTORIAL_DUCK_DB = -24; // first-visit tutorial: the music drops to a faint bed whenever the narrator speaks

const c = {
  ready: null,
  engine: null,
  narrator: null,
  catalog: {}, // track id -> track.json, for every record in public/tracks/index.json
  bundles: {}, // track id -> Promise<{ id, meta, grid, dir }>
  track: null, // { id, meta, grid, dir, music, view, skin, emptyRead }
  musicState: null,
  fired: new Set(), // narration already spoken on this record
  swap: null, // { from: skin, t0, dur } while the globe crossfades to a new record
  opening: null, // Promise of the N1 lines on a first visit
  swell: false, // music bed is rising under the first-visit opening (until the track intro ends)
  tutorial: false, // first visit, from the welcome until the last tutorial balloon (deeper duck)
  landed: false, // the current descent already ended (introDone ran)
  token: 0, // changes with every record; callbacks left over from an older record do nothing
  prefetched: false,
  speaking: 0, // narration lines in progress (place markers wait for a free narrator)
  introSaid: -1, // token of the record whose intro has been spoken (place markers wait for it)
  turned: 0, // radians the globe has turned with the needle down on this record (instant records)
  scrub: null, // { wasPlaying, t } while the globe or the ring is dragged; t = the data clock
  spinDebt: 0, // radians the globe still has to turn to catch up with a jump of the data clock
  saying: null, // { id, step } of the milestone being spoken (stopped if time goes back before it)
};

const RAD_PER_SEC = (2 * Math.PI) / SECONDS_PER_TURN; // globe turn per second of the data clock

export const controller = c;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const dirOf = (id) => `${BASE}tracks/${id}/`;

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

/** Grid and metadata of a record, loaded once (a failed load can be retried). */
function getBundle(id) {
  if (!c.bundles[id]) {
    c.bundles[id] = loadTrack(id, BASE).then(
      (bundle) => ({ id, ...bundle }),
      (err) => {
        delete c.bundles[id];
        throw err;
      },
    );
  }
  return c.bundles[id];
}

/** Makes a loaded record the current one: music, voices, chips and narration start fresh. */
function activate(bundle, skin) {
  const music = TRACK_MUSIC[bundle.id];
  const view = TRACK_VIEW[bundle.id];
  const g = bundle.meta.grid;
  const nan = new Float32Array(g.lats * (g.layers ?? 1)).fill(NaN);
  const emptyRead = music.read(nan, nan);
  c.track = { ...bundle, music, view, skin, emptyRead };
  c.musicState = music.initialState();
  c.fired = new Set();
  c.turned = 0;
  c.spinDebt = 0;
  c.token++;
  live.step = -1;
  live.lonIdx = -1;
  live.read = emptyRead;
  live.summary = music.summary(emptyRead);
  live.dots = [];
  const voices = pickedVoices(bundle.id);
  c.engine.setVoices(voices);
  // Sparkline under the date: one global mean per step, cached on the bundle (direction 5.2.1).
  const trend = view.trend && bundle.meta.time?.unit !== 'instant' ? view.trend : null;
  if (trend && !bundle.trendMeans) bundle.trendMeans = stepMeans(bundle.grid, bundle.meta.grid);
  const ids = music.voices.map((v) => v.id);
  useStore.setState({
    trackId: bundle.id,
    meta: bundle.meta,
    grid: bundle.grid,
    trend,
    trendMeans: trend ? bundle.trendMeans : null,
    voices: music.voices.map((v) => ({ ...v, instrument: voices.find((x) => x.id === v.id).instrument })),
    summary: live.summary,
    step: 0,
    mute: allOff(ids),
    solo: allOff(ids),
  });
}

/** The track's voices with the listener's instrument picks (only picks whose samples are decoded). */
function pickedVoices(id) {
  const choice = useStore.getState().instrumentChoice;
  return engineVoices(id).map((v) => {
    const inst = choice[`${id}:${v.id}`];
    return inst && inst !== v.instrument && c.engine.hasInstrument(inst) ? { ...v, instrument: inst, attack: undefined } : v;
  });
}

/**
 * The chips' instrument menu: play one voice of the current record on another instrument. Only the
 * timbre changes (direction 6.1: notes and mapping stay; never more than the track's 3 voices).
 */
export async function chooseInstrument(voiceId, inst) {
  if (!c.track || !INSTRUMENTS[inst]) return;
  const { id } = c.track;
  const token = c.token;
  try {
    await c.engine.ensureInstrument(inst);
  } catch (err) {
    console.error(err);
    useStore.getState().announce(t(useStore.getState().lang, 'loadError'));
    return;
  }
  if (token !== c.token) return; // the record changed meanwhile: the pick is kept for next time
  const base = engineVoices(id).find((v) => v.id === voiceId);
  if (!base) return;
  c.engine.setInstrument(voiceId, inst, inst === base.instrument ? base.attack : undefined);
  c.musicState = c.track.music.initialState(); // held notes start again on the new instrument
  useStore.setState((s) => ({
    instrumentChoice: { ...s.instrumentChoice, [`${id}:${voiceId}`]: inst },
    voices: s.voices.map((v) => (v.id === voiceId ? { ...v, instrument: inst } : v)),
  }));
}

/**
 * Dragging the globe (src/ui/globeDrag.js, arrow keys up / down) or the platter's time ring. The
 * globe and the record share one clock: a turn is SECONDS_PER_TURN of the data clock, as in
 * playback, so turning the globe back takes the date (and the ring) back, and moving the ring turns
 * the globe. The needle plays what passes under it, paused or not; scrubEnd puts the record back as
 * it was. source = 'globe' | 'ring'.
 */
export function scrubStart(source = 'globe') {
  const s = useStore.getState();
  if (!c.track || s.phase !== 'playing' || s.switching || s.panel === 'records' || s.panel === 'about') return false;
  if (source === 'globe' && c.track.view.porthole) return false; // one value per step: turning by hand would change nothing
  if (s.hint === 'time') {
    clearHintTimer();
    useStore.setState({ hint: null });
    endTutorial();
  }
  if (c.scrub) return true;
  c.scrub = { wasPlaying: s.playing, t: c.track.skin.time() };
  c.track.skin.pause();
  if (!s.playing) {
    c.engine.start(onTick);
    if (s.arm !== 'down') {
      useStore.setState({ arm: 'down' });
      c.engine.needleDrop();
    }
  }
  useStore.setState({ scrubbing: true });
  return true;
}

/** Latest time a drag may reach: the last frame (video) or just before the loop (stills). */
function scrubMax(meta) {
  return trackDuration(meta) - (meta.video ? 1 / meta.video.fps : 0.01);
}

/** Moves the data clock while dragging; the narration follows (see timeMoved). */
function setScrubTime(t) {
  const from = c.scrub.t;
  c.track.skin.seek(t);
  c.scrub.t = c.track.skin.time();
  timeMoved(from, c.scrub.t);
}

/**
 * Globe drag: turns the globe and the data clock together. Positive radians turn the surface to the
 * right, against playback, so the date goes back. Time-series records stop at the first and the
 * last step (the globe stops with them); a single-instant record turns freely, its clock looping.
 */
export function scrubBy(radians) {
  if (!c.scrub) return;
  const { meta } = c.track;
  const want = c.scrub.t - radians / RAD_PER_SEC;
  if (meta.time?.unit === 'instant') {
    live.rotation += radians;
    setScrubTime(want);
    return;
  }
  const from = c.scrub.t;
  setScrubTime(Math.min(scrubMax(meta), Math.max(0, want)));
  live.rotation -= (c.scrub.t - from) * RAD_PER_SEC;
}

/** Ring drag: the data clock goes to a fraction of the record and the globe turns to follow. */
export function scrubToFraction(f) {
  if (!c.scrub) return;
  const { meta } = c.track;
  const from = c.scrub.t;
  setScrubTime(Math.min(scrubMax(meta), Math.max(0, f * trackDuration(meta))));
  c.spinDebt = turnLimited(c.spinDebt - (c.scrub.t - from) * RAD_PER_SEC);
}

/**
 * The data clock moved by hand (drag, ring, arrow keys). Going back re-arms the milestones now
 * ahead of it (spoken again when playback crosses them) and stops a milestone line that is ahead.
 */
function timeMoved(from, to) {
  if (!c.track || to >= from) return;
  const step = stepAt(c.track.meta, to);
  for (const m of c.track.meta.markers) {
    if (Number.isInteger(m.step) && m.step > step) c.fired.delete(m.id);
  }
  if (c.saying && c.saying.step > step) c.narrator.stop();
}

export function scrubEnd() {
  clearTimeout(c.nudgeTimer);
  if (!c.scrub) return;
  const { wasPlaying } = c.scrub;
  c.scrub = null;
  useStore.setState({ scrubbing: false });
  if (!c.track) return;
  const s = useStore.getState();
  if (wasPlaying && s.playing) {
    if (s.arm === 'down') c.track.skin.play();
  } else {
    useStore.setState({ arm: 'up' });
    c.engine.needleLift();
    c.engine.pause();
  }
}

const NUDGE = (12 * Math.PI) / 180;

/** Arrow keys up / down: turn the globe 12 degrees, with sound, as a short drag. */
export function nudgeGlobe(dir) {
  if (!scrubStart()) return;
  scrubBy(dir * NUDGE);
  clearTimeout(c.nudgeTimer);
  c.nudgeTimer = setTimeout(scrubEnd, 700);
}

/** Loads the list of records, the first record and the samples. Safe to call many times. */
export function preload() {
  if (c.ready) return c.ready;
  c.ready = (async () => {
    const ids = await (await fetch(`${BASE}tracks/index.json`)).json();
    const metas = await Promise.all(ids.map((id) => fetch(`${dirOf(id)}track.json`).then((r) => r.json())));
    ids.forEach((id, i) => (c.catalog[id] = metas[i]));
    useStore.setState({
      base: BASE,
      tracks: ids.map((id, i) => ({ id, period: metas[i].period, cover: dirOf(id) + metas[i].cover })),
    });
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
    const first = await getBundle(ids[0]);
    const skin = createSkin(first.meta, first.dir);
    await c.engine.load();
    bindUiSounds((id) => c.engine.playSfx(id));
    activate(first, skin);
    useStore.setState({ loading: false });
  })().catch((err) => {
    console.error(err);
    useStore.setState({ error: String(err), loading: false });
    throw err;
  });
  return c.ready;
}

/** First visit: "Put on headphones." then "Welcome…" (N1), while the camera descends. */
async function speakOpening() {
  const { lang } = useStore.getState();
  await c.narrator.say(t(lang, 'putOnHeadphones'), lang, { announce: false });
  await c.narrator.say(t(lang, 'welcome'), lang);
}

/** Cold open click: unlock audio, then the camera descent (or straight in for returning visitors). */
export async function begin() {
  await Tone.start();
  await preload();
  c.engine.playSfx('space-whoosh');
  const firstVisit = !introSeen();
  if (firstVisit) {
    c.tutorial = true;
    c.engine.setDuckDepth(TUTORIAL_DUCK_DB);
    c.opening = speakOpening();
  }
  c.landed = false;
  useStore.setState({ phase: 'intro', introAnimated: firstVisit && !prefersReducedMotion(), arm: 'away' });
}

/** End of the descent: the needle drops and the record starts. Once per descent. */
export function introDone() {
  if (c.landed) return;
  c.landed = true;
  markIntroSeen();
  const s = useStore.getState();
  useStore.setState({ arm: 'down' });
  setTimeout(() => c.engine.needleDrop(), ARM_MS);
  if (s.phase === 'playing') return; // replayed from About: the music never stopped
  setTimeout(startPlayback, ARM_MS + 250);
}

function startPlayback() {
  useStore.setState({ phase: 'playing', playing: true });
  c.track.skin.play();
  c.engine.playSfx('platter-spin-up');
  // First visit: music enters quiet under the welcome / first-disc intro and only nears full after.
  if (c.opening) {
    c.swell = true;
    c.engine.setMusicLevel(INTRO_MUSIC_START, 0);
    c.engine.setMusicLevel(INTRO_MUSIC_MID, INTRO_SWELL_SEC);
  }
  c.engine.start(onTick);
  sayIntroWhenFree();
  schedulePrefetch();
}

/** Ends the first-visit music swell (or snaps to full if the opening was cut short). */
function finishIntroSwell(rampSec = INTRO_FINISH_SEC) {
  if (!c.swell) return;
  c.swell = false;
  c.engine.setMusicLevel(1, rampSec);
}

/** Ends the first-visit tutorial: the narrator ducks the music by the normal depth again. */
function endTutorial() {
  if (!c.tutorial) return;
  c.tutorial = false;
  c.engine.setDuckDepth();
}

/** The record's opening narration, after the welcome (plus a breath of music) on a first visit. */
function sayIntroWhenFree() {
  if (c.fired.has('intro')) return;
  c.fired.add('intro');
  const token = c.token;
  const opening = c.opening;
  c.opening = null;
  (opening ? opening.then(() => wait(INTRO_GAP_MS)) : Promise.resolve()).then(() => {
    if (token !== c.token) return;
    const s = useStore.getState();
    if (!s.playing || s.arm !== 'down') {
      c.fired.delete('intro'); // spoken on the next play instead
      return;
    }
    c.introSaid = token;
    Promise.resolve(say('intro')).then(() => {
      if (token !== c.token) return;
      finishIntroSwell();
      hintOnce();
    });
  });
}

/** The other records' grids and first pictures load in the background, so changing is immediate. */
function schedulePrefetch() {
  if (c.prefetched) return;
  c.prefetched = true;
  setTimeout(() => {
    for (const [id, meta] of Object.entries(c.catalog)) {
      getBundle(id).catch(() => {});
      new Image().src = dirOf(id) + meta.poster;
    }
  }, PREFETCH_MS);
}

export function togglePlay() {
  if (c.scrub) scrubEnd();
  const s = useStore.getState();
  if (s.phase !== 'playing' || s.switching) return;
  if (s.playing) {
    // Pause lifts the needle (same motion as opening Records), like a real turntable.
    if (s.arm === 'down') {
      useStore.setState({ playing: false, arm: 'up' });
      c.engine.needleLift();
    } else {
      useStore.setState({ playing: false });
    }
    c.track.skin.pause();
    c.engine.pause();
    c.narrator.stop();
    return;
  }
  // Resume: drop the needle unless Records is holding it up.
  const keepUp = s.panel === 'records';
  useStore.setState({ playing: true, ...(keepUp ? {} : { arm: 'down' }) });
  c.engine.start(onTick);
  if (!keepUp) {
    setTimeout(() => c.engine.needleDrop(), ARM_MS);
    setTimeout(() => {
      const now = useStore.getState();
      if (now.playing && now.arm === 'down') c.track.skin.play();
    }, ARM_MS + 250);
  }
  sayIntroWhenFree();
}

/**
 * Replay: the record goes back to its first step and the narration is spoken again from the start
 * (intro, milestones, outro). Without it the record loops with the music only: each line of the
 * narrator is spoken once per record (direction 5.3, "repetir").
 */
export function replayTrack() {
  const s = useStore.getState();
  if (!c.track || s.switching || s.phase !== 'playing') return;
  c.narrator.stop();
  c.opening = null; // the welcome, if still speaking, gives way to the record's own intro
  c.fired = new Set();
  c.turned = 0;
  live.step = -1; // the jump back is a restart, not a loop: no outro, no milestone on the way
  s.requestSeek(0);
  if (s.panel === 'records') setPanel(null);
  if (!useStore.getState().playing) togglePlay(); // resuming speaks the intro
  else sayIntroWhenFree();
}

export function replayOpening() {
  c.landed = false;
  useStore.setState((s) => ({ panel: null, arm: 'away', introAnimated: true, introKey: s.introKey + 1 }));
}

/** Brand click: black screen again so the listener can pick another language. */
export function returnToCold() {
  const s = useStore.getState();
  if (s.phase === 'cold') return;
  if (c.nudgeTimer) {
    clearTimeout(c.nudgeTimer);
    c.nudgeTimer = 0;
  }
  if (c.scrub) c.scrub = null;
  clearHintTimer();
  endTutorial();
  c.opening = null;
  c.swell = false;
  c.landed = false;
  c.token++;
  c.narrator?.stop();
  c.track?.skin?.pause();
  if (c.engine) {
    c.engine.pause();
    c.engine.setMusicLevel(1, 0);
  }
  useStore.setState({
    phase: 'cold',
    playing: false,
    panel: null,
    arm: 'away',
    caption: '',
    hint: null,
    switching: null,
    scrubbing: false,
  });
}

export function setPanel(panel) {
  const s = useStore.getState();
  if (s.switching) return;
  const next = s.panel === panel ? null : panel;
  const prev = s.panel;
  // Needle up: nothing is read, so the data clock waits with the music.
  if (s.phase === 'playing') {
    if (next === 'records' && s.arm === 'down') {
      useStore.setState({ arm: 'up' });
      c.engine.needleLift();
      c.track.skin.pause();
    } else if (next !== 'records' && s.arm === 'up' && s.playing) {
      // Closing Records while paused keeps the needle up (pause already lifted it).
      useStore.setState({ arm: 'down' });
      setTimeout(() => c.engine.needleDrop(), ARM_MS);
      c.track.skin.play();
    }
  }
  useStore.setState({ panel: next });
  dismissHintFor(next, prev);
}

/**
 * Records: put another record on (direction 5.4). The needle is already up (Records lifts it); the
 * panel goes down, the globe stays dimmed while the record loads, its skin crossfades to the new
 * map, then the needle drops and the new record starts from its first step.
 */
export async function selectTrack(id) {
  const s = useStore.getState();
  if (s.switching || !c.track || s.phase !== 'playing') return;
  if (id === c.track.id) {
    setPanel(null);
    return;
  }
  c.narrator.stop();
  finishIntroSwell(1); // leaving the first visit: do not keep the next disc quiet
  if (s.arm === 'down') {
    c.engine.needleLift();
    c.track.skin.pause();
  }
  useStore.setState({ panel: null, switching: id, arm: 'up' });
  if (s.hint === 'records') {
    clearHintTimer();
    useStore.setState({ hint: null });
  }
  c.engine.playSfx('record-swap');
  useStore.getState().announce(t(s.lang, 'loadingTrack', { track: TRACK_TEXT[id][s.lang].title }));

  let bundle;
  let skin;
  try {
    bundle = await getBundle(id);
    skin = createSkin(bundle.meta, bundle.dir);
    await skin.ready;
  } catch (err) {
    console.error(err);
    skin?.dispose();
    if (useStore.getState().phase === 'cold') return;
    const playing = useStore.getState().playing;
    useStore.setState({ switching: null, arm: playing ? 'down' : 'up' });
    if (playing) {
      setTimeout(() => c.engine.needleDrop(), ARM_MS);
      c.track.skin.play();
    }
    useStore.getState().announce(t(useStore.getState().lang, 'loadError'));
    return;
  }

  if (useStore.getState().phase === 'cold') {
    skin.dispose();
    return;
  }

  const from = c.track.skin;
  from.pause();
  activate(bundle, skin);
  c.swap = { from, t0: performance.now(), dur: SWAP_MS };
  await wait(SWAP_MS);
  c.swap = null;
  from.dispose();

  if (useStore.getState().phase === 'cold') return;

  const token = c.token;
  const { playing, lang } = useStore.getState();
  // Paused: leave the needle up until play. Playing: drop and start the new record.
  useStore.setState({ switching: null, arm: playing ? 'down' : 'up' });
  if (!playing) {
    useStore.getState().announce(t(lang, 'nowPlaying', { track: TRACK_TEXT[id][lang].title }));
    return;
  }
  setTimeout(() => c.engine.needleDrop(), ARM_MS);
  setTimeout(() => {
    const now = useStore.getState();
    if (token !== c.token || !now.playing || now.arm !== 'down') return;
    skin.play();
    sayIntroWhenFree();
  }, ARM_MS + 250);
}

/** Move the data clock by whole steps (arrow keys). */
export function seekBySteps(delta) {
  const s = useStore.getState();
  if (!c.track || s.switching) return;
  s.requestSeek(timeOfStep(c.track.meta, Math.max(0, live.step) + delta));
}

/** Seek to a fraction of the record (the time ring when it cannot scrub, e.g. Records open). */
export function seekToFraction(f) {
  const s = useStore.getState();
  if (!c.track || s.switching || s.phase !== 'playing') return;
  s.requestSeek(Math.min(scrubMax(c.track.meta), Math.max(0, f * trackDuration(c.track.meta))));
}

/** Position in the record, 0..1 (the platter's time arc). */
export function progress() {
  if (!c.track) return 0;
  return c.track.skin.time() / trackDuration(c.track.meta);
}

/** Step of the current record at a fraction of it (the ring's hover label), or -1. */
export function stepAtFraction(f) {
  if (!c.track) return -1;
  return stepAt(c.track.meta, f * trackDuration(c.track.meta));
}

function say(id) {
  const { lang } = useStore.getState();
  const marker = c.track.meta.markers.find((m) => m.id === id && Number.isInteger(m.step));
  const line = marker ? { id, step: marker.step } : null;
  c.saying = line;
  c.speaking++;
  return c.narrator.say(narrationLine(c.track.id, c.track.meta, id, lang), lang).finally(() => {
    c.speaking--;
    if (c.saying === line) c.saying = null;
  });
}

/** True when the needle went from lon a to lon b (degrees, eastward, less than half a turn) past lon. */
export function crossedLon(a, b, lon) {
  const span = (((b - a) % 360) + 360) % 360;
  if (span === 0 || span > 180) return false;
  const to = (((lon - a) % 360) + 360) % 360;
  return to > 0 && to <= span;
}

/**
 * A single-instant record (aerosols): its milestones are places. A line is spoken when the needle
 * crosses the place's longitude with the narrator free (the intro is never cut; a place missed
 * waits for the next turn); the closing line after every place and a few turns, also with the
 * narrator free.
 */
function placeMarkers(meta, prevLon, lon, dt) {
  if (!live.spinning) return;
  c.turned += Math.min(dt, 0.5) * ((2 * Math.PI) / SECONDS_PER_TURN);
  if (c.speaking > 0 || c.introSaid !== c.token || !Number.isFinite(prevLon)) return;
  for (const m of meta.markers) {
    if (!c.fired.has(m.id) && crossedLon(prevLon, lon, m.lon)) {
      c.fired.add(m.id);
      say(m.id);
      return;
    }
  }
  const allPlaces = meta.markers.every((m) => c.fired.has(m.id));
  if (allPlaces && c.turned >= INSTANT_OUTRO_TURNS * 2 * Math.PI && !c.fired.has('outro')) {
    c.fired.add('outro');
    say('outro');
  }
}

const HINT_MS = 9000;
const TIME_HINT_MS = 14000; // two lines to read (time, pause) and a ghost drag to watch
let hintTimer = 0;

function hintAlreadySeen(key) {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function markHintSeen(key) {
  try {
    localStorage.setItem(key, '1');
  } catch {
    /* storage blocked: the hint may show again next visit */
  }
}

function clearHintTimer() {
  if (hintTimer) {
    clearTimeout(hintTimer);
    hintTimer = 0;
  }
}

/**
 * First visit after the record's intro: understand what you hear first, then learn to
 * change the disc — one after the other so they do not compete.
 */
function hintOnce() {
  if (hintAlreadySeen('ej-hint-seen')) {
    recordsHintOnce();
    return;
  }
  if (useStore.getState().panel === 'liner') {
    markHintSeen('ej-hint-seen');
    recordsHintOnce();
    return;
  }
  clearHintTimer();
  markHintSeen('ej-hint-seen');
  useStore.setState({ hint: 'hearing' });
  hintTimer = setTimeout(() => {
    hintTimer = 0;
    if (useStore.getState().hint === 'hearing') useStore.setState({ hint: null });
    recordsHintOnce();
  }, HINT_MS);
}

function recordsHintOnce() {
  if (hintAlreadySeen('ej-records-hint-seen')) {
    timeHintOnce();
    return;
  }
  if (useStore.getState().panel === 'records' || useStore.getState().panel === 'liner') return;
  clearHintTimer();
  markHintSeen('ej-records-hint-seen');
  useStore.setState({ hint: 'records' });
  hintTimer = setTimeout(() => {
    hintTimer = 0;
    if (useStore.getState().hint === 'records') useStore.setState({ hint: null });
    timeHintOnce();
  }, HINT_MS);
}

/**
 * Last first-visit hint: dragging the globe or the time ring moves the record back or ahead in
 * time, and a click on the globe pauses. Its end is the end of the tutorial.
 */
function timeHintOnce() {
  if (hintAlreadySeen('ej-time-hint-seen')) {
    endTutorial();
    return;
  }
  if (!hintAlreadySeen('ej-hint-seen') || !hintAlreadySeen('ej-records-hint-seen')) return;
  const s = useStore.getState();
  if (s.phase !== 'playing' || s.panel || s.hint || s.switching) return;
  clearHintTimer();
  markHintSeen('ej-time-hint-seen');
  useStore.setState({ hint: 'time' });
  hintTimer = setTimeout(() => {
    hintTimer = 0;
    if (useStore.getState().hint === 'time') useStore.setState({ hint: null });
    endTutorial();
  }, TIME_HINT_MS);
}

/**
 * Ends the matching first-visit hint. Records waits until the liner closes so the two do
 * not compete on screen, and the time ring until Records closes. Opening Records itself counts as
 * finding the control.
 */
function dismissHintFor(opening, closing) {
  const { hint } = useStore.getState();
  if (opening === 'liner' && hint === 'hearing') {
    clearHintTimer();
    useStore.setState({ hint: null });
  } else if (opening === 'records') {
    if (hint === 'hearing' || hint === 'records' || hint === 'time') {
      clearHintTimer();
      useStore.setState({ hint: null });
    }
    if (hint === 'time') endTutorial();
    markHintSeen('ej-records-hint-seen');
  }
  if (closing === 'liner' && opening !== 'records') recordsHintOnce();
  if (closing === 'records' && !opening) timeHintOnce();
}

/** "V": speak the date and every voice's value (screen reader live region). */
export function announceValues() {
  const { lang, meta, summary, voices, trackId } = useStore.getState();
  if (!meta) return;
  const date = longDate(meta.dates[Math.max(0, live.step)], lang, meta.time?.unit);
  const n = Math.round(Math.abs(live.lon));
  const lon = t(lang, live.lon >= 0 ? 'lonEast' : 'lonWest', { n });
  const list = summary
    .map((sv) => {
      const voice = voices.find((v) => v.id === sv.voice);
      return `${t(lang, `instrument.${voice.instrument}`)}, ${t(lang, `var.${trackId}.${sv.voice}`)}: ${describeValue(trackId, sv, lang)}`;
    })
    .join('; ');
  useStore.getState().announce('');
  setTimeout(() => useStore.getState().announce(t(lang, 'announce', { date, lon, zones: list })), 30);
}

/** "Hear the legend": the track's own notes, from the lowest value (or latitude) to the highest. */
export function playLegend() {
  if (!c.track) return Promise.resolve();
  return c.engine.playLegend(c.track.view.legend(c.engine.pulseSeconds()));
}

function onTick(tick, time) {
  const s = useStore.getState();
  if ((!s.playing && !s.scrubbing) || !c.track) return null;
  const { music, view, meta, emptyRead } = c.track;
  // Needle up (paused, Records open, a record changing, opening replay): nothing is read, so held
  // notes release and nothing plays.
  const reading = s.arm === 'down' && !s.switching;
  const r = music.plan(reading ? live.read || emptyRead : emptyRead, tick, c.musicState);
  c.musicState = r.state;
  const starts = r.events.filter((e) => e.kind !== 'release');
  if (starts.length) {
    const pulse = c.engine.pulseSeconds();
    for (const e of starts) {
      Tone.getDraw().schedule(() => {
        live.dots.push({ lat: e.lat, color: view.dotColor(meta, e), t0: performance.now() });
        if (live.dots.length > 24) live.dots.splice(0, live.dots.length - 24);
      }, time + (e.offset || 0) * pulse);
    }
  }
  return { events: r.events, filters: reading && view.filters ? view.filters(live.summary) : null };
}

/** Called every animation frame (3D or 2D): spin, seek, and read the column under the needle. */
export function advance(dt) {
  const s = useStore.getState();
  if (!c.track || s.phase !== 'playing') return;
  const { meta, grid, music, skin } = c.track;
  // The globe turns only while the record plays with the needle down (not paused, not with Records
  // open, not while a record changes); a drag turns it by hand.
  live.spinning = s.playing && s.arm === 'down' && !s.switching && !s.scrubbing;
  if (live.spinning) live.rotation -= Math.min(dt, 0.5) * RAD_PER_SEC;
  if (s.seekTo != null) {
    const from = skin.time();
    skin.seek(s.seekTo);
    useStore.setState({ seekTo: null });
    timeMoved(from, skin.time());
    c.spinDebt = turnLimited(c.spinDebt - (skin.time() - from) * RAD_PER_SEC);
  }
  // A jump of the clock (ring, arrow keys, replay) turns the globe smoothly instead of at once.
  if (c.spinDebt) {
    const d = Math.abs(c.spinDebt) < 1e-3 ? c.spinDebt : c.spinDebt * (1 - Math.exp(-12 * Math.min(dt, 0.1)));
    live.rotation += d;
    c.spinDebt -= d;
  }
  skin.advance(dt);
  const step = stepAt(meta, skin.time());
  const prevLon = live.lon;
  live.lon = lonUnderNeedle(live.rotation);
  if (meta.time?.unit === 'instant' && s.playing && !s.switching) placeMarkers(meta, prevLon, live.lon, dt);
  const lonIdx = lonToIndex(live.lon, meta.grid.lons);
  if (step === live.step && lonIdx === live.lonIdx) return;
  const prev = live.step;
  live.step = step;
  live.lonIdx = lonIdx;
  const col = readColumn(grid, step, lonIdx, meta.grid);
  const prevCol = step > 0 ? readColumn(grid, step - 1, lonIdx, meta.grid) : null;
  live.read = music.read(col, prevCol);
  live.summary = music.summary(live.read);
  useStore.setState({ step, lon: live.lon, summary: live.summary });

  // While dragging, nothing is spoken: going back and forth would cut one line after another.
  if (prev < 0 || !s.playing || s.switching || s.scrubbing) return;
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
