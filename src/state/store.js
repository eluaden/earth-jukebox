import { create } from 'zustand';
import { initialLang } from '../i18n/strings.js';

/** { voiceId: false } for every voice id given. */
export const allOff = (ids) => Object.fromEntries(ids.map((id) => [id, false]));

// UI state (React renders from this). Per-frame values live in ./live.js instead.
export const useStore = create((set) => ({
  phase: 'cold', // 'cold' (Put on headphones) | 'intro' (camera descent) | 'playing'
  loading: true,
  error: null,
  playing: false,
  lang: initialLang(),
  tracks: [], // [{ id, period, cover }] in Records order (public/tracks/index.json)
  trackId: null,
  switching: null, // track id being loaded and swapped in, or null
  meta: null,
  grid: null,
  trend: null, // { bucket, unit, label } from TRACK_VIEW, or null when the record has no sparkline
  trendMeans: null, // Float64Array: area-weighted global mean per step of the current grid
  base: '',
  voices: [], // [{ id, instrument }] of the current track
  step: 0,
  lon: -90,
  summary: [], // [{ voice, value, unit }] under the needle (chips)
  mute: {},
  solo: {},
  panel: null, // null | 'records' | 'liner' | 'about'
  arm: 'away', // tonearm pose: 'away' | 'up' (paused / Records) | 'down'
  caption: '',
  announcement: '',
  seekTo: null,
  introKey: 0,
  introAnimated: true,
  scrubbing: false, // the globe or the time ring is being dragged: the date follows, the needle plays what passes under it
  instrumentChoice: {}, // 'trackId:voiceId' -> instrument picked by the listener
  hint: null, // first visit: 'hearing', then 'records', then 'time' after the intro (null when idle)

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
