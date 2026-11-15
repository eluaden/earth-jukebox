"""Lightning track (NASA SVS 5011): flat-map video -> lightning coverage grid + web videos.

The flat Science On a Sphere video (4096x2048, 2:1, 180 W to 180 E, pole to pole) draws every
lightning event the LIS sensor on the ISS saw in a 10-day roving window as a yellow dot. NASA's
labels.txt gives the date of each frame. This script:

1. reads the dates (fixing the "2003" typo of the last lines: they continue 2022, so they are 2023);
2. picks one frame every 10 days of data (the window length, so steps do not overlap), starting
   once the window is full; dates inside a data gap have no frame and are skipped;
3. measures, in every 2x2 degree cell, the share of pixels covered by lightning dots (relative:
   not a count of flashes, no unit); rows the sensor never sees are "no data";
4. writes public/tracks/lightning/ (grid.bin, track.json, web videos from the first step on, cover,
   poster).

Usage: python scripts/pipeline/lightning.py [--skip-video]
Inputs: npm run fetch-sources -- lightning-flat lightning-labels
Needs: Python 3, numpy, ffmpeg on PATH.
"""
import os
import shutil
import subprocess
import sys
from datetime import datetime, timedelta

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cover import write_cover  # noqa: E402
from common import (LATS, LONS, NO_DATA, ROOT, SRC, cell_share, decode_frame_at, encode_video,  # noqa: E402
                    equirect_cells, quantize_share, write_json)

VIDEO = os.path.join(SRC, '5011-iss_lightning_sos_yearly_07312023_2048p60.mp4')
LABELS = os.path.join(SRC, '5011-labels.txt')
OUT = os.path.join(ROOT, 'public', 'tracks', 'lightning')

W, H, SRC_FPS, SRC_FRAMES, OUT_FPS = 4096, 2048, 60, 6002, 30
WINDOW_DAYS = 10            # NASA's roving window; also our step
MAX_LAG = timedelta(days=3)  # a step whose nearest frame is later than this falls in a data gap
MIN_ROW_SHARE = 0.01        # a latitude row is "seen by the sensor" if some cell ever reaches 1%


def parse_labels(lines):
    """Label lines ('01 Mar 2017 01:25') -> datetimes. A date 20 years before the previous one is
    NASA's '2003' typo for 2023 and is corrected; any other jump back is an error."""
    out = []
    for line in lines:
        line = line.strip()
        try:
            d = datetime.strptime(line, '%d %b %Y %H:%M')
        except ValueError:
            continue
        if out and d < out[-1]:
            fixed = d.replace(year=d.year + 20)
            if fixed < out[-1] or fixed - out[-1] > timedelta(days=30):
                raise ValueError(f'label goes back in time: {out[-1]} -> {d}')
            d = fixed
        out.append(d)
    return out


def choose_steps(dates, every_days=WINDOW_DAYS):
    """[(target date, frame index or None)], one every `every_days` from the first full window."""
    every = timedelta(days=every_days)
    t = dates[0] + every
    steps, i = [], 0
    while t <= dates[-1]:
        while dates[i] < t:
            i += 1
        steps.append((t, i if dates[i] - t <= MAX_LAG else None))
        t += every
    return steps


def lightning_mask(rgb_u8):
    """Yellow lightning dots (NASA's colour, about RGB 190,184,28). Grey map, white lines and labels
    have blue as high as red, so they never pass."""
    a = rgb_u8.astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (r > 110) & (g > 95) & (b < 80) & (r - b > 60)


def data_rows(stack):
    """Latitude rows where some cell, at some step, reaches MIN_ROW_SHARE of lightning."""
    return (np.nan_to_num(stack).max(axis=(0, 2)) >= MIN_ROW_SHARE)


def north_share(stack):
    """Share of all lightning coverage that falls north of the equator, per step."""
    north = np.nansum(stack[:, :LATS // 2, :], axis=(1, 2))
    total = np.nansum(stack, axis=(1, 2))
    return north / np.maximum(total, 1e-9)


def centroid_lat(stack):
    lat = 89 - 2 * np.arange(LATS)
    w = np.nansum(stack, axis=2)
    return (w * lat[None, :]).sum(1) / np.maximum(w.sum(1), 1e-9)


def save_frame(frame_index, width, height, name):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', VIDEO, '-vf',
                    f'select=eq(n\\,{frame_index}),scale={width}:{height}:flags=lanczos', '-fps_mode', 'passthrough',
                    '-frames:v', '1', '-q:v', '3', os.path.join(OUT, name)], check=True)


def main():
    skip_video = '--skip-video' in sys.argv
    for f in (VIDEO, LABELS):
        if not os.path.exists(f):
            sys.exit(f'Missing {f}. Run: npm run fetch-sources -- lightning-flat lightning-labels')
    os.makedirs(OUT, exist_ok=True)
    dates = parse_labels(open(LABELS, encoding='utf-8'))
    steps = [(t, f) for t, f in choose_steps(dates) if f is not None]
    skipped = len(choose_steps(dates)) - len(steps)
    frames = [f for _, f in steps]
    print(f'{len(dates)} dated frames, {len(steps)} steps every {WINDOW_DAYS} days, {skipped} skipped (data gap)')

    cells = equirect_cells(H, W)
    raw = np.zeros((len(frames), LATS, LONS), dtype=np.float32)
    for k, f in enumerate(frames):
        raw[k] = cell_share(lightning_mask(decode_frame_at(VIDEO, f, SRC_FPS, W, H)), cells)
        if k % 40 == 0:
            print(f'  step {k:3d}/{len(frames)}  {dates[f]:%d %b %Y}')

    rows = data_rows(raw)
    lat = 89 - 2 * np.arange(LATS)
    seen = lat[rows]
    print(f'sensor sees rows {seen.max()} N to {seen.min()} (cell centres); outside = no data')
    stack = raw.copy()
    stack[:, ~rows, :] = np.nan
    quantize_share(stack).tofile(os.path.join(OUT, 'grid.bin'))

    ns = north_share(stack)
    cen = centroid_lat(stack)
    year1 = [k for k, (t, _) in enumerate(steps) if t < steps[0][0] + timedelta(days=365)]
    north_peak = year1[int(np.argmax(ns[year1]))]
    south_peak = year1[int(np.argmin(ns[year1]))]
    markers = [{'id': 'north-summer', 'step': north_peak}, {'id': 'south-summer', 'step': south_peak}]
    nz = raw[raw > 0]
    print(f'north share {ns.min():.2f}..{ns.max():.2f}; centroid {cen.min():.1f}..{cen.max():.1f} deg; '
          f'markers {[(m["id"], steps[m["step"]][0].strftime("%d %b %Y")) for m in markers]}; '
          f'coverage p50 {np.percentile(nz, 50):.3f} p99 {np.percentile(nz, 99):.3f}')
    by_month = {}
    for k, (t, _) in enumerate(steps):
        by_month.setdefault(t.month, []).append(cen[k])
    print('centroid by month:', {m: round(float(np.mean(v)), 1) for m, v in sorted(by_month.items())})

    start = frames[0]
    step_frames = [(f - start) * OUT_FPS // SRC_FPS for f in frames]
    total_frames = (SRC_FRAMES - start) * OUT_FPS // SRC_FPS
    save_frame(start, 1536, 768, 'poster.jpg')
    if not skip_video:
        print('encoding web videos (a few minutes)...')
        encode_video(VIDEO, os.path.join(OUT, 'video-1536.mp4'), 1536, 768, 30, start / SRC_FPS, OUT_FPS)
        encode_video(VIDEO, os.path.join(OUT, 'video-1024.mp4'), 1024, 512, 28, start / SRC_FPS, OUT_FPS)

    track = {
        'id': 'lightning',
        'svs': 5011,
        'period': '2017–2023',
        'source': {'name': 'NASA Scientific Visualization Studio, "Lightning Events Detected from the International '
                           'Space Station (ISS) 2017-2023" (SVS 5011), LIS on the ISS, flat map for Science On a Sphere',
                   'url': 'https://svs.gsfc.nasa.gov/5011/'},
        'video': {'hi': 'video-1536.mp4', 'lo': 'video-1024.mp4', 'fps': OUT_FPS, 'frames': total_frames,
                  'duration': total_frames / OUT_FPS},
        # Time is not uniform in NASA's video, so each step carries the web-video frame where it starts.
        'grid': {'file': 'grid.bin', 'steps': len(steps), 'stepFrames': step_frames, 'lats': LATS, 'lons': LONS,
                 'cellDeg': 2, 'scale': round(1 / 254, 6), 'noData': NO_DATA,
                 'value': 'share of the cell covered by lightning dots in the 10-day window'},
        'dates': [t.strftime('%Y-%m-%dT%H:%MZ') for t, _ in steps],
        'coverage': {'north': int(seen.max()) + 1, 'south': int(seen.min()) - 1},
        'windowDays': WINDOW_DAYS,
        'markers': markers,
        'cover': 'cover.jpg',
        'poster': 'poster.jpg',
    }
    write_json(os.path.join(OUT, 'track.json'), track)
    write_cover('lightning')
    print(f'wrote {OUT}')


if __name__ == '__main__':
    main()
