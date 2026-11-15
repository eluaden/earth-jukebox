// Soft glass tap (S6) on every real button press. Bound once; no-ops until playSfx is set
// (after the engine loads) and the audio context is running (after the cold-open click).

let bound = false;
let playSfx = null;

function isLiveButton(el) {
  if (!(el instanceof HTMLButtonElement)) return false;
  if (el.disabled) return false;
  if (el.getAttribute('aria-disabled') === 'true') return false;
  return true;
}

function onClick(e) {
  const btn = e.target?.closest?.('button');
  if (!isLiveButton(btn) || !playSfx) return;
  playSfx('glass-tap');
}

/**
 * Attach the UI tap once and wire the engine's playSfx.
 *
 * Args:
 *   play: (id: string) => void — usually engine.playSfx.
 */
export function bindUiSounds(play) {
  playSfx = play;
  if (bound || typeof document === 'undefined') return;
  bound = true;
  document.addEventListener('click', onClick, true);
}
