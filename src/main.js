import { $ } from './ui/dom.js';
import { initI18n, onLangChange, t } from './i18n/index.js';
import { configureNarrator } from './narration/narrator.js';
import { loadCatalog } from './data/tracks.js';
import { initRouter, route } from './ui/router.js';
import { initWarp } from './ui/warp.js';
import { initPlayer, render, setPlayUi, renderTrackTexts, speechLang } from './ui/player.js';
import { initLanding, renderSleeves } from './ui/landing.js';
import { initHeroEarth, initFrameCanvas } from './ui/earth.js';
import { initFullscreen, fsUi } from './ui/fullscreen.js';

initI18n();
configureNarrator({
  captionsOn: () => $('#captions').checked,
  narrateOn: () => $('#narrate').checked,
  speechLang,
  showCaption: (text) => { $('#caption').textContent = text; },
});
initRouter();
initWarp();
initHeroEarth();
initFrameCanvas();
initFullscreen();
route(); setPlayUi(); fsUi();

let catalog = [];
try { catalog = await loadCatalog(); } catch (e) { console.error(e); $('#status').textContent = t('loadError'); }
initLanding(catalog);
initPlayer(catalog);
onLangChange(() => { setPlayUi(); fsUi(); renderSleeves(); renderTrackTexts(); });
render();
