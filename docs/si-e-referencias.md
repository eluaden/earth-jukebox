# Earth Jukebox — Use of Super Intelligence (SI), NASA data and references

> Base for the submission form and for the **References** on the project page (see [`direcionamento.md`](direcionamento.md) §7.3 and §10).
> Written in English so it can be pasted as is. Update it whenever a new tool, dataset, sample or library enters the project.

---

## 1. Use of Super Intelligence (SI) — form answer

> **Yes.** We used SI tools as assistants to speed up development, never to decide what the project is or what the data says.
>
> **The idea is ours.** Earth Jukebox came from a team discussion about a real problem: NASA's Earth Information Center is a wall of screens, and the people who most need another way into that information (blind and low-vision people) are the ones it leaves out. The concept (the Earth as a record and a needle reading the planet), the choice of NASA visualizations, the rules that turn each value into sound, and every design and accessibility decision were made and argued by the team.
>
> **Where SI helped:**
> - **Code:** AI coding assistants (Anthropic Claude, through Claude Code and Cursor) helped write and refactor parts of the web app under our direction. We specified each change, reviewed the result, and checked it against NASA's own frames before keeping it.
> - **Research support:** summarizing public pages we had already selected (the challenge's Resources tab, past Space Apps projects) so we could read them faster.
> - **Writing support:** drafting and translating documentation and interface text (English, Portuguese, Spanish), reviewed by the team.
> - **Planned presentation assets:** a short Google Veo opening clip and ElevenLabs narration and sound effects. These are decorative or spoken and are labelled as SI-generated (see below).
>
> **What SI did not do:**
> - **No SI-generated data, values or scientific claims.** Every value you hear is read in the browser from frames of NASA Scientific Visualization Studio videos, using each frame's own color legend, ruler or chart.
> - **No SI-generated music.** The sound is synthesized live from the data with fixed, documented rules. Music composed by AI would be a black box, which is the opposite of what we want.
> - **No SI-generated image that looks like data**, no people, and no NASA logos or mission identifiers in any generated content.
> - **The scientific reading is checked by us:** we compared extracted values against the legends and higher-resolution frames and state the limits of each reading on the page.
>
> **How SI content is marked:** generated images and video carry a visible "AI-generated" watermark; generated audio is acknowledged in the credits text and in the file metadata; AI-assisted code is acknowledged in the repository README and in this document.

## 2. Rules for SI in production (what we commit to from now on)

| Item | Allowed | Not allowed | Required marking |
|---|---|---|---|
| Code | AI assistants writing or refactoring code we specify and review | Merging code nobody on the team checked | Acknowledged in the README and here |
| Data and values | — | Any value, series, label or date produced by SI | — |
| Scientific text (limits, methods, what the data shows) | SI to fix wording or translate text we wrote | SI writing the scientific claim itself | — |
| Music and data sound | — | AI-generated or AI-composed music | — |
| Video and images (Veo or similar) | Opening clip, abstract shots in the pitch video | Anything that looks like data; people, mainly "testers"; NASA logos, flags, mission identifiers | **Visible watermark "AI-generated (Google Veo)"** on every frame |
| Voice and sound effects (ElevenLabs or similar) | Pre-generated narration EN / PT / ES, needle and vinyl effects | Saying values that are not in the track's data | Credit text on the page **and** file metadata (e.g. comment/artist tag "AI-generated voice: ElevenLabs") |
| User test results and quotes | — | Inventing or simulating any result or testimonial | — |

**Checklist before submitting**

- [ ] Every Veo clip has the visible watermark.
- [ ] Every ElevenLabs file has the metadata tag and is listed in §4.
- [ ] README credits state AI-assisted code.
- [ ] No NASA logo, flag or mission identifier in any generated content.
- [ ] The "Use of SI" form answer matches §1.

## 3. NASA data — form answer

> All data comes from the **NASA Scientific Visualization Studio (SVS)**, mainly the **Earth Information Center gallery** that the challenge points to. We download NASA's videos and read real values from their frames (color legends, rulers, charts and map coverage). No values are made up.

| NASA resource | What we use | Status |
|---|---|---|
| [SVS 5235](https://svs.gsfc.nasa.gov/5235/) — Sea Level Through a Porthole, 1993–2023 | `seaLevelWaveTankComp_noWW_3-5-5-2024a_2160p30.mp4` in a porthole; global mean sea level read from the blue bar on the ruler printed on the frame (data: GSFC GMSL v5.1, TOPEX/Poseidon, Jason-1/2/3, Sentinel-6 MF; visualizer AJ Christensen) | Data ready (`public/tracks/sea-level/`), not in the app yet |
| [SVS 5011](https://svs.gsfc.nasa.gov/5011/) — Lightning Events Detected from the ISS, 2017–2023 | Flat Science On a Sphere video `iss_lightning_sos_yearly_07312023_2048p60.mp4` as the globe skin; share of each 2° box covered by lightning dots; date of every frame from NASA's `labels.txt` | Data ready (`public/tracks/lightning/`), not in the app yet |
| [SVS 4993](https://svs.gsfc.nasa.gov/4993/) — Spread of the Dixie Fire, 2021 | Burned area read from the chart on the frame | Removed (direcionamento §8) |
| [SVS 5113](https://svs.gsfc.nasa.gov/5113/) — Active Fires as Observed by VIIRS | Map coverage of fire detections by region | Removed |
| [SVS 5175](https://svs.gsfc.nasa.gov/5175/) — TEMPO nitrogen dioxide, Chicago/Toronto | NO₂ read from the color legend | Removed |
| [SVS 5669](https://svs.gsfc.nasa.gov/5669/) — GEOS Aerosols 2025 (GEOS-FP 2 km replay, NASA GMAO; visualizers Joseph V. Ardizzone and Helen-Nicole Kostis, scientist Lesley Ott) | `Aerosols_2025-08-19T20_00_00_3840x2160.png` stretched to 2:1 as the globe skin; strength of each type's legend colour per 2° box (`Aerosols_cbar.png`); smoke, dust and sea salt played, sulfate shown but silent | Data ready (`public/tracks/aerosols/`), not in the app yet |
| [SVS 3912](https://svs.gsfc.nasa.gov/3912/) — ECCO2 Sea Surface Temperature | `ecco2_sst_flow.mp4` as the globe skin; temperature read from its flow-line colours with the official colour bar `sst_ecco2_cbar.png` (0–32 °C); exact dates from `flat_ecco2_dates.txt` | In the site |
| [SVS 5313](https://svs.gsfc.nasa.gov/5313/) — Night Lights 2012–2023 | Left copy of the EIC video as 12 yearly stills on the globe; brightness the lights add above NASA's own lights-off frame | Data ready (`public/tracks/night-lights/`), not in the app yet |
| [SVS 5533](https://svs.gsfc.nasa.gov/5533/) — EIC Air Quality | Studied as a candidate track | Research |
| [SVS 13786](https://svs.gsfc.nasa.gov/13786/) — Data Sonification: Caldwell 73 | Reference for "latitude → pitch" scanning | Method reference |
| NASA Blue Marble Next Generation (Dec 2004) | Globe texture of the old landing page | Removed |
| [Earth Information Center gallery](https://svs.gsfc.nasa.gov/gallery/earth-information-center/) and the [challenge page](https://www.spaceappschallenge.org/2026/challenges/the-earth-information-jukebox/) | Source list and challenge brief | Reference |

Keep this table in sync with `public/tracks/` and the README track table.

## 4. Space Agency Partner data and other references — form answer

**Space Agency Partner data:** none used so far. *(If we add any, list it here: agency, dataset, link, how it is used.)*

| Type | Resource | License / terms | Use |
|---|---|---|---|
| Data | NASA SVS videos and images (§3) | NASA media guidelines, public domain unless noted | Data source, video in the player |
| Font | [Instrument Serif](https://fonts.google.com/specimen/Instrument+Serif), [Geist Mono](https://fonts.google.com/specimen/Geist+Mono) (Google Fonts) | SIL Open Font License | Dates and titles; data values |
| Font | [Atkinson Hyperlegible](https://fonts.google.com/specimen/Atkinson+Hyperlegible) (Google Fonts) | SIL Open Font License | Readable interface text |
| Tool | [Vite](https://vitejs.dev/), [Vitest](https://vitest.dev/) | MIT | Build, dev server, tests |
| Library | [React](https://react.dev/), [three.js](https://threejs.org/), [React Three Fiber](https://github.com/pmndrs/react-three-fiber), [drei](https://github.com/pmndrs/drei), [postprocessing](https://github.com/pmndrs/postprocessing), [zustand](https://github.com/pmndrs/zustand), [Tone.js](https://tonejs.github.io/) | MIT | Interface, 3D globe, state, audio |
| Library | [GSAP](https://gsap.com/) | GSAP standard license (free) | Camera and needle animation |
| Samples | [VSCO 2 Community Edition](https://github.com/sgossner/VSCO-2-CE), Versilian Studios: cello and violin sections, upright piano, glockenspiel, marimba (subset, converted to MP3 by `scripts/pipeline/samples.py`) | CC0 1.0 | Instruments |
| Tool | Python, numpy, Pillow, ffmpeg | PSF / BSD / HPND / LGPL | Reading NASA frames (`scripts/pipeline/`) |
| Browser API | Web Audio API, Web Speech API, WebGL | Browser standard | Sound synthesis, fallback narration, 3D |
| Hosting | GitHub Pages | GitHub terms | Live site |
| SI tool | Anthropic Claude (Claude Code, Cursor) | Anthropic / Cursor terms | AI-assisted coding, documentation and translation (§1) |
| SI tool (planned) | Google Veo | Google terms | Opening clip and abstract pitch shots, watermarked |
| SI tool | ElevenLabs (`eleven_multilingual_v2`) | ElevenLabs terms (check commercial/attribution clause) | Narration in EN / PT / ES: AI-generated speech in the cloned voice of a team member (Lucas Souza), made with his consent, 42 files in `public/narration/`, each tagged "AI-generated voice: ElevenLabs" in its metadata. Sound effects S1–S7 in `public/sfx/` (from `media-src/elevenlabs/sfx/`, text-to-sound-effects; glass-tap and record-swap normalised on copy), wired in the player (needle, platter, record change, UI tap, opening whoosh, vinyl bed). Optional 6 s opening sting M1 (`media-src/elevenlabs/music/`, music model) not yet used. Each SFX/music file tagged "AI-generated sound effect: ElevenLabs" / "AI-generated music: ElevenLabs" |
| Research | Past Space Apps projects ([`earth-jukebox-projetos-anteriores.md`](earth-jukebox-projetos-anteriores.md)) | Public project pages | Inspiration and differentiation only; no code or assets reused |

No copyrighted material is used without permission.
