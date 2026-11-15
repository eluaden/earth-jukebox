# Earth Jukebox — Prompts dos assets (Veo e ElevenLabs)

> Lista de itens, quando fazer e onde salvar: [`direcionamento.md`](direcionamento.md) §7.1, §7.2 e §7.2.1.
> Prompts em inglês (dão melhor resultado). Ao corrigir, mude **uma coisa por vez**.

---

## 1. Google Flow (Veo 3.1 + Nano Banana)

### 1.1 Passo a passo

1. **Imagem (grátis):** ajustes → **Nano Banana Pro**, 16:9 → colar o prompt de imagem → refazer até ficar perfeita.
2. **Vídeo:** ajustes → **Veo 3.1 Fast** (testes) → **+** → anexar a imagem como **first frame** → colar o prompt de movimento → 1 vídeo por pedido.
3. **Final:** com o teste aprovado, gerar de novo em **Veo 3.1 Quality**.
4. **Baixar:** **⋮ → Download → 1080p**. Descartar o áudio do Veo.
5. **Salvar** em `media-src/veo/` com o nome do item (vídeo `.mp4` e imagem-base `.png`).

### 1.2 Correções comuns

| Problema | Pedir no chat |
|---|---|
| Apareceram anéis de Saturno | `The grooves must be etched into a solid black disc surface, like a real LP. Remove every ring of light.` |
| Terra com cara de desenho | `Make Earth look like a real NASA photograph, natural colors.` |
| Brilho / lens flare demais | `Remove the lens flare and glow, more subtle and dark.` |
| Câmera rápida demais | `Same shot, much slower camera movement.` |
| Apareceu texto ou logo | `Same shot, remove all text and logos.` |

### 1.3 V2 — A Terra como o centro de um disco

**Imagem:**
```
Photoreal cinematic still, 16:9.

SUBJECT: A giant glossy black vinyl record floating in deep space. Planet Earth sits exactly at the center of the record, in the place where the paper label would be, perfectly round and realistic, about one third of the record's diameter.

THE RECORD: Pure black, slightly reflective, with extremely fine concentric microgrooves etched into its surface, like a real vinyl LP seen up close. The grooves catch a soft sheen of light in a thin diagonal highlight band, exactly like light reflecting on a real record. The grooves are flat and part of a solid disc, NOT rings, NOT bands of light, NOT an orbit.

CAMERA: Three-quarter view from above, about 35 degrees, the record slightly tilted toward the viewer, filling most of the frame. 50mm lens, sharp focus on Earth, gentle falloff toward the edges of the record.

EARTH: NASA Blue Marble look, real continents and cloud swirls, thin blue atmospheric glow at its edge, sunlight from the left, night side on the right.

LIGHT AND MOOD: Deep black space with very few faint stars. Quiet, elegant, premium, like a high-end album cover photographed in a studio.

AVOID: Saturn-like rings, glowing rings, sci-fi halos, lens flares, neon, text, logos, people, cartoon style.
```

**Movimento:**
```
The record and the planet rotate slowly together, like a record on a turntable. The camera stays still. The sheen on the grooves stays fixed while the disc turns. Very slow, calm. No text.
```

### 1.4 V3 — A mesma cena com a agulha

**Imagem** (anexar a imagem aprovada do V2 como referência):
```
Same scene as the reference image: a glossy black vinyl record floating in deep space, with planet Earth at its center where the label would be, fine concentric microgrooves, soft diagonal sheen. Add a slender, polished chrome turntable tonearm entering from the upper right corner, elegant and minimal, its stylus resting gently on the grooves near the edge of the Earth. A thin line of soft light where the stylus touches. Same camera, same light.

AVOID: Saturn-like rings, glowing rings, lens flares, text, logos, people.
```

**Movimento:**
```
The record and the planet rotate slowly under the still tonearm. The thin line of light under the stylus gently pulses. Camera very slowly pushes in. Calm, no text.
```

### 1.5 V4 — A borda da Terra no escuro

**Imagem:**
```
Photoreal cinematic still, 16:9, as if photographed from the International Space Station.

SUBJECT: Almost total darkness. Only at the very bottom of the frame, the thin curved edge of planet Earth's night side, with the delicate blue and teal glow of the atmosphere along the horizon line, like the first second of a sunrise seen from orbit. A few faint city lights barely visible on the dark surface.

COMPOSITION: The horizon occupies only the bottom 15 percent of the frame; the rest is deep black space. Horizon slightly curved, perfectly centered.

LIGHT AND MOOD: Minimal, silent, awe. Real orbital photography, natural colors.

AVOID: Rings, halos, arcs in the sky, lens flares, light streaks, stars in large numbers, text, logos, people.
```

**Movimento:**
```
The camera tilts up very slowly as the atmosphere's glow brightens and reveals more of the planet. Calm, silent, no text.
```

### 1.6 V5 — Sulcos que viram litoral

**Imagem:**
```
Photoreal extreme macro still, 16:9: a polished chrome turntable stylus resting in the grooves of a glossy black vinyl record, shallow depth of field, soft rim light. In the background, out of focus, the grooves start to look like coastlines and cloud bands of Earth seen from orbit at night.

AVOID: Rings of light, neon, lens flares, text, logos, people, cartoon style.
```

**Movimento:**
```
Slow dolly forward along the groove. The grooves gradually transform into real coastlines and cloud bands of Earth seen from orbit at night. Smooth, elegant, no text.
```

### 1.7 V6 — Som saindo do oceano

**Imagem:**
```
Photoreal cinematic still, 16:9: a dark ocean at night seen from very high altitude. Thin, soft ribbons of light rise gently from the water surface like sound waves, fading into the black sky. Abstract, poetic, realistic water.

AVOID: Neon, lens flares, text, logos, people, cartoon style.
```

**Movimento:**
```
The camera glides slowly over the ocean. The ribbons of light rise and pulse gently, like sound waves, then fade. Slow motion, calm, no text.
```

### 1.8 V1 — Abertura do site (só depois do globo pronto)

- **Último frame:** screenshot 1920×1080 do enquadramento inicial do globo 3D com a agulha (gerado na implementação, salvo em `media-src/veo/v1-ultimo-frame.png`).
- No Veo 3.1, usar **frames to video**, com o screenshot como **last frame**. Primeiro frame opcional: imagem de espaço profundo do Nano Banana.

**Movimento:**
```
Cinematic descent from deep space toward planet Earth. The camera slowly pushes in from far away; as it approaches, faint concentric grooves like a vinyl record become visible around the planet, catching the light. A slender polished chrome tonearm enters from the upper right and gently lowers its stylus onto the planet along a meridian, where a thin line of light appears. The final frame must match the reference last frame exactly. Pure black space, photoreal, slow, elegant. No text, no logos, no people.
```

---

## 2. ElevenLabs

### 2.1 Voz (Q4)

1. Voice Library → filtro "Narrative / Documentary" → voz calma, quente, adulta (nem dramática, nem de comercial).
2. Testar 3–4 vozes com a frase abaixo; escolher **uma** para EN, PT e ES (modelo Eleven Multilingual v2 ou v3).
3. Ajustes iniciais: stability ~50, similarity ~75, style 0–15. Exportar MP3 44,1 kHz 128 kbps.
4. Registrar o nome da voz no direcionamento (§7.2).

```
Put on headphones. This is the Atlantic Ocean, in the summer of 2007. Every note you hear is a temperature measured by NASA.
```

### 2.2 Efeitos (Sound Effects) — gerar 3–4 variações e escolher de ouvido

| ID | Arquivo | Duração | Prompt |
|---|---|---|---|
| S1 | `needle-drop` | 2 s | `Turntable stylus gently dropping onto a spinning vinyl record, soft thump followed by a brief warm crackle, close-mic, high fidelity, quiet room` |
| S2 | `vinyl-crackle-loop` | 10 s, loop ligado | `Subtle warm vinyl record surface crackle and soft hiss, very quiet, steady, seamless loop, no music` |
| S3 | `needle-lift` | 1,5 s | `Turntable tonearm lifting off a vinyl record, small soft mechanical click and a short scratch fading out` |
| S4 | `platter-spin-up` | 3 s | `Vintage turntable platter motor starting up, soft mechanical hum rising smoothly, close-mic, gentle` |
| S5 | `record-swap` | 2,5 s | `Vinyl record sliding out of a paper sleeve and placed on a turntable, soft paper friction, gentle tap` |
| S6 | `glass-tap` | 0,5 s | `Soft delicate tap on a thin glass surface, clean, short, subtle UI sound, no reverb tail` |
| S7 | `space-whoosh` | 3 s | `Slow deep cinematic whoosh through space, airy and soft, low rumble, elegant, not aggressive` |

### 2.3 Vinheta (Music) — M1, opcional

```
6-second ambient opening sting. Warm felt piano and soft strings, a single rising chord that resolves gently, cinematic, spacious, calm, awe. No drums, no vocals.
```

### 2.4 Falas fixas da UI — N1

| ID | EN | PT | ES |
|---|---|---|---|
| `put-on-headphones` | Put on headphones. | Coloque fones de ouvido. | Ponte auriculares. |
| `welcome` | Welcome to the Earth Jukebox. The planet is the record. Every note comes from NASA data. | Bem-vindo ao Earth Jukebox. O planeta é o disco. Cada nota vem de dados da NASA. | Bienvenido al Earth Jukebox. El planeta es el disco. Cada nota viene de datos de la NASA. |

### 2.5 Narração das faixas (N2) e do pitch (N3)

- Originais em `media-src/elevenlabs/voice/<en|pt|es>/<faixa>-<id>.mp3`. No site, cada fala vive em `public/narration/<idioma>/<chave>.mp3`, listada em `public/narration/manifest.json` (`lines`: chave → arquivo; `info`: faixa, idioma, tipo e texto). A chave é `lineKey(idioma, texto)` de `src/narration/key.js`, um hash do **texto exato**: se o texto mudar, o site volta para a voz do navegador até a fala ser gravada de novo.
- As gravações já em `public/narration/` (15/11/2026, `eleven_multilingual_v2`, voz clonada de um integrante) são das faixas antigas. As falas da SST abaixo ainda precisam ser gravadas com a mesma voz.
- Os textos são os mesmos de `src/i18n/tracks/<faixa>.js` (fonte única); se mudar um, mude o outro.
- `{date}` é preenchido pelo site com o mês e o ano; os textos abaixo já estão com a data exata que o site gera (calculada da grade da faixa), então a chave bate.
- Pitch (N3): *(a escrever com o roteiro do vídeo.)*

**Temperatura do mar (SST)**

| ID | EN | PT | ES |
|---|---|---|---|
| `sst-intro` | This is the surface of the ocean, from March 2007 to March 2008. Every note is a temperature read from a NASA map: the warmer the water, the higher the note. | Esta é a superfície do oceano, de março de 2007 a março de 2008. Cada nota é uma temperatura lida de um mapa da NASA: quanto mais quente a água, mais aguda a nota. | Esta es la superficie del océano, de marzo de 2007 a marzo de 2008. Cada nota es una temperatura leída de un mapa de la NASA: cuanto más cálida el agua, más aguda la nota. |
| `sst-north-warmest` | September 2007: the northern waters reach their warmest of the year. | Setembro de 2007: as águas do norte chegam ao ponto mais quente do ano. | Septiembre de 2007: las aguas del norte llegan a su punto más cálido del año. |
| `sst-south-warmest` | February 2008: now it is the turn of the southern waters, at their warmest of the year. | Fevereiro de 2008: agora é a vez das águas do sul, no ponto mais quente do ano. | Febrero de 2008: ahora es el turno de las aguas del sur, en su punto más cálido del año. |
| `sst-outro` | One year of ocean has passed under the needle. The record starts again. | Um ano de oceano passou sob a agulha. O disco recomeça. | Un año de océano ha pasado bajo la aguja. El disco vuelve a empezar. |
