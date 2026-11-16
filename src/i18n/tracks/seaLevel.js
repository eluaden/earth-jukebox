// Liner notes and narration of the sea level bonus record, EN / PT / ES.
// Rules: only facts from the NASA page (SVS 5235) or computed from the track's
// own series (scripts/pipeline/sealevel.py). The team reviews these texts before publishing.
// Shown at a glance: dataset, whatYouHear, mapping, highlights. Behind "Learn more": description, limits.

export const SEA_LEVEL_TEXT = {
  en: {
    title: 'Sea level',
    dataset: 'Satellite altimetry (GSFC GMSL v5.1)',
    whatYouHear: 'Thirty years of global sea level, seen through a porthole. The strings climb one step for every centimetre; a bell marks each new centimetre.',
    mapping: [
      ['Global mean sea level above 1993', 'Strings: one step higher per centimetre'],
      ['A new whole centimetre, reached for the first time', 'Glockenspiel: one bell'],
    ],
    highlights: [
      'The peak is October 2023: about 11.5 cm above 1993.',
      'The last decade rose the most: about 3.5 cm, against about 3.2 cm in each of the first two.',
    ],
    description: [
      'The blue bar on the ruler (centimetres and inches) starts at the 1993 level and rises with NASA’s satellite record.',
      'January 2003: about 3.2 cm. January 2013: about 6.4 cm. January 2023: about 9.8 cm.',
    ],
    limits: [
      'NASA does not publish the numbers with this video: we read the blue bar against the ruler on the frame (one pixel is half a millimetre).',
      'Dates come from the year printed next to the bar, one year every 29 frames, so they are accurate to about two weeks.',
      'This is the average of all oceans; it cannot show where the sea rises more. 1993 is where the satellite record starts, not a normal level.',
      'The waves follow a 60-day average; the bar shows the measurements (TOPEX/Poseidon, Jason-1, -2 and -3). From March 2022 it includes Sentinel-6 Michael Freilich data that NASA marks as preliminary.',
    ],
    narration: {
      intro: 'The sea, through a porthole, from 1993 to 2023. The strings follow the water: one step up for every centimetre.',
      'year-2003': '{date}: ten years on, the sea is about three centimetres higher.',
      'year-2013': '{date}: twenty years on, about six centimetres.',
      outro: 'By the end of 2023 the sea stood about eleven centimetres above 1993. The record starts again.',
    },
  },
  pt: {
    title: 'Nível do mar',
    dataset: 'Altimetria por satélite (GSFC GMSL v5.1)',
    whatYouHear: 'Trinta anos de nível do mar global, vistos por uma escotilha. As cordas sobem um degrau a cada centímetro; um sino marca cada centímetro novo.',
    mapping: [
      ['Nível médio global do mar acima de 1993', 'Cordas: um degrau mais agudo por centímetro'],
      ['Um novo centímetro inteiro, alcançado pela primeira vez', 'Glockenspiel: um sino'],
    ],
    highlights: [
      'O pico é em outubro de 2023: cerca de 11,5 cm acima de 1993.',
      'A última década subiu mais: cerca de 3,5 cm, contra cerca de 3,2 cm em cada uma das duas primeiras.',
    ],
    description: [
      'A barra azul na régua (centímetros e polegadas) começa no nível de 1993 e sobe com o registro de satélites da NASA.',
      'Janeiro de 2003: cerca de 3,2 cm. Janeiro de 2013: cerca de 6,4 cm. Janeiro de 2023: cerca de 9,8 cm.',
    ],
    limits: [
      'A NASA não publica os números com este vídeo: lemos a barra azul contra a régua do quadro (um pixel é meio milímetro).',
      'As datas vêm do ano impresso ao lado da barra, um ano a cada 29 quadros, então têm precisão de cerca de duas semanas.',
      'É a média de todos os oceanos; não mostra onde o mar sobe mais. 1993 é onde o registro de satélites começa, não um nível normal.',
      'As ondas seguem uma média de 60 dias; a barra mostra as medições (TOPEX/Poseidon, Jason-1, -2 e -3). Desde março de 2022 inclui dados do Sentinel-6 Michael Freilich que a NASA marca como preliminares.',
    ],
    narration: {
      intro: 'O mar, por uma escotilha, de 1993 a 2023. As cordas acompanham a água: um degrau acima a cada centímetro.',
      'year-2003': '{date}: dez anos depois, o mar está cerca de três centímetros mais alto.',
      'year-2013': '{date}: vinte anos depois, cerca de seis centímetros.',
      outro: 'No fim de 2023 o mar estava cerca de onze centímetros acima de 1993. O disco recomeça.',
    },
  },
  es: {
    title: 'Nivel del mar',
    dataset: 'Altimetría por satélite (GSFC GMSL v5.1)',
    whatYouHear: 'Treinta años de nivel del mar global, vistos por un ojo de buey. Las cuerdas suben un escalón por cada centímetro; una campana marca cada centímetro nuevo.',
    mapping: [
      ['Nivel medio global del mar por encima de 1993', 'Cuerdas: un escalón más aguda por centímetro'],
      ['Un nuevo centímetro entero, alcanzado por primera vez', 'Glockenspiel: una campana'],
    ],
    highlights: [
      'El pico es en octubre de 2023: unos 11,5 cm por encima de 1993.',
      'La última década subió más: unos 3,5 cm, frente a unos 3,2 cm en cada una de las dos primeras.',
    ],
    description: [
      'La barra azul en la regla (centímetros y pulgadas) empieza en el nivel de 1993 y sube con el registro de satélites de la NASA.',
      'Enero de 2003: unos 3,2 cm. Enero de 2013: unos 6,4 cm. Enero de 2023: unos 9,8 cm.',
    ],
    limits: [
      'La NASA no publica los números con este vídeo: leemos la barra azul contra la regla del cuadro (un píxel es medio milímetro).',
      'Las fechas vienen del año impreso junto a la barra, un año cada 29 cuadros, así que tienen una precisión de unas dos semanas.',
      'Es el promedio de todos los océanos; no muestra dónde sube más el mar. 1993 es donde empieza el registro de satélites, no un nivel normal.',
      'Las olas siguen un promedio de 60 días; la barra muestra las mediciones (TOPEX/Poseidon, Jason-1, -2 y -3). Desde marzo de 2022 incluye datos del Sentinel-6 Michael Freilich que la NASA marca como preliminares.',
    ],
    narration: {
      intro: 'El mar, por un ojo de buey, de 1993 a 2023. Las cuerdas siguen al agua: un escalón más por cada centímetro.',
      'year-2003': '{date}: diez años después, el mar está unos tres centímetros más alto.',
      'year-2013': '{date}: veinte años después, unos seis centímetros.',
      outro: 'A finales de 2023 el mar estaba unos once centímetros por encima de 1993. El disco vuelve a empezar.',
    },
  },
};
