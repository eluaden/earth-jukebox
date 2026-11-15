import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { controller } from '../state/controller.js';
import { live } from '../state/live.js';
import { stillsFrame } from '../media/skins.js';
import { TRACK_VIEW } from '../state/tracks.js';

// The globe wears the NASA map of the current record. Unlit, so the colours under the needle stay
// exactly the NASA legend colours; only the limb darkens (for volume) and, on maps where grey is
// land without data (TRACK_VIEW dimLand), the grey land is dimmed. Two textures are mixed in the
// shader: a record changing (crossfade between two skins) and the yearly fade of a still-image
// record use the same mix.
const shadeVertex = ['#include <common>', 'varying vec3 vViewN;'];
const shadeNormal = ['#include <begin_vertex>', 'vViewN = normalize(normalMatrix * normal);'];
// Video frames are uploaded as raw sRGB bytes (colorSpace = NoColorSpace) and decoded here, so the
// program stays the same whichever texture is in each slot; images use the GPU's own sRGB decode.
const shadePars = /* glsl */ `
  varying vec3 vViewN;
  uniform sampler2D uMap2;
  uniform float uMix;
  uniform float uDecodeA;
  uniform float uDecodeB;
  uniform float uDimA;
  uniform float uDimB;
  vec4 ejDecode(vec4 c, float on) {
    vec3 lin = mix(pow(c.rgb * 0.9478672986 + 0.0521327014, vec3(2.4)), c.rgb * 0.0773993808, vec3(lessThanEqual(c.rgb, vec3(0.04045))));
    return vec4(mix(c.rgb, lin, on), c.a);
  }
  vec4 ejDimLand(vec4 c, float on) {
    float hi = max(max(c.r, c.g), c.b);
    float lo = min(min(c.r, c.g), c.b);
    float sat = (hi - lo) / max(hi, 1e-3);
    float land = 1.0 - smoothstep(0.14, 0.32, sat);
    return vec4(c.rgb * mix(1.0, 0.5, land * on), c.a);
  }
`;
const shadeFragment = /* glsl */ `
  #ifdef USE_MAP
    vec4 texA = ejDimLand(ejDecode(texture2D(map, vMapUv), uDecodeA), uDimA);
    vec4 texB = ejDimLand(ejDecode(texture2D(uMap2, vMapUv), uDecodeB), uDimB);
    diffuseColor *= mix(texA, texB, uMix);
  #endif
  {
    float mu = clamp(dot(normalize(vViewN), vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
    diffuseColor.rgb *= mix(0.3, 1.0, smoothstep(0.0, 0.5, mu));
    diffuseColor.rgb += vec3(0.18, 0.36, 0.9) * pow(1.0 - mu, 3.0) * 0.32;
  }
`;

function placeholder() {
  const tex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  tex.needsUpdate = true;
  return tex;
}

function prepare(tex, skin, colorSpace = THREE.SRGBColorSpace) {
  tex.colorSpace = colorSpace;
  tex.anisotropy = 8;
  tex.userData.dim = TRACK_VIEW[skin.meta.id]?.dimLand ? 1 : 0;
  return tex;
}

/** Video skin: the poster until the video shows its first frame, then the video itself. */
function videoLayer(skin) {
  const video = prepare(new THREE.VideoTexture(skin.el), skin, THREE.NoColorSpace);
  video.userData.decode = 1;
  const poster = prepare(new THREE.TextureLoader().load(skin.poster), skin);
  let started = false;
  const current = () => {
    const v = skin.el;
    if (!started && !v.paused && v.readyState >= 2 && v.currentTime > 0) started = true;
    return started ? video : poster;
  };
  return {
    frame: () => {
      const tex = current();
      return { a: tex, b: tex, mix: 0 };
    },
    still: current,
    dispose() {
      video.dispose();
      poster.dispose();
    },
  };
}

/** Still-image skin: two textures (the year before and this year) faded at each change of year. */
function stillsLayer(skin) {
  const from = prepare(new THREE.Texture(), skin);
  const to = prepare(new THREE.Texture(), skin);
  const shown = new Map([
    [from, -1],
    [to, -1],
  ]);
  // Puts image i on tex if it is loaded; true when tex now shows image i.
  const show = (tex, i) => {
    if (shown.get(tex) !== i && skin.isLoaded(i)) {
      tex.image = skin.images[i];
      tex.needsUpdate = true;
      shown.set(tex, i);
    }
    return shown.get(tex) === i;
  };
  return {
    frame() {
      const f = stillsFrame(skin.meta, skin.time(), skin.laps);
      const hasTo = show(to, f.to);
      const hasFrom = show(from, f.from);
      if (hasFrom && hasTo) return { a: from, b: to, mix: f.mix };
      // A year not downloaded yet: hold the picture already on screen instead of fading to black.
      const held = hasTo ? to : from;
      return { a: held, b: held, mix: 0 };
    },
    still() {
      const f = stillsFrame(skin.meta, skin.time(), skin.laps);
      show(to, f.to);
      return to;
    },
    dispose() {
      from.dispose();
      to.dispose();
    },
  };
}

const ease = (p) => p * p * (3 - 2 * p);

export function Globe() {
  const spin = useRef();
  const mat = useRef();
  const blank = useMemo(placeholder, []);
  const uniforms = useMemo(
    () => ({
      uMap2: { value: blank },
      uMix: { value: 0 },
      uDecodeA: { value: 0 },
      uDecodeB: { value: 0 },
      uDimA: { value: 0 },
      uDimB: { value: 0 },
    }),
    [blank],
  );
  const layers = useMemo(() => new Map(), []); // skin -> layer

  const onBeforeCompile = useMemo(
    () => (shader) => {
      Object.assign(shader.uniforms, uniforms);
      shader.vertexShader = shader.vertexShader
        .replace(shadeVertex[0], shadeVertex.join('\n'))
        .replace(shadeNormal[0], shadeNormal.join('\n'));
      shader.fragmentShader = shader.fragmentShader
        .replace('#include <common>', `#include <common>\n${shadePars}`)
        .replace('#include <map_fragment>', shadeFragment);
    },
    [uniforms],
  );

  useEffect(
    () => () => {
      for (const l of layers.values()) l.dispose();
      layers.clear();
      blank.dispose();
    },
    [layers, blank],
  );

  const layerOf = (skin) => {
    let l = layers.get(skin);
    if (!l) {
      l = skin.kind === 'stills' ? stillsLayer(skin) : videoLayer(skin);
      layers.set(skin, l);
    }
    return l;
  };

  useFrame(() => {
    spin.current.rotation.y = live.rotation;
    for (const [skin, l] of layers) {
      if (skin.disposed) {
        l.dispose();
        layers.delete(skin);
      }
    }
    const skin = controller.track?.skin;
    if (!skin || skin.disposed) return;
    let a;
    let b;
    let mix;
    const swap = controller.swap;
    if (swap && !swap.from.disposed) {
      a = layerOf(swap.from).still();
      b = layerOf(skin).still();
      mix = ease(Math.min(1, (performance.now() - swap.t0) / swap.dur));
    } else {
      ({ a, b, mix } = layerOf(skin).frame());
    }
    mat.current.map = a;
    uniforms.uMap2.value = b;
    uniforms.uMix.value = mix;
    uniforms.uDecodeA.value = a.userData.decode || 0;
    uniforms.uDecodeB.value = b.userData.decode || 0;
    uniforms.uDimA.value = a.userData.dim || 0;
    uniforms.uDimB.value = b.userData.dim || 0;
  });

  return (
    <mesh ref={spin}>
      <sphereGeometry args={[1, 160, 80]} />
      <meshBasicMaterial ref={mat} map={blank} toneMapped={false} onBeforeCompile={onBeforeCompile} />
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
