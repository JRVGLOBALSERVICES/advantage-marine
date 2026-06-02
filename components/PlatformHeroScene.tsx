"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Environment,
  Lightformer,
  useGLTF,
  MeshReflectorMaterial,
} from "@react-three/drei";
import { Suspense, useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import { scrollState, motionState, sceneState, window01, smooth } from "@/lib/scroll";

/* ════════════════════════════════════════════════════════════════
   PLATFORM HERO — scroll-driven product showcase of the offshore rig,
   choreographed to MATCH the reference reel (the Rolls-Royce jet-engine
   3D site) one-for-one, with the rig standing in for the turbine.

   The reel has two in-canvas acts (a third — "Global Reach" — lives in
   the GlobalReach section that follows):

     ACT 1 — "Efficiency".  Object sits RIGHT, headline left, slow
       showcase rotation. A directed THRUST STREAM blows downstream off
       the body (the reel's green exhaust → re-read as a teal current
       jet around the structure).
     ACT 2 — "Ultra-Quiet".  Object lifts to HOVER over a glowing
       PEDESTAL and tilts to a 3/4 top-down view; concentric SONAR
       RINGS pulse outward and a field of FLOOR TILES RISES in a radial
       wave around the base (the reel's blue cubes).

   The reel object is already assembled when revealed — it does NOT
   build itself. The old keel-up clip sweep was my invention and is
   gone: fade-in + rotate, then animate the scene, exactly like the reel.

   COLOUR DISCIPLINE (Rj's note — accents must not blend with the type):
   every luminous accent lives ON or AROUND the model in teal/cyan; the
   page headings stay dark ink, the glow never shares the heading hue,
   and the FX sit centre/right, clear of the bottom-left copy.
   ════════════════════════════════════════════════════════════════ */

const FIT_SIZE = 4.0; // longest-axis fit, world units
const MODEL_URL = "/models/platform-v2.glb";
const ACCENT = "#39b8ab"; // brand teal — the only accent hue in the scene
const ACCENT_HI = "#7ff0e2"; // luminous highlight for draw-on FX
const GROUND_Y = -1.9;

/* shared act windows (read off scrollState inside useFrame) */
const acts = (p: number) => ({
  // act 1 settle / hero
  a1: smooth(window01(p, 0.04, 0.4)),
  // act1 → act2 transition (rig recentres, lifts, tilts)
  to2: smooth(window01(p, 0.48, 0.72)),
  // act2 build (pedestal, sonar, tiles rise)
  a2: smooth(window01(p, 0.54, 0.86)),
  // ease-out handoff to the GlobalReach section
  out: smooth(window01(p, 0.92, 1.0)),
});

function Platform() {
  const { scene } = useGLTF(MODEL_URL);
  const groupRef = useRef<THREE.Group>(null!);

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
        if (mat && "envMapIntensity" in mat) {
          mat.envMapIntensity = 1.15;
          mat.needsUpdate = true;
        }
        const g = mesh.geometry as THREE.BufferGeometry;
        if (!g.attributes.normal) g.computeVertexNormals();
      }
    });
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("am:scene-ready"));
    }
  }, [scene]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    const g = groupRef.current;
    const p = scrollState.progress;

    if (motionState.reduced) {
      g.position.set(0.9, 0, 0);
      g.rotation.set(0, -0.5, 0);
      return;
    }

    const { to2 } = acts(p);
    // ACT 1 sits right (+x); ACT 2 recentres over the pedestal
    g.position.x = THREE.MathUtils.lerp(1.45, 0, to2);
    // ACT 2 lifts the rig to HOVER, with a gentle "in the water" bob
    const hover = THREE.MathUtils.lerp(0, 0.7, to2);
    g.position.y = hover + Math.sin(state.clock.elapsedTime * 0.5) * 0.04;
    // ACT 2 tilts toward a 3/4 top-down read (matches the reel)
    g.rotation.x = THREE.MathUtils.lerp(0, 0.26, to2);
    // continuous slow showcase rotation
    g.rotation.y += dt * 0.16;
  });

  return (
    <group ref={groupRef} position={[1.45, 0, 0]} rotation={[0, -0.5, 0]}>
      <primitive object={scene} />
    </group>
  );
}

/* ---------- directed thrust / wake stream (ACT 1) — the reel's exhaust ---------- */
const STREAKS = 22;
function ThrustStream() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: STREAKS }, (_, i) => ({
        y: -0.9 + ((i * 37) % 100) / 100 * 2.0,
        z: -0.9 + ((i * 53) % 100) / 100 * 1.8,
        speed: 0.55 + ((i * 17) % 10) / 9,
        len: 0.5 + ((i * 31) % 10) / 9,
        off: (i * 0.41) % 1,
      })),
    []
  );
  useFrame((state) => {
    const inst = ref.current;
    if (!inst || motionState.reduced) return;
    const p = scrollState.progress;
    const { a1, to2 } = acts(p);
    const vis = a1 * (1 - to2); // present in act 1, gone before the pedestal
    const t = state.clock.elapsedTime;
    (inst.material as THREE.MeshBasicMaterial).opacity = vis * 0.55;
    for (let i = 0; i < STREAKS; i++) {
      const s = seeds[i];
      const phase = (t * s.speed + s.off) % 1;
      // emit at the rig (right) and stream downstream toward -x, fading out
      const x = 1.7 - phase * 5.4;
      const fade = 1 - phase;
      dummy.position.set(x, s.y, s.z);
      dummy.scale.set(s.len * (0.5 + fade), 0.018, 1);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, STREAKS]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        color={ACCENT_HI}
        transparent
        opacity={0}
        depthWrite={false}
        toneMapped={false}
        blending={THREE.AdditiveBlending}
      />
    </instancedMesh>
  );
}

/* ---------- glowing pedestal the rig hovers over (ACT 2) ---------- */
function Pedestal() {
  const discRef = useRef<THREE.Mesh>(null!);
  const ringRef = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const p = scrollState.progress;
    const { a2 } = acts(p);
    const t = state.clock.elapsedTime;
    if (discRef.current) {
      const m = discRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = a2 * (0.28 + 0.06 * Math.sin(t * 1.6));
      discRef.current.scale.setScalar(THREE.MathUtils.lerp(0.4, 1, a2));
    }
    if (ringRef.current) {
      const m = ringRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = a2 * (0.5 + 0.2 * Math.sin(t * 2.2));
      ringRef.current.scale.setScalar(THREE.MathUtils.lerp(0.4, 1, a2));
    }
  });
  return (
    <group position={[0, GROUND_Y + 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={discRef}>
        <circleGeometry args={[2.2, 64]} />
        <meshBasicMaterial
          color={ACCENT}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh ref={ringRef} position={[0, 0, 0.01]}>
        <ringGeometry args={[1.55, 1.68, 80]} />
        <meshBasicMaterial
          color={ACCENT_HI}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ---------- concentric SONAR RINGS pulsing outward (ACT 2) ---------- */
const SONAR = 4;
function SonarRings() {
  const refs = useRef<THREE.Mesh[]>([]);
  const idx = useMemo(() => Array.from({ length: SONAR }, (_, i) => i), []);
  useFrame((state) => {
    const p = scrollState.progress;
    const { a2 } = acts(p);
    const t = state.clock.elapsedTime;
    refs.current.forEach((m, i) => {
      if (!m) return;
      const phase = (t * 0.45 + i / SONAR) % 1;
      const sc = 0.5 + phase * 3.0;
      m.scale.setScalar(sc);
      (m.material as THREE.MeshBasicMaterial).opacity = a2 * (1 - phase) * 0.45;
    });
  });
  return (
    <group position={[0, GROUND_Y + 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      {idx.map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
        >
          <ringGeometry args={[1.1, 1.16, 72]} />
          <meshBasicMaterial
            color={ACCENT}
            transparent
            opacity={0}
            depthWrite={false}
            toneMapped={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- floor TILES that RISE in a radial wave (ACT 2) — the reel's cubes ---------- */
const GN = 11; // grid is GN×GN tiles
const TILE_N = GN * GN;
const SPACING = 0.58;
const FIELD_R = (GN / 2) * SPACING; // outer radius the wave fades by
function RisingTiles() {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const cDim = useMemo(() => new THREE.Color("#cfeee8"), []);
  const cHot = useMemo(() => new THREE.Color(ACCENT_HI), []);
  // precompute each tile's grid position + radius from centre
  const tiles = useMemo(() => {
    const out: { x: number; z: number; r: number; rn: number }[] = [];
    const half = (GN - 1) / 2;
    for (let gx = 0; gx < GN; gx++) {
      for (let gz = 0; gz < GN; gz++) {
        const x = (gx - half) * SPACING;
        const z = (gz - half) * SPACING;
        const r = Math.hypot(x, z);
        out.push({ x, z, r, rn: Math.min(1, r / FIELD_R) });
      }
    }
    return out;
  }, []);

  useFrame((state) => {
    const inst = ref.current;
    if (!inst) return;
    const p = scrollState.progress;
    const { a2 } = acts(p);
    const t = state.clock.elapsedTime;
    const reduced = motionState.reduced;
    (inst.material as THREE.MeshBasicMaterial).opacity = reduced ? 0.18 : 0.2 + a2 * 0.8;

    for (let i = 0; i < TILE_N; i++) {
      const tile = tiles[i];
      // outward wave: inner tiles rise first, outer tiles lag, fade past field
      const local = reduced
        ? 0
        : smooth(THREE.MathUtils.clamp((a2 * 1.5 - tile.rn * 0.7) / 0.55, 0, 1)) *
          (1 - tile.rn);
      const shimmer = reduced ? 0 : Math.sin(t * 2.0 + tile.r * 2.4) * 0.03 * local;
      const h = local * 0.95 + shimmer;
      dummy.position.set(tile.x, GROUND_Y + 0.05 + h, tile.z);
      dummy.scale.set(0.34, 0.04 + h * 0.35, 0.34);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      color.copy(cDim).lerp(cHot, THREE.MathUtils.clamp(local * 1.2, 0, 1));
      inst.setColorAt(i, color);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, TILE_N]}
      frustumCulled={false}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        transparent
        opacity={0.2}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

/* ---------- contextual backlight glow — swells per act ---------- */
function BeatGlow() {
  const lightRef = useRef<THREE.PointLight>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    const p = scrollState.progress;
    const { a1, a2, to2 } = acts(p);
    const env = Math.max(a1 * (1 - to2), a2);
    if (lightRef.current) lightRef.current.intensity = 6 + env * 20;
    if (glowRef.current) {
      const m = glowRef.current.material as THREE.MeshBasicMaterial;
      m.opacity = 0.12 + env * 0.38;
      glowRef.current.scale.setScalar(2.6 + env * 1.4);
    }
  });
  return (
    <group position={[0.4, 0.5, -2.4]}>
      <pointLight ref={lightRef} color={ACCENT} intensity={6} distance={18} decay={2} />
      <mesh ref={glowRef}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color={ACCENT_HI} transparent opacity={0.18} depthWrite={false} toneMapped={false} />
      </mesh>
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

/* ---------- scroll-driven camera: wide → settle(right) → push-in 3/4 → handoff ---------- */
function CameraRig() {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3(0.4, 0.4, 0));
  const kpos = useMemo(
    () => [
      new THREE.Vector3(0.0, 2.6, 11.0), // 0.00 wide establish
      new THREE.Vector3(0.2, 1.3, 7.1), // 0.45 settled hero (rig sits right)
      new THREE.Vector3(0.0, 3.6, 6.6), // 0.78 push up/in for the 3/4 pedestal
      new THREE.Vector3(0.0, 2.6, 9.4), // 1.00 ease back — hand off to GlobalReach
    ],
    []
  );
  const ktgt = useMemo(
    () => [
      new THREE.Vector3(0.4, 0.4, 0),
      new THREE.Vector3(0.6, 0.5, 0), // bias right so the rig frames right
      new THREE.Vector3(0.0, -0.3, 0), // look down onto the pedestal
      new THREE.Vector3(0.0, 0.0, 0),
    ],
    []
  );
  const stops = useMemo(() => [0, 0.45, 0.78, 1], []);

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
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0.0, 2.6, 11.0], fov: 40, near: 0.1, far: 200 }}
      onCreated={({ gl, invalidate }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
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
      <fog attach="fog" args={["#F6EFE1", 16, 40]} />

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
        <ThrustStream />
        <Pedestal />
        <SonarRings />
        <RisingTiles />
        <Ocean />
        <CameraRig />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
