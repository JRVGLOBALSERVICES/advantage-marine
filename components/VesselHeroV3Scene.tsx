"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, AdaptiveDpr, ContactShadows } from "@react-three/drei";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { Group, Mesh, MeshStandardMaterial, AnimationClip } from "three";
import { scrollState, motionState, sceneState } from "@/lib/scroll";

/* ════════════════════════════════════════════════════════════════
   VESSEL HERO v3 SCENE — baked-action scrub (2026-06-05).

   The Blender-authored research vessel (vessel-v3.glb, 54 named meshes,
   de-Lego'd: shade-smooth + angle-limited bevel + rounder superstructure
   corners) carries its OWN explode rig as baked glTF animation. The Blender
   5.1 slotted-action exporter split the rig into one clip PER object
   (`GEO-v3-*Action`), so we play the WHOLE `animations[]` array through a
   single AnimationMixer and scrub every clip in lockstep with one
   `mixer.setTime()` — no procedural offset table, no per-part hand-tuning.

   Scrub maps scroll → assembly. DIRECTION === "assemble" (default) reads the
   way the home narrative + the reference reel read: enter on the exploded
   field of parts, scroll the vessel TOGETHER. Flip to "explode" to reverse.

   Materials ship in the GLB (MAT-v3-*: silver hull, green livery, glass,
   white house) — carried by the studio HDRI, not repainted here (one accent
   doing the heavy lifting; restraint is the look). The baked `GEO-v3-sea`
   plane is hidden on mount so the hull sits in R3F's own contact shadow.
   ════════════════════════════════════════════════════════════════ */

const MODEL_URL = "/models/vessel-v3.glb";
const DIRECTION: "assemble" | "explode" = "assemble";

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

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

function Vessel({ onMeasured }: { onMeasured: (b: Box) => void }) {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL, true) as unknown as {
    scene: THREE.Group;
    animations: AnimationClip[];
  };

  const mixer = useMemo(() => new THREE.AnimationMixer(scene), [scene]);
  const duration = useMemo(
    () => animations.reduce((m, c) => Math.max(m, c.duration), 0) || 1,
    [animations],
  );

  const box = useRef<Box>({
    c: new THREE.Vector3(),
    maxDim: 14,
    cy: 2,
    floorY: -2.5,
    sx: 14,
  });

  useEffect(() => {
    // play every baked clip; we scrub time manually, so LoopOnce + clamp the
    // ends (setTime past the last keyframe holds the final pose, not wrap).
    for (const clip of animations) {
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
    }
    mixer.setTime(DIRECTION === "assemble" ? duration : 0);

    // hide the baked sea plane — the page sits the ship on R3F contact shadow
    const sea = scene.getObjectByName("GEO-v3-sea");
    if (sea) sea.visible = false;

    // measure the visible hull (exclude the hidden sea) for camera framing
    const bbox = new THREE.Box3();
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh || o.name === "GEO-v3-sea") return;
      bbox.expandByObject(m);
      m.castShadow = true;
      m.receiveShadow = true;
      // trust baked PBR; just lift env response a touch on the silver hull
      const mat = m.material as MeshStandardMaterial;
      if (mat && "envMapIntensity" in mat) mat.envMapIntensity = 1.0;
    });
    const c = new THREE.Vector3();
    bbox.getCenter(c);
    const size = new THREE.Vector3();
    bbox.getSize(size);
    box.current = {
      c,
      maxDim: Math.max(size.x, size.y, size.z),
      cy: (bbox.max.y + bbox.min.y) / 2,
      floorY: bbox.min.y - 0.05,
      sx: size.x,
    };
    onMeasured(box.current);

    if (typeof window !== "undefined")
      window.dispatchEvent(new Event("am:scene-ready"));

    return () => {
      mixer.stopAllAction();
    };
  }, [scene, animations, mixer, duration, onMeasured]);

  const camPos = useRef(new THREE.Vector3());
  const camTgt = useRef(new THREE.Vector3());
  const damped = useRef(DIRECTION === "assemble" ? 0 : 0);
  const { camera, size } = useThree();
  const DIR = useMemo(() => new THREE.Vector3(0.62, 0.4, 1.0).normalize(), []);

  useFrame((state) => {
    const target = motionState.reduced ? 0.5 : clamp01(progressNow());
    damped.current += (target - damped.current) * (motionState.reduced ? 1 : 0.1);
    const p = damped.current;

    // scrub all baked clips. assemble: p 0→1 maps time dur→0 (exploded→whole)
    const tNorm = DIRECTION === "assemble" ? 1 - p : p;
    mixer.setTime(tNorm * duration);

    // "spread" = how blown-apart the ship is (1 exploded → 0 assembled), used
    // only to widen the camera when the parts are scattered.
    const spread = motionState.reduced ? 0 : tNorm;

    // continuous slow turntable on the WRAPPING group, so it composes with the
    // baked local-space explode rather than fighting it.
    if (group.current) {
      group.current.rotation.y = motionState.reduced
        ? 0.5
        : 0.5 + state.clock.elapsedTime * 0.05;
    }

    const { c, maxDim, cy } = box.current;
    const aspect = size.width / Math.max(size.height, 1);

    // landscape framing keys off maxDim; portrait pulls back to fit the long
    // axis inside the (smaller) horizontal fov so the ship never overflows.
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
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function VesselHeroV3Scene({
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
          onMeasured={(b) => {
            setFloorY(b.floorY);
            setSx(b.sx);
          }}
        />

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
