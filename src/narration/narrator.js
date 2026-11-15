// Narration: pre-recorded voice files when they exist (ElevenLabs, listed in public/voice/manifest.json
// as "<track>-<id>"), otherwise the browser's speech synthesis as a fallback. While someone speaks the
// music ducks and the line shows as a caption.

const LOCALES = { en: 'en-US', pt: 'pt-BR', es: 'es-ES' };

export function createNarrator({ base, duck, setCaption }) {
  let manifest = null;
  let audio = null;
  let token = 0;

  async function loadManifest() {
    if (manifest) return manifest;
    try {
      manifest = await (await fetch(`${base}voice/manifest.json`)).json();
    } catch {
      manifest = {};
    }
    return manifest;
  }

  function readingTime(text) {
    return Math.max(2500, (text.split(/\s+/).length / 2.6) * 1000);
  }

  function playFile(url) {
    return new Promise((resolve) => {
      audio = new Audio(url);
      audio.onended = resolve;
      audio.onerror = resolve;
      audio.play().catch(resolve);
    });
  }

  function speak(text, lang) {
    return new Promise((resolve) => {
      const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
      // No speech engine or no voice installed: show the caption for the time it takes to read it.
      if (!synth || synth.getVoices().length === 0) return setTimeout(resolve, readingTime(text));
      const u = new SpeechSynthesisUtterance(text);
      u.lang = LOCALES[lang] || 'en-US';
      const voice = synth.getVoices().find((v) => v.lang === u.lang) || synth.getVoices().find((v) => v.lang.startsWith(lang));
      if (voice) u.voice = voice;
      u.rate = 0.95;
      const timer = setTimeout(resolve, readingTime(text) * 1.6); // some engines never fire onend
      u.onend = u.onerror = () => {
        clearTimeout(timer);
        resolve();
      };
      synth.speak(u);
    });
  }

  function stop() {
    token++;
    if (audio) audio.pause();
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    duck(false);
    setCaption('');
  }

  async function say(trackId, id, text, lang) {
    stop();
    const mine = ++token;
    const files = (await loadManifest())[lang] || [];
    if (mine !== token) return;
    setCaption(text);
    duck(true);
    if (files.includes(`${trackId}-${id}`)) await playFile(`${base}voice/${lang}/${trackId}-${id}.mp3`);
    else await speak(text, lang);
    if (mine !== token) return;
    duck(false);
    setTimeout(() => mine === token && setCaption(''), 600);
  }

  return { say, stop };
}
