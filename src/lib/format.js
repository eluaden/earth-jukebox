const MONTHS = {
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  pt: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'],
  es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
};

/**
 * "2007-09-13T12:00Z" -> "SEP 2007" (read from the string, so no time zone can shift the month).
 * Tracks with one step per year (unit 'year') show the year alone: "2012".
 */
export function formatDate(iso, lang, unit) {
  if (unit === 'year') return iso.slice(0, 4);
  if (unit === 'instant') return `${Number(iso.slice(8, 10))} ${(MONTHS[lang] || MONTHS.en)[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
  const month = Number(iso.slice(5, 7)) - 1;
  return `${(MONTHS[lang] || MONTHS.en)[month]} ${iso.slice(0, 4)}`;
}

/**
 * Full month name for screen readers and narration: "September 2007" (or "2012" for unit 'year'; the
 * day too for a single instant, unit 'instant': "19 August 2025").
 */
export function longDate(iso, lang, unit) {
  if (unit === 'year') return iso.slice(0, 4);
  const instant = unit === 'instant';
  const d = new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, instant ? Number(iso.slice(8, 10)) : 15));
  // en-GB for an instant: "19 August 2025", the day first as on the screen ("19 AUG 2025").
  const locale = { en: instant ? 'en-GB' : 'en-US', pt: 'pt-BR', es: 'es-ES' }[lang] || 'en-US';
  return d.toLocaleDateString(locale, { ...(instant ? { day: 'numeric' } : {}), month: 'long', year: 'numeric', timeZone: 'UTC' });
}

const decimal = (s, lang) => (lang === 'en' ? s : s.replace('.', ','));

/** 17.84 -> "17.8 °C" (EN) or "17,8 °C" (PT, ES); NaN -> "—". */
export function formatTemp(t, lang) {
  if (!Number.isFinite(t)) return '—';
  return `${decimal(t.toFixed(1), lang)} °C`;
}

/**
 * Chip value as { value, suffix } for each unit a track's summary gives (src/music/tracks/index.js):
 * '°C' -> "17.8" "°C"; 'share' (0..1) -> "2.4" "%"; 'brightness' (0..255) -> "12.3" "/255";
 * 'change' (0..1, magnitude) -> "−4.0" / "+4.0" "%" with the sign given by `sign`; 'cm' (above
 * 1993) -> "+6.4" "cm" ("+6" for a whole centimetre); 'strength' (0..1 of the type's strongest
 * colour) -> "12" "%" ("<1" above zero). NaN -> "—".
 * A share or change above zero but under 0.05 % reads "<0.1" (a note can sound for it; "0.0" would
 * contradict the sound).
 */
export function chipValue(unit, v, lang, sign = 1) {
  if (!Number.isFinite(v)) return { value: '—', suffix: '' };
  if (unit === '°C') return { value: decimal(v.toFixed(1), lang), suffix: '°C' };
  if (unit === 'brightness') return { value: decimal(v.toFixed(1), lang), suffix: '/255' };
  if (unit === 'cm') {
    const n = Number.isInteger(v) ? String(Math.abs(v)) : decimal(Math.abs(v).toFixed(1), lang);
    return { value: `${v < 0 ? '−' : '+'}${n}`, suffix: 'cm' };
  }
  if (unit === 'strength') return { value: v > 0 && v < 0.005 ? '<1' : String(Math.round(v * 100)), suffix: '%' };
  if (unit === 'share' || unit === 'change') {
    const tiny = v > 0 && v * 100 < 0.05;
    const pct = tiny ? decimal('<0.1', lang) : decimal((v * 100).toFixed(1), lang);
    if (unit === 'share' || v <= 0 || tiny) return { value: pct, suffix: '%' };
    return { value: `${sign < 0 ? '−' : '+'}${pct}`, suffix: '%' };
  }
  return { value: decimal(v.toFixed(2), lang), suffix: '' };
}
