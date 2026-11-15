import { useEffect, useRef, useState } from 'react';
import { begin, preload } from '../state/controller.js';
import { useStore } from '../state/store.js';
import { t } from '../i18n/strings.js';

/** Black screen, one small line: "Put on headphones." Any click or Enter starts (and unlocks audio). */
export function ColdOpen() {
  const lang = useStore((s) => s.lang);
  const error = useStore((s) => s.error);
  const [leaving, setLeaving] = useState(false);
  const ref = useRef();

  useEffect(() => {
    preload().catch(() => {});
    ref.current?.focus();
  }, []);

  const start = () => {
    if (leaving) return;
    setLeaving(true);
    begin().catch(() => setLeaving(false));
  };

  return (
    <button ref={ref} type="button" className={`cold ${leaving ? 'leaving' : ''}`} onClick={start}>
      <span className="cold-line">{t(lang, 'putOnHeadphones')}</span>
      <span className="sr-only">{t(lang, 'startHint')}</span>
      {error && <span className="cold-error" role="alert">{t(lang, 'loadError')}</span>}
    </button>
  );
}
