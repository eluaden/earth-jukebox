// Liner notes and narration of the night lights track, EN / PT / ES.
// Rules (docs/si-e-referencias.md): only facts from the NASA page (SVS 5313) or computed from the track's
// own grid (scripts/pipeline/nightlights.py). The team reviews these texts before publishing.
// Shown at a glance: dataset, whatYouHear, mapping, highlights. Behind "Learn more": description, limits.
// {date} is the year, filled by the app.

export const NIGHT_LIGHTS_TEXT = {
  en: {
    title: 'Night Lights',
    dataset: 'Black Marble (NASA/NOAA, VIIRS)',
    whatYouHear: 'Twelve years of Earth’s lights at night, one year per turn. More light, more piano notes. Strings fall where light drops; bells rise where it grows.',
    mapping: [
      ['Light in 6 latitude bands, 70° N to 45° S', 'Piano: more light, more notes; north is higher'],
      ['A band with ≥10% less light than the year before', 'Low strings, falling'],
      ['A band with ≥10% more light', 'Glockenspiel, rising'],
      ['Sea', 'Silence'],
    ],
    highlights: [
      'The planet’s light grows by about a third from 2012 to 2023 (+35%).',
      'The biggest jump is 2021 to 2022: about 10% in a single year.',
      'Most light lies between 20° and 50° N, where the piano is busiest.',
    ],
    description: [
      'The globe wears NASA’s yearly average of the lights seen from orbit.',
      'A change of 10% or more in a year is rare (a few percent of the places the needle crosses), so each falling or rising figure marks a real change.',
    ],
    limits: [
      'We read NASA’s image, not the original measurement files. Brightness is relative (0–255 in the image), not a physical unit.',
      'Light is the brightness above the same map with the lights off, averaged over 2° × 2° boxes.',
      'Which years dip depends on how light is counted: 2016 is 4% below 2015 in our reading; counting only the brightest points, the dip moves to 2020. The 2012–2023 rise and the 2022 jump hold either way.',
      'One value per year, so changes within a year are not heard. NASA’s 16:9 map was stretched to cover the globe.',
    ],
    narration: {
      intro: 'These are the lights of the planet at night, one year at a time, from 2012 to 2023. The more light under the needle, the more piano notes.',
      'biggest-jump': '{date}: the biggest jump of the series, about ten percent more light than the year before.',
      brightest: '{date}: the brightest year, about a third more light than in 2012.',
      outro: 'Twelve years of night have passed under the needle. The record starts again.',
    },
  },
  pt: {
    title: 'Luzes noturnas',
    dataset: 'Black Marble (NASA/NOAA, VIIRS)',
    whatYouHear: 'Doze anos de luzes da Terra à noite, um ano por volta. Mais luz, mais notas de piano. Cordas descem onde a luz cai; sinos sobem onde ela cresce.',
    mapping: [
      ['Luz em 6 faixas de latitude, 70° N a 45° S', 'Piano: mais luz, mais notas; norte mais agudo'],
      ['Faixa com ≥10% menos luz que no ano anterior', 'Cordas graves, descendo'],
      ['Faixa com ≥10% mais luz', 'Glockenspiel, subindo'],
      ['Mar', 'Silêncio'],
    ],
    highlights: [
      'A luz do planeta cresce cerca de um terço de 2012 a 2023 (+35%).',
      'O maior salto é de 2021 para 2022: cerca de 10% em um único ano.',
      'A maior parte da luz fica entre 20° e 50° N, onde o piano toca mais.',
    ],
    description: [
      'O globo veste a média anual da NASA das luzes vistas da órbita.',
      'Uma mudança de 10% ou mais num ano é rara (alguns por cento dos lugares que a agulha cruza), então cada figura que desce ou sobe marca uma mudança real.',
    ],
    limits: [
      'Lemos a imagem da NASA, não os arquivos originais de medição. O brilho é relativo (0–255 na imagem), não uma unidade física.',
      'A luz é o brilho acima do mesmo mapa com as luzes apagadas, na média de quadrados de 2° × 2°.',
      'Quais anos caem depende de como a luz é contada: 2016 fica 4% abaixo de 2015 na nossa leitura; contando só os pontos mais brilhantes, a queda passa para 2020. A subida de 2012–2023 e o salto de 2022 valem nos dois casos.',
      'Um valor por ano, então mudanças dentro do ano não são ouvidas. O mapa 16:9 da NASA foi esticado para cobrir o globo.',
    ],
    narration: {
      intro: 'Estas são as luzes do planeta à noite, um ano de cada vez, de 2012 a 2023. Quanto mais luz embaixo da agulha, mais notas de piano.',
      'biggest-jump': '{date}: o maior salto da série, cerca de dez por cento mais luz que no ano anterior.',
      brightest: '{date}: o ano mais claro, cerca de um terço mais luz que em 2012.',
      outro: 'Doze anos de noite passaram sob a agulha. O disco recomeça.',
    },
  },
  es: {
    title: 'Luces nocturnas',
    dataset: 'Black Marble (NASA/NOAA, VIIRS)',
    whatYouHear: 'Doce años de luces de la Tierra de noche, un año por vuelta. Más luz, más notas de piano. Las cuerdas bajan donde la luz cae; las campanas suben donde crece.',
    mapping: [
      ['Luz en 6 franjas de latitud, 70° N a 45° S', 'Piano: más luz, más notas; norte más agudo'],
      ['Franja con ≥10% menos luz que el año anterior', 'Cuerdas graves, bajando'],
      ['Franja con ≥10% más luz', 'Glockenspiel, subiendo'],
      ['Mar', 'Silencio'],
    ],
    highlights: [
      'La luz del planeta crece cerca de un tercio de 2012 a 2023 (+35%).',
      'El mayor salto es de 2021 a 2022: cerca de un 10% en un solo año.',
      'La mayor parte de la luz está entre 20° y 50° N, donde el piano toca más.',
    ],
    description: [
      'El globo viste el promedio anual de la NASA de las luces vistas desde la órbita.',
      'Un cambio del 10% o más en un año es raro (unos pocos por ciento de los lugares que cruza la aguja), así que cada figura que baja o sube marca un cambio real.',
    ],
    limits: [
      'Leemos la imagen de la NASA, no los archivos originales de medición. El brillo es relativo (0–255 en la imagen), no una unidad física.',
      'La luz es el brillo por encima del mismo mapa con las luces apagadas, en el promedio de cuadros de 2° × 2°.',
      'Qué años bajan depende de cómo se cuente la luz: 2016 queda un 4% por debajo de 2015 en nuestra lectura; contando solo los puntos más brillantes, la caída pasa a 2020. La subida de 2012–2023 y el salto de 2022 se mantienen en ambos casos.',
      'Un valor por año, así que los cambios dentro del año no se oyen. El mapa 16:9 de la NASA se estiró para cubrir el globo.',
    ],
    narration: {
      intro: 'Estas son las luces del planeta de noche, un año a la vez, de 2012 a 2023. Cuanta más luz bajo la aguja, más notas de piano.',
      'biggest-jump': '{date}: el mayor salto de la serie, cerca de un diez por ciento más de luz que el año anterior.',
      brightest: '{date}: el año más claro, cerca de un tercio más de luz que en 2012.',
      outro: 'Doce años de noche han pasado bajo la aguja. El disco vuelve a empezar.',
    },
  },
};
