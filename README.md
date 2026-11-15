# Earth Jukebox

**Team Lucas** · NASA Space Apps Challenge 2026 · challenge *The Earth Information Jukebox*.

**Live site:** https://eluaden.github.io/earth-jukebox/ (updated with `npm run deploy`)

**The Earth is the record.** A 3D globe turns like a vinyl record, wearing a NASA map video as its
skin. A fixed chrome needle rests on the meridian facing you and plays the column of data passing
under it: every note is a value read from the NASA frame with NASA's own colour bar. Nothing is
made up, and the music is not AI-generated: it is synthesized live in the browser from the data,
with fixed, documented rules.

Current state ([`docs/direcionamento.md`](docs/direcionamento.md)): three records on the shelf, changed
from **Records**:

| Record | NASA source | Period | Globe skin |
|---|---|---|---|
| Sea surface temperature | SVS 3912, ECCO2 model | March 2007 – March 2008 | Video |
| Lightning | SVS 5011, LIS on the ISS | March 2017 – August 2023 | Video |
| Night lights | SVS 5313, Black Marble (VIIRS) | 2012 – 2023 | 12 yearly images, faded at each new year |

Changing record: the needle lifts, the globe dims while the new record loads, its map crossfades in
(1.2 s), the needle drops and the new record starts from its first step with its own narration.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (Vitest)
npm run build      # static site in dist/
npm run deploy     # build and publish dist/ to the gh-pages branch (GitHub Pages)
```

`?flat=1` forces the 2D version (shown automatically when WebGL is not available).

## Data pipeline (reproducible)

The browser never reads colours. A script reads NASA's original frames once and writes a grid of
values that the app looks up under the needle.

```bash
npm run fetch-sources -- sea-surface-temperature sst-legend sst-dates lightning-flat lightning-labels night-lights
npm run test:pipeline        # reader tests (SST, lightning, night lights, covers)
npm run pipeline:sst         # writes public/tracks/sst/
npm run pipeline:lightning   # writes public/tracks/lightning/ (one step every 10 days, NASA's labels.txt dates)
npm run pipeline:nightlights # writes public/tracks/night-lights/ (12 yearly stills + light grid)
npm run pipeline:samples     # instrument samples into public/samples/
npm run pipeline:covers      # Records covers from the grids already written (each pipeline also runs it)
```

**Records covers** ([`scripts/pipeline/cover.py`](scripts/pipeline/cover.py)) are drawn from each
track's own grid, as a record seen from above: angle = longitude (in the order the needle reads it),
three bands = north / tropics / south (the zones the voices play), and inside each band one spiral
groove turn per time step, first step outside. Colour = the zone's mean in the track's palette (NASA's
colour bar for SST). `public/tracks/index.json` (the Records order) is edited by hand; no pipeline
writes it.

[`scripts/pipeline/sst.py`](scripts/pipeline/sst.py) (Python 3, numpy, Pillow, ffmpeg):

1. **Legend:** NASA's colour bar `sst_ecco2_cbar.png` (0–32 °C, linear) becomes a hue → temperature
   table. Hue falls steadily along the bar, so dimmed flow lines keep their temperature.
2. **Pixels:** a pixel is data when it is saturated and bright enough and its hue is on the bar
   (land is grey, the gaps between flow lines are black). It reads back the bar's own values with an
   error below 0.3 °C; above ~31 °C the bar is a single red, so 31.1–31.9 °C reads as ~31.5 °C.
3. **Grid:** one frame in six (334 steps, about one per day of the model), averaged into 2° × 2°
   cells; cells empty in more than 80% of the steps are land; other gaps keep the last reading.
4. **Output:** `grid.bin` (`uint8[step][lat][lon]`, 255 = no data), `track.json` (exact date of each
   step from NASA's `flat_ecco2_dates.txt`, legend, data-derived narration markers), and the web
   videos (1536×768 for computers, 1024×512 for phones).

## How the data becomes music

Each record has its own rules (`src/music/tracks/`), shown in its liner notes. Sea surface temperature:

| Data | Sound |
|---|---|
| Temperature, 0–32 °C | Pitch on one 16-note C major pentatonic (warmer = higher, same scale for every voice); warmer is also brighter and louder |
| Northern waters, 23.5–80° N (two bands) | Strings (VSCO 2 CE cello and violin sections), held notes |
| Tropics, 23.5° S – 23.5° N (two bands) | Piano, the two bands in turn on every eighth note |
| Southern waters, 23.5–80° S (two bands) | Glockenspiel, on quarter notes |
| Land, sea ice, no data | Silence for that band |
| Time | The NASA video plays at normal speed (66.7 s per year); the globe turns once every 10 s |

Lightning:

| Data | Sound |
|---|---|
| Lightning under the needle in NASA's 10-day window, ten latitude bands from 55° N to 55° S | Marimba: one hit per band with lightning; north is higher; more lightning, stronger hit |
| North of 23.5° N · tropics · south of 23.5° S | Three marimba voices, each playing its bands as an arpeggio |
| No lightning; beyond 55° (the sensor does not see there) | Silence |

Night lights:

| Data | Sound |
|---|---|
| Light under the needle, six latitude bands from 70° N to 45° S | Piano: more light, more notes; north is higher |
| A band with at least 10% less light than the year before | Low strings: a falling minor third |
| A band with at least 10% more light than the year before | Glockenspiel: a rising major third |
| Sea | Silence |
| Time | One year per turn of the globe (10 s) |

At most 3 voices, 2 notes per voice and 6 in total (tested). A very quiet vinyl crackle that is not
data plays underneath and is declared in the liner notes. Music ducks while the narrator speaks.

## Code map

| Folder | Owns |
|---|---|
| `scripts/pipeline/` | NASA frames → grid, web videos, samples (Python) |
| `src/data/` | Grid lookup, longitude under the needle, latitude zones (pure, tested) |
| `src/music/` | Temperature → notes and caps (pure, tested); Tone.js engine |
| `src/state/` | UI state (zustand), per-frame values, data clock, controller, how each record is shown (`tracks.js`) |
| `src/media/` | The globe's skin per record: NASA video, or yearly images with their own clock |
| `src/scene/` | React Three Fiber: globe, atmosphere, needle, platter, opening |
| `src/flat/` | 2D version |
| `src/ui/` | Interface (closed list of the direction §5.2.1), panels, keyboard |
| `src/narration/` | Narration: voice files when present, browser speech as fallback |
| `src/i18n/` | Interface and track texts, EN / PT / ES |

Recorded narration (ElevenLabs, see [`docs/prompts-assets.md`](docs/prompts-assets.md) §2.5) lives in
`public/narration/<en|pt|es>/<key>.mp3`, listed in `public/narration/manifest.json` under `lines`. The key
is `lineKey(lang, text)` ([`src/narration/key.js`](src/narration/key.js)), a hash of the exact text: a line
whose text changes falls back to the browser's speech synthesis until it is recorded again. Captions
show one short line at a time, in step with the voice. Every line of the three records and the opening
("Put on headphones." and "Welcome…", first visit only) is recorded in EN / PT / ES; a test checks that
each one has its file.

## Accessibility

- Keyboard: Space play/pause, ←/→ move through time, V reads the date and current values aloud,
  R records (change the record), L liner notes, Esc closes. Visible focus everywhere.
- Records without a NASA colour bar (lightning, night lights) have a "Legend in sound" in the liner notes,
  played from the record's own mapping. A value the map does not have shows "—", with the reason in the
  accessible text.
- Screen readers: the scene is described in text; narration and requested values go to a polite
  live region; a hidden time slider gives the date as its value.
- Audio starts only after a click or key press. Turntable and UI sound effects (ElevenLabs S1–S7 in
  `public/sfx/`) play on needle drop/lift, platter start, record change, opening whoosh and button
  taps. `prefers-reduced-motion` skips the camera descent and stops the rings;
  `prefers-reduced-transparency` turns the glass solid.

## Credits

- Data and visualization: NASA Scientific Visualization Studio, [SVS 3912](https://svs.gsfc.nasa.gov/3912/) (ECCO2, MIT/JPL),
  [SVS 5011](https://svs.gsfc.nasa.gov/5011/) (LIS on the ISS) and [SVS 5313](https://svs.gsfc.nasa.gov/5313/) (Black Marble, NASA/NOAA).
- Instrument samples: [VSCO 2 Community Edition](https://github.com/sgossner/VSCO-2-CE), Versilian Studios (CC0).
- Fonts: Instrument Serif, Geist Mono, Atkinson Hyperlegible (SIL Open Font License).
- Libraries: React, three.js, React Three Fiber, drei, postprocessing, GSAP, Tone.js, zustand, Vite, Vitest.
- Code written with AI coding assistants (Anthropic Claude) under the team's direction and review.
  No data, values, music or scientific claims are AI-generated. Full disclosure and references:
  [`docs/si-e-referencias.md`](docs/si-e-referencias.md).

## Planning docs

Development is 100% AI-driven: existing code and decisions are not the source of truth. Read
[`AGENTS.md`](AGENTS.md) first. [`docs/direcionamento.md`](docs/direcionamento.md) holds the current
direction and must be updated before any change. [`STATUS.md`](STATUS.md) tracks what is done, item by
item, and who owns what. Design of this slice:
[`docs/superpowers/specs/2026-11-15-fatia-sst-design.md`](docs/superpowers/specs/2026-11-15-fatia-sst-design.md).

## Still open

The user test result and the team names are shown as `[a definir]` in About until they exist.
The sound must be approved by ear by a team member with musical training (direction §6.1).
