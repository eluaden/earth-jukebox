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

/** "NASA SVS 3912" from an svs.gsfc.nasa.gov URL; the full source name lives under "Learn more". */
function svsLabel(url) {
  const id = url.match(/svs\.gsfc\.nasa\.gov\/(\d+)/)?.[1];
  return id ? `NASA SVS ${id}` : 'NASA';
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

const SWIPE_DEAD_PX = 10; // finger travel before a press on the drawer becomes a horizontal swipe
const SWIPE_SHARE = 0.25; // share of the drawer's width a swipe must cover to open or close it
const SWIPE_FLICK = 0.5; // px/ms: a quick flick counts even when short

/**
 * Touch swipe on the liner drawer: the drawer follows the finger; released past SWIPE_SHARE of its
 * width (or flicked) it opens or closes, otherwise it settles back. Open: swipe right to close.
 * Closed: pull the tab left to open. Vertical moves stay a scroll of the notes; mouse keeps clicks.
 * Returns the shell's pointer handlers.
 */
function useDrawerSwipe(shell, open) {
  const drag = useRef(null); // { id, x0, y0, x, t, v, width, active }
  const swiped = useRef(false); // the click that ends a swipe must not toggle the tab again

  const settle = () => {
    const el = shell.current;
    if (el) {
      el.style.transition = '';
      el.style.transform = '';
    }
    drag.current = null;
  };

  return {
    onPointerDown(e) {
      if (e.pointerType === 'mouse' || drag.current) return;
      swiped.current = false;
      drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, t: e.timeStamp, v: 0, width: shell.current.offsetWidth, active: false };
    },
    onPointerMove(e) {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      const dx = e.clientX - d.x0;
      if (!d.active) {
        if (Math.abs(e.clientY - d.y0) > SWIPE_DEAD_PX) return settle(); // a scroll, not a swipe
        if (Math.abs(dx) < SWIPE_DEAD_PX) return;
        d.active = true;
        e.target.setPointerCapture(e.pointerId); // the shell itself takes no pointer events while closed
        shell.current.style.transition = 'none';
      }
      const dt = Math.max(1, e.timeStamp - d.t);
      d.v = (e.clientX - d.x) / dt;
      d.x = e.clientX;
      d.t = e.timeStamp;
      const offset = open ? Math.max(0, dx) : Math.max(0, d.width + Math.min(0, dx));
      shell.current.style.transform = `translateX(${offset}px)`;
    },
    onPointerUp(e) {
      const d = drag.current;
      if (!d || e.pointerId !== d.id) return;
      if (d.active) {
        swiped.current = true;
        const dx = e.clientX - d.x0;
        if (open && (dx > d.width * SWIPE_SHARE || d.v > SWIPE_FLICK)) close();
        else if (!open && (-dx > d.width * SWIPE_SHARE || d.v < -SWIPE_FLICK)) openLiner();
      }
      settle();
    },
    onPointerCancel: settle,
    onClickCapture(e) {
      if (!swiped.current) return;
      swiped.current = false;
      e.preventDefault();
      e.stopPropagation();
    },
  };
}

/**
 * Liner notes: glass drawer from the right. The pull-tab lives on the shell so it always rides
 * with the drawer (peeking at the screen edge when closed, on the left edge when open). On touch
 * screens the drawer also follows a horizontal swipe (useDrawerSwipe).
 */
export function LinerNotes() {
  const hint = useStore((st) => st.hint);
  const lang = useStore((s) => s.lang);
  const meta = useStore((s) => s.meta);
  const trackId = useStore((s) => s.trackId);
  const open = useStore((s) => s.panel === 'liner');
  const [playingLegend, setPlayingLegend] = useState(false);
  const openedOnce = useRef(false);
  const shell = useRef(null);
  const swipe = useDrawerSwipe(shell, open);

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
      <div ref={shell} className={`liner-shell ${open ? 'is-open' : ''} ${hint === 'hearing' && !open ? 'hint' : ''}`} {...swipe}>
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
            <p className="liner-period">
              {meta.period} · {text.dataset} ·{' '}
              <a href={meta.source.url} target="_blank" rel="noreferrer">
                {svsLabel(meta.source.url)}
              </a>
            </p>

            <p className="liner-lede">{text.whatYouHear}</p>

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

            <h3>{t(lang, 'listenFor')}</h3>
            <ul className="liner-highlights">
              {text.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>

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

            <details className="liner-more" key={trackId}>
              <summary>{t(lang, 'learnMore')}</summary>
              <h4>{t(lang, 'onTheMap')}</h4>
              {text.description.map((p) => (
                <p key={p}>{p}</p>
              ))}
              <h4>{t(lang, 'limits')}</h4>
              <ul>
                {text.limits.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <h4>{t(lang, 'source')}</h4>
              <p>
                <a href={meta.source.url} target="_blank" rel="noreferrer">
                  {meta.source.name}
                </a>
              </p>
            </details>
          </aside>
        )}
      </div>
    </>
  );
}

/** About: method, team, credits, keyboard, replay the opening. */
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
