"""Tests for the aerosols reader. Run: python scripts/pipeline/test_aerosols.py"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import aerosols  # noqa: E402

IDS = [l['id'] for l in aerosols.LAYERS]


def rgb(*cs):
    return np.array([cs], dtype=np.uint8)


def legend_rgb(layer_id):
    h = next(l['color'] for l in aerosols.LAYERS if l['id'] == layer_id)
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def test_each_legend_colour_reads_as_its_own_type_at_full_strength():
    _, chroma = aerosols.hue_chroma(rgb(*[legend_rgb(i) for i in IDS]))
    refs = list(chroma[0])
    s, _ = aerosols.strengths(rgb(*[legend_rgb(i) for i in IDS]), refs)
    for k in range(len(IDS)):
        assert np.isclose(s[0, k, k], 1), (IDS[k], s[0, k])
        assert s[0, k].sum() <= 1.0001


def test_shares_never_add_to_more_than_one():
    sh = aerosols.hue_shares(np.arange(0, 360, 0.5))
    assert (sh.sum(axis=-1) <= 1 + 1e-9).all() and (sh >= 0).all()


def test_grey_land_and_dark_sea_are_no_aerosol():
    s, _ = aerosols.strengths(rgb((40, 47, 40), (62, 69, 61), (5, 10, 6)), [0.5, 0.25, 0.2, 0.5])
    assert s.max() == 0, s


def test_yellow_city_lights_are_left_out():
    s, _ = aerosols.strengths(rgb((255, 235, 140)), [0.5, 0.25, 0.2, 0.5])
    assert s.max() == 0, s


def test_a_blend_of_sulfate_and_sea_salt_is_split():
    hue = np.array([155.0])  # teal, halfway between green and blue-grey
    sh = aerosols.hue_shares(hue)[0]
    assert np.isclose(sh[IDS.index('sulfate')], 0.5) and np.isclose(sh[IDS.index('sea-salt')], 0.5)


def test_fainter_colour_reads_weaker():
    dust = np.array(legend_rgb('dust'), dtype=float)
    base = np.array([5, 10, 6], dtype=float)
    half = (base + 0.5 * (dust - base)).round().astype(np.uint8)
    s, _ = aerosols.strengths(rgb(tuple(dust.astype(np.uint8)), tuple(half)), [0.5, 0.267, 0.2, 0.5])
    k = IDS.index('dust')
    assert 0.3 < s[0, 1, k] < 0.7 * s[0, 0, k], s[0, :, k]


def test_grid_has_one_layer_per_type_and_cell_means():
    img = np.zeros((90, 180, 3), dtype=np.uint8)
    img[10, 33] = legend_rgb('dust')  # one cell of a 1-pixel-per-cell map
    grid, _ = aerosols.aerosol_grid(img, [0.5, 0.267, 0.2, 0.5])
    assert grid.shape == (4, 90, 180)
    k = IDS.index('dust')
    assert grid[k, 10, 33] > 0.9 and grid[k].sum() == grid[k, 10, 33]
    assert grid[[i for i in range(4) if i != k]].max() < 0.05


if __name__ == '__main__':
    tests = [v for k, v in sorted(globals().items()) if k.startswith('test_')]
    for fn in tests:
        fn()
        print('ok  ', fn.__name__)
    print(f'{len(tests)} passed')
