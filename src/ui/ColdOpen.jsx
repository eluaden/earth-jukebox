import { useEffect, useRef, useState } from 'react';
import { begin, preload } from '../state/controller.js';
import { useStore } from '../state/store.js';
import { LANGS, t } from '../i18n/strings.js';

/** Black screen: headphones + choose a language to start (no start button). */
export function ColdOpen() {
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const error = useStore((s) => s.error);
  const [leaving, setLeaving] = useState(false);
  const langRefs = useRef({});

  useEffect(() => {
    preload().catch(() => {});
    langRefs.current[useStore.getState().lang]?.focus();
  }, []);

  const startWith = (next) => {
    if (leaving) return;
    setLang(next);
    setLeaving(true);
    begin().catch(() => setLeaving(false));
  };

  return (
    <div className={`cold ${leaving ? 'leaving' : ''}`}>
      <div className="cold-copy">
        <p className="cold-line">{t(lang, 'putOnHeadphones')}</p>
        <p className="cold-select">{t(lang, 'selectLanguage')}</p>
        <span className="cold-langs" role="group" aria-label={t(lang, 'language')}>
          {LANGS.map((l) => (
            <button
              key={l}
              ref={(el) => {
                langRefs.current[l] = el;
              }}
              type="button"
              lang={l}
              aria-pressed={l === lang}
              className={`cold-lang ${l === lang ? 'on' : ''}`}
              onClick={() => startWith(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </span>
        <span className="sr-only">{t(lang, 'startHint')}</span>
      </div>
      {error && <span className="cold-error" role="alert">{t(lang, 'loadError')}</span>}
    </div>
  );
}
