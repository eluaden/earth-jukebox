import { useId, useMemo } from 'react';
import { useStore } from '../state/store.js';
import { periodKey, seriesThrough, sparkPaths, xTickIndices } from '../data/series.js';
import { t } from '../i18n/strings.js';

const W = 300;
const H = 96;
const PAD = { l: 54, r: 18, t: 8, b: 32 };

const MONTHS = {
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  pt: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'],
  es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
};

// Every value on the chart carries a unit. Brightness (0-255 in NASA's image) is shown as a
// percentage of the image's full brightness: "/255" is a pixel scale, not a unit anyone reads.
const UNITS = {
  '°C': { toShown: (v) => v, suffix: '°C' },
  share: { toShown: (v) => v * 100, suffix: '%' },
  brightness: { toShown: (v) => (v / 255) * 100, suffix: '%' },
};

/** Decimals that keep neighbouring ticks distinct for a range of `span` (in shown units). */
function decimalsFor(span) {
  if (span >= 5) return 0;
  if (span >= 0.5) return 1;
  if (span >= 0.05) return 2;
  return 3;
}

function formatShown(v, decimals, suffix, lang) {
  const s = v.toFixed(decimals);
  return `${lang === 'en' ? s : s.replace('.', ',')} ${suffix}`;
}

/** Month on the axis; the year is a second line, only under the first and last tick. */
function xParts(key, lang, longMonthly) {
  if (key.length === 4 || longMonthly) return { main: key.slice(0, 4), year: '' };
  const month = (MONTHS[lang] || MONTHS.en)[Number(key.slice(5, 7)) - 1];
  return { main: month, year: key.slice(0, 4) };
}

/**
 * One chart per record, docked bottom-left: the whole disc (every month or year), drawn once.
 * A marker moves to the period now playing; the line does not rebuild when the record loops.
 */
export function Trend() {
  const lang = useStore((s) => s.lang);
  const meta = useStore((s) => s.meta);
  const step = useStore((s) => s.step);
  const means = useStore((s) => s.trendMeans);
  const trend = useStore((s) => s.trend);
  const gid = useId();
  const fillId = `${gid}-fill`;
  const glowId = `${gid}-glow`;

  const points = useMemo(() => {
    if (!means || !meta || !trend) return [];
    return seriesThrough(means, meta.dates, means.length - 1, trend.bucket);
  }, [means, meta, trend]);

  const nowIndex = useMemo(() => {
    if (!points.length || !meta || !trend) return 0;
    const key = periodKey(meta.dates[Math.min(step, meta.dates.length - 1)], trend.bucket);
    const i = points.findIndex((p) => p.key === key);
    return i < 0 ? 0 : i;
  }, [points, meta, step, trend]);

  const paths = useMemo(() => {
    if (points.length === 0) return null;
    return sparkPaths(
      points.map((p) => p.value),
      W,
      H,
      PAD,
    );
  }, [points]);

  const ticks = useMemo(() => xTickIndices(points.map((p) => p.key), trend?.bucket), [points, trend]);

  if (!trend || !paths || points.length === 0) return null;

  const unit = UNITS[trend.unit] || { toShown: (v) => v, suffix: trend.unit };
  const shownMin = unit.toShown(paths.min);
  const shownMax = unit.toShown(paths.max);
  const dec = decimalsFor(shownMax - shownMin);
  const fmt = (v, d = dec) => formatShown(unit.toShown(v), d, unit.suffix, lang);

  const now = points[nowIndex];
  const nowText = fmt(now.value, Math.max(1, dec));
  const { plot } = paths;
  const showMid = points.length > 2 && paths.max - paths.min > 1e-9;
  const midVal = (paths.min + paths.max) / 2;
  const midY = plot.yAt(midVal);
  const spanX = plot.x1 - plot.x0;
  const xAt = (i) => (points.length === 1 ? plot.x0 + spanX / 2 : plot.x0 + (i / (points.length - 1)) * spanX);
  const nowX = xAt(nowIndex);
  const nowY = plot.yAt(now.value);
  const longMonthly = trend.bucket === 'month' && points.length > 18;

  return (
    <div className="trend" role="img" aria-label={`${t(lang, trend.label)}: ${nowText}`}>
      <div className="trend-head" aria-hidden="true">
        <span className="trend-label">{t(lang, trend.label)}</span>
        <span className="trend-now">{nowText}</span>
      </div>
      <svg className="trend-svg" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
        <defs>
          <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <radialGradient id={glowId}>
            <stop offset="0%" stopColor="rgba(232,162,58,0.95)" />
            <stop offset="55%" stopColor="rgba(232,162,58,0.35)" />
            <stop offset="100%" stopColor="rgba(232,162,58,0)" />
          </radialGradient>
        </defs>

        <line className="trend-grid" x1={plot.x0} y1={plot.yTop} x2={plot.x1} y2={plot.yTop} />
        {showMid && <line className="trend-grid mid" x1={plot.x0} y1={midY} x2={plot.x1} y2={midY} />}
        <line className="trend-axis" x1={plot.x0} y1={plot.yBot} x2={plot.x1} y2={plot.yBot} />

        <text className="trend-tick" x={plot.x0 - 5} y={plot.yTop + 3} textAnchor="end">
          {fmt(paths.max)}
        </text>
        {showMid && (
          <text className="trend-tick" x={plot.x0 - 5} y={midY + 3} textAnchor="end">
            {fmt(midVal)}
          </text>
        )}
        <text className="trend-tick" x={plot.x0 - 5} y={plot.yBot + 3} textAnchor="end">
          {fmt(paths.min)}
        </text>

        <path className="trend-area" d={paths.area} fill={`url(#${fillId})`} />
        <path className="trend-line" d={paths.line} />
        <line className="trend-now-line" x1={nowX} y1={plot.yTop} x2={nowX} y2={plot.yBot} />
        <circle className="trend-glow" cx={nowX} cy={nowY} r="7" fill={`url(#${glowId})`} />
        <circle className="trend-dot" cx={nowX} cy={nowY} r="2.6" />

        {ticks.map((i, k) => {
          const x = xAt(i);
          const first = k === 0;
          const last = k === ticks.length - 1;
          const anchor = ticks.length === 1 ? 'middle' : first ? 'start' : last ? 'end' : 'middle';
          const parts = xParts(points[i].key, lang, longMonthly);
          return (
            <g key={points[i].key}>
              <line className="trend-xmark" x1={x} y1={plot.yBot} x2={x} y2={plot.yBot + 4} />
              <text className="trend-tick x" x={x} y={plot.yBot + 15} textAnchor={anchor}>
                {parts.main}
              </text>
              {(first || last) && parts.year && (
                <text className="trend-tick x year" x={x} y={H - 3} textAnchor={anchor}>
                  {parts.year}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
