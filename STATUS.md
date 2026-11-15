# Earth Jukebox — Status

> O que já foi feito e quem faz o quê, item a item do [`direcionamento.md`](docs/direcionamento.md) (a fonte de verdade: em caso de dúvida, ele vence este arquivo).
> Atualizado em 15/11/2026, depois do E1 de raios e luzes noturnas (fatia SST publicada em https://eluaden.github.io/earth-jukebox/).
> **Atualize este arquivo no mesmo commit do trabalho.**

**Legenda:** **Feito** · **Parcial** (existe, mas falta algo dito na coluna ao lado) · **A fazer** · **Bloqueado** (depende de outro item)

---

## 1. Divisão do time (proposta, a confirmar)

Somos três. Cada frente tem **dono e arquivos próprios**, para ninguém editar o mesmo arquivo ao mesmo tempo (em 15/11 duas pessoas mexeram no narrador em paralelo e deu conflito).

| Frente | Dono (proposta) | Cuida de | Arquivos da frente |
|---|---|---|---|
| **A. Dados e faixas** | Lucas Valadares (fez o pipeline da SST) | Explorações E1/E4, scripts que leem os vídeos da NASA, grade de cada faixa, mapeamento dado → nota de cada faixa, textos do encarte de cada faixa | `scripts/pipeline/`, `public/tracks/`, `src/data/`, `src/music/mapping.js`, `src/music/tracks/`, `src/i18n/tracks/` |
| **B. Experiência no navegador** | Lucas Senno (fez o direcionamento e o polimento visual) | Globo, agulha, interface, troca de faixa, motor de som, desempenho, acessibilidade, Explorar, Audio-first | `src/scene/`, `src/ui/`, `src/state/`, `src/flat/`, `src/music/engine.js`, `src/styles.css` |
| **C. Conteúdo, voz e apresentação** | Lucas Souza (gravou a narração) | Narração e efeitos (ElevenLabs), vídeos do pitch (Veo), teste com usuários, vídeo, página do projeto, referências e regras de IA | `media-src/`, `public/narration/`, `docs/prompts-assets.md`, `docs/si-e-referencias.md`, textos do About em `src/i18n/strings.js` |

**Contrato entre A e B:** a frente A entrega, por faixa, `public/tracks/<id>/` (`track.json`, `grid.bin`, vídeos ou imagens) + o módulo de música da faixa em `src/music/tracks/` (interface comum `TRACK_MUSIC[id]`: `voices`, `read`, `summary`, `initialState`, `plan`, descrita em `src/music/tracks/index.js`) + os textos em `src/i18n/tracks/<id>.js`; a frente B só consome. Qual passo está tocando: `stepAtFrame` / `stepAtTime` em `src/data/steps.js`. Mudar esse formato = combinar antes.

**Sem dono fixo:** aprovação de ouvido do som (§6.1) por quem do time tiver formação musical: **[a definir]**.

### Como trabalhamos

1. Tudo direto na `main`, sem branches nem PRs. `git pull` antes de começar e antes de cada push; commits pequenos, push logo depois.
2. Mudou uma decisão? Atualize o `direcionamento.md` primeiro ([`AGENTS.md`](AGENTS.md)). Terminou um item? Atualize este arquivo no mesmo commit.
3. Precisa mexer em arquivo de outra frente? Avise o dono antes.
4. `npm run deploy` só a partir da `main` atualizada: o deploy sobrescreve o site inteiro.
5. Antes do push: `npm test`, `npm run test:pipeline` e `npm run build` passando.

---

## 2. P0 — Essencial (§16)

| Item | Ref. | Status | Frente | O que falta / observação |
|---|---|---|---|---|
| E1 — temperatura do mar | §14 | **Feito** | A | 2:1, legenda oficial, datas exatas (§14.1) |
| E1 — raios | §14 | **Feito** | A | 2:1 de polo a polo; datas exatas por frame no `labels.txt` da NASA ("2003" = 2023); tempo não uniforme; leitura = cobertura de pontos amarelos, só até ~55° (§14.1) |
| E1 — luzes noturnas | §14 | **Feito** | A | Quadro 32:9 = duas cópias do mapa; usar a da esquerda (equirretangular 16:9, começa em 168,5° W); série anual nos frames 0–269, mapa sem luzes no 290; textura = 12 imagens (§14.1) |
| E3 — vídeo como textura | §14 | **Parcial** | B | Tamanhos escolhidos (1536 / 1024). Falta medir fluidez (FPS) em notebook comum e celular real |
| Globo com agulha | §5.3 | **Feito** | B | Polido em 15/11 (volume do globo, braço em J, vidro) |
| Motor musical com samples e regras de clareza | §6.1, §6.3 | **Parcial** | B | Feito para a SST. O mapeamento de raios e luzes está pronto e testado (A, `TRACK_MUSIC`); falta o motor tocar a marimba (samples em `public/samples/marimba/`), aceitar eventos com `offset` (arpejo) e a **aprovação de ouvido** |
| Faixa: temperatura do mar | §8 | **Feito** | A | Pipeline, grade, mapeamento, encarte, narração gravada. Textos do encarte: revisar (time) |
| Faixa: raios | §8, §6.2 | **Parcial** | A feito, B falta | Dados prontos em `public/tracks/lightning/` (`npm run pipeline:lightning`): 236 passos de 10 dias, `grid.stepFrames`, vídeos 1536/1024 a 30 fps. Música (`src/music/tracks/lightning.js`) e textos (`src/i18n/tracks/lightning.js`) prontos. Falta a frente B ligar no app e incluir `lightning` em `public/tracks/index.json` (hoje só tem `sst`, de propósito) |
| Faixa: luzes noturnas | §8, §6.2 | **Parcial** | A feito, B falta | Dados prontos em `public/tracks/night-lights/` (`npm run pipeline:nightlights`): 12 imagens 2:1 e grade de brilho por ano. Música (`src/music/tracks/nightLights.js`, usa a coluna do ano anterior) e textos prontos. Falta a frente B: textura feita de imagens com fade (`texture.kind = 'stills'`), relógio sem vídeo (`time.secondsPerStep`) e data só com o ano (`time.unit = 'year'`); depois incluir `night-lights` em `public/tracks/index.json` |
| Records (troca de faixa) | §5.4 | **Parcial** | B | Painel com 1 capa (frame) e agulha levantando. Falta trocar de faixa: crossfade da pele do globo, agulha desce, som novo. Para raios e luzes, o app precisa aceitar passos por lista de frames e textura feita de imagens (§14.1) |
| Liner notes | §5.5 | **Feito** | A (texto), B (painel) | Inclui "Hear the legend" e limites. Repetir para cada faixa nova |
| Acessibilidade de base | §5.8 | **Parcial** | B | Teclado, leitor de tela, `aria-live`, V para valores, movimento e transparência reduzidos feitos. Falta checar com VoiceOver/NVDA real e medir contraste (R10) |
| Narração N1 (falas da UI) | §7.2 | **Parcial** | C (gravar), B (tocar) | Gravadas em EN/PT/ES (`media-src/elevenlabs/voice/<idioma>/put-on-headphones.mp3` e `welcome.mp3`, também no manifesto do site). Falta a frente B tocar: o app ainda não fala o `welcome` nem o `put-on-headphones` |
| Narração N2 — temperatura do mar | §7.2 | **Feito** | C | 12 falas regravadas com os ajustes de narrador (stability 50, similarity 75, style 10), `public/narration/` |
| Narração N2 — raios e luzes | §7.2 | **Feito** | C | 12 falas por faixa gravadas e conferidas por transcrição. A introdução dos raios foi gravada a 1,1–1,2× porque o primeiro marco chega aos 8,8 s (ver `prompts-assets.md` §2.5). Se um texto mudar, regravar |
| Pipeline reproduzível | §7.5 | **Feito** | A | `npm run pipeline:sst`, `pipeline:lightning`, `pipeline:nightlights`, com testes (`npm run test:pipeline`) |
| Abertura simples (tela preta + descida 3D) | §5.2 | **Feito** | B | Volta à página pula a descida; "Replay opening" no About |
| Teste com usuários | §9 | **A fazer** | C | Contatar Dorina Nowill, Instituto Benjamin Constant, Laramara (Q3). Protocolo do §17.2. **Nunca simular resultado** |
| Site publicado + versão 2D | §10 | **Feito** | B | GitHub Pages; 2D automática sem WebGL (`?flat=1` força) |
| Vídeo (~30 s) | §10 | **A fazer** | C | Depende de V2–V6, N3 e do resultado do teste |
| Página do projeto | §10 | **A fazer** | C | Em inglês, na linguagem dos prêmios |
| References | §10, §7.3 | **Parcial** | C | `si-e-referencias.md` atualizado até a fatia SST. Falta checklist do §2 dele antes de submeter |
| README | §10 | **Parcial** | todos | Reescrito para a fatia SST; atualizar a cada faixa |

## 3. P1 — Fortalece (só depois do P0 pronto)

| Item | Ref. | Status | Frente | Observação |
|---|---|---|---|---|
| Explorar | §5.6 | **A fazer** | B | Funcionar sem fone; áudio espacial é bônus |
| Aerossóis (4ª faixa) | §8, Q2 | **A fazer** | A | Depende de E1 (1920×1080) e de Q2 |
| Capas "vinil de dados" | §5.4 | **A fazer** | A (gerar), B (mostrar) | Hoje a capa é um frame da faixa |
| Modo Audio-first (tecla A) | §5.8 | **A fazer** | B | |
| Efeitos S1–S7 | §7.2 | **Parcial** | C (gravar), B (tocar) | Gerados em 15/11 (uma tomada de cada, sem escolha de ouvido) em `media-src/elevenlabs/sfx/`. Falta ouvir e aprovar, e a frente B trocar os sons sintetizados pelos arquivos. `glass-tap` e `record-swap` saíram baixos (pico de −26 e −30 dB): normalizar ao copiar para `public/` |
| Faixa bônus nível do mar | §8, §5.4 | **A fazer** | A, B | Frames antigos ainda em `public/tracks/sea-level-porthole/` |

## 4. P2 — Diferencial (pode ficar de fora)

| Item | Ref. | Status | Frente |
|---|---|---|---|
| Comparar | §5.7 | **A fazer** | B |
| Abertura com Veo (V1) | §5.2, §7.1 | **Bloqueado** (depois de P0 e P1) | C |
| Vinheta M1 | §7.2 | **Parcial** (opcional) | C | Gerada em 15/11 (uma tomada, 6 s) em `media-src/elevenlabs/music/opening-sting.mp3`. Falta ouvir e decidir se entra |
| Exportar álbum | §7.4 | **A fazer** | A, B |
| Script aberto para qualquer vídeo do SVS | §7.5 | **A fazer** | A |

## 5. Explorações e perguntas em aberto

| # | Status | Frente | Situação |
|---|---|---|---|
| E1 | **Parcial** | A | SST, raios e luzes noturnas feitos; aerossóis a fazer (P1) |
| E2 | **Feito** | — | VSCO 2 CE (CC0) em uso |
| E3 | **Parcial** | B | Falta FPS em aparelho real |
| E4 | **A fazer** | A | CO₂ DYAMOND (câmera móvel) |
| Q1 | **Parcial** | B | Ponto de partida: 10 s por volta, vídeo a 1×. Validar de ouvido |
| Q2 | **A fazer** | A | Aerossóis: 3 ou 4 vozes |
| Q3 | **A fazer** | C | Quantos testadores e quando |
| Q4 | **Feito** | C | Voz clonada (PVC) do Lucas Souza, registrada no direcionamento §7.2 |
| Q5 | **Parcial** | B | Estalo de vinil baixo. Achado: com faixas largas pelo menos 4 de 6 notas sempre soam (R5 quase não ocorre) |

## 6. Assets de IA para o pitch (podem andar em paralelo, §16)

| ID | Status | Frente |
|---|---|---|
| V2–V6 (Veo, pitch) | **A fazer** | C |
| S1–S7 (efeitos) | **Parcial** (gerados; falta aprovar de ouvido) | C |
| N1 (falas da UI) | **Feito** (gravadas; falta o app tocar) | C |
| N3 (narração do pitch) | **Bloqueado** (roteiro do vídeo) | C |

## 7. Verificações pendentes da fatia SST

- [ ] Aprovação de ouvido do som por alguém com formação musical (§6.1).
- [ ] Fluidez em notebook comum e em celular real (E3, R2).
- [ ] Revisão dos textos do encarte e da narração pelo time (`src/i18n/tracks/sst.js`).
- [ ] Leitor de tela real (VoiceOver ou NVDA) do começo ao fim (§17.2).
- [ ] Contraste do vidro medido (R10).

## 8. Próximos passos sugeridos (em paralelo, um por frente)

1. **A:** revisar os textos das três faixas com o time; E4 (CO₂) e aerossóis (P1).
2. **B:** ligar raios e luzes no app (Records com troca de faixa, `TRACK_MUSIC`, marimba, passos por lista de frames, textura de imagens); medir FPS em aparelho real.
3. **C:** contato com os testadores (prazo longo: começar já); N1; S1–S7.
