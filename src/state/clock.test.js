import { describe, expect, it } from 'vitest';
import { clampTime, shouldFireMarker, stepFromTime } from './clock.js';
import { pickVideo } from '../media/pickVideo.js';

const meta = {
  video: { hi: 'video-1536.mp4', lo: 'video-1024.mp4', fps: 30, frames: 2001, duration: 66.7 },
  grid: { steps: 334, stepEvery: 6 },
};

describe('stepFromTime', () => {
  it('turns video time into a grid step', () => {
    expect(stepFromTime(0, meta)).toBe(0);
    expect(stepFromTime(0.2, meta)).toBe(1);
    expect(stepFromTime(66.69, meta)).toBe(333);
  });
  it('stays inside the grid when time is out of range', () => {
    expect(stepFromTime(-1, meta)).toBe(0);
    expect(stepFromTime(999, meta)).toBe(333);
    expect(stepFromTime(NaN, meta)).toBe(0);
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
