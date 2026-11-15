// Liner notes and narration of the aerosols track, EN / PT / ES.
// Rules (docs/si-e-referencias.md): only facts from the NASA page (SVS 5669) or computed from the track's
// own grid (scripts/pipeline/aerosols.py). The team reviews these texts before publishing.
// Narration markers are places, not dates: the needle meets them on every turn of the globe.

export const AEROSOLS_TEXT = {
  en: {
    title: 'Aerosols',
    whatYouHear:
      'The needle reads a single moment, 19 August 2025 at 20:00 UTC, as NASA’s GEOS model drew it: the particles the air carries. Every turn of the globe sweeps the same picture, so what you hear is the planet itself, place by place. Smoke plays on low strings, dust on the marimba, sea salt on the glockenspiel; the further north, the higher the note, and the stronger the colour, the stronger the note.',
    mapping: [
      ['Smoke (black carbon, red-orange) under the needle, in six latitude bands from 70° N to 70° S', 'Low strings: up to two long notes every half bar; latitude sets the pitch (north is higher)'],
      ['Dust (pink)', 'Marimba: one hit per band with dust, as an arpeggio'],
      ['Sea salt (blue-grey)', 'Glockenspiel, on every quarter note'],
      ['Strength of each colour in NASA’s image', 'How hard the note is played'],
      ['Sulfate (green)', 'Not played: it is on more than a third of the map and would cover the other three'],
      ['One instant: 19 August 2025, 20:00 UTC', 'Every turn of the globe plays the same picture again'],
    ],
    description: [
      'The globe wears NASA’s image of the aerosols in the GEOS model at one instant. NASA colours each type: smoke from fires red-orange, dust pink, sea salt blue, sulfates from pollution and volcanoes green.',
      'All of the dust on this map is north of the equator, in one long band from the Caribbean, around 65° W, to about 67° E: dust from the Sahara crossing the Atlantic, as NASA describes. It is strongest over the Atlantic off West Africa, around 21° N and 23° W.',
      'Most of the smoke (71%) is south of the equator. It is strongest over central Africa, around 3° S and 17° E; NASA points to the season of agricultural burning in southern Africa. In the north it is strongest over Spain, around 39° N, where NASA mentions wildfires.',
      'About three quarters of the sea salt (74%) is south of the equator, lifted by strong winds over the sea; it is strongest around 51° S and 91° W, in the South Pacific. In the Atlantic, NASA points to Hurricane Erin, whose winds draw sea salt in blue spirals and pull in dust from Africa.',
      'Sulfate is on more of the map than any other type, mostly in the north (71%). NASA points to narrow plumes from the Kilauea volcano in Hawaii and from Mount Etna in Italy.',
    ],
    limits: [
      'This is a model, not a photograph: GEOS, from NASA’s Global Modeling and Assimilation Office, combines satellite and ground observations to estimate the air at one instant. The picture shows 19 August 2025 at 20:00 UTC only.',
      'NASA’s image has no numeric scale. We measure how strong each type’s colour is, against the strongest colour of that type in this image: a note says more or less of a type, never how much, and two types cannot be compared.',
      'Each pixel goes to the type its colour is closest to; where two types overlap, the blend is split between them. Yellow, the colour of city lights, is left out.',
      'Over land the colours mix with the grey of the land, so aerosols over land read weaker than over the sea: the dust over the Sahara itself sounds softer than the dust over the Atlantic.',
      'Sulfate is on the globe but not in the music: each record has at most three voices, so that each one can be heard.',
      'NASA’s image is 16:9; it was stretched back to the 2:1 of a globe map. Its coasts line up with the maps of the other records.',
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
    whatYouHear:
      'A agulha lê um único momento, 19 de agosto de 2025 às 20:00 UTC, como o modelo GEOS da NASA o desenhou: as partículas que o ar carrega. Cada volta do globo varre a mesma imagem, então o que você ouve é o próprio planeta, lugar por lugar. A fumaça toca nas cordas graves, a poeira na marimba, o sal marinho no glockenspiel; quanto mais ao norte, mais aguda a nota, e quanto mais forte a cor, mais forte a nota.',
    mapping: [
      ['Fumaça (carbono negro, vermelho-alaranjado) embaixo da agulha, em seis faixas de latitude de 70° N a 70° S', 'Cordas graves: até duas notas longas a cada meio compasso; a latitude define a altura (norte mais agudo)'],
      ['Poeira (rosa)', 'Marimba: uma batida por faixa com poeira, em arpejo'],
      ['Sal marinho (azul-acinzentado)', 'Glockenspiel, a cada semínima'],
      ['Força de cada cor na imagem da NASA', 'A força com que a nota é tocada'],
      ['Sulfato (verde)', 'Não toca: está em mais de um terço do mapa e encobriria os outros três'],
      ['Um instante: 19 de agosto de 2025, 20:00 UTC', 'Cada volta do globo toca a mesma imagem de novo'],
    ],
    description: [
      'O globo veste a imagem da NASA com os aerossóis do modelo GEOS em um instante. A NASA dá uma cor a cada tipo: fumaça de queimadas vermelho-alaranjada, poeira rosa, sal marinho azul, sulfatos da poluição e dos vulcões verdes.',
      'Toda a poeira deste mapa está ao norte do equador, numa faixa longa do Caribe, perto de 65° W, até cerca de 67° E: a poeira do Saara cruzando o Atlântico, como a NASA descreve. Ela é mais forte sobre o Atlântico, na costa da África Ocidental, perto de 21° N e 23° W.',
      'A maior parte da fumaça (71%) está ao sul do equador. Ela é mais forte sobre a África central, perto de 3° S e 17° E; a NASA aponta a estação de queimadas agrícolas no sul da África. No norte ela é mais forte sobre a Espanha, perto de 39° N, onde a NASA cita incêndios florestais.',
      'Cerca de três quartos do sal marinho (74%) estão ao sul do equador, levantados por ventos fortes sobre o mar; ele é mais forte perto de 51° S e 91° W, no Pacífico Sul. No Atlântico, a NASA aponta o furacão Erin, cujos ventos desenham o sal marinho em espirais azuis e puxam poeira da África.',
      'O sulfato está em mais partes do mapa do que qualquer outro tipo, quase todo no norte (71%). A NASA aponta plumas estreitas do vulcão Kilauea, no Havaí, e do monte Etna, na Itália.',
    ],
    limits: [
      'Isto é um modelo, não uma fotografia: o GEOS, do Global Modeling and Assimilation Office da NASA, combina observações de satélite e de solo para estimar o ar em um instante. A imagem mostra só 19 de agosto de 2025, às 20:00 UTC.',
      'A imagem da NASA não tem escala numérica. Medimos a força da cor de cada tipo, comparada com a cor mais forte daquele tipo nesta imagem: uma nota diz mais ou menos de um tipo, nunca quanto, e dois tipos não podem ser comparados.',
      'Cada pixel vai para o tipo de cor mais próxima; onde dois tipos se sobrepõem, a mistura é dividida entre eles. O amarelo, cor das luzes das cidades, fica de fora.',
      'Sobre a terra as cores se misturam com o cinza do continente, então os aerossóis sobre a terra parecem mais fracos do que sobre o mar: a poeira sobre o próprio Saara soa mais baixa do que a poeira sobre o Atlântico.',
      'O sulfato está no globo, mas não na música: cada disco tem no máximo três vozes, para que cada uma possa ser ouvida.',
      'A imagem da NASA é 16:9; ela foi esticada de volta para o 2:1 de um mapa do globo. Suas costas coincidem com os mapas dos outros discos.',
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
    whatYouHear:
      'La aguja lee un solo momento, el 19 de agosto de 2025 a las 20:00 UTC, tal como lo dibujó el modelo GEOS de la NASA: las partículas que lleva el aire. Cada vuelta del globo recorre la misma imagen, así que lo que oyes es el propio planeta, lugar por lugar. El humo suena en las cuerdas graves, el polvo en la marimba, la sal marina en el glockenspiel; cuanto más al norte, más aguda la nota, y cuanto más fuerte el color, más fuerte la nota.',
    mapping: [
      ['Humo (carbono negro, rojo anaranjado) bajo la aguja, en seis franjas de latitud de 70° N a 70° S', 'Cuerdas graves: hasta dos notas largas cada medio compás; la latitud define la altura (norte más agudo)'],
      ['Polvo (rosa)', 'Marimba: un golpe por franja con polvo, en arpegio'],
      ['Sal marina (azul grisáceo)', 'Glockenspiel, en cada negra'],
      ['Fuerza de cada color en la imagen de la NASA', 'La fuerza con que se toca la nota'],
      ['Sulfato (verde)', 'No suena: está en más de un tercio del mapa y taparía a los otros tres'],
      ['Un instante: 19 de agosto de 2025, 20:00 UTC', 'Cada vuelta del globo toca la misma imagen otra vez'],
    ],
    description: [
      'El globo viste la imagen de la NASA con los aerosoles del modelo GEOS en un instante. La NASA da un color a cada tipo: humo de incendios rojo anaranjado, polvo rosa, sal marina azul, sulfatos de la contaminación y los volcanes verdes.',
      'Todo el polvo de este mapa está al norte del ecuador, en una franja larga desde el Caribe, cerca de 65° O, hasta unos 67° E: el polvo del Sahara cruzando el Atlántico, como describe la NASA. Es más fuerte sobre el Atlántico frente a África Occidental, cerca de 21° N y 23° O.',
      'La mayor parte del humo (71%) está al sur del ecuador. Es más fuerte sobre África central, cerca de 3° S y 17° E; la NASA señala la temporada de quemas agrícolas en el sur de África. En el norte es más fuerte sobre España, cerca de 39° N, donde la NASA menciona incendios forestales.',
      'Cerca de tres cuartos de la sal marina (74%) están al sur del ecuador, levantados por vientos fuertes sobre el mar; es más fuerte cerca de 51° S y 91° O, en el Pacífico Sur. En el Atlántico, la NASA señala el huracán Erin, cuyos vientos dibujan la sal marina en espirales azules y arrastran polvo de África.',
      'El sulfato está en más partes del mapa que cualquier otro tipo, casi todo en el norte (71%). La NASA señala penachos estrechos del volcán Kilauea, en Hawái, y del monte Etna, en Italia.',
    ],
    limits: [
      'Esto es un modelo, no una fotografía: GEOS, de la Global Modeling and Assimilation Office de la NASA, combina observaciones de satélite y de tierra para estimar el aire en un instante. La imagen muestra solo el 19 de agosto de 2025 a las 20:00 UTC.',
      'La imagen de la NASA no tiene escala numérica. Medimos la fuerza del color de cada tipo, comparada con el color más fuerte de ese tipo en esta imagen: una nota dice más o menos de un tipo, nunca cuánto, y dos tipos no se pueden comparar.',
      'Cada píxel va al tipo de color más cercano; donde dos tipos se superponen, la mezcla se reparte entre ellos. El amarillo, color de las luces de las ciudades, queda fuera.',
      'Sobre tierra los colores se mezclan con el gris del continente, así que los aerosoles sobre tierra parecen más débiles que sobre el mar: el polvo sobre el propio Sahara suena más bajo que el polvo sobre el Atlántico.',
      'El sulfato está en el globo pero no en la música: cada disco tiene como máximo tres voces, para que cada una se pueda oír.',
      'La imagen de la NASA es 16:9; se estiró de vuelta al 2:1 de un mapa del globo. Sus costas coinciden con los mapas de los otros discos.',
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
