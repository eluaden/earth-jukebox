# Earth Jukebox — Project submission page (ready to paste)

> One section per field of the Space Apps project form, in English (required on the page and in every linked material).
> Every claim here exists in the live site today. Do **not** add features that are not live (Explore, Compare, spatial audio,
> vibration, album export, Audio-first). The user-test numbers are the real ones from 15/11/2026 ([`teste-usuarios.md`](teste-usuarios.md)).

---

## Project Name

Earth Jukebox

## High-Level Project Summary

Earth Jukebox turns NASA's Earth Information Center visualizations into music you can play like a record, so that blind and
low-vision people, and anyone who closes their eyes, can hear our planet change. A 3D globe turns like vinyl, wearing a real NASA
visualization as its skin, while a fixed chrome needle plays the strip of map passing under it, latitude by latitude. Every note
comes from a value read from the NASA frame with NASA's own colour bar, ruler or map key: nothing is invented, and no music is
AI-generated. It is played live in the browser with real instruments and musical rules. Five records (sea surface temperature,
lightning seen from the ISS, night lights, aerosols and sea level) are narrated in English, Portuguese and Spanish, with liner
notes that explain every mapping and its limits. In a test at the hackathon, with music only and no narration, 5 of 5 listeners
who could not see the screen, two of them people with visual impairments, heard the sea rising. Earth Jukebox combines technical
and creative skills to make NASA data accessible to the people a wall of screens leaves out.

## Link to Project Demo

[TODO: public link to the 30-second video (English subtitles burned in) or to a deck of at most 7 slides. Test it in a private window.]

## Link to Final Project

https://eluaden.github.io/earth-jukebox/

## Detailed Project Description

### The problem
NASA's Earth Information Center tells the story of our changing planet on a wall of screens. About 43 million people in the world
are blind (Vision Loss Expert Group, *The Lancet Global Health*, 2021), and many more have low vision: for them, that story is
silent. The challenge asked us to translate sight into sound. We wanted a translation accurate enough to trust and beautiful
enough to keep listening to.

### What it does
Open the site, choose a language (English, Portuguese or Spanish) and put on headphones. The camera descends to the Earth, the
needle drops and the music starts. The globe turns like a record wearing a NASA visualization, and as NASA's video moves forward in
time, the music changes with it: you hear the northern oceans warm toward September, lightning follow the sun between the
hemispheres, cities brighten year after year, and the sea climb centimetre by centimetre.

- **Change record** swaps the visualization and its soundscape.
- **Drag the globe or the time ring** to travel in time and hear what passes under the needle.
- **Mute or solo** any voice, or pick another instrument for it.
- **What am I hearing?** opens the liner notes of the record.

### The five records
All five come from the challenge's Resources tab and NASA's Earth Information Center.

- **Sea surface temperature, March 2007 – March 2008** (NASA SVS 3912, ECCO2 model, MIT/JPL): warmer water, higher and brighter
  note. Northern waters on strings, tropics on piano, southern waters on glockenspiel.
- **Lightning, 2017–2023** (SVS 5011, Lightning Imaging Sensor on the ISS): a marimba hit for each latitude band with lightning;
  north is higher, more lightning hits harder.
- **Night lights, 2012–2023** (SVS 5313, Black Marble, NASA/NOAA): more light, more piano notes; lights going out are falling
  strings, new lights are rising bells.
- **Aerosols, 19 August 2025** (SVS 5669, GEOS-FP model, NASA GMAO): smoke on low strings, dust on marimba, sea salt on
  glockenspiel. You hear Saharan dust over the Atlantic, smoke over central Africa and sea salt in the Southern Ocean.
- **Sea level, 1993–2023** (SVS 5235; TOPEX/Poseidon, Jason-1/2/3 and Sentinel-6 Michael Freilich altimeters): one string note that
  climbs a step for every centimetre of global mean sea level (+11.5 cm at the peak, October 2023), and a bell for each new
  centimetre.

### How it works
1. **Reading NASA's frames (open and reproducible).** For each record, a Python pipeline reads NASA's original files and turns
   pixels into values with NASA's own legend: the 0–32 °C colour bar (it reads the bar's own values back within 0.3 °C), the yellow
   lightning dots, the light added above NASA's own lights-off frame, the colour key of each aerosol type, and the blue bar on the
   ruler printed in the sea level video (1 pixel ≈ 0.5 mm). Dates come from NASA's own files, such as the date of every lightning
   frame in NASA's `labels.txt`, where we found and corrected a "2003" typo for 2023. The output is a grid of values per 2° cell and
   time step, checked by automated tests. Anyone can re-run it, or add a new NASA map.
2. **Playing it live.** The browser shows NASA's imagery on the globe, finds the longitude under the needle and the time step on
   screen, and turns that column of values into notes with fixed, documented rules: musical scales (mostly C major pentatonic), at
   most three voices per record, two notes per voice and six in total, and arpeggios instead of clusters, because a direct
   pixel-to-sound translation is noise. The instruments are real recordings (VSCO 2 Community Edition), played in real time with
   Tone.js. A flash of light marks each note on the needle's line, in the colour of NASA's legend.
3. **Explaining it.** A narrator introduces each record, speaks at moments found in the data (for example the week the northern
   oceans are warmest) and closes it, with captions, while the music ducks under the voice. The liner notes give what you hear in
   one sentence, a "data → sound" table, what to listen for, NASA's legend with **Hear the legend** (it plays the scale from
   minimum to maximum, to calibrate the ear before listening), the limits of the reading, and the NASA source. A trend chart shows
   the record's whole series, with a marker on the moment playing. Each cover in Records is a "data vinyl" drawn from the record's
   own data (angle = longitude, groove = time, colour = value), not a decorative image.

### Accessibility, the core of the challenge
- Made to be used without seeing the screen: narration and captions in three languages, the date and current values with their
  units read aloud on demand (V), and the reason when there is no value (land, no data, outside the sensor's view).
- Full keyboard control (Space, arrows, V, R, L, Home, Esc) and visible focus; the scene is described for screen readers,
  narration goes to a live region, and a time slider gives the date.
- **Hear the legend** on every record, including those without a numeric colour bar.
- Respects reduced motion and reduced transparency; a 2D version opens when 3D is not available; no login and no install.

### We tested it
At the hackathon, five people listened without seeing the screen, to the music alone, without narration: two people with visual
impairments and three sighted volunteers with their eyes closed.
- **5 of 5 heard that sea level rises.**
- **3 of 5 picked the warmer season of the northern oceans by pitch alone**, a subtler difference of a few degrees on a single
  voice, which shows us where to sharpen the mapping next.

We report every answer, including the misses.

### Why it matters
Earth Jukebox opens NASA Earth science to people a visual exhibit leaves out, in three languages, in any browser, for free. It
works as a sound layer for the Earth Information Center: the same NASA visualizations, heard instead of seen. Because the pipeline
is open, any flat NASA map can become a new record. And sound reaches people in a way a chart does not: you don't just see a line
go up, you hear the sea rise, note by note.

### Creative choices, and why
We took the jukebox literally: the Earth is the record and the needle reads it, a scan like the radar sweep of NASA's own Caldwell
73 sonification (one of the challenge resources), turned into a turntable. We chose clarity over richness, and real instruments,
because beauty keeps people listening, but never at the cost of the data: the music can only play what the map says.

### Honest limits
Each record states its limits in the liner notes. Lightning, night lights and aerosols have no numeric scale, so they play relative
strength, not concentrations. The lightning sensor only sees to about 55° N and S, so beyond that is silence, not zero. Aerosols
over land read weaker than over the sea. Sulfate is shown but not played, to keep three clear voices. A very quiet vinyl crackle,
which is not data, is declared.

### Tools
JavaScript, React, Vite, three.js with React Three Fiber, drei and postprocessing, GSAP, Tone.js, zustand and the Web Audio API in
the browser; Python, numpy, Pillow and ffmpeg in the data pipeline; Vitest (151 tests, plus pipeline tests); GitHub Pages. Instrument
samples: VSCO 2 Community Edition (CC0). The narrator is an ElevenLabs AI voice, cloned with his consent from team member Lucas Souza,
and the sound effects are ElevenLabs too; both are credited in the site and tagged in each file's metadata. We wrote the code with
AI coding assistants, under the team's direction and review. No data, values or music are AI-generated.
Source code: https://github.com/eluaden/earth-jukebox

### What's next
Testing with Brazilian organizations for blind people (Fundação Dorina Nowill, Instituto Benjamin Constant, Laramara), exploring
the globe by touch with vibration on phones, more Earth Information Center records through the open pipeline, and bringing the
sound layer to the Earth Information Center itself.

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
- **SVS 13786, Data Sonification: Caldwell 73**: method reference for the scanning needle.

## Space Agency Partner Data and Other References

Space Agency Partner data: none used.

[TODO: paste the table of [`si-e-referencias.md`](si-e-referencias.md) §4 as a list: NASA data, VSCO 2 CE samples (CC0), fonts
(SIL OFL), libraries (MIT / GSAP license), Python tools, browser APIs, GitHub Pages, SI tools (Anthropic Claude, ElevenLabs, and
Google Veo if used), the Lancet Global Health source of the 43 million figure, and past Space Apps projects (research only).]
