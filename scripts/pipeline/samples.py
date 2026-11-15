"""Instrument samples for the app: a small subset of VSCO 2 Community Edition (CC0), as MP3.

Downloads only the notes we use from https://github.com/sgossner/VSCO-2-CE (originals cached in
sources/samples/, which git ignores), trims trailing silence and writes public/samples/<voice>/<note>.mp3
plus public/samples/samples.json (Tone.Sampler "urls" per voice, scientific pitch names).

VSCO names its notes one octave lower than scientific pitch (its middle C is C3), so octave + 1.
The upright piano files are numbered: index NNN plays MIDI key 21 + 2*NNN (Keys/Upright Piano/MappingChart.txt).

Usage: python scripts/pipeline/samples.py      Needs: Python 3, ffmpeg on PATH.
"""
import json
import os
import re
import subprocess
import urllib.parse
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE = os.path.join(ROOT, 'sources', 'samples')
OUT = os.path.join(ROOT, 'public', 'samples')
BASE = 'https://raw.githubusercontent.com/sgossner/VSCO-2-CE/master/'
NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']


def note_name(midi):
    return f'{NAMES[midi % 12]}{midi // 12 - 1}'


def vsco_to_scientific(name):
    m = re.fullmatch(r'([A-G]#?)(-?\d)', name)
    return f'{m.group(1)}{int(m.group(2)) + 1}'


def plan():
    files = {'strings': [], 'piano': [], 'glock': []}
    # Strings: cello section for the low and middle range, violin section on top (sustain with vibrato).
    for n in ['C1', 'E1', 'G1', 'B1', 'D2', 'F2', 'A2', 'C3', 'E3', 'G3', 'B3', 'D4', 'F4']:
        files['strings'].append((f'Strings/Cello Section/susvib/susvib_{n}_v1_1.wav', vsco_to_scientific(n)))
    for n in ['G4', 'B4', 'D5']:
        files['strings'].append((f'Strings/Violin Section/susVib/VlnEns_susVib_{n}_v1.wav', vsco_to_scientific(n)))
    for idx in range(16, 41, 2):  # MIDI 53..101, every major third
        files['piano'].append((f'Keys/Upright Piano/Player_dyn2_rr1_{idx:03d}.wav', note_name(21 + 2 * idx)))
    for n in ['G4', 'C5', 'G5', 'C6', 'G6', 'C7']:
        files['glock'].append((f'Percussion/Glock/glock_medium_{n}.wav', vsco_to_scientific(n)))
    # Marimba (lightning): tuned percussion across the range of the lightning bands.
    files['marimba'] = []
    for n in ['G2', 'B2', 'C4', 'G4', 'B4', 'F5', 'C6']:
        files['marimba'].append((f'Percussion/Marimba/Marimba_hit_Outrigger_{n}_loud_01.wav', vsco_to_scientific(n)))
    return files


def fetch(path):
    local = os.path.join(CACHE, path.replace('/', os.sep))
    if not os.path.exists(local):
        os.makedirs(os.path.dirname(local), exist_ok=True)
        url = BASE + urllib.parse.quote(path)
        print(f'get   {path}')
        urllib.request.urlretrieve(url, local + '.part')
        os.replace(local + '.part', local)
    return local


def main():
    index = {}
    for voice, items in plan().items():
        os.makedirs(os.path.join(OUT, voice), exist_ok=True)
        index[voice] = {}
        for path, note in items:
            src = fetch(path)
            name = note.replace('#', 's') + '.mp3'
            dst = os.path.join(OUT, voice, name)
            subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '44100',
                            '-af', 'areverse,silenceremove=start_periods=1:start_threshold=-60dB,areverse',
                            '-b:a', '128k', dst], check=True)
            index[voice][note] = f'{voice}/{name}'
    with open(os.path.join(OUT, 'samples.json'), 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=1)
    print('wrote', OUT, {k: len(v) for k, v in index.items()})


if __name__ == '__main__':
    main()
