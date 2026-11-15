import { $, reduce } from './dom.js';
import { lift } from './router.js';

/* ===== the vinyl zoom into the listen page ===== */
function goListen(e, link) {
  e.preventDefault();
  if (location.hash === '#listen') return;
  const fromSelector = link.closest('.selector') || link.closest('.hero');
  if (reduce || !fromSelector || !document.body.animate) { location.hash = 'listen'; return; }
  lift('listen');
  const src = $('#heroEarth').getBoundingClientRect();
  const warp = $('#warp'), fly = warp.querySelector('.disc-fly'), shade = warp.querySelector('.shade');
  const size = 220, vw = innerWidth, vh = innerHeight;
  fly.style.width = fly.style.height = size + 'px';
  fly.style.left = (src.left + src.width / 2 - size / 2) + 'px';
  fly.style.top = (src.top + src.height / 2 - size / 2) + 'px';
  warp.classList.add('on');
  const dx = vw / 2 - (src.left + src.width / 2), dy = vh / 2 - (src.top + src.height / 2);
  const big = Math.max(vw, vh) / (size * 0.36) * 1.15;
  setTimeout(() => {
    fly.animate([
      { transform: 'translate(0,0) scale(.95) rotateX(8deg) rotate(0deg)' },
      { transform: `translate(${dx * 0.35}px, ${dy * 0.35 - 60}px) scale(1.4) rotate(140deg)`, offset: .3 },
      { transform: `translate(${dx}px, ${dy}px) scale(2.2) rotate(300deg)`, offset: .55 },
      { transform: `translate(${dx}px, ${dy}px) scale(${big}) rotate(520deg)` },
    ], { duration: 1150, easing: 'cubic-bezier(.55,0,.35,1)', fill: 'forwards' });
    shade.animate([{ opacity: 0 }, { opacity: .85, offset: .5 }, { opacity: 1 }], { duration: 1150, fill: 'forwards' });
    setTimeout(() => {
      location.hash = 'listen';
      const out = [fly.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, fill: 'forwards' }),
                   shade.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 550, fill: 'forwards' })];
      Promise.all(out.map((a) => a.finished)).then(() => { warp.classList.remove('on'); fly.getAnimations().forEach((a) => a.cancel()); shade.getAnimations().forEach((a) => a.cancel()); lift(null); });
    }, 1150);
  }, 280);
}

// Delegated, so links created later (the track sleeves) work too.
export function initWarp() {
  document.addEventListener('click', (e) => { const a = e.target.closest('[data-go-listen]'); if (a) goListen(e, a); });
}
