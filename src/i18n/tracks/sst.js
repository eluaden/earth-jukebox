// Liner notes and narration of the sea surface temperature track, EN / PT / ES.
// Rules (docs/si-e-referencias.md): only facts stated on the NASA page (SVS 3912) or computed from the
// track's own grid (scripts/pipeline/sst.py). Numbers below come from public/tracks/sst/grid.bin.
// The team reviews these texts before publishing.

export const SST_TEXT = {
  en: {
    title: 'Sea Surface Temperature',
    whatYouHear:
      'The needle reads the ocean under it, from north to south, about once for every day of the year. Strings play the northern waters, the piano plays the tropics and the glockenspiel plays the southern waters. Warmer water plays a higher, brighter note. Land is silent.',
    mapping: [
      ['Sea surface temperature, 0–32 °C (NASA colour bar)', 'Pitch: warmer is higher, on the same scale for every instrument; warmer is also brighter and louder'],
      ['Northern waters, 23.5° N to 80° N', 'Strings, held notes'],
      ['Tropics, 23.5° S to 23.5° N', 'Piano, two notes in turn'],
      ['Southern waters, 23.5° S to 80° S', 'Glockenspiel'],
      ['Land, sea ice or no data', 'Silence'],
      ['Time: 25 March 2007 to 3 March 2008', 'The date on the left; the globe turns once every 10 seconds'],
    ],
    description: [
      'The map shows the ocean surface currents as thin lines, coloured by the water temperature. Blue is near 0 °C, green between 10 and 20 °C, yellow about 25 °C and red 32 °C.',
      'The warm band around the equator barely changes: averaged around the whole planet, the tropics stay between 26.6 °C and 27.7 °C all year. The piano keeps to the top of the scale.',
      'The two hemispheres take turns. The northern waters are coolest in early March 2008 (9.0 °C on average) and warmest in early September 2007 (15.4 °C), so the strings climb through the northern summer.',
      'The southern waters do the opposite: coolest in early September 2007 (7.5 °C) and warmest in February 2008 (11.6 °C). The glockenspiel rises as the strings fall.',
      'Each band averages whatever ocean it holds, so the music rarely stops: over the open Pacific and Atlantic all six notes sound, and even over the Americas and Africa at least four of the six still find ocean.',
    ],
    limits: [
      'The data is the ECCO2 ocean model (MIT/JPL), which combines satellite and in-water measurements with a physical model of the ocean. It is not a photograph.',
      'We read the temperature from the colour of the flow lines with NASA’s colour bar. Our reader returns the colour bar’s own values with an error below 0.3 °C.',
      'Above about 31 °C the colour bar is one single red, so everything from 31.1 to 31.9 °C reads as about 31.5 °C.',
      'Each value is an average over a 2° × 2° box and about one day of the model. Where no line passes for a while, the box keeps its last reading; boxes that are almost always empty (land, sea ice) are silent.',
      'Each instrument plays the average of two wide latitude bands, so a single warm current inside a band is smoothed out.',
      'The colour shows temperature only. The movement of the lines (the currents) is not turned into sound.',
      'The soft vinyl crackle in the background is not data. It keeps playing when the needle is over land.',
    ],
    narration: {
      intro: 'This is the surface of the ocean, from March 2007 to March 2008. Every note is a temperature read from a NASA map: the warmer the water, the higher the note.',
      'north-warmest': '{date}: the northern waters reach their warmest of the year.',
      'south-warmest': '{date}: now it is the turn of the southern waters, at their warmest of the year.',
      outro: 'One year of ocean has passed under the needle. The record starts again.',
    },
  },
  pt: {
    title: 'Temperatura da superfície do mar',
    whatYouHear:
      'A agulha lê o oceano embaixo dela, de norte a sul, cerca de uma vez para cada dia do ano. As cordas tocam as águas do norte, o piano toca os trópicos e o glockenspiel toca as águas do sul. Água mais quente toca uma nota mais aguda e mais brilhante. A terra fica em silêncio.',
    mapping: [
      ['Temperatura da superfície do mar, 0–32 °C (legenda de cores da NASA)', 'Altura: mais quente é mais agudo, na mesma escala para todos os instrumentos; mais quente também é mais brilhante e mais forte'],
      ['Águas do norte, de 23,5° N a 80° N', 'Cordas, notas sustentadas'],
      ['Trópicos, de 23,5° S a 23,5° N', 'Piano, duas notas alternadas'],
      ['Águas do sul, de 23,5° S a 80° S', 'Glockenspiel'],
      ['Terra, gelo marinho ou sem dado', 'Silêncio'],
      ['Tempo: 25 de março de 2007 a 3 de março de 2008', 'A data à esquerda; o globo dá uma volta a cada 10 segundos'],
    ],
    description: [
      'O mapa mostra as correntes da superfície do oceano como linhas finas, coloridas pela temperatura da água. Azul é perto de 0 °C, verde entre 10 e 20 °C, amarelo cerca de 25 °C e vermelho 32 °C.',
      'A faixa quente em volta do equador quase não muda: na média do planeta inteiro, os trópicos ficam entre 26,6 °C e 27,7 °C o ano todo. O piano fica no alto da escala.',
      'Os dois hemisférios se revezam. As águas do norte estão mais frias no começo de março de 2008 (9,0 °C em média) e mais quentes no começo de setembro de 2007 (15,4 °C), então as cordas sobem durante o verão do norte.',
      'As águas do sul fazem o contrário: mais frias no começo de setembro de 2007 (7,5 °C) e mais quentes em fevereiro de 2008 (11,6 °C). O glockenspiel sobe enquanto as cordas descem.',
      'Cada faixa faz a média do oceano que contém, então a música quase nunca para: sobre o Pacífico e o Atlântico abertos as seis notas soam, e mesmo sobre as Américas e a África pelo menos quatro das seis ainda encontram oceano.',
    ],
    limits: [
      'O dado é o modelo oceânico ECCO2 (MIT/JPL), que combina medições de satélite e dentro da água com um modelo físico do oceano. Não é uma fotografia.',
      'Lemos a temperatura pela cor das linhas de corrente com a legenda de cores da NASA. Nosso leitor devolve os valores da própria legenda com erro menor que 0,3 °C.',
      'Acima de cerca de 31 °C a legenda é um vermelho só, então tudo entre 31,1 e 31,9 °C é lido como cerca de 31,5 °C.',
      'Cada valor é a média de um quadrado de 2° × 2° e de cerca de um dia do modelo. Onde nenhuma linha passa por um tempo, o quadrado mantém a última leitura; quadrados quase sempre vazios (terra, gelo marinho) ficam em silêncio.',
      'Cada instrumento toca a média de duas faixas largas de latitude, então uma corrente quente isolada dentro de uma faixa fica suavizada.',
      'A cor mostra só a temperatura. O movimento das linhas (as correntes) não vira som.',
      'O estalo suave de vinil ao fundo não é dado. Ele continua tocando quando a agulha está sobre a terra.',
    ],
    narration: {
      intro: 'Esta é a superfície do oceano, de março de 2007 a março de 2008. Cada nota é uma temperatura lida de um mapa da NASA: quanto mais quente a água, mais aguda a nota.',
      'north-warmest': '{date}: as águas do norte chegam ao ponto mais quente do ano.',
      'south-warmest': '{date}: agora é a vez das águas do sul, no ponto mais quente do ano.',
      outro: 'Um ano de oceano passou sob a agulha. O disco recomeça.',
    },
  },
  es: {
    title: 'Temperatura de la superficie del mar',
    whatYouHear:
      'La aguja lee el océano que tiene debajo, de norte a sur, más o menos una vez por cada día del año. Las cuerdas tocan las aguas del norte, el piano toca los trópicos y el glockenspiel toca las aguas del sur. El agua más cálida toca una nota más aguda y más brillante. La tierra queda en silencio.',
    mapping: [
      ['Temperatura de la superficie del mar, 0–32 °C (barra de colores de la NASA)', 'Altura: más cálido es más agudo, en la misma escala para todos los instrumentos; más cálido también es más brillante y más fuerte'],
      ['Aguas del norte, de 23,5° N a 80° N', 'Cuerdas, notas sostenidas'],
      ['Trópicos, de 23,5° S a 23,5° N', 'Piano, dos notas alternadas'],
      ['Aguas del sur, de 23,5° S a 80° S', 'Glockenspiel'],
      ['Tierra, hielo marino o sin dato', 'Silencio'],
      ['Tiempo: del 25 de marzo de 2007 al 3 de marzo de 2008', 'La fecha a la izquierda; el globo da una vuelta cada 10 segundos'],
    ],
    description: [
      'El mapa muestra las corrientes de la superficie del océano como líneas finas, coloreadas por la temperatura del agua. Azul es cerca de 0 °C, verde entre 10 y 20 °C, amarillo unos 25 °C y rojo 32 °C.',
      'La franja cálida alrededor del ecuador casi no cambia: en el promedio de todo el planeta, los trópicos se mantienen entre 26,6 °C y 27,7 °C todo el año. El piano se queda en lo alto de la escala.',
      'Los dos hemisferios se turnan. Las aguas del norte están más frías a principios de marzo de 2008 (9,0 °C de promedio) y más cálidas a principios de septiembre de 2007 (15,4 °C), así que las cuerdas suben durante el verano del norte.',
      'Las aguas del sur hacen lo contrario: más frías a principios de septiembre de 2007 (7,5 °C) y más cálidas en febrero de 2008 (11,6 °C). El glockenspiel sube mientras las cuerdas bajan.',
      'Cada franja promedia el océano que contiene, así que la música casi nunca se detiene: sobre el Pacífico y el Atlántico abiertos suenan las seis notas, e incluso sobre las Américas y África al menos cuatro de las seis siguen encontrando océano.',
    ],
    limits: [
      'El dato es el modelo oceánico ECCO2 (MIT/JPL), que combina mediciones de satélite y dentro del agua con un modelo físico del océano. No es una fotografía.',
      'Leemos la temperatura por el color de las líneas de corriente con la barra de colores de la NASA. Nuestro lector devuelve los valores de la propia barra con un error menor de 0,3 °C.',
      'Por encima de unos 31 °C la barra es un único rojo, así que todo entre 31,1 y 31,9 °C se lee como unos 31,5 °C.',
      'Cada valor es el promedio de un cuadro de 2° × 2° y de más o menos un día del modelo. Donde no pasa ninguna línea durante un tiempo, el cuadro conserva su última lectura; los cuadros casi siempre vacíos (tierra, hielo marino) quedan en silencio.',
      'Cada instrumento toca el promedio de dos franjas anchas de latitud, así que una corriente cálida aislada dentro de una franja queda suavizada.',
      'El color muestra solo la temperatura. El movimiento de las líneas (las corrientes) no se convierte en sonido.',
      'El crujido suave de vinilo de fondo no es un dato. Sigue sonando cuando la aguja está sobre tierra.',
    ],
    narration: {
      intro: 'Esta es la superficie del océano, de marzo de 2007 a marzo de 2008. Cada nota es una temperatura leída de un mapa de la NASA: cuanto más cálida el agua, más aguda la nota.',
      'north-warmest': '{date}: las aguas del norte llegan a su punto más cálido del año.',
      'south-warmest': '{date}: ahora es el turno de las aguas del sur, en su punto más cálido del año.',
      outro: 'Un año de océano ha pasado bajo la aguja. El disco vuelve a empezar.',
    },
  },
};
