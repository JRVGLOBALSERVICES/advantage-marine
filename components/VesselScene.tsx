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
   VESSEL — IN-WATER INSPECTION SHOWCASE (reel-tier).

   Redesign (2026-06): the GLB is ONE fused hull (~245k verts, no
   sub-meshes). The previous build CLIPPED it on along its length —
   but cutting a fused hull exposes a hollow cross-section, which read
   as the vessel slicing apart / "disintegrating". A fused object has
   no honest "assembly", so we stop faking one.

   Instead the whole vessel is always present, sitting on reflective
   cream water, and scroll drives a slow CINEMATIC ORBIT (the reel's
   showcase turntable) while a teal SCAN plane sweeps the hull bow→
   stern — Advantage Marine's actual job: in-water inspection / NDT.
   Honest to the geometry, on-brand, and it can never read as broken.

     scroll 0.00 → 3/4 establishing, vessel whole on the waterline
     scroll 0→0.45 → camera eases to the hero quarter, tag fades in
     scroll 0.45→1 → slow orbit reveals the far side; scan keeps sweeping
   ════════════════════════════════════════════════════════════════ */

const FIT_SIZE = 3.2; // longest-axis fit, world units (fixed → never tracks viewport)
const MODEL_URL = "/models/vessel.glb";

function Vessel() {
  const { scene } = useGLTF(MODEL_URL);
  const groupRef = useRef<THREE.Group>(null!);
  const scanRef = useRef<THREE.Mesh>(null!);

  // build axis (hull length) + half-extent, filled once measured
  const axis = useRef<{ idx: 0 | 1 | 2; half: number; normal: THREE.Vector3 }>({
    idx: 0,
    half: FIT_SIZE / 2,
    normal: new THREE.Vector3(1, 0, 0),
  });

  // brushed marine-steel — whole hull, no clipping (no hollow cross-section)
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#8fa6a3"), // cool steel, faint teal
      metalness: 0.82,
      roughness: 0.38,
      envMapIntensity: 1.2,
    });
  }, []);

  // normalize: recenter + scale longest axis to FIT_SIZE, find the long axis, apply steel
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
        mesh.material = material;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        const g = mesh.geometry as THREE.BufferGeometry;
        if (!g.attributes.normal) g.computeVertexNormals();
      }
    });

    // long world axis = hull length → the scan sweeps along it
    const dims = [size.x, size.y, size.z];
    const idx = (dims.indexOf(Math.max(...dims)) as 0 | 1 | 2) ?? 0;
    const normal = new THREE.Vector3(0, 0, 0);
    normal.setComponent(idx, 1);
    axis.current = { idx, half: FIT_SIZE / 2, normal };

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("am:scene-ready"));
    }
  }, [scene, material]);

  useFrame((state, dt) => {
    const p = scrollState.progress;
    const { half, normal } = axis.current;

    // ── inspection scan: a teal plane travels bow→stern on a slow loop,
    //    reading as an in-water survey pass over the hull ──
    if (scanRef.current) {
      if (motionState.reduced) {
        scanRef.current.visible = false;
      } else {
        const t = (state.clock.elapsedTime * 0.16) % 1; // ~6.3s per sweep
        const along = -half + t * (2 * half); // bow → stern
        scanRef.current.position.copy(normal.clone().multiplyScalar(along));
        scanRef.current.lookAt(scanRef.current.position.clone().add(normal));
        scanRef.current.visible = true;
        const mat = scanRef.current.material as THREE.MeshBasicMaterial;
        // brighten mid-sweep, fade at the ends so it never hard-pops
        mat.opacity = 0.42 * Math.sin(t * Math.PI) + 0.05;
      }
    }

    if (groupRef.current) {
      if (!motionState.reduced) {
        // slow showcase orbit, easing in once past the establishing beat
        const spin = window01(p, 0.2, 1);
        groupRef.current.rotation.y += dt * (0.05 + 0.16 * spin);
        // gentle bob "in the water"
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.04;
        state.invalidate();
      } else {
        groupRef.current.rotation.y = -0.5;
        groupRef.current.position.y = 0;
      }
    }
  });

  return (
    <group ref={groupRef} rotation={[0, -0.5, 0]}>
      <primitive object={scene} />
      {/* teal inspection-scan plane sweeping the hull length */}
      <mesh ref={scanRef} visible={false} renderOrder={2}>
        <planeGeometry args={[FIT_SIZE * 1.3, FIT_SIZE * 0.95]} />
        <meshBasicMaterial
          color="#39b9ac"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

/* ---------- cream water plane the vessel sits in ---------- */
function Ocean() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.7, 0]}>
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

/* ---------- billboarded ADVANTAGE MARINE tag (fades in once settled) ---------- */
function AdvantageTag() {
  const wrapRef = useRef<HTMLDivElement>(null!);

  useFrame(() => {
    const p = scrollState.progress;
    // fade in once the camera settles to the hero quarter
    const o = smooth(window01(p, 0.18, 0.4));
    if (wrapRef.current) wrapRef.current.style.opacity = String(o);
  });

  return (
    <Html
      position={[0, 1.85, 0]}
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

/* ---------- scroll-driven camera: 3/4 establishing → settle → slow orbit reveal ---------- */
function Rig() {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.1, 0));
  const kpos = useMemo(
    () => [
      new THREE.Vector3(1.4, 1.2, 7.6), // 0.00 — 3/4 establishing
      new THREE.Vector3(-0.2, 0.7, 6.4), // 0.45 — settled hero quarter
      new THREE.Vector3(-2.2, 1.1, 6.2), // 1.00 — orbit reveals the far side
    ],
    []
  );
  const stops = useMemo(() => [0, 0.45, 1], []);

  useFrame(() => {
    const p = scrollState.progress;
    let seg = 0;
    while (seg < stops.length - 2 && p > stops[seg + 1]) seg++;
    const t = smooth(window01(p, stops[seg], stops[seg + 1]));
    // portrait phones have a narrow horizontal FOV — back off so the long
    // horizontal hull fits instead of being cropped / oversized.
    const aspect = size.width / Math.max(size.height, 1);
    const distMul = aspect < 1 ? 1 + (1 - aspect) * 0.9 : 1;
    const pos = kpos[seg].clone().lerp(kpos[seg + 1], t).multiplyScalar(distMul);
    camera.position.lerp(pos, 0.1);
    camera.lookAt(target.current);
  });
  return null;
}

export default function VesselScene({
  onContextLost,
  active = true,
}: {
  onContextLost?: () => void;
  /** pause the render loop when the band scrolls out of view (GPU/battery) */
  active?: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [1.4, 1.2, 7.6], fov: 40, near: 0.1, far: 200 }}
      onCreated={({ gl, invalidate }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        sceneState.invalidate = invalidate;
        // Hardening: if the GPU drops the WebGL context (driver reset, OOM,
        // shader-program failure) surface it so the host swaps in the static
        // poster hero instead of leaving a blank void.
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
      <fog attach="fog" args={["#F6EFE1", 14, 34]} />

      <Suspense fallback={null}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 7, 4]} intensity={2.0} color="#fff7e8" />
        <directionalLight position={[-5, 2, -3]} intensity={0.6} color="#bfeee6" />

        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2.6} position={[4, 4, 4]} scale={6} color="#eafff9" />
          <Lightformer form="rect" intensity={1.4} position={[-4, 1, -3]} scale={5} color="#bfeee6" />
          <Lightformer form="ring" intensity={1.8} position={[0, 3, 6]} scale={3} color="#ffffff" />
        </Environment>

        <Vessel />
        <Ocean />
        <AdvantageTag />
        <Rig />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
