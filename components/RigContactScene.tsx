"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, AdaptiveDpr, ContactShadows } from "@react-three/drei";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group, Mesh, MeshStandardMaterial, Object3D } from "three";
import { scrollState, motionState, sceneState } from "@/lib/scroll";

/* ════════════════════════════════════════════════════════════════
   RIG CONTACT SHOWCASE — calm idle turntable (2026-06).

   Replaces the fused-vessel scene. A single fused hull has no honest
   "assembly", which forced the old build into a wireframe→steel fake.
   The contact band now shows the SAME jack-up rig asset as the home
   hero — the real 26-part GLB — but quiet: a continuous slow turntable
   with a gentle breathing explode that peaks mid-scroll and settles at
   both ends, plus a teal inspection scan climbing the structure.

   One hero object carried across the whole site (design.md: one
   beautiful assembly, lots of empty space). Honest to the geometry —
   real named parts drift apart and back, never a faked cross-section.

     scroll 0.0 / 1.0  assembled, slow turntable
     scroll 0.5        gently exploded (~0.55 of full), parts drift out
   ════════════════════════════════════════════════════════════════ */

const MODEL_URL = "/models/jackup-rig.glb";
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Part = { node: Object3D; base: THREE.Vector3; offset: THREE.Vector3 };
type Anchors = { top: number; bot: number; span: number; foot: number; cx: number; cz: number };

/* gentle explode plan — same nomenclature as the hero, scaled softer so the
   contact band reads as a quiet showcase, not the hero's full diagram. */
function explodePlan(name: string): { kR: number; kV: number } {
  if (/SpudCan/.test(name)) return { kR: 0.22, kV: -0.26 };
  if (/^GEO-Leg-/.test(name)) return { kR: 0.16, kV: -0.13 };
  if (/JackHouse/.test(name)) return { kR: 0.2, kV: 0.03 };
  if (/CrownBlock/.test(name)) return { kR: 0.04, kV: 0.34 };
  if (/Derrick/.test(name)) return { kR: 0.04, kV: 0.25 };
  if (/DrillFloor/.test(name)) return { kR: 0.05, kV: 0.16 };
  if (/Heli/.test(name)) return { kR: 0.15, kV: 0.3 };
  if (/Accom/.test(name)) return { kR: 0.16, kV: 0.18 };
  if (/Crane/.test(name)) return { kR: 0.22, kV: 0.1 };
  if (/Cantilever/.test(name)) return { kR: 0.26, kV: 0.05 };
  if (/Hull/.test(name)) return { kR: 0, kV: 0 };
  return { kR: 0.1, kV: 0.04 };
}

function name2angle(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return (h / 360) * Math.PI * 2;
}

function Rig({ onMeasured }: { onMeasured: (a: Anchors) => void }) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL, true);
  const parts = useRef<Part[]>([]);
  const anchors = useRef<Anchors>({ top: 26, bot: 0, span: 26, foot: 14, cx: 0, cz: 0 });

  useEffect(() => {
    const geoBox = new THREE.Box3();
    scene.traverse((o) => {
      if (o.name.startsWith("GEO-") && (o as Mesh).isMesh) geoBox.expandByObject(o);
    });
    const ctr = new THREE.Vector3();
    geoBox.getCenter(ctr);
    const top = isFinite(geoBox.max.y) ? geoBox.max.y : 26;
    const bot = isFinite(geoBox.min.y) ? geoBox.min.y : 0;
    const span = Math.max(1, top - bot);
    const foot = Math.max(Math.abs(geoBox.max.x), Math.abs(geoBox.max.z), span * 0.5);
    anchors.current = { top, bot, span, foot, cx: ctr.x, cz: ctr.z };
    onMeasured(anchors.current);

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

    const collected: Part[] = [];
    scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh && o.name.startsWith("GEO-")) {
        patchSteel(m, /SpudCan/.test(o.name) ? "#3A4046" : "#4E565C", /SpudCan/.test(o.name) ? 0.55 : 0.4);
      }
      if (o.name.startsWith("GEO-") && o.parent?.name.startsWith("EMPTY-")) {
        const wc = new THREE.Vector3();
        new THREE.Box3().setFromObject(o).getCenter(wc);
        const dir = new THREE.Vector2(wc.x - anchors.current.cx, wc.z - anchors.current.cz);
        if (dir.lengthSq() < 1e-4) {
          const h = name2angle(o.name);
          dir.set(Math.cos(h), Math.sin(h));
        }
        dir.normalize();
        const plan = explodePlan(o.name);
        collected.push({
          node: o,
          base: o.position.clone(),
          offset: new THREE.Vector3(dir.x * span * plan.kR, span * plan.kV, dir.y * span * plan.kR),
        });
      }
    });
    parts.current = collected;

    if (typeof window !== "undefined") window.dispatchEvent(new Event("am:scene-ready"));
  }, [scene, onMeasured]);

  const camPos = useRef(new THREE.Vector3());
  const camTgt = useRef(new THREE.Vector3());
  const damped = useRef(0);
  const { camera, size } = useThree();
  const DIR = useMemo(() => new THREE.Vector2(42, 48).normalize(), []);

  useFrame((state) => {
    const target = motionState.reduced ? 0.5 : scrollState.progress;
    damped.current += (target - damped.current) * (motionState.reduced ? 1 : 0.1);
    const p = damped.current;
    const { top, bot, span, foot, cx, cz } = anchors.current;

    // gentle breathing explode — 0 at both ends, peaks mid-scroll, capped soft
    const ex = motionState.reduced ? 0.4 : smoothstep(clamp01(1 - Math.abs(p - 0.5) * 2)) * 0.55;

    // continuous slow turntable — always alive (this is an idle showcase)
    if (group.current) {
      group.current.rotation.y = motionState.reduced ? -0.5 : -0.5 + state.clock.elapsedTime * 0.07;
    }

    for (const part of parts.current) {
      part.node.position.set(
        part.base.x + part.offset.x * ex,
        part.base.y + part.offset.y * ex,
        part.base.z + part.offset.z * ex,
      );
    }

    const cy = (top + bot) / 2;
    const fitR = Math.max(span * 1.95, foot * 2.5);
    const R = fitR * lerp(1.0, 1.28, ex / 0.55);
    const camY = lerp(cy + span * 0.2, cy + span * 0.36, ex / 0.55);
    const aspect = size.width / Math.max(size.height, 1);
    const distMul = aspect < 1 ? 1 + (1 - aspect) * 0.55 : 1;
    camPos.current.set(cx + DIR.x * R * distMul, camY, cz + DIR.y * R * distMul);
    camTgt.current.set(cx, cy, cz);
    camera.position.lerp(camPos.current, motionState.reduced ? 1 : 0.12);
    camera.lookAt(camTgt.current);
    if (!motionState.reduced) state.invalidate();
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

/* teal inspection scan ring climbing the structure on a slow continuous loop */
function ScanBand({ anchors }: { anchors: React.MutableRefObject<Anchors> }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (!ref.current) return;
    if (motionState.reduced) {
      ref.current.visible = false;
      return;
    }
    const t = (state.clock.elapsedTime * 0.12) % 1; // ~8.3s climb
    const { bot, top, foot, cx, cz } = anchors.current;
    ref.current.visible = true;
    ref.current.position.set(cx, lerp(bot, top, t), cz);
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = Math.sin(t * Math.PI) * 0.6 + 0.03;
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

export default function RigContactScene({
  onContextLost,
  active = true,
}: {
  onContextLost?: () => void;
  active?: boolean;
}) {
  const anchors = useRef<Anchors>({ top: 26, bot: 0, span: 26, foot: 14, cx: 0, cz: 0 });
  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop={active ? "always" : "never"}
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
      {/* warm sailcloth-cream studio — same stage as the hero */}
      <color attach="background" args={["#F6EFE1"]} />
      <fog attach="fog" args={["#F6EFE1", 110, 280]} />

      <Suspense fallback={null}>
        <hemisphereLight args={["#ffffff", "#ECDFC7", 0.85]} />
        <directionalLight position={[18, 30, 14]} intensity={1.6} color="#fff6e6" castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-16, 8, -12]} intensity={0.4} color="#cfe7e2" />
        <Environment preset="warehouse" environmentIntensity={0.7} />

        <Rig onMeasured={(a) => (anchors.current = a)} />
        <ScanBand anchors={anchors} />

        <ContactShadows position={[0, 0.02, 0]} scale={80} far={60} blur={2.8} opacity={0.32} color="#5b5347" resolution={1024} />
        <AdaptiveDpr pixelated />

        {/* Bloom only on the raw-HDR teal scan ring. ToneMapping LAST (skill §2). */}
        <EffectComposer multisampling={4}>
          <Bloom intensity={0.8} luminanceThreshold={1.0} luminanceSmoothing={0.12} radius={0.6} mipmapBlur />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL, true);
