import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { controller } from '../state/controller.js';
import { live } from '../state/live.js';
import { stillsFrame } from '../media/skins.js';
import { TRACK_VIEW } from '../state/tracks.js';
import { GLOBE_Y } from './layout.js';

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

/** Porthole skin (sea level): the globe wears nothing; the video is shown by <Porthole />. */
function emptyLayer(blank) {
  return { frame: () => ({ a: blank, b: blank, mix: 0 }), still: () => blank, dispose() {} };
}

const isPorthole = (skin) => Boolean(skin && !skin.disposed && skin.meta.texture?.kind === 'porthole');

const ease = (p) => p * p * (3 - 2 * p);

/**
 * How much the porthole shows (0..1) and which skin it shows: fully while a porthole record plays,
 * fading in or out with the globe's crossfade when a record changes to or from one.
 */
function portholeState() {
  const skin = controller.track?.skin;
  const swap = controller.swap;
  if (swap && !swap.from.disposed) {
    const m = ease(Math.min(1, (performance.now() - swap.t0) / swap.dur));
    if (isPorthole(skin)) return { show: m, skin, swapping: true };
    if (isPorthole(swap.from)) return { show: 1 - m, skin: swap.from, swapping: true };
    return { show: 0, skin: null, swapping: true };
  }
  return isPorthole(skin) ? { show: 1, skin, swapping: false } : { show: 0, skin: null, swapping: false };
}

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
      l = isPorthole(skin) ? emptyLayer(blank) : skin.kind === 'stills' ? stillsLayer(skin) : videoLayer(skin);
      layers.set(skin, l);
    }
    return l;
  };

  useFrame(() => {
    spin.current.rotation.y = live.rotation;
    // A porthole record hides the globe once its porthole is fully in (direction 5.4).
    const p = portholeState();
    spin.current.visible = !(p.show >= 1 && !p.swapping);
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

/**
 * Sea level (direction 5.4): NASA's square video is a round porthole filling the frame, so it is
 * drawn on a disc the apparent size of the globe, where the globe was, with a thin chrome rim. The
 * halo and the platter stay around it; the tonearm rests on its glass. While a record changes it
 * fades over the darkening globe.
 */
export function Porthole() {
  const group = useRef();
  const disc = useRef();
  const rim = useRef();
  const { camera } = useThree();
  const textures = useMemo(() => new Map(), []); // skin -> { video, poster }

  useEffect(
    () => () => {
      for (const t of textures.values()) {
        t.video.dispose();
        t.poster.dispose();
      }
      textures.clear();
    },
    [textures],
  );

  useFrame(() => {
    for (const [skin, t] of textures) {
      if (skin.disposed) {
        t.video.dispose();
        t.poster.dispose();
        textures.delete(skin);
      }
    }
    const p = portholeState();
    const on = p.show > 0.001 && p.skin;
    group.current.visible = Boolean(on);
    if (!on) return;
    let t = textures.get(p.skin);
    if (!t) {
      const video = new THREE.VideoTexture(p.skin.el);
      video.colorSpace = THREE.SRGBColorSpace;
      const poster = new THREE.TextureLoader().load(p.skin.poster);
      poster.colorSpace = THREE.SRGBColorSpace;
      t = { video, poster, started: false };
      textures.set(p.skin, t);
    }
    const el = p.skin.el;
    if (!t.started && !el.paused && el.readyState >= 2 && el.currentTime > 0) t.started = true;
    const mat = disc.current.material;
    const map = t.started ? t.video : t.poster;
    if (mat.map !== map) {
      mat.map = map;
      mat.needsUpdate = true;
    }
    mat.opacity = p.show;
    rim.current.material.opacity = p.show;
    // Over the darkening globe while fading; behind the tonearm once it stands alone.
    mat.depthTest = !p.swapping;
    rim.current.material.depthTest = !p.swapping;
    // Same apparent radius as the globe: a sphere of radius 1 seen from distance d.
    const d = Math.hypot(camera.position.y - GLOBE_Y, camera.position.z);
    group.current.scale.setScalar(d > 1.01 ? d / Math.sqrt(d * d - 1) : 1);
  });

  return (
    <group ref={group} position={[0, GLOBE_Y, 0]} visible={false}>
      <mesh ref={disc} renderOrder={2}>
        <circleGeometry args={[1, 160]} />
        <meshBasicMaterial transparent toneMapped={false} />
      </mesh>
      <mesh ref={rim} renderOrder={3}>
        <torusGeometry args={[1.004, 0.016, 16, 200]} />
        <meshStandardMaterial color="#dfe3e8" metalness={1} roughness={0.2} transparent />
      </mesh>
    </group>
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
