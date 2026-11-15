// Liner notes and narration of the night lights track, EN / PT / ES.
// Rules (docs/si-e-referencias.md): only facts from the NASA page (SVS 5313) or computed from the track's
// own grid (scripts/pipeline/nightlights.py). The team reviews these texts before publishing.
// {date} is the year, filled by the app.

export const NIGHT_LIGHTS_TEXT = {
  en: {
    title: 'Night Lights',
    whatYouHear:
      'The needle reads the lights of the planet at night under it, one year at a time, from 2012 to 2023. The more light, the more piano notes; further north, higher notes. When a place has clearly less light than the year before, low strings fall; when it has clearly more, bells rise. The sea is silent.',
    mapping: [
      ['Light under the needle, in six latitude bands from 70° N to 45° S', 'Piano: more light, more notes; latitude sets the pitch (north is higher)'],
      ['Lights going out: a band with at least 10% less light than the year before', 'Low strings: a falling minor third'],
      ['New lights: a band with at least 10% more light than the year before', 'Glockenspiel: a rising major third'],
      ['Sea', 'Silence'],
      ['Time: 2012 to 2023, one year per turn of the globe (10 seconds)', 'The year on the left'],
    ],
    description: [
      "The globe wears NASA's map of Earth at night: a yearly average of the lights seen from orbit, from 2012 to 2023.",
      'Added over the whole planet, the light on this map grows by about a third between 2012 and 2023 (+35%).',
      'The biggest jump is from 2021 to 2022: about 10% more light in a single year.',
      'Most of the light lies between 20° and 50° N, so that is where the piano is busiest; south of the equator it plays much less.',
      'A change of 10% or more from one year to the next is rare: it happens in only a few percent of the places the needle crosses, so each falling or rising figure marks a real change in that band.',
    ],
    limits: [
      'The data is NASA Black Marble (NASA/NOAA, VIIRS on Suomi NPP), as drawn in NASA’s visualization. We read the image, not the original measurement files.',
      'Brightness is relative: how much the lights brighten NASA’s image, from 0 to 255. The map has no numeric legend, so this is not a physical unit.',
      'Light is measured as the brightness above the same map with the lights off (a frame of NASA’s video), averaged over 2° × 2° boxes. Boxes that are almost all sea are silent.',
      'Which single years go down depends on how light is counted: in our reading 2016 has 4% less light than 2015; counting only the brightest points, the dip moves to 2020. The rise from 2012 to 2023 and the jump of 2022 hold either way.',
      'There is one value per year, so changes within a year are not heard.',
      'NASA’s map is 16:9 and was stretched to cover the globe; the year NASA prints on the map is shown on the left of the screen instead.',
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
    whatYouHear:
      'A agulha lê as luzes do planeta à noite embaixo dela, um ano de cada vez, de 2012 a 2023. Quanto mais luz, mais notas de piano; mais ao norte, notas mais agudas. Quando um lugar tem bem menos luz que no ano anterior, cordas graves descem; quando tem bem mais, sinos sobem. O mar fica em silêncio.',
    mapping: [
      ['Luz embaixo da agulha, em seis faixas de latitude de 70° N a 45° S', 'Piano: mais luz, mais notas; a latitude define a altura (norte mais agudo)'],
      ['Luzes que se apagam: faixa com pelo menos 10% menos luz que no ano anterior', 'Cordas graves: uma terça menor descendo'],
      ['Luzes novas: faixa com pelo menos 10% mais luz que no ano anterior', 'Glockenspiel: uma terça maior subindo'],
      ['Mar', 'Silêncio'],
      ['Tempo: 2012 a 2023, um ano por volta do globo (10 segundos)', 'O ano à esquerda'],
    ],
    description: [
      'O globo veste o mapa da NASA da Terra à noite: uma média anual das luzes vistas da órbita, de 2012 a 2023.',
      'Somando o planeta inteiro, a luz neste mapa cresce cerca de um terço entre 2012 e 2023 (+35%).',
      'O maior salto é de 2021 para 2022: cerca de 10% mais luz em um único ano.',
      'A maior parte da luz fica entre 20° e 50° N, por isso é ali que o piano toca mais; ao sul do equador ele toca bem menos.',
      'Uma mudança de 10% ou mais de um ano para o outro é rara: acontece em só alguns por cento dos lugares que a agulha cruza, então cada figura que desce ou sobe marca uma mudança real naquela faixa.',
    ],
    limits: [
      'O dado é o Black Marble da NASA (NASA/NOAA, VIIRS no Suomi NPP), como desenhado na visualização da NASA. Lemos a imagem, não os arquivos originais de medição.',
      'O brilho é relativo: quanto as luzes clareiam a imagem da NASA, de 0 a 255. O mapa não tem legenda numérica, então isso não é uma unidade física.',
      'A luz é medida como o brilho acima do mesmo mapa com as luzes apagadas (um frame do vídeo da NASA), na média de quadrados de 2° × 2°. Quadrados quase todos de mar ficam em silêncio.',
      'Quais anos isolados caem depende de como a luz é contada: na nossa leitura 2016 tem 4% menos luz que 2015; contando só os pontos mais brilhantes, a queda passa para 2020. A subida de 2012 a 2023 e o salto de 2022 valem nos dois casos.',
      'Há um valor por ano, então mudanças dentro do ano não são ouvidas.',
      'O mapa da NASA é 16:9 e foi esticado para cobrir o globo; o ano que a NASA imprime no mapa aparece à esquerda da tela.',
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
    whatYouHear:
      'La aguja lee las luces del planeta de noche que tiene debajo, un año a la vez, de 2012 a 2023. Cuanta más luz, más notas de piano; más al norte, notas más agudas. Cuando un lugar tiene claramente menos luz que el año anterior, bajan cuerdas graves; cuando tiene claramente más, suben campanas. El mar queda en silencio.',
    mapping: [
      ['Luz bajo la aguja, en seis franjas de latitud de 70° N a 45° S', 'Piano: más luz, más notas; la latitud define la altura (norte más agudo)'],
      ['Luces que se apagan: franja con al menos 10% menos luz que el año anterior', 'Cuerdas graves: una tercera menor que baja'],
      ['Luces nuevas: franja con al menos 10% más luz que el año anterior', 'Glockenspiel: una tercera mayor que sube'],
      ['Mar', 'Silencio'],
      ['Tiempo: 2012 a 2023, un año por vuelta del globo (10 segundos)', 'El año a la izquierda'],
    ],
    description: [
      'El globo viste el mapa de la NASA de la Tierra de noche: un promedio anual de las luces vistas desde la órbita, de 2012 a 2023.',
      'Sumando todo el planeta, la luz en este mapa crece cerca de un tercio entre 2012 y 2023 (+35%).',
      'El mayor salto es de 2021 a 2022: cerca de un 10% más de luz en un solo año.',
      'La mayor parte de la luz está entre 20° y 50° N, por eso ahí el piano toca más; al sur del ecuador toca mucho menos.',
      'Un cambio del 10% o más de un año al siguiente es raro: ocurre solo en unos pocos por ciento de los lugares que cruza la aguja, así que cada figura que baja o sube marca un cambio real en esa franja.',
    ],
    limits: [
      'El dato es el Black Marble de la NASA (NASA/NOAA, VIIRS en el Suomi NPP), tal como lo dibuja la visualización de la NASA. Leemos la imagen, no los archivos originales de medición.',
      'El brillo es relativo: cuánto aclaran las luces la imagen de la NASA, de 0 a 255. El mapa no tiene leyenda numérica, así que no es una unidad física.',
      'La luz se mide como el brillo por encima del mismo mapa con las luces apagadas (un fotograma del vídeo de la NASA), en el promedio de cuadros de 2° × 2°. Los cuadros casi todo mar quedan en silencio.',
      'Qué años sueltos bajan depende de cómo se cuente la luz: en nuestra lectura 2016 tiene un 4% menos de luz que 2015; contando solo los puntos más brillantes, la caída pasa a 2020. La subida de 2012 a 2023 y el salto de 2022 se mantienen en ambos casos.',
      'Hay un valor por año, así que los cambios dentro del año no se oyen.',
      'El mapa de la NASA es 16:9 y se estiró para cubrir el globo; el año que la NASA imprime en el mapa aparece a la izquierda de la pantalla.',
    ],
    narration: {
      intro: 'Estas son las luces del planeta de noche, un año a la vez, de 2012 a 2023. Cuanta más luz bajo la aguja, más notas de piano.',
      'biggest-jump': '{date}: el mayor salto de la serie, cerca de un diez por ciento más de luz que el año anterior.',
      brightest: '{date}: el año más claro, cerca de un tercio más de luz que en 2012.',
      outro: 'Doce años de noche han pasado bajo la aguja. El disco vuelve a empezar.',
    },
  },
};
