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
  const month = Number(iso.slice(5, 7)) - 1;
  return `${(MONTHS[lang] || MONTHS.en)[month]} ${iso.slice(0, 4)}`;
}

/** Full month name for screen readers and narration: "September 2007" (or "2012" for unit 'year'). */
export function longDate(iso, lang, unit) {
  if (unit === 'year') return iso.slice(0, 4);
  const d = new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, 15));
  const locale = { en: 'en-US', pt: 'pt-BR', es: 'es-ES' }[lang] || 'en-US';
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
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
 * 'change' (0..1, magnitude) -> "−4.0" / "+4.0" "%" with the sign given by `sign`. NaN -> "—".
 * A share or change above zero but under 0.05 % reads "<0.1" (a note can sound for it; "0.0" would
 * contradict the sound).
 */
export function chipValue(unit, v, lang, sign = 1) {
  if (!Number.isFinite(v)) return { value: '—', suffix: '' };
  if (unit === '°C') return { value: decimal(v.toFixed(1), lang), suffix: '°C' };
  if (unit === 'brightness') return { value: decimal(v.toFixed(1), lang), suffix: '/255' };
  if (unit === 'share' || unit === 'change') {
    const tiny = v > 0 && v * 100 < 0.05;
    const pct = tiny ? decimal('<0.1', lang) : decimal((v * 100).toFixed(1), lang);
    if (unit === 'share' || v <= 0 || tiny) return { value: pct, suffix: '%' };
    return { value: `${sign < 0 ? '−' : '+'}${pct}`, suffix: '%' };
  }
  return { value: decimal(v.toFixed(2), lang), suffix: '' };
}
