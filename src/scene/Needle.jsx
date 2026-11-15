import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import * as THREE from 'three';
import { live } from '../state/live.js';
import { useStore } from '../state/store.js';
import { GLOBE_Y, LINE_LATS, NEEDLE_LAT, meridianPoint, pivotFor } from './layout.js';

const DOT_LIFE = 650; // ms a note flash lasts on the meridian
const POOL = 16;

/** Soft radial disc for note flashes. Bright enough to read; peak kept under the bloom threshold so it stays under the tonearm. */
function softFlashMap() {
  const size = 64;
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.15)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

const FLASH_OUT = new THREE.Vector3(0, 0, 1); // planeGeometry faces +Z; we align that to the surface normal
const FLASH_N = new THREE.Vector3();

/**
 * The meridian the needle reads (a hairline groove on the surface) and the note flashes.
 * The line marks where the stylus reads; each flash is one note lighting that latitude — not a city pin.
 */
export function MeridianLine() {
  const geom = useMemo(() => {
    const pts = [];
    for (let lat = LINE_LATS[0]; lat <= LINE_LATS[1]; lat += 2) {
      const r = THREE.MathUtils.degToRad(lat);
      pts.push(new THREE.Vector3(0, Math.sin(r) * 1.002, Math.cos(r) * 1.002));
    }
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.00115, 6, false);
  }, []);
  const flashMap = useMemo(() => softFlashMap(), []);
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
      const lat = THREE.MathUtils.clamp(d.lat, LINE_LATS[0] + 2, LINE_LATS[1] - 2);
      const r = THREE.MathUtils.degToRad(lat);
      const y = Math.sin(r);
      const z = Math.cos(r);
      m.visible = true;
      // On the globe surface, under the tonearm (depthTest on). Additive glow, but capped so bloom does not smear over the headshell.
      m.position.set(0, y * 1.004, z * 1.004);
      m.quaternion.setFromUnitVectors(FLASH_OUT, FLASH_N.set(0, y, z).normalize());
      const grow = 1 + 0.25 * (1 - age);
      m.scale.setScalar(0.07 * grow);
      m.material.color.set(d.color);
      m.material.opacity = (1 - age * age) * 0.7;
    });
  });

  return (
    <group>
      <mesh geometry={geom}>
        <meshBasicMaterial color="#e8eaed" transparent opacity={0.4} toneMapped={false} depthWrite={false} />
      </mesh>
      {Array.from({ length: POOL }, (_, i) => (
        <mesh key={i} ref={(m) => (dots.current[i] = m)} visible={false} scale={0.07}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={flashMap}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

// The arm swings about the pivot's axis (world Z, toward the camera), like a real tonearm:
// 'down' = stylus on the meridian, 'up' = lifted toward the camera and swung slightly off the
// line (the camera faces the arm, so lift alone barely reads), 'away' = parked above the record
// (opening, before the needle drops).
const POSES = {
  down: { z: 0, rz: 0 },
  up: { z: 0.26, rz: -0.09 },
  away: { z: 0.12, rz: -0.42 },
};

const Z = new THREE.Vector3(0, 0, 1);
const along = (v) => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.clone().normalize());

/** Slender chrome tonearm on a pivot at the top right; its stylus rests on the meridian. */
export function Tonearm() {
  const group = useRef();
  const arm = useStore((s) => s.arm);
  const aspect = useThree((s) => s.size.width / s.size.height);

  const parts = useMemo(() => {
    const pivot = pivotFor(aspect);
    const tip = meridianPoint(NEEDLE_LAT, 1.002);
    const normal = tip.clone().sub(new THREE.Vector3(0, GLOBE_Y, 0)).normalize();
    const head = tip.clone().addScaledVector(normal, 0.075);
    const top = pivot.clone().add(new THREE.Vector3(0, 0, 0.1));
    const flat = head.clone().sub(top).setZ(0);
    const dir = flat.clone().normalize();
    // A rigid straight arm that bends only near the headshell (a J-shaped tonearm), the bend
    // turning away from the platter centre.
    const side = new THREE.Vector3(-dir.y, dir.x, 0);
    if (side.dot(top.clone().add(head).setZ(0)) < 0) side.negate();
    const len = flat.length();
    const bendStart = top.clone().lerp(head, 0.72).addScaledVector(side, len * 0.03);
    const curve = new THREE.CatmullRomCurve3([
      top,
      top.clone().lerp(bendStart, 0.5),
      bendStart,
      bendStart.clone().lerp(head, 0.6).addScaledVector(side, len * 0.012),
      head,
    ]);
    const tube = new THREE.TubeGeometry(curve, 160, 0.0105, 14, false);
    const end = curve.getTangent(1).normalize();
    const shellQ = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), end);
    const shellPos = head.clone().addScaledVector(end, 0.035);
    const stylusLen = head.distanceTo(tip);
    const stylusMid = head.clone().add(tip).multiplyScalar(0.5);
    const back = top.clone().addScaledVector(dir, -0.2);
    const stubMid = top.clone().add(back).multiplyScalar(0.5);
    const weight = top.clone().addScaledVector(dir, -0.17);
    return {
      pivot,
      tube,
      shellQ,
      shellPos,
      stylusLen,
      stylusMid,
      stylusQ: along(head.clone().sub(tip)),
      stubMid,
      stubQ: along(dir),
      weight,
      axisQ: along(Z),
    };
  }, [aspect]);

  useEffect(() => {
    const p = POSES[arm];
    const g = group.current;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const d = reduce ? 0 : 0.9;
    gsap.to(g.position, { x: parts.pivot.x, y: parts.pivot.y, z: parts.pivot.z + p.z, duration: d, ease: 'power2.inOut' });
    gsap.to(g.rotation, { z: p.rz, duration: d, ease: 'power2.inOut' });
  }, [arm, parts]);

  const chrome = <meshStandardMaterial color="#f2f4f7" metalness={1} roughness={0.14} envMapIntensity={1.8} />;
  const dark = <meshStandardMaterial color="#16181c" metalness={0.7} roughness={0.32} envMapIntensity={1.2} />;
  return (
    <>
      {/* Base plate and bearing stay put; only the arm swings and lifts. */}
      <group position={parts.pivot}>
        <mesh quaternion={parts.axisQ} position={[0, 0, -0.01]}>
          <cylinderGeometry args={[0.12, 0.125, 0.02, 64]} />
          <meshStandardMaterial color="#2c2f35" metalness={0.85} roughness={0.38} envMapIntensity={1.4} />
        </mesh>
        <mesh position={[0, 0, 0.001]}>
          <torusGeometry args={[0.12, 0.006, 12, 96]} />
          {chrome}
        </mesh>
        <mesh quaternion={parts.axisQ} position={[0, 0, 0.03]}>
          <cylinderGeometry args={[0.055, 0.065, 0.07, 48]} />
          {chrome}
        </mesh>
      </group>
      <group ref={group} position={[parts.pivot.x, parts.pivot.y, parts.pivot.z + POSES.away.z]} rotation={[0, 0, POSES.away.rz]}>
        <group position={[-parts.pivot.x, -parts.pivot.y, -parts.pivot.z]}>
          <mesh geometry={parts.tube}>{chrome}</mesh>
          <mesh position={parts.stubMid} quaternion={parts.stubQ}>
            <cylinderGeometry args={[0.009, 0.009, 0.2, 14]} />
            {chrome}
          </mesh>
          <mesh position={parts.weight} quaternion={parts.stubQ}>
            <cylinderGeometry args={[0.045, 0.045, 0.09, 40]} />
            {dark}
          </mesh>
          <mesh position={[parts.pivot.x, parts.pivot.y, parts.pivot.z + 0.1]}>
            <sphereGeometry args={[0.03, 24, 16]} />
            {chrome}
          </mesh>
          <mesh position={parts.shellPos} quaternion={parts.shellQ}>
            <boxGeometry args={[0.1, 0.03, 0.04]} />
            {dark}
          </mesh>
          <mesh position={parts.stylusMid} quaternion={parts.stylusQ}>
            <cylinderGeometry args={[0.0015, 0.006, parts.stylusLen, 10]} />
            {chrome}
          </mesh>
        </group>
      </group>
    </>
  );
}
