"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  Environment,
  AdaptiveDpr,
  ContactShadows,
  Html,
  Line,
} from "@react-three/drei";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Group, Mesh, MeshStandardMaterial, Object3D } from "three";
import { scrollState, motionState, sceneState } from "@/lib/scroll";

/* ════════════════════════════════════════════════════════════════
   RIG HERO — CROSSING THE WATERLINE (reel-tier redesign, 2026-06).

   Concept that won the tournament (81/100, "Survey Card" spined onto
   the "go-subsea" motion): the page literally DESCENDS into Advantage
   Marine's worksite. A recognizable assembled jack-up on warm cream,
   then the camera dives THROUGH the waterline; below it ONLY the
   genuinely submerged steel — the four legs + spud-cans — separates
   into a readable in-water NDT inspection diagram, while a world-Y
   shader band cools the submerged steel to teal depth-scan. The hull
   and derrick NEVER move (honest: nothing above the waterline detaches).
   The explosion becomes the *service* — what AM dives down to find.

     0.00–0.30  assembled, recognizable; slow descent toward the surface
     0.30–0.42  THE CROSSING — camera punches below the waterline
     0.42–0.58  submerged teardown: legs splay, spud-cans drop to corners
     0.58–0.78  annotated subsea survey diagram (leader-line callouts)
     0.78–1.00  active scan sweep + sonar; ease to a held half-exploded hero

   Scale-honest: the GLB is large (assembled framing ~42/27/48). The
   waterline / top / bottom are MEASURED on load and the dive is
   expressed relative to them — no hard-coded unit-scale numbers.

   Brand (AM design.md): dark gunmetal on warm sailcloth-cream, ONE
   teal accent, all luminous accents on/around the model. Bloom catches
   ONLY raw-HDR emissive (>1.0, toneMapped=false): the scan band + sonar.
   ════════════════════════════════════════════════════════════════ */

const MODEL_URL = "/models/jackup-rig.glb";

/* corner unit-directions (x,z) matched to authored spud-can layout */
const CORNER: Record<string, [number, number]> = {
  A: [-1, 1],
  B: [1, 1],
  C: [-1, -1],
  D: [1, -1],
};

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* In-water NDT findings — real survey language, grounded in AM's scope
   (cathodic protection, UT wall-thickness, scour, weld NDT). Anchored to the
   4 spud-cans on desktop; suppressed on a narrow frame (labels would overlap). */
const FINDINGS: Record<string, { code: string; spec: string }> = {
  A: { code: "SpudCan_A", spec: "scour survey · CLEAN" },
  B: { code: "SpudCan_B", spec: "CP anode −0.92V · OK" },
  C: { code: "SpudCan_C", spec: "UT wall 18.4mm · PASS" },
  D: { code: "SpudCan_D", spec: "weld NDT · NO INDIC." },
};

type Part = {
  node: Object3D;
  base: THREE.Vector3;
  offset: THREE.Vector3;
  corner?: string; // set for spud-cans → callout anchor
};

/* measured model anchors (world Y), filled on scene-ready */
type Anchors = { top: number; bot: number; water: number; span: number; foot: number };

function Rig({ onMeasured }: { onMeasured: (a: Anchors) => void }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL, true);
  const { actions, names } = useAnimations(animations, group);
  const parts = useRef<Part[]>([]);
  const [ready, setReady] = useState(false);
  const anchors = useRef<Anchors>({ top: 26, bot: 0, water: 10, span: 26, foot: 14 });

  // world-Y uniforms shared by every patched steel material
  const uWaterY = useRef({ value: 10 });
  const uTime = useRef({ value: 0 });
  const uSubsea = useRef({ value: new THREE.Color("#234b47").convertSRGBToLinear() });

  const sonarNames = useMemo(
    () => names.filter((n) => n.startsWith("FX-Sonar")),
    [names],
  );
  const sonarDur = useMemo(
    () =>
      animations
        .filter((c) => c.name.startsWith("FX-Sonar"))
        .reduce((m, c) => Math.max(m, c.duration), 0) || 1,
    [animations],
  );

  useEffect(() => {
    // Only FX-Sonar ring clips ride the mixer (scrubbed in the tail). GEO
    // assembly clips stay OFF — every part holds its authored assembled pose
    // and we drive the partial submerged teardown ourselves.
    sonarNames.forEach((n) => {
      const a = actions[n];
      if (a) {
        a.reset().play();
        a.paused = true;
      }
    });
    return () => sonarNames.forEach((n) => actions[n]?.stop());
  }, [actions, sonarNames]);

  useEffect(() => {
    // 1. measure the model so the dive + waterline are scale-honest
    const geoBox = new THREE.Box3();
    let waterNode: Object3D | null = null;
    scene.traverse((o) => {
      if (o.name.startsWith("GEO-") && (o as Mesh).isMesh) {
        geoBox.expandByObject(o);
      }
      if (o.name.startsWith("FX-Waterline")) waterNode = o;
    });
    const max = geoBox.max;
    const min = geoBox.min;
    const top = isFinite(max.y) ? max.y : 26;
    const bot = isFinite(min.y) ? min.y : 0;
    const span = Math.max(1, top - bot);
    // waterline: prefer the authored FX-Waterline Y, else 42% up from seabed
    let water = bot + span * 0.42;
    if (waterNode) {
      const wp = new THREE.Vector3();
      (waterNode as Object3D).getWorldPosition(wp);
      if (isFinite(wp.y)) water = wp.y;
    }
    const foot = Math.max(Math.abs(max.x), Math.abs(max.z), span * 0.5);
    anchors.current = { top, bot, water, span, foot };
    uWaterY.current.value = water;
    onMeasured(anchors.current);

    // 2. materials + submerged explode plan (one traversal)
    const glow = (m: Mesh, hex: string, intensity: number) => {
      const mat = (m.material as MeshStandardMaterial).clone();
      mat.emissive = new THREE.Color(hex);
      mat.emissiveIntensity = intensity;
      mat.toneMapped = false;
      mat.transparent = true;
      m.material = mat;
    };
    // shared world-Y section patch: below the waterline the steel albedo
    // crushes toward deep teal with faint depth bands (NON-HDR — no bloom
    // conflict; bloom stays on the dedicated FX meshes only).
    const patchSteel = (m: Mesh, base: string, rough: number) => {
      const mat = (m.material as MeshStandardMaterial).clone();
      mat.color = new THREE.Color(base);
      mat.metalness = 0.9;
      mat.roughness = rough;
      mat.onBeforeCompile = (shader) => {
        shader.uniforms.uWaterY = uWaterY.current;
        shader.uniforms.uTime = uTime.current;
        shader.uniforms.uSubsea = uSubsea.current;
        shader.vertexShader = shader.vertexShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying vec3 vWPosAM;",
          )
          .replace(
            "#include <begin_vertex>",
            "#include <begin_vertex>\nvWPosAM = (modelMatrix * vec4(transformed, 1.0)).xyz;",
          );
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nvarying vec3 vWPosAM;\nuniform float uWaterY;\nuniform float uTime;\nuniform vec3 uSubsea;",
          )
          .replace(
            "#include <color_fragment>",
            `#include <color_fragment>
             float subAM = smoothstep(uWaterY + 1.2, uWaterY - 1.2, vWPosAM.y);
             float bandAM = smoothstep(0.62, 0.98, sin(vWPosAM.y * 1.3 - uTime * 0.6) * 0.5 + 0.5);
             vec3 deepAM = mix(uSubsea, uSubsea + vec3(0.0, 0.10, 0.09), bandAM);
             diffuseColor.rgb = mix(diffuseColor.rgb, deepAM, subAM * 0.82);`,
          );
      };
      mat.needsUpdate = true;
      m.material = mat;
      m.castShadow = true;
    };

    const collected: Part[] = [];
    scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        if (o.name.startsWith("FX-Sonar")) glow(m, "#5cf0d8", 3.2);
        else if (o.name.startsWith("FX-Waterline")) glow(m, "#34c6b4", 1.6);
        else if (o.name.startsWith("GEO-SpudCan")) patchSteel(m, "#3A4046", 0.55);
        else if (o.name.startsWith("GEO-")) patchSteel(m, "#4E565C", 0.4);
      }
      // submerged teardown plan — ONLY legs + spud-cans translate
      const leg = o.name.match(/GEO-Leg_([A-D])/);
      const can = o.name.match(/GEO-SpudCan_([A-D])/);
      if (leg) {
        const [x, z] = CORNER[leg[1]];
        collected.push({
          node: o,
          base: o.position.clone(),
          offset: new THREE.Vector3(x, -0.35, z).normalize().multiplyScalar(span * 0.16),
        });
      } else if (can) {
        const [x, z] = CORNER[can[1]];
        collected.push({
          node: o,
          base: o.position.clone(),
          offset: new THREE.Vector3(x, -0.7, z).normalize().multiplyScalar(span * 0.22),
          corner: can[1],
        });
      }
    });
    parts.current = collected;
    setReady(true);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("am:scene-ready"));
    }
  }, [scene, onMeasured]);

  const camPos = useRef(new THREE.Vector3());
  const camTgt = useRef(new THREE.Vector3());
  const damped = useRef(0);
  const yaw = useRef(-0.5);
  const { camera, size } = useThree();

  // proven viewing azimuth (x,z direction) kept constant — the dive varies
  // camera elevation, target Y and orbit radius, all relative to measured anchors.
  const DIR = useMemo(() => new THREE.Vector2(42, 48).normalize(), []);
  const RBASE = 63.8; // sqrt(42²+48²) — proven assembled horizontal distance

  useFrame((state) => {
    const target = motionState.reduced ? 0.32 : scrollState.progress; // reduced → static above-surface frame
    damped.current += (target - damped.current) * (motionState.reduced ? 1 : 0.1);
    const p = damped.current;
    uTime.current.value = state.clock.elapsedTime;

    const { top, bot, water, span } = anchors.current;

    // turntable — slow & alive, but FROZEN during the report beat (0.5–0.78)
    // so leader-line callouts sit dead-still and readable.
    if (group.current) {
      if (motionState.reduced) {
        yaw.current = -0.5;
      } else if (!(p > 0.5 && p < 0.8)) {
        yaw.current = -0.5 + state.clock.elapsedTime * 0.05;
      }
      group.current.rotation.y = yaw.current;
    }

    // submerged teardown: 0 until the crossing (0.42), full by 0.58
    const e = motionState.reduced ? 0 : smoothstep(clamp01((p - 0.42) / 0.16));
    // at rest (>0.85) ease parts back ~30% — held half-exploded, never reassembled
    const hold = p > 0.85 ? lerp(1, 0.7, clamp01((p - 0.85) / 0.15)) : 1;
    const ee = e * hold;
    for (const part of parts.current) {
      part.node.position.set(
        part.base.x + part.offset.x * ee,
        part.base.y + part.offset.y * ee,
        part.base.z + part.offset.z * ee,
      );
    }

    // sonar tail: expand from 0.78→1
    const sp = clamp01((p - 0.78) / 0.22);
    sonarNames.forEach((n) => {
      const a = actions[n];
      if (a) a.time = Math.min(sp * sonarDur, a.getClip().duration);
    });

    // ── camera dive, scale-relative ──
    const dive = smoothstep(clamp01((p - 0.1) / 0.5)); // 0 above → 1 settled subsea
    const R =
      RBASE *
      lerp(1.0, 0.8, dive) *
      (p > 0.85 ? lerp(1, 1.06, clamp01((p - 0.85) / 0.15)) : 1);
    const camY = lerp(top * 1.04, water - span * 0.16, dive);
    const tgtY = lerp(lerp(water, top, 0.5), bot + span * 0.18, dive);
    // gentle ±parallax orbit around the cluster in the tail
    const az =
      motionState.reduced
        ? 0
        : Math.sin(state.clock.elapsedTime * 0.25) * 0.06 * smoothstep(clamp01((p - 0.78) / 0.22));
    const cos = Math.cos(az);
    const sin = Math.sin(az);
    const dx = DIR.x * cos - DIR.y * sin;
    const dz = DIR.x * sin + DIR.y * cos;

    const aspect = size.width / Math.max(size.height, 1);
    const distMul = aspect < 1 ? 1 + (1 - aspect) * 0.5 : 1; // portrait pull-back
    camPos.current.set(dx * R * distMul, camY, dz * R * distMul);
    camTgt.current.set(0, tgtY, 0);
    camera.position.lerp(camPos.current, motionState.reduced ? 1 : 0.12);
    camera.lookAt(camTgt.current);
  });

  const isNarrow = size.width < 760;

  return (
    <group ref={group}>
      <primitive object={scene} />
      {ready &&
        !isNarrow &&
        !motionState.reduced &&
        parts.current
          .filter((pt) => pt.corner)
          .map((pt) => (
            <Callout
              key={pt.corner}
              part={pt}
              finding={FINDINGS[pt.corner as string]}
              foot={anchors.current.foot}
            />
          ))}
    </group>
  );
}

/* a single NDT finding: a thin teal leader-line from the spud-can out to a
   Cinzel code + mono spec value. Fades in during the survey beat (0.52–0.66)
   and holds. Lines fan to the corner's outward direction so they never cross
   the camera or each other. */
function Callout({
  part,
  finding,
  foot,
}: {
  part: Part;
  finding: { code: string; spec: string };
  foot: number;
}) {
  const lineRef = useRef<THREE.Object3D & { material: THREE.Material & { opacity: number } }>(null!);
  const htmlWrap = useRef<HTMLDivElement>(null!);
  const [x, z] = CORNER[part.corner as string];
  const reach = foot * 0.5;

  const start = useMemo(() => part.base.clone(), [part]);
  const end = useMemo(
    () => new THREE.Vector3(x, 0, z).normalize().multiplyScalar(reach),
    [x, z, reach],
  );
  const elbow = useMemo(
    () => start.clone().add(end).add(new THREE.Vector3(0, -reach * 0.1, 0)),
    [start, end, reach],
  );

  useFrame(() => {
    const p = motionState.reduced ? 1 : scrollState.progress;
    const o = smoothstep(clamp01((p - 0.52) / 0.14));
    if (lineRef.current?.material) lineRef.current.material.opacity = o * 0.9;
    if (htmlWrap.current) htmlWrap.current.style.opacity = String(o);
  });

  return (
    <group>
      <Line
        ref={lineRef as never}
        points={[
          [start.x, start.y, start.z],
          [elbow.x, elbow.y, elbow.z],
        ]}
        color="#34c6b4"
        lineWidth={1.1}
        transparent
        opacity={0}
        toneMapped={false}
      />
      <Html
        position={[elbow.x, elbow.y, elbow.z]}
        center
        distanceFactor={foot * 2.4}
        style={{ pointerEvents: "none" }}
        zIndexRange={[0, 0]}
      >
        <div ref={htmlWrap} style={{ opacity: 0, whiteSpace: "nowrap", transform: "translateX(40%)" }}>
          <div
            className="font-display"
            style={{ color: "#234b47", fontWeight: 700, fontSize: "13px", letterSpacing: "0.08em" }}
          >
            {finding.code}
          </div>
          <div
            style={{
              color: "#30837b",
              fontSize: "10px",
              letterSpacing: "0.04em",
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              marginTop: "2px",
            }}
          >
            {finding.spec}
          </div>
        </div>
      </Html>
    </group>
  );
}

/* emissive scan ring that rides up the submerged structure in the active-scan
   beat (0.78→1) — the "we are reading the steel right now" tell. Raw-HDR teal,
   toneMapped off → the only thing (besides sonar) that blooms. */
function ScanBand({ anchors }: { anchors: React.MutableRefObject<Anchors> }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (!ref.current) return;
    const p = motionState.reduced ? 0 : scrollState.progress;
    const t = clamp01((p - 0.78) / 0.22);
    const { bot, water, foot } = anchors.current;
    ref.current.visible = t > 0.01;
    ref.current.position.y = lerp(bot, water, smoothstep(t));
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = Math.sin(smoothstep(t) * Math.PI) * 0.7 + 0.05;
    const s = foot * 1.05;
    ref.current.scale.set(s, s, s);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={3}>
      <ringGeometry args={[0.82, 1.0, 64]} />
      <meshBasicMaterial
        color="#5cf0d8"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

export default function RigHeroScene({
  onContextLost,
}: {
  onContextLost?: () => void;
}) {
  const anchors = useRef<Anchors>({ top: 26, bot: 0, water: 10, span: 26, foot: 14 });
  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop="always"
      camera={{ position: [42, 27, 48], fov: 38, near: 0.1, far: 600 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl, invalidate }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
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
      {/* warm sailcloth-cream stage — NO dark surfaces, even subsea. The subsea
          cooling lives on the steel albedo (shader), not the page background. */}
      <color attach="background" args={["#F4EBD9"]} />
      <fog attach="fog" args={["#F4EBD9", 90, 230]} />

      <Suspense fallback={null}>
        <hemisphereLight args={["#ffffff", "#ECDFC7", 0.85]} />
        <directionalLight position={[18, 30, 14]} intensity={1.6} color="#fff6e6" />
        {/* teal-tinted fill from below so the submerged half never goes muddy */}
        <directionalLight position={[-16, -6, -12]} intensity={0.45} color="#234b47" />
        <Environment preset="warehouse" environmentIntensity={0.7} />

        <Rig onMeasured={(a) => (anchors.current = a)} />
        <ScanBand anchors={anchors} />

        <ContactShadows
          position={[0, 0.02, 0]}
          scale={64}
          far={44}
          blur={2.8}
          opacity={0.34}
          color="#5b5347"
          resolution={1024}
        />
        <AdaptiveDpr pixelated />

        {/* Bloom only on raw-HDR FX (>1.0). ToneMapping LAST (skill §2). */}
        <EffectComposer multisampling={4}>
          <Bloom
            intensity={0.85}
            luminanceThreshold={1.0}
            luminanceSmoothing={0.12}
            radius={0.6}
            mipmapBlur
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL, true);
