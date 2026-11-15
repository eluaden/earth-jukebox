# Fatia SST — desenho

> Primeira fatia do P0 de [`direcionamento.md`](../../direcionamento.md): o app novo funcionando de ponta a ponta com **uma** faixa, temperatura do mar (SVS 3912).
> Aprovado em 15/11/2026. Resultados das explorações E1 (SST), E2 e E3: direcionamento §14.1.

## 1. Intenção

Provar o conceito central ("a Terra é o disco") com som e visual de verdade antes de replicar para raios e luzes noturnas. O time ouve, corrige o rumo e só então as outras faixas entram. Se o som ou o visual estiverem errados, o erro aparece em uma faixa, não em três.

## 2. Metas, não-metas e anti-metas

| Metas | Não-metas (fica para depois) | Anti-metas (falha mesmo funcionando) |
|---|---|---|
| Globo 3D vestido com o vídeo da NASA, agulha lendo o meridiano, som com samples reais | Raios, luzes noturnas, aerossóis, nível do mar | Qualquer valor que não venha do frame da NASA |
| Valores lidos do frame original pela legenda oficial, por script reproduzível | Explorar, Comparar, Audio-first, exportar álbum | Som embolado: mais de 3 vozes, 2 notas por voz ou 6 no total |
| Abertura "Put on headphones." + descida 3D | Narração ElevenLabs (os arquivos ainda não existem) | Elemento de tela fora da lista fechada (§5.2.1) |
| Liner notes, Records (uma capa), acessibilidade de base, versão 2D sem WebGL | Teste com usuários, vídeo do pitch | Cor forte que não seja do dado da NASA |

## 3. Abordagens consideradas

| Abordagem | Troca | Decisão |
|---|---|---|
| **A. Leitura offline (escolhida):** script lê os frames originais e grava uma grade de temperaturas; o navegador só consulta a grade | Precisa rodar o script antes do build; a grade tem ~1 leitura por dia | **Escolhida.** Exata, reproduzível (§7.5), testável (§17.2) |
| B. Leitura ao vivo no navegador, pixel do vídeo sob a agulha | Lê o frame "atual" de verdade, sem arquivo extra | Descartada: o vídeo web é comprimido (122 MB → 20 MB, croma pela metade); as cores mudam e a temperatura sai errada |
| C. Manter o app atual (JS puro, canvas 2D) e adaptar | Menos código novo | Descartada: o direcionamento troca o stack (§11) e o produto (§12) |

Mapeamento musical: **temperatura → altura** (aprovado; direcionamento §2.3 e §6.2). Latitude → altura deixaria cada faixa com nota fixa e a temperatura só no volume.

## 4. Restrições

- Stack do §11: React + Vite, three.js via React Three Fiber, drei, postprocessing, GSAP, Tone.js. Site estático no GitHub Pages (`base: './'`).
- Só os arquivos da NASA dos recursos do desafio (direcionamento §14, regra de E1).
- Samples com licença livre (E2): VSCO 2 CE (CC0). Na implementação ficou o piano de armário do VSCO (CC0); o Salamander não foi usado.
- Regras de IA de [`si-e-referencias.md`](../../si-e-referencias.md): textos científicos do encarte só repetem o que a página da NASA diz ou o que o próprio dado mostra; o time revisa.

## 5. Desenho

### 5.1 Pipeline de dados (`scripts/pipeline/sst.py`, Python + numpy + Pillow + ffmpeg)

Entradas (baixadas por `npm run fetch-sources`, em `sources/`, fora do git): `ecco2_sst_flow.mp4`, `sst_ecco2_cbar.png`, `flat_ecco2_dates.txt`.

1. **Legenda → tabela matiz/temperatura:** linha 47 de `sst_ecco2_cbar.png`, x de 15 a 291 = 0 a 32 °C, linear. Matiz em graus, com valores acima de 300° tratados como negativos (vai de 228° a −6°, monótono).
2. **Frames lidos:** 1 a cada 6 (334 passos, ~1 por dia de modelo), decodificados pelo ffmpeg em RGB cru.
3. **Pixel válido:** saturação > 0,45, brilho > 0,22, matiz dentro da faixa da legenda (±8°). Temperatura = interpolação do matiz na tabela.
4. **Grade:** células de 2° × 2° (180 longitudes × 90 latitudes). Valor = média das temperaturas válidas se houver ≥ 3 pixels válidos; senão, vazio. Célula vazia em > 80% dos passos = terra (sempre vazia). Nas outras, vazio é preenchido pelo último valor válido da mesma célula (e o primeiro, pelo próximo). Isso vai declarado nos limites.
5. **Saída** em `public/tracks/sst/`:
   - `grid.bin`: `uint8[passo][lat][lon]`, lat 0 = 90–88° N, lon 0 = 180–178° W; valor `q` = round(T / 32 × 254), 255 = sem dado.
   - `track.json`: metadados, data ISO de cada passo, legenda amostrada a cada 1 °C (para "Hear the legend" e a barra no encarte), marcos calculados do dado (passo em que as águas do norte e as do sul têm a maior média do ano), fonte.
   - `video-1536.mp4` (H.264, CRF 33) e `video-1024.mp4` (CRF 30), 30 fps, sem áudio, `faststart`.
   - `legend.png` (cópia da legenda oficial), `cover.jpg` (um frame, para Records), `poster.jpg` (primeiro frame).
6. **Checagens impressas e testadas:** a legenda lida pelo próprio leitor volta à sua temperatura com erro < 0,3 °C; em 40° N/S março e setembro invertem (verão de cada hemisfério).

### 5.2 App

- **Relógio:** o `currentTime` do vídeo é o relógio do dado (frame = ⌊t × 30⌋, passo = ⌊frame / 6⌋). A rotação do globo é um relógio separado que só avança tocando (~10 s por volta, Q1), para não pular quando o vídeo dá a volta.
- **Globo:** esfera com a textura de vídeo, sem iluminação de cena: no centro, onde a agulha lê, as cores são exatamente as da legenda. Para dar volume, só a borda escurece e a terra cinza (que não é dado) fica mais escura; nada disso muda os valores lidos, que vêm da grade. Halo azul de atmosfera (shader de borda) e bloom leve. Gira como vinil (horário visto de cima): a agulha percorre Pacífico → Américas → Atlântico. Longitude sob a agulha = função pura da rotação (testada).
- **Agulha:** braço fino de cromo em J (reto, curvando só perto da cápsula), com pivô fixo fora do prato, no alto à direita e sempre dentro da tela; o braço gira em torno do pivô como um braço de toca-discos. Poses: estacionado fora do disco (abertura), pousado e levantado (Records aberto: sobe em direção à câmera e desvia um pouco da linha, para a subida ficar visível de frente). A ponta pousa no meridiano voltado para a câmera, desenhado como linha de luz só na superfície. Cada nota acende um ponto na linha, na latitude da sub-faixa, **na cor da legenda da NASA para aquela temperatura** (decisão minha: o §5.1 diz que as cores fortes vêm do dado; o mock também usa a cor do dado).
- **Prato:** anéis finos concêntricos girando devagar; arco âmbar = progresso do ano, arrastável (muda o tempo do vídeo).
- **Som** (Tone.js, pulso de colcheia a 84 BPM):
  - Coluna sob a agulha → 3 zonas, cada uma com 2 sub-faixas: norte 45–80° N e 23,5–45° N (cordas); trópicos 0–23,5° N e 23,5° S–0 (piano); sul 23,5–45° S e 45–80° S (glockenspiel). Valor da sub-faixa = média das células de oceano; sem oceano = silêncio.
  - Temperatura → grau de uma pentatônica maior de Dó em 16 notas (0 °C = grau 0, 32 °C = grau 15, ~2,1 °C por grau), igual para as 3 vozes; cada instrumento soa na sua oitava.
  - Cordas sustentam e só rearticulam quando o grau muda; piano arpeja as 2 sub-faixas em colcheias; glockenspiel em semínimas, mais suave. Mais quente → mais brilho (filtro passa-baixa e velocidade).
  - Tetos (§6.3) garantidos pela função de mapeamento e testados: 2 notas por voz, 6 no total por pulso.
  - Fundo: estalo de vinil sintetizado muito baixo e contínuo (Q5), declarado no encarte; só soa com a agulha pousada e tocando (agulha levantada = disco em silêncio). Reverb e limitador no master. Ducking de −10 dB durante a narração.
  - Mudo e solo por voz.
- **Narração:** legenda de uma linha sob a data. Falas: intro (na primeira vez), 2 marcos calculados do dado (só na primeira volta do ano) e encerramento. Se existir `public/voice/<idioma>/sst-<id>.mp3` toca o arquivo; senão usa a fala do navegador como reserva. Roteiro das falas vai para `prompts-assets.md` (N2) para o time gerar no ElevenLabs.
- **Tela** (lista fechada §5.2.1): marca, About, data ("MAR 2007"), legenda, 3 chips ("Strings · Northern waters", valor médio da zona em °C, M, S), rodapé (play/pause · nome · Records · Liner notes · Listen · EN · PT · ES), agulha, Records (uma capa: frame + nome + período), Liner notes (§5.5, sem "Download album").
- **Abertura:** tela preta "Put on headphones." → clique (ou Enter) → descida da câmera (GSAP, ~3,5 s) → agulha pousa com um "thump" sintetizado → música começa. Quem volta pula a descida (o clique continua, por causa da política de áudio); "Replay opening" no About.
- **Acessibilidade de base:** teclado (Espaço play/pause, ←/→ passo a passo, R Records, L Liner notes, V anuncia os valores atuais, Esc fecha), foco visível, canvas com descrição oculta, `aria-live` para a narração e para os valores sob pedido, `prefers-reduced-motion` (sem descida, anéis parados), `prefers-reduced-transparency` (vidro vira sólido), contraste mínimo, `lang` do documento acompanha o idioma.
- **Versão 2D:** sem WebGL, o vídeo plano aparece com uma linha vertical varrendo; mesmo som e mesma UI.
- **Celular:** vídeo de 1024 quando a tela é pequena ou o ponteiro é de toque; chips viram uma fileira acima do rodapé.
- **Textos:** EN / PT / ES num só arquivo de strings.

### 5.3 O que sai

`src/` atual inteiro, `index.html` atual, faixas TEMPO, Dixie Fire e VIIRS, `public/earth.jpg`. As pastas de raios e nível do mar em `public/tracks/` ficam paradas até as próximas fatias.

### 5.4 Também nesta fatia

- `scripts/fetch-sources.mjs` baixa também a legenda e a tabela de datas.
- `scripts/pipeline/samples.py`: baixa só os samples usados (VSCO 2 CE e piano) e converte para MP3 em `public/samples/`.
- README reescrito para o app novo; `si-e-referencias.md` atualizado (fontes, samples, bibliotecas).
- Testes: Vitest para longitude sob a agulha, coluna → zonas, temperatura → nota (latitude e valor conhecidos geram a nota esperada, §17.2) e tetos de notas; teste Python da legenda e da leitura de referência.

## 6. Fica com quem constrói

Formas exatas do braço da agulha, curvas de animação, valores finos de mixagem e reverb, tamanho e posição dos elementos na tela (seguindo o mock 2 e o §5.3), texto exato das strings de interface.

## 7. Verificação da fatia

- `npm test` e o teste Python passam.
- No navegador: abertura, globo girando com o vídeo, agulha, chips com valores mudando, som com 3 vozes, Records, Liner notes, idioma, teclado; versão 2D forçada.
- Desempenho (E3): fluidez em notebook comum; o teste em celular fica registrado como pendente se não houver aparelho.
- O som precisa de aprovação de ouvido de alguém do time com formação musical (§6.1). Isso fica pendente e é dito no fim.
