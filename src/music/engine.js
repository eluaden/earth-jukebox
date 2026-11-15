import * as Tone from 'tone';
import { isAudible } from './mix.js';
import { T_MAX } from './mapping.js';

// Plays what src/music/mapping.js decides. Three sampled voices (VSCO 2 CE, CC0), each through a
// low-pass filter whose brightness follows the zone temperature, then ducking, reverb and a limiter.
// A very quiet vinyl crackle (not data, declared in the liner notes) runs underneath while the
// needle is on the record; with the needle up the record is silent, like a real turntable.

const VOICES = ['strings', 'piano', 'glock'];
const VOICE_DB = { strings: -7, piano: -3, glock: -13 };
const SAMPLER_OPTS = {
  strings: { attack: 0.25, release: 1.6 },
  piano: { attack: 0, release: 1.2 },
  glock: { attack: 0, release: 2.2 },
};
const BPM = 84;
const DUCK_DB = -10;
const MAKEUP_DB = 18;

const noteOf = (midi) => Tone.Frequency(midi, 'midi').toNote();
const brightness = (t) => 1200 + 6800 * Math.min(1, Math.max(0, t / T_MAX));

export function createEngine(base) {
  let n = null; // audio nodes, built by load()
  let loop = null;
  let crackleLoop = null;
  let tick = 0;
  let lifted = false;
  let mix = { mute: {}, solo: {} };

  async function load() {
    const urls = await (await fetch(`${base}samples/samples.json`)).json();
    const limiter = new Tone.Limiter(-1).toDestination();
    // The VSCO recordings are quiet; make-up gain on the music only (the limiter catches peaks).
    const makeup = new Tone.Gain(Tone.dbToGain(MAKEUP_DB)).connect(limiter);
    const reverb = new Tone.Reverb({ decay: 4, preDelay: 0.02, wet: 0.28 }).connect(makeup);
    const music = new Tone.Gain(1).connect(reverb);
    const samplers = {};
    const filters = {};
    const gains = {};
    for (const v of VOICES) {
      gains[v] = new Tone.Gain(Tone.dbToGain(VOICE_DB[v])).connect(music);
      filters[v] = new Tone.Filter({ type: 'lowpass', frequency: 4000, rolloff: -12, Q: 0.4 }).connect(gains[v]);
      samplers[v] = new Tone.Sampler({ urls: urls[v], baseUrl: `${base}samples/`, ...SAMPLER_OPTS[v] }).connect(filters[v]);
    }
    // "Hear the legend" plays on its own piano so muting the piano voice does not silence it.
    const legend = new Tone.Sampler({ urls: urls.piano, baseUrl: `${base}samples/`, release: 1.2, volume: -3 }).connect(reverb);

    // Vinyl bed: soft hiss plus sparse crackles. Not data.
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

    await Promise.all([Tone.loaded(), reverb.ready]);
    n = { limiter, reverb, music, samplers, filters, gains, legend, bed, hiss, crackle, crackleEnv, thump };
  }

  function applyMix(time) {
    for (const v of VOICES) {
      const target = isAudible(v, mix.mute, mix.solo) ? Tone.dbToGain(VOICE_DB[v]) : 0;
      n.gains[v].gain.rampTo(target, 0.15, time);
    }
  }

  function apply(events, zones, time) {
    for (const z of zones) if (Number.isFinite(z.mean)) n.filters[z.voice].frequency.rampTo(brightness(z.mean), 0.3, time);
    for (const e of events) {
      const s = n.samplers[e.voice];
      if (e.kind === 'attack') s.triggerAttack(noteOf(e.midi), time, e.velocity);
      else if (e.kind === 'release') s.triggerRelease(noteOf(e.midi), time);
      else s.triggerAttackRelease(noteOf(e.midi), e.duration, time, e.velocity);
    }
  }

  /** onTick(tick, time) -> { events, zones }: called on every eighth note while playing. */
  function start(onTick) {
    if (!n) return;
    const transport = Tone.getTransport();
    transport.bpm.value = BPM;
    if (!loop) {
      loop = new Tone.Loop((time) => {
        const r = onTick(tick++, time);
        if (r) apply(r.events, r.zones, time);
      }, '8n').start(0);
      crackleLoop = new Tone.Loop((time) => {
        if (Math.random() < 0.22) n.crackleEnv.triggerAttackRelease(0.004, time + Math.random() * 0.1, 0.25 + Math.random() * 0.75);
      }, '16n').start(0);
      n.hiss.start();
      n.crackle.start();
    }
    applyMix();
    if (!lifted) n.bed.gain.rampTo(1, 0.8);
    transport.start('+0.05');
  }

  function pause() {
    if (!n) return;
    Tone.getTransport().pause();
    n.samplers.strings.releaseAll();
    n.bed.gain.rampTo(0, 0.4);
  }

  function setMix(mute, solo) {
    mix = { mute, solo };
    if (n) applyMix();
  }

  function duck(on) {
    if (n) n.music.gain.rampTo(on ? Tone.dbToGain(DUCK_DB) : 1, 0.4);
  }

  /** Plays the given notes in order on a piano; resolves when done. */
  function playLegend(midis) {
    if (!n) return Promise.resolve();
    const t0 = Tone.now() + 0.05;
    const gap = 0.22;
    midis.forEach((m, i) => n.legend.triggerAttackRelease(noteOf(m), '8n', t0 + i * gap, 0.7));
    return new Promise((resolve) => setTimeout(resolve, (midis.length * gap + 0.6) * 1000));
  }

  function burst(time, count) {
    for (let i = 0; i < count; i++) n.crackleEnv.triggerAttackRelease(0.004, time + i * 0.035 + Math.random() * 0.02, 0.9);
  }

  function needleDrop() {
    if (!n) return;
    lifted = false;
    const now = Tone.now() + 0.02;
    n.thump.triggerAttackRelease('C1', 0.2, now);
    if (Tone.getTransport().state === 'started') n.bed.gain.rampTo(1, 0.05, now);
    burst(now + 0.04, 6);
  }

  function needleLift() {
    if (!n) return;
    lifted = true;
    const now = Tone.now() + 0.02;
    n.thump.triggerAttackRelease('G1', 0.08, now, 0.35);
    burst(now, 3);
    n.bed.gain.rampTo(0, 0.3, now + 0.12);
  }

  return { load, start, pause, setMix, duck, playLegend, needleDrop, needleLift, get loaded() { return Boolean(n); } };
}
