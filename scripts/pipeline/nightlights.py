"""Night lights track (NASA SVS 5313): EIC video -> yearly light grid + 12 globe textures.

NASA's EIC video (7680x2160, 32:9, H.265) holds two copies of the world map side by side; each copy
is equirectangular pole to pole stretched to 16:9 and starts at 168.5 W. The year is printed in the
middle, on the right copy, so the left copy is used. Frames 0-269 are the annual series 2012-2023,
the lights then fade out and one frame shows the map with no lights at all. This script:

1. finds where each year starts (the printed label changes) and takes the middle frame of each year;
2. finds the lights-free frame (the darkest one of the fade);
3. light = brightness of the year frame minus brightness of the lights-free frame, averaged over each
   2x2 degree cell (relative brightness of NASA's image: the series has no numeric legend); cells that
   are almost all sea are "no data";
4. writes public/tracks/night-lights/ (grid.bin, track.json, year-<YYYY>.jpg textures at 2:1 from
   180 W, cover).

Usage: python scripts/pipeline/nightlights.py
Inputs: npm run fetch-sources -- night-lights
Needs: Python 3, numpy, Pillow, ffmpeg on PATH (with an H.265 decoder).
"""
import os
import subprocess
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import LATS, LONS, NO_DATA, ROOT, SRC, cell_mean, decode_frames, equirect_cells, write_json  # noqa: E402

VIDEO = os.path.join(SRC, '5313-nightlights_flat_series_and_change_wZooms_13_EIC_2160p30_h265.mp4')
OUT = os.path.join(ROOT, 'public', 'tracks', 'night-lights')

FULL_W, H = 7680, 2160
COPY_W = 3840                 # left copy of the map
LON0 = -168.5                 # longitude of the left edge of each copy (fitted against the SST coastline, E1)
FIRST_YEAR, YEARS = 2012, 12
SERIES_LAST = 269             # last frame of the annual series
FADE = (270, 300)             # the lights fade out somewhere in here
LABEL_CROP = '480:160:3800:1020'  # the printed year, centre of the 32:9 frame
SEA_BELOW = 4.0               # brightness of the lights-free map: sea is ~1, land is 10+
MIN_LAND = 0.05               # cells with less land than this are sea (no data)
TEX_W, TEX_H = 2048, 1024


def change_points(diffs, threshold=0.15, min_gap=4):
    """Frames where the printed label starts to change (first frame is always a start)."""
    starts = [0]
    for i in range(1, len(diffs)):
        if diffs[i] > threshold and i - starts[-1] >= min_gap:
            starts.append(i)
    return starts


def middle_frames(starts, last):
    ends = [s - 1 for s in starts[1:]] + [last]
    return [(s + e) // 2 for s, e in zip(starts, ends)]


def pick_base(bright, lo, hi):
    return lo + int(np.argmin(bright[lo:hi + 1]))


def to_equirect(img, lon0, out_w, out_h):
    """Resample a pole-to-pole equirectangular map whose left edge is lon0 (any aspect ratio) into a
    2:1-style map of out_w x out_h starting at 180 W (bilinear)."""
    src_h, src_w = img.shape[:2]
    lon = -180 + (np.arange(out_w) + 0.5) / out_w * 360
    lat = 90 - (np.arange(out_h) + 0.5) / out_h * 180
    sx = np.mod(lon - lon0, 360) / 360 * src_w - 0.5
    sy = (90 - lat) / 180 * src_h - 0.5
    x0 = np.floor(sx).astype(int)
    y0 = np.clip(np.floor(sy).astype(int), 0, src_h - 1)
    fx = (sx - x0)[None, :, None]
    fy = np.clip(sy - y0, 0, 1)[:, None, None]
    x1 = (x0 + 1) % src_w
    x0 = x0 % src_w
    y1 = np.clip(y0 + 1, 0, src_h - 1)
    a = img.astype(np.float32)
    top = a[y0][:, x0] * (1 - fx) + a[y0][:, x1] * fx
    bot = a[y1][:, x0] * (1 - fx) + a[y1][:, x1] * fx
    return np.clip(top * (1 - fy) + bot * fy + 0.5, 0, 255).astype(np.uint8)


def luminance(rgb):
    a = rgb.astype(np.float32)
    return 0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2]


def light_grid(year_rgb, base_rgb, lon0=LON0):
    """(light per cell, sea mask per cell). Light = mean of (year - base) brightness, signed so video
    noise averages out, then clipped at 0."""
    h, w = year_rgb.shape[:2]
    cells = equirect_cells(h, w, lon0)
    base = luminance(base_rgb)
    light = np.maximum(cell_mean(luminance(year_rgb) - base, cells), 0)
    land = cell_mean((base > SEA_BELOW).astype(np.float32), cells)
    return light, land < MIN_LAND


def quantize_light(light):
    """Brightness 0..254 (rounded); NaN -> 255."""
    q = np.round(np.clip(light, 0, 254))
    return np.where(np.isnan(light), NO_DATA, q).astype(np.uint8)


def label_diffs(last):
    w, h = 480, 160
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', VIDEO, '-frames:v', str(last + 1), '-vf', f'crop={LABEL_CROP}',
                          '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], capture_output=True, check=True).stdout
    lab = np.frombuffer(raw, np.uint8).reshape(-1, h, w).astype(np.int16)
    return np.r_[0, np.abs(np.diff(lab, axis=0)).mean((1, 2))]


def fade_brightness(lo, hi):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', VIDEO, '-frames:v', str(hi + 1), '-vf',
                          f'crop={COPY_W}:{H}:0:0,scale=960:540:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.uint8).reshape(-1, 540, 960, 3)
    return (a.mean(-1) > 60).sum((1, 2))


def main():
    if not os.path.exists(VIDEO):
        sys.exit(f'Missing {VIDEO}. Run: npm run fetch-sources -- night-lights')
    os.makedirs(OUT, exist_ok=True)

    starts = change_points(label_diffs(SERIES_LAST)[:SERIES_LAST + 1])
    assert len(starts) == YEARS, f'expected {YEARS} year blocks, found {len(starts)} at {starts}'
    frames = middle_frames(starts, SERIES_LAST)
    base_frame = pick_base(fade_brightness(*FADE), *FADE)
    print(f'years start at frames {starts}; reading frames {frames}; lights-free frame {base_frame}')

    decoded = dict(decode_frames(VIDEO, frames + [base_frame], COPY_W, H, crop=f'{COPY_W}:{H}:0:0'))
    base = decoded[base_frame]
    grid = np.zeros((YEARS, LATS, LONS), np.float32)
    dark = luminance(base) <= SEA_BELOW
    for k, f in enumerate(frames):
        light, sea = light_grid(decoded[f], base)
        light[sea] = np.nan
        grid[k] = light
        year = FIRST_YEAR + k
        Image.fromarray(to_equirect(decoded[f], LON0, TEX_W, TEX_H)).save(os.path.join(OUT, f'year-{year}.jpg'), quality=88)
        noise = float(np.median(luminance(decoded[f])[dark] - luminance(base)[dark]))
        total = float(np.nansum(light))
        print(f'  {year}: frame {f}, total light {total:8.1f}, median change over dark sea {noise:+.2f}')
    Image.open(os.path.join(OUT, f'year-{FIRST_YEAR + YEARS - 1}.jpg')).resize((512, 256), Image.LANCZOS).save(
        os.path.join(OUT, 'cover.jpg'), quality=88)

    q = quantize_light(grid)
    q.tofile(os.path.join(OUT, 'grid.bin'))
    totals = np.nansum(grid, axis=(1, 2))
    lit = grid[~np.isnan(grid)]
    print(f'land cells {int((~np.isnan(grid[0])).sum())}; light p50 {np.percentile(lit, 50):.2f} '
          f'p90 {np.percentile(lit, 90):.2f} p99 {np.percentile(lit, 99):.2f} max {lit.max():.1f}')
    change = np.diff(totals) / totals[:-1]
    print('year-to-year change of total light:', {FIRST_YEAR + k + 1: f'{c:+.1%}' for k, c in enumerate(change)})
    # Narration markers use only what holds however the light is counted: the largest jump from one
    # year to the next and the brightest year. (Which single years dip depends on the measure: the
    # brightness used here dips in 2016; a count of very bright pixels dips in 2020 instead.)
    markers = [{'id': 'biggest-jump', 'step': int(np.argmax(change)) + 1},
               {'id': 'brightest', 'step': int(np.argmax(totals))}]

    track = {
        'id': 'night-lights',
        'svs': 5313,
        'period': '2012–2023',
        'source': {'name': 'NASA Scientific Visualization Studio, "Change in Night Lights between 2012 and 2023 - EIC '
                           'Version" (SVS 5313), Black Marble (NASA/NOAA, VIIRS on Suomi NPP)',
                   'url': 'https://svs.gsfc.nasa.gov/5313/'},
        # No video: the globe wears one still per year and the app fades between them.
        'texture': {'kind': 'stills', 'images': [f'year-{FIRST_YEAR + k}.jpg' for k in range(YEARS)]},
        'time': {'unit': 'year', 'secondsPerStep': 10},
        'grid': {'file': 'grid.bin', 'steps': YEARS, 'lats': LATS, 'lons': LONS, 'cellDeg': 2, 'scale': 1,
                 'noData': NO_DATA, 'value': "mean brightness added by night lights (0-255 of NASA's image), annual average"},
        'dates': [f'{FIRST_YEAR + k}-07-01T00:00Z' for k in range(YEARS)],
        'totals': [round(float(t), 1) for t in totals],
        'markers': markers,
        'cover': 'cover.jpg',
        'poster': f'year-{FIRST_YEAR}.jpg',
    }
    write_json(os.path.join(OUT, 'track.json'), track)
    print(f'markers {markers}; wrote {OUT}')


if __name__ == '__main__':
    main()
