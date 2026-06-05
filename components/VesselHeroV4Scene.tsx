"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, AdaptiveDpr, ContactShadows } from "@react-three/drei";
import { EffectComposer, N8AO, Bloom, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { scrollState, motionState, sceneState } from "@/lib/scroll";
import { computeExplodeOffset } from "@/lib/vesselExplode";

/* ════════════════════════════════════════════════════════════════
   VESSEL HERO v4 SCENE — extras-driven explode + live ocean (2026-06-05).

   The Blender-authored v4 research vessel (advantage-vessel-v4.glb, 104 named
   meshes) carries NO explode extras — the export dropped them, so the earlier
   extras-driven read (`mesh.userData.explode`) was null for every part and the
   split was a silent no-op. We instead derive each part's offset GEOMETRICALLY
   at measure time from its position relative to the vessel centroid (see
   lib/vesselExplode.ts — radial blow-apart, vertically amplified), then lerp
   every part in JS by one scroll-driven amount. Lean GLB, no Blender re-author,
   one source of truth shared with the contact constellation.

   Narrative matches the shipped home copy (VesselHero BEATS): enter on the
   exploded field of parts (progress 0 → amount 1), scroll the vessel TOGETHER
   (progress 1 → amount 0). The OCEAN rides the assembled end — it surfaces as
   the hull comes together and dissolves back to studio void as the parts pull
   apart. A live Gerstner plane (real swell + a cheap planar tint of the hull),
   never a baked flat plane, synced through the same scroll bridge as Lenis.

   The single baked `Turntable.001` clip is left unplayed; rotation rides the
   WRAPPING group (like v3) so bbox framing stays stable while the root spins.
   ════════════════════════════════════════════════════════════════ */

const MODEL_URL = "/models/advantage-vessel-v4.glb";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (t: number) => t * t * (3 - 2 * t);

/* warm sailcloth stage — matches --color-paper so the hero reads as one
   continuous cream surface, ship floating in it */
const STAGE_BG = "#F4EBD9";

/* hero composition — pull the vessel back a touch (reads smaller) and slide it
   into the right third of the frame on desktop, leaving the left clear for the
   copy block. Gated out on portrait so mobile keeps the ship centred. These are
   the HOME defaults; the contact constellation overrides composeRight→0 (the
   node cards flank both sides, so the vessel must stay centred). */
const FRAME_SCALE = 1.18; // >1 = camera further back, vessel reads smaller
const COMPOSE_RIGHT = 0.24; // fraction of maxDim to slide the vessel right-of-centre

/* real studio HDRI (Poly Haven CC0, 1k) — replaces drei's low-res "city"
   preset. The mushy preset reflections were the #1 reason the hull read as a
   clay/cartoon render; a real environment gives sharp specular streaks. */
const HDRI_URL = "/hdri/studio_small_09_1k.hdr";

/* LIVERY PALETTE (Rj 2026-06-05) — ROOT-CAUSE FIX for "the colour doesn't make
   sense". The GLB bakes near-black albedos (hull #02060e, "green" funnel #072813,
   glass #03050a). On the cream stage those read as muddy black blobs, and the
   previous matcap pass only darkened them further while DISCARDING the scene's
   HDRI + lights (a matcap ignores envMap and scene lights entirely — it reads
   only its own texture, so the N8AO/Bloom/HDRI rig below did nothing).

   We override each NAMED GLB material with a brand-coherent colour — neutral
   charcoal-navy hull, clean white superstructure, a SINGLE teal funnel pop
   matching --color-accent (#30837b), silver waterline band — as a
   MeshPhysicalMaterial, so the real HDRI reflections, clearcoat depth and N8AO
   crevice darkening all do their job. Keyed by GLB material name; cached per
   source material (104 meshes share 8 materials). */
type Livery = { color: string; metalness: number; roughness: number; clearcoat: number; clearcoatRoughness: number };
const LIVERY: Record<string, Livery> = {
  "MAT-v4-hull":              { color: "#1c2832", metalness: 0.0,  roughness: 0.34, clearcoat: 0.7,  clearcoatRoughness: 0.22 },
  "MAT-v4-hull-silver":       { color: "#9aa3ad", metalness: 0.9,  roughness: 0.30, clearcoat: 0.2,  clearcoatRoughness: 0.30 },
  "MAT-v4-white":             { color: "#eef0f2", metalness: 0.0,  roughness: 0.45, clearcoat: 0.45, clearcoatRoughness: 0.30 },
  "MAT-superstructure-white": { color: "#f1f1f3", metalness: 0.0,  roughness: 0.45, clearcoat: 0.45, clearcoatRoughness: 0.30 },
  "MAT-v4-deck":              { color: "#383b40", metalness: 0.0,  roughness: 0.72, clearcoat: 0.0,  clearcoatRoughness: 0.50 },
  "MAT-v4-steel":             { color: "#6f7479", metalness: 0.85, roughness: 0.35, clearcoat: 0.0,  clearcoatRoughness: 0.30 },
  "MAT-v4-livery-green":      { color: "#30837b", metalness: 0.0,  roughness: 0.40, clearcoat: 0.6,  clearcoatRoughness: 0.25 },
  "MAT-v4-glass":             { color: "#0b1417", metalness: 0.0,  roughness: 0.05, clearcoat: 0.9,  clearcoatRoughness: 0.10 },
};
const DEFAULT_LIVERY: Livery = { color: "#8a9099", metalness: 0.3, roughness: 0.5, clearcoat: 0.3, clearcoatRoughness: 0.3 };

const matCache = new Map<string, THREE.MeshPhysicalMaterial>();
function toLivery(src: MeshStandardMaterial): THREE.MeshPhysicalMaterial {
  const hit = matCache.get(src.uuid);
  if (hit) return hit;
  const spec = LIVERY[src.name] ?? DEFAULT_LIVERY;
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(spec.color),
    metalness: spec.metalness,
    roughness: spec.roughness,
    clearcoat: spec.clearcoat,
    clearcoatRoughness: spec.clearcoatRoughness,
    envMapIntensity: 1.1,
    map: src.map ?? undefined,
    normalMap: src.normalMap ?? undefined,
    transparent: src.transparent,
    opacity: src.opacity,
    side: src.side,
  });
  m.name = src.name;
  matCache.set(src.uuid, m);
  return m;
}
function isStd(m: THREE.Material | null | undefined): m is MeshStandardMaterial {
  return !!m && (m as { isMeshStandardMaterial?: boolean }).isMeshStandardMaterial === true;
}

/* HOLD override — when mounted as a static showcase (no tall sticky section
   driving scrollState) a non-null hold pins the assembly. Module-scoped
   because only one scene mounts per page. */
let holdProgress: number | null = null;
const progressNow = () => holdProgress ?? scrollState.progress;

type Box = {
  c: THREE.Vector3;
  maxDim: number;
  cy: number;
  floorY: number;
  sx: number;
};

type Part = { mesh: Mesh; base: THREE.Vector3; offset: THREE.Vector3 };

/* ───────────────────────── OCEAN ─────────────────────────
   Gerstner-summed plane. Three travelling waves give a believable swell
   without a physics sim; a shallow fresnel + a planar hull-navy tint read as
   reflection at grazing angles. Opacity is driven from the scene (assembled
   end only) via a uniform we poke each frame. */
function makeOceanMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uDeep: { value: new THREE.Color("#10303a") }, // marine teal-navy trough
      uShallow: { value: new THREE.Color("#3c6f78") }, // lifted crest
      uSky: { value: new THREE.Color("#e9f1ee") }, // grazing-angle sheen
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying float vCrest;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;

      // one Gerstner wave: returns displaced offset, accumulates normal basis
      vec3 gerstner(vec2 pos, vec2 dir, float steep, float wl, float spd, inout vec3 nrm){
        float k = 6.2831853 / wl;
        float c = sqrt(9.8 / k);
        vec2 d = normalize(dir);
        float f = k * (dot(d, pos) - c * spd * uTime);
        float a = steep / k;
        float cf = cos(f), sf = sin(f);
        nrm += vec3(-d.x * a * k * cf, -steep * sf, -d.y * a * k * cf);
        return vec3(d.x * a * cf, a * sf, d.y * a * cf);
      }

      void main(){
        vec3 p = position;
        vec2 g = vec2(p.x, p.z);
        vec3 nrm = vec3(0.0, 1.0, 0.0);
        vec3 disp = vec3(0.0);
        disp += gerstner(g, vec2(1.0, 0.25), 0.16, 7.0, 0.9, nrm);
        disp += gerstner(g, vec2(-0.6, 1.0), 0.10, 3.4, 1.1, nrm);
        disp += gerstner(g, vec2(0.3, -0.8), 0.06, 1.7, 1.5, nrm);
        p += disp;
        vCrest = clamp(disp.y * 2.2 + 0.5, 0.0, 1.0);
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vWorldPos = wp.xyz;
        vWorldNormal = normalize(mat3(modelMatrix) * normalize(nrm));
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uDeep, uShallow, uSky;
      uniform float uOpacity;
      varying float vCrest;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPos;

      void main(){
        vec3 V = normalize(cameraPosition - vWorldPos);
        float fres = pow(1.0 - clamp(dot(normalize(vWorldNormal), V), 0.0, 1.0), 3.0);
        vec3 body = mix(uDeep, uShallow, vCrest);
        vec3 col = mix(body, uSky, fres * 0.6);
        // radial falloff so the plane melts into the cream stage, no hard edge
        float r = length(vWorldPos.xz);
        float edge = 1.0 - smoothstep(34.0, 60.0, r);
        gl_FragColor = vec4(col, uOpacity * edge * (0.82 + 0.18 * vCrest));
      }
    `,
  });
}

function Ocean({
  y,
  matRef,
}: {
  y: number;
  matRef: React.MutableRefObject<THREE.ShaderMaterial | null>;
}) {
  const mat = useMemo(() => makeOceanMaterial(), []);
  useEffect(() => {
    matRef.current = mat;
    return () => {
      mat.dispose();
    };
  }, [mat, matRef]);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y, 0]} renderOrder={-1}>
      <planeGeometry args={[140, 140, 180, 180]} />
      <primitive object={mat} attach="material" />
    </mesh>
  );
}

function Vessel({
  onMeasured,
  oceanMat,
  frameScale,
  composeRight,
}: {
  onMeasured: (b: Box) => void;
  oceanMat: React.MutableRefObject<THREE.ShaderMaterial | null>;
  frameScale: number;
  composeRight: number;
}) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL, true) as unknown as { scene: THREE.Group };

  /* Capture base (assembled) positions + measure the bbox in useMemo, which
     runs DURING render — before the first useFrame tick. A frame tick firing
     first (top of page, amount=1) would shove parts to exploded positions and
     poison `base`, putting the real assembled centroid off-frame. Memo avoids
     that ordering race entirely. */
  const measured = useMemo(() => {
    scene.updateMatrixWorld(true);
    // PASS 1 — collect meshes + each mesh's own bbox centre, and expand the
    // whole-vessel bbox. We need the centroid + maxDim BEFORE we can compute
    // any part's geometric explode offset, so offsets wait for pass 2.
    type Raw = { mesh: Mesh; base: THREE.Vector3; center: THREE.Vector3 };
    const raw: Raw[] = [];
    const bbox = new THREE.Box3();
    const mbox = new THREE.Box3();
    const mc = new THREE.Vector3();
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      // baked near-black standard paint → brand-livery physical material
      // (real colour + HDRI reflections + clearcoat). Multi-material defensive.
      if (Array.isArray(m.material)) {
        m.material = m.material.map((s) => (isStd(s) ? toLivery(s) : s));
      } else if (isStd(m.material)) {
        m.material = toLivery(m.material);
      }

      mbox.setFromObject(m); // this part's bounds, in scene space
      mbox.getCenter(mc);
      raw.push({ mesh: m, base: m.position.clone(), center: mc.clone() });
      bbox.expandByObject(m); // measure assembled hull, per-mesh (v3 pattern)
    });

    const c = new THREE.Vector3();
    bbox.getCenter(c);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z);
    const b: Box =
      Number.isFinite(maxDim) && maxDim > 0.01
        ? {
            c,
            maxDim,
            cy: (bbox.max.y + bbox.min.y) / 2,
            floorY: bbox.min.y - 0.02,
            sx: size.x,
          }
        : { c: new THREE.Vector3(), maxDim: 14, cy: 2, floorY: -2.5, sx: 14 };

    // PASS 2 — now that the centroid + maxDim are known, derive the geometric
    // explode offset per part (radial blow-apart, vertically amplified).
    const collected: Part[] = raw.map(({ mesh, base, center }) => ({
      mesh,
      base,
      offset: computeExplodeOffset(center, b.c, b.maxDim),
    }));
    return { parts: collected, box: b };
  }, [scene]);

  const parts = useRef<Part[]>(measured.parts);
  const box = useRef<Box>(measured.box);
  parts.current = measured.parts;
  box.current = measured.box;

  useEffect(() => {
    onMeasured(measured.box);
    if (typeof window !== "undefined") {
      (window as unknown as { __amBox?: unknown }).__amBox = {
        c: measured.box.c.toArray(),
        maxDim: measured.box.maxDim,
        floorY: measured.box.floorY,
        parts: measured.parts.length,
      };
      window.dispatchEvent(new Event("am:scene-ready"));
    }
  }, [measured, onMeasured]);

  const camPos = useRef(new THREE.Vector3());
  const camTgt = useRef(new THREE.Vector3());
  const damped = useRef(0);
  const { camera, size } = useThree();
  const DIR = useMemo(() => new THREE.Vector3(0.62, 0.4, 1.0).normalize(), []);
  // camera screen-right axis = cross(worldUp, viewDir); shift along -RIGHT to push the ship right-of-frame
  const RIGHT = useMemo(
    () => new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), DIR).normalize(),
    [DIR],
  );

  useFrame((state, delta) => {
    const target = motionState.reduced ? 0.5 : clamp01(progressNow());
    damped.current += (target - damped.current) * (motionState.reduced ? 1 : 0.1);
    const p = damped.current;

    // three-phase scrub: COMPLETE → SPLIT → REJOIN.
    // amount: 0 = assembled, 1 = fully exploded. Triangle over progress so the
    // vessel enters whole (p=0), blows apart at mid-scroll (p=0.5), and comes
    // back together at the end (p=1). smooth() eases each leg so the parts don't
    // snap at the turnaround.
    const amount = motionState.reduced ? 0 : smooth(1 - Math.abs(2 * p - 1));
    for (const part of parts.current) {
      part.mesh.position.set(
        part.base.x + part.offset.x * amount,
        part.base.y + part.offset.y * amount,
        part.base.z + part.offset.z * amount,
      );
    }

    // ocean rides the ASSEMBLED state (both ends of the triangle) and dissolves
    // to studio void while the vessel is split apart — so the ship is "on water,
    // taken apart in the air, set back on water". Tied to (1 - amount), not raw
    // progress, so it tracks both the complete and rejoined beats.
    if (oceanMat.current) {
      oceanMat.current.uniforms.uTime.value = state.clock.elapsedTime;
      const o = motionState.reduced ? 0.85 : smooth(clamp01(1 - amount * 1.25));
      oceanMat.current.uniforms.uOpacity.value = o;
    }

    // continuous slow turntable on the WRAPPING group (composes with the local
    // explode; keeps bbox framing stable vs. spinning the measured root)
    if (group.current) {
      group.current.rotation.y = motionState.reduced
        ? 0.5
        : 0.5 + state.clock.elapsedTime * 0.05;
    }

    const { c, maxDim, cy } = box.current;
    const aspect = size.width / Math.max(size.height, 1);
    const spread = motionState.reduced ? 0 : amount; // wider frame when scattered
    const portrait = clamp01((1 - aspect) / 0.5);

    const baseR = maxDim * lerp(1.15, 1.5, spread);
    const halfV = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 360);
    const tanH = Math.max(Math.tan(halfV) * aspect, 1e-3);
    // The vessel's long axis is maxDim. On portrait, fitting that full length
    // into the narrow width shoves the camera far back and the ship reads tiny
    // in a cream void. Tighten the horizontal fit on portrait so the hero fills
    // the frame and the bow/stern crop gently off-edge (more dramatic, not a bug).
    const fitTighten = lerp(1.0, 0.66, portrait);
    const horizFitR = (maxDim * 0.5 * lerp(1.12, 1.45, spread) * fitTighten) / tanH;
    const R = Math.max(baseR, horizFitR) * frameScale;
    const camY = c.y + maxDim * lerp(0.16, 0.32, spread);

    // portrait pan-down: reserve a little lower frame for the copy block — but
    // a large lift was the source of the dead space above the ship, so keep it small.
    const lift = maxDim * 0.1 * portrait;
    // slide the vessel into the right third on desktop (shift cam + target along
    // −RIGHT so the subject moves right of centre); fade the shift out on portrait.
    const composeMag = composeRight * maxDim * (1 - portrait);
    const cx = c.x - RIGHT.x * composeMag;
    const cz = c.z - RIGHT.z * composeMag;
    camPos.current.set(cx + DIR.x * R, camY - lift, cz + DIR.z * R);
    camTgt.current.set(cx, cy - lift, cz);
    camera.position.lerp(camPos.current, motionState.reduced ? 1 : 0.12);
    camera.lookAt(camTgt.current);
    if (!motionState.reduced) state.invalidate();
    void delta;
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function VesselHeroV4Scene({
  onContextLost,
  active = true,
  hold = null,
  frameScale = FRAME_SCALE,
  composeRight = COMPOSE_RIGHT,
}: {
  onContextLost?: () => void;
  active?: boolean;
  /* pin assembly progress for a static showcase (null = scroll-driven hero) */
  hold?: number | null;
  /* camera pull-back (>1 = vessel reads smaller). home default 1.18 */
  frameScale?: number;
  /* slide vessel right-of-centre as a fraction of maxDim. home 0.24; the
     contact constellation passes 0 so the ship stays centred between its
     flanking node cards. */
  composeRight?: number;
}) {
  const [floorY, setFloorY] = useState(-2.48);
  const [sx, setSx] = useState(14);
  const [waterY, setWaterY] = useState(-2.3);
  const oceanMat = useRef<THREE.ShaderMaterial | null>(null);

  useEffect(() => {
    holdProgress = hold;
    return () => {
      holdProgress = null;
    };
  }, [hold]);

  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [11, 5, 16], fov: 38, near: 0.1, far: 600 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      onCreated={({ gl, invalidate }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        // tone mapping is owned by the composer's ToneMapping effect (must run
        // LAST, after Bloom in linear HDR space) — disable it on the renderer so
        // it isn't applied twice.
        gl.toneMapping = THREE.NoToneMapping;
        sceneState.invalidate = invalidate;
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onContextLost?.();
          },
          { once: true },
        );
      }}
    >
      <color attach="background" args={[STAGE_BG]} />
      <fog attach="fog" args={[STAGE_BG, 42, 120]} />

      <Suspense fallback={null}>
        {/* Lower hemisphere fill so the HDRI + a crisp key carry the form (the
            old even wash flattened it). Hard key = the raking spotlight that
            sells the metal; a cool back-rim separates the hull from the cream. */}
        <hemisphereLight args={["#fff6e6", "#cdbb9a", 0.55]} />
        <directionalLight
          position={[14, 22, 11]}
          intensity={2.4}
          color="#fff4e2"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-12, 7, -9]} intensity={0.4} color="#bcd6cf" />
        {/* back rim for edge definition against the bright stage */}
        <directionalLight position={[-6, 9, -14]} intensity={1.1} color="#dfeef0" />
        {/* real studio HDRI for sharp reflections; not shown as background */}
        <Environment files={HDRI_URL} environmentIntensity={1.0} resolution={512} />

        <Vessel
          oceanMat={oceanMat}
          frameScale={frameScale}
          composeRight={composeRight}
          onMeasured={(b) => {
            setFloorY(b.floorY);
            setSx(b.sx);
            // waterline sits just above the hull bottom (silver below, navy above)
            setWaterY(b.floorY + b.maxDim * 0.06);
          }}
        />

        <Ocean y={waterY} matRef={oceanMat} />

        <ContactShadows
          position={[0, floorY, 0]}
          scale={Math.max(sx * 1.6, 30)}
          far={26}
          blur={2.8}
          opacity={0.32}
          color="#6f6450"
          resolution={1024}
        />
        <AdaptiveDpr pixelated />

        {/* Post chain — the grounding + polish that was missing on V4.
            N8AO: contact/crevice darkening so parts sit in space instead of
            floating (the biggest "is it real" lever). Bloom: only true HDR
            highlights (threshold 1.0) so the metal spec glints, copy stays crisp.
            ToneMapping LAST (skill §2) — ACES in linear HDR after Bloom. */}
        <EffectComposer multisampling={4}>
          <N8AO halfRes aoRadius={2.0} intensity={2.0} distanceFalloff={1.0} />
          <Bloom intensity={0.4} luminanceThreshold={1.0} luminanceSmoothing={0.2} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL, true);
