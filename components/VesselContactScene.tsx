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
   VESSEL CONTACT SHOWCASE — explode → assemble (2026-06).

   The contact band carries a DIFFERENT hero than the home jack-up rig:
   the 11-part support-vessel GLB authored in Blender (Hull · Deck ·
   Bridge · Funnel · Mast · Crane · Bulwark · BootTopping · twin Props ·
   Rudder). Honest exploded view — every part drifts along its real axis
   off the measured geometry, never a faked cross-section.

   Axis (Y-up GLB, measured from the file):
     X = ship length   (stern −X, bow +X)
     Y = up            (mast peaks ~4.9)
     Z = beam          (port −Z, starboard +Z)

   Scroll maps to assembly, the reverse of an explode:
     scroll 0.0   fully exploded — the parts hang apart, a diagram
     scroll 1.0   assembled into one hull, slow turntable
   A continuous slow turntable keeps it alive; a teal inspection scan
   (the AM brand accent) climbs the hull on a loop.
   ════════════════════════════════════════════════════════════════ */

const MODEL_URL = "/models/vessel.glb";
const smoothstep = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Part = { node: Object3D; base: THREE.Vector3; offset: THREE.Vector3 };
type Box = { c: THREE.Vector3; sx: number; sy: number; sz: number; maxDim: number; cy: number };

/* honest exploded vectors in MODEL units — each part moves along the axis it
   actually comes off the hull on. Lift the superstructure, split the running
   gear aft-and-down, drop the waterline strake. Hull is the anchor. */
const EXPLODE: Record<string, [number, number, number]> = {
  Hull: [0, 0, 0],
  BootTopping: [0, -1.4, 0], // waterline strake drops clear of the hull
  Deck: [0, 1.8, 0],
  Bulwark: [0, 2.6, 0], // rail cage lifts off the deck edge
  Bridge: [0, 3.6, 0],
  Funnel: [-0.4, 4.4, 0],
  Mast: [0, 5.8, 0],
  Crane: [1.9, 4.6, 0], // forward + up, the orange A-frame leads
  "Prop-P": [-3.4, -1.7, -1.3], // aft + down + port
  "Prop-S": [-3.4, -1.7, 1.3], // aft + down + starboard
  Rudder: [-4.0, -1.1, 0], // aft + down on centreline
};

/* honest marine PBR on the warm-cream stage — navy hull, white wheelhouse,
   grey deck/rail/mast, bronze screws, the AM warm accent on crane + waterline. */
function paint(name: string): { color: string; metalness: number; roughness: number } {
  if (name === "Hull") return { color: "#21304a", metalness: 0.35, roughness: 0.46 };
  if (name === "Funnel") return { color: "#21304a", metalness: 0.35, roughness: 0.5 };
  if (name === "Bridge") return { color: "#eef0ec", metalness: 0.1, roughness: 0.62 };
  if (name === "Deck") return { color: "#8b9096", metalness: 0.4, roughness: 0.55 };
  if (name === "Bulwark") return { color: "#717880", metalness: 0.55, roughness: 0.45 };
  if (name === "Mast") return { color: "#6c747b", metalness: 0.6, roughness: 0.4 };
  if (name === "Crane") return { color: "#e8701f", metalness: 0.35, roughness: 0.45 };
  if (name === "BootTopping") return { color: "#e8701f", metalness: 0.2, roughness: 0.6 };
  if (name === "Prop-P" || name === "Prop-S") return { color: "#b08d57", metalness: 0.95, roughness: 0.28 };
  if (name === "Rudder") return { color: "#565c63", metalness: 0.7, roughness: 0.42 };
  return { color: "#6c747b", metalness: 0.5, roughness: 0.5 };
}

function Vessel({ onMeasured }: { onMeasured: (b: Box) => void }) {
  const group = useRef<Group>(null);
  const { scene } = useGLTF(MODEL_URL, true);
  const parts = useRef<Part[]>([]);
  const box = useRef<Box>({ c: new THREE.Vector3(), sx: 12, sy: 5, sz: 3, maxDim: 12, cy: 2 });

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
    };
    onMeasured(box.current);

    if (typeof window !== "undefined") window.dispatchEvent(new Event("am:scene-ready"));
  }, [scene, onMeasured]);

  const camPos = useRef(new THREE.Vector3());
  const camTgt = useRef(new THREE.Vector3());
  const damped = useRef(0);
  const { camera, size } = useThree();
  // 3/4 bow-quarter view — front-starboard, raised. Ship runs along X.
  const DIR = useMemo(() => new THREE.Vector3(0.62, 0.42, 1.0).normalize(), []);

  useFrame((state) => {
    const target = motionState.reduced ? 0.5 : scrollState.progress;
    damped.current += (target - damped.current) * (motionState.reduced ? 1 : 0.1);
    const p = damped.current;
    const { c, maxDim, cy } = box.current;

    // explode → assemble: exploded at top (p=0), assembled at bottom (p=1)
    const ex = motionState.reduced ? 0.5 : 1 - smoothstep(clamp01(p));

    // continuous slow turntable — always alive (idle showcase)
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

    // frame the whole thing; pull back a touch while exploded so nothing clips
    const aspect = size.width / Math.max(size.height, 1);
    const distMul = aspect < 1 ? 1 + (1 - aspect) * 0.6 : 1;
    const R = maxDim * lerp(1.18, 1.5, ex) * distMul;
    const camY = c.y + maxDim * lerp(0.18, 0.3, ex);
    camPos.current.set(c.x + DIR.x * R, camY, c.z + DIR.z * R);
    camTgt.current.set(c.x, cy, c.z);
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

/* teal inspection scan ring climbing the hull on a slow continuous loop */
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

export default function VesselContactScene({
  onContextLost,
  active = true,
}: {
  onContextLost?: () => void;
  active?: boolean;
}) {
  const box = useRef<Box>({ c: new THREE.Vector3(), sx: 12, sy: 5, sz: 3, maxDim: 12, cy: 2 });
  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [9, 5, 14], fov: 38, near: 0.1, far: 600 }}
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
      {/* warm sailcloth-cream studio — same stage as the home hero */}
      <color attach="background" args={["#F6EFE1"]} />
      <fog attach="fog" args={["#F6EFE1", 40, 120]} />

      <Suspense fallback={null}>
        <hemisphereLight args={["#ffffff", "#ECDFC7", 0.85]} />
        <directionalLight position={[10, 18, 9]} intensity={1.6} color="#fff6e6" castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-10, 6, -8]} intensity={0.4} color="#cfe7e2" />
        <Environment preset="warehouse" environmentIntensity={0.7} />

        <Vessel onMeasured={(b) => (box.current = b)} />
        <ScanBand box={box} />

        <ContactShadows position={[0, -0.02, 0]} scale={36} far={24} blur={2.6} opacity={0.32} color="#5b5347" resolution={1024} />
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
