// Liner notes and narration of the lightning track, EN / PT / ES.
// Rules (docs/si-e-referencias.md): only facts from the NASA page (SVS 5011) or computed from the track's
// own grid (scripts/pipeline/lightning.py). The team reviews these texts before publishing.

export const LIGHTNING_TEXT = {
  en: {
    title: 'Lightning',
    whatYouHear:
      'The needle reads the lightning seen from the International Space Station under it, ten days at a time, from 2017 to 2023. Every band of latitude with lightning strikes a marimba note: the further north, the higher the note, and the more lightning, the stronger the hit. Where there is none, silence.',
    mapping: [
      ['Lightning under the needle in NASA’s 10-day window, in ten latitude bands from 55° N to 55° S', 'Marimba: one hit per band with lightning; latitude sets the pitch (north is higher); more lightning, stronger hit'],
      ['North of 23.5° N · tropics · south of 23.5° S', 'The three voices; each plays its bands one after another, as an arpeggio'],
      ['No lightning', 'Silence'],
      ['Beyond 55° N or S (the sensor does not see there)', 'Silence: no data'],
      ['Time: 11 March 2017 to 27 August 2023, one step every 10 days', 'The date on the left'],
    ],
    description: [
      'The globe wears NASA’s flat map of the lightning seen by the Lightning Imaging Sensor on the International Space Station. Each yellow dot is a lightning event in the last 10 days.',
      'Lightning follows the summer. In January the centre of all the lightning on the map sits about 12° south; in August, about 30° north. You hear it as the marimba climbing in the northern summer and sinking in the southern one.',
      'About two thirds of the lightning on this map (64%) is north of the equator.',
      'The busiest place on this map is central Africa, just south of the equator, around 1° S and 27° E.',
      'From one year to the next there is no clear trend: the big changes are between the seasons.',
    ],
    limits: [
      'The data is the quality-controlled science dataset of the Lightning Imaging Sensor (LIS) on the ISS, as drawn by NASA: every dot is one lightning event in a 10-day window.',
      'We measure how much of each 2° × 2° box the dots cover, not how many flashes there were. Where lightning is dense the dots overlap, so the busiest places count less than they should.',
      'The sensor only sees between about 55° N and 55° S, because of the space station’s orbit. Beyond that there is no data, which is not the same as no lightning.',
      'Dates come from NASA’s own list for this video. Its last lines say 2003 instead of 2023, and we corrected them. NASA’s video skips 13 January to 1 February 2019, when there is no data, and so does the record.',
      'The station passes over each place at different times of day, so a 10-day window does not see every storm.',
      'The lines of the equator and the tropics are drawn by NASA on the map; they are part of the picture, not data.',
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
    whatYouHear:
      'A agulha lê os raios vistos da Estação Espacial Internacional embaixo dela, dez dias de cada vez, de 2017 a 2023. Cada faixa de latitude com raios toca uma nota de marimba: quanto mais ao norte, mais aguda a nota, e quanto mais raios, mais forte a batida. Onde não há raios, silêncio.',
    mapping: [
      ['Raios embaixo da agulha na janela de 10 dias da NASA, em dez faixas de latitude de 55° N a 55° S', 'Marimba: uma batida por faixa com raios; a latitude define a altura (norte mais agudo); mais raios, batida mais forte'],
      ['Ao norte de 23,5° N · trópicos · ao sul de 23,5° S', 'As três vozes; cada uma toca suas faixas uma depois da outra, em arpejo'],
      ['Sem raios', 'Silêncio'],
      ['Além de 55° N ou S (o sensor não enxerga ali)', 'Silêncio: sem dado'],
      ['Tempo: 11 de março de 2017 a 27 de agosto de 2023, um passo a cada 10 dias', 'A data à esquerda'],
    ],
    description: [
      'O globo veste o mapa plano da NASA com os raios vistos pelo Lightning Imaging Sensor na Estação Espacial Internacional. Cada ponto amarelo é um raio nos últimos 10 dias.',
      'Os raios seguem o verão. Em janeiro o centro de todos os raios do mapa fica cerca de 12° ao sul; em agosto, cerca de 30° ao norte. Você ouve isso como a marimba subindo no verão do norte e descendo no do sul.',
      'Cerca de dois terços dos raios deste mapa (64%) ficam ao norte do equador.',
      'O lugar com mais raios neste mapa é a África central, logo ao sul do equador, perto de 1° S e 27° E.',
      'De um ano para o outro não há uma tendência clara: as grandes mudanças são entre as estações.',
    ],
    limits: [
      'O dado é o conjunto científico com controle de qualidade do Lightning Imaging Sensor (LIS) na ISS, como desenhado pela NASA: cada ponto é um raio numa janela de 10 dias.',
      'Medimos quanto de cada quadrado de 2° × 2° os pontos cobrem, não quantos raios houve. Onde há muitos raios os pontos se sobrepõem, então os lugares mais ativos contam menos do que deveriam.',
      'O sensor só enxerga entre cerca de 55° N e 55° S, por causa da órbita da estação. Além disso não há dado, o que não é o mesmo que não haver raios.',
      'As datas vêm da lista da própria NASA para este vídeo. As últimas linhas dizem 2003 no lugar de 2023, e nós corrigimos. O vídeo da NASA pula de 13 de janeiro a 1º de fevereiro de 2019, quando não há dado, e o disco também.',
      'A estação passa sobre cada lugar em horas diferentes do dia, então uma janela de 10 dias não vê todas as tempestades.',
      'As linhas do equador e dos trópicos são desenhadas pela NASA no mapa; fazem parte da imagem, não são dado.',
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
    whatYouHear:
      'La aguja lee los rayos vistos desde la Estación Espacial Internacional que tiene debajo, diez días a la vez, de 2017 a 2023. Cada franja de latitud con rayos toca una nota de marimba: cuanto más al norte, más aguda la nota, y cuantos más rayos, más fuerte el golpe. Donde no hay rayos, silencio.',
    mapping: [
      ['Rayos bajo la aguja en la ventana de 10 días de la NASA, en diez franjas de latitud de 55° N a 55° S', 'Marimba: un golpe por franja con rayos; la latitud define la altura (norte más agudo); más rayos, golpe más fuerte'],
      ['Al norte de 23,5° N · trópicos · al sur de 23,5° S', 'Las tres voces; cada una toca sus franjas una tras otra, en arpegio'],
      ['Sin rayos', 'Silencio'],
      ['Más allá de 55° N o S (el sensor no ve ahí)', 'Silencio: sin dato'],
      ['Tiempo: del 11 de marzo de 2017 al 27 de agosto de 2023, un paso cada 10 días', 'La fecha a la izquierda'],
    ],
    description: [
      'El globo viste el mapa plano de la NASA con los rayos vistos por el Lightning Imaging Sensor en la Estación Espacial Internacional. Cada punto amarillo es un rayo en los últimos 10 días.',
      'Los rayos siguen al verano. En enero el centro de todos los rayos del mapa está unos 12° al sur; en agosto, unos 30° al norte. Lo oyes como la marimba subiendo en el verano del norte y bajando en el del sur.',
      'Cerca de dos tercios de los rayos de este mapa (64%) están al norte del ecuador.',
      'El lugar con más rayos de este mapa es África central, justo al sur del ecuador, cerca de 1° S y 27° E.',
      'De un año al otro no hay una tendencia clara: los grandes cambios son entre las estaciones.',
    ],
    limits: [
      'El dato es el conjunto científico con control de calidad del Lightning Imaging Sensor (LIS) en la ISS, tal como lo dibuja la NASA: cada punto es un rayo en una ventana de 10 días.',
      'Medimos cuánto de cada cuadro de 2° × 2° cubren los puntos, no cuántos rayos hubo. Donde hay muchos rayos los puntos se superponen, así que los lugares más activos cuentan menos de lo que deberían.',
      'El sensor solo ve entre unos 55° N y 55° S, por la órbita de la estación. Más allá no hay dato, que no es lo mismo que no haber rayos.',
      'Las fechas vienen de la lista de la propia NASA para este vídeo. Sus últimas líneas dicen 2003 en lugar de 2023, y las corregimos. El vídeo de la NASA salta del 13 de enero al 1 de febrero de 2019, cuando no hay dato, y el disco también.',
      'La estación pasa sobre cada lugar a horas distintas del día, así que una ventana de 10 días no ve todas las tormentas.',
      'Las líneas del ecuador y de los trópicos las dibuja la NASA en el mapa; son parte de la imagen, no dato.',
    ],
    narration: {
      intro: 'Estos son los rayos vistos desde la Estación Espacial Internacional, de 2017 a 2023. Cada golpe es un rayo bajo la aguja: cuanto más al norte, más aguda la nota.',
      'north-summer': '{date}: verano en el norte. Los rayos, y las notas, se fueron al norte.',
      'south-summer': '{date}: ahora es verano en el sur, y los rayos lo siguieron.',
      outro: 'Seis años de tormentas han pasado bajo la aguja. El disco vuelve a empezar.',
    },
  },
};
