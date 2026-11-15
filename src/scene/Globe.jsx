import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { controller } from '../state/controller.js';
import { live } from '../state/live.js';
import { useStore } from '../state/store.js';

// The globe wears the NASA video. Unlit material so the colours stay exactly the NASA legend colours.
export function Globe() {
  const spin = useRef();
  const mat = useRef();
  const meta = useStore((s) => s.meta);

  const { videoTex, posterTex } = useMemo(() => {
    const videoTex = new THREE.VideoTexture(controller.video);
    videoTex.colorSpace = THREE.SRGBColorSpace;
    const posterTex = new THREE.TextureLoader().load(controller.dir + meta.poster);
    posterTex.colorSpace = THREE.SRGBColorSpace;
    for (const tex of [videoTex, posterTex]) tex.anisotropy = 4;
    return { videoTex, posterTex };
  }, [meta]);

  useEffect(() => () => {
    videoTex.dispose();
    posterTex.dispose();
  }, [videoTex, posterTex]);

  useFrame(() => {
    spin.current.rotation.y = live.rotation;
    const ready = controller.video.readyState >= 2;
    const map = ready ? videoTex : posterTex;
    if (mat.current.map !== map) {
      mat.current.map = map;
      mat.current.needsUpdate = true;
    }
  });

  return (
    <mesh ref={spin}>
      <sphereGeometry args={[1, 128, 64]} />
      <meshBasicMaterial ref={mat} map={posterTex} toneMapped={false} />
    </mesh>
  );
}

const atmosphereVertex = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const atmosphereFragment = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float rim = pow(clamp(0.58 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.2);
    gl_FragColor = vec4(vec3(0.42, 0.62, 1.0) * rim * 0.9, rim * 0.7);
  }
`;

/** Thin atmosphere halo around the globe. */
export function Atmosphere() {
  return (
    <mesh scale={1.035}>
      <sphereGeometry args={[1, 64, 32]} />
      <shaderMaterial
        vertexShader={atmosphereVertex}
        fragmentShader={atmosphereFragment}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
