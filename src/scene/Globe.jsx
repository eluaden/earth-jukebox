import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { controller } from '../state/controller.js';
import { live } from '../state/live.js';
import { useStore } from '../state/store.js';

// The globe wears the NASA video. Unlit, so the colours under the needle stay exactly the NASA
// legend colours; only the limb darkens (for volume) and the grey land is dimmed (land is not data).
const shadeVertex = ['#include <common>', 'varying vec3 vViewN;'];
const shadeNormal = ['#include <begin_vertex>', 'vViewN = normalize(normalMatrix * normal);'];
const shadeFragment = /* glsl */ `
  #include <map_fragment>
  {
    float mu = clamp(dot(normalize(vViewN), vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
    float hi = max(max(diffuseColor.r, diffuseColor.g), diffuseColor.b);
    float lo = min(min(diffuseColor.r, diffuseColor.g), diffuseColor.b);
    float sat = (hi - lo) / max(hi, 1e-3);
    float land = 1.0 - smoothstep(0.14, 0.32, sat);
    diffuseColor.rgb *= mix(1.0, 0.5, land);
    diffuseColor.rgb *= mix(0.3, 1.0, smoothstep(0.0, 0.5, mu));
    diffuseColor.rgb += vec3(0.18, 0.36, 0.9) * pow(1.0 - mu, 3.0) * 0.32;
  }
`;

function shade(shader) {
  shader.vertexShader = shader.vertexShader
    .replace(shadeVertex[0], shadeVertex.join('\n'))
    .replace(shadeNormal[0], shadeNormal.join('\n'));
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vViewN;')
    .replace('#include <map_fragment>', shadeFragment);
}

export function Globe() {
  const spin = useRef();
  const mat = useRef();
  const started = useRef(false);
  const meta = useStore((s) => s.meta);

  const { videoTex, posterTex } = useMemo(() => {
    const videoTex = new THREE.VideoTexture(controller.video);
    videoTex.colorSpace = THREE.SRGBColorSpace;
    const posterTex = new THREE.TextureLoader().load(controller.dir + meta.poster);
    posterTex.colorSpace = THREE.SRGBColorSpace;
    for (const tex of [videoTex, posterTex]) tex.anisotropy = 8;
    return { videoTex, posterTex };
  }, [meta]);

  useEffect(() => () => {
    videoTex.dispose();
    posterTex.dispose();
  }, [videoTex, posterTex]);

  useFrame(() => {
    spin.current.rotation.y = live.rotation;
    // A video texture stays black until the video plays its first frame: show the poster until then.
    const v = controller.video;
    if (!started.current && !v.paused && v.readyState >= 2 && v.currentTime > 0) started.current = true;
    const map = started.current ? videoTex : posterTex;
    if (mat.current.map !== map) {
      mat.current.map = map;
      mat.current.needsUpdate = true;
    }
  });

  return (
    <mesh ref={spin}>
      <sphereGeometry args={[1, 160, 80]} />
      <meshBasicMaterial ref={mat} map={posterTex} toneMapped={false} onBeforeCompile={shade} />
    </mesh>
  );
}

const haloVertex = /* glsl */ `
  varying vec3 vN;
  void main() {
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
// Back faces of a slightly larger sphere: brightest right at the globe's edge, fading outward.
const haloFragment = /* glsl */ `
  uniform float uEdge;
  varying vec3 vN;
  void main() {
    float k = clamp(-vN.z / uEdge, 0.0, 1.0);
    float glow = pow(k, 2.4);
    gl_FragColor = vec4(vec3(0.32, 0.56, 1.0) * glow * 0.85, glow);
  }
`;

const HALO = 1.09;

/** Thin blue atmosphere halo around the globe. */
export function Atmosphere() {
  const uniforms = useMemo(() => ({ uEdge: { value: Math.sqrt(1 - 1 / (HALO * HALO)) } }), []);
  return (
    <mesh scale={HALO}>
      <sphereGeometry args={[1, 96, 48]} />
      <shaderMaterial
        vertexShader={haloVertex}
        fragmentShader={haloFragment}
        uniforms={uniforms}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
