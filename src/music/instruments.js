// Sampled instruments (VSCO 2 CE, CC0; public/samples/, made by scripts/pipeline/samples.py).
// db: level so every instrument sits at about the same loudness; attack / release: envelope (s).
// The four `core` instruments are decoded when the app starts; the others only when a listener
// picks one for a voice (the chips' instrument menu), so the first load stays small.
// A listener's pick changes only the timbre: notes, timing and the data mapping stay the same, and a
// track never has more than its 3 voices (direction 6.1).

export const INSTRUMENTS = {
  strings: { db: -7, attack: 0.25, release: 1.6, core: true },
  piano: { db: -3, attack: 0, release: 1.2, core: true },
  glock: { db: -13, attack: 0, release: 2.2, core: true },
  marimba: { db: -6, attack: 0, release: 0.9, core: true },
  harp: { db: -3, attack: 0, release: 1.5 },
  flute: { db: -4, attack: 0.08, release: 0.8 },
  clarinet: { db: -10, attack: 0.06, release: 0.8 },
  xylo: { db: -22, attack: 0, release: 0.8 },
  pizz: { db: -13, attack: 0, release: 0.6 },
  horn: { db: -9, attack: 0.12, release: 1.2 },
};

/** Order of the instrument menu. */
export const INSTRUMENT_CHOICES = ['piano', 'strings', 'harp', 'flute', 'clarinet', 'horn', 'pizz', 'marimba', 'xylo', 'glock'];
