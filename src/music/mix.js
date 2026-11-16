/** With any solo on, only soloed voices play; otherwise every voice that is not muted. */
export function isAudible(voice, mute, solo) {
  const anySolo = Object.values(solo).some(Boolean);
  return anySolo ? Boolean(solo[voice]) : !mute[voice];
}

/** Linear gain of the duck stage: duckDb while the narrator speaks, unity otherwise. */
export function duckGain(ducked, duckDb = -10) {
  return ducked ? 10 ** (duckDb / 20) : 1;
}
