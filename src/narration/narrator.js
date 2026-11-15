/**
 * Voice and captions. `say(text)` shows the caption (if captions are on) and speaks the text
 * (if narration is on). Resolves when the line is over.
 *
 * Voice: if public/narration/manifest.json lists a recorded MP3 for this exact line in this
 * language, that file is played. Otherwise the browser's speech synthesis speaks it.
 */
import { lineKey } from './key.js';

const BASE = import.meta.env.BASE_URL;
let opts = { captionsOn: () => true, narrateOn: () => true, speechLang: () => 'en-US', lang: () => 'en', showCaption: () => {} };
let manifest = {};   // lineKey -> file path under narration/
let playingAudio = null;
let queue = Promise.resolve(), generation = 0; // recorded lines play one after another

export function configureNarrator(o) { opts = { ...opts, ...o }; }

/** Loads the list of recorded lines. Safe to skip: without it every line uses speech synthesis. */
export async function loadRecordedLines() {
  try {
    const res = await fetch(`${BASE}narration/manifest.json`);
    if (res.ok) manifest = (await res.json()).lines || {};
  } catch (e) { manifest = {}; }
}

function playFile(file) {
  return new Promise((res) => {
    const a = new Audio(`${BASE}narration/${file}`);
    let done = false;
    const end = () => { if (done) return; done = true; if (playingAudio === a) playingAudio = null; res(); };
    a.onended = end; a.onerror = end; a.onpause = () => { if (!a.ended) end(); };
    playingAudio = a;
    a.play().catch(end);
    setTimeout(end, 60000);
  });
}

function synth(text) {
  if (!('speechSynthesis' in window)) return new Promise((r) => setTimeout(r, Math.min(4000, text.length * 55)));
  return new Promise((res) => {
    try {
      const u = new SpeechSynthesisUtterance(text); u.lang = opts.speechLang(); u.onend = res; u.onerror = res;
      speechSynthesis.speak(u); setTimeout(res, 15000);
    } catch (e) { res(); }
  });
}

export function say(text) {
  if (opts.captionsOn()) opts.showCaption(text);
  if (!opts.narrateOn()) return new Promise((r) => setTimeout(r, Math.min(4000, text.length * 55)));
  const file = manifest[lineKey(opts.lang(), text)];
  if (!file) return synth(text); // speech synthesis keeps its own queue
  const mine = generation;
  queue = queue.then(() => (mine === generation ? playFile(file) : undefined));
  return queue;
}

export function hush() {
  generation++; queue = Promise.resolve();
  try { speechSynthesis.cancel(); } catch (e) {}
  if (playingAudio) { const a = playingAudio; playingAudio = null; a.pause(); }
}
