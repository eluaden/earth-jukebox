"""Sea level bonus track (NASA SVS 5235, "Sea Level Through a Porthole (2023)"): ruler -> level series.

NASA's video (2160x2160, 30 fps, 1500 frames) looks out of a ship's porthole. A ruler in centimetres
is printed on the glass; a dark blue bar rises from the "1993 sea level" mark to the current level,
which NASA says shows the exact measurements of the multi-mission altimeter record (TOPEX/Poseidon,
Jason-1, -2, -3, Sentinel-6). The page publishes no data file, so this script reads the bar:

1. decodes the ruler strip of every frame and finds the top of the blue bar;
2. turns its height above the 1993 mark into centimetres with the ruler printed on the frame
   (major ticks every 10 cm, 205.75 px apart: rows 50.0 for +50 cm and 2107.5 for -50 cm);
3. dates each frame: the printed year changes on a straight line, 1993.0 at frame 300 and 31 years in
   900 frames (frames 503, 648, 794, 939, 1084 and 1171 start 2000, 2005, 2010, 2015, 2020 and 2023);
   frames 0-299 are the 1993 mark alone and 1200-1499 hold the last value, so the record is 300-1199
   (900 steps, one per frame, 1 January 1993 to late December 2023);
4. writes public/tracks/sea-level/ (grid.bin with one value per step, track.json, the porthole video
   from frame 300 to 1199, poster, cover).

Usage: python scripts/pipeline/sealevel.py [--skip-video]
Inputs: npm run fetch-sources -- sea-level
Needs: Python 3, numpy, Pillow, ffmpeg on PATH.
"""
import os
import subprocess
import sys
from datetime import datetime

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cover import write_cover  # noqa: E402
from common import NO_DATA, ROOT, SRC, write_json  # noqa: E402

VIDEO = os.path.join(SRC, '5235-seaLevelWaveTankComp_noWW_3-5-5-2024a_2160p30.mp4')
OUT = os.path.join(ROOT, 'public', 'tracks', 'sea-level')
SIZE, FPS = 2160, 30
STRIP = (1059, 500, 60, 700)       # x, y, w, h of the ruler strip where the bar is drawn (full frame)
PX_PER_CM = 20.575                 # (2107.5 - 50.0) / 100 cm
FIRST, LAST = 300, 1200            # 1993.0 and 2024.0: the record is frames FIRST .. LAST - 1
YEARS = 31                         # 1993-2023 in those 900 frames
SCALE = 0.05                       # cm per stored unit (0 .. 12.7 cm)
MIN_PIXELS = 2                     # bar pixels a row needs


def bar_mask(rgb):
    """Dark blue of the bar and its level tick (the water is cyan: much more green)."""
    r, g, b = rgb[..., 0].astype(int), rgb[..., 1].astype(int), rgb[..., 2].astype(int)
    return (r < 90) & (g < 90) & (b > 130)


def bar_top(strip_rgb):
    """Row of the highest bar pixel in the strip (MIN_PIXELS per row), or -1 if none."""
    rows = np.where(bar_mask(strip_rgb).sum(axis=1) >= MIN_PIXELS)[0]
    return int(rows.min()) if len(rows) else -1


def level_cm(tops, zero):
    """Bar tops (rows) -> centimetres above the 1993 mark (higher bar = smaller row)."""
    return (zero - np.asarray(tops, dtype=np.float64)) / PX_PER_CM


def frame_year(frame):
    """Decimal year of a source frame, from the printed year labels (linear)."""
    return 1993 + (frame - FIRST) * YEARS / (LAST - FIRST)


def iso_date(year):
    start = datetime(int(year), 1, 1)
    end = datetime(int(year) + 1, 1, 1)
    return (start + (end - start) * (year - int(year))).strftime('%Y-%m-%dT00:00Z')


def quantize(cm):
    return np.clip(np.round(np.asarray(cm) / SCALE), 0, 254).astype(np.uint8)


def read_tops():
    x, y, w, h = STRIP
    proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', VIDEO, '-vf', f'crop={w}:{h}:{x}:{y}', '-f', 'rawvideo',
                             '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    tops = []
    while True:
        buf = proc.stdout.read(w * h * 3)
        if len(buf) < w * h * 3:
            break
        tops.append(bar_top(np.frombuffer(buf, dtype=np.uint8).reshape(h, w, 3)))
    proc.wait()
    return np.array(tops)


def encode(size, crf, name):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{FIRST / FPS:.4f}', '-i', VIDEO, '-frames:v', str(LAST - FIRST),
                    '-an', '-vf', f'scale={size}:{size}:flags=lanczos', '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf),
                    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', os.path.join(OUT, name)], check=True)


def save_frame(frame, size, name):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{frame / FPS - 0.001:.4f}', '-i', VIDEO, '-frames:v', '1',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    img = Image.fromarray(np.frombuffer(raw, dtype=np.uint8).reshape(SIZE, SIZE, 3))
    img.resize((size, size), Image.LANCZOS).save(os.path.join(OUT, name), quality=88)


def main():
    skip_video = '--skip-video' in sys.argv
    os.makedirs(OUT, exist_ok=True)
    tops = read_tops()
    if len(tops) < LAST:
        raise RuntimeError(f'video has {len(tops)} frames, expected at least {LAST}')
    before = tops[:FIRST - 1]
    zero = float(np.median(before))
    if np.ptp(before) > 1:
        raise RuntimeError('the 1993 mark moves before the record starts: check STRIP')
    cm = level_cm(tops[FIRST:LAST], zero)
    steps = len(cm)
    years = [frame_year(FIRST + k) for k in range(steps)]
    print(f'zero row {zero + STRIP[1]:.0f}; {steps} steps; level {cm.min():.2f} .. {cm.max():.2f} cm; '
          f'end {cm[-1]:.2f} cm')

    # Narration markers: ten and twenty years on. 2023 and the highest point (October 2023) come less
    # than a second before the record loops, so the closing line speaks for them.
    markers = [{'id': f'year-{y}', 'step': int(np.ceil((y - 1993) * (LAST - FIRST) / YEARS))} for y in (2003, 2013)]
    for m in markers:
        print(f"  {m['id']}: step {m['step']} ({years[m['step']]:.2f}) {cm[m['step']]:.2f} cm")
    k23 = int(np.ceil(30 * (LAST - FIRST) / YEARS))
    print(f'  2023 starts at step {k23}: {cm[k23]:.2f} cm; highest {cm.max():.2f} cm at {years[int(np.argmax(cm))]:.2f}')

    quantize(cm).tofile(os.path.join(OUT, 'grid.bin'))
    save_frame(FIRST, 1080, 'poster.jpg')
    if not skip_video:
        print('encoding web videos...')
        encode(1080, 26, 'video-1080.mp4')
        encode(720, 26, 'video-720.mp4')

    track = {
        'id': 'sea-level',
        'svs': 5235,
        'period': '1993–2023',
        'source': {'name': 'NASA Scientific Visualization Studio, "Sea Level Through a Porthole (2023)" (SVS 5235), Integrated '
                           'Multi-Mission Ocean Altimeters (TOPEX/Poseidon, Jason-1, OSTM/Jason-2, Jason-3), GSFC GMSL v5.1',
                   'url': 'https://svs.gsfc.nasa.gov/5235/'},
        # Bonus record: NASA's square video in a round porthole instead of a skin on the globe (direction 5.4).
        'texture': {'kind': 'porthole'},
        'video': {'hi': 'video-1080.mp4', 'lo': 'video-720.mp4', 'fps': FPS, 'frames': steps, 'duration': steps / FPS},
        'grid': {'file': 'grid.bin', 'steps': steps, 'stepEvery': 1, 'lats': 1, 'lons': 1, 'scale': SCALE,
                 'noData': NO_DATA, 'unit': 'cm',
                 'value': 'global mean sea level above 1993, in cm, read from the blue bar on NASA\'s ruler'},
        'dates': [iso_date(y) for y in years],
        'markers': markers,
        'cover': 'cover.jpg',
        'poster': 'poster.jpg',
    }
    write_json(os.path.join(OUT, 'track.json'), track)
    write_cover('sea-level')
    print(f'wrote {OUT}')


if __name__ == '__main__':
    main()
