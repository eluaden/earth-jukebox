import { $, $$ } from './dom.js';
import { t, getLang } from '../i18n/index.js';
import * as audio from '../audio/engine.js';
import { say, hush } from '../narration/narrator.js';
import { SPEECH } from '../narration/lines.js';
import { D } from '../data/illustrative.js';
import { expand } from './fullscreen.js';

/* ===== player ===== */
const SPY = .55;
let playing = false, idx = 0, timer = null, introDone = false;
export const live = { ice: D.norm[0], wind: 0 };
export const isPlaying = () => playing;

export function render() {
  const y = D.years[Math.min(idx, D.years.length - 1)];
  $('#yr').textContent = y; $('#scrub').value = Math.min(idx, 45); $('#scrub').setAttribute('aria-valuetext', String(y));
  $('#tubeIce').style.height = (6 + 90 * live.ice) + '%';
  $('#tubeWind').style.height = (4 + 90 * live.wind) + '%';
  $('#fsIce').style.height = (4 + 96 * live.ice) + '%'; $('#fsWind').style.height = (4 + 96 * live.wind) + '%';
  const lit = Math.floor((y - 1979) / 4.6);
  $$('#bigLamps i').forEach((l, i) => l.classList.toggle('on', (playing || idx > 0) && i <= lit));
}

function pulse(cls, ms) { const fc = $('#face'); fc.classList.add(cls); setTimeout(() => fc.classList.remove(cls), ms); }

function step() {
  if (!playing) return;
  if (idx >= D.years.length) { finish(); return; }
  const y = D.years[idx], v = D.norm[idx];
  live.ice = v; live.wind = Math.pow(1 - v, 1.5); audio.layers(v); audio.tick(y % 10 === 0); pulse('tick', 120);
  if (D.records.includes(y)) {
    audio.bell(); pulse('bell', 700);
    const s = SPEECH[getLang()].rec(y); $('#status').textContent = s; audio.duck(true);
    say(s).then(() => { audio.duck(false); if ($('#caption').textContent === s) $('#caption').textContent = ''; });
  }
  render(); idx++; timer = setTimeout(step, SPY * 1000);
}

export async function start() {
  await audio.resume(); playing = true; setPlayUi(); $('#bigplay').hidden = true;
  if (idx >= D.years.length) idx = 0;
  audio.layers(D.norm[idx]);
  if (!introDone) {
    const s = SPEECH[getLang()].intro; $('#status').textContent = s; audio.duck(true); await say(s); audio.duck(false);
    $('#caption').textContent = ''; if (!playing) return;
  }
  introDone = true; step();
}

export function pause() { playing = false; clearTimeout(timer); setPlayUi(); audio.silence(.1); hush(); $('#bigplay').hidden = false; }

async function finish() {
  playing = false; setPlayUi(); audio.silence(.6);
  const s = SPEECH[getLang()].outro; $('#status').textContent = s; await say(s); $('#caption').textContent = ''; $('#bigplay').hidden = false;
}

export function setPlayUi() {
  $('#pText').textContent = playing ? t('pause') : t('play');
  $('#pIcon').innerHTML = playing ? '<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>' : '<path d="M6 4l14 8-14 8z"/>';
  $('#bigplay').setAttribute('aria-label', t('play'));
  $('#fsPIcon').innerHTML = $('#pIcon').innerHTML; $('#fsPlay').setAttribute('aria-label', playing ? t('pause') : t('play'));
}

export function initPlayer() {
  $('#play').addEventListener('click', () => (playing ? pause() : start()));
  $('#bigplay').addEventListener('click', (e) => { e.stopPropagation(); expand(); start(); });
  $('#restart').addEventListener('click', () => { pause(); idx = 0; introDone = false; live.ice = D.norm[0]; live.wind = 0; $('#caption').textContent = ''; render(); });
  $('#scrub').addEventListener('input', (e) => { idx = +e.target.value; live.ice = D.norm[idx]; live.wind = Math.pow(1 - live.ice, 1.5); if (audio.hasAudio() && playing) audio.layers(live.ice); render(); });
  /* demos */
  $$('[data-demo]').forEach((b) => b.addEventListener('click', () => audio.demo(b.dataset.demo)));
}
