import * as THREE from 'three';

// Shared scene geometry. The globe (radius 1) sits at the centre, tilted a little so the northern
// hemisphere leans toward the camera; the needle touches the meridian facing the camera.
export const FOV = 35;
export const GLOBE_Y = 0;
export const TILT = 0.12; // rad, about X (positive = north pole toward the camera)
export const NEEDLE_LAT = 30; // where the stylus touches the meridian line (degrees)
export const TIME_RING = 1.15; // the platter's time ring (src/scene/Platter.jsx)
export const PLATTER_R = 1.24; // what the camera keeps clear of the HUD: the ring, its hover state and label
// Hover tick on the ring reaches about 0.017 past TIME_RING (src/scene/Platter.jsx shader).
const RING_LABEL_R = TIME_RING + 0.028;
const RING_LABEL_GAP = 8; // px: air between that tick and the date

/**
 * Hover date beside the time ring (fraction 0 at the top, clockwise, as the ring shader).
 * The anchor sits just outside the ring. The CSS shift puts the label's inner edge on that
 * anchor and then a few pixels further out, so the words grow away from the globe: a label
 * centered on the anchor lays the text across the ring.
 * Returns { position, transform } for drei <Html> (no `center`: this transform replaces it).
 */
export function ringLabelPlacement(fraction) {
  const a = fraction * Math.PI * 2;
  const wx = Math.sin(a);
  const wy = Math.cos(a);
  const nx = Math.abs(wx) < 1e-8 ? 0 : wx; // screen +x
  const ny = Math.abs(wy) < 1e-8 ? 0 : -wy; // screen +y is down
  const shift = (n) => `${(-50 + n * 50).toFixed(2)}%`;
  const px = (n) => (n * RING_LABEL_GAP).toFixed(2);
  return {
    position: [wx * RING_LABEL_R, wy * RING_LABEL_R, 0],
    transform: `translate3d(calc(${shift(nx)}), calc(${shift(ny)}), 0) translate(${px(nx)}px, ${px(ny)}px)`,
  };
}
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
 * Landscape: the platter stays clear of the footer pill and leaves room for the date on the left
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
 * the platter (PLATTER_R) is kept clear of every HUD block, measured in pixels as styles.css lays them out,
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
    const chips = Math.min(178, 0.16 * w) + gutter + 48 + 16; // chips column, liner tab, gap
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
  const z = Math.max(z0, (PLATTER_R * h) / 2 / (TAN * Math.max(60, maxR)));
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

// NASA SVS 5235 ruler, measured on the 2160² porthole frame (direcionamento E1):
// +50 cm on row 50, −50 cm on row 2107.5. The disc maps that square onto a circle of radius 1.
const RULER_FRAME = 2160;
const RULER_TOP_PX = 50;
const RULER_BOT_PX = 2107.5;
const RULER_TOP_CM = 50;
const RULER_BOT_CM = -50;

/** Local Y on the porthole disc (radius 1, +Y up) for a sea level in centimetres above 1993. */
export function seaLevelLocalY(cm) {
  const t = (RULER_TOP_CM - cm) / (RULER_TOP_CM - RULER_BOT_CM);
  const row = RULER_TOP_PX + t * (RULER_BOT_PX - RULER_TOP_PX);
  return 1 - (2 * row) / RULER_FRAME;
}

/**
 * World-space radius of the porthole disc: it is drawn flat at the globe's centre and scaled so
 * it covers the same angle as a sphere of radius 1 seen from `camera`.
 */
export function portholeRadius(camera) {
  const d = Math.hypot(camera.position.y - GLOBE_Y, camera.position.z);
  return d > 1.01 ? d / Math.sqrt(d * d - 1) : 1;
}

/** Point on the porthole glass where `cm` sits on NASA's ruler (x = 0, the centre line). */
export function seaLevelPoint(cm, radius) {
  return new THREE.Vector3(0, GLOBE_Y + seaLevelLocalY(cm) * radius, 0.02);
}

/** Tonearm pivot: off the platter, top right, always inside the view (counterweight included). */
export function pivotFor(aspect) {
  const { w, h } = viewHalfSize(aspect);
  return new THREE.Vector3(Math.min(1.78, w - 0.45), Math.min(1.12, h + cameraY(aspect) - 0.45), 0.32);
}
