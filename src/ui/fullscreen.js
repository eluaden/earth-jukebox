import { $, reduce } from './dom.js';
import { isPlaying, pause, start } from './player.js';
import { t } from '../i18n/index.js';

/* ===== fullscreen video ===== */
const EXP = '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>', COL = '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>';
let scr, slot, fsT;
const isFull = () => scr.classList.contains('full');
export function fsUi() { $('#fsIcon').innerHTML = isFull() ? COL : EXP; fsT.setAttribute('aria-label', isFull() ? t('fsExit') : t('fsEnter')); }

export function expand() {
  if (isFull()) return;
  const r = scr.getBoundingClientRect();
  scr.classList.add('full'); document.body.classList.add('fs'); fsUi();
  if (!reduce && scr.animate) scr.animate([{ top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px', borderRadius: '16px' }, { top: 0, left: 0, width: '100vw', height: '100vh', borderRadius: 0 }], { duration: 520, easing: 'cubic-bezier(.2,.8,.2,1)' });
  try { const pr = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); pr && pr.catch && pr.catch(() => {}); } catch (e) {}
  fsT.focus({ preventScroll: true });
}

function settle() { scr.classList.remove('full'); document.body.classList.remove('fs'); fsUi(); }

function collapse() {
  if (!isFull()) return;
  if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); settle(); return; }
  const r = slot.getBoundingClientRect();
  if (reduce || !scr.animate) { settle(); return; }
  scr.animate([{ top: 0, left: 0, width: '100vw', height: '100vh' }, { top: r.top + 'px', left: r.left + 'px', width: r.width + 'px', height: r.height + 'px', borderRadius: '16px' }], { duration: 380, easing: 'cubic-bezier(.4,0,.2,1)' }).finished.then(settle, settle);
}

export function initFullscreen() {
  scr = $('#screen'); slot = scr.parentElement; fsT = $('#fsToggle');
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && isFull()) settle(); });
  fsT.addEventListener('click', (e) => { e.stopPropagation(); isFull() ? collapse() : expand(); });
  $('#fsPlay').addEventListener('click', (e) => { e.stopPropagation(); isPlaying() ? pause() : start(); });
  scr.addEventListener('click', (e) => { if (e.target.closest('button')) return; if (!isFull()) expand(); else isPlaying() ? pause() : start(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && isFull()) collapse(); });
  window.addEventListener('hashchange', () => { if (isFull()) { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); settle(); } });
}
