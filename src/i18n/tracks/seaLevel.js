// Liner notes and narration of the sea level bonus record, EN / PT / ES.
// Rules (docs/si-e-referencias.md): only facts from the NASA page (SVS 5235) or computed from the track's
// own series (scripts/pipeline/sealevel.py). The team reviews these texts before publishing.

export const SEA_LEVEL_TEXT = {
  en: {
    title: 'Sea level',
    whatYouHear:
      'Through a ship’s porthole, NASA shows how far the ocean rose from 1993 to 2023. The strings hold one long note that follows the water: for every centimetre the sea gains, the note climbs one step. The first time the sea reaches a new centimetre above 1993, a bell rings.',
    mapping: [
      ['Global mean sea level above 1993, read from the blue bar on NASA’s ruler', 'Strings: one long note, one step higher for every centimetre, and a little louder'],
      ['A new whole centimetre above 1993, reached for the first time', 'Glockenspiel: one bell, higher for each centimetre'],
      ['Time: January 1993 to December 2023', 'The date on the left; about one year per second'],
    ],
    description: [
      'The porthole looks out at the open sea. The ruler on the glass is in centimetres and inches; the blue bar starts at the 1993 sea level and rises with NASA’s satellite record.',
      'By January 2003 the sea was about 3.2 centimetres above 1993; by January 2013, about 6.4; by January 2023, about 9.8.',
      'The last decade added the most: about 3.5 centimetres, against about 3.2 in each of the first two.',
      'The highest point of the record is in October 2023, about 11.5 centimetres above 1993.',
    ],
    limits: [
      'NASA does not publish the numbers with this video, so we read them from the picture: the height of the blue bar against the ruler printed on the frame, where one pixel is half a millimetre.',
      'The dates come from the year NASA prints next to the bar, which advances at a steady pace of one year every 29 frames of the video, so a date is accurate to about two weeks.',
      'This is the average over all the oceans. The sea does not rise the same everywhere, and this record cannot show where.',
      'The 1993 level is where the satellite record starts, not a natural or normal level.',
      'The waves in the porthole follow a 60-day average of the same data; the blue bar, which we read, shows the measurements themselves (TOPEX/Poseidon, Jason-1, Jason-2 and Jason-3). After March 2022 the record includes Sentinel-6 Michael Freilich data that NASA marks as preliminary.',
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
    whatYouHear:
      'Pela escotilha de um navio, a NASA mostra quanto o oceano subiu de 1993 a 2023. As cordas sustentam uma nota longa que acompanha a água: a cada centímetro que o mar ganha, a nota sobe um degrau. Na primeira vez que o mar chega a um novo centímetro acima de 1993, toca um sino.',
    mapping: [
      ['Nível médio global do mar acima de 1993, lido da barra azul na régua da NASA', 'Cordas: uma nota longa, um degrau mais aguda a cada centímetro, e um pouco mais forte'],
      ['Um novo centímetro inteiro acima de 1993, alcançado pela primeira vez', 'Glockenspiel: um sino, mais agudo a cada centímetro'],
      ['Tempo: janeiro de 1993 a dezembro de 2023', 'A data à esquerda; cerca de um ano por segundo'],
    ],
    description: [
      'A escotilha olha para o mar aberto. A régua no vidro está em centímetros e polegadas; a barra azul começa no nível do mar de 1993 e sobe com o registro de satélites da NASA.',
      'Em janeiro de 2003 o mar estava cerca de 3,2 centímetros acima de 1993; em janeiro de 2013, cerca de 6,4; em janeiro de 2023, cerca de 9,8.',
      'A última década somou mais: cerca de 3,5 centímetros, contra cerca de 3,2 em cada uma das duas primeiras.',
      'O ponto mais alto do registro é em outubro de 2023, cerca de 11,5 centímetros acima de 1993.',
    ],
    limits: [
      'A NASA não publica os números com este vídeo, então nós os lemos da imagem: a altura da barra azul contra a régua impressa no quadro, onde um pixel é meio milímetro.',
      'As datas vêm do ano que a NASA imprime ao lado da barra, que avança num ritmo constante de um ano a cada 29 quadros do vídeo, então uma data tem precisão de cerca de duas semanas.',
      'Esta é a média de todos os oceanos. O mar não sobe igual em todo lugar, e este registro não mostra onde.',
      'O nível de 1993 é onde o registro de satélites começa, não um nível natural ou normal.',
      'As ondas na escotilha seguem uma média de 60 dias do mesmo dado; a barra azul, que nós lemos, mostra as próprias medições (TOPEX/Poseidon, Jason-1, Jason-2 e Jason-3). Depois de março de 2022 o registro inclui dados do Sentinel-6 Michael Freilich que a NASA marca como preliminares.',
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
    whatYouHear:
      'Por el ojo de buey de un barco, la NASA muestra cuánto subió el océano de 1993 a 2023. Las cuerdas sostienen una nota larga que sigue al agua: por cada centímetro que gana el mar, la nota sube un escalón. La primera vez que el mar llega a un nuevo centímetro por encima de 1993, suena una campana.',
    mapping: [
      ['Nivel medio global del mar por encima de 1993, leído de la barra azul en la regla de la NASA', 'Cuerdas: una nota larga, un escalón más aguda por cada centímetro, y un poco más fuerte'],
      ['Un nuevo centímetro entero por encima de 1993, alcanzado por primera vez', 'Glockenspiel: una campana, más aguda por cada centímetro'],
      ['Tiempo: enero de 1993 a diciembre de 2023', 'La fecha a la izquierda; cerca de un año por segundo'],
    ],
    description: [
      'El ojo de buey mira al mar abierto. La regla en el vidrio está en centímetros y pulgadas; la barra azul empieza en el nivel del mar de 1993 y sube con el registro de satélites de la NASA.',
      'En enero de 2003 el mar estaba unos 3,2 centímetros por encima de 1993; en enero de 2013, unos 6,4; en enero de 2023, unos 9,8.',
      'La última década sumó más: unos 3,5 centímetros, frente a unos 3,2 en cada una de las dos primeras.',
      'El punto más alto del registro es en octubre de 2023, unos 11,5 centímetros por encima de 1993.',
    ],
    limits: [
      'La NASA no publica los números con este vídeo, así que los leemos de la imagen: la altura de la barra azul contra la regla impresa en el cuadro, donde un píxel es medio milímetro.',
      'Las fechas vienen del año que la NASA imprime junto a la barra, que avanza a un ritmo constante de un año cada 29 cuadros del vídeo, así que una fecha tiene una precisión de unas dos semanas.',
      'Este es el promedio de todos los océanos. El mar no sube igual en todas partes, y este registro no muestra dónde.',
      'El nivel de 1993 es donde empieza el registro de satélites, no un nivel natural o normal.',
      'Las olas en el ojo de buey siguen un promedio de 60 días del mismo dato; la barra azul, que leemos, muestra las propias mediciones (TOPEX/Poseidon, Jason-1, Jason-2 y Jason-3). Después de marzo de 2022 el registro incluye datos del Sentinel-6 Michael Freilich que la NASA marca como preliminares.',
    ],
    narration: {
      intro: 'El mar, por un ojo de buey, de 1993 a 2023. Las cuerdas siguen al agua: un escalón más por cada centímetro.',
      'year-2003': '{date}: diez años después, el mar está unos tres centímetros más alto.',
      'year-2013': '{date}: veinte años después, unos seis centímetros.',
      outro: 'A finales de 2023 el mar estaba unos once centímetros por encima de 1993. El disco vuelve a empezar.',
    },
  },
};
