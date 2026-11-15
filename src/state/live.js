// Values that change every animation frame, shared by the 3D scene, the 2D fallback and the audio
// engine without React re-renders.
export const live = {
  spinning: false, // the globe is turning on its own (record playing, needle down)
  rotation: 0, // globe rotation about its axis (rad); decreasing = clockwise seen from above
  step: -1,
  lonIdx: -1,
  lon: -90,
  read: null, // the track's reading of the column under the needle (TRACK_MUSIC[id].read)
  summary: [], // values for the chips: [{ voice, value, unit }]
  dots: [], // note flashes on the meridian: { lat, color, t0 } (lat = value-weighted band centre)
};
