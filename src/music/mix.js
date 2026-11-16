/** With any solo on, only soloed voices play; otherwise every voice that is not muted. */
export function isAudible(voice, mute, solo) {
  const anySolo = Object.values(solo).some(Boolean);
  return anySolo ? Boolean(solo[voice]) : !mute[voice];
}

/** Linear music-bus gain: intro swell (0..1) times ducking while the narrator speaks. */
export function musicBusGain(level, ducked, duckDb = -10) {
  const duck = ducked ? 10 ** (duckDb / 20) : 1;
  return Math.max(0, level) * duck;
}
