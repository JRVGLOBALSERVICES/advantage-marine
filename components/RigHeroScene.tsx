"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  useGLTF,
  useAnimations,
  Environment,
  AdaptiveDpr,
  ContactShadows,
  Html,
} from "@react-three/drei";
import { EffectComposer, Bloom, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group, Mesh, MeshStandardMaterial, Object3D } from "three";
import { scrollState, motionState, sceneState } from "@/lib/scroll";

/* ════════════════════════════════════════════════════════════════
   RIG HERO — EXPLODED TECHNICAL TEARDOWN (reel-tier).

   Redesign (2026-06): the earlier build scrubbed a baked *assembly*
   (parts flying together), which read as construction-chaos and
   "super huge". The jack-up GLB authors all 14 parts in their final
   ASSEMBLED rest position, so the honest, premium move is the reel's
   own signature: open ASSEMBLED, then EXPLODE on scroll into a clean
   parts diagram floating in cream negative space.

     scroll 0.00 → fully assembled — one recognizable object, lots of air
     scroll 0→0.62 → precision teardown: spud-cans drop to their corners,
                     legs spread, derrick lifts, hull anchors mid-frame
     scroll 0.62→1 → hold the exploded showcase; sonar rings pulse out

   A slow turntable runs throughout (the reel's "alive" quality). The
   GEO assembly clips are NEVER played — parts sit at authored rest and
   we offset each along an art-directed body-frame vector. Only the
   FX-Sonar ring clips ride the tail for the energy beat.

   Brand discipline (AM design.md): dark gunmetal model on warm
   sailcloth-cream — high contrast, no dark surfaces. Every luminous
   accent is teal/aqua and lives ON the model. HDRI carries the metal
   reflections; Bloom catches ONLY raw-HDR FX (threshold 1.0).
   ════════════════════════════════════════════════════════════════ */

const MODEL_URL = "/models/jackup-rig.glb";

/* Explode completes at 62% scroll so the showcase tail (sonar rings)
   gets a long pinned dwell while the exploded rig is still centred. */
const EXPLODE_SCROLL = 0.62;

/* Corner unit-directions (x,z) for the four legs / spud-cans, matched to the
   authored spud-can positions (A −x+z, B +x+z, C −x−z, D +x−z). */
const CORNER: Record<string, [number, number]> = {
  A: [-1, 1],
  B: [1, 1],
  C: [-1, -1],
  D: [1, -1],
};

/* Per-part explode vector (body frame, pre-turntable) + travel distance in
   world units. Tuned so the rig pulls apart into a readable, airy diagram —
   spud-cans sink to their corners, legs splay, derrick lifts, hull anchors. */
function explodePlan(name: string): { dir: THREE.Vector3; dist: number } | null {
  if (name.startsWith("GEO-Derrick"))
    return { dir: new THREE.Vector3(0, 1, 0), dist: 7.5 };
  if (name.startsWith("GEO-Hull"))
    return { dir: new THREE.Vector3(0, 0.25, 0).normalize(), dist: 1.6 };
  const leg = name.match(/GEO-Leg_([A-D])/);
  if (leg) {
    const [x, z] = CORNER[leg[1]];
    return { dir: new THREE.Vector3(x, 0.5, z).normalize(), dist: 6.0 };
  }
  const can = name.match(/GEO-SpudCan_([A-D])/);
  if (can) {
    const [x, z] = CORNER[can[1]];
    return { dir: new THREE.Vector3(x, -0.85, z).normalize(), dist: 7.2 };
  }
  return null;
}

/* Technical-diagram callouts — the reel's signature. Each anchors to one
   representative part node and fades in as the rig explodes, so the teardown
   reads as an engineered parts diagram, not just a model coming apart. The
   `up`/`side` nudge lifts the label clear of its part along the explode frame. */
const ANNO: { match: RegExp; label: string; sub: string; up: number; side: number }[] = [
  { match: /^GEO-Derrick/, label: "DERRICK", sub: "drilling mast", up: 2.4, side: 0 },
  { match: /^GEO-Hull/, label: "HULL · DECK", sub: "main platform", up: 1.6, side: 2.2 },
  { match: /^GEO-Leg_B/, label: "JACK-UP LEGS", sub: "lattice × 4", up: 1.4, side: 1.6 },
  { match: /^GEO-SpudCan_B/, label: "SPUD CANS", sub: "seabed footings × 4", up: 0, side: 2.0 },
];

/* Camera path — keyframes lerped by (damped) scroll. Restraint-framed: the
   assembled rig occupies ~55–65% of frame height as ONE vertical object in
   generous cream air; pulled slightly wider than the pre-explode build so the
   teardown's spread parts stay in frame. Refined eye-level 3/4, no low push —
   the turntable carries the motion. */
const CAM_KEYS: {
  at: number;
  pos: [number, number, number];
  tgt: [number, number, number];
}[] = [
  { at: 0.0, pos: [42, 27, 48], tgt: [0, 12, 0] }, // assembled establishing
  { at: 0.35, pos: [40, 25, 46], tgt: [0, 12, 0] }, // teardown begins
  { at: 0.62, pos: [40, 23, 47], tgt: [0, 11.5, 0] }, // fully exploded — wide, airy
  { at: 0.82, pos: [41, 23.5, 47], tgt: [0, 11.5, 0] }, // settle on the diagram
  { at: 1.0, pos: [42, 24.5, 48], tgt: [0, 11.5, 0] }, // slow hold drift
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

type Part = { node: Object3D; base: THREE.Vector3; offset: THREE.Vector3 };

/** The rig + the scroll-driven exploded-view teardown. */
function Rig() {
  const group = useRef<Group>(null);
  const { scene, animations } = useGLTF(MODEL_URL, true);
  const { actions, names } = useAnimations(animations, group);
  const parts = useRef<Part[]>([]);
  // annotation anchors: matched part node + its callout config (built alongside parts)
  const annos = useRef<{ node: Object3D; conf: (typeof ANNO)[number] }[]>([]);
  const annoGroups = useRef<(Group | null)[]>([]);
  const annoLabels = useRef<(HTMLDivElement | null)[]>([]);

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
    // Only the FX-Sonar ring clips ride the mixer (scrubbed in the tail). The
    // GEO assembly clips stay OFF so every part holds its authored assembled
    // pose — we drive the explode ourselves.
    sonarNames.forEach((n) => {
      const a = actions[n];
      if (a) {
        a.reset().play();
        a.paused = true;
      }
    });
    return () => sonarNames.forEach((n) => actions[n]?.stop());
  }, [actions, sonarNames]);

  // Material pass + explode-plan capture (one traversal):
  //  1. GLB steel ships near-white and vanishes on cream → cool gunmetal.
  //  2. FX meshes get raw-HDR emissive (>1.0, toneMapped off) so Bloom catches
  //     the rings + waterline and nothing else.
  //  3. Record each GEO part's base position + body-frame explode offset.
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
    const collected: Part[] = [];
    scene.traverse((o) => {
      const m = o as Mesh;
      if (m.isMesh) {
        if (o.name.startsWith("FX-Sonar")) glow(m, "#5cf0d8", 3.6);
        else if (o.name.startsWith("FX-Waterline")) glow(m, "#34c6b4", 2.2);
        else if (o.name.startsWith("GEO-")) {
          const mat = (m.material as MeshStandardMaterial).clone();
          mat.color = steel;
          mat.metalness = 0.92;
          mat.roughness = 0.4;
          m.material = mat;
          m.castShadow = true;
        }
      }
      // explode plan is keyed on the GEO node (parts are top-level GEO-* nodes)
      const plan = explodePlan(o.name);
      if (plan) {
        collected.push({
          node: o,
          base: o.position.clone(),
          offset: plan.dir.multiplyScalar(plan.dist),
        });
      }
    });
    parts.current = collected;

    // match each callout to a representative part node (first hit wins)
    annos.current = ANNO.map((conf) => {
      const hit = collected.find((c) => conf.match.test(c.node.name));
      return hit ? { node: hit.node, conf } : null;
    }).filter(Boolean) as { node: Object3D; conf: (typeof ANNO)[number] }[];

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("am:scene-ready"));
    }
  }, [scene]);

  const camPos = useRef(new THREE.Vector3());
  const camTgt = useRef(new THREE.Vector3());
  const scratch = useRef(new THREE.Vector3());
  const damped = useRef(0);
  const { camera, size } = useThree();

  useFrame((state) => {
    const target = motionState.reduced ? 1 : scrollState.progress;
    damped.current += (target - damped.current) * (motionState.reduced ? 1 : 0.12);
    const p = damped.current;

    // Slow turntable — ~0.06 rad/s. Reduced-motion freezes a clean 3/4 yaw.
    if (group.current) {
      group.current.rotation.y = motionState.reduced
        ? -0.5
        : -0.5 + state.clock.elapsedTime * 0.06;
    }

    // EXPLODE: 0 (assembled) at p=0 → 1 (full teardown) at EXPLODE_SCROLL.
    // Reduced-motion shows the assembled rig (no scroll-driven spatial motion).
    const e = motionState.reduced
      ? 0
      : smoothstep(Math.min(1, p / EXPLODE_SCROLL));
    for (const part of parts.current) {
      part.node.position.set(
        part.base.x + part.offset.x * e,
        part.base.y + part.offset.y * e,
        part.base.z + part.offset.z * e,
      );
    }

    // Annotation callouts: ride each part to its exploded position and fade in
    // with the teardown (hidden when assembled / reduced-motion). The label
    // lifts clear of its part along the outward explode frame.
    const tmp = scratch.current;
    for (let i = 0; i < annos.current.length; i++) {
      const { node, conf } = annos.current[i];
      const g = annoGroups.current[i];
      if (g) {
        tmp.set(node.position.x, 0, node.position.z);
        if (tmp.lengthSq() > 1e-4) tmp.normalize();
        g.position.set(
          node.position.x + tmp.x * conf.side,
          node.position.y + conf.up,
          node.position.z + tmp.z * conf.side,
        );
      }
      const l = annoLabels.current[i];
      if (l) l.style.opacity = String(e * e); // ease-in, lags the spread slightly
    }

    // Sonar tail: 0.62→1 scrubs the ring clips so they expand as the showcase
    // dwells on the exploded diagram.
    const sp = p <= EXPLODE_SCROLL ? 0 : (p - EXPLODE_SCROLL) / (1 - EXPLODE_SCROLL);
    sonarNames.forEach((n) => {
      const a = actions[n];
      if (a) a.time = Math.min(sp * sonarDur, a.getClip().duration);
    });

    // Camera along the keyframe path; portrait pull-back so the spread fits.
    sampleCam(p, camPos.current, camTgt.current);
    const aspect = size.width / Math.max(size.height, 1);
    const distMul = aspect < 1 ? 1 + (1 - aspect) * 0.45 : 1;
    camera.position.copy(camPos.current).multiplyScalar(distMul);
    camera.lookAt(camTgt.current);
  });

  return (
    <group ref={group}>
      <primitive object={scene} />

      {/* technical-diagram callouts — billboarded, non-occluded, fade in on explode */}
      {ANNO.map((conf, i) => (
        <group key={conf.label} ref={(el) => { annoGroups.current[i] = el; }}>
          <Html
            center
            sprite
            transform
            distanceFactor={26}
            occlude={false}
            zIndexRange={[10, 0]}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div
              ref={(el) => { annoLabels.current[i] = el; }}
              style={{ opacity: 0, whiteSpace: "nowrap", transform: "translateX(8px)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "999px",
                    background: "#34c6b4",
                    boxShadow: "0 0 8px #5cf0d8",
                    flex: "0 0 auto",
                  }}
                />
                <span
                  style={{
                    height: "1px",
                    width: "26px",
                    background: "linear-gradient(90deg,#34c6b4,transparent)",
                  }}
                />
                <span>
                  <span
                    style={{
                      display: "block",
                      color: "#234b47",
                      fontFamily: "var(--font-display), Georgia, serif",
                      fontWeight: 700,
                      fontSize: "13px",
                      letterSpacing: "0.08em",
                      lineHeight: 1.1,
                    }}
                  >
                    {conf.label}
                  </span>
                  <span
                    style={{
                      display: "block",
                      color: "#30837b",
                      fontSize: "8.5px",
                      letterSpacing: "0.26em",
                      textTransform: "uppercase",
                      marginTop: "2px",
                    }}
                  >
                    {conf.sub}
                  </span>
                </span>
              </div>
            </div>
          </Html>
        </group>
      ))}
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
      camera={{ position: [42, 27, 48], fov: 38, near: 0.1, far: 600 }}
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
      {/* fog matched to the restraint-framed (further) camera — keeps the rig
          crisp with a soft cream falloff behind for depth. */}
      <fog attach="fog" args={["#F4EBD9", 86, 200]} />

      <Suspense fallback={null}>
        <hemisphereLight args={["#ffffff", "#ECDFC7", 0.9]} />
        <directionalLight position={[18, 30, 14]} intensity={1.7} color="#fff6e6" />
        <directionalLight position={[-18, 12, -14]} intensity={0.5} color="#9fd0c8" />
        <Environment preset="warehouse" environmentIntensity={0.7} />

        <Rig />

        {/* ground the rig so it doesn't float / read flat on cream */}
        <ContactShadows
          position={[0, 0.02, 0]}
          scale={64}
          far={44}
          blur={2.8}
          opacity={0.38}
          color="#5b5347"
          resolution={1024}
        />
        <AdaptiveDpr pixelated />

        {/* FX glow — only the raw-HDR emissive FX (>1.0) bloom; the bright cream
            stage and the lit steel stay clean. ToneMapping LAST (skill §2). */}
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
