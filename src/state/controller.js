import * as Tone from 'tone';
import { allOff, useStore } from './store.js';
import { live } from './live.js';
import { loadTrack } from '../data/loadTrack.js';
import { readColumn, lonToIndex } from '../data/grid.js';
import { lonUnderNeedle, SECONDS_PER_TURN } from '../data/needle.js';
import { shouldFireMarker, stepAt, timeOfStep, trackDuration } from './clock.js';
import { createEngine } from '../music/engine.js';
import { TRACK_MUSIC } from '../music/tracks/index.js';
import { createNarrator } from '../narration/narrator.js';
import { createSkin } from '../media/skins.js';
import { longDate } from '../lib/format.js';
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
  landed: false, // the current descent already ended (introDone ran)
  token: 0, // changes with every record; callbacks left over from an older record do nothing
  prefetched: false,
};

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
  const nan = new Float32Array(bundle.meta.grid.lats).fill(NaN);
  const emptyRead = music.read(nan, nan);
  c.track = { ...bundle, music, view: TRACK_VIEW[bundle.id], skin, emptyRead };
  c.musicState = music.initialState();
  c.fired = new Set();
  c.token++;
  live.step = -1;
  live.lonIdx = -1;
  live.read = emptyRead;
  live.summary = music.summary(emptyRead);
  live.dots = [];
  c.engine.setVoices(engineVoices(bundle.id));
  const ids = music.voices.map((v) => v.id);
  useStore.setState({
    trackId: bundle.id,
    meta: bundle.meta,
    grid: bundle.grid,
    voices: music.voices,
    summary: live.summary,
    step: 0,
    mute: allOff(ids),
    solo: allOff(ids),
  });
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
  if (firstVisit) c.opening = speakOpening();
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
  c.engine.start(onTick);
  sayIntroWhenFree();
  schedulePrefetch();
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
    say('intro');
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
  c.engine.playSfx('platter-spin-up');
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

export function replayOpening() {
  c.landed = false;
  useStore.setState((s) => ({ panel: null, arm: 'away', introAnimated: true, introKey: s.introKey + 1 }));
}

export function setPanel(panel) {
  const s = useStore.getState();
  if (s.switching) return;
  const next = s.panel === panel ? null : panel;
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
  if (s.arm === 'down') {
    c.engine.needleLift();
    c.track.skin.pause();
  }
  useStore.setState({ panel: null, switching: id, arm: 'up' });
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
    const playing = useStore.getState().playing;
    useStore.setState({ switching: null, arm: playing ? 'down' : 'up' });
    if (playing) {
      setTimeout(() => c.engine.needleDrop(), ARM_MS);
      c.track.skin.play();
    }
    useStore.getState().announce(t(useStore.getState().lang, 'loadError'));
    return;
  }

  const from = c.track.skin;
  from.pause();
  activate(bundle, skin);
  c.swap = { from, t0: performance.now(), dur: SWAP_MS };
  await wait(SWAP_MS);
  c.swap = null;
  from.dispose();

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

/** Seek to a fraction of the record (the platter's time arc). */
export function seekToFraction(f) {
  const s = useStore.getState();
  if (!c.track || s.switching || s.phase !== 'playing') return;
  s.requestSeek(f * trackDuration(c.track.meta));
}

/** Position in the record, 0..1 (the platter's time arc). */
export function progress() {
  if (!c.track) return 0;
  return c.track.skin.time() / trackDuration(c.track.meta);
}

function say(id) {
  const { lang } = useStore.getState();
  c.narrator.say(narrationLine(c.track.id, c.track.meta, id, lang), lang);
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
  if (!s.playing || !c.track) return null;
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
  // Long gaps (tab in the background) are capped so the globe does not jump half a turn.
  if (s.playing) live.rotation -= Math.min(dt, 0.5) * ((2 * Math.PI) / SECONDS_PER_TURN);
  if (s.seekTo != null) {
    skin.seek(s.seekTo);
    useStore.setState({ seekTo: null });
  }
  skin.advance(dt);
  const step = stepAt(meta, skin.time());
  live.lon = lonUnderNeedle(live.rotation);
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

  if (prev < 0 || !s.playing || s.switching) return;
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
