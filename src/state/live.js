import { EMPTY_ZONES } from './store.js';

// Values that change every animation frame, shared by the 3D scene, the 2D fallback and the audio
// engine without React re-renders.
export const live = {
  rotation: 0, // globe rotation about its axis (rad); decreasing = clockwise seen from above
  step: -1,
  lonIdx: -1,
  lon: -90,
  zones: EMPTY_ZONES,
  dots: [], // notes lit on the needle line: { lat, color, t0 }
};
