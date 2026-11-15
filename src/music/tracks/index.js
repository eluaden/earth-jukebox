// Data -> music for every track, behind one interface (front A delivers, front B plays):
//   voices        [{ id, instrument }]   at most 3 (direction 6.1)
//   read(col, prevCol)                    column under the needle (and the previous step's) -> bands
//   summary(read) [{ voice, value, unit }] values for the chips ('°C', 'share' 0..1, 'brightness', 'change',
//                                          'strength' 0..1 relative to the type's strongest colour)
//   initialState() / plan(read, tick, state) -> { events, state }
// Events: { voice, kind: 'hit'|'attack'|'release', midi, velocity, lat, offset?, duration? }; offset is a
// fraction of the pulse (arpeggios). Caps (6.3): at most 2 notes per voice and 6 in total at once.
// A layered grid (aerosols: grid.layers > 1) gives read() one column per layer, back to back (layerOf).
import { zonesFromColumn } from '../../data/zones.js';
import { emptyHeld, planTick } from '../mapping.js';
import { AEROSOLS_MUSIC } from './aerosols.js';
import { LIGHTNING_MUSIC } from './lightning.js';
import { NIGHT_LIGHTS_MUSIC } from './nightLights.js';

export const SST_MUSIC = {
  voices: [
    { id: 'strings', instrument: 'strings', zone: 'north' },
    { id: 'piano', instrument: 'piano', zone: 'tropics' },
    { id: 'glock', instrument: 'glock', zone: 'south' },
  ],
  read: (col) => zonesFromColumn(col),
  summary: (zones) => zones.map((z) => ({ voice: z.voice, value: z.mean, unit: '°C' })),
  initialState: () => emptyHeld(),
  plan(zones, tick, state) {
    const r = planTick(zones, tick, state);
    return { events: r.events, state: r.held };
  },
};

export const TRACK_MUSIC = {
  sst: SST_MUSIC,
  lightning: LIGHTNING_MUSIC,
  'night-lights': NIGHT_LIGHTS_MUSIC,
  aerosols: AEROSOLS_MUSIC,
};
