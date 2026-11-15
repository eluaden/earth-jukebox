"""Shared helpers for the track pipelines (NASA video -> grid of values + web textures)."""
import json
import os
import subprocess

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'sources')
LATS, LONS, CELL_DEG = 90, 180, 2
NO_DATA = 255


def cell_index(lat, lon):
    """Row (0 = 90-88 N) and column (0 = 180-178 W) of the 2-degree cell holding each lat/lon."""
    row = np.clip(np.floor((90 - lat) / CELL_DEG), 0, LATS - 1).astype(np.int64)
    col = (np.floor((np.mod(lon + 180, 360)) / CELL_DEG).astype(np.int64)) % LONS
    return row, col


def equirect_cells(height, width, lon0=-180.0):
    """Flat cell id of every pixel of an equirectangular image (pole to pole) whose left edge is lon0."""
    lat = 90 - (np.arange(height) + 0.5) / height * 180
    lon = lon0 + (np.arange(width) + 0.5) / width * 360
    row, _ = cell_index(lat, np.zeros_like(lat))
    _, col = cell_index(np.zeros_like(lon), lon)
    return (row[:, None] * LONS + col[None, :]).ravel()


def cell_share(mask, cells):
    """Share of each cell's pixels where mask is true -> 90x180 float."""
    n = np.bincount(cells, minlength=LATS * LONS)
    hit = np.bincount(cells, weights=mask.ravel().astype(np.float64), minlength=LATS * LONS)
    return (hit / np.maximum(n, 1)).reshape(LATS, LONS)


def cell_mean(values, cells):
    """Mean of values (HxW) over each cell's pixels -> 90x180 float."""
    n = np.bincount(cells, minlength=LATS * LONS)
    total = np.bincount(cells, weights=values.ravel().astype(np.float64), minlength=LATS * LONS)
    return (total / np.maximum(n, 1)).reshape(LATS, LONS)


def decode_frames(video, frames, width, height, crop=None):
    """Yields (frame_index, uint8 HxWx3) for the given frame indices (ascending), decoded at full quality."""
    frames = sorted(frames)
    expr = '+'.join(f'eq(n\\,{f})' for f in frames)
    vf = f'select={expr}' + (f',crop={crop}' if crop else '')
    proc = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', video, '-vf', vf, '-fps_mode', 'passthrough',
                             '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    size = width * height * 3
    for f in frames:
        buf = proc.stdout.read(size)
        if len(buf) < size:
            raise RuntimeError(f'ffmpeg stopped before frame {f}')
        yield f, np.frombuffer(buf, dtype=np.uint8).reshape(height, width, 3)
    proc.stdout.close()
    proc.wait()


def decode_frame_at(video, frame, fps, width, height, crop=None):
    """One frame by index, seeking just before its timestamp (frame n has pts n / fps). For long lists
    of frames, where a single select expression gets too long for ffmpeg."""
    vf = ['-vf', f'crop={crop}'] if crop else []
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{frame / fps - 0.001:.6f}', '-i', video, *vf,
                          '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'],
                         capture_output=True, check=True).stdout
    if len(raw) != width * height * 3:
        raise RuntimeError(f'could not decode frame {frame}')
    return np.frombuffer(raw, dtype=np.uint8).reshape(height, width, 3)


def encode_video(video, out, width, height, crf, start_seconds=0.0, fps=None):
    vf = f'scale={width}:{height}:flags=lanczos' + (f',fps={fps}' if fps else '')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{start_seconds:.4f}', '-i', video, '-an', '-vf', vf,
                    '-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), '-pix_fmt', 'yuv420p',
                    '-movflags', '+faststart', out], check=True)


def write_json(path, obj):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)


def quantize_share(share):
    """0..1 share -> uint8 0..254 (round(share * 254)); NaN -> 255."""
    q = np.round(np.clip(share, 0, 1) * 254)
    return np.where(np.isnan(share), NO_DATA, q).astype(np.uint8)
