import { useStore, VOICES } from '../state/store.js';
import { seekBySteps, setPanel, togglePlay } from '../state/controller.js';
import { formatDate, formatTemp, longDate } from '../lib/format.js';
import { LANGS, t } from '../i18n/strings.js';
import { SST_TEXT } from '../i18n/tracks/sst.js';
import { rememberOpener } from './focus.js';

function openPanel(name) {
  rememberOpener();
  setPanel(name);
}

/** Top corners: brand and About. */
export function Corners() {
  const lang = useStore((s) => s.lang);
  return (
    <>
      <div className="brand" aria-hidden="true">{t(lang, 'brand')}</div>
      <button type="button" className="about-link" onClick={() => openPanel('about')}>
        {t(lang, 'about')}
      </button>
    </>
  );
}

/** Big date on the left, narration caption below it. */
export function DateCaption() {
  const lang = useStore((s) => s.lang);
  const meta = useStore((s) => s.meta);
  const step = useStore((s) => s.step);
  const caption = useStore((s) => s.caption);
  if (!meta) return null;
  const iso = meta.dates[step];
  return (
    <div className="when">
      <p className="date" aria-label={longDate(iso, lang)}>{formatDate(iso, lang)}</p>
      <p className="caption" aria-hidden="true">{caption}</p>
    </div>
  );
}

/** One glass chip per instrument: "Instrument · variable", live value, M and S. */
export function Chips() {
  const lang = useStore((s) => s.lang);
  const zones = useStore((s) => s.zones);
  const mute = useStore((s) => s.mute);
  const solo = useStore((s) => s.solo);
  const toggleMute = useStore((s) => s.toggleMute);
  const toggleSolo = useStore((s) => s.toggleSolo);
  const anySolo = VOICES.some((v) => solo[v]);
  return (
    <ul className="chips">
      {zones.map((z) => {
        const name = t(lang, `voice.${z.voice}`);
        const off = mute[z.voice] || (anySolo && !solo[z.voice]);
        return (
          <li key={z.id} className={`chip glass ${off ? 'off' : ''}`}>
            <span className="chip-name">
              {name} · {t(lang, `zone.${z.id}`)}
            </span>
            <span className="chip-row">
              <span className="chip-value">{formatTemp(z.mean, lang)}</span>
              <span className="chip-buttons">
                <button type="button" aria-pressed={mute[z.voice]} aria-label={t(lang, 'mute', { voice: name })} onClick={() => toggleMute(z.voice)}>
                  M
                </button>
                <button type="button" aria-pressed={solo[z.voice]} aria-label={t(lang, 'solo', { voice: name })} onClick={() => toggleSolo(z.voice)}>
                  S
                </button>
              </span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function PlayIcon({ playing }) {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      {playing ? (
        <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" fill="currentColor" />
      ) : (
        <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
      )}
    </svg>
  );
}

/** Glass pill: play/pause · track · Records · Liner notes · Listen · EN · PT · ES. */
export function Footer() {
  const lang = useStore((s) => s.lang);
  const playing = useStore((s) => s.playing);
  const panel = useStore((s) => s.panel);
  const setLang = useStore((s) => s.setLang);
  return (
    <nav className="footer glass" aria-label="Earth Jukebox">
      <button type="button" className="play" aria-label={t(lang, playing ? 'pause' : 'play')} onClick={togglePlay}>
        <PlayIcon playing={playing} />
      </button>
      <span className="track-name">{SST_TEXT[lang].title}</span>
      <button type="button" aria-expanded={panel === 'records'} className={panel === 'records' ? 'on' : ''} onClick={() => openPanel('records')}>
        {t(lang, 'records')}
      </button>
      <button type="button" aria-expanded={panel === 'liner'} className={panel === 'liner' ? 'on' : ''} onClick={() => openPanel('liner')}>
        {t(lang, 'linerNotes')}
      </button>
      <span className="modes">
        <button type="button" aria-pressed="true" className="on">
          {t(lang, 'listen')}
        </button>
      </span>
      <span className="langs" role="group" aria-label={t(lang, 'language')}>
        {LANGS.map((l, i) => (
          <span key={l}>
            {i > 0 && <span aria-hidden="true"> · </span>}
            <button type="button" lang={l} aria-pressed={l === lang} className={l === lang ? 'on' : ''} onClick={() => setLang(l)}>
              {l.toUpperCase()}
            </button>
          </span>
        ))}
      </span>
    </nav>
  );
}

/** Screen-reader time control (the platter arc is the visual one). */
export function TimeSlider() {
  const lang = useStore((s) => s.lang);
  const meta = useStore((s) => s.meta);
  const step = useStore((s) => s.step);
  if (!meta) return null;
  const date = longDate(meta.dates[step], lang);
  return (
    <div className="sr-only">
      <input
        type="range"
        min={0}
        max={meta.grid.steps - 1}
        value={step}
        aria-label={t(lang, 'progress', { date })}
        aria-valuetext={date}
        onChange={(e) => seekBySteps(Number(e.target.value) - step)}
      />
    </div>
  );
}

/** Polite live region: narration lines and values asked for with V. */
export function LiveRegion() {
  const text = useStore((s) => s.announcement);
  return (
    <div className="sr-only" aria-live="polite" role="status">
      {text}
    </div>
  );
}
