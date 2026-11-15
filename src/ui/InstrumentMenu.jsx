import { useEffect, useId, useRef, useState } from 'react';
import { chooseInstrument } from '../state/controller.js';
import { instrumentsFor } from '../music/instruments.js';
import { t } from '../i18n/strings.js';

/**
 * The instrument of one voice, on its chip: a small glass menu in the site's style (not the
 * system select). Keyboard: Enter / Space / ↓ open, ↑ ↓ move, Enter picks, Esc or Tab close.
 * Only the instruments chosen for this record are offered (src/music/instruments.js).
 */
export function InstrumentMenu({ lang, trackId, voiceId, instrument, variable }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const button = useRef();
  const list = useRef();
  const id = useId();
  const choices = instrumentsFor(trackId, instrument);

  useEffect(() => {
    if (!open) return;
    const outside = (e) => {
      if (!list.current?.contains(e.target) && !button.current?.contains(e.target)) setOpen(false);
    };
    addEventListener('pointerdown', outside);
    return () => removeEventListener('pointerdown', outside);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelectorAll('[role="option"]')[active]?.focus();
  }, [open, active]);

  const show = () => {
    setActive(Math.max(0, choices.indexOf(instrument)));
    setOpen(true);
  };
  const close = (refocus = true) => {
    setOpen(false);
    if (refocus) button.current?.focus();
  };
  const pick = (inst) => {
    close();
    if (inst !== instrument) chooseInstrument(voiceId, inst);
  };

  const onListKey = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + choices.length) % choices.length);
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault();
      setActive(e.key === 'Home' ? 0 : choices.length - 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab') {
      close(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      pick(choices[active]);
    }
  };

  return (
    <span className={`inst ${open ? 'is-open' : ''}`}>
      <button
        ref={button}
        type="button"
        className="inst-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={`${t(lang, 'instrumentFor', { variable })}: ${t(lang, `instrument.${instrument}`)}`}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            e.stopPropagation();
            show();
          }
        }}
      >
        {t(lang, `instrument.${instrument}`)}
        <svg className="inst-caret" viewBox="0 0 10 6" width="9" height="6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul ref={list} id={id} className="inst-list glass" role="listbox" aria-label={t(lang, 'instrumentFor', { variable })} onKeyDown={onListKey}>
          {choices.map((inst, i) => (
            <li
              key={inst}
              role="option"
              tabIndex={i === active ? 0 : -1}
              aria-selected={inst === instrument}
              className={i === active ? 'is-active' : ''}
              onPointerEnter={() => setActive(i)}
              onClick={() => pick(inst)}
            >
              <span className="inst-dot" aria-hidden="true" />
              {t(lang, `instrument.${inst}`)}
            </li>
          ))}
        </ul>
      )}
    </span>
  );
}
