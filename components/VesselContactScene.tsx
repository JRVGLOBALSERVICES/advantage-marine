"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, AdaptiveDpr, ContactShadows } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Group, Mesh, MeshStandardMaterial, Object3D } from "three";
import { scrollState, motionState, sceneState } from "@/lib/scroll";

/* ════════════════════════════════════════════════════════════════
   VESSEL HERO SCENE — dark CAD visualization (2026-06).

   Dark technical aesthetic matching Rj's concept video:
   • deep ink background with blue grid floor
   • explode → assemble with neon blue connection lines
   • post-assembly: slow rotation + pulsating blue target ring
   • teal inspection scan retained as secondary accent

   Axis (Y-up GLB):
     X = ship length   (stern −X, bow +X)
     Y = up            (mast peaks ~4.9)
     Z = beam          (port −Z, starboard +Z)

   Scroll maps to a MONOTONIC ASSEMBLE (matches Rj's reference poster, which
   reads part-by-part → intermediate → combined). The visitor enters on the
   exploded field of parts and scrolls the vessel TOGETHER — no there-and-back:
     scroll 0.00–0.15  fully apart        — stage 01 "part by part"
     scroll 0.15–0.40  assembling inward
     scroll 0.40–0.58  partial hull       — stage 02 "intermediate assembly"
     scroll 0.58–0.85  finishing the join
     scroll 0.85–1.00  combined showcase  — stage 03 + target ring + scan pulse
   ════════════════════════════════════════════════════════════════ */

const MODEL_URL = "/models/vessel.glb";
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* HOLD override — when the scene is mounted as a STATIC showcase (the contact
   constellation, not the scroll-driven hero) the page has no tall sticky
   section to drive scrollState. A non-null hold pins the assembly progress so
   the vessel renders fully combined (hold≈0.95 → explodeAmount 0 + target ring
   + scan beat). Module-scoped because only one scene mounts per page. */
let holdProgress: number | null = null;
const progressNow = () => (holdProgress ?? scrollState.progress);

/* Explode amount (0 assembled → 1 fully apart) as a function of scroll.
   Single source of truth — both the vessel parts and the connection lines
   read this, so the lines always track the parts.

   MONOTONIC ASSEMBLE: enter on the exploded parts (stage 01), scroll the
   vessel together through a mid "intermediate" hold, land on the combined
   ship (stage 03). Reads top→bottom the way the reference reads left→right. */
function explodeAmount(p: number): number {
  if (p <= 0.15) return 1;                                            // fully apart  — stage 01 "part by part"
  if (p < 0.40) return lerp(1, 0.55, smoothstep((p - 0.15) / 0.25));  // assembling inward
  if (p < 0.58) return 0.55;                                          // partial hull — stage 02 "intermediate"
  if (p < 0.85) return lerp(0.55, 0, smoothstep((p - 0.58) / 0.27));  // finishing the join
  return 0;                                                           // combined ship — stage 03 "combined together"
}

/* Light stage palette — warm cream + marine teal (matches the page tokens,
   NO dark surfaces). Names kept from the dark build to limit churn. */
const DARK_BG = "#F4EBD9";     // warm sailcloth cream — stage bg = page paper
const GRID_BLUE = "#cabba0";   // warm technical floor lines on cream
const LINE_BLUE = "#30837b";   // marine teal — connection traces + particles
const RING_BLUE = "#2f9e8f";   // teal — target ring + scan pulse

/* PBR materials — adjusted for dark stage (slightly lighter values so they
   read against the dark bg without blowing out).

   Keyed to the rebuilt PSV's GEO-* names (2026-06-04, 91 parts). Order is
   load-bearing: every test is `startsWith`, so the SPECIFIC prefix must come
   before the broader one ("GEO-engine-head" before "GEO-engine", the two
   crane sub-parts before "GEO-crane", "GEO-prop-…" stays one bucket). */
function paint(name: string): { color: string; metalness: number; roughness: number; emissive?: string } {
  // ── hull & shell — dark workboat navy
  if (name.startsWith("GEO-hull")) return { color: "#2a3d5c", metalness: 0.45, roughness: 0.4 };
  if (name.startsWith("GEO-forecastle")) return { color: "#2a3d5c", metalness: 0.45, roughness: 0.42 };
  if (name.startsWith("GEO-funnel")) return { color: "#2a3d5c", metalness: 0.45, roughness: 0.45 };
  if (name.startsWith("GEO-bulwark")) return { color: "#7a8088", metalness: 0.6, roughness: 0.4 };
  // ── superstructure — white
  if (name.startsWith("GEO-deckhouse")) return { color: "#d8ddd6", metalness: 0.15, roughness: 0.55 };
  if (name.startsWith("GEO-bridge")) return { color: "#d8ddd6", metalness: 0.15, roughness: 0.55 };
  // ── deck plate — grey
  if (name.startsWith("GEO-deck")) return { color: "#9ba0a6", metalness: 0.5, roughness: 0.5 };
  if (name.startsWith("GEO-aft-deck")) return { color: "#9ba0a6", metalness: 0.5, roughness: 0.5 };
  // ── masts & rails — galvanised steel
  if (name.startsWith("GEO-mast")) return { color: "#7a8088", metalness: 0.65, roughness: 0.35 };
  if (name.startsWith("GEO-rail")) return { color: "#9aa0a8", metalness: 0.7, roughness: 0.35 };
  if (name.startsWith("GEO-stanchion")) return { color: "#9aa0a8", metalness: 0.7, roughness: 0.35 };
  // ── crane — safety orange body, dark hook/cable (specific before "GEO-crane")
  if (name.startsWith("GEO-crane-hook")) return { color: "#3a4048", metalness: 0.8, roughness: 0.4 };
  if (name.startsWith("GEO-crane-cable")) return { color: "#3a4048", metalness: 0.6, roughness: 0.5 };
  if (name.startsWith("GEO-crane")) return { color: "#f0852a", metalness: 0.4, roughness: 0.4 };
  // ── deck fittings
  if (name.startsWith("GEO-liferaft")) return { color: "#f0852a", metalness: 0.2, roughness: 0.55 };  // orange canister
  if (name.startsWith("GEO-bollard")) return { color: "#e0b020", metalness: 0.4, roughness: 0.5 };    // safety yellow
  // ── engine room (cutaway machinery) — head/trim yellow before the teal block
  if (name.startsWith("GEO-engine-head")) return { color: "#f0c542", metalness: 0.5, roughness: 0.4 }; // yellow cylinder heads
  if (name.startsWith("GEO-engine")) return { color: "#2f9e8f", metalness: 0.4, roughness: 0.5 };      // teal machinery bodies
  if (name.startsWith("GEO-gearbox")) return { color: "#2f9e8f", metalness: 0.4, roughness: 0.5 };
  if (name.startsWith("GEO-shaft")) return { color: "#60666d", metalness: 0.8, roughness: 0.3 };       // steel shafts
  // ── running gear
  if (name.startsWith("GEO-prop")) return { color: "#c9a86c", metalness: 0.95, roughness: 0.25, emissive: "#1a1205" }; // brass props (hub + blades)
  if (name.startsWith("GEO-kort-nozzle")) return { color: "#60666d", metalness: 0.8, roughness: 0.35 };
  if (name.startsWith("GEO-rudder")) return { color: "#60666d", metalness: 0.75, roughness: 0.38 };
  if (name.startsWith("GEO-bow-thruster")) return { color: "#60666d", metalness: 0.8, roughness: 0.35 };
  return { color: "#7a8088", metalness: 0.55, roughness: 0.45 };
}

type Part = { node: Object3D; base: THREE.Vector3; offset: THREE.Vector3 };
type Box = { c: THREE.Vector3; sx: number; sy: number; sz: number; maxDim: number; cy: number; floorY: number };

/* explode vectors (assembled 0 → fully apart 1), authored along the rebuilt
   PSV's real axes: X = length (bow +, stern −), Y = up, Z = beam (port −,
   stbd +). Subsystems move as units — superstructure stacks UP, the engine
   room drops BELOW the hull for the stage-① cutaway reveal, the running gear
   pulls aft + down split port/starboard, and the deck plate + its fittings
   (rails, stanchions, bollards) lift away together. Scaled to the new model
   (~19u long, props at −10.1X) — camera framing is maxDim-driven so distances
   stay proportionate. Every part name below exists as a node in vessel.glb;
   the rig only animates names present here (`if (!(o.name in EXPLODE)) return`). */
const EXPLODE: Record<string, [number, number, number]> = {
  "GEO-hull": [0, 0, 0],            // anchor
  "GEO-forecastle": [0, 1.5, 0],
  "GEO-deck": [0, 3.0, 0],
  "GEO-aft-deck": [0, 3.0, 0],
  "GEO-bulwark": [0, 4.2, 0],
  "GEO-deckhouse": [0, 5.4, 0],
  "GEO-bridge": [0, 6.6, 0],
  "GEO-funnel": [-0.6, 7.6, 0],
  "GEO-mast": [0, 9.0, 0],
  "GEO-mast-yard": [0, 9.0, 0],
  "GEO-crane": [0, 7.0, -4.0],      // crane lifts up + out to port as a unit
  "GEO-crane-boom": [0, 7.0, -4.0],
  "GEO-crane-cable": [0, 7.0, -4.0],
  "GEO-crane-hook": [0, 7.0, -4.0],
  "GEO-rail-top-port": [0, 3.0, 0], // rides the deck plate
  "GEO-rail-top-stbd": [0, 3.0, 0],
  // engine room — drops below the hull (the interior cutaway reveal)
  "GEO-engine-block": [0, -3.5, 0],
  "GEO-engine-main-port": [0, -3.5, -0.9],
  "GEO-engine-main-stbd": [0, -3.5, 0.9],
  "GEO-gearbox": [0, -3.5, 0],
  "GEO-shaft-port": [0, -3.5, -0.7],
  "GEO-shaft-stbd": [0, -3.5, 0.7],
  // bow thruster — out the bow + down
  "GEO-bow-thruster": [4.5, -1.8, 0],
  // stern running gear — aft + down, split port/starboard
  "GEO-prop-hub-port": [-4.5, -2.2, -1.3],
  "GEO-prop-hub-stbd": [-4.5, -2.2, 1.3],
  "GEO-kort-nozzle-port": [-4.5, -2.2, -1.3],
  "GEO-kort-nozzle-stbd": [-4.5, -2.2, 1.3],
  "GEO-rudder-port": [-5.4, -1.6, -0.7],
  "GEO-rudder-stbd": [-5.4, -1.6, 0.7],
};
// repeated part families — same offset per family, expanded so every node is
// present in EXPLODE (the rig skips any node it can't find here).
for (let i = 0; i < 6; i++) {
  EXPLODE[`GEO-bollard-port-${i}`] = [0, 3.0, 0];   // ride the deck plate up
  EXPLODE[`GEO-bollard-stbd-${i}`] = [0, 3.0, 0];
}
for (let i = 0; i < 14; i++) {
  const n = String(i).padStart(2, "0");
  EXPLODE[`GEO-stanchion-port-${n}`] = [0, 3.0, 0];
  EXPLODE[`GEO-stanchion-stbd-${n}`] = [0, 3.0, 0];
}
for (let i = 0; i < 2; i++) {
  EXPLODE[`GEO-liferaft-port-${i}`] = [0, 5.4, 0];  // ride the deckhouse up
  EXPLODE[`GEO-liferaft-stbd-${i}`] = [0, 5.4, 0];
}
for (let i = 0; i < 5; i++) {
  EXPLODE[`GEO-engine-head-port-${i}`] = [0, -3.0, -0.9]; // drop with the mains
  EXPLODE[`GEO-engine-head-stbd-${i}`] = [0, -3.0, 0.9];
}
for (let i = 0; i < 4; i++) {
  EXPLODE[`GEO-prop-blade-port-${i}`] = [-4.5, -2.2, -1.3];
  EXPLODE[`GEO-prop-blade-stbd-${i}`] = [-4.5, -2.2, 1.3];
}

function Vessel({ onMeasured }: { onMeasured: (b: Box) => void }) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL, true);
  const parts = useRef<Part[]>([]);
  const box = useRef<Box>({ c: new THREE.Vector3(), sx: 12, sy: 5, sz: 3, maxDim: 12, cy: 2, floorY: -2.5 });

  useEffect(() => {
    const collected: Part[] = [];
    const bbox = new THREE.Box3();
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      if (!(o.name in EXPLODE)) return;
      bbox.expandByObject(m);
      const p = paint(o.name);
      const mat = (m.material as MeshStandardMaterial).clone();
      mat.color = new THREE.Color(p.color);
      mat.metalness = p.metalness;
      mat.roughness = p.roughness;
      if (p.emissive) mat.emissive = new THREE.Color(p.emissive);
      mat.needsUpdate = true;
      m.material = mat;
      m.castShadow = true;
      m.receiveShadow = true;
      const e = EXPLODE[o.name];
      collected.push({
        node: o,
        base: o.position.clone(),
        offset: new THREE.Vector3(e[0], e[1], e[2]),
      });
    });
    parts.current = collected;

    const c = new THREE.Vector3();
    bbox.getCenter(c);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    box.current = {
      c,
      sx: size.x,
      sy: size.y,
      sz: size.z,
      maxDim: Math.max(size.x, size.y, size.z),
      cy: (bbox.max.y + bbox.min.y) / 2,
      floorY: bbox.min.y - 0.05, // grid/shadows seat just under the hull
    };
    onMeasured(box.current);

    if (typeof window !== "undefined") window.dispatchEvent(new Event("am:scene-ready"));
  }, [scene, onMeasured]);

  const camPos = useRef(new THREE.Vector3());
  const camTgt = useRef(new THREE.Vector3());
  const damped = useRef(0);
  const { camera, size } = useThree();
  const DIR = useMemo(() => new THREE.Vector3(0.62, 0.42, 1.0).normalize(), []);

  useFrame((state) => {
    const target = motionState.reduced ? 0.5 : progressNow();
    damped.current += (target - damped.current) * (motionState.reduced ? 1 : 0.1);
    const p = damped.current;
    const { c, maxDim, cy } = box.current;

    const ex = motionState.reduced ? 0 : explodeAmount(clamp01(p));

    // continuous slow turntable — always alive
    if (group.current) {
      group.current.rotation.y = motionState.reduced ? 0.45 : 0.45 + state.clock.elapsedTime * 0.06;
    }

    for (const part of parts.current) {
      part.node.position.set(
        part.base.x + part.offset.x * ex,
        part.base.y + part.offset.y * ex,
        part.base.z + part.offset.z * ex,
      );
    }

    const aspect = size.width / Math.max(size.height, 1);
    // Frame distance. The desktop (landscape) framing keys off maxDim directly,
    // but on a tall/narrow portrait viewport the HORIZONTAL fov is far smaller
    // than the vertical one — so a long vessel overflows the frame and reads as
    // an undifferentiated dark slab of hull ("can't see it on mobile"). Take the
    // max of the landscape framing and the distance needed to fit the model's
    // long axis inside the horizontal fov: desktop is unaffected, portrait pulls
    // back far enough to show the whole ship.
    const baseR = maxDim * lerp(1.18, 1.5, ex);
    const halfV = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 360); // half vertical fov, rad
    const tanH = Math.max(Math.tan(halfV) * aspect, 1e-3);
    const horizFitR = (maxDim * 0.5 * lerp(1.15, 1.45, ex)) / tanH;
    const R = Math.max(baseR, horizFitR);
    const camY = c.y + maxDim * lerp(0.18, 0.3, ex);
    // Portrait pan: on a tall/narrow viewport the bottom ~38% is reserved for
    // the copy block, so a centre-framed vessel sits behind the headline. Pan
    // the whole framing DOWN in world space (camera + target by the same delta)
    // so the ship rides in the UPPER frame and the copy gets clean space below.
    // Desktop (landscape, aspect ≥ 1) lift = 0 → unchanged.
    const portrait = clamp01((1 - aspect) / 0.5); // 0 at square → 1 at very tall
    const lift = maxDim * 0.24 * portrait;
    camPos.current.set(c.x + DIR.x * R, camY - lift, c.z + DIR.z * R);
    camTgt.current.set(c.x, cy - lift, c.z);
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

/* Blue grid floor — glowing CAD-style grid */
function GridFloor({ box }: { box: React.MutableRefObject<Box> }) {
  const gridRef = useRef<THREE.GridHelper>(null);
  useFrame((state) => {
    if (!gridRef.current) return;
    // seat the grid under the measured hull (model-driven, not hard-coded)
    gridRef.current.position.y = box.current.floorY;
    // subtle pulse on grid opacity
    const m = gridRef.current.material as THREE.Material;
    m.opacity = 0.15 + Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
  });
  return (
    <gridHelper
      ref={gridRef}
      args={[80, 80, GRID_BLUE, GRID_BLUE]}
      position={[0, -2.5, 0]}
    >
      <meshBasicMaterial color={GRID_BLUE} transparent opacity={0.15} depthWrite={false} />
    </gridHelper>
  );
}

/* Connection lines — neon blue traces from each part to its assembled position.
   Visible during explode (scroll 0→0.7), fade out as assembly completes. */
function ConnectionLines({ parts }: { parts: React.MutableRefObject<Part[]> }) {
  const linesRef = useRef<THREE.Group>(null);
  const lineMeshes = useRef<THREE.Line[]>([]);

  useFrame(() => {
    const ex = explodeAmount(clamp01(progressNow()));
    const lineOpacity = clamp01((ex - 0.1) / 0.5); // fade as parts come together

    lineMeshes.current.forEach((line, i) => {
      const part = parts.current[i];
      if (!part || !line) return;
      const mat = line.material as THREE.LineBasicMaterial;
      mat.opacity = lineOpacity * 0.6;
      mat.needsUpdate = true;

      // update geometry to track moving part
      const pos = (line.geometry as THREE.BufferGeometry).attributes.position as THREE.BufferAttribute;
      pos.setXYZ(0, part.base.x, part.base.y, part.base.z);
      pos.setXYZ(
        1,
        part.base.x + part.offset.x * ex,
        part.base.y + part.offset.y * ex,
        part.base.z + part.offset.z * ex,
      );
      pos.needsUpdate = true;
    });
  });

  return (
    <group ref={linesRef}>
      {Object.entries(EXPLODE).map(([name, offset], i) => {
        if (name === "Hull") return null; // anchor doesn't get a line
        if (name.startsWith("GEO-")) return null; // interior machinery — no traces, keeps the reveal clean
        const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(offset[0], offset[1], offset[2])];
        return (
          <line key={name} ref={(el) => { if (el) lineMeshes.current[i] = el as unknown as THREE.Line; }}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([pts[0].x, pts[0].y, pts[0].z, pts[1].x, pts[1].y, pts[1].z])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={LINE_BLUE} transparent opacity={0} depthWrite={false} blending={THREE.NormalBlending} />
          </line>
        );
      })}
    </group>
  );
}

/* Pulsating blue target ring — appears post-assembly (scroll > 0.85) */
function TargetRing({ box }: { box: React.MutableRefObject<Box> }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (!ref.current) return;
    const p = progressNow();
    const visible = smoothstep(clamp01((p - 0.75) / 0.15));
    if (visible <= 0.01) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;

    const t = state.clock.elapsedTime;
    const { c, sx, floorY } = box.current;
    ref.current.position.set(c.x, floorY + 0.08, c.z);

    // pulsating scale
    const pulse = 1 + Math.sin(t * 2.5) * 0.08;
    const baseScale = sx * 0.45 * pulse;
    ref.current.scale.set(baseScale, baseScale, baseScale);

    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = visible * (0.5 + Math.sin(t * 3) * 0.2);
  });

  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={2}>
      <ringGeometry args={[0.85, 1.0, 96]} />
      <meshBasicMaterial
        color={RING_BLUE}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}

/* One-shot expanding scan-pulse — the concept video's closing beat.
   A ring that bursts outward from the vessel and fades as assembly completes.
   Scroll-mapped (scrubbed) so it reads as the payoff at the bottom of the hero,
   not a continuous loop. */
function ScanPulse({ box }: { box: React.MutableRefObject<Box> }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    if (!ref.current) return;
    const p = motionState.reduced ? 0.93 : progressNow();
    // active only across the assembly-complete window (0.86 → 1.0)
    const t = clamp01((p - 0.86) / 0.14);
    if (t <= 0.01 || t >= 0.999) {
      ref.current.visible = false;
      return;
    }
    ref.current.visible = true;
    const { c, maxDim, floorY } = box.current;
    ref.current.position.set(c.x, floorY + 0.06, c.z);
    // expand tight → wide, fade as it grows (ease-out)
    const e = smoothstep(t);
    const radius = maxDim * lerp(0.18, 1.15, e);
    ref.current.scale.set(radius, radius, radius);
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = (1 - e) * 0.85;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={4}>
      <ringGeometry args={[0.96, 1.0, 120]} />
      <meshBasicMaterial
        color={RING_BLUE}
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}

/* Teal inspection scan ring — secondary accent, continuous loop */
function ScanBand({ box }: { box: React.MutableRefObject<Box> }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    if (!ref.current) return;
    if (motionState.reduced) {
      ref.current.visible = false;
      return;
    }
    const t = (state.clock.elapsedTime * 0.13) % 1;
    const { c, sx, sy } = box.current;
    ref.current.visible = true;
    ref.current.position.set(c.x, lerp(c.y - sy * 0.5, c.y + sy * 0.5, t), c.z);
    const m = ref.current.material as THREE.MeshBasicMaterial;
    m.opacity = Math.sin(t * Math.PI) * 0.55 + 0.03;
    const s = sx * 0.62;
    ref.current.scale.set(s, s, s);
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} visible={false} renderOrder={3}>
      <ringGeometry args={[0.9, 1.0, 88]} />
      <meshBasicMaterial
        color="#44BBA4"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        toneMapped={false}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </mesh>
  );
}

/* Atmospheric data motes — soft ROUND dots kept well behind the vessel.
   (Raw PointsMaterial renders SQUARE sprites that bloom into solid cubes and
   read as stray editor gizmos — so we mask each point with a radial-gradient
   alphaMap and push the field to the background so it never overlays the ship.) */
function makeDotTexture(): THREE.Texture {
  const s = 64;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.5, "rgba(255,255,255,0.5)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}

function DataParticles() {
  const ref = useRef<THREE.Points>(null);
  const count = 70;
  const dot = useMemo(() => (typeof document !== "undefined" ? makeDotTexture() : null), []);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // ring the motes AROUND the stage (radius 22–40) and high/low, so none
      // sit in the camera's line to the vessel (~12u) — pure background depth.
      const a = Math.random() * Math.PI * 2;
      const r = 22 + Math.random() * 18;
      arr[i * 3] = Math.cos(a) * r;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 44 + 6;
      arr[i * 3 + 2] = Math.sin(a) * r;
    }
    return arr;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.02;
    const m = ref.current.material as THREE.PointsMaterial;
    m.opacity = 0.16 + Math.sin(state.clock.elapsedTime * 0.3) * 0.05;
  });

  if (!dot) return null;
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        color={LINE_BLUE}
        size={0.5}
        map={dot}
        alphaMap={dot}
        sizeAttenuation
        transparent
        opacity={0.16}
        depthWrite={false}
        blending={THREE.NormalBlending}
      />
    </points>
  );
}

export default function VesselContactScene({
  onContextLost,
  active = true,
  hold = null,
  dark = false,
}: {
  onContextLost?: () => void;
  active?: boolean;
  /* pin assembly progress for a static showcase (null = scroll-driven hero) */
  hold?: number | null;
  /* render transparent on a dark CSS backdrop (the contact constellation) */
  dark?: boolean;
}) {
  const box = useRef<Box>({ c: new THREE.Vector3(), sx: 12, sy: 5, sz: 3, maxDim: 12, cy: 2, floorY: -2.5 });
  const partsRef = useRef<Part[]>([]);
  const [floorY, setFloorY] = useState(-2.48);

  // pin (or release) the module-scoped assembly hold while this scene is mounted
  useEffect(() => {
    holdProgress = hold;
    return () => { holdProgress = null; };
  }, [hold]);

  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [9, 5, 14], fov: 38, near: 0.1, far: 600 }}
      gl={{ antialias: true, alpha: dark, powerPreference: "high-performance" }}
      onCreated={({ gl, invalidate }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = dark ? 1.18 : 1.05; // lift a touch on the dark stage
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
      {/* dark constellation = transparent canvas over the CSS gradient; cream hero
          stage = opaque warm background that matches page paper */}
      {dark ? (
        <fog attach="fog" args={["#0a1620", 40, 110]} />
      ) : (
        <>
          <color attach="background" args={[DARK_BG]} />
          <fog attach="fog" args={[DARK_BG, 38, 100]} />
        </>
      )}

      <Suspense fallback={null}>
        {/* Studio lighting — warm on cream, cooler marine fill on the dark stage */}
        <hemisphereLight args={dark ? ["#cfe6ef", "#16242e", 0.85] : ["#fff6e6", "#cdbb9a", 0.95]} />
        <directionalLight position={[10, 18, 9]} intensity={dark ? 1.9 : 1.7} color={dark ? "#eaf6ff" : "#fff4e2"} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-10, 6, -8]} intensity={dark ? 0.7 : 0.55} color={dark ? "#3fae9f" : "#bcd6cf"} />
        <Environment preset={dark ? "night" : "city"} environmentIntensity={dark ? 0.55 : 0.8} />

        <Vessel onMeasured={(b) => { box.current = b; setFloorY(b.floorY); }} />
        <GridFloor box={box} />
        <ConnectionLines parts={partsRef} />
        <TargetRing box={box} />
        <ScanPulse box={box} />
        <ScanBand box={box} />
        <DataParticles />

        {/* Warm soft contact shadow grounding the vessel on cream */}
        <ContactShadows position={[0, floorY, 0]} scale={36} far={24} blur={2.8} opacity={0.32} color="#6f6450" resolution={1024} />
        <AdaptiveDpr pixelated />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL, true);
