import { $ } from './dom.js';
import { pick } from '../i18n/index.js';
import { selectTrack } from './player.js';

/** The record sleeves on the landing page, one per track in public/tracks/index.json. */
let catalog = [];

export function renderSleeves() {
  $('#sleeves').replaceChildren(...catalog.map((c) => {
    const a = document.createElement('a');
    a.className = 'sleeve'; a.href = '#listen'; a.dataset.goListen = ''; a.dataset.track = c.id;
    a.innerHTML = '<div class="art" aria-hidden="true"><svg class="vin" viewBox="0 0 200 200"><use href="#vinyl"/></svg>'
      + '<div class="cover real"><span class="cc"></span><span class="ct"></span></div></div>'
      + '<h3></h3><span class="meta"></span><span class="map"></span>';
    const cover = a.querySelector('.cover');
    const [c1, c2, c3] = c.cover || ['#EAF4FF', '#7FB4D9', '#24507A'];
    cover.style.background = `linear-gradient(160deg,${c1},${c2} 70%,${c3})`;
    a.querySelector('.cc').textContent = c.code;
    a.querySelector('.ct').textContent = c.short;
    a.querySelector('h3').textContent = pick(c.title);
    a.querySelector('.meta').textContent = pick(c.meta);
    a.querySelector('.map').textContent = pick(c.summary);
    return a;
  }));
}

export function initLanding(tracks) {
  catalog = tracks;
  renderSleeves();
  // Choosing a sleeve puts that record on (the link itself goes to #listen).
  $('#sleeves').addEventListener('click', (e) => { const a = e.target.closest('[data-track]'); if (a) selectTrack(a.dataset.track); });
}
