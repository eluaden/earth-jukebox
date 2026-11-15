"""Tests for the SST reader. Run: python scripts/pipeline/test_sst.py (needs sources/, see npm run fetch-sources)."""
import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sst  # noqa: E402

LEGEND = os.path.join(sst.ROOT, 'sources', '3912-sst_ecco2_cbar.png')


def test_legend_roundtrip():
    hues, temps = sst.legend_table(LEGEND)
    row = np.asarray(Image.open(LEGEND).convert('RGB'))[sst.LEGEND_ROW, sst.LEGEND_X0:sst.LEGEND_X1 + 1]
    got = sst.pixels_to_temp(row[None, :-1, :], hues, temps)[0]  # last column is the bar's edge
    want = np.linspace(0, 32, row.shape[0])[:-1]
    err = np.abs(got - want)
    assert np.all(np.isfinite(got)), 'every legend pixel must be readable'
    plateau = np.zeros(len(want), dtype=bool)
    for lo, hi in sst.legend_plateaus(LEGEND):
        plateau |= (want >= lo - 0.06) & (want <= hi + 0.06)
    assert err[~plateau].max() < 0.3, f'max legend error {err[~plateau].max():.3f} C'
    # One colour for a whole stretch: it reads as the middle, so the error is at most half its width.
    assert err[plateau].max() < 0.5, f'max error on a single-colour stretch {err[plateau].max():.3f} C'
    assert sst.legend_plateaus(LEGEND)[-1][1] > 31.5, 'the bar saturates to one red near 32 C'


def test_dimmed_line_keeps_temperature():
    hues, temps = sst.legend_table(LEGEND)
    row = np.asarray(Image.open(LEGEND).convert('RGB'))[sst.LEGEND_ROW, sst.LEGEND_X0:sst.LEGEND_X1 + 1]
    x = round(25 / 32 * (row.shape[0] - 1))
    dim = (row[x].astype(np.float32) * 0.5).round().astype(np.uint8)
    got = sst.pixels_to_temp(dim[None, None, :], hues, temps)[0, 0]
    assert abs(got - 25) < 0.6, got


def test_gray_black_white_are_invalid():
    hues, temps = sst.legend_table(LEGEND)
    px = np.array([[[60, 60, 60], [0, 0, 0], [255, 255, 255]]], dtype=np.uint8)
    got = sst.pixels_to_temp(px, hues, temps)
    assert np.all(np.isnan(got)), got


def test_cells_need_three_pixels():
    big = np.full((180, 360), np.nan, dtype=np.float32)  # each cell is 2x2 pixels
    big[0, 0] = 10
    big[0, 1] = 12
    assert np.isnan(sst.cells_from_temp(big)[0, 0])
    big[1, 0] = 14
    assert abs(sst.cells_from_temp(big)[0, 0] - 12) < 1e-6


def test_fill_and_mask():
    stack = np.full((10, 90, 180), 5.0, dtype=np.float32)
    stack[:9, 0, 0] = np.nan  # 9 of 10 steps empty -> land
    stack[:, 0, 1] = [np.nan, 10, np.nan, 12, 12, 12, 12, 12, 12, 12]
    out = sst.fill_and_mask(stack)
    assert np.all(np.isnan(out[:, 0, 0]))
    assert list(out[:4, 0, 1]) == [10, 10, 10, 12]
    assert np.all(out[:, 5, 5] == 5)


def test_quantize():
    q = sst.quantize(np.array([0, 32, 16, np.nan, 40, -1], dtype=np.float32))
    assert list(q) == [0, 254, 127, 255, 254, 0], list(q)


if __name__ == '__main__':
    tests = [v for k, v in sorted(globals().items()) if k.startswith('test_')]
    for fn in tests:
        fn()
        print('ok  ', fn.__name__)
    print(f'{len(tests)} passed')
