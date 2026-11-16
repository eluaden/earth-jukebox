import * as Tone from 'tone';
import { duckGain, isAudible } from './mix.js';
import { INSTRUMENTS } from './instruments.js';

// Plays what a track's music module decides (src/music/tracks/index.js). Every voice of the current
// track gets its own sampled instrument (VSCO 2 CE, CC0) through a low-pass filter and a gain (mute /
// solo), then ducking, reverb and a limiter. The samples are decoded once and shared, so changing
// track only rebuilds the voices. Vinyl crackle (S2, not data, declared in the liner notes) runs
// underneath while the needle is on the record; with the needle up the record is silent. One-shot
// SFX (S1, S3–S7) sit on a separate bus so they do not duck with the narration. The music bus has two
// gain stages in series, so neither ramp cancels the other: the intro level (first visit rises under
// the opening narration) and the duck (the voice stays clear; deeper during the first-visit tutorial).

const BPM = 84;
const PULSE = '8n';
const OPEN_FILTER = 9000; // Hz: voices whose brightness is not driven by the data
const DUCK_DB = -10;
const MAKEUP_DB = 18;
const VOICE_FADE = 0.3; // s: old voices fade out when the track changes

// Direction §7.2: files in public/sfx/. Gain is linear after the file's own level (glass-tap /
// record-swap are normalised on copy; whoosh stays quiet so it does not cover the welcome voice).
const SFX = {
  'needle-drop': { file: 'needle-drop.mp3', gain: 0.7 },
  'needle-lift': { file: 'needle-lift.mp3', gain: 0.5 },
  'platter-spin-up': { file: 'platter-spin-up.mp3', gain: 0.45 },
  'record-swap': { file: 'record-swap.mp3', gain: 0.75 },
  'glass-tap': { file: 'glass-tap.mp3', gain: 0.4 },
  'space-whoosh': { file: 'space-whoosh.mp3', gain: 0.28 },
  'vinyl-crackle-loop': { file: 'vinyl-crackle-loop.mp3', gain: 0.14 },
};

const noteOf = (midi) => Tone.Frequency(midi, 'midi').toNote();

export function createEngine(base) {
  let n = null; // shared audio nodes, built by load()
  let voices = {}; // voice id -> { sampler, filter, gain, db }
  let legendSamplers = {};
  let loop = null;
  let crackleLoop = null;
  let tick = 0;
  let lifted = false;
  let mix = { mute: {}, solo: {} };
  let sfx = {}; // id -> Tone.Player
  let useSampleBed = false; // true when S2 loaded; otherwise the synthesised hiss/crackle
  let ducked = false;
  let duckDb = DUCK_DB;

  function bufferMap(instrument) {
    const b = n.buffers[instrument];
    return Object.fromEntries(Object.keys(n.urls[instrument]).map((note) => [note, b.get(note)]));
  }

  async function loadSfx(sfxBus) {
    const loaded = {};
    await Promise.all(
      Object.entries(SFX).map(async ([id, spec]) => {
        try {
          // The URL goes to load(), not the constructor: load() with no argument fetches "undefined".
          const player = new Tone.Player({ fadeIn: 0.01, fadeOut: 0.04 });
          await player.load(`${base}sfx/${spec.file}`);
          const gain = new Tone.Gain(spec.gain);
          player.connect(gain);
          if (id === 'vinyl-crackle-loop') {
            player.loop = true;
            gain.connect(n.bed);
          } else {
            gain.connect(sfxBus);
          }
          loaded[id] = player;
        } catch (err) {
          console.warn(`SFX ${id} missing; falling back where needed`, err);
        }
      }),
    );
    sfx = loaded;
    useSampleBed = Boolean(sfx['vinyl-crackle-loop']);
  }

  async function load() {
    const urls = await (await fetch(`${base}samples/samples.json`)).json();
    const buffers = {};
    const decoding = {};
    // Core instruments now; the others when a listener picks one (ensureInstrument).
    await Promise.all(
      Object.keys(INSTRUMENTS)
        .filter((inst) => INSTRUMENTS[inst].core)
        .map(
          (inst) =>
            (decoding[inst] = new Promise((resolve, reject) => {
              buffers[inst] = new Tone.ToneAudioBuffers({ urls: urls[inst], baseUrl: `${base}samples/`, onload: resolve, onerror: reject });
            })),
        ),
    );
    const limiter = new Tone.Limiter(-1).toDestination();
    // The VSCO recordings are quiet; make-up gain on the music only (the limiter catches peaks).
    const makeup = new Tone.Gain(Tone.dbToGain(MAKEUP_DB)).connect(limiter);
    const reverb = new Tone.Reverb({ decay: 4, preDelay: 0.02, wet: 0.28 }).connect(makeup);
    const ducker = new Tone.Gain(1).connect(reverb);
    const music = new Tone.Gain(1).connect(ducker);

    // Vinyl bed: S2 when present, otherwise soft hiss plus sparse crackles. Not data.
    const bed = new Tone.Gain(0).connect(limiter);
    const hiss = new Tone.Noise('pink');
    hiss.chain(new Tone.Filter({ type: 'highpass', frequency: 900 }), new Tone.Gain(Tone.dbToGain(-44)), bed);
    const crackleEnv = new Tone.AmplitudeEnvelope({ attack: 0.001, decay: 0.006, sustain: 0, release: 0.002 });
    const crackle = new Tone.Noise('white');
    crackle.chain(new Tone.Filter({ type: 'highpass', frequency: 1800 }), crackleEnv, new Tone.Gain(Tone.dbToGain(-27)), bed);
    const thump = new Tone.MembraneSynth({
      pitchDecay: 0.03,
      octaves: 3,
      envelope: { attack: 0.001, decay: 0.28, sustain: 0, release: 0.05 },
      volume: -16,
    }).connect(limiter);
    const sfxBus = new Tone.Gain(1).connect(limiter);

    await reverb.ready;
    n = { urls, buffers, decoding, limiter, reverb, music, ducker, bed, hiss, crackle, crackleEnv, thump, sfxBus };
    await loadSfx(sfxBus);
  }

  /** One-shot SFX; safe to call before load (no-op) or while a previous take is still ringing. */
  function playSfx(id, time) {
    const player = sfx[id];
    if (!player || !n) return false;
    const at = time ?? Tone.now() + 0.02;
    try {
      if (player.state === 'started') player.stop(at);
      player.start(at);
      return true;
    } catch (err) {
      console.warn(`SFX ${id} failed to start`, err);
      return false;
    }
  }

  /**
   * Builds the voices of a track: [{ id, instrument, attack? }]. The previous voices fade out and are
   * disposed once their tails have rung out.
   */
  function setVoices(list) {
    if (!n) return;
    const old = voices;
    const now = Tone.now();
    for (const v of Object.values(old)) {
      v.sampler.releaseAll(now);
      v.gain.gain.rampTo(0, VOICE_FADE, now);
    }
    setTimeout(() => {
      for (const v of Object.values(old)) {
        v.sampler.dispose();
        v.filter.dispose();
        v.gain.dispose();
      }
    }, 3000);
    voices = {};
    for (const v of list) {
      const spec = INSTRUMENTS[v.instrument];
      if (!spec) throw new Error(`No samples for instrument "${v.instrument}"`);
      const gain = new Tone.Gain(0).connect(n.music);
      const filter = new Tone.Filter({ type: 'lowpass', frequency: v.filter ?? OPEN_FILTER, rolloff: -12, Q: 0.4 }).connect(gain);
      const sampler = new Tone.Sampler({
        urls: bufferMap(v.instrument),
        attack: v.attack ?? spec.attack,
        release: spec.release,
      }).connect(filter);
      voices[v.id] = { sampler, filter, gain, db: spec.db };
    }
    applyMix();
  }

  /** Decodes an instrument's samples if they are not loaded yet. */
  function ensureInstrument(inst) {
    if (!n) return Promise.reject(new Error('engine not loaded'));
    if (!INSTRUMENTS[inst] || !n.urls[inst]) return Promise.reject(new Error(`No samples for instrument "${inst}"`));
    if (!n.decoding[inst]) {
      n.decoding[inst] = new Promise((resolve, reject) => {
        n.buffers[inst] = new Tone.ToneAudioBuffers({ urls: n.urls[inst], baseUrl: `${base}samples/`, onload: resolve, onerror: reject });
      }).catch((err) => {
        delete n.decoding[inst];
        throw err;
      });
    }
    return n.decoding[inst];
  }

  /** Plays one voice on another instrument (same notes, same filter and mute / solo). */
  function setInstrument(id, inst, attack) {
    const v = voices[id];
    const spec = INSTRUMENTS[inst];
    if (!v || !spec) return;
    const old = v.sampler;
    old.releaseAll();
    v.sampler = new Tone.Sampler({ urls: bufferMap(inst), attack: attack ?? spec.attack, release: spec.release }).connect(v.filter);
    v.db = spec.db;
    applyMix();
    setTimeout(() => old.dispose(), 3000);
  }

  function applyMix(time) {
    for (const [id, v] of Object.entries(voices)) {
      const target = isAudible(id, mix.mute, mix.solo) ? Tone.dbToGain(v.db) : 0;
      v.gain.gain.rampTo(target, 0.15, time);
    }
  }

  /** Seconds in one pulse (an eighth note); event offsets are fractions of it. */
  const pulseSeconds = () => Tone.Time(PULSE).toSeconds();

  function apply(events, filters, time) {
    if (filters) for (const [id, hz] of Object.entries(filters)) voices[id]?.filter.frequency.rampTo(hz, 0.3, time);
    const pulse = pulseSeconds();
    for (const e of events) {
      const v = voices[e.voice];
      if (!v) continue;
      const at = time + (e.offset || 0) * pulse;
      if (e.kind === 'attack') v.sampler.triggerAttack(noteOf(e.midi), at, e.velocity);
      else if (e.kind === 'release') v.sampler.triggerRelease(noteOf(e.midi), at);
      else v.sampler.triggerAttackRelease(noteOf(e.midi), e.duration, at, e.velocity);
    }
  }

  function ensureBedSources() {
    if (useSampleBed) {
      const vinyl = sfx['vinyl-crackle-loop'];
      if (vinyl && vinyl.state !== 'started') vinyl.start();
      return;
    }
    if (n.hiss.state !== 'started') n.hiss.start();
    if (n.crackle.state !== 'started') n.crackle.start();
  }

  /** onTick(tick, time) -> { events, filters }: called on every pulse while playing. */
  function start(onTick) {
    if (!n) return;
    const transport = Tone.getTransport();
    transport.bpm.value = BPM;
    if (!loop) {
      loop = new Tone.Loop((time) => {
        const r = onTick(tick++, time);
        if (r) apply(r.events, r.filters, time);
      }, PULSE).start(0);
      if (!useSampleBed) {
        crackleLoop = new Tone.Loop((time) => {
          if (Math.random() < 0.22) n.crackleEnv.triggerAttackRelease(0.004, time + Math.random() * 0.1, 0.25 + Math.random() * 0.75);
        }, '16n').start(0);
      }
    }
    ensureBedSources();
    applyMix();
    if (!lifted) n.bed.gain.rampTo(1, 0.8);
    transport.start('+0.05');
  }

  function releaseAll() {
    for (const v of Object.values(voices)) v.sampler.releaseAll();
  }

  function pause() {
    if (!n) return;
    Tone.getTransport().pause();
    releaseAll();
    n.bed.gain.rampTo(0, 0.4);
  }

  function setMix(mute, solo) {
    mix = { mute, solo };
    if (n) applyMix();
  }

  /** Lowers the music under the narrator (SFX and vinyl stay full). */
  function duck(on) {
    ducked = Boolean(on);
    if (n) n.ducker.gain.rampTo(duckGain(ducked, duckDb), 0.4);
  }

  /** How far the music drops under the narrator, in dB (no argument: the normal depth). */
  function setDuckDepth(db = DUCK_DB) {
    duckDb = db;
    duck(ducked);
  }

  /**
   * Sets the music bed level (0..1). On a first visit the bed starts low and rises under the
   * opening narration; the duck is a separate stage, so it does not cut this ramp short.
   */
  function setMusicLevel(level, ramp = 0.4) {
    if (n) n.music.gain.rampTo(Math.max(0, Math.min(1, level)), ramp);
  }

  /**
   * Plays a legend: [{ instrument, midi, velocity, at (s from now), duration }] on its own samplers,
   * so muting a voice does not silence it. Resolves when the last note has rung.
   */
  function playLegend(notes) {
    if (!n || !notes.length) return Promise.resolve();
    const t0 = Tone.now() + 0.05;
    for (const e of notes) {
      if (!legendSamplers[e.instrument]) {
        const spec = INSTRUMENTS[e.instrument];
        legendSamplers[e.instrument] = new Tone.Sampler({ urls: bufferMap(e.instrument), release: spec.release, volume: spec.db }).connect(n.reverb);
      }
      legendSamplers[e.instrument].triggerAttackRelease(noteOf(e.midi), e.duration, t0 + e.at, e.velocity);
    }
    const end = Math.max(...notes.map((e) => e.at)) + 0.8;
    return new Promise((resolve) => setTimeout(resolve, end * 1000));
  }

  function burst(time, count) {
    for (let i = 0; i < count; i++) n.crackleEnv.triggerAttackRelease(0.004, time + i * 0.035 + Math.random() * 0.02, 0.9);
  }

  function needleDrop() {
    if (!n) return;
    lifted = false;
    const now = Tone.now() + 0.02;
    if (!playSfx('needle-drop', now)) {
      n.thump.triggerAttackRelease('C1', 0.2, now);
      if (!useSampleBed) burst(now + 0.04, 6);
    }
    ensureBedSources();
    if (Tone.getTransport().state === 'started') n.bed.gain.rampTo(1, 0.05, now);
  }

  function needleLift() {
    if (!n) return;
    lifted = true;
    const now = Tone.now() + 0.02;
    if (!playSfx('needle-lift', now)) {
      n.thump.triggerAttackRelease('G1', 0.08, now, 0.35);
      if (!useSampleBed) burst(now, 3);
    }
    n.bed.gain.rampTo(0, 0.3, now + 0.12);
  }

  return {
    load,
    setVoices,
    setInstrument,
    ensureInstrument,
    hasInstrument: (inst) => Boolean(n && n.buffers[inst] && n.buffers[inst].loaded),
    start,
    pause,
    releaseAll,
    setMix,
    duck,
    setDuckDepth,
    setMusicLevel,
    playLegend,
    playSfx,
    needleDrop,
    needleLift,
    pulseSeconds,
    get loaded() {
      return Boolean(n);
    },
  };
}
