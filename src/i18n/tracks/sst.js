// Liner notes and narration of the sea surface temperature track, EN / PT / ES.
// Rules (docs/si-e-referencias.md): only facts stated on the NASA page (SVS 3912) or computed from the
// track's own grid (scripts/pipeline/sst.py). Numbers below come from public/tracks/sst/grid.bin.
// Shown at a glance: dataset, whatYouHear, mapping, highlights. Behind "Learn more": description, limits.
// The team reviews these texts before publishing.

export const SST_TEXT = {
  en: {
    title: 'Sea temperature',
    dataset: 'ECCO2 ocean model (MIT/JPL)',
    whatYouHear: 'One year of ocean surface temperature, read from north to south. Warmer water plays a higher note.',
    mapping: [
      ['Sea temperature, 0 to 32 °C', 'Pitch: warmer is higher, brighter and louder'],
      ['Northern waters, 23.5° to 80° N', 'Strings'],
      ['Tropics, 23.5° S to 23.5° N', 'Piano'],
      ['Southern waters, 23.5° to 80° S', 'Glockenspiel'],
      ['Land, sea ice or no data', 'Silence'],
    ],
    highlights: [
      'The tropics barely change: 26.6–27.7 °C all year, so the piano stays high.',
      'The hemispheres take turns: the north peaks in September (15.4 °C), the south in February (11.6 °C). The strings rise as the glockenspiel falls.',
    ],
    description: [
      'The thin lines are surface currents, coloured by temperature: blue near 0 °C, green 10–20 °C, yellow about 25 °C, red 32 °C.',
      'Band averages: the north goes from 9.0 °C (March 2008) to 15.4 °C (September 2007); the south from 7.5 °C (September 2007) to 11.6 °C (February 2008).',
      'Each voice averages the ocean in its band, so the music rarely stops: even over the Americas and Africa, at least four of the six notes find ocean.',
    ],
    limits: [
      'ECCO2 is a model that combines satellite and in-water measurements with ocean physics. It is not a photograph.',
      'We read temperature from the colour of the lines with NASA’s colour bar (error below 0.3 °C). Above about 31 °C the bar is a single red, read as about 31.5 °C.',
      'Each value averages a 2° × 2° box over about one day. Where no line passes, the box keeps its last reading.',
      'Wide bands smooth out a single warm current. The movement of the currents is not turned into sound.',
      'The vinyl crackle in the background is not data.',
    ],
    narration: {
      intro: 'This is the surface of the ocean, from March 2007 to March 2008. Every note is a temperature read from a NASA map: the warmer the water, the higher the note.',
      'north-warmest': '{date}: the northern waters reach their warmest of the year.',
      'south-warmest': '{date}: now it is the turn of the southern waters, at their warmest of the year.',
      outro: 'One year of ocean has passed under the needle. The record starts again.',
    },
  },
  pt: {
    title: 'Temperatura do mar',
    dataset: 'Modelo oceânico ECCO2 (MIT/JPL)',
    whatYouHear: 'Um ano de temperatura da superfície do oceano, lida de norte a sul. Água mais quente toca uma nota mais aguda.',
    mapping: [
      ['Temperatura do mar, 0 a 32 °C', 'Altura: mais quente é mais agudo, brilhante e forte'],
      ['Águas do norte, 23,5° a 80° N', 'Cordas'],
      ['Trópicos, 23,5° S a 23,5° N', 'Piano'],
      ['Águas do sul, 23,5° a 80° S', 'Glockenspiel'],
      ['Terra, gelo marinho ou sem dado', 'Silêncio'],
    ],
    highlights: [
      'Os trópicos quase não mudam: 26,6–27,7 °C o ano todo, e o piano fica no agudo.',
      'Os hemisférios se revezam: o norte chega ao pico em setembro (15,4 °C), o sul em fevereiro (11,6 °C). As cordas sobem enquanto o glockenspiel desce.',
    ],
    description: [
      'As linhas finas são as correntes da superfície, coloridas pela temperatura: azul perto de 0 °C, verde 10–20 °C, amarelo cerca de 25 °C, vermelho 32 °C.',
      'Médias por faixa: o norte vai de 9,0 °C (março de 2008) a 15,4 °C (setembro de 2007); o sul, de 7,5 °C (setembro de 2007) a 11,6 °C (fevereiro de 2008).',
      'Cada voz faz a média do oceano da sua faixa, então a música quase nunca para: mesmo sobre as Américas e a África, pelo menos quatro das seis notas encontram oceano.',
    ],
    limits: [
      'O ECCO2 é um modelo que combina medições de satélite e dentro da água com a física do oceano. Não é uma fotografia.',
      'Lemos a temperatura pela cor das linhas com a barra de cores da NASA (erro menor que 0,3 °C). Acima de cerca de 31 °C a barra é um vermelho só, lido como cerca de 31,5 °C.',
      'Cada valor é a média de um quadrado de 2° × 2° em cerca de um dia. Onde nenhuma linha passa, o quadrado mantém a última leitura.',
      'Faixas largas suavizam uma corrente quente isolada. O movimento das correntes não vira som.',
      'O estalo de vinil ao fundo não é dado.',
    ],
    narration: {
      intro: 'Esta é a superfície do oceano, de março de 2007 a março de 2008. Cada nota é uma temperatura lida de um mapa da NASA: quanto mais quente a água, mais aguda a nota.',
      'north-warmest': '{date}: as águas do norte chegam ao ponto mais quente do ano.',
      'south-warmest': '{date}: agora é a vez das águas do sul, no ponto mais quente do ano.',
      outro: 'Um ano de oceano passou sob a agulha. O disco recomeça.',
    },
  },
  es: {
    title: 'Temperatura del mar',
    dataset: 'Modelo oceánico ECCO2 (MIT/JPL)',
    whatYouHear: 'Un año de temperatura de la superficie del océano, leída de norte a sur. El agua más cálida toca una nota más aguda.',
    mapping: [
      ['Temperatura del mar, 0 a 32 °C', 'Altura: más cálido es más agudo, brillante y fuerte'],
      ['Aguas del norte, 23,5° a 80° N', 'Cuerdas'],
      ['Trópicos, 23,5° S a 23,5° N', 'Piano'],
      ['Aguas del sur, 23,5° a 80° S', 'Glockenspiel'],
      ['Tierra, hielo marino o sin dato', 'Silencio'],
    ],
    highlights: [
      'Los trópicos casi no cambian: 26,6–27,7 °C todo el año, y el piano se queda en lo agudo.',
      'Los hemisferios se turnan: el norte llega a su pico en septiembre (15,4 °C), el sur en febrero (11,6 °C). Las cuerdas suben mientras el glockenspiel baja.',
    ],
    description: [
      'Las líneas finas son las corrientes de la superficie, coloreadas por la temperatura: azul cerca de 0 °C, verde 10–20 °C, amarillo unos 25 °C, rojo 32 °C.',
      'Promedios por franja: el norte va de 9,0 °C (marzo de 2008) a 15,4 °C (septiembre de 2007); el sur, de 7,5 °C (septiembre de 2007) a 11,6 °C (febrero de 2008).',
      'Cada voz promedia el océano de su franja, así que la música casi nunca se detiene: incluso sobre las Américas y África, al menos cuatro de las seis notas encuentran océano.',
    ],
    limits: [
      'ECCO2 es un modelo que combina mediciones de satélite y dentro del agua con la física del océano. No es una fotografía.',
      'Leemos la temperatura por el color de las líneas con la barra de colores de la NASA (error menor de 0,3 °C). Por encima de unos 31 °C la barra es un único rojo, leído como unos 31,5 °C.',
      'Cada valor es el promedio de un cuadro de 2° × 2° en más o menos un día. Donde no pasa ninguna línea, el cuadro conserva su última lectura.',
      'Las franjas anchas suavizan una corriente cálida aislada. El movimiento de las corrientes no se convierte en sonido.',
      'El crujido de vinilo de fondo no es un dato.',
    ],
    narration: {
      intro: 'Esta es la superficie del océano, de marzo de 2007 a marzo de 2008. Cada nota es una temperatura leída de un mapa de la NASA: cuanto más cálida el agua, más aguda la nota.',
      'north-warmest': '{date}: las aguas del norte llegan a su punto más cálido del año.',
      'south-warmest': '{date}: ahora es el turno de las aguas del sur, en su punto más cálido del año.',
      outro: 'Un año de océano ha pasado bajo la aguja. El disco vuelve a empezar.',
    },
  },
};
