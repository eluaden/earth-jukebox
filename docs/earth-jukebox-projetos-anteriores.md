# Earth Jukebox — Projetos anteriores do Space Apps que usaram som

> Documento de contexto do time. Compilado em 15/11/2026, durante o hackathon.
> Objetivo: entender a fundo cada projeto premiado ou finalista que usou som, como era a interface de cada um e o que o fez se destacar, para posicionar o Earth Jukebox com um diferencial claro.

---

## Sumário

1. Como os resultados foram verificados
2. Visão geral
3. Vencedores globais
4. Finalistas globais e menções honrosas
5. Indicados e vencedores locais (referência)
6. Vizinho relevante sem som central: Connected Earth Museum
7. Padrões: o que os juízes premiaram
8. Onde o Earth Jukebox se posiciona
9. Fontes e limitações

---

## 1. Como os resultados foram verificados

- **2018 e 2022:** páginas oficiais de resultados globais nos sites arquivados do Space Apps.
- **2023 e 2024:** selos oficiais (`nominationBadges` e `awardBadges`) da API pública do Space Apps. Foram varridos todos os 189 times do desafio de som de 2023 e os 496 do desafio de música de 2024.
- **Descrições e UI:** página do projeto no Space Apps, README dos repositórios, sites e matérias de imprensa.
- Cada descrição de interface diz se está **documentada** (vista numa fonte) ou **inferida** (deduzida a partir do que existe). Quando não há registro público, isso está escrito.

**Correções em relação a levantamentos anteriores:**

| Projeto | O que se dizia | O que os registros oficiais mostram |
|---|---|---|
| Spacetune (Team Artemis, 2022) | Finalista global | Só **Global Nominee**. O "Artemis" da lista de finalistas de 2022 é outro time, de outro desafio |
| Cosmic Keys (Team Eklavya, 2023) | Finalista global | O time **não tem nenhum selo** na base oficial. A alegação vem só do portfólio do autor, e o repositório público foi criado em março de 2026 |
| Aria EarthMOOG (2018) | Indicado global | **Finalista global** (Best Use of Data) |
| 2024 | Nenhum projeto de som em destaque | Um finalista (**Saraquatys in G Major**, Campinas) e uma menção honrosa (**Interstellar Orchestra**) |

---

## 2. Visão geral

| Ano | Projeto | Desafio | Resultado oficial | Papel do som | Formato |
|---|---|---|---|---|---|
| 2018 | **SongSAT** (Salinity, Waterloo) | Artify the Earth | **Vencedor global**: Most Inspirational | Sonificação de imagens de satélite da Terra | Algoritmo + site com mapa |
| 2018 | **Aria EarthMOOG** (Pasadena) | Artify the Earth | Finalista global: Best Use of Data | Sonificação ao vivo de mapas da Terra | App web de mapa |
| 2018 | **Deep Space Musical** (Toronto) | On the Shoulders of Giants | Finalista global: Most Inspirational | Sonificação de imagens do Hubble | Peça musical |
| 2020 | **The Masked Scales** (Toronto) | The Art of It All (COVID-19) | **Vencedor global**: Most Inspirational | Sonificação de sensores caseiros + VIIRS | Musical em vídeo |
| 2021 | **Bioshi / SIMACT** (Panamá) | Space for Change | **Vencedor global**: Most Inspirational | Sensores acústicos (som como detector, não sonificação) | Proposta de sistema |
| 2022 | **Earth, Wind & Flare** (Boston) | Creative Data Display (Parker Solar Probe) | **Vencedor global**: Art & Technology | "Música do vento solar" a partir do índice Kp | Painel físico de LED |
| 2022 | **MIMBI** (Assunção) | Turning STEM into STEAM | **Vencedor global**: Best Storytelling | Trilha sonora original e efeitos | História interativa web |
| 2022 | **Aussie Astronauts** (Austrália) | The Art in Our Worlds | Finalista global | Imagem → MIDI | Galeria web + faixas |
| 2023 | **Arcobaleno** (Itajubá, BR) | Immersed in the Sounds of Space | **Vencedor global**: Global Connection | Sonificação de imagens 2D/3D | Método + experiência sonora |
| 2023 | **Ten Hours Of Space Music For Sleeping** (Taipei) | Immersed in the Sounds of Space | Finalista global | Sonificação (detalhes não públicos) | — |
| 2023 | **Renaissance Quintet** (Boston) | Immersed in the Sounds of Space | Menção honrosa de finalista global | Sonificações da NASA + constelações | Espelhos e porta-retratos físicos |
| 2024 | **Saraquatys in G Major** (Campinas, BR) | Symphony of the Stars | Finalista global | Música + imagens do Webb (detalhes não públicos) | Colagem audiovisual |
| 2024 | **Interstellar Orchestra** (Meca) | Symphony of the Stars | Menção honrosa | Música + análise de imagens do Webb | Plataforma de realidade virtual |
| 2025 | — | — | Nenhum projeto de som entre vencedores | — | — |

Leitura:

- **Seis vencedores globais entre 2018 e 2025 tiveram som** como peça central ou relevante. Três ganharam **Most Inspirational** (SongSAT, Masked Scales, Bioshi); os outros levaram Art & Technology, Best Storytelling e Global Connection. Nenhum ganhou Best Use of Data ou Best Use of Science.
- **Só dois projetos sonificaram imagens de satélite da Terra** e chegaram ao nível global: SongSAT e Aria EarthMOOG, ambos de 2018. O resto trabalhou com espaço, com dados locais ou com som de trilha.
- **Dois grupos aparecem repetidas vezes.** Os irmãos Nath, de Toronto, fizeram Deep Space Musical (2018) e Masked Scales (2020). Um grupo de estudantes de Boston (HSSBoston) fez Earth, Wind & Flare (2022) e Renaissance Quintet (2023). São times que reaproveitam a fórmula ano após ano.

---

## 3. Vencedores globais

### 3.1 SongSAT — Salinity (2018, Most Inspirational)

| Campo | Valor |
|---|---|
| Local | Waterloo, Ontario, Canadá · 4 membros |
| Desafio | Artify the Earth: usar imagens da Terra da NASA para criar arte ou uma ferramenta de arte |
| Dados | Landsat-5 TM; cobertura do solo MODIS (Global Land Cover Facility); mapa de montanhas da UNEP |
| Stack | Python (numpy, PIL, midiutil, GDAL), MuseScore com soundfonts de terceiros |
| Links | [Projeto](https://2018.spaceappschallenge.org/challenges/help-others-discover-earth/artify-earth/teams/salinity-1/project/) · [Código](https://github.com/mcvittal/SongSAT) · [Código do site](https://github.com/mcvittal/mcvittal.github.io) · songsat.ca (fora do ar) |

**O que era.** O lema era "From Bands to a Band": das *bandas* espectrais do satélite para uma *banda* de música. O algoritmo transformava uma imagem de satélite numa música curta com uma identidade reconhecível para cada tipo de paisagem. O público-alvo era duplo: pessoas com deficiência visual e músicos com bloqueio criativo.

**Como funcionava.**

1. **Classificação:** sorteava 400 pontos da imagem e consultava a classe de cobertura do solo MODIS em cada um. Se a maioria caísse em montanha (pelo mapa da UNEP), a imagem virava "montanha"; senão, valia a classe dominante do MODIS.
2. **Tema por paisagem:** cada classe tinha uma escala, um conjunto de ritmos e um instrumento.

| Paisagem | Escala | Acompanhamento | Instrumento (MuseScore) |
|---|---|---|---|
| Água / costa | Pentatônica | Oitavas alternadas | Soundfont de terceiros |
| Montanha | Clusters de semitons + variação da menor | Ritmo sincopado "agressivo" | Soundfont de terceiros |
| Floresta | Variação da maior | Baixo arpejado em semicolcheias | Harpa |
| Campo | Variação da maior | Oitavas alternadas | Soundfont de terceiros |

3. **Melodia:** o valor de cada pixel (0–255) módulo o número de notas da escala virava o grau da escala. Uma regra impedia saltos maiores que uma quinta justa: de C para A, descia uma terça em vez de subir uma sexta.
4. **Saída:** arquivo MIDI, depois orquestrado à mão no MuseScore. A versão posterior do site cita cinco paisagens, com o Ártico incluído.

**UI (documentada).** A página inicial tinha o título "SONGSAT — FROM BANDS TO A BAND" e um botão "TRY LIVE DEMO". O demo era um **mapa Leaflet com marcadores de locais**. Um modal de boas-vindas dizia "Explore the map and click on any of the location markers to hear a sample output!". Ao clicar num marcador, tocava um MP3 pré-gerado, com um painel "Audio Controls" de Pausar e Parar. A música **não era gerada no navegador**: o mapa era um tocador de amostras.

**O que o destacou.**

- **Identidade sonora por paisagem.** Floresta e montanha soavam diferentes de propósito, então dava para "reconhecer o bioma" de ouvido. O som carrega uma informação clara, mesmo que grosseira.
- **Musicalidade imposta por teoria.** Escalas por tema e a regra de "sem saltos maiores que uma quinta" evitavam o ruído típico de "pixel vira nota".
- **Duplo público** com uma história simples: cegos *e* músicos.
- **Código aberto** e site próprio, o que dava cara de produto.

**Fraquezas.** Dentro de cada tema, a melodia vinha de `pixel mod n`, sem relação com nenhuma grandeza física. Não havia interação nem geração em tempo real.

---

### 3.2 The Masked Scales — Artash e Arushi Nath (2020, Most Inspirational)

| Campo | Valor |
|---|---|
| Local | Toronto, Canadá · 2 irmãos (14 e 10–11 anos) |
| Desafio | The Art of It All: expressar em arte a experiência de viver a pandemia |
| Dados | Sensores caseiros (luz, PM2.5, microfone, câmera Intel RealSense); NASA VIIRS (luzes noturnas, via Worldview); casos de COVID-19 em Toronto |
| Stack | Arduino, Python (TensorFlow/Keras para contar veículos), [Musical Algorithms](http://musicalgorithms.org/4.1/) |
| Links | [Projeto](https://covid19.spaceappschallenge.org/challenges/covid-challenges/art-it-all/teams/the-masked-scales/project/) · [Vídeo de 30 s](https://www.youtube.com/watch?v=l2WqWKDlq9c) · [Matéria da NASA](https://www.nasa.gov/general/nasa-space-apps-covid-19-challenge-winners-share-stories-of-innovation/) |

**O que era.** O "Lockdown Musical": uma peça musical que conta, com dados, como a rua dos dois mudou durante o lockdown. Tudo começou numa observação das crianças: passaram a ouvir mais pássaros e menos carros.

**Como funcionava.**

| Variável | Fonte | Som |
|---|---|---|
| Intensidade de luz (dia/noite) | Sensor de luz | Marimba |
| Emissões | Sensor PM2.5 | Vibrafone |
| Ruído de rua | Microfone | Piano |
| Casos de COVID-19 | Prefeitura de Toronto | Flauta |
| Luzes noturnas da cidade + contagem de veículos | NASA VIIRS + câmera com ML | **Andamento**: mais luz deixava a música mais lenta |

Os sensores geraram milhões de leituras, que tiveram de ser reduzidas a médias. A conversão para som foi feita no Musical Algorithms, depois de testar Reaper e Audacity e de "jams" no piano e no violão para escolher os instrumentos.

**UI.** Não havia interface interativa. A entrega era um **vídeo curto** com a música, gráficos dos dados e fotos do instrumento caseiro (documentado: vídeo de 30 s e página do projeto).

**O que o destacou.**

- **História humana fortíssima:** duas crianças, presas em casa, constroem um instrumento científico para entender a própria rua.
- **Um instrumento por variável.** É fácil de explicar e de ouvir, e já é uma "legenda sonora" sem precisar de texto.
- **Dados próprios + dados da NASA:** o VIIRS conecta o local ao satélite.
- O resultado em números (tráfego caiu quase pela metade, poluição cerca de 40%, ruído cerca de 30%) dava substância à emoção.

---

### 3.3 Bioshi / SIMACT (2021, Most Inspirational) — som como sensor

| Campo | Valor |
|---|---|
| Local | Universidad Latina de Panamá · 4 estudantes de engenharia biomédica |
| Desafio | Space for Change |
| Links | [Projeto](https://2021.spaceappschallenge.org/challenges/statements/space-for-change/teams/bioshi/project/) |

**O que era.** Uma proposta de sistema de alerta contra o desmatamento ilegal no Darién, motivada por denúncias de comunidades indígenas. Combinava imagens de satélite (taxa de desmatamento) com **sensores acústicos e sísmicos** enterrados (sismômetro Reftek 151B), que detectariam motosserras e máquinas. Previa 20 sensores a cada 8 km, rede LoRaWAN, alertas em tempo real, IA para distinguir sons e, mais tarde, drones e um satélite panamenho.

**UI.** Nenhuma interface documentada. Era uma proposta técnica e de implantação.

**Relevância para nós.** Baixa como técnica, porque o som entra como **entrada** e não como **saída**. Alta como padrão de prêmio: Most Inspirational premia **comunidades vulneráveis com voz**.

---

### 3.4 Earth, Wind & Flare (2022, Art & Technology)

| Campo | Valor |
|---|---|
| Local | Boston, EUA (3 membros) + 1 no Japão · estudantes |
| Desafio | Creative Data Display with the Parker Solar Probe |
| Dados | Imagens da coroa K da Parker Solar Probe; vento solar do satélite ACE (via NOAA); índice K nos EUA (NOAA) e no Japão (Kakioka); índice Kp planetário (NOAA/GFZ); próxima passagem da PSP (JHU APL); clima da Terra (OpenWeatherMap) |
| Stack | Raspberry Pi, matriz RGB de LED 64×64, sensor de movimento, caixa Bluetooth, Python (rpi-rgb-led-matrix, Pillow, PyAudio) |
| Links | [Projeto](https://2022.spaceappschallenge.org/challenges/2022-challenges/creative-data-display/teams/earth-wind-flare/project) · [Repositório](https://github.com/HSSBoston/earth-wind-and-flare) · [Resumo em slides](https://docs.google.com/presentation/d/1-ZGbrkdS6af0Wx6mRLc8-YR0kJKUlLiomiPoth3ZvuA/) |

**O que era.** Um "painel do tempo" físico que mostra, lado a lado, o tempo da Terra e o **tempo espacial**, para que as pessoas aprendam a ler tempestades geomagnéticas como leem a previsão do tempo.

**Como funcionava o som.** O índice Kp é tradicionalmente desenhado nos "diagramas musicais de Bartels", que parecem uma partitura. A integrante que estudava piano e teoria musical num conservatório viu isso e decidiu "tocar" a partitura. Uma sequência de valores Kp era mapeada para **altura, duração e intensidade**, usando **tríades, armaduras de clave e escalas**. O espectador podia **trocar a tonalidade ou a escala** para mudar o "clima" da música.

**UI (documentada).**

- Painel de LED 64×64 dividido ao meio: **metade de cima com o clima da Terra** (temperatura atual, máxima e mínima de 24 h, umidade) e **metade de baixo com o clima espacial** (K nos EUA e no Japão, Kp, velocidade do vento solar, dias até a próxima passagem da PSP).
- Ícones de clima que mudam conforme as condições; valores de K e Kp coloridos pela **escala oficial da NOAA**.
- Animações GIF feitas a partir das imagens da coroa solar da PSP.
- **Liga sozinho** quando o sensor detecta alguém por perto e desliga quando a pessoa sai.
- A música do vento solar toca por uma caixa Bluetooth.
- Unidades duplas (°F/°C, mph/km/h), porque o time era internacional.

**O que o destacou.**

- **Objeto físico em espaço público**, pensado para escolas, bibliotecas e prefeituras, com um plano de "Space Weather Day".
- **O mapeamento tinha uma razão científica:** a partitura já existia na própria ciência (os diagramas de Bartels). Não é arbitrário, e isso é uma história ótima para contar.
- **Interação mínima e significativa:** trocar a escala muda a emoção sem mudar o dado.
- **Reprodutível:** o repositório tem lista de compras, diagramas de circuito e código pronto.

---

### 3.5 MIMBI (2022, Best Storytelling) — som como trilha

| Campo | Valor |
|---|---|
| Local | San Bernardino / Assunção, Paraguai · 1 pessoa (Luciano Santiviago) |
| Desafio | Turning STEM into STEAM |
| Stack | Construct 3, GitHub Pages, arte gerada por IA (Dream by WOMBO), Audacity |
| Links | [Projeto](https://2022.spaceappschallenge.org/challenges/2022-challenges/steam/teams/mimbi/) |

**O que era.** "Mimbi" significa "faísca" em guarani. Era uma história interativa em rima sobre o GuaraníSat-1, primeiro satélite do Paraguai, que ajudou a combater a doença de Chagas.

**UI (documentada).** Um jogo-história em **3 capítulos e um epílogo**, com interações de arrastar e soltar e um lançamento de foguete. Os fundos imitam a pintura abstrata paraguaia, com textura de tecido tramado. A **música de fundo foi gravada no violão** (instrumento tradicional do país) e os efeitos sonoros também foram caseiros: o "pop" dos botões é a voz do autor. A entrada era física: **panfletos com QR code** em seis comércios locais (butique, loja de brinquedos, supermercado, loja de ferragens, centro turístico e sorveteria), em espanhol e guarani.

**O que o destacou.**

- **Prova de alcance real:** mais de 300 pessoas jogaram nas primeiras 4 horas. É a única evidência de uso real em todos estes projetos.
- **Identidade cultural** em cada detalhe: idioma, violão, textura, pintura.
- O som não carrega dado, mas **cria pertencimento**.

---

### 3.6 Arcobaleno (2023, Global Connection)

| Campo | Valor |
|---|---|
| Local | Itajubá, MG (Unifei) · 5 membros: Talita Marçal Pereira, Thaís Ferreira Duarte, Vítor Brumano Andrade Cardinali, Lucas Vicentini dos Santos e Júlia Marques Guidolim |
| Desafio | Immersed in the Sounds of Space: criar um método para sonificar dados 3D da NASA (imagens hiperespectrais e "fly-throughs") |
| Links | [Anúncio da NASA](https://science.nasa.gov/directorates/smd/2023-nasa-international-space-apps-challenge-announces-10-global-winners/) · [AEB](https://www.gov.br/aeb/pt-br/assuntos/noticias/conheca-as-equipes-brasileiras-vencedoras-do-nasa-space-apps-challenge-2023) · [Inovai](https://inovai.org.br/equipe-da-unifei-vence-categoria-conexao-global-do-nasa-space-apps-challenge-2023/) · [Página do time](https://www.spaceappschallenge.org/2023/find-a-team/arcobaleno/) |

**O que era.** O nome é "arco-íris" em italiano. Um **método** para transformar imagens 2D e 3D em experiência sonora, para que pessoas cegas "percebam o seu entorno através do som" e explorem o cosmos. O time descrevia sua missão como "dar voz às imagens".

**Como funcionava (pelo que foi publicado).**

1. Separar a imagem em **camadas**.
2. Digitalizar cada camada.
3. Converter as cores **HSL** em notas musicais, associando cor a nota.
4. Gerar a representação sonora final, no **gênero musical escolhido pelo usuário**.

**UI.** **Sem registro público.** A página oficial do projeto não está mais acessível (só a do time), e não foi encontrado demo, vídeo nem repositório. Pela descrição, havia pelo menos uma escolha de gênero musical pelo usuário (inferido).

**O que o destacou.**

- **Inclusão como missão**, dita em primeira pessoa pela equipe ("permitindo que os cegos percebam o seu entorno").
- **Personalização:** o próprio time citava a escolha de gênero musical como diferencial.
- **"Método sistêmico":** valia para qualquer imagem, não só para uma peça.
- O prêmio Global Connection valoriza conectar pessoas pelo mundo; acessibilidade universal se encaixa nisso.

**Limite técnico.** O som vem da **cor** do pixel, não de uma grandeza física. É o ponto exato em que o Earth Jukebox é diferente.

---

## 4. Finalistas globais e menções honrosas

### 4.1 Aria EarthMOOG (2018, finalista global — Best Use of Data)

| Campo | Valor |
|---|---|
| Local | Pasadena, CA · 4 membros: Marlene Guzman, Jen Watanabe, Melissa Ugas e Orestis Herodotou |
| Desafio | Artify the Earth |
| Dados | Mais de 700 camadas do NASA GIBS (Global Imagery Browse Services) |
| Stack | React, OpenLayers (mapa), **Tone.js** (síntese), Tonal (teoria musical), Vibrant (cores dominantes), Chroma (cálculo de cor), Webpack |
| Links | [Projeto](https://2018.spaceappschallenge.org/challenges/help-others-discover-earth/artify-earth/teams/aria-earthmoog/project/) |

**O que era.** "The Earth has a Voice. Take a Listen." Um mapa interativo da Terra que **gera música ao vivo** enquanto você navega. O nome brinca com o sintetizador Moog: "Synthesize the Earth!".

**Como funcionava.** Enquanto o usuário arrastava e dava zoom, o app lia as **cores dos tiles** do mapa que chegavam ao navegador. Calculava propriedades como **luminância**, que virava nota numa escala, e extraía as **cores mais proeminentes** da cena e quanto elas variavam. A música, portanto, é **composta pelo gesto do usuário**.

**UI (documentada em parte).** Um mapa web em tela cheia com camadas do GIBS. A melodia "audível e visual" era criada conforme a interação; o mapa e o som respondiam juntos. O time também mostrou dois protótipos fora do navegador: **realidade aumentada no celular**, que respondia ao movimento, e uma **projeção imersiva dentro de uma cúpula geodésica**, com sensores de proximidade e gestos. A forma exata do seletor de camadas e dos controles não está documentada.

**O que o destacou.**

- **O usuário é o compositor:** explorar o mapa é tocar o instrumento.
- **Escala:** 700 conjuntos de dados disponíveis desde o primeiro dia, com arquitetura que facilita adicionar mais.
- **Visão de produto:** caso de uso para famílias (pais e filhos explorando juntos), roadmap de "remixar" camadas e versão para o cosmos.
- Foi finalista em **Best Use of Data**, o único projeto de som perto de um prêmio de dados.

**Limite.** A música vinha da **cor do tile**, não do valor medido pelo satélite.

---

### 4.2 Deep Space Musical (2018, finalista global — Most Inspirational)

| Campo | Valor |
|---|---|
| Local | Toronto · Arushi Nath (9 anos), Artash Nath (12) e o pai, Vikas Nath |
| Desafio | On the Shoulders of Giants (jogo com imagens do Hubble) |
| Links | [Projeto](https://2018.spaceappschallenge.org/challenges/universe-beauty-and-wonder/shoulders-giants/teams/deep-space-musical/project/) |

**O que era.** Um "musical do universo" em **três atos**, um por imagem icônica do Hubble:

| Ato | Imagem | Tema |
|---|---|---|
| 1 | Pilares da Criação | Nascimento das estrelas |
| 2 | Hubble Ultra Deep Field | Galáxias de estrelas |
| 3 | Supernova 1987A | Morte violenta de uma estrela |

**Como funcionava.** RGB convertido em tons de cinza, *pooling* 2×2 (média e máximo) para guardar as feições principais e conversão em frequências. Na SN 1987A, os pontos brilhantes viram agudos (os "lamentos de uma estrela perto do fim"), o fundo escuro vira silêncio e a música cresce até o "crescendo dos anéis".

**UI.** Nenhuma interface interativa. A entrega era a peça musical narrada (documentado).

**O que o destacou.** O **arco narrativo** (nascimento, vida e morte das estrelas) dá forma musical a um processo físico. Somado a crianças e acessibilidade, levou o People's Choice local. É o precursor direto do Masked Scales, que venceu dois anos depois.

---

### 4.3 Aussie Astronauts (2022, finalista global)

| Campo | Valor |
|---|---|
| Local | Austrália · 2 membros |
| Desafio | The Art in Our Worlds |
| Dados | Fotos da Perseverance (NASA Mars Rover API: Mastcam-Z, Navcam, Sherloc-Watson) |
| Stack | Jupyter/Anaconda, DALL-E 2, Python → MIDI, Anvil Studio, Audacity, Wix |
| Links | [Projeto](https://2022.spaceappschallenge.org/challenges/2022-challenges/art-worlds/teams/aussie-astronauts/) |

**O que era.** Uma galeria de arte gerada por IA, inspirada nas fotos de Marte, com uma faixa musical para cada obra, para que a arte fosse "experimentada por todos". Os estilos incluíam arte indígena australiana, abstrata, impressionista e pintura a óleo.

**Como funcionava o som.** O RGB da imagem virava parâmetros de MIDI: **vermelho para duração, verde para altura, azul para volume**. O MIDI era convertido em WAV e editado no Audacity.

**UI (documentada).** Site em Wix com uma galeria de imagens. **Ao passar o mouse sobre cada obra, aparecia o texto (prompt) que a gerou.** As faixas acompanhavam as obras. O time admitiu não ter conseguido fazer o app interativo de imagem para música a tempo.

**O que o destacou.** Intenção multissensorial explícita, temas humanos (solidão do primeiro astronauta em Marte, impacto climático, diversidade) e honestidade sobre o que ficou faltando.

---

### 4.4 Ten Hours Of Space Music For Sleeping (2023, finalista global)

| Campo | Valor |
|---|---|
| Local | Taipei, Taiwan |
| Desafio | Immersed in the Sounds of Space |
| Nome do projeto | "A Sonic Dash Through the Cosmos" |
| Outros prêmios | Medalha de ouro do evento local de Taipei (NT$ 50.000, prêmio da prefeitura) |

**O que se sabe.** Muito pouco é público: o time não publicou descrição e não foi encontrado repositório nem vídeo. O desafio de 2023 pedia a sonificação de dados 3D e de "fly-throughs" (vídeos de voo entre objetos espaciais). O nome sugere uma viagem sonora contínua pelo cosmos (inferido).

**UI.** Sem registro público.

**Por que importa.** Foi o **único finalista pleno** do desafio de som de 2023, além do vencedor Arcobaleno. Os juízes premiaram pelo menos dois projetos de sonificação naquele ano.

---

### 4.5 Renaissance Quintet (2023, menção honrosa de finalista global)

| Campo | Valor |
|---|---|
| Local | Boston · 5 estudantes: Sarasa Ouchi, Banri Ouchi, Hanna Suzuki, Akari Takekawa e Alyssa Yasuhara (as duas últimas também do Earth, Wind & Flare) |
| Desafio | Immersed in the Sounds of Space |
| Stack | Raspberry Pi, matriz de LED 64×64, tela e-paper, caixa Bluetooth, banco em nuvem Kintone, Python |
| Links | [Repositório](https://github.com/HSSBoston/renaissance-quintet) · [Resumo em slides](https://docs.google.com/presentation/d/1awytJN010U5o6ZXexxGZbdyq2TkI2z6lOsYLfgzPcUU/) · [Apresentação](https://youtu.be/knsCNAubOXA) |

**O que era.** Duas partes:

1. **Dispositivos do dia a dia que "empurram" sonificação para as pessoas.** O argumento: as sonificações da NASA ficam em mídias "pull" (YouTube), que ninguém procura. Por isso, nem os pais e professores dos membros conheciam.
2. **Um algoritmo novo para sonificar constelações**, guiado por teoria musical.

**Como funcionava o sonificador.**

- Uma grade sobre a constelação; a linha do meio vira a terceira linha de uma pauta de cinco linhas, com quatro linhas suplementares acima e abaixo.
- **Claves diferentes geram vozes diferentes:** clave de sol para piano e violino, de dó para viola, de fá para violoncelo.
- O **brilho da estrela** (magnitude aparente) controla a força da nota; uma nota pode virar acorde.
- Mixagem com *fade-in* e **estéreo**: a "música de câmara de uma constelação".
- Saída: partitura em notação ABC (imagem), WAV e MP3, enviados à nuvem. Testado com a Ursa Maior (bandeira do Alasca) e com Órion.
- Objetivo declarado: criar "logos sonoros" das constelações, para qualquer aprendiz, "até bebês".

**UI (documentada).**

- **Espelho inteligente:** espelho semirreflexivo com uma matriz de LED atrás, que mostra a imagem ou o vídeo da sonificação enquanto a caixa toca o áudio.
- **Porta-retratos digital:** tela e-paper e caixa de som.
- Configurações guardadas na nuvem (Kintone), editáveis de qualquer dispositivo conectado.
- Não há app web; a interface é o próprio objeto.

**O que o destacou.** Um **problema de distribuição bem formulado** (sonificação existe, mas ninguém ouve) e uma **resposta física e cotidiana**, mais um algoritmo com fundamento musical legível (pauta, claves, instrumentos).

---

### 4.6 Saraquatys in G Major (2024, finalista global)

| Campo | Valor |
|---|---|
| Local | Campinas, SP (Unicamp) · 6 estudantes e ex-estudantes de Ciência da Computação: Caio Emanuel Rhoden, Luiz Henrique Aguiar de Lima Alves, Alexandre Torres Okita, Caio Petrucci dos Santos Rosa, Larissa Gomes de Stefano Escaliante e Lucas César Varani Francisco |
| Desafio | Symphony of the Stars: criar uma colagem que una imagens do James Webb a uma trilha musical, transmitindo descoberta e admiração "para todas as idades" |
| Links | [AEB: finalistas de 2024](https://www.gov.br/aeb/pt-br/assuntos/noticias/brasil-tem-sete-equipes-finalistas-no-nasa-space-apps-2024) |

**O que se sabe.** O time tinha formação em arte, jogos, design, IA e desenvolvimento. O projeto foi descrito como uma colagem de visuais do Webb com fundo musical. Não foram encontrados página, repositório nem vídeo públicos.

**UI.** Sem registro público.

**Por que importa.** É o **precedente brasileiro mais recente** de som chegando à final global, e do mesmo polo (Campinas) que levou Art & Technology em 2024 com o Connected Earth Museum.

---

### 4.7 Interstellar Orchestra (2024, menção honrosa)

| Campo | Valor |
|---|---|
| Local | Meca, Arábia Saudita |
| Desafio | Symphony of the Stars |

**O que se sabe.** Pela descrição do time: uma **plataforma de realidade virtual** que leva entusiastas de espaço e arte numa jornada interativa pela missão do James Webb. No centro está um "James Webb Image Analyzer", ferramenta que analisa as imagens (o resto da descrição está cortado na fonte).

**UI.** Realidade virtual (documentado no resumo); detalhes não públicos.

---

## 5. Indicados e vencedores locais (referência)

Projetos que **não** chegaram a finalista global, mas mostram o que o resto do campo faz. Úteis para saber o que **não** diferencia.

| Ano | Projeto | Resultado | O que fazia | UI |
|---|---|---|---|---|
| 2022 | **Spacetune** (Team Artemis, Washington) | Indicado global | Imagens do Webb e do Hubble convertidas por **espectrograma inverso** (varredura da esquerda para a direita; brilho vira volume; posição vertical vira frequência **consonante com a tonalidade da música do usuário**) e mixadas com uma música enviada pelo usuário. Teve apoio do Dr. Matt Russo (SYSTEM Sounds) | **Fluxo em 3 passos**: escolher imagem (por data ou upload), escolher música (upload, sugestão por emoção ou ocasião, ou gravar a própria voz), criar e compartilhar. Cadastro com e-mail, perfil, comunidade; protótipo em Figma; volume de cada faixa ajustável |
| 2023 | **Cosmic Keys** (Team Eklavya, Ahmedabad) | Sem selo oficial | Dados de planetas mapeados para piano (latitude para altura de C3 a C6, longitude para duração, velocidade orbital para volume, temperatura para sustentação); leitura de foto em grade | Streamlit com 3 abas (pelo repositório de 2026): **Planet Sonification** (filtro por tipo, seleção múltipla de planetas, andamento de 60 a 200 BPM, modo sequência ou acorde), **Image Scanner** (upload, grade de 3 a 12, modo brilho, cor ou contraste, sobreposição da grade na imagem) e **Composer** (escolher qual coluna de dado controla altura, duração, volume e sustentação) |
| 2023 | **Navigate the SoniVerse** (Area Six, Taipei) | Indicado global | Sonificação de dados espaciais | App JavaScript ([repositório](https://github.com/Chenade/Six_Area-Navigate_the_SoniVerse)) |
| 2023 | **AstroSonix** (JeansMasters, Stalowa Wola) | 6º lugar local | Um modelo de linguagem lê a **emoção** da imagem; heurísticas parametrizam a trilha; modelos abertos de ML geram a música | App para celular ou notebook |
| 2024 | **Astral Harmony** (ISAK As, Fukaya) | Indicado global; 1º lugar local | Imagem dividida em blocos; média de matiz, saturação e brilho; melodia e acompanhamento com progressões de acordes, síncope; **maior para cores vivas, menor para cores escuras**; piano | Vídeos com a imagem e a música ([repositório](https://github.com/annatequilaa/NASA-Space-app-ISAK-A-s)) |
| 2024 | **Cosmic Pathways** (Lisboa) | 1º lugar local | Universo 3D com pontos que abrem imagens do Webb; o time **abandonou a conversão automática** e compôs música original | Web 3D imersiva ([repositório](https://github.com/henriquesfernandes/cosmic_pathways)) |
| 2024 | **Symphony of Nebula** (Itália) | Não informado | ChatGPT descreve a imagem, o MusicGen gera a música; vídeo com forma de onda e imagem que **pulsa no ritmo** para pessoas surdas | Notebooks + vídeos ([repositório](https://github.com/kusharma/symphony-of-nebula)) |

Leitura:

- O "campo médio" faz **cor ou brilho do pixel virando nota**, ou **IA gerando música a partir de uma descrição da imagem**. Nenhum dos dois chegou a finalista global.
- Personalização (gênero, tonalidade, escolha da música) aparece em quase todos. **Sozinha, não diferencia mais.**

---

## 6. Vizinho relevante sem som central: Connected Earth Museum (2024, Art & Technology)

| Campo | Valor |
|---|---|
| Local | Campinas, SP (Unicamp) · 6 estudantes de Engenharia de Computação |
| Desafio | Imagine our Connected Earth |
| Stack | React, three.js, Blender; dados NASA FIRMS, SEDAC, MODIS, MOPITT e uma API de qualidade do ar |
| Links | [Anúncio da NASA](https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-international-space-apps-challenge-announces-2024-global-winners/) · [Unicamp](https://www.unicamp.br/en/noticias/2025/01/20/unicamp-vence-desafio-nasa-pelo-segundo-ano-consecutivo/) · [Ficha CrafterWIKI](https://crafterwiki.com/projects/connected-earth-museum/) · [Repositório](https://github.com/connected-earth/connected-earth-museum) |

**Por que está aqui.** Não é um projeto de som (o papel do áudio não está documentado), mas é o precedente mais próximo do Earth Jukebox em **formato**: dados de clima da Terra dentro de uma **metáfora de objeto conhecido**. Lá é um museu; aqui é uma jukebox. E venceu Art & Technology, o prêmio-alvo da nossa análise estratégica.

**UI (documentada).** Um museu 3D modelado no Blender, com iluminação pré-calculada. Um guia virtual com IA ("Billy") conduz o visitante por um caminho. Ao clicar num quadro, o visitante "entra" numa visualização: um globo 3D com séries temporais (temperatura da terra e do oceano, vegetação, emissões, população, incêndios), mapas 2D que ligam focos de incêndio, chuva e vento, e população com emissões e qualidade do ar em tempo real. A visita termina num quiz.

**O que o destacou.**

- **Um lugar que todo mundo entende:** ninguém precisa de instrução para explorar um museu.
- **Esforço artesanal visível:** o modelo 3D e o editor de caminho foram feitos pelo time, sem template.
- A **conexão entre sistemas da Terra** era o próprio tema do desafio.

---

## 7. Padrões: o que os juízes premiaram

| Projeto | De onde vem o som | Interação | Formato | Gancho humano |
|---|---|---|---|---|
| SongSAT | Classe da paisagem + valor do pixel | Clicar num marcador (áudio pré-gerado) | Algoritmo + mapa | Cegos e músicos |
| Aria EarthMOOG | Cor do tile do mapa | Arrastar e dar zoom no mapa compõe a música | App web | Famílias |
| Deep Space Musical | Brilho do pixel | Nenhuma | Peça musical | Crianças; arco de vida das estrelas |
| Masked Scales | **Valores medidos** (sensores, VIIRS) | Nenhuma | Musical em vídeo | Crianças no lockdown |
| Earth, Wind & Flare | **Valores medidos** (índice Kp) | Trocar a escala | Painel físico | Preparar a cidade para tempestades |
| MIMBI | Trilha composta | História interativa | Jogo web | Orgulho nacional; 300 usuários reais |
| Arcobaleno | Cor do pixel (HSL) | Escolher o gênero | Método | Cegos |
| Renaissance Quintet | Posição e brilho das estrelas | Nenhuma no objeto | Espelho e porta-retratos | "Ninguém ouve sonificação" |

**O que se repete nos premiados:**

1. **Uma história humana em uma frase.** Crianças no lockdown, cegos explorando o cosmos, uma cidade se preparando para tempestades solares. O som serve à história, não o contrário.
2. **Um objeto ou metáfora conhecido.** Musical, painel do tempo, espelho, museu, mapa. O formato explica o projeto antes de qualquer texto.
3. **Musicalidade imposta por teoria.** Escalas por tema, limite de saltos, tríades, claves e instrumentos por voz. Nenhum premiado entregou "ruído de pixel".
4. **Uma legenda sonora simples.** Um instrumento por variável (Masked Scales), uma paisagem por tema (SongSAT), uma voz por clave (Renaissance).
5. **Entre os vencedores, só Masked Scales e Earth, Wind & Flare sonificaram grandezas medidas.** Os outros partiram da cor do pixel ou usaram trilha composta, e ganharam pela história, não pelo rigor.

**O que nenhum deles fez:**

- **Validação com usuários cegos.** Todos citam acessibilidade; nenhum mostra um teste com quem não enxerga. O único com evidência de uso real (MIMBI) não era de acessibilidade.
- **Sonificação calibrada de dados da Terra em tempo real no navegador.** O Aria foi o mais próximo, mas usava a cor do tile.
- **Explicar o limite científico do que se ouve.** Nenhum diz quanto o som é fiel ao dado.

---

## 8. Onde o Earth Jukebox se posiciona

| Eixo | Campo anterior | Earth Jukebox hoje |
|---|---|---|
| Origem do som | Cor ou brilho do pixel (maioria) | **Valor físico** lido da legenda, régua, gráfico ou cobertura do frame, com limites declarados |
| Tema | Espaço (maioria) | **Terra que muda no tempo** (EIC/SVS) |
| Metáfora | Mapa, museu, musical, espelho | **Jukebox**: discos, capas, tubos |
| Legenda sonora | Um instrumento por variável | Camadas fixas para todas as faixas (tom, vento, tique, sino) + valores com unidade na tela e no `aria-valuetext` |
| Geração | Pré-gerada (maioria) | **Síntese ao vivo** no navegador (Web Audio) |
| Acessibilidade | Declarada | Implementada: teclado, leitor de tela, legendas, narração em EN/PT/ES, `prefers-reduced-motion` |
| Prova com usuários | Ausente | **Placeholder** (`[X/5]` e citação no README): o maior diferencial ainda por fazer |
| Gancho humano | Forte nos premiados | A definir na página e no vídeo |
| Interação exploratória | Aria (mapa), Spacetune (mixagem) | Tocar, pausar e avançar passos; sem exploração espacial do frame |
| Personalização musical | Arcobaleno, Earth, Wind & Flare, Spacetune | Ausente |

Leitura:

- O Earth Jukebox já ocupa o espaço que **nenhum premiado ocupou**: dados da Terra **calibrados**, sonificados ao vivo, com acessibilidade real.
- Os premiados mostram que isso **não basta sozinho**: falta a **história humana em uma frase** e a **prova com usuários cegos**, que são justamente os itens em aberto.
- Personalização e exploração por toque são diferenciais **dos outros**; adotá-los aproxima do campo, mas não diferencia por si só.

---

## 9. Fontes e limitações

**Fontes oficiais:**

- [Resultados globais de 2018](https://2018.spaceappschallenge.org/awards/global-finalists/)
- [Finalistas globais de 2022](https://2022.spaceappschallenge.org/awards/global-finalists/) · [Vencedores de 2022](https://www.spaceappschallenge.org/blog/2022-global-winners/)
- [Vencedores de 2021](https://www.spaceappschallenge.org/blog/meet-the-2021-global-winners/)
- [Vencedores de 2023 (NASA)](https://science.nasa.gov/directorates/smd/2023-nasa-international-space-apps-challenge-announces-10-global-winners/)
- [Vencedores de 2024 (NASA)](https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-international-space-apps-challenge-announces-2024-global-winners/)
- [Vencedores de 2025](https://www.spaceappschallenge.org/2025/meet-the-2025-global-winners/)
- API pública do Space Apps (selos de indicação e prêmio por time), consultada em 15/11/2026.

**Limitações:**

- As páginas de projeto de 2023 e 2024 não estão mais públicas. Para Arcobaleno, Ten Hours Of Space Music For Sleeping, Saraquatys in G Major e Interstellar Orchestra, só há resumos; **a UI desses quatro não pôde ser descrita**.
- Vídeos não foram assistidos; as descrições de UI vêm de texto, imagens citadas e código.
- O repositório do Cosmic Keys foi criado em 2026 e pode não refletir o projeto original de 2023.
- O site songsat.ca está fora do ar; a UI do SongSAT foi reconstruída a partir do código do site.
