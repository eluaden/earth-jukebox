"""Tests for the data-vinyl covers. Run: python scripts/pipeline/test_cover.py"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import cover  # noqa: E402

LAT = 89 - 2 * np.arange(90)
WHITE = cover.lut([(0, (0, 0, 0)), (1, (255, 255, 255))])


def test_zone_mean_ignores_cells_without_data_and_other_zones():
    grid = np.full((1, 90, 180), np.nan)
    grid[0, LAT > 23.5, 0] = 10          # north, column 0
    grid[0, np.abs(LAT) < 23.5, 0] = 30  # tropics, column 0
    north = cover.zone_means(grid, 90, 23.5)
    tropics = cover.zone_means(grid, 23.5, -23.5)
    assert np.isclose(north[0, 0], 10) and np.isclose(tropics[0, 0], 30), (north[0, 0], tropics[0, 0])
    assert np.isnan(north[0, 1]), 'a column with no data stays without data'


def test_zone_mean_is_weighted_by_area():
    grid = np.full((1, 90, 180), np.nan)
    grid[0, 0, 0] = 100   # 89 N: a tiny cell
    grid[0, 32, 0] = 0    # 25 N: a big cell
    m = cover.zone_means(grid, 90, 23.5)[0, 0]
    assert m < 5, m


def test_spiral_goes_one_groove_inwards_per_turn():
    r = np.array([0.88, 0.88])
    frac = np.array([0.0, 0.5])
    ring, _ = cover.groove_map(r, frac, rings=10, outer=1.0, inner=0.0)
    assert ring.tolist() == [1, 0], 'half a turn later the same radius is still the earlier step'
    ring, _ = cover.groove_map(r, frac, rings=10, outer=1.0, inner=0.0, spiral=False)
    assert ring.tolist() == [1, 1]


def test_first_step_is_at_the_rim_and_longitude_runs_counter_clockwise():
    rings = np.zeros((20, 180))
    rings[:, 45] = 1                     # 90-88 W lit in every step
    img = cover.render([rings, np.full((20, 180), np.nan), np.full((20, 180), np.nan)], WHITE)
    mid = img.shape[0] // 2
    left = img[mid, int(mid * 0.12)]     # 9 o'clock, outer band
    right = img[mid, int(mid * 1.88)]    # 3 o'clock, outer band
    assert left.mean() > 150 and right.mean() < 40, (left, right)


def test_bands_go_north_at_the_rim_to_south_next_to_the_label():
    north = np.ones((5, 180))
    south = np.zeros((5, 180))
    img = cover.render([north, np.zeros((5, 180)), south], WHITE)
    mid = img.shape[0] // 2
    radii = cover.band_radii(3)
    at = lambda r: img[mid, int(mid - r * mid * 2 * cover.DISC)].mean()  # noqa: E731
    assert at(sum(radii[0]) / 2) > 200 and at(sum(radii[2]) / 2) < 40


def test_no_data_is_bare_vinyl():
    img = cover.render([np.full((5, 180), np.nan)], WHITE)
    mid = img.shape[0] // 2
    px = img[mid, int(mid - 0.6 * mid * 2 * cover.DISC)]
    assert np.abs(px.astype(int) - cover.VINYL).max() <= 3, px


def test_an_instant_track_is_one_band_of_latitudes():
    meta = {'time': {'unit': 'instant'}}
    cover.PALETTES['test'] = {'norm': 'p99', 'stops': [(0, (0, 0, 0)), (1, (255, 255, 255))]}
    bands, _, spiral = cover.cover_values('test', meta, np.ones((1, 90, 180)))
    assert len(bands) == 1 and bands[0].shape == (90, 180) and not spiral


if __name__ == '__main__':
    tests = [v for k, v in sorted(globals().items()) if k.startswith('test_')]
    for fn in tests:
        fn()
        print('ok  ', fn.__name__)
    print(f'{len(tests)} passed')
