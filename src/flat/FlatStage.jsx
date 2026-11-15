import { useEffect, useRef } from 'react';
import { advance, controller, introDone, togglePlay } from '../state/controller.js';
import { live } from '../state/live.js';
import { useStore } from '../state/store.js';
import { stillsFrame } from '../media/skins.js';

/** WebGL available? (The 3D stage needs it; otherwise the flat map is shown.) */
export function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

const DOT_LIFE = 650;

/** The flat picture of one skin: its <video>, or two stacked images faded at each change of year. */
function flatLayer(skin) {
  const el = document.createElement('div');
  el.className = 'flat-layer';
  if (skin.meta.texture?.kind === 'porthole') el.classList.add('flat-porthole');
  if (skin.kind === 'video') {
    skin.el.className = 'flat-media';
    el.appendChild(skin.el);
    return { el, frame() {} };
  }
  const [from, to] = [0, 1].map(() => {
    const img = document.createElement('img');
    img.className = 'flat-media';
    img.alt = '';
    el.appendChild(img);
    return img;
  });
  const src = (img, i) => {
    if (img.dataset.i !== String(i) && skin.isLoaded(i)) {
      img.src = skin.images[i].src;
      img.dataset.i = String(i);
    }
  };
  return {
    el,
    frame() {
      const f = stillsFrame(skin.meta, skin.time(), skin.laps);
      src(from, f.from);
      src(to, f.to);
      to.style.opacity = String(to.dataset.i === String(f.to) ? f.mix : 0);
    },
  };
}

/** 2D version: the flat NASA map with a vertical needle line sweeping across it; same sound and UI. */
export default function FlatStage() {
  const box = useRef();
  const line = useRef();
  const dots = useRef();
  const phase = useStore((s) => s.phase);

  useEffect(() => {
    if (phase === 'intro') introDone();
  }, [phase]);

  useEffect(() => {
    if (!box.current) return;
    const layers = new Map(); // skin -> layer
    let raf = 0;
    let last = performance.now();
    const frame = (now) => {
      advance((now - last) / 1000);
      last = now;

      const current = controller.track?.skin;
      for (const [skin, layer] of layers) {
        if (skin.disposed) {
          layer.el.remove();
          layers.delete(skin);
        } else if (skin !== current) {
          layer.el.classList.remove('is-current');
        }
      }
      if (current && !current.disposed) {
        let layer = layers.get(current);
        if (!layer) {
          layer = flatLayer(current);
          layers.set(current, layer);
          box.current.prepend(layer.el);
          void layer.el.offsetWidth; // first paint at opacity 0, so the record fades in
        }
        layer.el.classList.add('is-current');
        layer.frame();
      }

      // The porthole record (sea level) has no column under a needle.
      const porthole = Boolean(controller.track?.view.porthole);
      line.current.classList.toggle('is-hidden', porthole);
      dots.current.classList.toggle('is-hidden', porthole);
      const x = ((live.lon + 180) / 360) * 100;
      line.current.style.left = `${x}%`;
      const alive = live.dots.filter((d) => now - d.t0 < DOT_LIFE);
      live.dots = alive;
      dots.current.innerHTML = '';
      for (const d of alive.slice(-16)) {
        const s = document.createElement('span');
        s.className = 'flat-dot';
        s.style.left = `${x}%`;
        s.style.top = `${((90 - d.lat) / 180) * 100}%`;
        s.style.setProperty('--dot', d.color);
        s.style.opacity = String(1 - ((now - d.t0) / DOT_LIFE) ** 2);
        dots.current.appendChild(s);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      for (const layer of layers.values()) layer.el.remove();
    };
  }, [phase]);

  return (
    <div className="flat" aria-hidden="true">
      <div className="flat-map" ref={box} onClick={togglePlay}>
        <div className="flat-line" ref={line} />
        <div className="flat-dots" ref={dots} />
      </div>
    </div>
  );
}
