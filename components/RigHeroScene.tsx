"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useGLTF,
  Environment,
  AdaptiveDpr,
  Html,
  Line,
  Sky,
  MeshReflectorMaterial,
} from "@react-three/drei";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Group, Mesh, MeshStandardMaterial, Object3D } from "three";
import { scrollState, motionState, sceneState } from "@/lib/scroll";

/* ════════════════════════════════════════════════════════════════
   RIG HERO — SCROLL-DRIVEN ASSEMBLY (turbofan-reel treatment).

   The video pattern mapped to the jack-up rig:

   0.00–0.12  ASSEMBLED — slow turntable, rig whole & readable
   0.12–0.42  EXPLODE — parts fan out radially + vertically;
                ground grid fades in; camera pulls back
   0.42–0.62  HOLD — full exploded diagram; assembly labels;
                teal scan sweep climbs the structure; grid holds
   0.62–0.92  REASSEMBLE — parts ease home; rig rotates 90° on Y
                so the viewer sees a new face; glow ring pulses
                from the base; camera pushes in
   0.92–1.00  ASSEMBLED HERO — topped-out, new angle, slow drift

   Scale-honest: assembled bounds + centroid measured on load;
   every offset is a fraction of measured span.

   Brand: dark gunmetal steel on warm sailcloth-cream, ONE teal accent.
   Bloom catches ONLY the raw-HDR teal scan ring + glow ring.
   ════════════════════════════════════════════════════════════════ */

const MODEL_URL = "/models/advantage-osv-hero.glb";

const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* Honest assembly labels — real jack-up nomenclature + AM scope.
   Anchored to one part per major assembly, shown only in the hold. */
const LABELS: Record<string, { code: string; spec: string }> = {
  "GEO-adv-hull": { code: "Hull & ballast tanks", spec: "plate UT · CP read" },
  "GEO-adv-pod-s": { code: "Azimuth thrusters", spec: "shaft & seal survey" },
  "GEO-adv-mast": { code: "Radar & comms mast", spec: "nav-aid · antenna check" },
  "GEO-adv-crane": { code: "Deck crane", spec: "boom & slew survey" },
};

type Part = {
  node: Object3D;
  base: THREE.Vector3;
  offset: THREE.Vector3;
  dir: THREE.Vector2;
  label?: string;
};

type Anchors = { top: number; bot: number; span: number; foot: number; cx: number; cz: number };

/* Per-part explode plan — radial+vertical offset as fraction of span.
   Keyed to the new GLB's lowercase-hyphen node names (GEO-rig-*). Hull is the
   anchor; legs splay out + drop to seabed, the derrick + drill string lift out
   of the rotary, topside blocks fan out so the whole jack-up reads as one
   machine coming apart along its real axes. */
function explodePlan(name: string): { kR: number; kV: number; anchor?: boolean } {
  // internals drop out the bottom
  if (/engine/.test(name)) return { kR: 0.06, kV: -0.60 };
  if (/pod-/.test(name)) return { kR: 0.18, kV: -0.46 };
  if (/bowthruster/.test(name)) return { kR: 0.10, kV: -0.40 };
  if (/bulbous/.test(name)) return { kR: 0.20, kV: -0.12 };
  // superstructure lifts up as stacked layers
  if (/mast/.test(name)) return { kR: 0.02, kV: 0.72 };
  if (/bridge/.test(name)) return { kR: 0.02, kV: 0.56 };
  if (/house-t3/.test(name)) return { kR: 0.02, kV: 0.42 };
  if (/house-t2/.test(name)) return { kR: 0.02, kV: 0.30 };
  if (/house-t1/.test(name)) return { kR: 0.02, kV: 0.18 };
  if (/funnel/.test(name)) return { kR: 0.16, kV: 0.34 };
  // deck gear fans outboard
  if (/forecastle/.test(name)) return { kR: 0.26, kV: 0.12 };
  if (/lifeboat|davit/.test(name)) return { kR: 0.36, kV: 0.16 };
  if (/crane/.test(name)) return { kR: 0.40, kV: 0.24 };
  if (/aframe/.test(name)) return { kR: 0.40, kV: 0.18 };
  if (/sensor/.test(name)) return { kR: 0.26, kV: 0.18 };
  if (/hull/.test(name)) return { kR: 0, kV: 0, anchor: true };
  return { kR: 0.18, kV: 0.06 };
}

/* ════════════════════════════════════════════════════════════════
   GROUND GRID — reflective grid plane that fades in during the
   exploded hold, giving the rig a stage to sit on (video ref).
   Retired: the ocean plane is the stage now. Kept for reference / reduced-
   motion fallback. ════════════════════════════════════════════════════════ */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function GroundGrid({ anchors }: { anchors: React.MutableRefObject<Anchors> }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const matRef = useRef<THREE.ShaderMaterial>(null!);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uColor: { value: new THREE.Color("#3a3530") },
      uBg: { value: new THREE.Color("#F4EBD9") },
      uSpan: { value: 100 },
    }),
    [],
  );

  useFrame((state) => {
    if (!matRef.current) return;
    const p = motionState.reduced ? 0.52 : scrollState.progress;
    // fade in 0.12→0.22, hold, fade out 0.82→0.92
    let o = 0;
    if (p >= 0.12 && p < 0.22) o = smoothstep(clamp01((p - 0.12) / 0.1));
    else if (p >= 0.22 && p < 0.82) o = 1;
    else if (p >= 0.82 && p < 0.92) o = 1 - smoothstep(clamp01((p - 0.82) / 0.1));
    matRef.current.uniforms.uOpacity.value = o * 0.35;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const { foot } = anchors.current;
  const size = foot * 6;

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <shaderMaterial
        ref={matRef as never}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={`
          varying vec2 vUv;
          void main(){
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
          }
        `}
        fragmentShader={`
          uniform float uTime;
          uniform float uOpacity;
          uniform vec3 uColor;
          uniform vec3 uBg;
          varying vec2 vUv;
          void main(){
            vec2 uv = vUv - 0.5;
            float grid = max(
              abs(fract(uv.x * 24.0) - 0.5),
              abs(fract(uv.y * 24.0) - 0.5)
            );
            float line = smoothstep(0.02, 0.0, grid);
            // radial fade at edges
            float rim = 1.0 - smoothstep(0.25, 0.5, length(uv));
            // subtle breathing pulse
            float pulse = 0.92 + 0.08 * sin(uTime * 1.2);
            vec3 col = mix(uBg, uColor, line * pulse * rim);
            float alpha = line * rim * uOpacity;
            gl_FragColor = vec4(col, alpha);
          }
        `}
      />
    </mesh>
  );
}

/* ════════════════════════════════════════════════════════════════
   GLOW RING — pulsing teal ring that expands from the rig base
   during reassembly (video's purple-pink glow ring, AM-branded).
   ════════════════════════════════════════════════════════════════ */
function GlowRing({ anchors }: { anchors: React.MutableRefObject<Anchors> }) {
  const ref = useRef<THREE.Mesh>(null!);
  const innerRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (!ref.current || !innerRef.current) return;
    const p = motionState.reduced ? 0 : scrollState.progress;
    // appear during reassembly 0.62→0.72, hold to 0.88, fade 0.88→0.95
    let t = 0;
    if (p >= 0.62 && p < 0.72) t = smoothstep(clamp01((p - 0.62) / 0.1));
    else if (p >= 0.72 && p < 0.88) t = 1;
    else if (p >= 0.88 && p < 0.95) t = 1 - smoothstep(clamp01((p - 0.88) / 0.07));

    const { bot, foot, cx, cz } = anchors.current;
    ref.current.visible = t > 0.01;
    innerRef.current.visible = t > 0.01;

    const pulse = 1.0 + 0.18 * Math.sin(state.clock.elapsedTime * 3.5);
    const s = foot * 1.1 * pulse;
    ref.current.position.set(cx, bot - 0.02, cz);
    ref.current.scale.set(s, s, s);
    innerRef.current.position.set(cx, bot - 0.01, cz);
    innerRef.current.scale.set(s * 0.86, s * 0.86, s * 0.86);

    const m = ref.current.material as THREE.MeshBasicMaterial;
    const m2 = innerRef.current.material as THREE.MeshBasicMaterial;
    m.opacity = Math.sin(t * Math.PI) * 0.55;
    m2.opacity = Math.sin(t * Math.PI) * 0.35;
  });

  return (
    <group>
      <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={4}>
        <ringGeometry args={[0.88, 1.0, 96]} />
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
      <mesh ref={innerRef} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={4}>
        <ringGeometry args={[0.82, 0.92, 96]} />
        <meshBasicMaterial
          color="#8fffe8"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          toneMapped={false}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ════════════════════════════════════════════════════════════════
   RIG — the jack-up assembly with explode / hold / reassemble /
   rotate / fade phases, all driven by scrollState.progress.
   ════════════════════════════════════════════════════════════════ */
function Rig({ onMeasured }: { onMeasured: (a: Anchors) => void }) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL, true);
  const parts = useRef<Part[]>([]);
  const [ready, setReady] = useState(false);
  const anchors = useRef<Anchors>({ top: 26, bot: 0, span: 26, foot: 14, cx: 0, cz: 0 });

  useEffect(() => {
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

    /* Preserve the GLB's baked PBR identity (RIG-white quarters, RIG-yellow
       cranes, RIG-steel/dksteel/darkmet structure) — only tune it to read on
       the warm cream studio env: clone per-mesh, lift envMap reflections, keep
       it shadow-casting. Blanket-greying here would erase the white + yellow. */
    const tuneMat = (m: Mesh) => {
      const mat = (m.material as MeshStandardMaterial).clone();
      // Push toward the concept's sleek REFLECTIVE read — every panel mirrors
      // the pastel sky + ocean + sunset HDRI. This is what turns the low-poly
      // forms from "matte clay" into a premium chrome-ish vessel (igloo.inc /
      // Higgsfield-concept territory). Glass stays glassy; teal-glow internals
      // keep their emissive.
      const nm = (mat.name || "").toLowerCase();
      mat.envMapIntensity = 1.8;
      if (nm.includes("glass")) {
        mat.metalness = 0.0;
        mat.roughness = 0.05;
        mat.envMapIntensity = 2.4;
      } else if (/steel|mast|engine|silver|pod|thruster/.test(nm)) {
        mat.metalness = 0.96;
        mat.roughness = 0.16; // chrome-ish structure
      } else {
        // painted hull / quarters / deck — semi-reflective clearcoat feel
        mat.metalness = Math.max(mat.metalness, 0.55);
        mat.roughness = Math.min(Math.max(mat.roughness * 0.5, 0.12), 0.4);
      }
      mat.needsUpdate = true;
      m.material = mat;
      m.castShadow = true;
      m.receiveShadow = true;
    };

    const collected: Part[] = [];
    scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh && o.name.startsWith("GEO-")) {
        tuneMat(m);
      }
      if (m.isMesh && o.name.startsWith("GEO-")) {
        const wc = new THREE.Vector3();
        new THREE.Box3().setFromObject(o).getCenter(wc);
        const dir = new THREE.Vector2(wc.x - anchors.current.cx, wc.z - anchors.current.cz);
        if (dir.lengthSq() < 1e-4) {
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
  const DIR = useMemo(() => new THREE.Vector2(42, 48).normalize(), []);

  useFrame((state) => {
    const target = motionState.reduced ? 0.5 : scrollState.progress;
    damped.current += (target - damped.current) * (motionState.reduced ? 1 : 0.1);
    const p = damped.current;
    const { top, bot, span, foot, cx, cz } = anchors.current;

    // ── explode factor ──
    let ex: number;
    if (motionState.reduced) ex = 0.62;
    else if (p < 0.42) ex = smoothstep(clamp01((p - 0.12) / 0.3));
    else if (p < 0.62) ex = 1;
    else ex = 1 - smoothstep(clamp01((p - 0.62) / 0.3));

    // ── reassembly rotation (video: 90° turn as parts come home) ──
    // 0.62→0.92: rotate from 0 to +π/2 so viewer sees a new face
    const reassemblyTurn = motionState.reduced
      ? 0
      : smoothstep(clamp01((p - 0.62) / 0.3)) * (1 - smoothstep(clamp01((p - 0.92) / 0.08))) * Math.PI * 0.5;

    // ── turntable ──
    if (group.current) {
      if (motionState.reduced) {
        yaw.current = -0.5;
      } else if (!(p > 0.42 && p < 0.62)) {
        yaw.current = -0.5 + state.clock.elapsedTime * 0.05;
      }
      group.current.rotation.y = yaw.current + reassemblyTurn;
      // gentle float on the swell (concept: vessel bobs on the water)
      if (!motionState.reduced) {
        const t = state.clock.elapsedTime;
        group.current.position.y = Math.sin(t * 0.6) * span * 0.012;
        group.current.rotation.z = Math.sin(t * 0.45) * 0.012;
        group.current.rotation.x = Math.sin(t * 0.5 + 1.0) * 0.008;
      }
    }

    // ── part positions ──
    for (const part of parts.current) {
      part.node.position.set(
        part.base.x + part.offset.x * ex,
        part.base.y + part.offset.y * ex,
        part.base.z + part.offset.z * ex,
      );
    }

    // ── camera: dramatic orbit matching video phases ──
    const cy = (top + bot) / 2;
    const fitR = Math.max(span * 1.9, foot * 2.5);
    // pull back during explode, push in during reassemble
    const camR = fitR * lerp(1.0, 1.55, ex) * lerp(1.0, 0.88, reassemblyTurn / (Math.PI * 0.5));
    const camY = lerp(cy + span * 0.18, cy + span * 0.44, ex);

    // azimuth drift: gentle parallax in hold, orbit during reassembly
    const baseAz = motionState.reduced
      ? 0
      : Math.sin(state.clock.elapsedTime * 0.22) * 0.07 * smoothstep(clamp01((p - 0.42) / 0.2)) * (1 - smoothstep(clamp01((p - 0.62) / 0.2)));
    const reassemblyOrbit = motionState.reduced
      ? 0
      : smoothstep(clamp01((p - 0.62) / 0.3)) * 0.18 * Math.sin(state.clock.elapsedTime * 0.35);
    const az = baseAz + reassemblyOrbit;

    const cos = Math.cos(az);
    const sin = Math.sin(az);
    const dx = DIR.x * cos - DIR.y * sin;
    const dz = DIR.x * sin + DIR.y * cos;

    const aspect = size.width / Math.max(size.height, 1);
    const distMul = aspect < 1 ? 1 + (1 - aspect) * 0.5 : 1;
    camPos.current.set(cx + dx * camR * distMul, camY, cz + dz * camR * distMul);
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

function name2angle(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return (h / 360) * Math.PI * 2;
}

/* Assembly label: thin teal leader-line + Cinzel code + mono spec.
   Fades in over the exploded hold. */
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
  const start = useMemo(() => part.base.clone().add(part.offset), [part]);
  const end = useMemo(
    () => start.clone().add(new THREE.Vector3(part.dir.x, 0, part.dir.y).normalize().multiplyScalar(reach)),
    [start, part.dir, reach],
  );

  useFrame(() => {
    const p = motionState.reduced ? 0.55 : scrollState.progress;
    const o = smoothstep(clamp01((p - 0.42) / 0.07)) * (1 - smoothstep(clamp01((p - 0.62) / 0.06)));
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

/* Teal scan ring climbing the structure during the exploded hold. */
function ScanBand({ anchors }: { anchors: React.MutableRefObject<Anchors> }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (!ref.current) return;
    const p = motionState.reduced ? 0 : scrollState.progress;
    const t = smoothstep(clamp01((p - 0.42) / 0.2)) * (1 - smoothstep(clamp01((p - 0.62) / 0.15)));
    const { bot, top, foot, cx, cz } = anchors.current;
    ref.current.visible = t > 0.01;
    ref.current.position.set(cx, lerp(bot, top, smoothstep(clamp01((p - 0.42) / 0.2))), cz);
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

/* ════════════════════════════════════════════════════════════════
   OCEAN — calm reflective sea the vessel sits on (concept ref: vessel
   bobbing on deep blue-green water, sky + hull reflected, foam picking
   up during reassembly). MeshReflectorMaterial gives real sky+vessel
   reflections with a blurred, slightly distorted calm-water feel. The
   waterline tracks the measured hull base so the vessel always floats.
   `foam` (0→1) rises during the reassembly beat for the forward-motion
   beat in the concept.
   ════════════════════════════════════════════════════════════════ */
function Ocean({ anchors }: { anchors: React.MutableRefObject<Anchors> }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (!ref.current) return;
    const { bot, span } = anchors.current;
    ref.current.position.y = bot + span * 0.025;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} renderOrder={-1}>
      <planeGeometry args={[6000, 6000]} />
      <MeshReflectorMaterial
        resolution={1024}
        mirror={0.6}
        mixStrength={2.4}
        mixBlur={1.0}
        blur={[480, 120]}
        depthScale={1.0}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.2}
        roughness={0.72}
        metalness={0.5}
        color="#0e3a47"
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
        gl.toneMappingExposure = 0.92; // richer, less washed-out
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
      {/* only a faint far haze on the horizon — pushed way back so it never
          milks out the vessel (the washed/foggy look was this starting too near) */}
      <fog attach="fog" args={["#a9c4cd", 620, 1500]} />

      <Suspense fallback={null}>
        {/* Concept lighting: soft morning sun (warm key low on the horizon) +
            cool sky fill + a cool back-rim that catches the reflective hull and
            separates it from the sky. Reflective materials + sunset env do the
            heavy lifting now, so the key is softer than a studio rig. */}
        <hemisphereLight args={["#bcd3e0", "#0e3a47", 0.42]} />
        <directionalLight
          position={[40, 16, -36]}
          intensity={2.3}
          color="#fff1d8"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0003}
          shadow-normalBias={0.02}
        />
        <directionalLight position={[-22, 12, 18]} intensity={0.45} color="#cfe7e2" />
        <directionalLight position={[-10, 22, -28]} intensity={1.2} color="#bfe3dc" />

        {/* visible pastel sky with a low warm sun (drives the horizon glow) */}
        <Sky
          distance={4500}
          sunPosition={[40, 16, -36]}
          turbidity={5}
          rayleigh={1.7}
          mieCoefficient={0.012}
          mieDirectionalG={0.86}
        />
        {/* warm sunset HDRI for the chrome/steel reflections (not shown as bg) */}
        <Environment preset="sunset" environmentIntensity={0.82} />

        <Ocean anchors={anchors} />
        <Rig onMeasured={(a) => (anchors.current = a)} />
        <ScanBand anchors={anchors} />
        <GlowRing anchors={anchors} />

        <AdaptiveDpr pixelated />

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
