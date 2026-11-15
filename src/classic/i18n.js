/** Picks the text for `lang` from an {en, pt, es} object, falling back to English. */
export function pick(text, lang = 'en') {
  if (text == null) return '';
  if (typeof text === 'string') return text;
  return text[lang] ?? text.en ?? '';
}
