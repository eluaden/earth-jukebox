import { pick } from '../i18n.js';

/**
 * Scripts for one listening session: introduction + audio legend, events, outro.
 * `ctx` = { track, lang, narrator, engine, onText(text), resolveUrl(file) }.
 * onText lets the UI show each line as a caption.
 */

function line(ctx, text, audio) {
  const t = pick(text, ctx.lang);
  if (!t) return Promise.resolve(true);
  ctx.onText(t);
  const file = audio && audio[ctx.lang];
  return ctx.narrator.say(t, file ? ctx.resolveUrl(file) : undefined);
}

/**
 * Title, intro, then the AUDIO LEGEND: for each layer, "this is the least…" + its sound
 * at value 0, "this is the most…" + its sound at value 1.
 * Resolves true if it ran to the end, false if cancelled.
 */
export async function runIntro(ctx) {
  const { track, engine } = ctx;
  const n = track.narration || {};
  if (!(await line(ctx, track.title))) return false;
  if (!(await line(ctx, n.intro, n.audio?.intro))) return false;
  for (const [key, m] of Object.entries(track.mapping)) {
    if (!m.legend) continue;
    for (const [end, value] of [['min', 0], ['max', 1]]) {
      const gen = ctx.narrator.generation;
      if (!(await line(ctx, m.legend[end], m.legend.audio?.[end]))) return false;
      await engine.previewValue(key, value, 2.2);
      if (gen !== ctx.narrator.generation) return false; // cancelled during the sound
    }
  }
  return true;
}

/** Speaks a track event over the music, lowering the music while talking. */
export async function sayEvent(ctx, event) {
  if (!event.say) return;
  ctx.engine.setDucked(true);
  await line(ctx, event.say, event.audio);
  ctx.engine.setDucked(false);
}

export function runOutro(ctx) {
  const n = ctx.track.narration || {};
  return line(ctx, n.outro, n.audio?.outro);
}
