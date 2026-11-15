/**
 * Voice and captions. `say(text)` speaks the text (if narration is on) and shows it as a caption
 * (if captions are on), one short line at a time, in step with the voice. Resolves when the
 * line is over.
 *
 * Voice: if public/narration/manifest.json lists a recorded MP3 for this exact line in this
 * language, that file is played. Otherwise the browser's speech synthesis speaks it.
 */
import { lineKey } from './key.js';

const BASE = import.meta.env.BASE_URL;
const MAX_CAPTION = 46;      // characters per caption line
const READ_MS = 62;          // reading / speaking time per character when it cannot be measured
let opts = { captionsOn: () => true, narrateOn: () => true, speechLang: () => 'en-US', lang: () => 'en', showCaption: () => {} };
let manifest = {};   // lineKey -> file path under narration/
let playingAudio = null;
let queue = Promise.resolve(), generation = 0; // lines play one after another

export function configureNarrator(o) { opts = { ...opts, ...o }; }

/** Loads the list of recorded lines. Safe to skip: without it every line uses speech synthesis. */
export async function loadRecordedLines() {
  try {
    const res = await fetch(`${BASE}narration/manifest.json`);
    if (res.ok) manifest = (await res.json()).lines || {};
  } catch (e) { manifest = {}; }
}

/**
 * Splits a text into caption lines: at sentence ends and commas when possible, never above
 * MAX_CAPTION characters. Returns [{ text, start }] with `start` = offset in the full text.
 */
export function captionLines(text) {
  const out = [];
  let pos = 0;
  while (pos < text.length) {
    while (text[pos] === ' ') pos++;
    const rest = text.slice(pos);
    if (!rest) break;
    let cut = rest.length;
    if (rest.length > MAX_CAPTION) {
      const window = rest.slice(0, MAX_CAPTION + 1);
      const strong = Math.max(window.lastIndexOf('. '), window.lastIndexOf(': '), window.lastIndexOf('; '), window.lastIndexOf('? '), window.lastIndexOf('! '));
      const soft = window.lastIndexOf(', ');
      const space = window.lastIndexOf(' ');
      cut = strong > MAX_CAPTION * 0.4 ? strong + 1 : soft > MAX_CAPTION * 0.4 ? soft + 1 : space > 0 ? space : MAX_CAPTION;
    } else {
      const end = rest.search(/[.?!] /);            // short rest with two sentences: one per line
      if (end > 0 && rest.length > MAX_CAPTION * 0.6) cut = end + 1;
    }
    out.push({ text: rest.slice(0, cut).trim(), start: pos });
    pos += cut;
  }
  return out;
}

/** Shows caption lines as the voice advances. progress(charOffset) is called by the voice. */
function captioner(text) {
  const lines = captionLines(text);
  let shown = -1;
  const on = () => opts.captionsOn();
  return {
    at(offset) {
      let i = 0;
      while (i + 1 < lines.length && lines[i + 1].start <= offset) i++;
      if (i !== shown) { shown = i; opts.showCaption(on() ? lines[i].text : ''); }
    },
    end() { opts.showCaption(''); },
    length: text.length,
  };
}

/** Advances the caption by the clock (used when the voice gives no position). Returns stop(). */
function clockCaptions(cap, totalMs) {
  const t0 = performance.now();
  cap.at(0);
  const timer = setInterval(() => cap.at(Math.min(cap.length - 1, ((performance.now() - t0) / totalMs) * cap.length)), 120);
  return () => clearInterval(timer);
}

function playFile(file, cap) {
  return new Promise((res) => {
    const a = new Audio(`${BASE}narration/${file}`);
    let done = false;
    const end = () => { if (done) return; done = true; clearInterval(timer); if (playingAudio === a) playingAudio = null; res(); };
    // The recorded voice speaks at a steady pace: its position in time is its position in the text.
    const timer = setInterval(() => { if (a.duration > 0) cap.at((a.currentTime / a.duration) * cap.length); }, 100);
    a.onended = end; a.onerror = end; a.onpause = () => { if (!a.ended) end(); };
    playingAudio = a;
    cap.at(0);
    a.play().catch(end);
    setTimeout(end, 60000);
  });
}

function synth(text, cap) {
  if (!('speechSynthesis' in window)) return silent(text, cap);
  return new Promise((res) => {
    let stop = clockCaptions(cap, text.length * READ_MS);
    const end = () => { stop(); res(); };
    try {
      const u = new SpeechSynthesisUtterance(text); u.lang = opts.speechLang();
      // Browsers that report word positions drive the caption exactly; the clock is the fallback.
      u.onboundary = (e) => { stop(); stop = () => {}; cap.at(e.charIndex); };
      u.onend = end; u.onerror = end;
      speechSynthesis.speak(u); setTimeout(end, Math.max(15000, text.length * READ_MS * 2));
    } catch (e) { end(); }
  });
}

/** No voice: the caption alone, at reading pace. */
function silent(text, cap) {
  if (!opts.captionsOn()) return new Promise((r) => setTimeout(r, 300));
  const total = Math.min(20000, Math.max(1200, text.length * READ_MS));
  return new Promise((res) => { const stop = clockCaptions(cap, total); setTimeout(() => { stop(); res(); }, total); });
}

export function say(text) {
  const mine = generation;
  const file = opts.narrateOn() ? manifest[lineKey(opts.lang(), text)] : null;
  queue = queue.then(async () => {
    if (mine !== generation) return;
    const cap = captioner(text);
    await (!opts.narrateOn() ? silent(text, cap) : file ? playFile(file, cap) : synth(text, cap));
    if (mine === generation) cap.end();
  });
  return queue;
}

export function hush() {
  generation++; queue = Promise.resolve();
  try { speechSynthesis.cancel(); } catch (e) {}
  if (playingAudio) { const a = playingAudio; playingAudio = null; a.pause(); }
  opts.showCaption('');
}
