import { useEffect, useRef, useState } from 'react';
import { useStore } from '../state/store.js';
import { playLegend, replayOpening, setPanel, controller } from '../state/controller.js';
import { t } from '../i18n/strings.js';
import { SST_TEXT } from '../i18n/tracks/sst.js';
import { restoreFocus } from './focus.js';

function close() {
  setPanel(null);
  restoreFocus();
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

/** Records: a row of square glass covers rising from the bottom. One track in this slice. */
export function Records() {
  const lang = useStore((s) => s.lang);
  const meta = useStore((s) => s.meta);
  const open = useStore((s) => s.panel === 'records');
  if (!open || !meta) return null;
  return (
    <section className="records glass" role="dialog" aria-label={t(lang, 'records')}>
      <CloseButton lang={lang} autoFocus />
      <ul className="covers">
        <li>
          <button type="button" className="cover" aria-current="true" onClick={close}>
            <span className="cover-art">
              <img src={controller.dir + meta.cover} alt="" />
            </span>
            <span className="cover-name">{SST_TEXT[lang].title}</span>
            <span className="cover-period">{meta.period}</span>
          </button>
        </li>
      </ul>
    </section>
  );
}

/** Liner notes: glass panel sliding in from the right while the music keeps playing. */
export function LinerNotes() {
  const lang = useStore((s) => s.lang);
  const meta = useStore((s) => s.meta);
  const open = useStore((s) => s.panel === 'liner');
  const [playingLegend, setPlayingLegend] = useState(false);
  if (!open || !meta) return null;
  const text = SST_TEXT[lang];
  const hear = async () => {
    setPlayingLegend(true);
    await playLegend();
    setPlayingLegend(false);
  };
  return (
    <aside className="liner glass" aria-labelledby="liner-title">
      <CloseButton lang={lang} autoFocus />
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

      <h3>{t(lang, 'legend')}</h3>
      <img className="legend-img" src={controller.dir + meta.legend.image} alt="Sea Surface Temp (°C): 0 blue, 10 green, 20 yellow-green, 32 red" />
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
