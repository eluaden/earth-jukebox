/**
 * Narrator — speaks text in the chosen language.
 * Uses a recorded MP3 when the track provides one, otherwise the browser voice
 * (Web Speech API). Calls are queued; cancel() silences everything at once.
 */
export const LOCALES = { en: 'en-US', pt: 'pt-BR', es: 'es-ES' };

export class Narrator {
  constructor() {
    this.enabled = true;
    this.lang = 'en';
    this.generation = 0;       // bumped by cancel(): older queued calls become no-ops
    this.queue = Promise.resolve();
    this._finish = null;
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.synth?.getVoices();   // voices load asynchronously in Chrome: warm up
  }

  get hasVoice() { return !!this.synth; }

  setLang(lang) { this.lang = lang; }
  setEnabled(on) { this.enabled = on; if (!on) this.cancel(); }

  /** Stops current speech and drops everything queued. */
  cancel() {
    this.generation++;
    this.synth?.cancel();
    if (this.audio) { this.audio.pause(); this.audio = null; }
    this._finish?.(false);
  }

  /**
   * Speak `text`; `audioUrl` (optional) is a recorded MP3 used instead of the browser voice.
   * Resolves true when finished, false if cancelled. Resolves true at once when disabled.
   */
  say(text, audioUrl) {
    if (!this.enabled || !text) return Promise.resolve(true);
    const gen = this.generation;
    const run = async () => {
      if (gen !== this.generation) return false;
      if (audioUrl) {
        const r = await this._playFile(audioUrl);
        if (r !== 'error') return r;
      }
      return this._speak(text);
    };
    const p = this.queue.then(run, run);
    this.queue = p.catch(() => {});
    return p;
  }

  _playFile(url) {
    return new Promise((resolve) => {
      const a = new Audio(url);
      this.audio = a;
      this._finish = (ok) => { this._finish = null; resolve(ok); };
      a.addEventListener('ended', () => this._finish?.(true));
      a.addEventListener('error', () => { this._finish = null; resolve('error'); });
      a.play().catch(() => { this._finish = null; resolve('error'); });
    });
  }

  _speak(text) {
    if (!this.synth) return Promise.resolve(true);
    return new Promise((resolve) => {
      const locale = LOCALES[this.lang] || 'en-US';
      const u = new SpeechSynthesisUtterance(text);
      this._utterance = u; // keep a reference: Chrome drops events of collected utterances
      u.lang = locale;
      u.rate = 0.95;
      const voices = this.synth.getVoices();
      const voice = voices.find((v) => v.lang.replace('_', '-') === locale)
        || voices.find((v) => v.lang.toLowerCase().startsWith(this.lang));
      if (voice) u.voice = voice;
      // Safety net: some browsers never fire "end".
      const timer = setTimeout(() => this._finish?.(true), 2500 + text.length * 110);
      this._finish = (ok) => { clearTimeout(timer); this._finish = null; resolve(ok); };
      u.onend = () => this._finish?.(true);
      u.onerror = () => this._finish?.(true);
      this.synth.speak(u);
    });
  }
}
