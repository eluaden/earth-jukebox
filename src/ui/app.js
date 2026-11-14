import { loadTrackIndex, loadTrack, trackUrl } from '../data/loadTrack.js';
import { SonificationEngine } from '../audio/engine.js';
import { Narrator, LOCALES } from '../narration/narrator.js';
import { runIntro, sayEvent, runOutro } from '../narration/guide.js';
import { pick } from '../i18n.js';

const LAYER_NAMES = { drone: 'Tone (drone)', texture: 'Wind (texture)', pulse: 'Tick (pulse)' };

export async function startApp(doc) {
  const $ = (id) => doc.getElementById(id);
  const ui = {
    list: $('track-list'), title: $('track-title'), warning: $('placeholder-warning'),
    img: $('frame-img'), label: $('frame-label'), play: $('play-btn'), intro: $('intro-btn'),
    progress: $('progress'), posText: $('position-text'), status: $('status'),
    caption: $('caption'), values: $('values-text'), mapping: $('mapping-list'), source: $('source-text'),
    lang: $('lang-select'), narration: $('narration-toggle'),
  };
  const engine = new SonificationEngine();
  const narrator = new Narrator();
  const state = {
    lang: 'en', track: null, loadedInEngine: false,
    introRunning: null,   // promise while the introduction + audio legend is playing
    introDone: false,     // the intro plays automatically once per track selection
    preloaded: [],
  };

  /** Screen-reader announcement (aria-live). Keep these short. */
  const announce = (msg) => { ui.status.textContent = msg; };

  /**
   * A narration line. Always shown as a caption. If no voice is going to speak it,
   * it goes to the live region instead, so screen readers never hear it twice.
   */
  const showText = (text) => {
    ui.caption.textContent = text;
    if (!narrator.enabled || !narrator.hasVoice) announce(text);
  };

  const ctx = () => ({
    track: state.track, lang: state.lang, narrator, engine, onText: showText,
    resolveUrl: (file) => trackUrl(state.track.id, file),
  });

  // ---- Track list -------------------------------------------------------
  let ids = [];
  try {
    ids = await loadTrackIndex();
  } catch (e) {
    announce(e.message);
    return;
  }
  const tracks = {};
  for (const id of ids) {
    try { tracks[id] = await loadTrack(id); } catch (e) { console.error(e); }
  }
  for (const id of ids) {
    const li = doc.createElement('li');
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.dataset.id = id;
    btn.disabled = !tracks[id];
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => selectTrack(id));
    li.append(btn);
    ui.list.append(li);
  }

  /** (Re)writes every text that depends on the narration language. */
  function renderTexts() {
    const locale = LOCALES[state.lang];
    ui.list.querySelectorAll('button').forEach((b) => {
      const t = tracks[b.dataset.id];
      b.textContent = t ? pick(t.title, state.lang) : `${b.dataset.id} (failed to load)`;
      b.lang = locale;
    });
    ui.caption.lang = locale;
    ui.caption.textContent = '';
    if (state.track) {
      ui.title.textContent = pick(state.track.title, state.lang);
      ui.title.lang = locale;
      renderMapping(state.track);
    }
  }

  async function selectTrack(id) {
    await stopAll();
    const t = tracks[id];
    state.track = t;
    state.loadedInEngine = false;
    state.introDone = false;
    ui.list.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
    ui.warning.hidden = !t.placeholder;
    ui.source.textContent = `Source: ${t.source}`;
    ui.progress.max = String(t.labels.length - 1);
    ui.progress.disabled = false;
    ui.play.disabled = false;
    ui.intro.disabled = false;
    // Preload every frame so the picture never lags behind the sound.
    state.preloaded = t.frames.map((f) => { const im = new Image(); im.src = trackUrl(t.id, f); return im; });
    renderTexts();
    showFrame(0);
    announce(`${pick(t.title, state.lang)} selected. Press Play to listen.`);
    ui.play.focus();
  }

  function renderMapping(t) {
    ui.mapping.replaceChildren();
    for (const [key, m] of Object.entries(t.mapping)) {
      const li = doc.createElement('li');
      const text = doc.createElement('span');
      const name = doc.createElement('strong');
      name.textContent = LAYER_NAMES[m.layer];
      const meaning = doc.createElement('span');
      meaning.lang = LOCALES[state.lang];
      meaning.textContent = pick(m.meaning, state.lang);
      text.append(name, ` — ${key}: `, meaning);
      li.append(text);
      for (const [label, value] of [['Hear lowest', 0], ['Hear highest', 1]]) {
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = 'small';
        b.textContent = label;
        b.setAttribute('aria-label', `${label} ${key}`);
        b.addEventListener('click', async () => {
          if (state.introRunning) return;
          await ensureEngine();
          narrator.cancel();
          const legend = m.legend && pick(value ? m.legend.max : m.legend.min, state.lang);
          announce(legend || `${label} ${key}`);
          await engine.previewValue(key, value);
        });
        li.append(' ', b);
      }
      ui.mapping.append(li);
    }
    if (t.clock !== false && !Object.values(t.mapping).some((m) => m.layer === 'pulse')) {
      const li = doc.createElement('li');
      li.innerHTML = `<strong>${LAYER_NAMES.pulse}</strong> — one tick per frame (time). Strong tick = milestone. Bell = record.`;
      ui.mapping.append(li);
    }
  }

  function showFrame(i) {
    const t = state.track;
    if (!t) return;
    const label = t.labels[i];
    ui.label.textContent = label;
    ui.progress.value = String(i);
    // Real-world values behind the sound (only for tracks extracted from frames).
    let readout = '';
    if (t.values) {
      const unit = t.extraction?.colormap?.unit ?? '';
      readout = Object.entries(t.values)
        .map(([key, vals]) => `${key} ${vals[i] ?? 'no data'}`).join(', ') + ` ${unit}`;
    }
    ui.values.textContent = readout;
    ui.progress.setAttribute('aria-valuetext',
      `${label}, frame ${i + 1} of ${t.labels.length}${readout ? `. ${readout}` : ''}`);
    ui.posText.textContent = `${i + 1} / ${t.labels.length}`;
    if (t.frames.length) {
      ui.img.src = trackUrl(t.id, t.frames[i]);
      ui.img.hidden = false;
    } else {
      ui.img.hidden = true;
    }
  }

  // Audio may only start after a user gesture: init happens inside click handlers.
  async function ensureEngine() {
    await engine.init();
    if (!state.loadedInEngine && state.track) {
      engine.load(state.track);
      state.loadedInEngine = true;
      engine.seek(Number(ui.progress.value));
    }
  }

  // ---- Session flow: introduction + audio legend -> track -> outro -------
  function updatePlayButton() {
    ui.play.textContent = state.introRunning ? 'Skip introduction'
      : engine.state === 'playing' ? 'Pause' : 'Play';
  }

  /** Speaks the intro and plays the audio legend, then starts the track from the top. */
  async function startIntro() {
    await ensureEngine();
    if (state.introRunning) return;
    engine.pause();
    narrator.cancel();
    engine.seek(0);
    announce('Introduction.');
    const run = runIntro(ctx());
    state.introRunning = run;
    updatePlayButton();
    const finished = await run;
    if (state.introRunning !== run) return; // someone else took over
    state.introRunning = null;
    updatePlayButton();
    if (finished) {
      state.introDone = true;
      engine.play();
    }
  }

  /** Stops the intro (speech + legend sound) and waits until it has fully wound down. */
  async function cancelIntro() {
    const run = state.introRunning;
    if (!run) return;
    narrator.cancel();
    engine.cancelPreview();
    await run;
    if (state.introRunning === run) state.introRunning = null;
    updatePlayButton();
  }

  function silenceNarration() {
    narrator.cancel();
    engine.setDucked(false);
  }

  async function togglePlay() {
    if (!state.track) return;
    if (state.introRunning) {            // "Skip introduction"
      await cancelIntro();
      state.introDone = true;
      engine.play();
      return;
    }
    await ensureEngine();
    if (engine.state === 'playing') {
      engine.pause();
      silenceNarration();
      return;
    }
    silenceNarration();
    const atStart = engine.frame === 0 || engine.frame >= engine.frameCount - 1;
    if (narrator.enabled && !state.introDone && atStart) startIntro();
    else engine.play();
  }

  async function stopAll() {
    await cancelIntro();
    silenceNarration();
    if (state.loadedInEngine) { engine.stop(); engine.seek(0); }
    ui.caption.textContent = '';
  }

  ui.play.addEventListener('click', togglePlay);
  ui.intro.addEventListener('click', async () => {
    if (state.introRunning) return;
    silenceNarration();
    startIntro();
  });

  ui.progress.addEventListener('input', () => {
    const i = Number(ui.progress.value);
    if (state.loadedInEngine) engine.seek(i);
    else showFrame(i);
  });

  ui.lang.addEventListener('change', async () => {
    await cancelIntro();
    silenceNarration();
    state.lang = ui.lang.value;
    narrator.setLang(state.lang);
    renderTexts();
    announce(`Narration language: ${ui.lang.selectedOptions[0].textContent}.`);
  });

  ui.narration.addEventListener('change', async () => {
    if (!ui.narration.checked) { await cancelIntro(); engine.setDucked(false); }
    narrator.setEnabled(ui.narration.checked);
    announce(`Spoken narration ${ui.narration.checked ? 'on' : 'off'}.`);
  });

  doc.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.track) {
      stopAll().then(() => announce('Stopped.'));
      return;
    }
    const tag = e.target.tagName;
    const interactive = tag === 'BUTTON' || tag === 'SELECT'
      || (tag === 'INPUT' && e.target.type !== 'range');
    if (interactive) return; // let controls handle Space/Enter natively
    if (e.key === ' ' || e.key.toLowerCase() === 'k') {
      e.preventDefault();
      togglePlay();
    }
  });

  // ---- Engine -> UI -----------------------------------------------------
  engine.on('frame', (i) => showFrame(i));
  engine.on('state', (s) => {
    updatePlayButton();
    const label = state.track?.labels[engine.frame] ?? '';
    if (s === 'playing') announce(`Playing from ${label}.`);
    if (s === 'paused' && !state.introRunning) announce(`Paused at ${label}.`);
  });
  engine.on('event', (e) => { sayEvent(ctx(), e); });
  engine.on('end', async () => {
    announce(`End of ${pick(state.track.title, state.lang)}.`);
    await runOutro(ctx());
  });

  renderTexts();
  window.earthJukebox = { tracks, engine, narrator }; // handy for debugging in the console
}
