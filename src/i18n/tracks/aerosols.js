// Liner notes and narration of the aerosols track, EN / PT / ES.
// Rules: only facts from the NASA page (SVS 5669) or computed from the track's
// own grid (scripts/pipeline/aerosols.py). The team reviews these texts before publishing.
// Shown at a glance: dataset, whatYouHear, mapping, highlights. Behind "Learn more": description, limits.
// Narration markers are places, not dates: the needle meets them on every turn of the globe.

export const AEROSOLS_TEXT = {
  en: {
    title: 'Aerosols',
    dataset: 'GEOS model (NASA GMAO)',
    whatYouHear: 'The particles in the air at one instant: 19 August 2025, 20:00 UTC. Every turn reads the same picture, place by place.',
    mapping: [
      ['Smoke (red-orange)', 'Low strings'],
      ['Dust (pink)', 'Marimba'],
      ['Sea salt (blue-grey)', 'Glockenspiel'],
      ['Latitude · strength of the colour', 'Pitch (north is higher) · how hard the note is played'],
      ['Sulfate (green)', 'Not played: it would cover the other three'],
    ],
    highlights: [
      'All the dust is north of the equator: Saharan dust crossing the Atlantic, strongest around 21° N, 23° W.',
      '71% of the smoke is south of the equator, peaking over central Africa, where NASA points to agricultural burning.',
      '74% of the sea salt is in the south, lifted by strong winds. In the Atlantic, Hurricane Erin draws it in spirals.',
    ],
    description: [
      'NASA colours each type: smoke from fires red-orange, dust pink, sea salt blue, sulfates from pollution and volcanoes green.',
      'Dust runs from the Caribbean (about 65° W) to about 67° E. Smoke peaks around 3° S, 17° E, and in the north over Spain (about 39° N), where NASA mentions wildfires. Sea salt peaks around 51° S, 91° W, in the South Pacific.',
      'Sulfate covers more of the map than any other type, 71% of it in the north; NASA points to plumes from Kilauea (Hawaii) and Etna (Italy).',
    ],
    limits: [
      'This is a model, not a photograph: GEOS combines satellite and ground observations to estimate the air at one instant.',
      'NASA’s image has no numeric scale. We measure each type’s colour against its strongest value in this image: a note says more or less, never how much, and types cannot be compared.',
      'Each pixel goes to the nearest type colour; blends are split. Yellow (city lights) is left out.',
      'Over land the colours mix with the grey of the land, so dust over the Sahara sounds softer than over the Atlantic.',
      'Sulfate is left out of the music because each record has at most three voices. NASA’s 16:9 image was stretched to 2:1; its coasts line up with the other records.',
    ],
    narration: {
      intro: 'This is the air of a single moment: 19 August 2025, as NASA’s GEOS model saw it. Low strings are smoke, the marimba is dust, the bells are sea salt.',
      dust: 'Under the needle: dust from the Sahara, crossing the Atlantic.',
      smoke: 'Now smoke, from the fires burning in Africa.',
      'sea-salt': 'Sea salt, lifted by the winds over the southern seas.',
      outro: 'The same moment comes round again: every turn plays the same air, place by place.',
    },
  },
  pt: {
    title: 'Aerossóis',
    dataset: 'Modelo GEOS (NASA GMAO)',
    whatYouHear: 'As partículas no ar em um único instante: 19 de agosto de 2025, 20:00 UTC. Cada volta lê a mesma imagem, lugar por lugar.',
    mapping: [
      ['Fumaça (vermelho-alaranjado)', 'Cordas graves'],
      ['Poeira (rosa)', 'Marimba'],
      ['Sal marinho (azul-acinzentado)', 'Glockenspiel'],
      ['Latitude · força da cor', 'Altura (norte mais agudo) · força da nota'],
      ['Sulfato (verde)', 'Não toca: encobriria os outros três'],
    ],
    highlights: [
      'Toda a poeira está ao norte do equador: a poeira do Saara cruzando o Atlântico, mais forte perto de 21° N, 23° W.',
      '71% da fumaça está ao sul do equador, com pico na África central, onde a NASA aponta queimadas agrícolas.',
      '74% do sal marinho está no sul, levantado por ventos fortes. No Atlântico, o furacão Erin o desenha em espirais.',
    ],
    description: [
      'A NASA dá uma cor a cada tipo: fumaça de queimadas vermelho-alaranjada, poeira rosa, sal marinho azul, sulfatos da poluição e dos vulcões verdes.',
      'A poeira vai do Caribe (cerca de 65° W) até cerca de 67° E. A fumaça tem pico perto de 3° S, 17° E, e no norte sobre a Espanha (cerca de 39° N), onde a NASA cita incêndios. O sal marinho tem pico perto de 51° S, 91° W, no Pacífico Sul.',
      'O sulfato cobre mais do mapa que qualquer outro tipo, 71% dele no norte; a NASA aponta plumas do Kilauea (Havaí) e do Etna (Itália).',
    ],
    limits: [
      'Isto é um modelo, não uma fotografia: o GEOS combina observações de satélite e de solo para estimar o ar em um instante.',
      'A imagem da NASA não tem escala numérica. Medimos a cor de cada tipo contra o seu valor mais forte nesta imagem: uma nota diz mais ou menos, nunca quanto, e tipos não podem ser comparados.',
      'Cada pixel vai para o tipo de cor mais próxima; misturas são divididas. O amarelo (luzes das cidades) fica de fora.',
      'Sobre a terra as cores se misturam com o cinza do continente, então a poeira sobre o Saara soa mais fraca do que sobre o Atlântico.',
      'O sulfato fica fora da música porque cada disco tem no máximo três vozes. A imagem 16:9 da NASA foi esticada para 2:1; suas costas coincidem com os outros discos.',
    ],
    narration: {
      intro: 'Este é o ar de um único momento: 19 de agosto de 2025, como o modelo GEOS da NASA o viu. As cordas graves são fumaça, a marimba é poeira, os sinos são sal marinho.',
      dust: 'Sob a agulha: poeira do Saara, cruzando o Atlântico.',
      smoke: 'Agora fumaça, das queimadas na África.',
      'sea-salt': 'Sal marinho, levantado pelos ventos sobre os mares do sul.',
      outro: 'O mesmo momento volta: cada volta toca o mesmo ar, lugar por lugar.',
    },
  },
  es: {
    title: 'Aerosoles',
    dataset: 'Modelo GEOS (NASA GMAO)',
    whatYouHear: 'Las partículas en el aire en un solo instante: 19 de agosto de 2025, 20:00 UTC. Cada vuelta lee la misma imagen, lugar por lugar.',
    mapping: [
      ['Humo (rojo anaranjado)', 'Cuerdas graves'],
      ['Polvo (rosa)', 'Marimba'],
      ['Sal marina (azul grisáceo)', 'Glockenspiel'],
      ['Latitud · fuerza del color', 'Altura (norte más agudo) · fuerza de la nota'],
      ['Sulfato (verde)', 'No suena: taparía a los otros tres'],
    ],
    highlights: [
      'Todo el polvo está al norte del ecuador: el polvo del Sahara cruzando el Atlántico, más fuerte cerca de 21° N, 23° O.',
      'El 71% del humo está al sur del ecuador, con pico en África central, donde la NASA señala quemas agrícolas.',
      'El 74% de la sal marina está en el sur, levantada por vientos fuertes. En el Atlántico, el huracán Erin la dibuja en espirales.',
    ],
    description: [
      'La NASA da un color a cada tipo: humo de incendios rojo anaranjado, polvo rosa, sal marina azul, sulfatos de la contaminación y los volcanes verdes.',
      'El polvo va del Caribe (unos 65° O) hasta unos 67° E. El humo tiene su pico cerca de 3° S, 17° E, y en el norte sobre España (unos 39° N), donde la NASA menciona incendios. La sal marina tiene su pico cerca de 51° S, 91° O, en el Pacífico Sur.',
      'El sulfato cubre más del mapa que cualquier otro tipo, el 71% en el norte; la NASA señala penachos del Kilauea (Hawái) y del Etna (Italia).',
    ],
    limits: [
      'Esto es un modelo, no una fotografía: GEOS combina observaciones de satélite y de tierra para estimar el aire en un instante.',
      'La imagen de la NASA no tiene escala numérica. Medimos el color de cada tipo contra su valor más fuerte en esta imagen: una nota dice más o menos, nunca cuánto, y los tipos no se pueden comparar.',
      'Cada píxel va al tipo de color más cercano; las mezclas se reparten. El amarillo (luces de las ciudades) queda fuera.',
      'Sobre tierra los colores se mezclan con el gris del continente, así que el polvo sobre el Sahara suena más débil que sobre el Atlántico.',
      'El sulfato queda fuera de la música porque cada disco tiene como máximo tres voces. La imagen 16:9 de la NASA se estiró a 2:1; sus costas coinciden con los otros discos.',
    ],
    narration: {
      intro: 'Este es el aire de un solo momento: el 19 de agosto de 2025, tal como lo vio el modelo GEOS de la NASA. Las cuerdas graves son humo, la marimba es polvo, las campanas son sal marina.',
      dust: 'Bajo la aguja: polvo del Sahara, cruzando el Atlántico.',
      smoke: 'Ahora humo, de las quemas en África.',
      'sea-salt': 'Sal marina, levantada por los vientos sobre los mares del sur.',
      outro: 'El mismo momento vuelve: cada vuelta toca el mismo aire, lugar por lugar.',
    },
  },
};
