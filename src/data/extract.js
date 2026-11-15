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
 * MARKER extraction: for visualizations that show the value as a drawn marker moving along a
 * ruler printed on the frame (instead of a colour legend).
 * The value is how far the top of the marker sits above its position in `zeroFrame`,
 * converted with the ruler's pixels-per-unit.
 *
 * Config: { "type": "marker", "series": "name", "strip": [x0, y0, x1, y1],
 *           "markerColor": { "rMax", "gMax", "bMin" }, "minPixelsPerRow": 2,
 *           "pxPerUnit": 6.86, "zeroFrame": 0, "unit": "cm", "range": [lo, hi] }
 * `stripPixels[f]` = RGBA pixels of the strip in frame f.
 */
export function computeMarkerSeries(stripPixels, width, cfg) {
  const { rMax, gMax, bMin } = cfg.markerColor;
  const minPx = cfg.minPixelsPerRow ?? 2;
  const tops = stripPixels.map((px) => {
    const rows = px.length / 4 / width;
    for (let y = 0; y < rows; y++) {
      let n = 0;
      for (let x = 0; x < width; x++) {
        const i = (y * width + x) * 4;
        if (px[i] < rMax && px[i + 1] < gMax && px[i + 2] > bMin) n++;
      }
      if (n >= minPx) return y;
    }
    return null; // marker not found in this frame
  });
  const zero = tops[cfg.zeroFrame ?? 0];
  const [lo, hi] = cfg.range;
  const values = tops.map((t) => (t == null || zero == null ? null
    : Math.round(((zero - t) / cfg.pxPerUnit) * 10) / 10));
  const series = values.map((v) => (v == null ? null
    : Math.round(Math.min(1, Math.max(0, (v - lo) / (hi - lo))) * 1000) / 1000));
  return { series: { [cfg.series]: series }, values: { [cfg.series]: values } };
}

/**
 * CURSOR extraction: for visualizations with a chart drawn on the frame, where a coloured
 * cursor line rises to the current value along a printed axis.
 * The cursor moves one step to the right each frame, so we look in the expected column
 * (column.start + column.perFrame * frame, +/- halfWidth) for the topmost cursor-coloured pixel
 * and convert its height above the axis zero with the axis scale.
 *
 * Config: { "type": "cursor", "series": "name", "strip": [x0, y0, x1, y1],
 *           "column": { "start", "perFrame", "halfWidth" },
 *           "color": { "rMin", "rMinusB", "rMinusG" },
 *           "zeroY": <row of the axis zero, relative to the strip>, "pxPerUnit", "unit", "range",
 *           "derived": { "<name>": { "from": "<series>", "op": "increase", "range": [lo, hi] } } }
 */
export function computeCursorSeries(stripPixels, width, cfg) {
  const { rMin, rMinusB, rMinusG } = cfg.color;
  const half = cfg.column.halfWidth ?? 2;
  const values = stripPixels.map((px, f) => {
    const rows = px.length / 4 / width;
    const xc = Math.round(cfg.column.start + cfg.column.perFrame * f);
    for (let y = 0; y < rows; y++) {
      for (let x = Math.max(0, xc - half); x <= Math.min(width - 1, xc + half); x++) {
        const i = (y * width + x) * 4;
        if (px[i] > rMin && px[i] - px[i + 2] > rMinusB && px[i] - px[i + 1] > rMinusG) {
          return Math.round((cfg.zeroY - y) / cfg.pxPerUnit);
        }
      }
    }
    return null;
  });
  const norm = (v, [lo, hi]) => (v == null ? null
    : Math.round(Math.min(1, Math.max(0, (v - lo) / (hi - lo))) * 1000) / 1000);
  const out = { series: { [cfg.series]: values.map((v) => norm(v, cfg.range)) }, values: { [cfg.series]: values } };
  // Derived series, e.g. how much the value grew since the previous frame.
  for (const [name, d] of Object.entries(cfg.derived || {})) {
    const src = out.values[d.from];
    const vals = src.map((v, i) => (i === 0 || v == null || src[i - 1] == null ? null : Math.max(0, v - src[i - 1])));
    out.values[name] = vals;
    out.series[name] = vals.map((v) => norm(v, d.range));
  }
  return out;
}

/**
 * COVERAGE extraction: for maps where the data is drawn as bright marks on a dark base map
 * (e.g. fire detections). The value is the share of a region's pixels that carry a mark,
 * in percent. A pixel counts as a mark when it matches the colour rule.
 *
 * Config: { "type": "coverage", "regions": { name: [x0, y0, x1, y1] },
 *           "color": { "rMin", "rMinusB" }, "unit": "%", "range": [lo, hi] }
 * `framesPixels[f][name]` = RGBA pixels of that region in frame f.
 */
export function computeCoverageSeries(framesPixels, cfg) {
  const { rMin, rMinusB } = cfg.color;
  const [lo, hi] = cfg.range;
  const out = { series: {}, values: {} };
  for (const key of Object.keys(cfg.regions)) {
    const values = framesPixels.map((frame) => {
      const px = frame[key];
      let n = 0;
      for (let i = 0; i < px.length; i += 4) if (px[i] > rMin && px[i] - px[i + 2] > rMinusB) n++;
      return Math.round((n / (px.length / 4)) * 1000) / 10;
    });
    out.values[key] = values;
    out.series[key] = values.map((v) => Math.round(Math.min(1, Math.max(0, (v - lo) / (hi - lo))) * 1000) / 1000);
  }
  return out;
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
  const grab = (img, [x0, y0, x1, y1]) => {
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(x0, y0, x1 - x0, y1 - y0).data;
  };

  let result;
  if (cfg.type === 'marker') {
    const strips = images.map((img) => grab(img, cfg.strip));
    result = computeMarkerSeries(strips, cfg.strip[2] - cfg.strip[0], cfg);
  } else if (cfg.type === 'cursor') {
    const strips = images.map((img) => grab(img, cfg.strip));
    result = computeCursorSeries(strips, cfg.strip[2] - cfg.strip[0], cfg);
  } else {
    const framesPixels = images.map((img) => {
      const regions = {};
      for (const [key, box] of Object.entries(cfg.regions)) regions[key] = grab(img, box);
      return regions;
    });
    result = cfg.type === 'coverage' ? computeCoverageSeries(framesPixels, cfg) : computeSeries(framesPixels, cfg);
  }
  track.series = result.series;
  track.values = result.values;
  if (result.coverage) track.coverage = result.coverage;
  track.unit = cfg.unit ?? cfg.colormap?.unit ?? '';

  // Events whose position comes from the data itself (e.g. the highest value).
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
