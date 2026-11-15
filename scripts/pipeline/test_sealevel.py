"""Tests for the sea level reader. Run: python scripts/pipeline/test_sealevel.py"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import sealevel  # noqa: E402


def test_the_bar_is_dark_blue_and_the_water_is_not():
    px = np.array([[[10, 20, 200], [0, 200, 255], [40, 160, 230], [10, 60, 140], [230, 240, 255]]], dtype=np.uint8)
    assert sealevel.bar_mask(px).tolist() == [[True, False, False, True, False]]


def test_bar_top_is_the_highest_row_with_enough_bar_pixels():
    strip = np.zeros((50, 10, 3), dtype=np.uint8) + np.array([0, 200, 255], dtype=np.uint8)  # water
    strip[30:, 4:7] = (0, 0, 200)   # the bar, 3 px wide, from row 30 down
    strip[20, 5] = (0, 0, 200)      # a single stray pixel is not the bar
    assert sealevel.bar_top(strip) == 30
    assert sealevel.bar_top(np.zeros((5, 5, 3), dtype=np.uint8)) == -1


def test_ruler_scale_ten_centimetres_is_205_75_pixels():
    assert np.isclose(sealevel.level_cm([1077 - 205.75], 1077)[0], 10)
    assert sealevel.level_cm([1077], 1077)[0] == 0


def test_dates_follow_the_printed_year():
    # Frames where the printed year changes, measured on NASA's video.
    for frame, year in [(300, 1993), (503, 2000), (648, 2005), (794, 2010), (939, 2015), (1084, 2020), (1171, 2023)]:
        assert abs(sealevel.frame_year(frame) - year) < 0.05, (frame, sealevel.frame_year(frame))
    assert sealevel.iso_date(2003.5)[:7] == '2003-07'


def test_quantize_keeps_half_millimetre_steps_and_clips():
    assert sealevel.quantize([0, 3.16, 11.52, -0.2, 20]).tolist() == [0, 63, 230, 0, 254]


if __name__ == '__main__':
    tests = [v for k, v in sorted(globals().items()) if k.startswith('test_')]
    for fn in tests:
        fn()
        print('ok  ', fn.__name__)
    print(f'{len(tests)} passed')
