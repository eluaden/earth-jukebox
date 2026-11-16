// Liner notes and narration of the lightning track, EN / PT / ES.
// Rules: only facts from the NASA page (SVS 5011) or computed from the track's
// own grid (scripts/pipeline/lightning.py). The team reviews these texts before publishing.
// Shown at a glance: dataset, whatYouHear, mapping, highlights. Behind "Learn more": description, limits.

export const LIGHTNING_TEXT = {
  en: {
    title: 'Lightning',
    dataset: 'Lightning Imaging Sensor (LIS) on the ISS',
    whatYouHear: 'Six years of lightning seen from space, ten days at a time. Each marimba hit is a latitude band with lightning: further north is higher, more lightning is louder.',
    mapping: [
      ['Lightning in 10 latitude bands, 55° N to 55° S', 'Marimba: one hit per band; north is higher'],
      ['More area covered by lightning', 'Stronger hit'],
      ['North · tropics · south', 'Three voices, as an arpeggio'],
      ['No lightning, or beyond 55° (no data)', 'Silence'],
    ],
    highlights: [
      'Lightning follows the summer: its centre moves from about 12° S in January to about 30° N in August, and the marimba climbs and sinks with it.',
      '64% of the lightning is north of the equator. The busiest place is central Africa, around 1° S, 27° E.',
    ],
    description: [
      'Each yellow dot is a lightning event in the last 10 days. The equator and tropic lines are drawn by NASA, not data.',
      'There is no clear trend from year to year: the big changes are between seasons.',
    ],
    limits: [
      'We read NASA’s map of the quality-controlled LIS dataset and measure how much of each 2° × 2° box the dots cover, not how many flashes there were. Where dots overlap, the busiest places count less.',
      'The sensor only sees between about 55° N and 55° S, because of the station’s orbit. No data is not the same as no lightning.',
      'The station passes at different times of day, so a 10-day window misses some storms.',
      'Dates come from NASA’s list; we corrected “2003” to 2023 in its last lines. 13 January–1 February 2019 has no data and is skipped.',
    ],
    narration: {
      intro: 'This is lightning seen from the International Space Station, from 2017 to 2023. Every hit is lightning under the needle: the further north, the higher the note.',
      'north-summer': '{date}: summer in the north. The lightning, and the notes, have moved north.',
      'south-summer': '{date}: now it is summer in the south, and the lightning has followed it.',
      outro: 'Six years of storms have passed under the needle. The record starts again.',
    },
  },
  pt: {
    title: 'Raios',
    dataset: 'Sensor de raios LIS na Estação Espacial Internacional',
    whatYouHear: 'Seis anos de raios vistos do espaço, dez dias por vez. Cada batida de marimba é uma faixa de latitude com raios: mais ao norte é mais agudo, mais raios é mais forte.',
    mapping: [
      ['Raios em 10 faixas de latitude, 55° N a 55° S', 'Marimba: uma batida por faixa; norte mais agudo'],
      ['Mais área coberta por raios', 'Batida mais forte'],
      ['Norte · trópicos · sul', 'Três vozes, em arpejo'],
      ['Sem raios, ou além de 55° (sem dado)', 'Silêncio'],
    ],
    highlights: [
      'Os raios seguem o verão: o centro deles vai de cerca de 12° S em janeiro a cerca de 30° N em agosto, e a marimba sobe e desce junto.',
      '64% dos raios ficam ao norte do equador. O lugar mais ativo é a África central, perto de 1° S, 27° E.',
    ],
    description: [
      'Cada ponto amarelo é um raio nos últimos 10 dias. As linhas do equador e dos trópicos são desenhadas pela NASA, não são dado.',
      'De um ano para o outro não há tendência clara: as grandes mudanças são entre as estações.',
    ],
    limits: [
      'Lemos o mapa da NASA do conjunto LIS com controle de qualidade e medimos quanto de cada quadrado de 2° × 2° os pontos cobrem, não quantos raios houve. Onde os pontos se sobrepõem, os lugares mais ativos contam menos.',
      'O sensor só enxerga entre cerca de 55° N e 55° S, por causa da órbita da estação. Sem dado não é o mesmo que sem raios.',
      'A estação passa em horas diferentes do dia, então uma janela de 10 dias perde algumas tempestades.',
      'As datas vêm da lista da NASA; corrigimos “2003” para 2023 nas últimas linhas. De 13 de janeiro a 1º de fevereiro de 2019 não há dado, e o disco pula esse trecho.',
    ],
    narration: {
      intro: 'Estes são os raios vistos da Estação Espacial Internacional, de 2017 a 2023. Cada batida é um raio embaixo da agulha: quanto mais ao norte, mais aguda a nota.',
      'north-summer': '{date}: verão no norte. Os raios, e as notas, foram para o norte.',
      'south-summer': '{date}: agora é verão no sul, e os raios foram atrás.',
      outro: 'Seis anos de tempestades passaram sob a agulha. O disco recomeça.',
    },
  },
  es: {
    title: 'Rayos',
    dataset: 'Sensor de rayos LIS en la Estación Espacial Internacional',
    whatYouHear: 'Seis años de rayos vistos desde el espacio, diez días a la vez. Cada golpe de marimba es una franja de latitud con rayos: más al norte es más agudo, más rayos es más fuerte.',
    mapping: [
      ['Rayos en 10 franjas de latitud, 55° N a 55° S', 'Marimba: un golpe por franja; norte más agudo'],
      ['Más área cubierta por rayos', 'Golpe más fuerte'],
      ['Norte · trópicos · sur', 'Tres voces, en arpegio'],
      ['Sin rayos, o más allá de 55° (sin dato)', 'Silencio'],
    ],
    highlights: [
      'Los rayos siguen al verano: su centro va de unos 12° S en enero a unos 30° N en agosto, y la marimba sube y baja con él.',
      'El 64% de los rayos está al norte del ecuador. El lugar más activo es África central, cerca de 1° S, 27° E.',
    ],
    description: [
      'Cada punto amarillo es un rayo en los últimos 10 días. Las líneas del ecuador y de los trópicos las dibuja la NASA, no son dato.',
      'De un año al otro no hay una tendencia clara: los grandes cambios son entre las estaciones.',
    ],
    limits: [
      'Leemos el mapa de la NASA del conjunto LIS con control de calidad y medimos cuánto de cada cuadro de 2° × 2° cubren los puntos, no cuántos rayos hubo. Donde los puntos se superponen, los lugares más activos cuentan menos.',
      'El sensor solo ve entre unos 55° N y 55° S, por la órbita de la estación. Sin dato no es lo mismo que sin rayos.',
      'La estación pasa a horas distintas del día, así que una ventana de 10 días pierde algunas tormentas.',
      'Las fechas vienen de la lista de la NASA; corregimos “2003” por 2023 en sus últimas líneas. Del 13 de enero al 1 de febrero de 2019 no hay dato, y el disco salta ese tramo.',
    ],
    narration: {
      intro: 'Estos son los rayos vistos desde la Estación Espacial Internacional, de 2017 a 2023. Cada golpe es un rayo bajo la aguja: cuanto más al norte, más aguda la nota.',
      'north-summer': '{date}: verano en el norte. Los rayos, y las notas, se fueron al norte.',
      'south-summer': '{date}: ahora es verano en el sur, y los rayos lo siguieron.',
      outro: 'Seis años de tormentas han pasado bajo la aguja. El disco vuelve a empezar.',
    },
  },
};
