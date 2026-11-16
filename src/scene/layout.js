import * as THREE from 'three';

// Shared scene geometry. The globe (radius 1) sits at the centre, tilted a little so the northern
// hemisphere leans toward the camera; the needle touches the meridian facing the camera.
export const FOV = 35;
export const GLOBE_Y = 0;
export const TILT = 0.12; // rad, about X (positive = north pole toward the camera)
export const NEEDLE_LAT = 30; // where the stylus touches the meridian line (degrees)
export const RINGS = [1.15, 1.24]; // platter rings; the time arc runs on RINGS[0]
export const LINE_LATS = [-72, 88]; // north almost to the visible limb (globe tilted toward the camera)

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

const TREND_H = 125; // px: the trend chart (src/ui/Trend.jsx, .trend in styles.css)
const FOOTER_H = 54; // px: the footer pill
const DISC_RISE = 40; // px: the Records disc above the pill, lifted when Records is open
const CHIPS_ROW_H = 118; // px: the chips' row on phones

/** True when the HUD uses its stacked layout (phones and any portrait screen; see styles.css). */
export const stackedLayout = (w, h) => w <= 760 || w < h;

/**
 * Camera for a window of w x h px: { z, y }. On top of cameraDistance (the platter's own framing),
 * the outer ring is kept clear of every HUD block, measured in pixels as styles.css lays them out,
 * so nothing on screen overlaps the record:
 *  - wide screens: the date column on the left, the chips (and the liner tab) on the right, the
 *    footer and its Records disc below and the trend chart docked bottom-left;
 *  - stacked layout: the date on top, then the globe, then the trend chart, the chips and the
 *    footer; the camera also moves so the globe sits in the middle of the free band.
 */
export function cameraFrame(w, h) {
  const aspect = w / h;
  const z0 = cameraDistance(aspect);
  const gutter = Math.min(32, Math.max(16, 0.024 * w));
  let maxR;
  let centerY = h / 2;
  if (!stackedLayout(w, h)) {
    const chips = Math.min(210, 0.19 * w) + gutter + 48 + 16; // chips column, liner tab, gap
    const date = Math.min(0.24 * w, 400) + gutter + 40 + 24; // date and caption column (.when), gap
    maxR = Math.min(w / 2 - Math.max(chips, date), h / 2 - (gutter + FOOTER_H + DISC_RISE + 12));
    const tx = w / 2 - (gutter + 40 + 300); // trend chart's top-right corner, from the centre
    const ty = h / 2 - (gutter + 64 + TREND_H);
    if (ty > 0) maxR = Math.min(maxR, tx > 0 ? Math.hypot(tx, ty) - 12 : ty - 12);
  } else {
    const top = gutter + 40 + 48 + 8 + 44 + 12; // brand row, date, two caption lines
    const bottom = gutter + 92 + CHIPS_ROW_H + TREND_H + 12; // footer and its disc, chips row, trend chart
    const free = h - top - bottom;
    maxR = Math.min(w / 2 - 28 - 10, free / 2); // the liner tab peeks from the right edge
    centerY = top + free / 2;
  }
  const z = Math.max(z0, (RINGS[1] * h) / 2 / (TAN * Math.max(60, maxR)));
  // Camera y that puts the globe's centre at centerY px (a lower camera shows the globe higher).
  const y = ((centerY - h / 2) * TAN * z) / (h / 2);
  return { z, y };
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

/**
 * Near star dust: a shell around the globe, beyond the camera once the opening ends (about 5 units
 * away on wide screens, under 10 on tall phones), so no grain ever sits in front of the record.
 * The opening flies through it.
 * Returns flat arrays ready for the GPU: positions (xyz), sizes (px at 30 units), seeds (0..1).
 */
export const DUST_RADII = [14, 42];
export function dustPositions(count, random = Math.random) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const seeds = new Float32Array(count);
  const [r0, r1] = DUST_RADII;
  for (let i = 0; i < count; i++) {
    const z = random() * 2 - 1;
    const a = random() * Math.PI * 2;
    const s = Math.sqrt(1 - z * z);
    const r = r0 + (r1 - r0) * Math.cbrt(random());
    positions.set([Math.cos(a) * s * r, Math.sin(a) * s * r, z * r], i * 3);
    sizes[i] = 1 + random() * 1.6;
    seeds[i] = random();
  }
  return { positions, sizes, seeds };
}

/** Tonearm pivot: off the platter, top right, always inside the view (counterweight included). */
export function pivotFor(aspect) {
  const { w, h } = viewHalfSize(aspect);
  return new THREE.Vector3(Math.min(1.78, w - 0.45), Math.min(1.12, h + cameraY(aspect) - 0.45), 0.32);
}
