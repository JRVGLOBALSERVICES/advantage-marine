"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useGLTF,
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
   RIG HERO — EXPLODED ASSEMBLY (turbofan-reel treatment, 2026-06).

   The brief: the whole jack-up comes APART part-by-part and goes back
   TOGETHER — the Rolls-Royce turbofan-reel move, not a waterline dive.
   Every one of the 26 named GEO parts fans out from the hull along its
   own radial + vertical axis, holds as a readable engineering diagram,
   then flies home into the locked rig.

     0.00–0.10  assembled, recognizable; slow turntable
     0.10–0.45  EXPLODE — parts fan out (topside rises, legs/cans drop,
                crane + cantilever swing out)
     0.45–0.65  HOLD — full exploded diagram; honest assembly labels;
                one teal scan sweep climbs the structure (the accent)
     0.65–0.95  REASSEMBLE — parts ease home
     0.95–1.00  assembled hero, topped-out

   Scale-honest: the assembled bounds + centroid are MEASURED on load;
   every explode offset is expressed as a fraction of the measured span,
   so any authored model self-frames.

   Brand (AM design.md): dark gunmetal steel on warm sailcloth-cream,
   ONE teal accent. Bloom catches ONLY the raw-HDR teal scan ring.
   ════════════════════════════════════════════════════════════════ */

const MODEL_URL = "/models/jackup-rig.glb";

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* Honest assembly labels — real jack-up nomenclature + AM's real inspection
   scope. Anchored to one part per major assembly, shown only in the exploded
   hold. Suppressed on a narrow frame (labels would overlap). */
const LABELS: Record<string, { code: string; spec: string }> = {
  "GEO-Derrick": { code: "Derrick & drill floor", spec: "weld NDT · class survey" },
  "GEO-Hull": { code: "Hull & jackhouses", spec: "plate UT · CP read" },
  "GEO-Leg-A": { code: "Lattice leg", spec: "chord & brace MPI" },
  "GEO-SpudCan-A": { code: "Spud-can footing", spec: "scour · CP −0.92V" },
};

type Part = {
  node: Object3D;
  base: THREE.Vector3;
  offset: THREE.Vector3; // fully-exploded translation (world-ish, applied in group space)
  dir: THREE.Vector2; // outward (x,z) unit dir — drives leader-line
  label?: string; // key into LABELS for the major-assembly anchors
};

/* measured model anchors */
type Anchors = { top: number; bot: number; span: number; foot: number; cx: number; cz: number };

/* Per-part explode plan — classify by name, return a radial+vertical offset as a
   fraction of the measured span. Topside rises, legs/cans drop, crane + cantilever
   swing out. Layout-agnostic: radial direction is measured from each part's centre. */
function explodePlan(name: string): { kR: number; kV: number; anchor?: boolean } {
  if (/SpudCan/.test(name)) return { kR: 0.34, kV: -0.40 };
  if (/^GEO-Leg-/.test(name)) return { kR: 0.24, kV: -0.20 };
  if (/JackHouse/.test(name)) return { kR: 0.30, kV: 0.04 };
  if (/CrownBlock/.test(name)) return { kR: 0.06, kV: 0.52 };
  if (/Derrick/.test(name)) return { kR: 0.06, kV: 0.38 };
  if (/DrillFloor/.test(name)) return { kR: 0.08, kV: 0.24 };
  if (/Heli/.test(name)) return { kR: 0.22, kV: 0.46 };
  if (/Accom/.test(name)) return { kR: 0.24, kV: 0.28 };
  if (/Crane/.test(name)) return { kR: 0.34, kV: 0.16 };
  if (/Cantilever/.test(name)) return { kR: 0.40, kV: 0.08 };
  if (/Hull/.test(name)) return { kR: 0, kV: 0, anchor: true }; // the anchor everything comes off
  return { kR: 0.16, kV: 0.06 };
}

function Rig({ onMeasured }: { onMeasured: (a: Anchors) => void }) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL, true);
  const parts = useRef<Part[]>([]);
  const [ready, setReady] = useState(false);
  const anchors = useRef<Anchors>({ top: 26, bot: 0, span: 26, foot: 14, cx: 0, cz: 0 });

  useEffect(() => {
    // 1. measure assembled bounds + centroid (drives framing + explode scale)
    const geoBox = new THREE.Box3();
    scene.traverse((o) => {
      if (o.name.startsWith("GEO-") && (o as Mesh).isMesh) geoBox.expandByObject(o);
    });
    const max = geoBox.max;
    const min = geoBox.min;
    const ctr = new THREE.Vector3();
    geoBox.getCenter(ctr);
    const top = isFinite(max.y) ? max.y : 26;
    const bot = isFinite(min.y) ? min.y : 0;
    const span = Math.max(1, top - bot);
    const foot = Math.max(Math.abs(max.x), Math.abs(max.z), span * 0.5);
    anchors.current = { top, bot, span, foot, cx: ctr.x, cz: ctr.z };
    onMeasured(anchors.current);

    // 2. gunmetal PBR steel — warm-cream stage carries the reflections (HDRI).
    const patchSteel = (m: Mesh, base: string, rough: number) => {
      const mat = (m.material as MeshStandardMaterial).clone();
      mat.color = new THREE.Color(base);
      mat.metalness = 0.9;
      mat.roughness = rough;
      mat.needsUpdate = true;
      m.material = mat;
      m.castShadow = true;
      m.receiveShadow = true;
    };

    // 3. build the explode plan, one part per named top-level GEO node
    const collected: Part[] = [];
    scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh && o.name.startsWith("GEO-")) {
        patchSteel(m, /SpudCan/.test(o.name) ? "#3A4046" : "#4E565C", /SpudCan/.test(o.name) ? 0.55 : 0.4);
      }
      // explode entries: top-level named GEO nodes only (skip nested mesh children)
      if (o.name.startsWith("GEO-") && o.parent?.name.startsWith("EMPTY-")) {
        const wc = new THREE.Vector3();
        new THREE.Box3().setFromObject(o).getCenter(wc);
        const dir = new THREE.Vector2(wc.x - anchors.current.cx, wc.z - anchors.current.cz);
        if (dir.lengthSq() < 1e-4) {
          // centred parts (derrick/hull) — fan by a stable hash of the name
          const h = name2angle(o.name);
          dir.set(Math.cos(h), Math.sin(h));
        }
        dir.normalize();
        const plan = explodePlan(o.name);
        const off = new THREE.Vector3(
          dir.x * span * plan.kR,
          span * plan.kV,
          dir.y * span * plan.kR,
        );
        collected.push({
          node: o,
          base: o.position.clone(),
          offset: off,
          dir: dir.clone(),
          label: LABELS[o.name] ? o.name : undefined,
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

  // constant viewing azimuth; the explode varies orbit radius + a gentle parallax.
  const DIR = useMemo(() => new THREE.Vector2(42, 48).normalize(), []);

  useFrame((state) => {
    const target = motionState.reduced ? 0.5 : scrollState.progress;
    damped.current += (target - damped.current) * (motionState.reduced ? 1 : 0.1);
    const p = damped.current;

    const { top, bot, span, foot, cx, cz } = anchors.current;

    // explode factor: assembled → exploded (0.10–0.45) → hold (0.45–0.65)
    // → reassemble (0.65–0.95) → assembled.
    let ex: number;
    if (motionState.reduced) ex = 0.62;
    else if (p < 0.45) ex = smoothstep(clamp01((p - 0.1) / 0.35));
    else if (p < 0.65) ex = 1;
    else ex = 1 - smoothstep(clamp01((p - 0.65) / 0.3));

    // turntable — alive, but FROZEN during the exploded hold so labels read still.
    if (group.current) {
      if (motionState.reduced) {
        yaw.current = -0.5;
      } else if (!(p > 0.45 && p < 0.65)) {
        yaw.current = -0.5 + state.clock.elapsedTime * 0.05;
      }
      group.current.rotation.y = yaw.current;
    }

    for (const part of parts.current) {
      part.node.position.set(
        part.base.x + part.offset.x * ex,
        part.base.y + part.offset.y * ex,
        part.base.z + part.offset.z * ex,
      );
    }

    // ── camera: fit assembled tight, pull back as it explodes, push in on reassemble ──
    const cy = (top + bot) / 2;
    const fitR = Math.max(span * 1.9, foot * 2.5);
    const R = fitR * lerp(1.0, 1.5, ex);
    const camY = lerp(cy + span * 0.18, cy + span * 0.42, ex);
    // gentle parallax orbit in the exploded hold
    const az = motionState.reduced
      ? 0
      : Math.sin(state.clock.elapsedTime * 0.22) * 0.07 * smoothstep(clamp01((p - 0.45) / 0.2)) * (1 - smoothstep(clamp01((p - 0.65) / 0.2)));
    const cos = Math.cos(az);
    const sin = Math.sin(az);
    const dx = DIR.x * cos - DIR.y * sin;
    const dz = DIR.x * sin + DIR.y * cos;

    const aspect = size.width / Math.max(size.height, 1);
    const distMul = aspect < 1 ? 1 + (1 - aspect) * 0.5 : 1; // portrait pull-back
    camPos.current.set(cx + dx * R * distMul, camY, cz + dz * R * distMul);
    camTgt.current.set(cx, cy, cz);
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
          .filter((pt) => pt.label)
          .map((pt) => (
            <Callout
              key={pt.label}
              part={pt}
              finding={LABELS[pt.label as string]}
              foot={anchors.current.foot}
            />
          ))}
    </group>
  );
}

/* deterministic name → angle so centred parts still fan radially */
function name2angle(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return (h / 360) * Math.PI * 2;
}

/* a single assembly label: a thin teal leader-line from the part's exploded
   position out to a Cinzel code + mono spec. Fades in over the exploded hold. */
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
  const reach = foot * 0.5;

  // anchor at the part's FULLY-EXPLODED position (base + offset)
  const start = useMemo(() => part.base.clone().add(part.offset), [part]);
  const end = useMemo(
    () => start.clone().add(new THREE.Vector3(part.dir.x, 0, part.dir.y).normalize().multiplyScalar(reach)),
    [start, part.dir, reach],
  );

  useFrame(() => {
    const p = motionState.reduced ? 0.55 : scrollState.progress;
    // visible only across the exploded hold (fade in 0.45–0.52, out 0.62–0.68)
    const o = smoothstep(clamp01((p - 0.45) / 0.07)) * (1 - smoothstep(clamp01((p - 0.62) / 0.06)));
    if (lineRef.current?.material) lineRef.current.material.opacity = o * 0.9;
    if (htmlWrap.current) htmlWrap.current.style.opacity = String(o);
  });

  return (
    <group>
      <Line
        ref={lineRef as never}
        points={[
          [start.x, start.y, start.z],
          [end.x, end.y, end.z],
        ]}
        color="#34c6b4"
        lineWidth={1.1}
        transparent
        opacity={0}
        toneMapped={false}
      />
      <Html
        position={[end.x, end.y, end.z]}
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

/* emissive teal scan ring that climbs the structure during the exploded hold —
   the "we are reading every joint right now" tell + the page's single bloom source.
   Raw-HDR teal, toneMapped off. */
function ScanBand({ anchors }: { anchors: React.MutableRefObject<Anchors> }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (!ref.current) return;
    const p = motionState.reduced ? 0 : scrollState.progress;
    const t = smoothstep(clamp01((p - 0.45) / 0.2)) * (1 - smoothstep(clamp01((p - 0.65) / 0.15)));
    const { bot, top, foot, cx, cz } = anchors.current;
    ref.current.visible = t > 0.01;
    ref.current.position.set(cx, lerp(bot, top, smoothstep(clamp01((p - 0.45) / 0.2))), cz);
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = Math.sin(t * Math.PI) * 0.7 + 0.04;
    const s = foot * 1.25;
    ref.current.scale.set(s, s, s);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={3}>
      <ringGeometry args={[0.86, 1.0, 80]} />
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
  const anchors = useRef<Anchors>({ top: 26, bot: 0, span: 26, foot: 14, cx: 0, cz: 0 });
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
      {/* warm sailcloth-cream studio stage */}
      <color attach="background" args={["#F4EBD9"]} />
      <fog attach="fog" args={["#F4EBD9", 110, 280]} />

      <Suspense fallback={null}>
        <hemisphereLight args={["#ffffff", "#ECDFC7", 0.85]} />
        <directionalLight
          position={[18, 30, 14]}
          intensity={1.6}
          color="#fff6e6"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <directionalLight position={[-16, 8, -12]} intensity={0.4} color="#cfe7e2" />
        <Environment preset="warehouse" environmentIntensity={0.7} />

        <Rig onMeasured={(a) => (anchors.current = a)} />
        <ScanBand anchors={anchors} />

        <ContactShadows
          position={[0, 0.02, 0]}
          scale={80}
          far={60}
          blur={2.8}
          opacity={0.32}
          color="#5b5347"
          resolution={1024}
        />
        <AdaptiveDpr pixelated />

        {/* Bloom only on the raw-HDR teal scan ring. ToneMapping LAST (skill §2). */}
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
