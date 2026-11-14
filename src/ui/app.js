import { loadTrackIndex, loadTrack, trackUrl } from '../data/loadTrack.js';
import { SonificationEngine } from '../audio/engine.js';
import { pick } from '../i18n.js';

const LAYER_NAMES = { drone: 'Tone (drone)', texture: 'Wind (texture)', pulse: 'Tick (pulse)' };

export async function startApp(doc) {
  const $ = (id) => doc.getElementById(id);
  const ui = {
    list: $('track-list'), title: $('track-title'), warning: $('placeholder-warning'),
    img: $('frame-img'), label: $('frame-label'), play: $('play-btn'),
    progress: $('progress'), posText: $('position-text'), status: $('status'),
    mapping: $('mapping-list'), source: $('source-text'), player: $('player'),
  };
  const engine = new SonificationEngine();
  const state = { lang: 'en', track: null, loadedInEngine: false };

  const announce = (msg) => { ui.status.textContent = msg; };

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
    const t = tracks[id];
    const li = doc.createElement('li');
    const btn = doc.createElement('button');
    btn.type = 'button';
    btn.dataset.id = id;
    btn.textContent = t ? pick(t.title, state.lang) : `${id} (failed to load)`;
    btn.disabled = !t;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => selectTrack(id));
    li.append(btn);
    ui.list.append(li);
  }

  function selectTrack(id) {
    engine.stop();
    const t = tracks[id];
    state.track = t;
    state.loadedInEngine = false;
    ui.list.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === id)));
    ui.title.textContent = pick(t.title, state.lang);
    ui.warning.hidden = !t.placeholder;
    ui.source.textContent = `Source: ${t.source}`;
    ui.progress.max = String(t.labels.length - 1);
    ui.progress.disabled = false;
    ui.play.disabled = false;
    renderMapping(t);
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
      text.append(name, ` — ${key}: ${pick(m.meaning, state.lang)}`);
      li.append(text);
      for (const [label, value] of [['Hear lowest', 0], ['Hear highest', 1]]) {
        const b = doc.createElement('button');
        b.type = 'button';
        b.className = 'small';
        b.textContent = label;
        b.setAttribute('aria-label', `${label} ${key}`);
        b.addEventListener('click', async () => {
          await ensureEngine();
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
    ui.progress.setAttribute('aria-valuetext', `${label}, frame ${i + 1} of ${t.labels.length}`);
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

  // ---- Controls ---------------------------------------------------------
  async function togglePlay() {
    if (!state.track) return;
    await ensureEngine();
    engine.toggle();
  }
  ui.play.addEventListener('click', togglePlay);

  ui.progress.addEventListener('input', async () => {
    const i = Number(ui.progress.value);
    if (state.loadedInEngine) engine.seek(i);
    else showFrame(i);
  });

  doc.addEventListener('keydown', (e) => {
    const tag = e.target.tagName;
    const typing = tag === 'INPUT' && e.target.type !== 'range';
    const onButton = tag === 'BUTTON';
    if (typing || onButton) return; // let buttons handle Space/Enter natively
    if (e.key === ' ' || e.key.toLowerCase() === 'k') {
      e.preventDefault();
      togglePlay();
    }
  });

  // ---- Engine -> UI -----------------------------------------------------
  engine.on('frame', (i) => showFrame(i));
  engine.on('state', (s) => {
    ui.play.textContent = s === 'playing' ? 'Pause' : 'Play';
    const label = state.track?.labels[engine.frame] ?? '';
    if (s === 'playing') announce(`Playing from ${label}.`);
    if (s === 'paused') announce(`Paused at ${label}.`);
  });
  engine.on('event', (e) => {
    if (e.say) announce(pick(e.say, state.lang)); // narration module will speak these in step 3
  });
  engine.on('end', () => announce(`End of ${pick(state.track.title, state.lang)}.`));
}
