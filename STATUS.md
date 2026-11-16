# Earth Jukebox — Status

> O que já foi feito e quem faz o quê, item a item do [`direcionamento.md`](docs/direcionamento.md) (a fonte de verdade: em caso de dúvida, ele vence este arquivo).
> Atualizado em 15/11/2026: aerossóis e nível do mar ligados no app e publicados (cinco discos no Records). **Aviso à frente B (Lucas Senno):** essa integração foi feita pela frente A nos arquivos da B, a pedido do Lucas Valadares; o que mudou está na linha de cada faixa no P1 e em `direcionamento.md` §5.4. Site: https://eluaden.github.io/earth-jukebox/ (atualiza a cada `npm run deploy`). Roteiro do vídeo pronto em `docs/roteiro-video.md` (aviso à frente C na linha do vídeo).
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
| Gráfico de tendência | §5.2.1, §5.3 | **Feito** | B | Canto inferior esquerdo, um gráfico por disco (série inteira, marcador no período atual), unidade em todo número (°C, %), até 5 rótulos no eixo X. Pausa: o globo segue girando com a agulha levantada |
| Fundo que reage ao mouse | §5.1 | **Feito** | B | `src/scene/Backdrop.jsx`: estrelas distantes e poeira próxima em parallax acompanhando o cursor, poeira acende perto do cursor, brilho azul largo e quase imperceptível atrás do globo. Toque e movimento reduzido: fundo parado |
| Motor musical com samples e regras de clareza | §6.1, §6.3 | **Parcial** | B | Toca qualquer faixa de `TRACK_MUSIC`: vozes montadas por faixa (cordas, piano, glockenspiel, marimba; samples decodificados uma vez e compartilhados), eventos com `offset` (arpejo), troca de vozes com fade. Falta a **aprovação de ouvido** |
| Faixa: temperatura do mar | §8 | **Feito** | A | Pipeline, grade, mapeamento, encarte, narração gravada. Textos do encarte: revisar (time) |
| Faixa: raios | §8, §6.2 | **Feito** | A, B | Dados em `public/tracks/lightning/` (`npm run pipeline:lightning`), música e textos da frente A. No app: marimba, pontos amarelos na agulha, chips em % da área ("<0.1" quando há raio abaixo de 0,05%), passos por lista de frames |
| Faixa: luzes noturnas | §8, §6.2 | **Feito** | A, B | Dados em `public/tracks/night-lights/` (`npm run pipeline:nightlights`), música e textos da frente A. No app: textura de 12 imagens com fade de 1,2 s na virada do ano, relógio próprio (10 s por ano, parado com a agulha levantada), data só com o ano, chips de luz (/255) e de mudança (com sinal; "—" no primeiro ano). O globo não escurece o branco das luzes (é o dado) |
| Records (troca de faixa) | §5.4 | **Feito** | B | Cinco capas (`public/tracks/index.json`: SST, raios, luzes, aerossóis, nível do mar). Trocar: painel desce, globo escurece com o nome novo pulsando no rodapé, crossfade de 1,2 s da pele do globo (também na versão 2D), agulha desce, faixa nova do passo 0 com a fala de abertura. Grades e capas das outras faixas carregam em segundo plano 5 s depois do play. Tela de celular: capas menores |
| Liner notes | §5.5 | **Feito** | A (texto), B (painel) | Drawer à direita com aba/seta na borda e fecha ao clicar fora. Por faixa: SST com barra NASA; raios e luzes com "Legenda em som". **Enxuto (15/11, frente B nos textos da A):** topo = período · `dataset` · link "NASA SVS nnnn", frase curta, tabela curta, `highlights` ("Preste atenção"), legenda; `description`, `limits` e a fonte completa no "Saiba mais · método e limites" recolhido. Textos dos 5 discos reescritos sem fato novo; narração intacta |
| Acessibilidade de base | §5.8 | **Parcial** | B | Teclado, leitor de tela, `aria-live`, V para valores, movimento e transparência reduzidos feitos. Falta checar com VoiceOver/NVDA real e medir contraste (R10) |
| Narração N1 (falas da UI) | §7.2 | **Feito** | C (gravar), B (tocar) | Na primeira visita: clique → "Put on headphones." → "Welcome…" durante a descida → 2,5 s só de música → fala de abertura da faixa. Volta à página e "Replay opening" não repetem o N1. Teste confere que toda fala (N1 e N2 das três faixas, com datas) tem MP3 no manifesto |
| Narração N2 — temperatura do mar | §7.2 | **Feito** | C | 12 falas regravadas com os ajustes de narrador (stability 50, similarity 75, style 10), `public/narration/` |
| Narração N2 — raios e luzes | §7.2 | **Feito** | C | 12 falas por faixa gravadas e conferidas por transcrição. A introdução dos raios foi gravada a 1,1–1,2× porque o primeiro marco chega aos 8,8 s (ver `prompts-assets.md` §2.5). Se um texto mudar, regravar |
| Narração N2 — aerossóis e nível do mar | §7.2 | **Feito** | C | 27 falas (aerossóis: introdução, 3 lugares e encerramento; nível do mar: introdução, 2 marcos e encerramento) em EN/PT/ES, mesma voz e ajustes, conferidas por transcrição. Total no site: 69 falas |
| Repetir com narração | §5.3 | **Feito** | C (pediu), arquivos da B | Botão ↻ no rodapé e tecla Home: volta o disco ao começo e fala a narração de novo. O loop e o pause/retomar não repetem a voz (decisão no direcionamento §5) |
| Anel = tempo, globo = lugar | §5.2 (decisão 15/11, "anel = tempo, globo = lugar") | **Feito** | B | Um anel só (`src/scene/Platter.jsx`; o segundo saiu, `PLATTER_R` em `layout.js` guarda o espaço). Arrastar o anel move a data e gira o globo junto (1 volta = 10 s do disco; `scrubToFraction` em `controller.js`); arrastar o globo só gira, a data fica parada (`scrubBy`). Voltar re-arma os marcos da narração e corta a fala de um marco que ficou à frente. Hover: anel mais grosso, cabeçote, traço do ponteiro, data discreta junto ao ponteiro. 3º passo do tutorial: dois balões (`TutorialHints` em `Platter.jsx`, posição em `ringHintPlacement` de `layout.js`): "Tempo" embaixo à direita do anel, "Lugar" à esquerda com dedo fantasma no globo; no celular, abaixo e acima do globo; ficam no `<body>`, acima do HUD. Seeks do vídeo agrupados em `skins.js` |
| Arrastar o globo | §5 (decisão 15/11) | **Feito** | C (pediu), arquivos da B | Mouse ou dedo, tocando ou pausado; a data fica parada e a agulha toca o que passa (outras partes do mundo no mesmo dia); ao soltar volta ao estado anterior. Setas ↑ ↓ pelo teclado. Clique curto continua play/pause. O globo **não gira sozinho** pausado, com Records aberto ou trocando de disco (o prato também para). Não existe na versão 2D (`?flat=1`) |
| Escolher instrumento por voz | §5 (decisão 15/11), §6.1 | **Feito** | C (pediu), arquivos da A/B | Menu de vidro próprio no nome do instrumento (teclado: ↑ ↓ Enter Esc). 5 por disco (`src/music/instruments.js`); novos do VSCO 2 CE: harpa, flauta, pizzicato, xilofone, baixados só quando escolhidos. Continua no máximo 3 vozes. O texto do encarte ainda cita os instrumentos padrão |
| "O que estou ouvindo?" visível | §5 (decisão 15/11) | **Feito** | C (pediu), arquivos da B | Botão destacado no rodapé + seta na borda direita + tecla L (sem botão no topo). Primeira visita: brilham após a introdução e um balão aparece ao lado do rodapé (escondido no celular). **Celular:** a gaveta deixa uma faixa de 40 px à esquerda com a seta visível; segue o dedo (arrastar para a direita fecha, puxar a seta para a esquerda abre; `useDrawerSwipe` em `Panels.jsx`); a seta fica ao lado do gráfico, não no meio da altura |
| Nada se sobrepõe na tela | §5.3 | **Feito** | C (pediu), arquivos da B | `cameraFrame` em `src/scene/layout.js` dimensiona o globo pelo tamanho real da janela, longe da data, dos cartões, do gráfico e do rodapé; tela em pé usa o layout empilhado (gráfico centralizado e menor, valor e Mute na mesma linha nos chips, globo usando a largura toda). Verificado em 1920×1080, 1440×900, 1366×768, 1280×800, 1024×768, 768×1024, 390×844 e 360×740, com legenda, balão e menu abertos |
| Pipeline reproduzível | §7.5 | **Feito** | A | `npm run pipeline:sst`, `pipeline:lightning`, `pipeline:nightlights`, `pipeline:aerosols`, `pipeline:sealevel`, `pipeline:covers`, com testes (`npm run test:pipeline`). Nenhum pipeline escreve `public/tracks/index.json` (ordem do Records, editada à mão) |
| Abertura simples (tela preta + descida 3D) | §5.2 | **Feito** | B | "Put on headphones." + pedido de idioma; clicar EN/PT/ES inicia; volta à página pula a descida; "Replay opening" no About |
| Teste com usuários | §9 | **Feito (rodada 1)** | C | **15/11, no evento: 5 pessoas sem ver a tela, só música (2 com deficiência visual + 3 de olhos fechados): 5 de 5 ouviram o mar subir; 3 de 5 acertaram a estação mais quente das águas do norte.** A divisão por grupo da tarefa 2 não foi anotada aqui. Próximo: Dorina Nowill, Instituto Benjamin Constant, Laramara. Protocolo e ficha em [`docs/teste-usuarios.md`](docs/teste-usuarios.md) (15/11): grupo A (cegos/baixa visão) e B (olhos fechados) separados, só música, 2 tarefas com resposta conhecida. Contatar Dorina Nowill, Instituto Benjamin Constant, Laramara (Q3). **Nunca simular resultado** |
| Site publicado + versão 2D | §10 | **Feito** | B | GitHub Pages; 2D automática sem WebGL (`?flat=1` força) |
| Vídeo (até 30 s) | §10 | **Parcial** | C | Roteiro pronto em [`docs/roteiro-video.md`](docs/roteiro-video.md) (trailer de 29,0 s; a trilha é o próprio app). Falta: gravar N3 (F2–F9) e S8, gerar V5 e V3, capturar o app (T1–T8), editar e enviar. Sem teste real, a fala F7 usa a versão B (43,3 milhões de pessoas cegas). **Aviso à frente C (Lucas Souza):** roteiro escrito pela frente A a pedido do Lucas Valadares; mudanças são bem-vindas, registrando no direcionamento §10 |
| Página do projeto | §10 | **Parcial** | C | Texto de todos os campos pronto em [`docs/project-page.md`](docs/project-page.md) (15/11, frente A a pedido do Lucas Valadares). Falta: link da demo, colar as References e **clicar "Submit for Judging" até 23:59 de 15/11** (regras no direcionamento §10) |
| References | §10, §7.3 | **Parcial** | C | `si-e-referencias.md` em dia com os cinco discos, a voz clonada e a fonte do número de 43,3 milhões (15/11). Os 76 MP3 de voz e efeitos têm o metadado "AI-generated…: ElevenLabs" (conferido). O About agora credita a narração como voz de IA (antes só os efeitos; `strings.js`, aviso à frente C). Falta: marca d'água nos planos do Veo do vídeo, se entrarem |
| README | §10 | **Parcial** | todos | Reescrito para a fatia SST; atualizar a cada faixa |

## 3. P1 — Fortalece (só depois do P0 pronto)

| Item | Ref. | Status | Frente | Observação |
|---|---|---|---|---|
| Explorar | §5.6 | **A fazer** | B | Funcionar sem fone; áudio espacial é bônus |
| Aerossóis (4ª faixa) | §8, Q2 | **Feito** | A (dados, música, textos), B (app; feito pela A) | Dados em `public/tracks/aerosols/` (`npm run pipeline:aerosols`), música em `src/music/tracks/aerosols.js` (fumaça = cordas graves, poeira = marimba, sal = glockenspiel; sulfato não toca, Q2), textos em `src/i18n/tracks/aerosols.js`. **No app (15/11, arquivos da B):** `TRACK_VIEW`/`TRACK_TEXT` em `src/state/tracks.js` (flash na cor da legenda de cada tipo; "Ouvir a legenda" = 6 faixas de cada voz de sul a norte), chips em % do mais forte do tipo (`strength` em `src/lib/format.js`, texto por extenso no leitor de tela), data com dia ("19 AUG 2025"), legenda categórica com texto alternativo, sem gráfico (instante), menu de instrumentos. **Marcos por lugar** em `controller.js` (`placeMarkers`, `crossedLon`): a fala toca quando a agulha cruza a longitude, só com o narrador livre; encerramento depois dos 3 lugares e de 4 voltas. Coluna vazia corrigida para `lats × layers`. Verificado no navegador (poeira, sal e encerramento dispararam; sem erros). **C:** gravar as 5 falas (`prompts-assets.md` §2.5); até lá, voz sintetizada |
| Capas "vinil de dados" | §5.4 | **Feito** | A (gerar), B (mostrar) | `scripts/pipeline/cover.py` (`npm run pipeline:covers`; cada pipeline também roda): disco visto de cima, ângulo = longitude, 3 bandas (norte / trópicos / sul), uma volta do sulco por passo, cor na paleta da faixa. Entra no Records sem mudar código (mesmo `cover.jpg`). **B:** o disco decorativo em CSS que sai da capa pode virar o próprio disco de dados, se quiser |
| Modo Audio-first (tecla A) | §5.8 | **A fazer** | B | |
| Efeitos S1–S7 | §7.2 | **Parcial** | C (gravar), B (tocar) | No site: `public/sfx/` (glass-tap e record-swap normalizados). Ligados: S7 abertura, S4 prato, S1/S3 agulha, S2 cama de vinil, S5 troca de disco, S6 tap nos botões. Micro-animações de UI no mesmo passe. Em 15/11 os arquivos não carregavam (o motor pedia a URL `undefined` e caía nos sons sintetizados); corrigido em `engine.js` (frente A, com aviso à B). Falta **aprovação de ouvido** do time |
| Faixa bônus nível do mar | §8, §5.4 | **Feito** | A (dados, música, textos), B (app; feito pela A) | Dados em `public/tracks/sea-level/` (`npm run pipeline:sealevel`): nível lido da barra azul na régua do vídeo da NASA (900 passos, jan/1993–dez/2023, +11,5 cm no máximo), vídeo 1080/720 (30 s), capa. Música em `src/music/tracks/seaLevel.js`, textos em `src/i18n/tracks/seaLevel.js`. **No app (15/11, arquivos da B):** escotilha = `Porthole` em `src/scene/Globe.jsx` (disco de vídeo do tamanho aparente do globo, aro de cromo; o globo some atrás e escurece na troca; meridiano e flashes escondidos em `Needle.jsx`; arrastar desligado), 2D com o vídeo num círculo (`FlatStage.jsx`, `styles.css`), chips "+6,4 cm" / "+6 cm", gráfico por ano em cm, legenda em som (cordas de 0 a 11 cm e o sino). A data só anima a cada ano em discos rápidos (`Hud.jsx`), senão o mês piscava. A 1×: 30 s por volta (Q1). **C:** gravar as 4 falas (`prompts-assets.md` §2.5); até lá, voz sintetizada |

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
| E1 | **Feito** | A | SST, raios, luzes noturnas, aerossóis (16:9 esticado de 180° W, polo a polo) e nível do mar (régua do vídeo, escotilha 2D fora do globo); §14.1 |
| E2 | **Feito** | — | VSCO 2 CE (CC0) em uso |
| E3 | **Parcial** | B | Falta FPS em aparelho real |
| E4 | **A fazer** | A | CO₂ DYAMOND (câmera móvel) |
| Q1 | **Parcial** | B | Ponto de partida: 10 s por volta, vídeo a 1×. Validar de ouvido |
| Q2 | **Feito** | A | 3 vozes: o sulfato (36% do mapa) fica no globo mas não toca. Volta com uma linha se o teste de ouvido pedir |
| Q3 | **A fazer** | C | Quantos testadores e quando |
| Q4 | **Feito** | C | Voz clonada (PVC) do Lucas Souza, registrada no direcionamento §7.2 |
| Q5 | **Parcial** | B | S2 no site como cama; sintetizado só se o arquivo falhar. Falta validar nível de ouvido. Achado: com faixas largas pelo menos 4 de 6 notas sempre soam (R5 quase não ocorre) |

## 6. Assets de IA para o pitch (podem andar em paralelo, §16)

| ID | Status | Frente |
|---|---|---|
| V5 e V3 (Veo, trailer) | **A fazer** (prompts em `docs/roteiro-video.md` §5; a imagem do V2 só como referência; V4 reserva; V6 e o vídeo do V2 não são mais necessários) | C |
| S1–S7 (efeitos) | **Parcial** (gerados; falta aprovar de ouvido) | C |
| S8 (impacto grave, só no vídeo) | **A fazer** (prompt em `docs/roteiro-video.md` §6) | C |
| N1 (falas da UI) | **Feito** (gravadas e tocando no app) | C |
| N3 (narração do pitch) | **A fazer** (texto e ajustes em `docs/roteiro-video.md` §4) | C |

## 7. Verificações pendentes (três faixas)

- [ ] Aprovação de ouvido do som por alguém com formação musical (§6.1), nas cinco faixas e na "Legenda em som".
- [ ] Narração de aerossóis e nível do mar gravada (frente C); a fumaça dos aerossóis ainda não foi ouvida disparando no navegador (só poeira, sal e encerramento).
- [ ] Fluidez em notebook comum e em celular real (E3, R2), incluindo a troca de faixa.
- [ ] Revisão dos textos do encarte e da narração pelo time (`src/i18n/tracks/`).
- [ ] Leitor de tela real (VoiceOver ou NVDA) do começo ao fim, com uma troca de faixa (§17.2).
- [ ] Contraste do vidro medido (R10).

## 8. Próximos passos sugeridos (em paralelo, um por frente)

1. **A:** revisar os textos das cinco faixas com o time; E4 (CO₂); script aberto para qualquer vídeo do SVS (P2).
2. **B:** medir FPS e testar com leitor de tela em aparelho real; P1: ligar aerossóis e nível do mar (a lista do que falta está em cada linha acima), Explorar, Audio-first.
3. **C:** contato com os testadores (prazo longo: começar já); ouvir e aprovar S1–S7; gravar as falas de aerossóis e nível do mar (`prompts-assets.md` §2.5); atualizar `si-e-referencias.md` com raios e luzes no app.
