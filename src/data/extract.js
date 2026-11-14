/**
 * Pixel -> data value extraction (runs in the browser, on a canvas).
 *
 * For every frame and every region of interest:
 *   1. each pixel colour is matched to the nearest colour of the track's COLOR LEGEND
 *      (the colour bar printed on the frame), which gives a physical value;
 *   2. pixels that are not data are ignored: colours far from the legend (labels, grey
 *      "no data" areas) and static map overlays (pixels dark in almost every frame: roads, borders);
 *   3. the region's value is the mean of the remaining pixels;
 *   4. values are normalized to 0..1 with the fixed physical range in the config.
 *
 * Sound is therefore driven by the data value, never by raw brightness.
 *
 * Config (track.extraction):
 * {
 *   "colormap": { "unit": "...", "stops": [[value, r, g, b], ...], "maxDistance": 40 },
 *   "overlayMask": { "darkBelow": 60, "minShare": 0.9 },
 *   "regions": { "<series>": [x0, y0, x1, y1] },     // pixels, in frame coordinates
 *   "range": [lo, hi],                                // physical values mapped to 0 and 1
 *   "minCoverage": 0.2,                               // below this share of valid pixels -> null
 *   "recordEvents": [{ "series": "...", "of": "max", "say": { "en": "{label}: ..." } }]
 * }
 */

/** Colour table with one entry per integer step between the first and last stop. */
export function buildLut(stops) {
  const sorted = [...stops].sort((a, b) => a[0] - b[0]);
  const lo = sorted[0][0];
  const hi = sorted[sorted.length - 1][0];
  const n = Math.round(hi - lo) + 1;
  const rgb = new Float32Array(n * 3);
  let s = 0;
  for (let i = 0; i < n; i++) {
    const v = lo + i;
    while (s < sorted.length - 2 && v > sorted[s + 1][0]) s++;
    const [v0, ...c0] = sorted[s];
    const [v1, ...c1] = sorted[s + 1];
    const t = Math.min(1, Math.max(0, (v - v0) / (v1 - v0)));
    for (let k = 0; k < 3; k++) rgb[i * 3 + k] = c0[k] + (c1[k] - c0[k]) * t;
  }
  return { lo, n, rgb };
}

/** Returns colour -> value (or NaN when the colour is not on the legend). Memoized. */
export function makeColorToValue(lut, maxDistance) {
  const cache = new Float32Array(1 << 21).fill(-1); // key: 7 bits per channel
  const max2 = maxDistance * maxDistance;
  return (r, g, b) => {
    const key = ((r >> 1) << 14) | ((g >> 1) << 7) | (b >> 1);
    const hit = cache[key];
    if (hit !== -1) return hit;
    let best = Infinity;
    let bestI = 0;
    for (let i = 0; i < lut.n; i++) {
      const dr = r - lut.rgb[i * 3];
      const dg = g - lut.rgb[i * 3 + 1];
      const db = b - lut.rgb[i * 3 + 2];
      const d = dr * dr + dg * dg + db * db;
      if (d < best) { best = d; bestI = i; }
    }
    const value = best <= max2 ? lut.lo + bestI : NaN;
    cache[key] = value;
    return value;
  };
}

/**
 * Core computation on raw pixels (no DOM): testable anywhere.
 * `framesPixels[f][regionKey]` = RGBA Uint8ClampedArray of that region in frame f.
 */
export function computeSeries(framesPixels, cfg) {
  const lut = buildLut(cfg.colormap.stops);
  const toValue = makeColorToValue(lut, cfg.colormap.maxDistance ?? 40);
  const { darkBelow = 60, minShare = 0.9 } = cfg.overlayMask || {};
  const [lo, hi] = cfg.range;
  const minCoverage = cfg.minCoverage ?? 0.2;
  const F = framesPixels.length;
  const out = { series: {}, values: {}, coverage: {} };

  for (const key of Object.keys(cfg.regions)) {
    const nPx = framesPixels[0][key].length / 4;
    // Static overlay: pixels that are dark in (almost) every frame are map lines, not data.
    const darkCount = new Uint16Array(nPx);
    for (let f = 0; f < F; f++) {
      const px = framesPixels[f][key];
      for (let p = 0; p < nPx; p++) {
        if (Math.max(px[p * 4], px[p * 4 + 1], px[p * 4 + 2]) < darkBelow) darkCount[p]++;
      }
    }
    const values = [];
    const coverage = [];
    for (let f = 0; f < F; f++) {
      const px = framesPixels[f][key];
      let sum = 0;
      let count = 0;
      for (let p = 0; p < nPx; p++) {
        if (darkCount[p] > minShare * F) continue;
        const v = toValue(px[p * 4], px[p * 4 + 1], px[p * 4 + 2]);
        if (v === v) { sum += v; count++; } // skip NaN
      }
      const share = count / nPx;
      coverage.push(Math.round(share * 100) / 100);
      values.push(share >= minCoverage ? Math.round((sum / count) * 10) / 10 : null);
    }
    out.values[key] = values;
    out.coverage[key] = coverage;
    out.series[key] = values.map((v) => (v == null ? null
      : Math.round(Math.min(1, Math.max(0, (v - lo) / (hi - lo))) * 1000) / 1000));
  }
  return out;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Could not load frame ${url}`));
    img.src = url;
  });
}

/**
 * Loads the track's frames, reads their pixels and fills in track.series (0..1),
 * track.values (physical values), track.coverage and data-driven events.
 */
export async function extractTrack(track, urlFor) {
  const cfg = track.extraction;
  const images = await Promise.all(track.frames.map((f) => loadImage(urlFor(f))));
  const canvas = document.createElement('canvas');
  canvas.width = images[0].naturalWidth;
  canvas.height = images[0].naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const framesPixels = images.map((img) => {
    ctx.drawImage(img, 0, 0);
    const regions = {};
    for (const [key, [x0, y0, x1, y1]] of Object.entries(cfg.regions)) {
      regions[key] = ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
    }
    return regions;
  });

  const result = computeSeries(framesPixels, cfg);
  track.series = result.series;
  track.values = result.values;
  track.coverage = result.coverage;

  // Events whose position comes from the data itself (e.g. the day's maximum).
  const events = [...(track.events || [])];
  for (const rule of cfg.recordEvents || []) {
    const vals = result.values[rule.series];
    let best = -1;
    vals.forEach((v, i) => {
      if (v == null) return;
      if (best < 0 || (rule.of === 'min' ? v < vals[best] : v > vals[best])) best = i;
    });
    if (best < 0) continue;
    const say = {};
    for (const [lang, text] of Object.entries(rule.say || {})) {
      say[lang] = text.replace('{label}', track.labels[best]).replace('{value}', String(vals[best]));
    }
    events.push({ frame: best, type: rule.type || 'record', say });
  }
  track.events = events.sort((a, b) => a.frame - b.frame);
  return track;
}
