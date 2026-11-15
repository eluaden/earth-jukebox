"""Tests for the night lights reader. Run: python scripts/pipeline/test_nightlights.py"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import nightlights  # noqa: E402


def test_year_blocks_start_where_the_printed_label_changes():
    diffs = np.zeros(270)
    for s in (15, 33, 51):
        diffs[s] = 1.2
        diffs[s + 1] = 0.4  # the change can last two frames
    assert nightlights.change_points(diffs, threshold=0.15, min_gap=4) == [0, 15, 33, 51]


def test_one_frame_from_the_middle_of_each_year():
    assert nightlights.middle_frames([0, 15, 33], last=50) == [7, 23, 41]  # blocks 0-14, 15-32, 33-50


def test_base_is_the_darkest_frame_of_the_fade():
    bright = np.full(320, 1800)
    bright[285:295] = [900, 600, 300, 100, 4, 0, 20, 300, 700, 1000]
    assert nightlights.pick_base(bright, 270, 300) == 290


def test_remap_keeps_an_image_that_already_starts_at_180_west():
    img = np.random.default_rng(1).integers(0, 255, (90, 180, 3)).astype(np.uint8)
    out = nightlights.to_equirect(img, -180.0, 180, 90)
    assert np.abs(out.astype(int) - img.astype(int)).max() <= 1


def test_remap_moves_a_map_that_starts_at_168_5_west():
    img = np.zeros((90, 360, 3), np.uint8)
    img[:, 0] = 255  # the column at 168.5 W in the source map (1 px = 1 degree)
    out = nightlights.to_equirect(img, -168.5, 360, 90)
    col = int(np.argmax(out[45, :, 0]))
    assert abs(col - 11) <= 1, col  # 168.5 W sits 11.5 degrees east of the left edge of a -180 map


def test_light_is_brightness_above_the_lights_free_frame():
    h, w = 180, 360  # 2x2 source pixels per cell, map from 180 W
    base = np.full((h, w, 3), 20, np.uint8)
    base[:, 300:] = 1  # sea on the right
    year = base.copy()
    year[0:2, 0:2] = 120  # one cell fully lit, +100 brightness
    light, sea = nightlights.light_grid(year, base, lon0=-180.0)
    assert abs(light[0, 0] - 100) < 0.5, light[0, 0]
    assert abs(light[0, 1]) < 0.5
    assert sea[0, 170] and not sea[0, 0]


def test_quantize_light():
    q = nightlights.quantize_light(np.array([0, 10.4, 300, -3, np.nan]))
    assert q.tolist() == [0, 10, 254, 0, 255], q.tolist()


if __name__ == '__main__':
    tests = [v for k, v in sorted(globals().items()) if k.startswith('test_')]
    for fn in tests:
        fn()
        print('ok  ', fn.__name__)
    print(f'{len(tests)} passed')
