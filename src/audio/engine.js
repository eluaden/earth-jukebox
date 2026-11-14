import * as Tone from 'tone';
import { createDrone } from './layers/drone.js';
import { createTexture } from './layers/texture.js';
import { createPulse } from './layers/pulse.js';
import { createBell } from './layers/bell.js';

/**
 * Sonification engine. Knows nothing about images: it receives a contract Track
 * (normalized 0..1 series + mapping + events) and plays it in real time.
 *
 * Events emitted (subscribe with engine.on(name, fn)):
 *   'frame'  (index)          — a frame starts sounding (fired on the UI thread, in sync)
 *   'event'  (trackEvent)     — a track event (record, milestone...) is reached
 *   'state'  ('playing'|'paused'|'stopped')
 *   'end'    ()               — the track finished
 */
export class SonificationEngine {
  constructor() {
    this.listeners = {};
    this.layers = {};      // seriesKey -> layer
    this.track = null;
    this.state = 'stopped';
    this.frame = 0;
    this._ready = false;
  }

  on(name, fn) { (this.listeners[name] ||= []).push(fn); return () => this.off(name, fn); }
  off(name, fn) { this.listeners[name] = (this.listeners[name] || []).filter((f) => f !== fn); }
  emit(name, ...args) { (this.listeners[name] || []).forEach((f) => f(...args)); }

  /** Must be called from a user gesture (click / key press). Safe to call repeatedly. */
  async init() {
    await Tone.start();
    if (this._ready) return;
    this.limiter = new Tone.Limiter(-3).toDestination();
    this.duck = new Tone.Gain(1).connect(this.limiter);   // lowered while narration speaks
    this.master = new Tone.Gain(0).connect(this.duck);    // fades on play / pause
    this.reverb = new Tone.Reverb({ decay: 4, wet: 0.25 }).connect(this.master);
    await this.reverb.ready;
    this.bus = this.reverb;
    this.bell = createBell(this.bus);
    this.transport = Tone.getTransport();
    this._ready = true;
  }

  get frameCount() { return this.track ? this.track.labels.length : 0; }

  /** Prepares a track. Stops anything playing. */
  load(track) {
    if (!this._ready) throw new Error('call init() first (from a user gesture)');
    this.stop();
    Object.values(this.layers).forEach((l) => l.dispose());
    this.pulse?.dispose();
    this.layers = {};
    this.pulse = null;
    this.track = track;

    for (const [key, m] of Object.entries(track.mapping)) {
      if (m.layer === 'drone') this.layers[key] = createDrone(this.bus, m.params);
      else if (m.layer === 'texture') this.layers[key] = createTexture(this.bus, { loudWhen: m.loudWhen, ...m.params });
      else if (m.layer === 'pulse') this.layers[key] = this.pulse = createPulse(this.bus, m.params);
    }
    if (!this.pulse && track.clock !== false) this.pulse = createPulse(this.bus);

    this.eventsByFrame = {};
    (track.events || []).forEach((e) => (this.eventsByFrame[e.frame] ||= []).push(e));

    const spf = track.secondsPerFrame;
    const n = this.frameCount;
    const tr = this.transport;
    tr.cancel(0);
    tr.seconds = 0;
    tr.scheduleRepeat((time) => {
      const i = Math.round(tr.getSecondsAtTime(time) / spf);
      if (i >= n) return;
      this._playFrame(i, time, true);
    }, spf, 0);
    tr.scheduleOnce((time) => {
      Tone.getDraw().schedule(() => { this.stop(); this.emit('end'); }, time);
    }, n * spf);

    this.frame = 0;
    this._setValues(0, Tone.now(), 0.05);
  }

  /** Sets every data layer to the values of frame i. */
  _setValues(i, time, ramp) {
    for (const [key, layer] of Object.entries(this.layers)) {
      const v = this.track.series[key][i];
      if (v != null) layer.set(v, time, ramp);
    }
  }

  _playFrame(i, time, withSound) {
    const spf = this.track.secondsPerFrame;
    this._setValues(i, time, spf * 0.9); // glide across the frame: smooth, not steppy
    const events = this.eventsByFrame[i] || [];
    if (withSound) {
      this.pulse?.tick(time, events.some((e) => e.type === 'milestone'));
      if (events.some((e) => e.type === 'record')) this.bell.ring(time);
    }
    Tone.getDraw().schedule(() => {
      this.frame = i;
      this.emit('frame', i);
      events.forEach((e) => this.emit('event', e));
    }, time);
  }

  async play() {
    if (!this.track) return;
    if (this.state === 'playing') return;
    if (this.state === 'stopped' && this.frame >= this.frameCount - 1) this.seek(0);
    this._unmuteAll();
    this.master.gain.rampTo(1, 0.3);
    this.transport.start('+0.05');
    this._setState('playing');
  }

  pause() {
    if (this.state !== 'playing') return;
    this.master.gain.rampTo(0, 0.2);
    this.transport.pause();
    this._setState('paused');
  }

  toggle() { return this.state === 'playing' ? this.pause() : this.play(); }

  stop() {
    if (!this.transport) return;
    this.master?.gain.rampTo(0, 0.2);
    this.transport.stop();
    if (this.state !== 'stopped') this._setState('stopped');
  }

  /** Jump to frame i (works while playing or paused). */
  seek(i) {
    if (!this.track) return;
    i = Math.max(0, Math.min(this.frameCount - 1, i));
    this.transport.seconds = i * this.track.secondsPerFrame;
    this.frame = i;
    this._setValues(i, Tone.now(), 0.1);
    this.emit('frame', i);
  }

  /** Lower the music while narration speaks. */
  setDucked(on) {
    if (this.duck) this.duck.gain.rampTo(on ? 0.2 : 1, 0.3);
  }

  /**
   * Audio legend: play ONE series' layer alone at a given value (0 = min, 1 = max).
   * Resolves when done. Pauses the track if it was playing.
   */
  async previewValue(seriesKey, value, seconds = 2.5) {
    const layer = this.layers[seriesKey];
    if (!layer) return;
    this.pause();
    const now = Tone.now();
    for (const l of Object.values(this.layers)) l.setMuted(l !== layer, now);
    if (this.pulse && this.pulse !== layer) this.pulse.setMuted(true, now);
    layer.set(value, now, 0.05);
    this.master.gain.rampTo(1, 0.15);
    if (layer.type === 'pulse') for (let k = 0; k < 4; k++) layer.tick(now + 0.1 + k * 0.5);
    await new Promise((r) => setTimeout(r, seconds * 1000));
    this.master.gain.rampTo(0, 0.25);
    await new Promise((r) => setTimeout(r, 300));
    this._unmuteAll();
    this._setValues(this.frame, Tone.now(), 0.05); // restore current frame values
  }

  _unmuteAll() {
    const now = Tone.now();
    Object.values(this.layers).forEach((l) => l.setMuted(false, now));
    this.pulse?.setMuted(false, now);
  }

  _setState(s) { this.state = s; this.emit('state', s); }
}
