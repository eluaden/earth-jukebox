import * as THREE from 'three';

// Shared scene geometry. The globe (radius 1) sits at the centre, tilted a little so the northern
// hemisphere leans toward the camera; the needle touches the meridian facing the camera.
export const FOV = 35;
export const GLOBE_Y = 0;
export const TILT = 0.12; // rad, about X (positive = north pole toward the camera)
export const NEEDLE_LAT = 30; // where the stylus touches the meridian line (degrees)
export const RINGS = [1.15, 1.24]; // platter rings; the time arc runs on RINGS[0]
export const LINE_LATS = [-70, 74]; // stays on the visible face (the globe is tilted toward the camera)

const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const tiltEuler = new THREE.Euler(TILT, 0, 0);

/** Point on the meridian facing the camera, in world space (before any camera move). */
export function meridianPoint(latDeg, radius = 1) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  return new THREE.Vector3(0, Math.sin(lat) * radius, Math.cos(lat) * radius).applyEuler(tiltEuler).add(new THREE.Vector3(0, GLOBE_Y, 0));
}

/**
 * Camera distance that keeps the platter (and the UI around it) in view for this aspect ratio.
 * Landscape: the outer ring stays clear of the footer pill and leaves room for the date on the left
 * and the chips on the right. Portrait: the platter fits the width.
 */
export function cameraDistance(aspect) {
  const byHeight = 1.6 / TAN; // globe ~62% of the height on wide screens
  const halfWidth = aspect >= 1 ? 2.35 : 1.4;
  const byWidth = halfWidth / (TAN * aspect);
  return Math.max(byHeight, byWidth);
}

/** Portrait: the camera sits a little lower so the globe rises toward the date and clears the chips. */
export function cameraY(aspect) {
  return aspect >= 1 ? 0 : -0.3;
}

/** Half width and half height of the view at the globe's depth. */
export function viewHalfSize(aspect) {
  const h = cameraDistance(aspect) * TAN;
  return { w: h * aspect, h };
}

/** Tonearm pivot: off the platter, top right, always inside the view (counterweight included). */
export function pivotFor(aspect) {
  const { w, h } = viewHalfSize(aspect);
  return new THREE.Vector3(Math.min(1.78, w - 0.45), Math.min(1.12, h + cameraY(aspect) - 0.45), 0.32);
}
