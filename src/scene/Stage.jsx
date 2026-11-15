import { useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import gsap from 'gsap';
import { advance, introDone, togglePlay } from '../state/controller.js';
import { beginGlobeDrag, wasDrag } from '../ui/globeDrag.js';
import { useStore } from '../state/store.js';
import { Backdrop } from './Backdrop.jsx';
import { Atmosphere, Globe, Porthole } from './Globe.jsx';
import { MeridianLine, Tonearm } from './Needle.jsx';
import { Platter } from './Platter.jsx';
import { FOV, GLOBE_Y, TILT, cameraFrame } from './layout.js';

const START_Z = 60;

// Animations follow the wall clock: on a slow or throttled machine the opening still takes 3.6 s
// instead of stretching out (GSAP's default lag smoothing would slow it down frame by frame).
gsap.ticker.lagSmoothing(0);

/** Camera: sits back from space, descends to the globe on the opening, follows the window's shape. */
function CameraRig() {
  const { camera, size } = useThree();
  const phase = useStore((s) => s.phase);
  const introKey = useStore((s) => s.introKey);
  const tween = useRef(null);
  const handled = useRef({ intro: false, key: 0 });

  // Follow the window's size once the globe is in view (cameraFrame keeps the ring clear of the HUD).
  useEffect(() => {
    const frame = cameraFrame(size.width, size.height);
    camera.position.y = frame.y;
    if (!tween.current && useStore.getState().phase !== 'cold') camera.position.z = frame.z;
  }, [camera, size.width, size.height]);

  // Opening (first time, or "Replay opening" from About).
  useEffect(() => {
    const firstIntro = phase === 'intro' && !handled.current.intro;
    const replay = introKey !== handled.current.key;
    if (!firstIntro && !replay) return;
    handled.current = { intro: true, key: introKey };
    const target = cameraFrame(size.width, size.height).z;
    tween.current?.kill();
    if (!useStore.getState().introAnimated) {
      camera.position.z = target;
      introDone();
      return;
    }
    camera.position.z = START_Z;
    tween.current = gsap.to(camera.position, {
      z: target,
      duration: 3.6,
      ease: 'power2.inOut',
      onComplete: () => {
        tween.current = null;
        introDone();
      },
    });
  }, [phase, introKey, camera, size]);

  return null;
}

/** Reads the needle every frame (rotation, data step, column) through the controller. */
function Driver() {
  useFrame((_, dt) => advance(dt));
  return null;
}

/** Invisible hit target on the planet: click toggles play/pause (needle lifts on pause); drag turns it. */
function PlanetHit() {
  return (
    <mesh
      onPointerDown={(e) => beginGlobeDrag(e.nativeEvent)}
      onClick={(e) => {
        e.stopPropagation();
        if (wasDrag()) return; // a drag turned the globe: not a play / pause click
        togglePlay();
      }}
      onPointerOver={() => {
        document.body.style.cursor = 'grab';
      }}
      onPointerOut={() => {
        document.body.style.cursor = '';
      }}
    >
      <sphereGeometry args={[1.05, 48, 24]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

export default function Stage() {
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  return (
    <Canvas
      className="stage"
      flat
      dpr={[1, 2]}
      camera={{ fov: FOV, near: 0.1, far: 300, position: [0, 0, START_Z] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      aria-hidden="true"
      onCreated={(state) => {
        if (import.meta.env.DEV) window.__three = state; // dev-only inspection hook
      }}
    >
      <color attach="background" args={['#000000']} />
      <Backdrop still={reduce} />
      <Environment resolution={256}>
        <color attach="background" args={['#1a1c20']} />
        <Lightformer intensity={3} position={[0, 4, 3]} scale={[10, 2, 1]} />
        <Lightformer intensity={2} position={[-5, 1, 3]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer intensity={1.4} position={[5, -1, 2]} rotation-y={-Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer intensity={1} position={[0, -4, 4]} rotation-x={-Math.PI / 2} scale={[10, 3, 1]} />
      </Environment>
      <group position={[0, GLOBE_Y, 0]} rotation={[TILT, 0, 0]}>
        <Globe />
        <Atmosphere />
        <MeridianLine />
        <PlanetHit />
      </group>
      <Porthole />
      <Platter />
      <Tonearm />
      <CameraRig />
      <Driver />
      <EffectComposer>
        {/* Threshold above note-flash peaks so bloom does not smear over the tonearm; atmosphere rim still blooms. */}
        <Bloom intensity={0.4} luminanceThreshold={0.9} luminanceSmoothing={0.25} mipmapBlur />
      </EffectComposer>
    </Canvas>
  );
}
