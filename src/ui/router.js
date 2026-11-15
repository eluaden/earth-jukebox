import { $, $$, reduce } from './dom.js';
import { isPlaying, pause } from './player.js';

/* ===== routing: #listen is its own view ===== */
export function route() {
  const listen = location.hash === '#listen';
  document.body.dataset.current = listen ? 'listen' : 'home';
  $$('nav.main a').forEach((a) => a.toggleAttribute('aria-current', listen && a.hasAttribute('data-go-listen')));
  if (listen) { window.scrollTo(0, 0); $('#now-t').focus({ preventScroll: true }); }
  else {
    if (isPlaying()) pause();
    const id = location.hash.slice(1);
    const el = id && id !== 'home' && document.getElementById(id);
    el ? el.scrollIntoView() : window.scrollTo(0, 0);
  }
}

/* ===== selector: hovering a key lifts its record ===== */
const recs = {};
export function lift(name) { Object.values(recs).forEach((r) => r.classList.toggle('up', r.dataset.rec === name)); }

export function initRouter() {
  window.addEventListener('hashchange', route);
  $('#now-t').tabIndex = -1;
  $$('#stack .rec').forEach((r) => (recs[r.dataset.rec] = r));
  $$('.key').forEach((k) => { k.addEventListener('mouseenter', () => lift(k.dataset.rec)); k.addEventListener('focus', () => lift(k.dataset.rec)); });
  $('.keys').addEventListener('mouseleave', () => lift(null));
  $$('.key:not([data-go-listen])').forEach((k) => k.addEventListener('click', (e) => {
    e.preventDefault(); lift(k.dataset.rec);
    setTimeout(() => { history.pushState(null, '', k.getAttribute('href')); route(); }, reduce ? 0 : 380);
  }));
}
