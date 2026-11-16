import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { progress, scrubEnd, scrubStart, scrubToFraction, seekToFraction, stepAtFraction } from '../state/controller.js';
import { live } from '../state/live.js';
import { useStore } from '../state/store.js';
import { SECONDS_PER_TURN } from '../data/needle.js';
import { formatDate } from '../lib/format.js';
import { t } from '../i18n/strings.js';
import { GLOBE_Y, TIME_RING } from './layout.js';

const ringVertex = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Angle 0 at the top, growing clockwise. A faint ring with a soft highlight that turns with the globe;
// amber up to the current progress of the record, brightest at its leading edge, where the playhead
// sits. Hovered (uHover -> 1) it reads as a progress bar: a thicker track, a bigger playhead, a notch
// at the start / end and a tick under the pointer; the stretch between the playhead and the pointer
// dims (going back) or lights faintly (going ahead).
const ringFragment = /* glsl */ `
  uniform float uGlint;
  uniform float uRadius;
  uniform float uProgress;
  uniform float uHover;
  uniform float uCursor;
  varying vec2 vPos;
  const float TAU = 6.28318530718;
  const vec3 AMBER_DIM = vec3(0.62, 0.42, 0.16);
  const vec3 AMBER = vec3(1.0, 0.78, 0.42);
  const vec3 CREAM = vec3(1.0, 0.92, 0.8);

  float tickAt(float f, float a, float r, float halfLen) {
    float arc = abs(mod(a / TAU - f + 0.5, 1.0) - 0.5) * TAU * r;
    return (1.0 - smoothstep(0.0012, 0.0027, arc)) * (1.0 - smoothstep(halfLen, halfLen + 0.002, abs(r - uRadius)));
  }

  void main() {
    float r = length(vPos);
    float a = atan(vPos.x, vPos.y);
    if (a < 0.0) a += TAU;
    float f = a / TAU;
    bool cursor = uCursor >= 0.0;
    float halfW = mix(0.004, 0.014, uHover);
    float band = 1.0 - smoothstep(halfW - 0.0015, halfW + 0.0015, abs(r - uRadius));
    float glint = pow(0.5 + 0.5 * cos(a - uGlint), 10.0);
    vec3 col = vec3(1.0);
    float alpha = mix(0.12, 0.18, uHover) + 0.18 * glint;
    if (uProgress >= 0.0 && f <= uProgress) {
      float lead = smoothstep(uProgress - 0.06, uProgress, f);
      col = mix(AMBER_DIM, AMBER, lead);
      alpha = 0.55 + 0.45 * lead;
      if (cursor && f > uCursor) {
        col = mix(col, CREAM, 0.4);
        alpha *= 0.4;
      }
    } else if (cursor && uProgress >= 0.0 && f <= uCursor) {
      col = AMBER;
      alpha = 0.34;
    }
    vec4 o = vec4(col, alpha * band);
    float notch = tickAt(0.0, a, r, halfW + 0.012) * uHover;
    o.rgb = mix(o.rgb, CREAM, notch);
    o.a = max(o.a, 0.7 * notch);
    if (cursor) {
      float tk = tickAt(uCursor, a, r, halfW + 0.008);
      o.rgb = mix(o.rgb, vec3(1.0), tk);
      o.a = max(o.a, 0.9 * tk);
    }
    if (uProgress >= 0.0) {
      float pa = uProgress * TAU;
      float d = distance(vPos, uRadius * vec2(sin(pa), cos(pa)));
      float kr = mix(0.0085, 0.022, uHover);
      float knob = 1.0 - smoothstep(kr - 0.0015, kr + 0.0015, d);
      float halo = (1.0 - smoothstep(kr, kr * 2.6, d)) * (0.12 + 0.25 * uHover);
      o.rgb = mix(o.rgb, AMBER, halo * (1.0 - knob));
      o.rgb = mix(o.rgb, vec3(1.0, 0.88, 0.66), knob);
      o.a = max(o.a, max(knob, halo));
    }
    gl_FragColor = o;
  }
`;

const GLINT_PER_RAD = 0.08 / ((2 * Math.PI) / SECONDS_PER_TURN); // the glint turns at 0.08 rad/s while playing
const GHOST_SPAN = 0.12; // tutorial: how far back and ahead (fraction of the record) the ghost pointer slides

/** Fraction of the record (0 at the top, clockwise) under a pointer event on the ring's plane. */
function fractionAt(e) {
  const a = Math.atan2(e.point.x, e.point.y - GLOBE_Y);
  return (a < 0 ? a + Math.PI * 2 : a) / (Math.PI * 2);
}

function TimeRing({ pointer, hint }) {
  const mat = useRef();
  const uniforms = useMemo(
    () => ({
      uGlint: { value: 0 },
      uRadius: { value: TIME_RING },
      uProgress: { value: -1 },
      uHover: { value: 0 },
      uCursor: { value: -1 },
    }),
    [],
  );
  const reduce = useMemo(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  useFrame((state, delta) => {
    const u = mat.current?.uniforms; // the material's own copy (R3F may not keep our object)
    if (!u) return;
    // The glint follows the globe: it stops when the globe stops and turns back with a drag.
    if (!reduce) u.uGlint.value = -live.rotation * GLINT_PER_RAD;
    const p = progress();
    u.uProgress.value = p;
    const p0 = pointer.current;
    const on = p0.over || p0.dragging || hint;
    u.uHover.value = reduce ? (on ? 1 : 0) : THREE.MathUtils.damp(u.uHover.value, on ? 1 : 0, 10, delta);
    if (p0.over || p0.dragging) u.uCursor.value = p0.f;
    else if (hint && !reduce) u.uCursor.value = THREE.MathUtils.clamp(p - GHOST_SPAN * Math.sin(state.clock.elapsedTime * 1.4), 0, 1);
    else u.uCursor.value = -1;
  });
  return (
    <mesh>
      <ringGeometry args={[TIME_RING - 0.06, TIME_RING + 0.06, 256, 1]} />
      <shaderMaterial ref={mat} vertexShader={ringVertex} fragmentShader={ringFragment} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
}

/** Small faint date beside the pointer: where the record would go. */
function RingLabel({ f }) {
  const lang = useStore((s) => s.lang);
  const meta = useStore((s) => s.meta);
  if (!meta || meta.time?.unit === 'instant') return null;
  const step = stepAtFraction(f);
  if (step < 0) return null;
  const a = f * Math.PI * 2;
  const r = TIME_RING + 0.09;
  return (
    <Html position={[Math.sin(a) * r, Math.cos(a) * r, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <span className="ring-label">{formatDate(meta.dates[step], lang, meta.time?.unit)}</span>
    </Html>
  );
}

/** The platter around the globe: the time ring, draggable; the globe turns with it. */
export function Platter() {
  const pointer = useRef({ over: false, dragging: false, scrubbing: false, f: 0, last: null, edge: null });
  const [labelF, setLabelF] = useState(null);
  const lang = useStore((s) => s.lang);
  const hint = useStore((s) => s.hint === 'time' && !s.panel);

  // A drag that crosses the top of the ring stops at the start or the end instead of wrapping round.
  const dragFraction = (raw) => {
    const p = pointer.current;
    const last = p.last;
    p.last = raw;
    if (p.edge === 0) {
      if (raw > 0.5) return 0;
      p.edge = null;
    } else if (p.edge === 1) {
      if (raw < 0.5) return 1;
      p.edge = null;
    } else if (last != null && raw - last > 0.5) {
      p.edge = 0;
      return 0;
    } else if (last != null && last - raw > 0.5) {
      p.edge = 1;
      return 1;
    }
    return raw;
  };

  const seek = (f) => (pointer.current.scrubbing ? scrubToFraction(f) : seekToFraction(f));

  return (
    <group position={[0, GLOBE_Y, -0.05]}>
      <TimeRing pointer={pointer} hint={hint} />
      <mesh
        onPointerDown={(e) => {
          e.stopPropagation();
          const p = pointer.current;
          p.dragging = true;
          p.last = null;
          p.edge = null;
          p.scrubbing = scrubStart('ring');
          e.target.setPointerCapture(e.pointerId);
          document.body.classList.add('dragging-globe');
          p.f = dragFraction(fractionAt(e));
          seek(p.f);
          setLabelF(p.f);
        }}
        onPointerMove={(e) => {
          const p = pointer.current;
          p.f = p.dragging ? dragFraction(fractionAt(e)) : fractionAt(e);
          if (p.dragging) seek(p.f);
          if (p.over || p.dragging) setLabelF(p.f);
        }}
        onPointerUp={(e) => {
          const p = pointer.current;
          if (!p.dragging) return;
          p.dragging = false;
          if (p.scrubbing) scrubEnd();
          p.scrubbing = false;
          e.target.releasePointerCapture(e.pointerId);
          document.body.classList.remove('dragging-globe');
          if (!p.over) setLabelF(null);
        }}
        onPointerOver={(e) => {
          pointer.current.over = true;
          pointer.current.f = fractionAt(e);
          setLabelF(pointer.current.f);
          document.body.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          pointer.current.over = false;
          if (!pointer.current.dragging) setLabelF(null);
          document.body.style.cursor = '';
        }}
      >
        <ringGeometry args={[TIME_RING - 0.07, TIME_RING + 0.07, 128, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {labelF != null && <RingLabel f={labelF} />}
      {hint && (
        <Html position={[0, -TIME_RING + 0.24, 0]} center zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
          <div className="ring-hint" aria-hidden="true">
            <p>{t(lang, 'timeHint')}</p>
            <p>{t(lang, 'pauseHint')}</p>
          </div>
        </Html>
      )}
    </group>
  );
}
