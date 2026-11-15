import { useEffect } from 'react';
import { useStore } from '../state/store.js';
import { announceValues, nudgeGlobe, replayTrack, seekBySteps, setPanel, togglePlay } from '../state/controller.js';
import { rememberOpener, restoreFocus } from './focus.js';

const isField = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
const isControl = (el) => el && (el.tagName === 'BUTTON' || el.tagName === 'A' || isField(el));

/** Space play/pause · Home replay (with narration) · ← → step through time · ↑ ↓ turn the globe · V values · R records · L liner notes · Esc close. */
export function useKeys() {
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const s = useStore.getState();
      if (s.phase !== 'playing' || s.switching) return; // a record is changing: wait for it
      const target = e.target;
      if (e.key === 'Escape' && s.panel) {
        e.preventDefault();
        setPanel(null);
        restoreFocus();
        return;
      }
      if (isField(target) || target.closest?.('.inst')) return; // the instrument menu handles its own keys
      const key = e.key.toLowerCase();
      if (e.key === ' ' && !isControl(target)) {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'Home' && !isControl(target)) {
        e.preventDefault();
        replayTrack();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        nudgeGlobe(e.key === 'ArrowUp' ? 1 : -1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        seekBySteps(e.key === 'ArrowRight' ? 1 : -1);
      } else if (key === 'v') {
        announceValues();
      } else if (key === 'r' || key === 'l') {
        rememberOpener();
        setPanel(key === 'r' ? 'records' : 'liner');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}
