import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { FOV, dustPositions } from './layout.js';

// Background that answers the mouse without competing with the data: far stars and near dust move
// at different rates (parallax), the dust brightens near the cursor and a faint blue glow follows it
// behind the globe. Touch is ignored (dragging belongs to the globe); reduced motion keeps it still.

const DUST_COUNT = 600;
const GLOW_DEPTH = -50; // world z of the glow plane, behind the platter, in front of the far stars
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

/** Mouse position in normalized device coordinates, shared by the three layers. */
const pointer = { x: 0, y: 0, inside: false, speed: 0, t: 0 };

function usePointer(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const move = (e) => {
      if (e.pointerType !== 'mouse') return;
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = -(e.clientY / innerHeight) * 2 + 1;
      const now = performance.now();
      const dt = Math.max(1, now - pointer.t) / 1000;
      pointer.speed = Math.min(4, Math.hypot(x - pointer.x, y - pointer.y) / dt);
      Object.assign(pointer, { x, y, inside: true, t: now });
    };
    const leave = () => {
      pointer.inside = false;
    };
    const root = document.documentElement;
    addEventListener('pointermove', move, { passive: true });
    root.addEventListener('mouseleave', leave);
    addEventListener('blur', leave);
    return () => {
      removeEventListener('pointermove', move);
      root.removeEventListener('mouseleave', leave);
      removeEventListener('blur', leave);
    };
  }, [enabled]);
}

const dustVertex = /* glsl */ `
  attribute float aSize;
  attribute float aSeed;
  uniform vec2 uPointer;
  uniform float uHover;
  uniform float uAspect;
  uniform float uPixelRatio;
  uniform float uTime;
  varying float vAlpha;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vec2 ndc = gl_Position.xy / gl_Position.w;
    float near = smoothstep(0.4, 0.0, length((ndc - uPointer) * vec2(uAspect, 1.0))) * uHover;
    float twinkle = 0.7 + 0.3 * sin(uTime * (0.5 + aSeed * 1.5) + aSeed * 40.0);
    vAlpha = (0.65 + near * 0.6) * twinkle;
    float size = aSize * (1.0 + near * 1.4) * (30.0 / -mv.z);
    gl_PointSize = min(size, 7.0) * uPixelRatio;
  }
`;

const dustFragment = /* glsl */ `
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    float a = smoothstep(0.5, 0.15, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(vec3(0.84, 0.9, 1.0), a * vAlpha * uOpacity);
  }
`;

const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Same blue as the atmosphere rim (Globe.jsx), fading to a cooler violet at the edge.
const glowFragment = /* glsl */ `
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float r = length(vUv - 0.5) * 2.0;
    float core = exp(-r * r * 6.0);
    float halo = exp(-r * r * 2.2) * (1.0 - smoothstep(0.55, 1.0, r));
    vec3 col = mix(vec3(0.28, 0.2, 0.62), vec3(0.32, 0.56, 1.0), core);
    gl_FragColor = vec4(col * (core * 0.25 + halo * 0.75) * uIntensity, 1.0);
  }
`;

// R3F copies each uniform when it applies the prop, so per-frame writes go through the material's
// own uniforms (via the mesh ref), never through the object passed as the prop.

function Dust({ still }) {
  const { positions, sizes, seeds } = useMemo(() => dustPositions(DUST_COUNT), []);
  const uniforms = useMemo(
    () => ({
      uPointer: { value: new THREE.Vector2() },
      uHover: { value: 0 },
      uAspect: { value: 1 },
      uPixelRatio: { value: 1 },
      uTime: { value: 0 },
      uOpacity: { value: 1 },
    }),
    [],
  );

  const group = useRef();
  const points = useRef();
  useFrame(({ gl, size }, dt) => {
    const u = points.current.material.uniforms;
    u.uAspect.value = size.width / size.height;
    u.uPixelRatio.value = gl.getPixelRatio();
    if (!still) u.uTime.value += dt;
    u.uPointer.value.x = THREE.MathUtils.damp(u.uPointer.value.x, pointer.x, 6, dt);
    u.uPointer.value.y = THREE.MathUtils.damp(u.uPointer.value.y, pointer.y, 6, dt);
    u.uHover.value = THREE.MathUtils.damp(u.uHover.value, pointer.inside ? 1 : 0, 3, dt);
    const g = group.current;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -pointer.x * 0.07, 2.5, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, pointer.y * 0.045, 2.5, dt);
    if (!still) g.rotation.z += dt * 0.004;
  });

  return (
    <group ref={group}>
      <points ref={points} frustumCulled={false} renderOrder={-1}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
        </bufferGeometry>
        <shaderMaterial
          vertexShader={dustVertex}
          fragmentShader={dustFragment}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

function Glow() {
  const { camera, size } = useThree();
  const mesh = useRef();
  const uniforms = useMemo(() => ({ uIntensity: { value: 0 } }), []);
  const energy = useRef(0);
  const at = useRef(new THREE.Vector2());

  useFrame((_, dt) => {
    pointer.speed = THREE.MathUtils.damp(pointer.speed, 0, 4, dt);
    energy.current = THREE.MathUtils.damp(energy.current, Math.min(1, pointer.speed * 0.5), 5, dt);
    at.current.x = THREE.MathUtils.damp(at.current.x, pointer.x, 2.2, dt);
    at.current.y = THREE.MathUtils.damp(at.current.y, pointer.y, 2.2, dt);

    // Keep the glow under the cursor and the same size on screen, wherever the camera is.
    const depth = camera.position.z - GLOW_DEPTH;
    const halfH = depth * TAN;
    const m = mesh.current;
    m.position.set(at.current.x * halfH * (size.width / size.height), camera.position.y + at.current.y * halfH, GLOW_DEPTH);
    m.scale.setScalar(halfH * 4);
    const target = pointer.inside ? 0.008 + energy.current * 0.008 : 0;
    const u = m.material.uniforms;
    u.uIntensity.value = THREE.MathUtils.damp(u.uIntensity.value, target, 2, dt);
  });

  return (
    <mesh ref={mesh} renderOrder={-2}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        vertexShader={glowVertex}
        fragmentShader={glowFragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function FarStars({ still }) {
  const group = useRef();
  useFrame((_, dt) => {
    const g = group.current;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -pointer.x * 0.022, 2, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, pointer.y * 0.014, 2, dt);
  });
  return (
    <group ref={group}>
      <Stars radius={90} depth={50} count={2200} factor={4} saturation={0} fade speed={still ? 0 : 0.25} />
    </group>
  );
}

/** Deep space behind the record: parallax stars, dust that wakes near the cursor, a faint glow. */
export function Backdrop({ still }) {
  usePointer(!still);
  return (
    <>
      <FarStars still={still} />
      {!still && <Glow />}
      <Dust still={still} />
    </>
  );
}
