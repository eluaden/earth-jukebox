"""Records covers: each track's whole dataset drawn as a vinyl record seen from above (direction 5.4).

Reads only what a track pipeline already wrote (public/tracks/<id>/track.json + grid.bin) and writes
public/tracks/<id>/cover.jpg (512 x 512):
- angle = longitude, in the order the needle reads it: 180 W at the top, then counter-clockwise (the
  record turns clockwise under a fixed needle);
- three bands, like the tracks on one side of an LP: north of 23.5 N at the rim, the tropics in the
  middle, south of 23.5 S next to the label (the three zones the voices play);
- inside each band, radius = time, as one spiral groove: the first step outside, the last inside, one
  turn per step. A track of a single instant (time.unit = 'instant') is one band with one ring per
  latitude instead, 90 N at the rim;
- colour = the zone's mean at that step and longitude (cells with data, weighted by area) in the
  track's own palette. A grid of several layers (aerosols) mixes the legend colour of each layer,
  each layer's strength relative to its own 99th percentile. A grid of one global value per step (sea
  level) is one band whose grooves are the same colour all the way round.

Usage: python scripts/pipeline/cover.py [track_id ...]   (all tracks in public/tracks/index.json by default)
"""
import json
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from common import LATS, LONS, ROOT  # noqa: E402

TRACKS = os.path.join(ROOT, 'public', 'tracks')
SIZE = 512
SUPER = 2                       # rendered at 2x, then downsampled (smooth grooves)
DISC = 0.485                    # disc radius / image size
R_OUT, R_IN = 0.97, 0.31        # grooves, as a share of the disc radius
BAND_GAP = 0.03                 # bare vinyl between bands
ZONES = [(90, 23.5), (23.5, -23.5), (-23.5, -90)]  # north, tropics, south
LABEL, HOLE = 0.27, 0.035       # label and spindle hole radii
SLEEVE = (11, 11, 13)
VINYL = (20, 20, 23)
LABEL_RGB = (38, 39, 44)

# Palette of each track: colour stops over 0..1 and how a mean becomes 0..1.
PALETTES = {
    'sst': {'norm': 'legend'},
    'lightning': {'norm': 'p99', 'gamma': 0.5, 'stops': [(0, VINYL), (0.55, (150, 140, 30)), (1, (255, 233, 74))]},
    'night-lights': {'norm': 'p99', 'gamma': 0.6,
                     'stops': [(0, VINYL), (0.4, (125, 100, 62)), (0.75, (242, 208, 150)), (1, (255, 250, 240))]},
    'aerosols': {'norm': 'layers', 'gamma': 0.7},
    'sea-level': {'norm': 'range', 'min': 0, 'max': 12,
                  'stops': [(0, (14, 38, 84)), (0.5, (38, 128, 214)), (1, (196, 240, 255))]},
}


def hex_rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def lut(stops, n=256):
    """256-entry RGB table from [(position 0..1, (r, g, b)), ...]."""
    pos = np.array([p for p, _ in stops], dtype=np.float64)
    rgb = np.array([c for _, c in stops], dtype=np.float64)
    x = np.linspace(0, 1, n)
    return np.stack([np.interp(x, pos, rgb[:, k]) for k in range(3)], axis=1).round().astype(np.uint8)


def read_grid(track_dir, meta):
    """grid.bin -> float steps x 90 x 180 (steps x layers x 90 x 180 for a layered grid) in the track's
    unit, NaN where there is no data."""
    g = meta['grid']
    lats, lons = g.get('lats', LATS), g.get('lons', LONS)
    shape = (g['steps'], g['layers'], lats, lons) if g.get('layers', 1) > 1 else (g['steps'], lats, lons)
    raw = np.fromfile(os.path.join(track_dir, g['file']), dtype=np.uint8).reshape(shape)
    out = raw.astype(np.float64) * g['scale']
    out[raw == g['noData']] = np.nan
    return out


def zone_means(grid, north, south):
    """Area-weighted mean of a zone's cells with data per step and column: steps x 90 x 180 -> steps x 180
    (NaN = no data in that zone and column)."""
    lat = 89 - 2 * np.arange(LATS)
    inside = (lat < north) & (lat > south)
    w = (np.cos(np.radians(lat)) * inside)[None, :, None] * ~np.isnan(grid)
    total = np.nansum(np.nan_to_num(grid) * w, axis=1)
    weight = w.sum(axis=1)
    with np.errstate(invalid='ignore', divide='ignore'):
        return np.where(weight > 0, total / weight, np.nan)


def normalise(values, palette, meta):
    """Values -> 0..1 for the palette (NaN stays NaN)."""
    if palette['norm'] == 'legend':
        leg = meta['legend']
        return np.clip((values - leg['min']) / (leg['max'] - leg['min']), 0, 1)
    if palette['norm'] == 'range':
        return np.clip((values - palette['min']) / (palette['max'] - palette['min']), 0, 1)
    top = np.nanpercentile(values, 99)
    v = np.clip(values / top, 0, 1) if top > 0 else np.zeros_like(values)
    return v ** palette.get('gamma', 1)


def palette_lut(palette, meta):
    if palette['norm'] == 'legend':
        leg = meta['legend']
        return lut([((t - leg['min']) / (leg['max'] - leg['min']), hex_rgb(h)) for t, h in leg['stops']])
    return lut(palette['stops'])


def band_radii(n):
    """(outer, inner) radius of each of n bands, rim first, with bare vinyl between them."""
    width = (R_OUT - R_IN - (n - 1) * BAND_GAP) / n
    return [(R_OUT - i * (width + BAND_GAP), R_OUT - i * (width + BAND_GAP) - width) for i in range(n)]


def polar(size):
    """Radius (share of the disc radius) and angle share (0 = top, counter-clockwise) of every pixel."""
    c = (size - 1) / 2
    y, x = np.mgrid[0:size, 0:size]
    dx, dy = (x - c) / (size * DISC), (y - c) / (size * DISC)
    return np.hypot(dx, dy), np.mod(np.arctan2(-dx, -dy), 2 * np.pi) / (2 * np.pi)


def groove_map(r, frac, rings, outer, inner, spiral=True):
    """Ring index under each pixel of one band (-1 off it) and the position across the groove (0..1).
    The spiral moves inwards one groove per turn, so it meets step s at every longitude in turn."""
    k = (outer - r) / ((outer - inner) / rings) - (frac if spiral else 0)
    ring = np.floor(k).astype(np.int64)
    on = (r <= outer) & (r >= inner) & (ring >= 0) & (ring < rings)
    return np.where(on, ring, -1), k - np.floor(k)


def render(bands, table, spiral=True, size=SIZE):
    """bands: list of rings x 180 arrays in 0..1 (NaN = no data), or rings x 180 x 3 colours, rim first,
    ring 0 outermost -> uint8 size x size x 3."""
    big = size * SUPER
    r, frac = polar(big)
    col = np.minimum((frac * LONS).astype(np.int64), LONS - 1)
    img = np.empty((big, big, 3), dtype=np.uint8)
    img[:] = SLEEVE
    img[r <= 1] = VINYL
    img[r <= LABEL] = LABEL_RGB
    img[r <= HOLE] = SLEEVE
    for values01, (outer, inner) in zip(bands, band_radii(len(bands))):
        rings = values01.shape[0]
        ring, across = groove_map(r, frac, rings, outer, inner, spiral)
        on = ring >= 0
        v = values01[ring[on], col[on]]
        if v.ndim == 2:
            rgb = v.astype(np.uint8)
        else:
            idx = np.round(np.nan_to_num(v) * 255).astype(np.int64)
            rgb = np.where(np.isnan(v)[:, None], np.array(VINYL, dtype=np.uint8), table[idx])
        # Wide grooves (few steps) get a thin dark line between turns, as on a real record.
        width_px = (outer - inner) / rings * big * DISC
        if width_px >= 6:
            edge = across[on] < 1.4 * SUPER / width_px
            rgb = np.where(edge[:, None], (rgb * 0.35).astype(np.uint8), rgb)
        img[on] = rgb
    return np.asarray(Image.fromarray(img).resize((size, size), Image.LANCZOS))


def mix_layers(layers, colors, gamma=1.0):
    """layers x rings x 180 strengths -> rings x 180 x 3: vinyl plus each layer's colour, by its strength
    relative to its own 99th percentile."""
    out = np.zeros(layers.shape[1:] + (3,)) + VINYL
    for layer, color in zip(layers, colors):
        top = np.nanpercentile(layer, 99)
        v = np.clip(np.nan_to_num(layer) / top, 0, 1) ** gamma if top > 0 else np.zeros_like(layer)
        out += v[..., None] * (np.array(color, dtype=np.float64) - VINYL)
    return np.clip(out, 0, 255).round()


def cover_values(track_id, meta, grid):
    """Bands (each rings x 180 in 0..1, or rings x 180 x 3 colours), the colour table and whether the
    rings are a spiral (time)."""
    palette = PALETTES[track_id]
    instant = meta.get('time', {}).get('unit') == 'instant'
    if palette['norm'] == 'layers':
        colors = [hex_rgb(c['color']) for c in meta['legend']['categories']]
        return [mix_layers(grid[0], colors, palette.get('gamma', 1))], None, not instant
    if grid.shape[1:] == (1, 1):
        bands = [np.repeat(grid[:, 0, :], LONS, axis=1)]  # one global value per step
    else:
        bands = [grid[0]] if instant else [zone_means(grid, n, s) for n, s in ZONES]
    # One normalisation for the whole record, so the bands can be compared.
    flat = normalise(np.concatenate(bands), palette, meta)
    sizes = np.cumsum([len(b) for b in bands])[:-1]
    return np.split(flat, sizes), palette_lut(palette, meta), not instant


def write_cover(track_id):
    track_dir = os.path.join(TRACKS, track_id)
    with open(os.path.join(track_dir, 'track.json'), encoding='utf-8') as f:
        meta = json.load(f)
    bands, table, spiral = cover_values(track_id, meta, read_grid(track_dir, meta))
    out = os.path.join(track_dir, meta.get('cover', 'cover.jpg'))
    Image.fromarray(render(bands, table, spiral)).save(out, quality=90)
    print(f'wrote {out}')


def main(ids):
    if not ids:
        with open(os.path.join(TRACKS, 'index.json'), encoding='utf-8') as f:
            ids = json.load(f)
    for track_id in ids:
        write_cover(track_id)


if __name__ == '__main__':
    main(sys.argv[1:])
