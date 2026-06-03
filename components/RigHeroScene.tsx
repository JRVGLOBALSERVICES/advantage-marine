"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  Environment,
  AdaptiveDpr,
  ContactShadows,
} from "@react-three/drei";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group, Mesh, MeshStandardMaterial } from "three";
import { scrollState, motionState, sceneState } from "@/lib/scroll";

/* ════════════════════════════════════════════════════════════════
   RIG HERO — scroll-driven assembly of the jack-up platform, built
   part-by-part in Blender (hull → legs → spud-cans → derrick), Draco-
   exported with the baked timeline riding along, then scrubbed here.

   This replaces the earlier platform/thruster showcase. The reel's
   "build → showcase → FX" arc is preserved: the first 58% of scroll
   assembles the rig, the tail plays the baked showcase (sonar rings +
   waterline glow), and a keyframed camera replaces the Blender orbit
   (which is scene-only and doesn't bake into the GLB).

   Brand discipline (AM design.md): the rig reads as a dark gunmetal
   model on the warm sailcloth-cream stage — high contrast, no dark
   surfaces. Every luminous accent is teal/aqua and lives ON the model
   (sonar/waterline), never sharing the heading hue. HDRI carries the
   metal reflections; Bloom catches ONLY the raw-HDR FX (threshold 1.0)
   so the cream stage and lit steel stay clean.
   ════════════════════════════════════════════════════════════════ */

const MODEL_URL = "/models/jackup-rig.glb";

/* Fraction of the 250-frame bake spent assembling (hull→legs→spudcans→
   derrick finishes ~F160 → 0.64). */
const ASSEMBLY_FRAC = 0.64;
/* Assembly completes at 58% scroll so the showcase tail (sonar + waterline,
   baked F160→250) gets a long pinned dwell while the rig is still centred —
   verified in the browser test; mapping it to 72% fired the FX as the sticky
   hero scrolled off. */
const ASSEMBLY_SCROLL = 0.58;

/* Camera path — keyframes lerped by (damped) scroll progress. Rig is a tall
   vertical assembly centred ≈ (0, 13, 0).

   RESTRAINT PASS (reel-tier): the earlier path framed the rig at ~90% of
   viewport height — it overflowed and read "super huge". These keyframes sit
   ~1.5× further out so the tall rig occupies ~55–68% of frame height as ONE
   vertical object in generous cream air (copy lives in the horizontal space,
   lusion / igloo / activetheory restraint). The aggressive low-angle hero beat
   is softened to a refined eye-level 3/4 — the slow turntable (added in Rig)
   carries the "alive" quality the low push used to fake. */
const CAM_KEYS: {
  at: number;
  pos: [number, number, number];
  tgt: [number, number, number];
}[] = [
  { at: 0.0, pos: [40, 27, 46], tgt: [0, 12, 0] }, // wide establishing — exploded, lots of air
  { at: 0.35, pos: [37, 24, 43], tgt: [0, 12.5, 0] }, // easing in — legs seating
  { at: 0.62, pos: [34, 20, 41], tgt: [0, 13, 0] }, // refined 3/4 — derrick topping out (NOT a low push)
  { at: 0.82, pos: [36, 21.5, 42], tgt: [0, 12.5, 0] }, // settle — hero 3/4
  { at: 1.0, pos: [37, 22.5, 43], tgt: [0, 12.5, 0] }, // slow hold drift
];

const smoothstep = (t: number) => t * t * (3 - 2 * t);

function sampleCam(p: number, outPos: THREE.Vector3, outTgt: THREE.Vector3) {
  let a = CAM_KEYS[0];
  let b = CAM_KEYS[CAM_KEYS.length - 1];
  for (let i = 0; i < CAM_KEYS.length - 1; i++) {
    if (p >= CAM_KEYS[i].at && p <= CAM_KEYS[i + 1].at) {
      a = CAM_KEYS[i];
      b = CAM_KEYS[i + 1];
      break;
    }
  }
  const span = b.at - a.at || 1;
  const t = smoothstep(Math.min(1, Math.max(0, (p - a.at) / span)));
  outPos.set(
    a.pos[0] + (b.pos[0] - a.pos[0]) * t,
    a.pos[1] + (b.pos[1] - a.pos[1]) * t,
    a.pos[2] + (b.pos[2] - a.pos[2]) * t,
  );
  outTgt.set(
    a.tgt[0] + (b.tgt[0] - a.tgt[0]) * t,
    a.tgt[1] + (b.tgt[1] - a.tgt[1]) * t,
    a.tgt[2] + (b.tgt[2] - a.tgt[2]) * t,
  );
}

/** The rig + the scroll-driven scrub of its baked assembly timeline. */
function Rig() {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL, true);
  const { actions, names } = useAnimations(animations, group);

  const fullDur = useMemo(
    () => animations.reduce((m, c) => Math.max(m, c.duration), 0),
    [animations],
  );
  const assemblyDur = fullDur * ASSEMBLY_FRAC;

  useEffect(() => {
    // Put every clip on the mixer, then PAUSE so we can scrub time by scroll.
    // (three.js refuses to advance a PAUSED action via setTime — so we set each
    // action's absolute .time per frame instead and let drei apply the pose.)
    names.forEach((n) => {
      const a = actions[n];
      if (a) {
        a.reset().play();
        a.paused = true;
      }
    });
    return () => names.forEach((n) => actions[n]?.stop());
  }, [actions, names]);

  // Material pass — two jobs the browser test proved necessary:
  //  1. The GLB steel ships near-white and DISAPPEARS on cream — give it a cool
  //     gunmetal so the rig reads as a dark architectural model on sailcloth.
  //  2. FX meshes need raw-HDR emissive (>1.0, toneMapped off) so Bloom catches
  //     the rings + waterline — and nothing else.
  useEffect(() => {
    const glow = (m: Mesh, hex: string, intensity: number) => {
      const mat = (m.material as MeshStandardMaterial).clone();
      mat.emissive = new THREE.Color(hex);
      mat.emissiveIntensity = intensity;
      mat.toneMapped = false;
      mat.transparent = true;
      m.material = mat;
    };
    const steel = new THREE.Color("#586068"); // cool gunmetal
    scene.traverse((o) => {
      const m = o as Mesh;
      if (!m.isMesh) return;
      if (o.name.startsWith("FX-Sonar")) glow(m, "#5cf0d8", 3.6); // aqua sonar
      else if (o.name.startsWith("FX-Waterline")) glow(m, "#34c6b4", 2.2); // teal waterline
      else if (o.name.startsWith("GEO-")) {
        const mat = (m.material as MeshStandardMaterial).clone();
        mat.color = steel;
        mat.metalness = 0.92;
        mat.roughness = 0.4;
        m.material = mat;
        m.castShadow = true;
      }
    });
    // release the branded SceneBuildLoader once the rig is set up
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("am:scene-ready"));
    }
  }, [scene]);

  const camPos = useRef(new THREE.Vector3());
  const camTgt = useRef(new THREE.Vector3());
  const damped = useRef(0); // buttery local scroll progress
  const { camera, size } = useThree();

  useFrame((state) => {
    // Damp toward the ScrollTrigger-written progress for a smooth scrub even on
    // coarse wheel/touch deltas (frameloop="always" keeps this advancing).
    const target = motionState.reduced ? 1 : scrollState.progress;
    damped.current += (target - damped.current) * (motionState.reduced ? 1 : 0.12);
    const p = damped.current;

    // Slow turntable — the reel's "alive" quality. ~0.06 rad/s ≈ a full turn
    // every ~105s: barely perceptible per frame, premium over a long dwell.
    // Reduced-motion freezes it at a clean 3/4 yaw so the static read stays.
    if (group.current) {
      group.current.rotation.y = motionState.reduced
        ? -0.5
        : -0.5 + state.clock.elapsedTime * 0.06;
    }

    // Two-stage scrub on ONE timeline. 0→58% plays the assembly (ends ~F160);
    // 58→100% plays the showcase tail (F160→250) where the sonar rings expand
    // and the waterline pulses. Each clip stays PAUSED; we set absolute .time.
    let aT: number;
    if (p <= ASSEMBLY_SCROLL) {
      aT = (p / ASSEMBLY_SCROLL) * assemblyDur;
    } else {
      const sp = (p - ASSEMBLY_SCROLL) / (1 - ASSEMBLY_SCROLL);
      aT = assemblyDur + sp * (fullDur - assemblyDur);
    }
    names.forEach((n) => {
      const a = actions[n];
      if (a) a.time = Math.min(aT, a.getClip().duration);
    });

    // Camera along the keyframe path; pull back in portrait so the tall rig fits.
    sampleCam(p, camPos.current, camTgt.current);
    const aspect = size.width / Math.max(size.height, 1);
    // Portrait pullback so the tall rig fits — gentler factor now the base
    // distances are already restraint-framed (over-shrinking on mobile reads
    // as a toy; the base framing does most of the work).
    const distMul = aspect < 1 ? 1 + (1 - aspect) * 0.4 : 1;
    camera.position.copy(camPos.current).multiplyScalar(distMul);
    camera.lookAt(camTgt.current);
  });

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  );
}

export default function RigHeroScene({
  onContextLost,
}: {
  onContextLost?: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop="always"
      camera={{ position: [27, 21, 31], fov: 38, near: 0.1, far: 600 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
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
      {/* warm sailcloth-cream stage to match the AM brand (no dark surfaces);
          the HDRI still carries the metal reflections. */}
      <color attach="background" args={["#F4EBD9"]} />
      {/* fog pushed out to match the restraint-framed (further) camera — near 48
          would have hazed the now-distant rig; this keeps it crisp with a soft
          cream falloff behind for depth. */}
      <fog attach="fog" args={["#F4EBD9", 82, 190]} />

      <Suspense fallback={null}>
        <hemisphereLight args={["#ffffff", "#ECDFC7", 0.9]} />
        <directionalLight position={[18, 30, 14]} intensity={1.7} color="#fff6e6" />
        <directionalLight position={[-18, 12, -14]} intensity={0.5} color="#9fd0c8" />
        <Environment preset="warehouse" environmentIntensity={0.7} />

        <Rig />

        {/* ground the rig so it doesn't float / read flat on cream */}
        <ContactShadows
          position={[0, 0.02, 0]}
          scale={58}
          far={40}
          blur={2.8}
          opacity={0.4}
          color="#5b5347"
          resolution={1024}
        />
        <AdaptiveDpr pixelated />

        {/* FX glow — only the raw-HDR emissive FX (>1.0) bloom; the bright cream
            stage (≈0.9) and the lit steel stay clean. ToneMapping LAST (skill §2). */}
        <EffectComposer multisampling={4}>
          <Bloom
            intensity={1.15}
            luminanceThreshold={1.0}
            luminanceSmoothing={0.2}
            radius={0.7}
            mipmapBlur
          />
          <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        </EffectComposer>
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL, true);
