/**
 * Voice and captions. `say(text)` shows the caption (if captions are on) and speaks the text
 * (if narration is on and the browser has speech synthesis). Resolves when the line is over.
 */
let opts = { captionsOn: () => true, narrateOn: () => true, speechLang: () => 'en-US', showCaption: () => {} };

export function configureNarrator(o) { opts = { ...opts, ...o }; }

export function say(text) {
  if (opts.captionsOn()) opts.showCaption(text);
  if (!opts.narrateOn() || !('speechSynthesis' in window)) return new Promise((r) => setTimeout(r, Math.min(4000, text.length * 55)));
  return new Promise((res) => {
    try {
      const u = new SpeechSynthesisUtterance(text); u.lang = opts.speechLang(); u.onend = res; u.onerror = res;
      speechSynthesis.speak(u); setTimeout(res, 15000);
    } catch (e) { res(); }
  });
}

export function hush() { try { speechSynthesis.cancel(); } catch (e) {} }
