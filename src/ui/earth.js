import { $, reduce } from './dom.js';
import { drawEarth } from './earthDraw.js';
import { live } from './player.js';

/** Landing: the slowly turning Earth on the turntable. */
export function initHeroEarth() {
  const hero = $('#heroEarth'), hg = hero.getContext('2d');
  function heroLoop(ts) {
    if (document.body.dataset.current === 'home') { hg.clearRect(0, 0, 760, 760); drawEarth(hg, 380, 380, 318, reduce ? -55 : -55 + (ts || 0) / 160, 26, .6); }
    if (!reduce) requestAnimationFrame(heroLoop);
  }
  requestAnimationFrame(heroLoop);
}

/* ===== the "video": EIC frame stand-in, drawn from the data =====
   Used while a track has no video file. */
export function initFrameCanvas() {
  const cv = $('#frame'), g = cv.getContext('2d');
  let shown = live.ice;
  function drawFrame(ts) {
    if (document.body.dataset.current === 'listen') {
      shown += (live.ice - shown) * .08;
      const w = cv.width, h = cv.height;
      const bg = g.createRadialGradient(w / 2, h * .45, 40, w / 2, h / 2, w * .7); bg.addColorStop(0, '#0E1A2E'); bg.addColorStop(1, '#04070D');
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(245,239,230,.6)';
      for (let i = 0; i < 90; i++) { const x = (i * 197.3) % w, y = (i * 89.7) % h; g.fillRect(x, y, i % 7 === 0 ? 2 : 1, i % 7 === 0 ? 2 : 1); }
      drawEarth(g, w / 2, h / 2 + 6, h * .43, reduce ? -20 : -20 + 28 * Math.sin((ts || 0) / 14000), 64, shown);
    }
    requestAnimationFrame(drawFrame);
  }
  requestAnimationFrame(drawFrame);
}
