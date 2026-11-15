import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { progress } from '../state/controller.js';
import { useStore } from '../state/store.js';
import { GLOBE_Y, RINGS } from './layout.js';

const ringVertex = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Angle 0 at the top, growing clockwise. Faint ring with a soft highlight that turns slowly; the
// time ring paints amber up to the current progress of the year.
const ringFragment = /* glsl */ `
  uniform float uTime;
  uniform float uSpeed;
  uniform float uBase;
  uniform float uProgress;
  varying vec2 vPos;
  const float TAU = 6.28318530718;
  void main() {
    float a = atan(vPos.x, vPos.y);
    if (a < 0.0) a += TAU;
    float glint = pow(0.5 + 0.5 * cos(a - uTime * uSpeed), 10.0);
    vec3 col = vec3(1.0);
    float alpha = uBase + 0.22 * glint;
    if (uProgress >= 0.0 && a / TAU <= uProgress) {
      col = vec3(0.91, 0.64, 0.23);
      alpha = 0.95;
    }
    gl_FragColor = vec4(col, alpha);
  }
`;

function Ring({ radius, width, speed, base, timeRing }) {
  const mat = useRef();
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uSpeed: { value: speed }, uBase: { value: base }, uProgress: { value: -1 } }),
    [speed, base],
  );
  const reduce = useMemo(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches, []);
  useFrame((state) => {
    const u = mat.current?.uniforms; // the material's own copy (R3F may not keep our object)
    if (!u) return;
    u.uTime.value = reduce ? 0 : state.clock.elapsedTime;
    if (timeRing) u.uProgress.value = progress();
  });
  return (
    <mesh>
      <ringGeometry args={[radius - width / 2, radius + width / 2, 256, 1]} />
      <shaderMaterial ref={mat} vertexShader={ringVertex} fragmentShader={ringFragment} uniforms={uniforms} transparent depthWrite={false} />
    </mesh>
  );
}

/** Concentric "platter" rings around the globe; the middle one is the draggable time arc. */
export function Platter() {
  const requestSeek = useStore((s) => s.requestSeek);
  const dragging = useRef(false);

  const seekAt = (e) => {
    const { meta, phase } = useStore.getState();
    if (!meta || phase !== 'playing') return;
    const x = e.point.x;
    const y = e.point.y - GLOBE_Y;
    let a = Math.atan2(x, y);
    if (a < 0) a += Math.PI * 2;
    requestSeek((a / (Math.PI * 2)) * meta.video.duration);
  };

  return (
    <group position={[0, GLOBE_Y, -0.05]}>
      <Ring radius={RINGS[0]} width={0.004} speed={0.12} base={0.1} />
      <Ring radius={RINGS[1]} width={0.007} speed={0.08} base={0.16} timeRing />
      <Ring radius={RINGS[2]} width={0.004} speed={0.05} base={0.07} />
      <mesh
        onPointerDown={(e) => {
          e.stopPropagation();
          dragging.current = true;
          e.target.setPointerCapture(e.pointerId);
          seekAt(e);
        }}
        onPointerMove={(e) => dragging.current && seekAt(e)}
        onPointerUp={(e) => {
          dragging.current = false;
          e.target.releasePointerCapture(e.pointerId);
        }}
        onPointerOver={() => (document.body.style.cursor = 'grab')}
        onPointerOut={() => (document.body.style.cursor = '')}
      >
        <ringGeometry args={[RINGS[1] - 0.07, RINGS[1] + 0.07, 128, 1]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
