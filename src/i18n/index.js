import { I18N } from './strings.js';
import { EN_EXTRA } from './en.js';
import { $$ } from '../ui/dom.js';

// English is the text already in the page; it is harvested once so we can switch back to it.
const EN = { play: 'Play', pause: 'Pause', ...EN_EXTRA };
let lang = 'en';
const listeners = [];

export const getLang = () => lang;
export const t = (k) => (I18N[lang] && I18N[lang][k]) || EN[k] || k;
/** Picks the current language from a { en, pt, es } object (falls back to English). */
export const pick = (o) => (o == null ? '' : typeof o === 'string' ? o : o[lang] ?? o.en ?? '');
export const onLangChange = (fn) => listeners.push(fn);

export function setLang(l) {
  lang = l;
  document.documentElement.lang = l === 'pt' ? 'pt-BR' : l;
  $$('[data-i18n]').forEach((el) => (el.textContent = t(el.dataset.i18n)));
  $$('[data-i18n-html]').forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  $$('.lang button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
  listeners.forEach((fn) => fn(l));
}

export function initI18n() {
  $$('[data-i18n]').forEach((el) => (EN[el.dataset.i18n] ??= el.textContent));
  $$('[data-i18n-html]').forEach((el) => (EN[el.dataset.i18nHtml] ??= el.innerHTML));
  $$('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
}
