import { useEffect, useRef } from 'react';
import { advance, controller, introDone } from '../state/controller.js';
import { live } from '../state/live.js';
import { useStore } from '../state/store.js';

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
    const v = controller.video;
    if (!v || !box.current) return;
    v.className = 'flat-video';
    box.current.prepend(v);
    let raf = 0;
    let last = performance.now();
    const frame = (now) => {
      advance((now - last) / 1000);
      last = now;
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
        s.style.background = d.color;
        s.style.opacity = String(1 - ((now - d.t0) / DOT_LIFE) ** 2);
        dots.current.appendChild(s);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  return (
    <div className="flat" aria-hidden="true">
      <div className="flat-map" ref={box}>
        <div className="flat-line" ref={line} />
        <div className="flat-dots" ref={dots} />
      </div>
    </div>
  );
}
