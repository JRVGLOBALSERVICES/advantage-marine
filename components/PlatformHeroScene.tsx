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
   PLATFORM HERO — clean PBR showcase of the offshore rig.

   Deliberately NOT the old vessel "explode/assemble" path: that
   displaced every vertex on a fused mesh, which on a lattice rig
   reads as a *melted* structure. Here we keep the model's own baked
   PBR materials, hold it steady, and rotate it slowly while a
   scroll-driven camera settles in — matching the reference reel
   (clean model held on the right, contextual glow per beat).
   ════════════════════════════════════════════════════════════════ */

const FIT_SIZE = 4.0; // longest axis fit, world units — tall jacket structure
const MODEL_URL = "/models/platform-hero.glb";

function Platform() {
  const { scene } = useGLTF(MODEL_URL);
  const groupRef = useRef<THREE.Group>(null!);

  // normalize: recenter to origin + scale longest axis to FIT_SIZE.
  // Keep the model's own PBR materials — only tighten env response so the
  // brushed steel reads against the cream backdrop.
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
        if (mat && "envMapIntensity" in mat) mat.envMapIntensity = 1.1;
        const g = mesh.geometry as THREE.BufferGeometry;
        if (!g.attributes.normal) g.computeVertexNormals();
      }
    });
    // GLB loaded + positioned → tell the loader it can clear.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("am:scene-ready"));
    }
  }, [scene]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    if (!motionState.reduced) {
      // slow, steady showcase rotation — speeds up subtly as you scroll in
      const p = scrollState.progress;
      const spin = window01(p, 0.0, 1);
      groupRef.current.rotation.y += dt * (0.06 + 0.10 * spin);
      // gentle bob "in the water"
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
      state.invalidate();
    } else {
      groupRef.current.position.y = 0;
    }
  });

  return (
    <group ref={groupRef} rotation={[0, -0.5, 0]}>
      <primitive object={scene} />
    </group>
  );
}

/* ---------- contextual backlight glow — shifts intensity per beat ----------
   Three narrative beats; the rim glow swells as each beat lands so the rig
   feels lit from behind by the feature being described. Brand teal only
   (no reference-reel purple) to stay on-palette. */
function BeatGlow() {
  const lightRef = useRef<THREE.PointLight>(null!);
  const glowRef = useRef<THREE.Mesh>(null!);
  useFrame(() => {
    const p = scrollState.progress;
    // swell on each beat window, dip between — a soft three-peak envelope
    const a = smooth(window01(p, 0.0, 0.5)) * (1 - smooth(window01(p, 0.5, 0.62)));
    const b = smooth(window01(p, 0.62, 0.72)) * (1 - smooth(window01(p, 0.82, 0.9)));
    const c = smooth(window01(p, 0.9, 0.97));
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
      <pointLight ref={lightRef} color="#39b8ab" intensity={6} distance={18} decay={2} />
      <mesh ref={glowRef}>
        <circleGeometry args={[1, 48]} />
        <meshBasicMaterial color="#5fd6c7" transparent opacity={0.18} depthWrite={false} />
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

/* ---------- billboarded ADVANTAGE MARINE tag (fades in as camera settles) ---------- */
function AdvantageTag() {
  const wrapRef = useRef<HTMLDivElement>(null!);
  useFrame(() => {
    const p = scrollState.progress;
    const o = smooth(window01(p, 0.5, 0.72));
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

/* ---------- scroll-driven camera: wide establishing → settle on the rig ---------- */
function Rig() {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.2, 0));
  const kpos = useMemo(
    () => [
      new THREE.Vector3(0.4, 2.4, 9.2), // 0.00 wide — full jacket in frame
      new THREE.Vector3(0.0, 1.0, 6.6), // 0.60 settled hero, rig mid-frame
      new THREE.Vector3(-1.3, 1.4, 6.4), // 1.00 slight orbit for the tag reveal
    ],
    []
  );
  const stops = useMemo(() => [0, 0.6, 1], []);

  useFrame(() => {
    const p = scrollState.progress;
    let seg = 0;
    while (seg < stops.length - 2 && p > stops[seg + 1]) seg++;
    const t = smooth(window01(p, stops[seg], stops[seg + 1]));
    // portrait phones: back off so the tall structure fits the frame
    const aspect = size.width / Math.max(size.height, 1);
    const distMul = aspect < 1 ? 1 + (1 - aspect) * 0.9 : 1;
    const pos = kpos[seg].clone().lerp(kpos[seg + 1], t).multiplyScalar(distMul);
    camera.position.lerp(pos, 0.1);
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
      camera={{ position: [0.4, 2.4, 9.2], fov: 40, near: 0.1, far: 200 }}
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
        <Ocean />
        <AdvantageTag />
        <Rig />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
