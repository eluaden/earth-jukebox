"""Sea surface temperature track (NASA SVS 3912): NASA video -> temperature grid + web videos.

Reads the original flat-map video (2048x1024, 2001 frames), turns every coloured flow-line pixel
into a temperature using NASA's own colour bar (0-32 C), and averages it into 2x2 degree cells.
The browser never reads colours: it only looks values up in the grid this script writes.

Inputs (npm run fetch-sources -- sea-surface-temperature sst-legend sst-dates):
  sources/3912-ecco2_sst_flow.mp4, sources/3912-sst_ecco2_cbar.png, sources/3912-flat_ecco2_dates.txt
Outputs: public/tracks/sst/  (grid.bin, track.json, video-1536.mp4, video-1024.mp4, legend.png,
  cover.jpg, poster.jpg) and public/tracks/index.json.

Usage: python scripts/pipeline/sst.py [--skip-video]
Needs: Python 3, numpy, Pillow, ffmpeg on PATH.
"""
import json
import os
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'sources')
OUT = os.path.join(ROOT, 'public', 'tracks', 'sst')

VIDEO = os.path.join(SRC, '3912-ecco2_sst_flow.mp4')
LEGEND = os.path.join(SRC, '3912-sst_ecco2_cbar.png')
DATES = os.path.join(SRC, '3912-flat_ecco2_dates.txt')

W, H, FPS, FRAMES = 2048, 1024, 30, 2001
STEP_EVERY = 6                      # one reading every 6 frames (~1 day of model time)
LATS, LONS, CELL_DEG = 90, 180, 2
T_MIN, T_MAX = 0.0, 32.0            # NASA colour bar range
SCALE = T_MAX / 254                 # uint8 step; 255 = no data
NO_DATA = 255

# Colour bar geometry, measured on sst_ecco2_cbar.png (310x95): the bar row and its first/last column.
LEGEND_ROW, LEGEND_X0, LEGEND_X1 = 47, 15, 291
# A pixel is a flow line (data) when it is saturated and bright enough and its hue is on the bar.
MIN_SAT, MIN_VAL, HUE_MARGIN = 0.45, 0.22, 8.0
MIN_PIXELS = 3                      # valid pixels needed for a cell value
LAND_SHARE = 0.8                    # cells empty in more than this share of steps are land


def rgb_to_hsv(rgb):
    """rgb float 0..1 [...,3] -> (hue degrees, saturation, value). Hues above 300 become negative."""
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1)
    mn = rgb.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    nz = d > 1e-6
    safe = np.where(nz, d, 1)
    rr = nz & (mx == r)
    gg = nz & (mx == g) & ~rr
    bb = nz & ~rr & ~gg
    h = np.where(rr, ((g - b) / safe) % 6, h)
    h = np.where(gg, (b - r) / safe + 2, h)
    h = np.where(bb, (r - g) / safe + 4, h)
    h = h * 60
    h = np.where(h > 300, h - 360, h)
    s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    return h, s, mx


def legend_table(path=LEGEND):
    """Hue (strictly decreasing) -> temperature, from NASA's colour bar.

    The bar is linear from column LEGEND_X0 (0 C) to LEGEND_X1 (32 C). Where several columns share
    one colour (the bar saturates to a single red above ~31 C) the colour cannot tell them apart,
    so it reads as the middle of that stretch. The last column is an anti-aliased edge and is skipped.
    """
    row = np.asarray(Image.open(path).convert('RGB'), dtype=np.float32)[LEGEND_ROW, LEGEND_X0:LEGEND_X1 + 1] / 255
    temps_all = np.linspace(T_MIN, T_MAX, len(row))
    hues_all, _, _ = rgb_to_hsv(row[:-1])
    temps_all = temps_all[:-1]
    hues_all = np.minimum.accumulate(hues_all)  # one column on the bar is a hair off monotonic
    hues, temps = [], []
    i = 0
    while i < len(hues_all):
        j = i
        while j + 1 < len(hues_all) and hues_all[i] - hues_all[j + 1] < 0.05:
            j += 1
        hues.append(hues_all[i:j + 1].mean())
        temps.append(temps_all[i:j + 1].mean())
        i = j + 1
    return np.array(hues, dtype=np.float64), np.array(temps, dtype=np.float64)


def legend_plateaus(path=LEGEND):
    """(from C, to C) stretches of the bar drawn with one single colour, wider than 0.3 C."""
    row = np.asarray(Image.open(path).convert('RGB'))[LEGEND_ROW, LEGEND_X0:LEGEND_X1]
    temps = np.linspace(T_MIN, T_MAX, len(row) + 1)[:-1]
    out, i = [], 0
    while i < len(row):
        j = i
        while j + 1 < len(row) and np.array_equal(row[j + 1], row[i]):
            j += 1
        if temps[j] - temps[i] > 0.3:
            out.append([round(float(temps[i]), 1), round(float(temps[j]), 1)])
        i = j + 1
    return out


def pixels_to_temp(rgb_u8, hues, temps):
    """uint8 RGB [...,3] -> temperature in C (float32), NaN where the pixel is not a flow line."""
    h, s, v = rgb_to_hsv(rgb_u8.astype(np.float32) / 255)
    valid = (s > MIN_SAT) & (v > MIN_VAL) & (h <= hues[0] + HUE_MARGIN) & (h >= hues[-1] - HUE_MARGIN)
    t = np.interp(-h, -hues, temps)
    return np.where(valid, t, np.nan).astype(np.float32)


def cells_from_temp(temp):
    """Per-pixel temperature (HxW, NaN = not data) -> 90x180 cell means (NaN when < 3 valid pixels)."""
    h, w = temp.shape
    rows = (np.arange(h) * LATS) // h
    cols = (np.arange(w) * LONS) // w
    cell = (rows[:, None] * LONS + cols[None, :]).ravel()
    t = temp.ravel()
    ok = np.isfinite(t)
    n = np.bincount(cell[ok], minlength=LATS * LONS)
    total = np.bincount(cell[ok], weights=t[ok], minlength=LATS * LONS)
    mean = np.where(n >= MIN_PIXELS, total / np.maximum(n, 1), np.nan)
    return mean.reshape(LATS, LONS).astype(np.float32)


def fill_and_mask(stack):
    """steps x lat x lon. Cells empty in > 80% of steps -> land (all NaN). Other gaps take the last
    valid value of the same cell (and leading gaps the next one)."""
    stack = stack.copy()
    empty = np.isnan(stack)
    land = empty.mean(axis=0) > LAND_SHARE
    stack[:, land] = np.nan
    steps = np.arange(stack.shape[0])[:, None, None]

    def fill_forward(a):
        idx = np.where(np.isnan(a), 0, steps)
        idx = np.maximum.accumulate(idx, axis=0)
        out = np.take_along_axis(a, idx, axis=0)
        return out

    out = fill_forward(stack)
    out = fill_forward(out[::-1])[::-1]
    out[:, land] = np.nan
    return out


def quantize(stack):
    """C -> uint8 (round(T/32*254)); NaN -> 255."""
    q = np.round(np.clip(stack, T_MIN, T_MAX) / T_MAX * 254)
    return np.where(np.isnan(stack), NO_DATA, q).astype(np.uint8)


def lat_centers():
    return 89 - 2 * np.arange(LATS)


def markers(stack):
    """Steps where northern and southern waters (23.5-80 deg) are warmest on average."""
    lat = lat_centers()
    out = []
    for marker_id, sel in (('north-warmest', (lat > 23.5) & (lat < 80)),
                           ('south-warmest', (lat < -23.5) & (lat > -80))):
        means = np.nanmean(stack[:, sel, :].reshape(stack.shape[0], -1), axis=1)
        out.append({'id': marker_id, 'step': int(np.nanargmax(means))})
    return out


def read_dates(path=DATES):
    dates = [line.split()[1] for line in open(path, encoding='utf-8') if line.strip()]
    assert len(dates) == FRAMES, f'expected {FRAMES} dates, got {len(dates)}'
    return dates


def decode_steps():
    """Yields (step, uint8 HxWx3) for every STEP_EVERY-th frame of the NASA video."""
    cmd = ['ffmpeg', '-v', 'error', '-i', VIDEO, '-vf', f'select=not(mod(n\\,{STEP_EVERY}))',
           '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    proc = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = W * H * 3
    step = 0
    while True:
        buf = proc.stdout.read(size)
        if len(buf) < size:
            break
        yield step, np.frombuffer(buf, dtype=np.uint8).reshape(H, W, 3)
        step += 1
    proc.wait()
    if proc.returncode:
        raise RuntimeError('ffmpeg failed while decoding the NASA video')


def encode_video(width, height, crf, name):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', VIDEO, '-an', '-vf', f'scale={width}:{height}:flags=lanczos',
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart', os.path.join(OUT, name)], check=True)


def save_frame(frame_index, width, height, name):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{frame_index / FPS:.4f}', '-i', VIDEO, '-frames:v', '1',
                    '-vf', f'scale={width}:{height}:flags=lanczos', '-q:v', '3', os.path.join(OUT, name)], check=True)


def legend_stops(hues, temps):
    row = np.asarray(Image.open(LEGEND).convert('RGB'))[LEGEND_ROW, LEGEND_X0:LEGEND_X1 + 1]
    stops = []
    for t in range(int(T_MIN), int(T_MAX) + 1):
        r, g, b = row[round(t / T_MAX * (len(row) - 1))]
        stops.append([t, f'#{r:02x}{g:02x}{b:02x}'])
    return stops


def main():
    skip_video = '--skip-video' in sys.argv
    for f in (VIDEO, LEGEND, DATES):
        if not os.path.exists(f):
            sys.exit(f'Missing {f}. Run: npm run fetch-sources -- sea-surface-temperature sst-legend sst-dates')
    os.makedirs(OUT, exist_ok=True)
    hues, temps = legend_table()
    dates = read_dates()

    steps = (FRAMES + STEP_EVERY - 1) // STEP_EVERY
    raw = np.full((steps, LATS, LONS), np.nan, dtype=np.float32)
    valid_share = []
    for step, frame in decode_steps():
        temp = pixels_to_temp(frame, hues, temps)
        valid_share.append(float(np.isfinite(temp).mean()))
        raw[step] = cells_from_temp(temp)
        if step % 50 == 0:
            print(f'  step {step:3d}/{steps}  {dates[step * STEP_EVERY]}')
    assert len(valid_share) == steps, f'decoded {len(valid_share)} steps, expected {steps}'

    grid = fill_and_mask(raw)
    q = quantize(grid)
    q.tofile(os.path.join(OUT, 'grid.bin'))
    marks = markers(grid)

    lat = lat_centers()
    for s in (0, steps // 2):
        n40 = np.nanmean(grid[s, (lat > 38) & (lat < 42)])
        s40 = np.nanmean(grid[s, (lat < -38) & (lat > -42)])
        print(f'check {dates[s * STEP_EVERY][:10]}: 40N {n40:5.1f} C, 40S {s40:5.1f} C')
    ocean = float(np.isfinite(grid[0]).mean())
    print(f'ocean cells {ocean:.1%}, valid pixels per frame {np.mean(valid_share):.1%}, markers {marks}')

    shutil.copyfile(LEGEND, os.path.join(OUT, 'legend.png'))
    north = next(m for m in marks if m['id'] == 'north-warmest')
    save_frame(north['step'] * STEP_EVERY, 512, 256, 'cover.jpg')
    save_frame(0, 1536, 768, 'poster.jpg')
    if not skip_video:
        print('encoding web videos (a few minutes)...')
        encode_video(1536, 768, 33, 'video-1536.mp4')
        encode_video(1024, 512, 30, 'video-1024.mp4')

    track = {
        'id': 'sst',
        'svs': 3912,
        'period': '2007–2008',
        'source': {'name': 'NASA Scientific Visualization Studio, "Global Sea Surface Currents and Temperature" (SVS 3912), ECCO2 model',
                   'url': 'https://svs.gsfc.nasa.gov/3912/'},
        'video': {'hi': 'video-1536.mp4', 'lo': 'video-1024.mp4', 'fps': FPS, 'frames': FRAMES, 'duration': FRAMES / FPS},
        'grid': {'file': 'grid.bin', 'steps': steps, 'stepEvery': STEP_EVERY, 'lats': LATS, 'lons': LONS,
                 'cellDeg': CELL_DEG, 'scale': round(SCALE, 6), 'noData': NO_DATA},
        'dates': [dates[s * STEP_EVERY] for s in range(steps)],
        'legend': {'image': 'legend.png', 'unit': '°C', 'min': T_MIN, 'max': T_MAX, 'stops': legend_stops(hues, temps),
                   'singleColour': legend_plateaus()},
        'markers': marks,
        'cover': 'cover.jpg',
        'poster': 'poster.jpg',
    }
    with open(os.path.join(OUT, 'track.json'), 'w', encoding='utf-8') as f:
        json.dump(track, f, ensure_ascii=False, indent=1)
    with open(os.path.join(ROOT, 'public', 'tracks', 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(['sst'], f)
    print(f'wrote {OUT}')


if __name__ == '__main__':
    main()
