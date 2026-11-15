import { useStore } from '../state/store.js';
import { chooseInstrument, replayTrack, seekBySteps, setPanel, togglePlay } from '../state/controller.js';
import { INSTRUMENT_CHOICES } from '../music/instruments.js';
import { chipSign, describeValue, TRACK_TEXT } from '../state/tracks.js';
import { chipValue, formatDate, longDate } from '../lib/format.js';
import { t } from '../i18n/strings.js';
import { rememberOpener } from './focus.js';

function openPanel(name) {
  rememberOpener();
  setPanel(name);
}

function InfoIcon({ size = 15 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9.2" />
      <path d="M12 11v5.5" />
      <circle cx="12" cy="7.6" r="0.6" fill="currentColor" />
    </svg>
  );
}

/** Top corners: brand, 'What am I hearing?' and About. */
export function Corners() {
  const lang = useStore((s) => s.lang);
  const hint = useStore((s) => s.hint);
  return (
    <>
      <div className="brand" aria-hidden="true">{t(lang, 'brand')}</div>
      <button type="button" className={`hearing-link ${hint ? 'hint' : ''}`} onClick={() => openPanel('liner')}>
        <InfoIcon size={14} />
        {t(lang, 'linerNotes')}
      </button>
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
  const label = formatDate(iso, lang, unit);
  return (
    <div className="when">
      <p key={label} className="date" aria-label={longDate(iso, lang, unit)}>
        {label}
      </p>
      <p className="caption" aria-hidden="true">
        {caption}
      </p>
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
              <span className="chip-voice">
                <select
                  className="chip-instrument"
                  value={voice.instrument}
                  aria-label={t(lang, 'instrumentFor', { variable })}
                  onChange={(e) => chooseInstrument(sv.voice, e.target.value)}
                >
                  {INSTRUMENT_CHOICES.map((inst) => (
                    <option key={inst} value={inst}>
                      {t(lang, `instrument.${inst}`)}
                    </option>
                  ))}
                </select>
                <span className="chip-caret" aria-hidden="true">
                  ▾
                </span>
                <span className="chip-instrument-label" aria-hidden="true">
                  {instrument}
                </span>
              </span>
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

function ReplayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12a8 8 0 1 0 2.6-5.9" />
      <path d="M4 4v4.5h4.5" />
    </svg>
  );
}

/** Glass pill: play/pause · replay · track · Records · Liner notes. Language lives on the cold open. */
export function Footer() {
  const lang = useStore((s) => s.lang);
  const playing = useStore((s) => s.playing);
  const panel = useStore((s) => s.panel);
  const trackId = useStore((s) => s.trackId);
  const switching = useStore((s) => s.switching);
  const hint = useStore((s) => s.hint);
  const shownId = switching || trackId;
  // Buttons stay focusable while a record changes (aria-disabled, not disabled) so keyboard focus
  // is not thrown to the page; the controller ignores them meanwhile.
  const busy = switching ? 'true' : undefined;
  return (
    <nav className="footer glass" aria-label="Earth Jukebox">
      <button type="button" className="play" aria-label={t(lang, playing ? 'pause' : 'play')} aria-disabled={busy} onClick={togglePlay}>
        <PlayIcon playing={playing} />
      </button>
      <button type="button" className="replay" aria-label={t(lang, 'replay')} title={t(lang, 'replay')} aria-disabled={busy} onClick={replayTrack}>
        <ReplayIcon />
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
        aria-label={t(lang, 'linerNotes')}
        className={`hearing ${panel === 'liner' ? 'on' : ''} ${hint ? 'hint' : ''}`}
        onClick={() => openPanel('liner')}
      >
        <InfoIcon />
        <span className="hearing-label">{t(lang, 'linerNotes')}</span>
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
