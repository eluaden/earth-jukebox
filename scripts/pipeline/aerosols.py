"""Aerosols track (NASA SVS 5669): one GEOS image -> four aerosol layers + a still texture.

NASA's image is a single instant (19 Aug 2025, 20:00 UTC, GEOS-FP 2 km replay), 3840x2160: an
equirectangular map from 180 W, pole to pole, stretched to 16:9 (checked by drawing the coast of the
SST land mask over it). Four aerosol types are drawn over a dark map, each in its legend colour, with
no numeric scale: black carbon (red-orange, smoke), dust (lilac), sea salt (blue-grey) and sulfate
(green). This script:

1. gives every pixel a share of each type from its hue (red-orange = black carbon, lilac = dust,
   blue-grey = sea salt, green = sulfate; blends between neighbouring hues are split; yellow, the
   colour of city lights, is left out);
2. measures how strong the colour is by its chroma (max - min of RGB), which ignores the grey land
   and the black sea under the aerosols, minus the base map's own faint tint, divided by the type's
   99th percentile (relative to the strongest colour of that type in this image: no unit);
3. averages each type into 2x2 degree cells (four layers, 0..1);
4. writes public/tracks/aerosols/ (grid.bin as uint8[layer][lat][lon], track.json, the 2:1 texture,
   NASA's legend, cover).

Usage: python scripts/pipeline/aerosols.py
Inputs: npm run fetch-sources -- aerosols aerosols-legend
Needs: Python 3, numpy, Pillow.
"""
import os
import shutil
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cover import write_cover  # noqa: E402
from common import LATS, LONS, NO_DATA, ROOT, SRC, cell_mean, equirect_cells, quantize_share, write_json  # noqa: E402

IMAGE = os.path.join(SRC, '5669-Aerosols_2025-08-19T20_00_00_3840x2160.png')
LEGEND = os.path.join(SRC, '5669-Aerosols_cbar.png')
OUT = os.path.join(ROOT, 'public', 'tracks', 'aerosols')
TEX_W, TEX_H = 2048, 1024

# Grid layer order, NASA's legend names and swatch colours (measured on Aerosols_cbar.png).
LAYERS = [
    {'id': 'black-carbon', 'name': 'Black Carbon', 'color': '#d25e45'},
    {'id': 'dust', 'name': 'Dust', 'color': '#c19adc'},
    {'id': 'sea-salt', 'name': 'Sea Salt', 'color': '#85aaa9'},
    {'id': 'sulfate', 'name': 'Sulfate', 'color': '#53dc34'},
]
# Share of each type by hue (degrees), piecewise linear; neighbouring types split the blends between
# them. 45-55 (yellow: city lights, and the rare smoke + sulfate blend) belongs to no type.
HUE_SHARE = {
    'black-carbon': [(0, 1), (35, 1), (45, 0), (320, 0), (350, 1), (360, 1)],
    'dust': [(0, 0), (235, 0), (255, 1), (320, 1), (350, 0), (360, 0)],
    'sea-salt': [(0, 0), (140, 0), (170, 1), (235, 1), (255, 0), (360, 0)],
    'sulfate': [(0, 0), (55, 0), (75, 1), (140, 1), (170, 0), (360, 0)],
}
FLOOR = 0.04        # chroma of the base map alone: dark sea ~0.02, grey land ~0.03, Arctic haze ~0.035
REF_PCT = 99        # a type's chroma at this percentile (pixels mostly of that type) reads as 1


def hue_chroma(rgb):
    """uint8 HxWx3 -> hue in degrees (0..360) and chroma (0..1)."""
    a = rgb.astype(np.float64) / 255
    mx, mn = a.max(axis=2), a.min(axis=2)
    c = mx - mn
    d = np.maximum(c, 1e-9)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.where(mx == r, np.mod((g - b) / d, 6), np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) * 60
    return np.where(c > 0, h, 0), c


def hue_shares(hue):
    """Hue (any shape) -> share of each type, shape + (4,), in LAYERS order."""
    out = []
    for layer in LAYERS:
        pts = HUE_SHARE[layer['id']]
        out.append(np.interp(hue, [p for p, _ in pts], [w for _, w in pts]))
    return np.stack(out, axis=-1)


def references(shares, chroma):
    """Chroma that reads as full strength for each type: the REF_PCT percentile over the pixels that are
    mostly that type and coloured above the base map."""
    refs = []
    for k in range(len(LAYERS)):
        sel = (shares[..., k] >= 0.5) & (chroma > FLOOR)
        refs.append(float(np.percentile(chroma[sel], REF_PCT)) if sel.any() else 1.0)
    return refs


def strengths(rgb, refs=None):
    """uint8 HxWx3 -> HxWx4 strength of each type (0..1) and the references used."""
    hue, chroma = hue_chroma(rgb)
    shares = hue_shares(hue)
    refs = refs or references(shares, chroma)
    above = np.maximum(0, chroma - FLOOR)[..., None]
    base = np.array([r - FLOOR for r in refs])
    return np.clip(shares * above / base, 0, 1), refs


def aerosol_grid(rgb, refs=None):
    """uint8 HxWx3 equirectangular image from 180 W -> float 4 x 90 x 180 (cell means) and the refs."""
    s, refs = strengths(rgb, refs)
    cells = equirect_cells(rgb.shape[0], rgb.shape[1], -180.0)
    return np.stack([cell_mean(s[..., k], cells) for k in range(len(LAYERS))]), refs


def area_mean(layer):
    """Area-weighted mean of a 90 x 180 layer."""
    w = np.cos(np.radians(89 - 2 * np.arange(LATS)))[:, None]
    return float((layer * w).sum() / (w.sum() * LONS))


def peak(layer):
    """Cell with the highest value -> (lat, lon) of its centre."""
    j, i = np.unravel_index(int(np.argmax(layer)), layer.shape)
    return 89 - 2 * int(j), -179 + 2 * int(i)


def main():
    os.makedirs(OUT, exist_ok=True)
    rgb = np.asarray(Image.open(IMAGE).convert('RGB'))
    grid, refs = aerosol_grid(rgb)
    print('reference chroma per type:', {l['id']: round(r, 3) for l, r in zip(LAYERS, refs)})
    for layer, g in zip(LAYERS, grid):
        lat, lon = peak(g)
        print(f"  {layer['id']:13s} area mean {area_mean(g):.3f}, cells above 0.05: {(g > 0.05).mean():.0%}, "
              f'p99 {np.percentile(g, 99):.2f}, peak {g.max():.2f} at {lat} {lon}')

    np.stack([quantize_share(g) for g in grid]).tofile(os.path.join(OUT, 'grid.bin'))
    Image.fromarray(rgb).resize((TEX_W, TEX_H), Image.LANCZOS).save(os.path.join(OUT, 'aerosols.jpg'), quality=90)
    shutil.copyfile(LEGEND, os.path.join(OUT, 'legend.png'))

    # Narration markers: where the needle meets the strongest cell of each voiced type (sulfate is not
    # played, see src/music/tracks/aerosols.js).
    markers = []
    for k, mid in ((1, 'dust'), (0, 'smoke'), (2, 'sea-salt')):
        lat, lon = peak(grid[k])
        markers.append({'id': mid, 'lat': lat, 'lon': lon})

    track = {
        'id': 'aerosols',
        'svs': 5669,
        'period': '2025-08-19',
        'source': {'name': 'NASA Scientific Visualization Studio, "GEOS Aerosols" (SVS 5669), GEOS Forward Processing '
                           '2 km replay (NASA GMAO)',
                   'url': 'https://svs.gsfc.nasa.gov/5669/'},
        # One still: the needle sweeps the same instant on every turn of the globe.
        'texture': {'kind': 'stills', 'images': ['aerosols.jpg']},
        'time': {'unit': 'instant', 'secondsPerStep': 10},
        'grid': {'file': 'grid.bin', 'steps': 1, 'layers': len(LAYERS), 'layerIds': [l['id'] for l in LAYERS],
                 'lats': LATS, 'lons': LONS, 'cellDeg': 2, 'scale': round(1 / 254, 6), 'noData': NO_DATA,
                 'value': "strength of each aerosol type's colour in NASA's image, relative to its strongest (0-1)"},
        'dates': ['2025-08-19T20:00Z'],
        'legend': {'image': 'legend.png', 'categories': LAYERS},
        'reading': {'chromaFloor': FLOOR, 'referenceChroma': {l['id']: round(r, 4) for l, r in zip(LAYERS, refs)},
                    'areaMean': {l['id']: round(area_mean(g), 4) for l, g in zip(LAYERS, grid)}},
        'markers': markers,
        'cover': 'cover.jpg',
        'poster': 'aerosols.jpg',
    }
    write_json(os.path.join(OUT, 'track.json'), track)
    write_cover('aerosols')
    print(f'markers {markers}; wrote {OUT}')


if __name__ == '__main__':
    main()
