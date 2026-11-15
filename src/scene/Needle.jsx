import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { live } from '../state/live.js';
import { useStore } from '../state/store.js';
import { LINE_LATS, NEEDLE_LAT, meridianPoint } from './layout.js';

const DOT_LIFE = 650; // ms a note stays lit on the needle line
const POOL = 16;

/** The meridian the needle reads, drawn as a line of light on the surface, and the note dots. */
export function MeridianLine() {
  const geom = useMemo(() => {
    const pts = [];
    for (let lat = LINE_LATS[0]; lat <= LINE_LATS[1]; lat += 2) {
      const r = THREE.MathUtils.degToRad(lat);
      pts.push(new THREE.Vector3(0, Math.sin(r) * 1.003, Math.cos(r) * 1.003));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.0038, 6, false);
  }, []);
  const dots = useRef([]);

  useFrame(() => {
    const now = performance.now();
    const alive = live.dots.filter((d) => now - d.t0 < DOT_LIFE);
    live.dots = alive;
    const recent = alive.slice(-POOL);
    dots.current.forEach((m, i) => {
      const d = recent[i];
      if (!m) return;
      if (!d) {
        m.visible = false;
        return;
      }
      const age = (now - d.t0) / DOT_LIFE;
      const r = THREE.MathUtils.degToRad(d.lat);
      m.visible = true;
      m.position.set(0, Math.sin(r) * 1.008, Math.cos(r) * 1.008);
      m.scale.setScalar(1.25 - 0.55 * age);
      m.material.color.set(d.color);
      m.material.opacity = 1 - age * age;
    });
  });

  return (
    <group>
      <mesh geometry={geom}>
        <meshBasicMaterial color="#ffffff" transparent opacity={0.85} toneMapped={false} />
      </mesh>
      {Array.from({ length: POOL }, (_, i) => (
        <mesh key={i} ref={(m) => (dots.current[i] = m)} visible={false}>
          <sphereGeometry args={[0.024, 16, 12]} />
          <meshBasicMaterial transparent toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

const POSES = {
  down: { x: 0, y: 0, z: 0, rz: 0 },
  up: { x: 0.08, y: 0.13, z: 0.2, rz: 0 },
  away: { x: 1.9, y: 1.5, z: 0.1, rz: -0.12 },
};

/** Slender chrome tonearm coming from the top-right corner; its stylus rests on the meridian. */
export function Tonearm() {
  const group = useRef();
  const arm = useStore((s) => s.arm);

  const parts = useMemo(() => {
    const tip = meridianPoint(NEEDLE_LAT, 1.004);
    const head = tip.clone().add(new THREE.Vector3(0.1, 0.1, 0.07));
    const pivot = new THREE.Vector3(2.55, 1.95, 0.15);
    const curve = new THREE.CatmullRomCurve3([
      pivot,
      new THREE.Vector3(1.85, 1.55, 0.62),
      new THREE.Vector3(0.95, 0.98, 0.98),
      head.clone().add(new THREE.Vector3(0.16, 0.12, 0.02)),
      head,
    ]);
    const tube = new THREE.TubeGeometry(curve, 120, 0.011, 12, false);
    const dir = curve.getTangent(1).normalize();
    const shell = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
    const stylusLen = head.distanceTo(tip);
    const stylusMid = head.clone().add(tip).multiplyScalar(0.5);
    const stylusQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), head.clone().sub(tip).normalize());
    return { pivot, head, tube, shell, stylusLen, stylusMid, stylusQ };
  }, []);

  useEffect(() => {
    const p = POSES[arm];
    const g = group.current;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const d = reduce ? 0 : arm === 'away' ? 0 : 0.8;
    gsap.to(g.position, { x: parts.pivot.x + p.x, y: parts.pivot.y + p.y, z: parts.pivot.z + p.z, duration: d, ease: 'power2.inOut' });
    gsap.to(g.rotation, { z: p.rz, duration: d, ease: 'power2.inOut' });
  }, [arm, parts]);

  const chrome = <meshStandardMaterial color="#eef1f5" metalness={0.92} roughness={0.18} envMapIntensity={1.6} />;
  return (
    <group ref={group} position={[parts.pivot.x + POSES.away.x, parts.pivot.y + POSES.away.y, parts.pivot.z + POSES.away.z]}>
      <group position={[-parts.pivot.x, -parts.pivot.y, -parts.pivot.z]}>
        <mesh geometry={parts.tube}>{chrome}</mesh>
        <mesh position={parts.head} quaternion={parts.shell}>
          <boxGeometry args={[0.11, 0.034, 0.05]} />
          <meshStandardMaterial color="#1b1d21" metalness={0.6} roughness={0.35} />
        </mesh>
        <mesh position={parts.stylusMid} quaternion={parts.stylusQ}>
          <cylinderGeometry args={[0.002, 0.005, parts.stylusLen, 8]} />
          {chrome}
        </mesh>
        <mesh position={parts.pivot}>
          <cylinderGeometry args={[0.07, 0.07, 0.12, 32]} />
          {chrome}
        </mesh>
      </group>
    </group>
  );
}
