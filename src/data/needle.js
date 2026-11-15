// Which longitude is under the needle.
// The globe is a three.js SphereGeometry (texture u = 0 at longitude -180) seen by a camera on +Z;
// the needle reads the meridian that faces the camera. With the globe rotated by rotationY radians
// about its axis, that meridian is at longitude -90 - rotationY (in degrees).
// The globe turns clockwise seen from above (rotationY decreasing), like a record, so the longitude
// under the needle grows: Pacific -> Americas -> Atlantic.

export const SECONDS_PER_TURN = 10;

export function wrapLon(lon) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

export function lonUnderNeedle(rotationY) {
  return wrapLon(-90 - (rotationY * 180) / Math.PI);
}
