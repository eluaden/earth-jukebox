# Earth Jukebox

NASA Space Apps Challenge 2026 — *The Earth Information Jukebox*.

Pick a "track" (a NASA Earth Information Center visualization, as a sequence of frames),
press play, and **hear the data**. Each variable becomes a sound layer synthesized live in
the browser, with spoken narration for context. Built to be fully usable without sight.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # static site in dist/ (GitHub Pages or Vercel)
```

## Architecture

| Folder | Owns | Must not know about |
|---|---|---|
| `src/data/` | Loading tracks, (soon) pixel → value extraction with the track's color legend, contract validation | sound |
| `src/audio/` | Real-time synthesis (Tone.js). Takes 0..1 series, plays them | images |
| `src/narration/` | Speech (Web Speech API) for intro, audio legend, events, outro | — |
| `src/ui/` | Jukebox: track list, player, controls, accessibility | — |
| `public/tracks/<id>/` | `track.json` + frames for each track | — |

## Track contract (`track.json`)

The boundary between `data` and `audio`. Defined and validated in
[`src/data/contract.js`](src/data/contract.js). **Required fields don't change without telling the team.**

```jsonc
{
  "id": "arctic-sea-ice",
  "title": { "en": "...", "pt": "...", "es": "..." },
  "source": "NASA dataset name and URL",
  "secondsPerFrame": 0.5,
  "frames": ["frame_000.png"],            // may be [] for synthetic tracks
  "labels": ["1979"],                     // one per frame
  "series": { "ice": [0.82] },            // normalized 0..1, one per frame; null = no data
  "mapping": {
    "ice": {
      "layer": "drone",                   // drone | texture | pulse (each at most once)
      "meaning": { "en": "lower pitch = less ice" },
      "legend": { "min": { "en": "This is the least ice." }, "max": { "en": "This is the most ice." } },
      "loudWhen": "high",                 // texture only: high | low
      "physicalRange": { "min": "...", "max": "..." }  // optional, real units for 0 and 1
    }
  },
  "events": [ { "frame": 33, "type": "record", "say": { "en": "2012, record low" } } ],
  "narration": { "intro": { "en": "..." }, "outro": { "en": "..." } },
  "placeholder": false,                   // true = synthetic / not real data (shown in the UI)
  "clock": true                           // pulse ticks once per frame (default true)
}
```

## Sound mapping (same rules for every track)

| Layer | Sound | Driven by |
|---|---|---|
| **drone** | Warm continuous tone | Value → pitch on a log scale, `f = 110 Hz × 4^v` (110–440 Hz, two octaves), and loudness (quieter when low, never silent). Glides smoothly between frames. |
| **texture** | Filtered pink noise ("wind") | Intensity = value (or 1 − value with `loudWhen: "low"`) → loudness and brightness (cutoff 300–3000 Hz). |
| **pulse** | Soft tick, once per frame | Time. Strong (louder, octave up) tick on `milestone` events. If a series is mapped to `pulse`, its value sets the tick pitch (160–640 Hz, log). |
| **bell** | FM bell | Rung on `record` events. |

**Audio legend:** before a track (and any time with the *Hear lowest / Hear highest* buttons), each
layer is played alone at value 0 and value 1 so listeners learn the scale.

**Scientific honesty:** sound is driven by the **data value**, recovered from each pixel through the
track's color legend, not by raw brightness. Anything not taken from the frames or a NASA source is
marked as a placeholder.

## Narration

- Languages: English (en-US), Portuguese (pt-BR), Spanish (es-ES), chosen with the *Narration language* selector.
- Order: title → intro → **audio legend** (each layer alone at its minimum, then its maximum) → the track,
  with events spoken over lowered music → outro. *Skip introduction* jumps straight to the track.
- Voice: the browser's speech synthesis by default. A track may ship recorded MP3s, used instead when present:
  `narration.audio.intro.pt`, `narration.audio.outro.pt`, `mapping.<series>.legend.audio.min.pt` / `.max.pt`,
  `events[].audio.pt` (file paths relative to the track folder).
- Every spoken line is also shown as a caption. With *Spoken narration* off, lines go to the screen-reader
  live region instead, so nothing is ever said twice.

## Tracks

| id | Status | Mapping |
|---|---|---|
| `sea-level-porthole` | **Real NASA frames.** [SVS 5235](https://svs.gsfc.nasa.gov/5235/), Sea Level Through a Porthole, 1993–2023, 91 frames (three per year) | Global sea level (cm above 1993) → drone. Strong tick every ten years, bell on the highest point |
| `dixie-fire-2021` | **Real NASA frames.** [SVS 4993](https://svs.gsfc.nasa.gov/4993/), Spread of the Dixie Fire, 16 Jul – 11 Sep 2021, one frame per day | Total burned area (km²) → drone, growth since the previous day → texture. Strong tick on the 1st of each month, bell on the fastest day |
| `tempo-no2-great-lakes` | **Real NASA frames.** [SVS 5175](https://svs.gsfc.nasa.gov/5175/), TEMPO nitrogen dioxide, Chicago/Toronto view, 31 Aug 2023, 12 scans | Chicago area → drone, Detroit area → texture, Toronto area → pulse pitch. Bell on Chicago's highest scan |
| `demo-synthetic` | **PLACEHOLDER — synthetic numbers** generated by `scripts/make-demo-track.mjs` (seed 42), for testing the engine only | `level` → drone, `stress` → texture (louder when high) |

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

### Video

Each real track also ships the NASA video the frames came from (`video.mp4`, re-encoded smaller).
The player shows the video in step with the sound; the still frames are what the values are read from.

## Accessibility

- Everything works from the keyboard. Space or K plays and pauses, Escape stops. Arrow keys on the position slider move one frame.
- Labelled buttons, slider with `aria-valuetext` (label, frame and the real data values), and a `role="status"` live region that announces what is playing.
- Audio starts only after a click or key press.
