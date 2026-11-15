import { useStore } from '../state/store.js';
import { seekBySteps, setPanel, togglePlay } from '../state/controller.js';
import { chipSign, describeValue, TRACK_TEXT } from '../state/tracks.js';
import { chipValue, formatDate, longDate } from '../lib/format.js';
import { t } from '../i18n/strings.js';
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
  const unit = meta.time?.unit;
  return (
    <div className="when">
      <p className="date" aria-label={longDate(iso, lang, unit)}>{formatDate(iso, lang, unit)}</p>
      <p className="caption" aria-hidden="true">{caption}</p>
    </div>
  );
}

/**
 * One glass chip per voice of the current record: "Instrument · what it plays", the value under the
 * needle (direction 5.2.1), M and S. A dash when the needle is up or the map has no value there.
 */
export function Chips() {
  const lang = useStore((s) => s.lang);
  const trackId = useStore((s) => s.trackId);
  const voices = useStore((s) => s.voices);
  const summary = useStore((s) => s.summary);
  const mute = useStore((s) => s.mute);
  const solo = useStore((s) => s.solo);
  const toggleMute = useStore((s) => s.toggleMute);
  const toggleSolo = useStore((s) => s.toggleSolo);
  const reading = useStore((s) => s.arm === 'down' && !s.switching);
  const anySolo = Object.values(solo).some(Boolean);
  return (
    <ul className="chips">
      {summary.map((sv) => {
        const voice = voices.find((v) => v.id === sv.voice);
        if (!voice) return null;
        const instrument = t(lang, `instrument.${voice.instrument}`);
        const variable = t(lang, `var.${trackId}.${sv.voice}`);
        const name = `${instrument} · ${variable}`;
        const off = mute[sv.voice] || (anySolo && !solo[sv.voice]);
        const shown = reading ? chipValue(sv.unit, sv.value, lang, chipSign(sv.voice)) : { value: '—', suffix: '' };
        return (
          <li key={`${trackId}-${sv.voice}`} className={`chip glass ${off ? 'off' : ''}`}>
            <span className="chip-name">
              <span className="chip-voice">{instrument}</span>
              <span className="chip-sep" aria-hidden="true">
                {' · '}
              </span>
              <span className="chip-zone">{variable}</span>
            </span>
            <span className="chip-row">
              <span className="chip-value">
                <span aria-hidden={reading ? 'true' : undefined}>
                  {shown.value}
                  {shown.suffix && <span className="chip-unit">{shown.suffix}</span>}
                </span>
                {reading && <span className="sr-only">{describeValue(trackId, sv, lang)}</span>}
              </span>
              <span className="chip-buttons">
                <button type="button" aria-pressed={mute[sv.voice]} aria-label={t(lang, 'mute', { voice: name })} onClick={() => toggleMute(sv.voice)}>
                  M
                </button>
                <button type="button" aria-pressed={solo[sv.voice]} aria-label={t(lang, 'solo', { voice: name })} onClick={() => toggleSolo(sv.voice)}>
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

/** Glass pill: play/pause · track · Records · Liner notes. Language lives on the cold open. */
export function Footer() {
  const lang = useStore((s) => s.lang);
  const playing = useStore((s) => s.playing);
  const panel = useStore((s) => s.panel);
  const trackId = useStore((s) => s.trackId);
  const switching = useStore((s) => s.switching);
  const shownId = switching || trackId;
  // Buttons stay focusable while a record changes (aria-disabled, not disabled) so keyboard focus
  // is not thrown to the page; the controller ignores them meanwhile.
  const busy = switching ? 'true' : undefined;
  return (
    <nav className="footer glass" aria-label="Earth Jukebox">
      <button type="button" className="play" aria-label={t(lang, playing ? 'pause' : 'play')} aria-disabled={busy} onClick={togglePlay}>
        <PlayIcon playing={playing} />
      </button>
      <span className={`track-name ${switching ? 'is-loading' : ''}`} aria-busy={busy}>
        {shownId && TRACK_TEXT[shownId][lang].title}
      </span>
      <button
        type="button"
        aria-expanded={panel === 'records'}
        aria-disabled={busy}
        className={panel === 'records' ? 'on' : ''}
        onClick={() => openPanel('records')}
      >
        {t(lang, 'records')}
      </button>
      <button
        type="button"
        aria-expanded={panel === 'liner'}
        aria-disabled={busy}
        className={panel === 'liner' ? 'on' : ''}
        onClick={() => openPanel('liner')}
      >
        {t(lang, 'linerNotes')}
      </button>
    </nav>
  );
}

/** Screen-reader time control (the platter arc is the visual one). */
export function TimeSlider() {
  const lang = useStore((s) => s.lang);
  const meta = useStore((s) => s.meta);
  const step = useStore((s) => s.step);
  if (!meta) return null;
  const date = longDate(meta.dates[step], lang, meta.time?.unit);
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
