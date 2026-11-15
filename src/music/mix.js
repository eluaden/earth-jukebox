/** With any solo on, only soloed voices play; otherwise every voice that is not muted. */
export function isAudible(voice, mute, solo) {
  const anySolo = Object.values(solo).some(Boolean);
  return anySolo ? Boolean(solo[voice]) : !mute[voice];
}
