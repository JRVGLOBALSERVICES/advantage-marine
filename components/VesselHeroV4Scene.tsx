"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, AdaptiveDpr, ContactShadows } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { scrollState, motionState, sceneState } from "@/lib/scroll";

/* ════════════════════════════════════════════════════════════════
   VESSEL HERO v4 SCENE — extras-driven explode + live ocean (2026-06-05).

   The Blender-authored v4 research vessel (advantage-vessel-v4.glb, 103 named
   meshes) carries its explode rig NOT as baked keyframe clips (v3's approach)
   but as a per-part `explode` offset vector in each node's glTF `extras`.
   GLTFLoader copies those onto `mesh.userData.explode`, so we lerp every part
   in JS by one scroll-driven amount — lean GLB, per-part scrub control.

   AXIS NOTE: the exporter converts geometry Blender-Z-up → glTF-Y-up, but it
   does NOT touch custom-property extras. So `explode` is still in Blender axes
   (Z-up). We remap (bx,by,bz) → (bx, bz, −by) before adding to the already-
   converted three-space base position. Without this the mast explodes DOWN.

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
}: {
  onMeasured: (b: Box) => void;
  oceanMat: React.MutableRefObject<THREE.ShaderMaterial | null>;
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
    const collected: Part[] = [];
    const bbox = new THREE.Box3();
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      m.castShadow = true;
      m.receiveShadow = true;
      const mat = m.material as MeshStandardMaterial;
      if (mat && "envMapIntensity" in mat) mat.envMapIntensity = 1.0;

      const raw = (m.userData?.explode ?? null) as number[] | null;
      // Blender Z-up extras → three Y-up: (bx,by,bz) → (bx, bz, −by)
      const offset = raw
        ? new THREE.Vector3(raw[0], raw[2], -raw[1])
        : new THREE.Vector3();
      collected.push({ mesh: m, base: m.position.clone(), offset });
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

  useFrame((state, delta) => {
    const target = motionState.reduced ? 0.5 : clamp01(progressNow());
    damped.current += (target - damped.current) * (motionState.reduced ? 1 : 0.1);
    const p = damped.current;

    // amount: 1 = fully exploded (enter), 0 = assembled (scroll-end)
    const amount = motionState.reduced ? 0 : 1 - p;
    for (const part of parts.current) {
      part.mesh.position.set(
        part.base.x + part.offset.x * amount,
        part.base.y + part.offset.y * amount,
        part.base.z + part.offset.z * amount,
      );
    }

    // ocean surfaces only on the assembled end, dissolves with the explode
    if (oceanMat.current) {
      oceanMat.current.uniforms.uTime.value = state.clock.elapsedTime;
      const o = motionState.reduced ? 0.85 : smooth(clamp01((p - 0.5) / 0.42));
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

    const baseR = maxDim * lerp(1.15, 1.5, spread);
    const halfV = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 360);
    const tanH = Math.max(Math.tan(halfV) * aspect, 1e-3);
    const horizFitR = (maxDim * 0.5 * lerp(1.12, 1.45, spread)) / tanH;
    const R = Math.max(baseR, horizFitR);
    const camY = c.y + maxDim * lerp(0.16, 0.32, spread);

    // portrait pan-down: reserve the lower frame for the copy block
    const portrait = clamp01((1 - aspect) / 0.5);
    const lift = maxDim * 0.22 * portrait;
    camPos.current.set(c.x + DIR.x * R, camY - lift, c.z + DIR.z * R);
    camTgt.current.set(c.x, cy - lift, c.z);
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
}: {
  onContextLost?: () => void;
  active?: boolean;
  /* pin assembly progress for a static showcase (null = scroll-driven hero) */
  hold?: number | null;
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
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
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
        {/* warm studio key + cooler marine fill */}
        <hemisphereLight args={["#fff6e6", "#cdbb9a", 0.95]} />
        <directionalLight
          position={[12, 20, 10]}
          intensity={1.7}
          color="#fff4e2"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-10, 6, -8]} intensity={0.55} color="#bcd6cf" />
        <Environment preset="city" environmentIntensity={0.85} />

        <Vessel
          oceanMat={oceanMat}
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
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL, true);
