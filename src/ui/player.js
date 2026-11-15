import { $, $$ } from './dom.js';
import { t, pick, getLang } from '../i18n/index.js';
import * as audio from '../audio/engine.js';
import { say, hush } from '../narration/narrator.js';
import { getTrack, roles } from '../data/tracks.js';
import { trackUrl } from '../data/loadTrack.js';
import { expand } from './fullscreen.js';

/* ===== player =====
   One step = one frame of the NASA visualization. The values come from track.series
   (0..1, read from the frames by src/data/extract.js). */
let catalog = [];
let meta = null;        // selected track: JSON only
let track = null;       // selected track with its series (null while the frames are being read)
let role = {};          // { tone, wind, pulse } -> series key
let eventsAt = {};
let playing = false, idx = 0, timer = null, introDone = false, loadToken = 0;

/** What the tubes and the stand-in canvas show right now (0..1). */
export const live = { main: 0, wind: 0 };
export const isPlaying = () => playing;
export const currentId = () => meta && meta.id;
const count = () => (meta ? meta.labels.length : 0);
const video = () => $('#eicVideo');

/** Value of a series at step i; a missing reading (null) keeps the previous one. */
function val(key, i) {
  if (!track || !key) return 0;
  const s = track.series[key];
  for (let k = Math.min(i, s.length - 1); k >= 0; k--) if (s[k] != null) return s[k];
  return 0;
}

function readoutText(i) {
  if (!track || !track.values) return '';
  const unit = track.unit ? ' ' + track.unit : '';
  return Object.keys(track.mapping).map((key) => {
    const v = track.values[key][i];
    return `${pick(track.mapping[key].name) || key}: ${v == null ? '–' : v + unit}`;
  }).join(' · ');
}

export function render() {
  if (!meta) return;
  const n = count(), i = Math.min(idx, n - 1), label = meta.labels[i];
  const yr = $('#yr'); yr.textContent = label; yr.classList.toggle('long', String(label).length > 5);
  const readout = readoutText(i);
  $('#readout').textContent = readout;
  $('#scrub').value = i; $('#scrub').setAttribute('aria-valuetext', readout ? `${label}. ${readout}` : String(label));
  $('#tubeIce').style.height = (6 + 90 * live.main) + '%';
  $('#tubeWind').style.height = (4 + 90 * live.wind) + '%';
  $('#fsIce').style.height = (4 + 96 * live.main) + '%'; $('#fsWind').style.height = (4 + 96 * live.wind) + '%';
  const lit = Math.floor((i / n) * 10);
  $$('#bigLamps i').forEach((l, k) => l.classList.toggle('on', (playing || idx > 0) && k <= lit));
}

function setLive(i) { live.main = val(role.tone, i); live.wind = role.wind ? val(role.wind, i) : 0; }

/**
 * Keeps NASA's video in step with the sound. Step i sounds for secondsPerFrame; meanwhile the
 * video runs from times[i] to times[i + 1], so its speed is set per step.
 */
function syncVideo(i) {
  const v = video();
  if (!meta.video || v.hidden) return;
  const times = meta.video.times;
  i = Math.min(i, times.length - 1);
  const span = i + 1 < times.length ? times[i + 1] - times[i] : i > 0 ? times[i] - times[i - 1] : meta.secondsPerFrame;
  // Only jump when the picture has drifted: small corrections would make it stutter.
  if (!playing || Math.abs(v.currentTime - times[i]) > 0.25) v.currentTime = times[i];
  v.playbackRate = Math.min(16, Math.max(0.0625, span / meta.secondsPerFrame));
  if (playing && v.paused) v.play().catch(() => {});
  if (!playing && !v.paused) v.pause();
}

/** What the voice says at a step: the lines of its events, in one sentence group. */
const eventLine = (events, lang) => events.map((e) => (e.say && (e.say[lang] ?? e.say.en)) || '').filter(Boolean).join(' ');

function pulse(cls, ms) { const fc = $('#face'); fc.classList.add(cls); setTimeout(() => fc.classList.remove(cls), ms); }

let speaking = Promise.resolve();
function speak(s) {
  $('#status').textContent = s; audio.duck(true);
  return speaking = say(s).then(() => { audio.duck(false); if ($('#caption').textContent === s) $('#caption').textContent = ''; });
}

function step() {
  if (!playing) return;
  if (idx >= count()) { finish(); return; }
  const i = idx, events = eventsAt[i] || [];
  setLive(i);
  audio.tone(live.main); audio.wind(role.wind ? live.wind : null);
  const milestone = events.some((e) => e.type === 'milestone');
  if (milestone || i % (track.clockEvery || 1) === 0) { audio.tick(milestone, role.pulse ? val(role.pulse, i) : null); pulse('tick', 120); }
  if (events.some((e) => e.type === 'record')) { audio.bell(); pulse('bell', 700); }
  const line = eventLine(events, getLang());
  if (line) speak(line);
  syncVideo(i); render(); idx++; timer = setTimeout(step, track.secondsPerFrame * 1000);
}

export async function start() {
  if (!meta || playing) return;
  await audio.resume(); playing = true; setPlayUi(); $('#bigplay').hidden = true;
  const token = loadToken;
  if (!track) { try { await getTrack(meta.id); } catch (e) { /* selectTrack reports it */ } }
  if (!track || token !== loadToken || !playing) { if (!track) pause(); return; }
  if (idx >= count()) idx = 0;
  audio.setTimbre(track.mapping[role.tone]?.params || {});
  setLive(idx); audio.tone(live.main); audio.wind(role.wind ? live.wind : null); render();
  if (!introDone) {
    await speak(pick(track.narration.intro)); $('#caption').textContent = '';
    if (!playing || token !== loadToken) return;
  }
  introDone = true; step();
}

export function pause() {
  const was = playing;
  playing = false; clearTimeout(timer); setPlayUi(); audio.silence(.1); hush(); $('#bigplay').hidden = false;
  if (meta) { video().pause(); if (was) $('#status').textContent = `${t('pausedAt')} ${meta.labels[Math.max(0, Math.min(idx, count()) - 1)]}.`; }
}

async function finish() {
  playing = false; setPlayUi(); audio.silence(.6); video().pause();
  const token = loadToken;
  await speaking; if (token !== loadToken || playing) return;
  const s = pick(track.narration.outro); $('#status').textContent = s; await say(s); $('#caption').textContent = ''; $('#bigplay').hidden = false;
}

export function setPlayUi() {
  $('#pText').textContent = playing ? t('pause') : t('play');
  $('#pIcon').innerHTML = playing ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>' : '<path d="M6 4l14 8-14 8z"/>';
  $('#bigplay').setAttribute('aria-label', t('play'));
  $('#restart').setAttribute('aria-label', t('restart'));
  $('#fsPIcon').innerHTML = $('#pIcon').innerHTML; $('#fsPlay').setAttribute('aria-label', playing ? t('pause') : t('play'));
}

/** Texts that come from the selected track (called again when the language changes). */
export function renderTrackTexts() {
  if (!meta) return;
  const r = roles(meta), m = meta.mapping;
  $('#now-t').textContent = pick(meta.title);
  $('#nowLabel').textContent = `${t('nowPlaying')} · ${meta.code}`;
  $('#chipTrack').textContent = `${meta.code} · ${meta.short}`;
  $('#tlMain').textContent = $('#fsMainL').textContent = m[r.tone]?.tube || '';
  $('#tlWind').textContent = $('#fsWindL').textContent = r.wind ? m[r.wind].tube || '' : '';
  $('#tubeWindBox').classList.toggle('off', !r.wind); $('#fsWindBox').classList.toggle('off', !r.wind);
  const rows = [['solid', r.tone && pick(m[r.tone].meaning)], ['stripe', r.wind && pick(m[r.wind].meaning)],
    ['dots', [r.pulse && pick(m[r.pulse].meaning), t('lgTime')].filter(Boolean).join('. ')]];
  $('#legend').replaceChildren(...rows.filter(([, text]) => text).map(([sw, text]) => {
    const d = document.createElement('div');
    const s = document.createElement('span'); s.className = 'sw ' + sw; s.setAttribute('aria-hidden', 'true');
    const p = document.createElement('span'); p.textContent = text;
    d.append(s, p); return d;
  }));
  $$('#discs .disc').forEach((b) => {
    const m2 = catalog.find((c) => c.id === b.dataset.track);
    b.querySelector('b').textContent = pick(m2.title);
    b.setAttribute('aria-pressed', String(m2.id === meta.id));
  });
  $$('#deck i').forEach((l, k) => l.classList.toggle('on', k === catalog.indexOf(meta)));
  render();
}

/** Puts a record on: resets the player and reads the track's frames. */
export async function selectTrack(id) {
  const next = catalog.find((c) => c.id === id);
  if (!next || (meta && next.id === meta.id)) return;
  if (playing) pause();
  hush();
  const token = ++loadToken;
  meta = next; track = null; role = roles(meta); eventsAt = {}; idx = 0; introDone = false; live.main = 0; live.wind = 0;
  $('#caption').textContent = '';
  $('#scrub').max = count() - 1;
  const v = video(), cv = $('#frame');
  if (meta.video) { v.src = trackUrl(meta.id, meta.video.file); v.hidden = false; cv.hidden = true; v.currentTime = meta.video.times[0] || 0; }
  else { v.removeAttribute('src'); v.hidden = true; cv.hidden = false; }
  renderTrackTexts();
  $('#status').textContent = t('reading');
  try {
    const full = await getTrack(id);
    if (token !== loadToken) return;
    track = full;
    (track.events || []).forEach((e) => (eventsAt[e.frame] ||= []).push(e));
    setLive(0); render();
    if (!playing) $('#status').textContent = t('ready');
  } catch (e) {
    console.error(e);
    if (token === loadToken) $('#status').textContent = t('loadError');
  }
}

export function initPlayer(tracks) {
  catalog = tracks;
  $('#discs').replaceChildren(...catalog.map((c) => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'disc'; b.dataset.track = c.id; b.setAttribute('aria-pressed', 'false');
    b.innerHTML = '<svg viewBox="0 0 200 200" aria-hidden="true"><use href="#vinyl"/></svg><span><b></b><small></small></span>';
    b.querySelector('small').textContent = `${c.code} · ${c.period}`;
    b.addEventListener('click', () => selectTrack(c.id));
    return b;
  }));
  $('#play').addEventListener('click', () => (playing ? pause() : start()));
  $('#bigplay').addEventListener('click', (e) => { e.stopPropagation(); expand(); start(); });
  $('#restart').addEventListener('click', () => { pause(); idx = 0; introDone = false; setLive(0); $('#caption').textContent = ''; syncVideo(0); render(); $('#status').textContent = ''; });
  $('#scrub').addEventListener('input', (e) => {
    idx = +e.target.value; setLive(idx);
    if (audio.hasAudio() && playing) { audio.tone(live.main); audio.wind(role.wind ? live.wind : null); }
    syncVideo(idx); render();
  });
  // Space or K: play / pause, unless a control that uses those keys has the focus.
  document.addEventListener('keydown', (e) => {
    if (document.body.dataset.current !== 'listen' || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key !== ' ' && e.key.toLowerCase() !== 'k') return;
    if (e.target.closest('button, a, input, select, textarea')) return;
    e.preventDefault(); playing ? pause() : start();
  });
  /* demos */
  $$('[data-demo]').forEach((b) => b.addEventListener('click', () => { if (!playing) audio.demo(b.dataset.demo); }));
  if (catalog.length) selectTrack(catalog[0].id);
}

/**
 * Every line the voice can say, for all tracks and languages, with when it is said.
 * Used by the local script that records the narration (window.earthJukebox.narrationLines()).
 */
export async function narrationLines() {
  const out = [];
  for (const c of catalog) {
    const tr = await getTrack(c.id);
    const byFrame = {};
    (tr.events || []).forEach((e) => (byFrame[e.frame] ||= []).push(e));
    const frames = Object.keys(byFrame).map(Number).sort((a, b) => a - b);
    for (const lang of ['en', 'pt', 'es']) {
      const add = (kind, text, extra = {}) => text && out.push({ track: c.id, lang, kind, text, ...extra });
      add('intro', tr.narration.intro[lang] ?? tr.narration.intro.en);
      frames.forEach((f, k) => add('event', eventLine(byFrame[f], lang), {
        frame: f, time: +(f * tr.secondsPerFrame).toFixed(3),
        // seconds until the next spoken line (or the end of the track): the line should fit in it
        // (null for the last line: the outro waits for it)
        room: k + 1 < frames.length ? +((frames[k + 1] - f) * tr.secondsPerFrame).toFixed(3) : null,
      }));
      add('outro', tr.narration.outro[lang] ?? tr.narration.outro.en);
    }
  }
  return out;
}

export const speechLang = () => ({ en: 'en-US', pt: 'pt-BR', es: 'es-ES' }[getLang()]);
