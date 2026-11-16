import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { clampTime, isStills, shouldFireMarker, stepAt, timeOfStep, trackDuration, turnLimited } from './clock.js';
import { pickVideo } from '../media/pickVideo.js';

const meta = {
  video: { hi: 'video-1536.mp4', lo: 'video-1024.mp4', fps: 30, frames: 2001, duration: 66.7 },
  grid: { steps: 334, stepEvery: 6 },
};
const track = (id) => JSON.parse(readFileSync(new URL(`../../public/tracks/${id}/track.json`, import.meta.url), 'utf8'));

describe('stepAt (fixed step size, SST)', () => {
  it('turns video time into a grid step', () => {
    expect(stepAt(meta, 0)).toBe(0);
    expect(stepAt(meta, 0.2)).toBe(1);
    expect(stepAt(meta, 66.69)).toBe(333);
  });
  it('stays inside the grid when time is out of range', () => {
    expect(stepAt(meta, -1)).toBe(0);
    expect(stepAt(meta, 999)).toBe(333);
    expect(stepAt(meta, NaN)).toBe(0);
  });
});

describe('stepAt (frame list, lightning)', () => {
  const m = track('lightning');
  it('follows the frame where each step starts', () => {
    const f = m.grid.stepFrames;
    expect(stepAt(m, 0)).toBe(0);
    expect(stepAt(m, (f[1] - 0.5) / m.video.fps)).toBe(0);
    expect(stepAt(m, (f[1] + 0.5) / m.video.fps)).toBe(1);
    expect(stepAt(m, m.video.duration)).toBe(m.grid.steps - 1);
  });
  it('round-trips every step through timeOfStep', () => {
    for (let s = 0; s < m.grid.steps; s++) expect(stepAt(m, timeOfStep(m, s))).toBe(s);
  });
});

describe('stepAt (still images, night lights)', () => {
  const m = track('night-lights');
  it('is a track of still images with its own clock', () => {
    expect(isStills(m)).toBe(true);
    expect(isStills(meta)).toBe(false);
    expect(trackDuration(m)).toBe(m.grid.steps * m.time.secondsPerStep);
  });
  it('advances one step per secondsPerStep and loops', () => {
    expect(stepAt(m, 0)).toBe(0);
    expect(stepAt(m, 10.5)).toBe(1);
    expect(stepAt(m, trackDuration(m) + 1)).toBe(0);
  });
  it('round-trips every step through timeOfStep', () => {
    for (let s = 0; s < m.grid.steps; s++) expect(stepAt(m, timeOfStep(m, s))).toBe(s);
  });
});

describe('timeOfStep (SST)', () => {
  it('lands in the middle of the step and stays inside the grid', () => {
    for (const s of [0, 1, 100, 333]) expect(stepAt(meta, timeOfStep(meta, s))).toBe(s);
    expect(stepAt(meta, timeOfStep(meta, 999))).toBe(333);
    expect(stepAt(meta, timeOfStep(meta, -4))).toBe(0);
  });
});

describe('clampTime', () => {
  it('keeps a seek inside the video', () => {
    expect(clampTime(70, 66.7, 30)).toBeLessThan(66.7);
    expect(clampTime(-4, 66.7, 30)).toBe(0);
    expect(clampTime(10, 66.7, 30)).toBe(10);
  });
});

describe('shouldFireMarker', () => {
  it('fires once when playback crosses the marker step', () => {
    expect(shouldFireMarker(100, 99, 100, new Set(), 'x')).toBe(true);
    expect(shouldFireMarker(100, 100, 101, new Set(), 'x')).toBe(false);
    expect(shouldFireMarker(100, 99, 100, new Set(['x']), 'x')).toBe(false);
  });
  it('does not fire when the video loops back to the start', () => {
    expect(shouldFireMarker(1, 333, 2, new Set(), 'x')).toBe(false);
  });
  it('does not fire on a long jump (a seek)', () => {
    expect(shouldFireMarker(100, 10, 200, new Set(), 'x')).toBe(false);
  });
});

describe('pickVideo', () => {
  it('uses the light video on touch screens and small screens', () => {
    expect(pickVideo(meta, { coarsePointer: true, screenMax: 2560, dpr: 2 })).toBe('video-1024.mp4');
    expect(pickVideo(meta, { coarsePointer: false, screenMax: 800, dpr: 1 })).toBe('video-1024.mp4');
  });
  it('uses the sharp video on a regular laptop', () => {
    expect(pickVideo(meta, { coarsePointer: false, screenMax: 1920, dpr: 1 })).toBe('video-1536.mp4');
  });
});

describe('crossedLon (place markers of a single instant)', () => {
  it('fires when the needle passes the longitude eastward, also across 180°', async () => {
    const { crossedLon } = await import('./controller.js');
    expect(crossedLon(-25, -22, -23)).toBe(true);
    expect(crossedLon(-23, -20, -23)).toBe(false);
    expect(crossedLon(-20, -25, -23)).toBe(false);
    expect(crossedLon(178, -178, 180)).toBe(true);
    expect(crossedLon(178, -178, -179)).toBe(true);
    expect(crossedLon(10, 10, 10)).toBe(false);
  });
});

describe('turnLimited (the globe follows a jump of the clock)', () => {
  const TURN = 2 * Math.PI;
  it('keeps a small jump as it is', () => {
    expect(turnLimited(1.5)).toBeCloseTo(1.5);
    expect(turnLimited(-0.4)).toBeCloseTo(-0.4);
    expect(turnLimited(0)).toBe(0);
  });
  it('turns at most once, in the direction of the jump', () => {
    expect(turnLimited(3 * TURN + 1)).toBeCloseTo(1);
    expect(turnLimited(-(5 * TURN + 2))).toBeCloseTo(-2);
  });
});
