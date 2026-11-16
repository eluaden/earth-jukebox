# Earth Jukebox — Project submission page (ready to paste)

> One section per field of the Space Apps project form, in English (required on the page and in every linked material).
> Every claim here exists in the live site today. Do **not** add features that are not live (Explore, Compare, spatial audio,
> vibration, album export, Audio-first) and do **not** add a user-test result unless it really happened ([`direcionamento.md`](direcionamento.md) §9).
> Before pasting, check the three `[TODO]` marks.

---

## Project Name

Earth Jukebox

## High-Level Project Summary

Earth Jukebox turns NASA Earth Information Center visualizations into music you can play like a record. A 3D globe turns like
vinyl, wearing a real NASA map video as its skin, and a fixed chrome needle plays the column of data passing under it: latitude by
latitude, every note comes from a value read from the NASA frame with NASA's own colour bar, ruler or map key. Five records
(sea surface temperature, lightning seen from the ISS, night lights, aerosols and sea level) let anyone choose a visualization and
hear its soundscape, generated live in the browser. It answers the challenge directly: EIC frames paired with real-time
sonification, built so that blind and low-vision people, who are left out of a wall of screens, can hear how and where our planet
is changing. It combines technical and creative skills: a reproducible data pipeline and honest mappings on one side, real
instruments, musical scales and a narrator in English, Portuguese and Spanish on the other.

## Link to Project Demo

[TODO: public link to the 30-second video (English subtitles burned in) or to a deck of at most 7 slides. Test it in a private window.]

## Link to Final Project

https://eluaden.github.io/earth-jukebox/

(Source code and reproducible pipeline: https://github.com/eluaden/earth-jukebox)

## Detailed Project Description

**What it does.** Open the link, choose a language, put on headphones, and the Earth becomes the record. A NASA map video is wrapped
around a 3D globe that turns under a fixed needle. The needle reads the column of the map under it, from north to south, and plays
it: each latitude zone is an instrument, each value is a note. As the globe turns and NASA's video moves forward in time, you hear
the oceans warm with the seasons, lightning follow the sun from one hemisphere to the other, cities light up year after year, smoke,
dust and sea salt cross the planet, and the sea rise centimetre by centimetre.

**The five records** (all from the challenge's Resources tab and NASA's Earth Information Center):

| Record | NASA source | What you hear |
|---|---|---|
| Sea surface temperature, 2007–2008 | SVS 3912, ECCO2 model (MIT/JPL) | Warmer water, higher and brighter note. Northern waters = strings, tropics = piano, southern waters = glockenspiel |
| Lightning, 2017–2023 | SVS 5011, Lightning Imaging Sensor on the ISS | A marimba hit per latitude band with lightning; north is higher, more lightning hits harder |
| Night lights, 2012–2023 | SVS 5313, Black Marble (NASA/NOAA, VIIRS) | More light, more piano notes; lights going out = falling strings; new lights = rising bells |
| Aerosols, 19 August 2025 | SVS 5669, GEOS-FP model (NASA GMAO) | Smoke = low strings, dust = marimba, sea salt = glockenspiel, each as strong as its colour on NASA's map |
| Sea level, 1993–2023 (bonus) | SVS 5235, ocean altimeters (TOPEX/Poseidon, Jason-1/2/3, Sentinel-6 MF) | One string note that climbs a step for every centimetre of global mean sea level, and a bell for each new centimetre |

**How it works.**
1. *Reading the data (offline, reproducible).* A Python script per record reads NASA's original frames and turns colours into values
   with NASA's own legend: the 0–32 °C colour bar for sea temperature, the yellow lightning dots, the brightness lights add above
   NASA's own lights-off frame, the colour key of each aerosol type, and the blue bar on the ruler printed in the sea level video.
   Dates come from NASA's own files (for example the date of every lightning frame from NASA's `labels.txt`). The result is a grid of
   values on 2° cells per time step. Anyone can re-run it (`npm run pipeline:*`, with tests).
2. *Playing the data (live, in the browser).* The app shows the same NASA imagery on the globe, finds the longitude under the needle
   and the time step on screen, looks up the column of values and turns it into notes with fixed, documented rules: musical scales
   (mostly C major pentatonic), at most 3 voices per record, at most 2 notes per voice and 6 in total, arpeggios instead of clusters. The
   instruments are real recorded samples (VSCO 2 Community Edition), synthesized live with Tone.js. Nothing is pre-rendered and no
   music is AI-generated.
3. *Explaining the data.* A narrator introduces each record, speaks at data-driven milestones (for example the warmest week of the
   northern oceans) and closes it, in English, Portuguese or Spanish, with captions. "What am I hearing?" opens the liner notes: what
   you hear, a "data → sound" table, what to listen for, NASA's legend with a "Hear the legend" button that plays the scale from
   minimum to maximum, the limits of each reading stated plainly, and the NASA source. A trend chart shows the whole series with a
   marker on the period playing.

**Accessibility (a core theme of the challenge).**
- Works without seeing the screen: narration and captions, values read aloud on demand (V), every value with its unit in the
  accessible text, and the reason when there is no value (land, no data, sensor does not see there).
- Full keyboard control: Space play/pause, ← → move in time, ↑ ↓ turn the globe, V values, R change record, L liner notes, Home
  replay with narration, Esc close. Visible focus everywhere.
- Screen readers: the scene is described in text, narration goes to a live region, a hidden time slider gives the date.
- "Hear the legend" calibrates the ear before listening, for records with and without a colour bar.
- Respects reduced motion and reduced transparency; a 2D version opens automatically when 3D (WebGL) is not available.
- Sound starts only after the listener chooses a language.

**Benefits and what we hope to achieve.** About 43 million people in the world are blind (Vision Loss Expert Group, *The Lancet Global
Health*, 2021), and the Earth Information Center is a wall of screens. Earth Jukebox is a sound layer for that wall: the same NASA
visualizations, heard instead of seen, in three languages, with honest mappings that never invent a value. Because the pipeline is
open and reproducible, new NASA visualizations can become new records. We hope it gives blind and low-vision people, and anyone who
closes their eyes, a way into NASA Earth science, and an emotional connection with a planet whose oceans, skies and cities you can
hear changing.

**Creative choices, and why.** The jukebox is taken literally: the planet is the record and the needle reads it, a scan like the
radar sweep of NASA's own Caldwell 73 sonification (one of the challenge resources), turned into a turntable. Each Records
cover is a "data vinyl" drawn from the record's own data (angle = longitude, groove = time, colour = value), not a decorative image.
We chose clarity over richness (3 voices, scales, arpeggios), because a direct pixel-to-sound translation is noise, and we chose
real instruments because the music has to be beautiful for people to keep listening.

**Tools.** JavaScript, React, Vite, three.js with React Three Fiber, drei and postprocessing, GSAP, Tone.js, zustand, Web Audio API,
Web Speech API (fallback voice); Python, numpy, Pillow and ffmpeg for the data pipeline; Vitest; GitHub Pages; ElevenLabs for the
narration voice and sound effects. [TODO: if the demo uses Google Veo shots, keep Veo in the SI section and References.]

## Use of Super Intelligence (SI)

Paste [`si-e-referencias.md`](si-e-referencias.md) §1 (not seen by judges, but must match what the project shows).

## NASA Data

All data comes from NASA Scientific Visualization Studio visualizations listed in the challenge's Resources tab or in NASA's Earth
Information Center gallery. We download NASA's own files and read real values from them; no value is made up.

- **SVS 3912, Global Sea Surface Currents and Temperature** (ECCO2 model, MIT/JPL): `ecco2_sst_flow.mp4` as the globe skin; temperature
  from the flow-line colours with NASA's colour bar `sst_ecco2_cbar.png` (0–32 °C); exact dates from `flat_ecco2_dates.txt`.
- **SVS 5011, Lightning Events Detected from the ISS 2017–2023** (Lightning Imaging Sensor): the flat Science On a Sphere video as the
  skin; share of each 2° cell covered by lightning dots in NASA's 10-day window; frame dates from NASA's `labels.txt`.
- **SVS 5313, Change in Night Lights 2012–2023, EIC version** (Black Marble, NASA/NOAA, VIIRS on Suomi NPP): 12 yearly images from the
  EIC video; light = brightness above NASA's own lights-off frame.
- **SVS 5669, GEOS Aerosols (2025)** (GEOS-FP 2 km replay, NASA GMAO): the 19 August 2025 20:00 UTC image as the skin; strength of each
  type from NASA's colour key `Aerosols_cbar.png` (smoke, dust and sea salt played; sulfate shown but not played).
- **SVS 5235, Sea Level Through a Porthole 1993–2023** (NASA GSFC global mean sea level from TOPEX/Poseidon, Jason-1/2/3 and
  Sentinel-6 Michael Freilich): NASA's video in a porthole; sea level read from the blue bar on the ruler printed in the frame.
- **SVS 13786, Data Sonification: Caldwell 73**: method reference for the latitude-to-pitch scan.

## Space Agency Partner Data and Other References

Space Agency Partner data: none used.

[TODO: paste the table of [`si-e-referencias.md`](si-e-referencias.md) §4 as a list: NASA data, VSCO 2 CE samples (CC0), fonts
(SIL OFL), libraries (MIT / GSAP license), Python tools, browser APIs, GitHub Pages, SI tools (Anthropic Claude, ElevenLabs, and
Google Veo if used), the Lancet Global Health source of the 43 million figure, and past Space Apps projects (research only).]
