# Earth Jukebox

**Team Lucas** · NASA Space Apps Challenge 2026 · challenge *The Earth Information Jukebox*.

**Live site:** https://eluaden.github.io/earth-jukebox/

A jukebox that plays NASA Earth Information Center visualizations as sound. Pick a record, press
play, and **hear the data**: each variable becomes a sound layer synthesized live in the browser,
while the NASA video plays in step and a voice gives the context in English, Portuguese or
Spanish. It is built to be usable without sight.

Nothing is pre-recorded, and nothing is invented: every value you hear is read in your browser
from frames of NASA Scientific Visualization Studio videos.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/
```

Pushing to `main` deploys to GitHub Pages (`.github/workflows/deploy.yml`).

## Architecture

Vite + plain JavaScript, no framework and no back end. Sound uses the Web Audio API directly.

| Folder | Owns | Must not know about |
|---|---|---|
| `src/data/` | Loading tracks, reading values from the frames' pixels (`extract.js`), contract validation | sound |
| `src/audio/` | Real-time synthesis. Takes values 0..1 and plays them | images, the page |
| `src/narration/` | Speech (Web Speech API) and captions | — |
| `src/ui/` | Landing page, listen page, vinyl transition, full screen, globe | — |
| `src/i18n/` | Interface texts in en / pt / es | — |
| `public/tracks/<id>/` | `track.json`, the frames and the video of each track | — |

`public/earth.jpg` is NASA's Blue Marble Next Generation (December 2004), used as the texture of
the globe on the landing page. Without it the page falls back to a simple drawing.

### Adding a track

1. Create `public/tracks/<id>/` with `track.json`, the frames and (optionally) `video.mp4`.
2. Add the id to `public/tracks/index.json`.

The sleeves on the landing page and the record list on the listen page are built from that list.

## Track contract (`track.json`)

Defined and validated in [`src/data/contract.js`](src/data/contract.js).

```jsonc
{
  "id": "dixie-fire-2021",
  "code": "A2",                             // jukebox key
  "short": "DIXIE FIRE",                    // text on the sleeve
  "cover": ["#FFE1B8", "#F0703A", "#5A1408"], // sleeve colours
  "period": "Jul–Sep 2021",
  "meta": { "en": "...", "pt": "...", "es": "..." },     // dataset and dates, on the sleeve
  "summary": { "en": "Burned area → pitch and volume · ..." }, // mapping, on the sleeve
  "title": { "en": "...", "pt": "...", "es": "..." },
  "source": "NASA visualization name and URL",
  "secondsPerFrame": 0.5,                   // one step of sound
  "clockEvery": 1,                          // tick every N steps (optional)
  "frames": ["frame_001.jpg"],              // the stills the values are read from
  "labels": ["Jul 16"],                     // one per frame
  "video": { "file": "video.mp4", "times": [0.25] }, // video time of each frame (optional)
  "extraction": { "type": "cursor" },       // how values are read from the frames (see below)
  "mapping": {
    "area": {
      "layer": "drone",                     // drone = tone | texture = wind | pulse = pitch of the tick
      "tube": "AREA",                       // label on the jukebox tube
      "name": { "en": "Burned area" },
      "meaning": { "en": "higher, louder tone = more land burned" },
      "physicalRange": { "min": "0 km²", "max": "3900 km²" },
      "params": { "underwater": false }     // optional timbre
    }
  },
  "events": [ { "frame": 16, "type": "milestone", "say": { "en": "August" } } ], // or "record"
  "narration": { "intro": { "en": "..." }, "outro": { "en": "..." } }
}
```

`series` (values 0..1) and `values` (physical units) are filled in the browser by
`src/data/extract.js` from the frames; a track may also ship a ready `series`.

## Sound mapping (same rules for every track)

| Layer | Sound | Driven by |
|---|---|---|
| **Tone** (`drone`) | Sawtooth + sub octave through a low-pass filter | Value → pitch on a log scale, `f = 98 Hz × 4^v` (98–392 Hz, two octaves), and loudness. |
| **Wind** (`texture`) | Band-passed white noise | Value → loudness (`0.02 + 0.5 v²`) and brightness (300–1200 Hz). Silent in tracks with no second series. |
| **Tick** (`pulse`) | Short sine blip, once per step (or every `clockEvery` steps) | Time. A stronger tick on `milestone` events. If a series is mapped to it, its value sets the pitch (`1000 Hz × 3^v`). |
| **Bell** | Three decaying partials (880 Hz × 1, 2.76, 5.4) | Rung on `record` events. |

The sea level track uses an "underwater" timbre (lower filter with a slow sweep); pitch and
loudness follow the data in the same way.

**Scientific honesty:** sound is driven by the **data value** read from the frame (colour legend,
ruler, chart or coverage, described per track below), not by raw brightness. The current values,
with units, are shown under the player and in the slider's `aria-valuetext`.

## Narration

- English (en-US), Portuguese (pt-BR), Spanish (es-ES), chosen with the EN / PT / ES buttons.
- Order: intro → the track, with milestones and records spoken over lowered music → outro.
- Voice: the browser's speech synthesis (Web Speech API).
- Every spoken line is also shown as a caption on the video and written to the live region.
  *Spoken narration* and *Captions* can each be switched off.

## Tracks

| id | NASA source | Mapping |
|---|---|---|
| `sea-level-porthole` | **Real NASA frames.** [SVS 5235](https://svs.gsfc.nasa.gov/5235/), Sea Level Through a Porthole, 1993–2023, 91 frames (three per year) | Global sea level (cm above 1993) → tone. Strong tick every ten years, bell on the highest point |
| `dixie-fire-2021` | **Real NASA frames.** [SVS 4993](https://svs.gsfc.nasa.gov/4993/), Spread of the Dixie Fire, 16 Jul – 11 Sep 2021, one frame per day | Total burned area (km²) → tone, growth since the previous day → wind. Strong tick on the 1st of each month, bell on the fastest day |
| `active-fires-viirs` | **Real NASA frames.** [SVS 5113](https://svs.gsfc.nasa.gov/5113/), Active Fires As Observed by VIIRS, 13 Nov 2024 – 13 Nov 2026, one frame every 5 days | Share of each region's map covered by fire detections (%): Africa north of the equator → tone, Africa south of the equator → wind, South and Southeast Asia → pitch of the tick. Strong tick on each new year, bell at each African peak |
| `tempo-no2-great-lakes` | **Real NASA frames.** [SVS 5175](https://svs.gsfc.nasa.gov/5175/), TEMPO nitrogen dioxide, Chicago/Toronto view, 31 Aug 2023, 12 scans | Chicago area → tone, Detroit area → wind, Toronto area → pitch of the tick. Bell on Chicago's highest scan |

### How `tempo-no2-great-lakes` is read from the frames

Done in the browser when the page loads, by [`src/data/extract.js`](src/data/extract.js), from the
`extraction` block of the track's `track.json`:

1. **Frames:** NASA's 1080p MP4 of the Chicago/Toronto view holds each TEMPO scan for a while and
   cross-fades to the next. We keep one frame per scan (12 scans), scaled to 960×540. Labels are the
   clock printed on each frame (08:17 to 17:36 EDT).
2. **Color legend:** the color bar printed on the frame is linear (ticks measured at 25, 50 and 125),
   from 0 to 150 ×10¹⁴ molecules/cm². Its colors are sampled every 5 units and stored as `colormap.stops`.
3. **Pixel → value:** each pixel takes the value of the nearest legend color. Pixels far from every
   legend color (city labels, grey no-data areas) and pixels that are dark in almost every frame
   (roads and borders drawn on the map) are ignored. 73–86% of each region's pixels are used.
4. **Series:** the mean value inside a rectangle around each city label, mapped to 0..1 with the
   **same fixed range for all three cities: 5 to 40 ×10¹⁴ molecules/cm²**, so they can be compared by ear.

Limits, stated plainly: values come from compressed video frames, not from the TEMPO data files
(expect about ±1 unit); the legend saturates at 150; the rectangles are our choice, not official
city limits; and it is a single day, so it says nothing about long-term trends.

### How `sea-level-porthole` is read from the frames

This visualization has no color legend: it draws a blue marker that rises along a **ruler printed on
the frame**. The extractor (`"type": "marker"`) finds the top of the marker in each frame and measures
how far it sits above its 1993 position, using the ruler's scale (10 cm = 68.6 px). At this frame size
the reading is within 0.15 cm of the full-resolution video. We keep three frames per year, so the
seasonal wobble the animation shows is audible too. The year labels follow the label printed on the frame.

### How `dixie-fire-2021` is read from the frames

The frame carries its own chart: an "Area" plot with a km² axis and an orange cursor whose top is
the area burned so far. The extractor (`"type": "cursor"`) finds the top of that cursor in each
day's frame and converts it with the axis printed on the chart (300 km² per tick). The second
series, growth, is the difference between one day's reading and the previous day's. Reading
precision is about 10 km² (one pixel). The animation's chart stops moving after September 12, so the track ends there.

### How `active-fires-viirs` is read from the frames

The map draws fire detections as bright dots on a black and dark blue base map. The extractor
(`"type": "coverage"`) counts, inside each region box, the share of pixels drawn in fire colours.
That share is what you hear: how much of the region's map is covered by detections in that
5-day window. It is **not** a count of fires and **not** fire radiative power: at 960×480 the
dots blend with the background, so their colour cannot be read against the 0–8 MW colour bar,
and we do not pretend it can. Against the same measure on 2048×1024 frames the three regions
correlate at 0.996 or better (the small frames read about 25% higher because the dots blur).

### Video

Each real track also ships the NASA video the frames came from (`video.mp4`, re-encoded smaller).
The player shows the video in step with the sound; the still frames are what the values are read from.

## Accessibility

- Everything works from the keyboard. Space or K plays and pauses, arrow keys on the slider move one step, Escape leaves full screen. A "Skip to content" link comes first.
- Buttons are labelled; the slider has `aria-valuetext` with the date and the real data values; an `aria-live` region announces narration, loading and pauses.
- Audio starts only after a click or key press.
- `prefers-reduced-motion` turns off the vinyl transition, the turning globe and other animation.
- Each sound layer also has its own colour and shape (solid, striped, dotted), so nothing depends on colour alone.

## Data sources and credits

- NASA Scientific Visualization Studio: [SVS 5235](https://svs.gsfc.nasa.gov/5235/), [SVS 4993](https://svs.gsfc.nasa.gov/4993/), [SVS 5113](https://svs.gsfc.nasa.gov/5113/), [SVS 5175](https://svs.gsfc.nasa.gov/5175/), all from the [Earth Information Center gallery](https://svs.gsfc.nasa.gov/gallery/earth-information-center/).
- NASA Blue Marble Next Generation (globe texture).
- Fonts: Space Grotesk and Atkinson Hyperlegible (Google Fonts).

## Placeholders still open

On the landing page, the listening-test result (`[X/5]`) and the tester's quote are placeholders
in square brackets until the test is done.
