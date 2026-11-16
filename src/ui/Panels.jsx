import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store.js';
import { playLegend, replayOpening, selectTrack, setPanel, controller } from '../state/controller.js';
import { TRACK_TEXT } from '../state/tracks.js';
import { t } from '../i18n/strings.js';
import { rememberOpener, restoreFocus } from './focus.js';

function close() {
  setPanel(null);
  restoreFocus();
}

function openLiner() {
  rememberOpener();
  setPanel('liner');
}

function CloseButton({ lang, autoFocus }) {
  const ref = useRef();
  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);
  return (
    <button ref={ref} type="button" className="close" aria-label={t(lang, 'close')} onClick={close}>
      ×
    </button>
  );
}

/**
 * Records: a row of square glass covers rising from the bottom (public/tracks/index.json order).
 * The record on the platter is marked; another cover puts that record on (direction 5.4).
 * A click anywhere outside the panel closes it; the footer stays above that catch-all.
 */
export function Records() {
  const lang = useStore((s) => s.lang);
  const tracks = useStore((s) => s.tracks);
  const trackId = useStore((s) => s.trackId);
  const open = useStore((s) => s.panel === 'records');
  if (!open || !tracks.length) return null;
  const pick = (id) => {
    if (id === trackId) {
      close();
      return;
    }
    restoreFocus();
    selectTrack(id);
  };
  return (
    <>
      <div className="records-backdrop" onClick={close} />
      <section className="records glass" role="dialog" aria-label={t(lang, 'records')}>
        <CloseButton lang={lang} autoFocus />
        <ul className="covers">
          {tracks.map((tr, i) => {
            const current = tr.id === trackId;
            return (
              <li key={tr.id} style={{ '--cover-i': i }}>
                <button type="button" className={`cover ${current ? 'is-current' : ''}`} aria-current={current ? 'true' : undefined} onClick={() => pick(tr.id)}>
                  <span className="cover-art">
                    <img src={tr.cover} alt="" />
                  </span>
                  <span className="cover-name">{TRACK_TEXT[tr.id][lang].title}</span>
                  <span className="cover-period">{tr.period}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}

/**
 * Liner notes: glass drawer from the right. The pull-tab lives on the shell so it always rides
 * with the drawer (peeking at the screen edge when closed, on the left edge when open).
 */
export function LinerNotes() {
  const hint = useStore((st) => st.hint);
  const lang = useStore((s) => s.lang);
  const meta = useStore((s) => s.meta);
  const trackId = useStore((s) => s.trackId);
  const open = useStore((s) => s.panel === 'liner');
  const [playingLegend, setPlayingLegend] = useState(false);
  const openedOnce = useRef(false);

  useEffect(() => {
    if (open) openedOnce.current = true;
  }, [open]);

  if (!meta) return null;

  const text = TRACK_TEXT[trackId][lang];
  const hear = async () => {
    setPlayingLegend(true);
    await playLegend();
    setPlayingLegend(false);
  };
  // Keep panel DOM after the first open so close/open can animate without remounting content.
  const showPanel = open || openedOnce.current;

  return (
    <>
      {open && <div className="liner-backdrop" onClick={(e) => e.target === e.currentTarget && close()} />}
      <div className={`liner-shell ${open ? 'is-open' : ''} ${hint && !open ? 'hint' : ''}`}>
        <button
          type="button"
          className="liner-tab"
          aria-label={t(lang, open ? 'close' : 'linerNotes')}
          aria-expanded={open}
          onClick={() => (open ? close() : openLiner())}
        >
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path
              d="M9.5 3.5L5.5 8l4 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {showPanel && (
          <aside
            className="liner glass"
            role="dialog"
            aria-modal="true"
            aria-labelledby="liner-title"
            aria-hidden={!open}
            inert={!open ? true : undefined}
          >
            <CloseButton lang={lang} autoFocus={open} />
            <h2 id="liner-title">{text.title}</h2>
            <p className="liner-period">{meta.period}</p>

            <h3>{t(lang, 'whatYouHear')}</h3>
            <p>{text.whatYouHear}</p>

            <h3>{t(lang, 'dataToSound')}</h3>
            <table>
              <thead>
                <tr>
                  <th scope="col">{t(lang, 'data')}</th>
                  <th scope="col">{t(lang, 'sound')}</th>
                </tr>
              </thead>
              <tbody>
                {text.mapping.map(([d, s]) => (
                  <tr key={d}>
                    <td>{d}</td>
                    <td>{s}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h3>{t(lang, 'onTheMap')}</h3>
            {text.description.map((p) => (
              <p key={p}>{p}</p>
            ))}

            <h3>{meta.legend?.image ? t(lang, 'legend') : t(lang, 'legendSound')}</h3>
            {meta.legend?.image ? (
              <img
                className="legend-img"
                src={controller.track.dir + meta.legend.image}
                alt={
                  meta.legend.categories
                    ? t(lang, 'legendCategoriesAlt', { list: meta.legend.categories.map((c) => c.name).join(', ') })
                    : t(lang, 'legendImageAlt', { min: meta.legend.min, max: meta.legend.max, unit: meta.legend.unit })
                }
              />
            ) : (
              <p>{t(lang, `legendText.${trackId}`)}</p>
            )}
            <button type="button" className="hear" onClick={hear} disabled={playingLegend} aria-busy={playingLegend}>
              {t(lang, 'hearLegend')}
            </button>

            <h3>{t(lang, 'limits')}</h3>
            <ul>
              {text.limits.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>

            <h3>{t(lang, 'source')}</h3>
            <p>
              <a href={meta.source.url} target="_blank" rel="noreferrer">
                {meta.source.name}
              </a>
            </p>
          </aside>
        )}
      </div>
    </>
  );
}

/** About: method, user test, team, credits, keyboard, replay the opening. */
export function About() {
  const lang = useStore((s) => s.lang);
  const open = useStore((s) => s.panel === 'about');
  if (!open) return null;
  return (
    <div className="about-backdrop" onClick={(e) => e.target === e.currentTarget && close()}>
      <section className="about glass" role="dialog" aria-modal="true" aria-labelledby="about-title">
        <CloseButton lang={lang} autoFocus />
        <h2 id="about-title">{t(lang, 'aboutTitle')}</h2>
        <h3>{t(lang, 'method')}</h3>
        <p>{t(lang, 'methodText')}</p>
        <h3>{t(lang, 'userTest')}</h3>
        <p>{t(lang, 'userTestText')}</p>
        <h3>{t(lang, 'team')}</h3>
        <p>{t(lang, 'teamText')}</p>
        <h3>{t(lang, 'keyboard')}</h3>
        <ul>
          {t(lang, 'keyboardList').map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
        <h3>{t(lang, 'credits')}</h3>
        <ul>
          {t(lang, 'creditsList').map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ul>
        <button type="button" className="hear" onClick={replayOpening}>
          {t(lang, 'replayOpening')}
        </button>
      </section>
    </div>
  );
}
