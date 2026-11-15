// Narration with captions, one short line at a time, in step with the voice.
//
// Voice: a recorded MP3 when public/narration/manifest.json lists this exact line in this language
// (looked up by lineKey(lang, text), see key.js: a line whose text changes falls back to speech
// synthesis until it is recorded again), otherwise the browser's speech synthesis. While someone
// speaks the music ducks; the whole line also goes to the screen-reader live region.

import { lineKey } from './key.js';

const LOCALES = { en: 'en-US', pt: 'pt-BR', es: 'es-ES' };
export const MAX_CAPTION = 46; // characters per caption line
export const MAX_CAPTION_STRONG = 60; // a line may run this long to end on a sentence break
const READ_MS = 62; // reading / speaking time per character when it cannot be measured

const lastStrong = (s) => Math.max(s.lastIndexOf('. '), s.lastIndexOf(': '), s.lastIndexOf('; '), s.lastIndexOf('? '), s.lastIndexOf('! '));

/**
 * Splits a text into caption lines: at sentence ends and commas when possible. A line ending on a
 * sentence break (. : ; ? !) may reach MAX_CAPTION_STRONG characters, so a phrase such as
 * "a NASA map:" is not cut before its last word; other lines stay within MAX_CAPTION.
 * Returns [{ text, start }] with `start` = offset in the full text.
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
      const strong = lastStrong(rest.slice(0, MAX_CAPTION_STRONG + 1));
      const soft = window.lastIndexOf(', ');
      const space = window.lastIndexOf(' ');
      cut = strong > MAX_CAPTION * 0.4 ? strong + 1 : soft > MAX_CAPTION * 0.4 ? soft + 1 : space > 0 ? space : MAX_CAPTION;
    } else {
      const end = rest.search(/[.?!] /); // short rest with two sentences: one per line
      if (end > 0 && rest.length > MAX_CAPTION * 0.6) cut = end + 1;
    }
    out.push({ text: rest.slice(0, cut).trim(), start: pos });
    pos += cut;
  }
  return out;
}

export function createNarrator({ base, duck, setCaption, announce }) {
  let manifest = null; // lineKey -> file under narration/
  let audio = null;
  let token = 0;

  async function loadManifest() {
    if (manifest) return manifest;
    try {
      const res = await fetch(`${base}narration/manifest.json`);
      manifest = res.ok ? (await res.json()).lines || {} : {};
    } catch {
      manifest = {};
    }
    return manifest;
  }

  /** Shows the caption line under the voice's position (a character offset in the text). */
  function captioner(text, mine) {
    const lines = captionLines(text);
    let shown = -1;
    return {
      length: text.length,
      at(offset) {
        if (mine !== token) return;
        let i = 0;
        while (i + 1 < lines.length && lines[i + 1].start <= offset) i++;
        if (i !== shown) {
          shown = i;
          setCaption(lines[i].text);
        }
      },
    };
  }

  /** Advances the caption by the clock when the voice gives no position. Returns stop(). */
  function clockCaptions(cap, totalMs) {
    const t0 = performance.now();
    cap.at(0);
    const timer = setInterval(() => cap.at(Math.min(cap.length - 1, ((performance.now() - t0) / totalMs) * cap.length)), 120);
    return () => clearInterval(timer);
  }

  function playFile(url, cap) {
    return new Promise((resolve) => {
      const a = new Audio(url);
      let done = false;
      // A recorded voice speaks at a steady pace: its position in time is its position in the text.
      const timer = setInterval(() => a.duration > 0 && cap.at((a.currentTime / a.duration) * cap.length), 100);
      const end = () => {
        if (done) return;
        done = true;
        clearInterval(timer);
        if (audio === a) audio = null;
        resolve();
      };
      a.onended = end;
      a.onerror = end;
      a.onpause = () => !a.ended && end();
      audio = a;
      cap.at(0);
      a.play().catch(end);
      setTimeout(end, 60000);
    });
  }

  /** No voice: the caption alone, at reading pace. */
  function silent(text, cap) {
    const total = Math.min(20000, Math.max(1200, text.length * READ_MS));
    return new Promise((resolve) => {
      const stopClock = clockCaptions(cap, total);
      setTimeout(() => {
        stopClock();
        resolve();
      }, total);
    });
  }

  function speak(text, lang, cap) {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    // No speech engine or no voice installed: show the caption for the time it takes to read it.
    if (!synth || synth.getVoices().length === 0) return silent(text, cap);
    return new Promise((resolve) => {
      let stopClock = clockCaptions(cap, text.length * READ_MS);
      let finished = false;
      const end = () => {
        if (finished) return;
        finished = true;
        stopClock();
        resolve();
      };
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = LOCALES[lang] || 'en-US';
        const voices = synth.getVoices();
        const voice = voices.find((v) => v.lang === u.lang) || voices.find((v) => v.lang.startsWith(lang));
        if (voice) u.voice = voice;
        u.rate = 0.95;
        // Browsers that report word positions drive the caption exactly; the clock is the fallback.
        u.onboundary = (e) => {
          stopClock();
          stopClock = () => {};
          cap.at(e.charIndex);
        };
        u.onend = end;
        u.onerror = end;
        synth.speak(u);
        setTimeout(end, Math.max(15000, text.length * READ_MS * 2)); // some engines never fire onend
      } catch {
        end();
      }
    });
  }

  function stop() {
    token++;
    if (audio) audio.pause();
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    duck(false);
    setCaption('');
  }

  async function say(text, lang) {
    stop();
    const mine = token;
    const lines = await loadManifest();
    if (mine !== token) return;
    announce(text);
    duck(true);
    const cap = captioner(text, mine);
    const file = lines[lineKey(lang, text)];
    await (file ? playFile(`${base}narration/${file}`, cap) : speak(text, lang, cap));
    if (mine !== token) return;
    duck(false);
    setCaption('');
  }

  return { say, stop };
}
