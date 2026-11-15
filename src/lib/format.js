const MONTHS = {
  en: ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
  pt: ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'],
  es: ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'],
};

/** "2007-09-13T12:00Z" -> "SEP 2007" (read from the string, so no time zone can shift the month). */
export function formatDate(iso, lang) {
  const month = Number(iso.slice(5, 7)) - 1;
  return `${(MONTHS[lang] || MONTHS.en)[month]} ${iso.slice(0, 4)}`;
}

/** Full month name for screen readers: "September 2007". */
export function longDate(iso, lang) {
  const d = new Date(Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, 15));
  const locale = { en: 'en-US', pt: 'pt-BR', es: 'es-ES' }[lang] || 'en-US';
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/** 17.84 -> "17.8 °C" (EN) or "17,8 °C" (PT, ES); NaN -> "—". */
export function formatTemp(t, lang) {
  if (!Number.isFinite(t)) return '—';
  const s = t.toFixed(1);
  return `${lang === 'en' ? s : s.replace('.', ',')} °C`;
}
