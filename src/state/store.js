import { create } from 'zustand';
import { initialLang } from '../i18n/strings.js';
import { zonesFromColumn } from '../data/zones.js';

export const VOICES = ['strings', 'piano', 'glock'];
const none = () => ({ strings: false, piano: false, glock: false });
export const EMPTY_ZONES = zonesFromColumn(new Float32Array(90).fill(NaN));

// UI state (React renders from this). Per-frame values live in ./live.js instead.
export const useStore = create((set) => ({
  phase: 'cold', // 'cold' (Put on headphones) | 'intro' (camera descent) | 'playing'
  loading: true,
  error: null,
  playing: false,
  lang: initialLang(),
  meta: null,
  grid: null,
  base: '',
  step: 0,
  lon: -90,
  zones: EMPTY_ZONES,
  mute: none(),
  solo: none(),
  panel: null, // null | 'records' | 'liner' | 'about'
  arm: 'away', // tonearm pose: 'away' | 'up' | 'down'
  caption: '',
  announcement: '',
  seekTo: null,
  introKey: 0,
  introAnimated: true,

  setLang: (lang) => {
    try {
      localStorage.setItem('ej-lang', lang);
    } catch {
      /* storage blocked: the choice lasts for this visit only */
    }
    set({ lang });
  },
  toggleMute: (v) => set((s) => ({ mute: { ...s.mute, [v]: !s.mute[v] } })),
  toggleSolo: (v) => set((s) => ({ solo: { ...s.solo, [v]: !s.solo[v] } })),
  requestSeek: (seconds) => set({ seekTo: seconds }),
  setCaption: (caption) => set({ caption }),
  announce: (text) => set({ announcement: text }),
}));
