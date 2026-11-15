import { $ } from './ui/dom.js';
import { initI18n, onLangChange, getLang } from './i18n/index.js';
import { configureNarrator } from './narration/narrator.js';
import { SPEECH } from './narration/lines.js';
import { initRouter, route } from './ui/router.js';
import { initWarp } from './ui/warp.js';
import { initPlayer, render, setPlayUi } from './ui/player.js';
import { initHeroEarth, initFrameCanvas } from './ui/earth.js';
import { initFullscreen } from './ui/fullscreen.js';

initI18n();
onLangChange(setPlayUi);
configureNarrator({
  captionsOn: () => $('#captions').checked,
  narrateOn: () => $('#narrate').checked,
  speechLang: () => SPEECH[getLang()].lang,
  showCaption: (text) => { $('#caption').textContent = text; },
});
initRouter();
initWarp();
initPlayer();
initHeroEarth();
initFrameCanvas();
initFullscreen();

route(); render(); setPlayUi();
