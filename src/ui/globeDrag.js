import { scrubBy, scrubEnd, scrubStart } from '../state/controller.js';

// Drag the globe sideways with the mouse or a finger. The first few pixels decide: a short press is
// still a click (play / pause); past DEAD_PX it becomes a drag. While dragging the date stands still
// and the needle plays whatever passes under it; on release the record goes back to how it was
// (playing or paused). See controller.scrubStart.

const DEAD_PX = 5;

/** Radians the globe turns for one pixel of drag: the surface follows the pointer near the centre. */
const radPerPx = () => 1 / Math.max(120, 0.32 * Math.min(innerHeight, innerWidth * 0.75));

let active = null; // { id, x, started }

export function beginGlobeDrag(e) {
  if (active || (e.pointerType === 'mouse' && e.button !== 0)) return;
  active = { id: e.pointerId, x: e.clientX, x0: e.clientX, started: false };
  addEventListener('pointermove', move);
  addEventListener('pointerup', end);
  addEventListener('pointercancel', end);
}

/** True when the last pointer press turned into a drag (its click must not toggle play). */
export const wasDrag = () => lastWasDrag;
let lastWasDrag = false;

function move(e) {
  if (!active || e.pointerId !== active.id) return;
  if (!active.started) {
    if (Math.abs(e.clientX - active.x0) < DEAD_PX) return;
    active.started = scrubStart();
    if (!active.started) return end(e);
    document.body.classList.add('dragging-globe');
  }
  scrubBy((e.clientX - active.x) * radPerPx());
  active.x = e.clientX;
}

function end(e) {
  if (!active || (e && e.pointerId !== active.id)) return;
  lastWasDrag = active.started;
  if (active.started) scrubEnd();
  document.body.classList.remove('dragging-globe');
  active = null;
  removeEventListener('pointermove', move);
  removeEventListener('pointerup', end);
  removeEventListener('pointercancel', end);
}
