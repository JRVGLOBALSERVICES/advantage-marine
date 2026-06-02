"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  useGLTF,
  MeshReflectorMaterial,
  Html,
} from "@react-three/drei";
import { Suspense, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { scrollState, motionState, sceneState, window01, smooth } from "@/lib/scroll";

/* ════════════════════════════════════════════════════════════════
   PLATFORM HERO — scroll-driven product showcase of the offshore rig,
   choreographed to match the reference reel (the jet-engine scroll
   site) but adapted to THIS asset and brand:

     · beat 0 — assembled fade-in + a keel-up CONSTRUCTION SWEEP.
       The reel "explodes" the engine into separate parts; this GLB
       is a single FUSED mesh (no casing/leg/deck sub-objects), so a
       literal part-explode can only smear it. Instead a clip-plane
       reveals the structure from the waterline up — it builds itself.
     · beat 0→1 — in-water CURRENT streaks drift past (the reel's
       green "airflow", re-read as tidal flow around the jacket).
     · beat 1 — a ground plane slides up and a pulsing SEGMENTED RING
       draws on around the base (the reel's purple ground ring).
     · beat 2 — camera pulls back/up and a SONAR field sweeps with
       port blips lighting in sequence (the reel's world-map line-draw,
       re-read as on-brand sonar — never a generic rotating globe).

   COLOUR DISCIPLINE (Rj's note: accents must not blend with the type):
   every luminous accent here lives ON or AROUND the model in teal/cyan.
   The page headings stay dark ink — the glow never shares the heading
   hue, and the FX sit centre/right, clear of the bottom-left copy.
   ════════════════════════════════════════════════════════════════ */

const FIT_SIZE = 4.0; // longest axis fit, world units — tall jacket structure
const MODEL_URL = "/models/platform-v2.glb";
const ACCENT = "#39b8ab"; // brand teal — the ONLY accent hue in the scene
const ACCENT_HI = "#7ff0e2"; // luminous highlight for draw-on FX

/* model vertical span after normalisation (FIT_SIZE / longest axis) — used to
   drive the keel-up clip sweep and to sit the ground plane just under the base */
const Y_MIN = -2.05;
const Y_MAX = 2.25;
const GROUND_Y = -1.9;

function Platform() {
  const { scene } = useGLTF(MODEL_URL);
  const groupRef = useRef<THREE.Group>(null!);
  // keel-up construction clip: keep fragments BELOW the rising threshold
  // (normal -Y), animate constant from below the keel to above the deck.
  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(0, -1, 0), -Y_MIN), []);
  // construction sweep runs as a TIME-based intro on mount (≈1.3s) — NOT off
  // scroll — so the rig is fully assembled before the loader ever reveals the
  // hero. Driving it off scroll left the top of the page near-blank. Matches
  // the reel: object fades in already built, then the scene animates.
  const intro = useRef(0);

  useEffect(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const longest = Math.max(size.x, size.y, size.z) || 1;
    const s = FIT_SIZE / longest;
    scene.position.set(-center.x, -center.y, -center.z);
    scene.scale.setScalar(s);
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          if ("envMapIntensity" in mat) mat.envMapIntensity = 1.1;
          // wire the construction clip onto the shared material
          mat.clippingPlanes = [clip];
          mat.clipShadows = true;
          mat.needsUpdate = true;
        }
        const g = mesh.geometry as THREE.BufferGeometry;
        if (!g.attributes.normal) g.computeVertexNormals();
      }
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("am:scene-ready"));
    }
  }, [scene, clip]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    const p = scrollState.progress;

    // reduced-motion → fully built, no animation.
    // plane normal is (0,-1,0): three.js keeps `normal·P + constant ≥ 0`, i.e.
    // keeps fragments where P.y ≤ constant. So constant = the reveal threshold.
    if (motionState.reduced) {
      clip.constant = Y_MAX + 0.5; // threshold above the deck → reveal everything
      groupRef.current.position.y = 0;
      return;
    }

    // keel-up construction sweep — time-based intro, completes in ~1.3s while
    // the loader still covers the frame, so the hero is never revealed blank.
    intro.current = Math.min(1, intro.current + dt / 1.3);
    const build = smooth(intro.current);
    const threshold = THREE.MathUtils.lerp(Y_MIN - 0.15, Y_MAX + 0.4, build);
    clip.constant = threshold; // keep where P.y ≤ threshold → builds bottom-up

    // slow showcase rotation — eases up subtly as you scroll in
    const spin = window01(p, 0.0, 1);
    groupRef.current.rotation.y += dt * (0.06 + 0.1 * spin);
    // gentle bob "in the water"
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    if (intro.current < 1) state.invalidate();
    state.invalidate();
  });

  return (
    <group ref={groupRef} rotation={[0, -0.5, 0]}>
      <primitive object={scene} />
    </group>
  );
}

/* ---------- contextual backlight glow — swells per narrative beat ---------- */
function BeatGlow() {
  const lightRef = useRef<THREE.PointLight>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    const p = scrollState.progress;
    const a = smooth(window01(p, 0.0, 0.5)) * (1 - smooth(window01(p, 0.5, 0.62)));
    const b = smooth(window01(p, 0.62, 0.72)) * (1 - smooth(window01(p, 0.82, 0.9)));
    const c = smooth(window01(p, 0.86, 0.97));
    const env = Math.max(a, b, c);
    if (lightRef.current) lightRef.current.intensity = 6 + env * 22;
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.12 + env * 0.4;
      glowRef.current.scale.setScalar(2.6 + env * 1.4);
    }
  });
  return (
    <group position={[0.4, 0.4, -2.4]}>
      <pointLight ref={lightRef} color={ACCENT} intensity={6} distance={18} decay={2} />
      <mesh ref={glowRef}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color={ACCENT_HI} transparent opacity={0.18} depthWrite={false} />
      </mesh>
    </group>
  );
}

/* ---------- in-water current streaks (beat 0→1) — the reel's "airflow" ---------- */
const STREAKS = 16;
function CurrentStreaks() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: STREAKS }, (_, i) => ({
        y: -1.4 + (i / STREAKS) * 3.2,
        z: -1.2 + ((i * 53) % 24) / 10,
        speed: 0.5 + ((i * 17) % 10) / 12,
        len: 0.6 + ((i * 31) % 10) / 14,
        off: (i * 0.37) % 1,
      })),
    []
  );
  useFrame((state) => {
    const inst = ref.current;
    if (!inst) return;
    const p = scrollState.progress;
    // present through the early/mid beats, gone before the sonar pull-back
    const vis = smooth(window01(p, 0.32, 0.5)) * (1 - smooth(window01(p, 0.78, 0.9)));
    const t = state.clock.elapsedTime;
    const mat = inst.material as THREE.MeshBasicMaterial;
    mat.opacity = 0.0 + vis * 0.5;
    for (let i = 0; i < STREAKS; i++) {
      const s = seeds[i];
      const x = ((t * s.speed + s.off) % 2.4) * 3.2 - 4.0; // drift left→right, wrap
      dummy.position.set(x, s.y, s.z);
      dummy.scale.set(s.len * (0.4 + vis), 0.012, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (vis > 0.001) state.invalidate();
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, STREAKS]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={ACCENT_HI}
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

/* ---------- ground plane + pulsing segmented ring (beat 1) ---------- */
const SEGMENTS = 44;
function GroundRing() {
  const planeRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Group>(null!);
  const segRefs = useRef<THREE.Mesh[]>([]);
  const segs = useMemo(() => Array.from({ length: SEGMENTS }, (_, i) => i), []);

  useFrame((state) => {
    const p = scrollState.progress;
    // window: slide up + draw-on between 0.6→0.84, hold, fade before sonar
    const win = smooth(window01(p, 0.6, 0.84));
    const fade = 1 - smooth(window01(p, 0.9, 0.98));
    const vis = win * fade;
    const t = state.clock.elapsedTime;

    if (planeRef.current) {
      planeRef.current.position.y = THREE.MathUtils.lerp(GROUND_Y - 2.0, GROUND_Y, win);
      const pm = planeRef.current.material as THREE.MeshBasicMaterial;
      pm.opacity = vis * 0.22;
    }
    if (ringRef.current) {
      const reveal = Math.floor(win * SEGMENTS);
      for (let i = 0; i < SEGMENTS; i++) {
        const seg = segRefs.current[i];
        if (!seg) continue;
        const on = i <= reveal ? 1 : 0;
        // radial pulse travelling around the ring
        const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 - (i / SEGMENTS) * Math.PI * 2);
        const m = seg.material as THREE.MeshBasicMaterial;
        m.opacity = on * vis * (0.35 + pulse * 0.6);
        seg.scale.y = 0.5 + pulse * 0.9;
      }
    }
    if (vis > 0.001) state.invalidate();
  });

  const radius = 2.4;
  return (
    <group position={[0, GROUND_Y + 0.02, 0]}>
      {/* faint disc the ring sits on */}
      <mesh ref={planeRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y, 0]}>
        <circleGeometry args={[radius * 1.5, 64]} />
        <meshBasicMaterial color={ACCENT} transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* segmented ring */}
      <group ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        {segs.map((i) => {
          const ang = (i / SEGMENTS) * Math.PI * 2;
          return (
            <mesh
              key={i}
              ref={(el) => {
                if (el) segRefs.current[i] = el;
              }}
              position={[Math.cos(ang) * radius, Math.sin(ang) * radius, 0]}
              rotation={[0, 0, ang]}
            >
              <planeGeometry args={[0.05, 0.22]} />
              <meshBasicMaterial
                color={ACCENT_HI}
                transparent
                opacity={0}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

/* ---------- sonar field + port blips (beat 2) — the reel's reach map ---------- */
const PORTS = [
  { a: 0.0, r: 1.0, label: "Johor" },
  { a: 1.05, r: 1.7, label: "Singapore" },
  { a: 2.1, r: 2.4, label: "Miri" },
  { a: 3.3, r: 1.4, label: "K. Lumpur" },
  { a: 4.4, r: 2.2, label: "Offshore" },
  { a: 5.4, r: 1.1, label: "Field" },
];
function SonarField() {
  const groupRef = useRef<THREE.Group>(null!);
  const sweepRef = useRef<THREE.Mesh>(null!);
  const ringRefs = useRef<THREE.Mesh[]>([]);
  const blipRefs = useRef<THREE.Mesh[]>([]);
  const rings = useMemo(() => [0, 1, 2], []);

  useFrame((state) => {
    const p = scrollState.progress;
    const vis = smooth(window01(p, 0.86, 1.0));
    const t = state.clock.elapsedTime;
    if (groupRef.current) groupRef.current.position.y = THREE.MathUtils.lerp(GROUND_Y - 1.2, GROUND_Y, vis);

    // expanding concentric rings
    ringRefs.current.forEach((m, i) => {
      if (!m) return;
      const phase = (t * 0.4 + i / rings.length) % 1;
      const sc = 0.4 + phase * 2.6;
      m.scale.setScalar(sc);
      const mm = m.material as THREE.MeshBasicMaterial;
      mm.opacity = vis * (1 - phase) * 0.5;
    });
    // rotating sweep arm
    if (sweepRef.current) {
      sweepRef.current.rotation.z = -t * 1.1;
      (sweepRef.current.material as THREE.MeshBasicMaterial).opacity = vis * 0.28;
    }
    // port blips light in sequence as the sweep passes
    blipRefs.current.forEach((m, i) => {
      if (!m) return;
      const seq = smooth(window01(p, 0.88 + i * 0.012, 0.94 + i * 0.012));
      const ping = 0.5 + 0.5 * Math.sin(t * 3 - i);
      const mm = m.material as THREE.MeshBasicMaterial;
      mm.opacity = vis * seq * (0.5 + ping * 0.5);
      m.scale.setScalar(0.06 + seq * 0.05 + ping * 0.02);
    });
    if (vis > 0.001) state.invalidate();
  });

  return (
    <group ref={groupRef} position={[0, GROUND_Y, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {rings.map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) ringRefs.current[i] = el;
          }}
        >
          <ringGeometry args={[1.18, 1.24, 72]} />
          <meshBasicMaterial color={ACCENT} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
      {/* sweep arm — a thin triangle fan */}
      <mesh ref={sweepRef}>
        <circleGeometry args={[3.0, 32, 0, 0.5]} />
        <meshBasicMaterial color={ACCENT_HI} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
      </mesh>
      {PORTS.map((port, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) blipRefs.current[i] = el;
          }}
          position={[Math.cos(port.a) * port.r, Math.sin(port.a) * port.r, 0.01]}
        >
          <circleGeometry args={[1, 16]} />
          <meshBasicMaterial color={ACCENT_HI} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- cream water plane the rig stands in ---------- */
function Ocean() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.0, 0]}>
      <planeGeometry args={[80, 80]} />
      <MeshReflectorMaterial
        resolution={512}
        mixBlur={1.2}
        mixStrength={6}
        roughness={0.85}
        depthScale={0.8}
        minDepthThreshold={0.3}
        maxDepthThreshold={1.2}
        color="#EBE0C8"
        metalness={0.18}
        mirror={0.35}
      />
    </mesh>
  );
}

/* ---------- billboarded ADVANTAGE MARINE tag (fades in as camera settles) ---------- */
function AdvantageTag() {
  const wrapRef = useRef<HTMLDivElement>(null!);
  useFrame(() => {
    const p = scrollState.progress;
    // present once the rig is built, gone before the sonar pull-back
    const o = smooth(window01(p, 0.5, 0.62)) * (1 - smooth(window01(p, 0.82, 0.9)));
    if (wrapRef.current) wrapRef.current.style.opacity = String(o);
  });
  return (
    <Html
      position={[0, 2.5, 0]}
      center
      transform
      sprite
      distanceFactor={6}
      style={{ pointerEvents: "none" }}
      zIndexRange={[0, 0]}
    >
      <div ref={wrapRef} style={{ opacity: 0, textAlign: "center", whiteSpace: "nowrap" }}>
        <div
          className="font-display"
          style={{
            color: "#234b47",
            fontWeight: 700,
            fontSize: "26px",
            letterSpacing: "0.1em",
            lineHeight: 1.1,
          }}
        >
          ADVANTAGE MARINE
        </div>
        <div
          style={{
            color: "#30837b",
            fontSize: "9px",
            letterSpacing: "0.34em",
            marginTop: "6px",
            textTransform: "uppercase",
          }}
        >
          In-water Marine &amp; Offshore Services
        </div>
      </div>
    </Html>
  );
}

/* ---------- scroll-driven camera: wide establish → settle → ring → pull-back ---------- */
function CameraRig() {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.3, 0));
  const kpos = useMemo(
    () => [
      new THREE.Vector3(0.5, 2.8, 10.6), // 0.00 wide — full jacket, slightly high
      new THREE.Vector3(0.1, 1.1, 6.6), // 0.52 settled hero, rig mid-frame
      new THREE.Vector3(-1.5, 0.8, 5.7), // 0.80 push in + left for the ring beat
      new THREE.Vector3(0.2, 3.8, 10.4), // 1.00 pull back + up, sonar field below
    ],
    []
  );
  const ktgt = useMemo(
    () => [
      new THREE.Vector3(0, 0.3, 0),
      new THREE.Vector3(0, 0.3, 0),
      new THREE.Vector3(0, -0.4, 0),
      new THREE.Vector3(0, -1.2, 0), // tilt down to the sonar field
    ],
    []
  );
  const stops = useMemo(() => [0, 0.52, 0.8, 1], []);

  useFrame(() => {
    const p = scrollState.progress;
    let seg = 0;
    while (seg < stops.length - 2 && p > stops[seg + 1]) seg++;
    const t = smooth(window01(p, stops[seg], stops[seg + 1]));
    const aspect = size.width / Math.max(size.height, 1);
    const distMul = aspect < 1 ? 1 + (1 - aspect) * 0.9 : 1;
    const pos = kpos[seg].clone().lerp(kpos[seg + 1], t).multiplyScalar(distMul);
    camera.position.lerp(pos, 0.1);
    target.current.lerp(ktgt[seg].clone().lerp(ktgt[seg + 1], t), 0.1);
    camera.lookAt(target.current);
  });
  return null;
}

export default function PlatformHeroScene({
  onContextLost,
}: {
  onContextLost?: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop="always"
      gl={{ antialias: true, powerPreference: "high-performance", localClippingEnabled: true }}
      camera={{ position: [0.5, 2.8, 10.6], fov: 40, near: 0.1, far: 200 }}
      onCreated={({ gl, invalidate }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.localClippingEnabled = true;
        sceneState.invalidate = invalidate;
        gl.domElement.addEventListener(
          "webglcontextlost",
          (e) => {
            e.preventDefault();
            onContextLost?.();
          },
          { once: true }
        );
      }}
    >
      {/* cream backdrop + fog — matches the page, no cool-white rectangle */}
      <color attach="background" args={["#F6EFE1"]} />
      <fog attach="fog" args={["#F6EFE1", 16, 38]} />

      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 8, 4]} intensity={2.0} color="#fff7e8" />
        <directionalLight position={[-5, 3, -3]} intensity={0.6} color="#bfeee6" />

        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2.6} position={[4, 5, 4]} scale={6} color="#eafff9" />
          <Lightformer form="rect" intensity={1.4} position={[-4, 2, -3]} scale={5} color="#bfeee6" />
          <Lightformer form="ring" intensity={1.8} position={[0, 4, 6]} scale={3} color="#ffffff" />
        </Environment>

        <Platform />
        <BeatGlow />
        <CurrentStreaks />
        <GroundRing />
        <SonarField />
        <Ocean />
        <AdvantageTag />
        <CameraRig />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
