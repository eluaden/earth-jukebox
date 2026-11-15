/**
 * Textured globe: NASA's Blue Marble (public/earth.jpg, an equirectangular map) wrapped on a
 * sphere, drawn pixel by pixel. makeGlobe(image, size) returns draw(ctx, cx, cy, R, lon0).
 * The view latitude is fixed when the globe is made, so each frame only shifts the longitude.
 */
const RAD = Math.PI / 180;

export function makeGlobe(image, size = 420, lat0 = 26) {
  // Texture pixels, read once.
  const TW = 1024, TH = 512;
  const tc = document.createElement('canvas'); tc.width = TW; tc.height = TH;
  const tg = tc.getContext('2d', { willReadFrequently: true });
  tg.drawImage(image, 0, 0, TW, TH);
  const tex = tg.getImageData(0, 0, TW, TH).data;

  // For every pixel of the disc: its texture row and its longitude offset (in texture pixels).
  const off = document.createElement('canvas'); off.width = off.height = size;
  const og = off.getContext('2d');
  const img = og.createImageData(size, size);
  const n = size * size, row = new Int32Array(n), col = new Float32Array(n), inside = new Uint8Array(n);
  const s0 = Math.sin(lat0 * RAD), c0 = Math.cos(lat0 * RAD), r = size / 2;
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    const x = (px + .5 - r) / r, y = (r - py - .5) / r, d = x * x + y * y, p = py * size + px;
    if (d >= 1) continue;
    const z = Math.sqrt(1 - d);
    const lat = Math.asin(y * c0 + z * s0), dlon = Math.atan2(x, z * c0 - y * s0);
    inside[p] = 1;
    row[p] = Math.min(TH - 1, Math.floor((.5 - lat / Math.PI) * TH)) * TW;
    col[p] = (dlon / (2 * Math.PI) + .5) * TW;
    img.data[p * 4 + 3] = d > .985 ? Math.round(255 * (1 - d) / .015) : 255; // soft edge
  }

  return function draw(c, cx, cy, R, lon0) {
    const shift = ((lon0 / 360) * TW % TW + TW) % TW, out = img.data;
    for (let p = 0; p < n; p++) {
      if (!inside[p]) continue;
      const t = (row[p] + ((col[p] + shift) | 0) % TW) * 4, o = p * 4;
      out[o] = tex[t]; out[o + 1] = tex[t + 1]; out[o + 2] = tex[t + 2];
    }
    og.putImageData(img, 0, 0);
    // Same atmosphere glow, shading and rim as the drawn stand-in.
    let g = c.createRadialGradient(cx, cy, R * .95, cx, cy, R * 1.17); g.addColorStop(0, 'rgba(143,211,255,.55)'); g.addColorStop(1, 'rgba(143,211,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(cx, cy, R * 1.17, 0, 7); c.fill();
    c.drawImage(off, cx - R, cy - R, 2 * R, 2 * R);
    c.save(); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.clip();
    g = c.createRadialGradient(cx - R * .45, cy - R * .4, R * .25, cx, cy, R * 1.03); g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(.55, 'rgba(0,0,16,.12)'); g.addColorStop(1, 'rgba(0,0,16,.72)');
    c.fillStyle = g; c.fillRect(cx - R, cy - R, 2 * R, 2 * R); c.restore();
    c.strokeStyle = 'rgba(170,220,255,.55)'; c.lineWidth = Math.max(1, R * .012); c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
  };
}
