"""Tests for the lightning reader. Run: python scripts/pipeline/test_lightning.py"""
import os
import sys
from datetime import datetime, timedelta

import numpy as np

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import common  # noqa: E402
import lightning  # noqa: E402


def test_labels_fix_the_2003_typo_and_stay_in_order():
    lines = ['31 Dec 2022 19:21', '01 Jan 2003 04:09', '02 Jan 2003 10:00', 'garbage', '']
    d = lightning.parse_labels(lines)
    assert d[1] == datetime(2023, 1, 1, 4, 9), d[1]
    assert d[2] == datetime(2023, 1, 2, 10, 0)
    assert len(d) == 3


def test_labels_reject_a_real_jump_back():
    try:
        lightning.parse_labels(['01 Jun 2020 00:00', '01 Jan 2020 00:00'])
    except ValueError:
        return
    raise AssertionError('a backwards jump that is not the 20-year typo must fail')


def test_steps_every_ten_days_from_a_full_window():
    t0 = datetime(2017, 3, 1)
    dates = [t0 + timedelta(hours=11 * i) for i in range(200)]
    steps = lightning.choose_steps(dates)
    assert steps[0][0] == t0 + timedelta(days=10)
    assert all((b[0] - a[0]) == timedelta(days=10) for a, b in zip(steps, steps[1:]))
    for target, frame in steps:
        assert frame is not None and dates[frame] >= target and dates[frame] - target < timedelta(hours=11)


def test_steps_inside_a_data_gap_have_no_frame():
    t0 = datetime(2019, 1, 1)
    dates = [t0 + timedelta(days=i) for i in range(13)] + [datetime(2019, 2, 1) + timedelta(days=i) for i in range(30)]
    steps = lightning.choose_steps(dates)
    gap = [t for t, f in steps if f is None]
    assert gap and all(datetime(2019, 1, 13) < t < datetime(2019, 2, 1) for t in gap), gap


def test_only_yellow_dots_count_as_lightning():
    px = np.array([[[190, 184, 28], [242, 238, 72], [153, 144, 0],   # lightning yellows
                    [200, 200, 200], [20, 20, 20], [39, 39, 36], [255, 255, 255], [120, 60, 20]]], dtype=np.uint8)
    assert lightning.lightning_mask(px).tolist() == [[True, True, True, False, False, False, False, False]]


def test_coverage_is_the_share_of_the_cell():
    h, w = 180, 360  # 2x2 pixels per cell
    mask = np.zeros((h, w), bool)
    mask[0, 0] = True
    cov = common.cell_share(mask, common.equirect_cells(h, w))
    assert cov.shape == (90, 180) and abs(cov[0, 0] - 0.25) < 1e-9 and cov.sum() == 0.25


def test_rows_without_lightning_ever_are_no_data():
    stack = np.zeros((4, 90, 180))
    stack[2, 20:70, 5] = 0.3
    rows = lightning.data_rows(stack)
    assert rows[20:70].all() and not rows[:20].any() and not rows[70:].any()


def test_quantize_share():
    q = common.quantize_share(np.array([0, 1, 0.5, np.nan, 2.0]))
    assert q.tolist() == [0, 254, 127, 255, 254], q.tolist()


if __name__ == '__main__':
    tests = [v for k, v in sorted(globals().items()) if k.startswith('test_')]
    for fn in tests:
        fn()
        print('ok  ', fn.__name__)
    print(f'{len(tests)} passed')
