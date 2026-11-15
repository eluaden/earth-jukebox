import * as THREE from 'three';

// Shared scene geometry. The globe (radius 1) sits slightly below the centre, tilted a little so the
// northern hemisphere leans toward the camera; the needle touches the meridian facing the camera.
export const FOV = 35;
export const GLOBE_Y = -0.06;
export const TILT = 0.12; // rad, about X (positive = north pole toward the camera)
export const NEEDLE_LAT = 30; // where the stylus touches the meridian line (degrees)
export const RINGS = [1.12, 1.2, 1.31]; // platter rings; the time arc runs on RINGS[1]
export const LINE_LATS = [-70, 74]; // stays on the visible face (the globe is tilted toward the camera)

const tiltEuler = new THREE.Euler(TILT, 0, 0);

/** Point on the meridian facing the camera, in world space (before any camera move). */
export function meridianPoint(latDeg, radius = 1) {
  const lat = THREE.MathUtils.degToRad(latDeg);
  return new THREE.Vector3(0, Math.sin(lat) * radius, Math.cos(lat) * radius).applyEuler(tiltEuler).add(new THREE.Vector3(0, GLOBE_Y, 0));
}

/** Camera distance that keeps the platter (and the UI around it) in view for this aspect ratio. */
export function cameraDistance(aspect) {
  const tan = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  const byHeight = 1.455 / tan; // globe ~70% of the height on wide screens
  // Landscape: leave room for the date on the left and the chips on the right. Portrait: fit the platter.
  const halfWidth = aspect >= 1 ? 2.35 : 1.42;
  const byWidth = halfWidth / (tan * aspect);
  return Math.max(byHeight, byWidth);
}
