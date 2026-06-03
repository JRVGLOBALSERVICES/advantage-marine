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
   VESSEL — CONSTRUCTION SWEEP on a single fused mesh.
   The GLB is one fused hull (~245k verts, no sub-meshes), so there
   are no real parts to "explode". Faking it with vertex noise read
   as the hull disintegrating. Instead we BUILD the vessel along its
   own length with a moving clip plane — bow draws on first, the cut
   sweeps stern-ward, a thin teal edge rides the build line:
     scroll 0.00 → only the bow is present
     scroll 0.60 → full hull revealed, settles to hero
     scroll 0.60+ → slow showcase orbit + waterline bob
   Reads as "the vessel is assembled / surveyed section by section",
   honest to a fused hull and on-message with "joint by joint".
   ════════════════════════════════════════════════════════════════ */

const ASSEMBLE_END = 0.6; // progress where the hull is fully built
const FIT_SIZE = 3.2; // longest axis fit, world units (fixed → scale never tracks viewport)
const MODEL_URL = "/models/vessel.glb";
const EDGE_PAD = 0.06; // clip margin so the cut never hard-pops at the extremes

// easeInOutCubic — cinematic build, no bounce
const easeInOut = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

function Vessel() {
  const { scene } = useGLTF(MODEL_URL);
  const groupRef = useRef<THREE.Group>(null!);
  const edgeRef = useRef<THREE.Mesh>(null!);

  // build-axis state, filled once the model is measured
  const axis = useRef<{ idx: 0 | 1 | 2; half: number; normal: THREE.Vector3 }>({
    idx: 0,
    half: FIT_SIZE / 2,
    normal: new THREE.Vector3(-1, 0, 0),
  });

  // one moving clip plane — points "ahead" of the build line get clipped away
  const clip = useMemo(() => new THREE.Plane(new THREE.Vector3(-1, 0, 0), FIT_SIZE / 2), []);

  // brushed marine-steel; clipped by the moving plane. DoubleSide so the
  // swept cross-section reads solid (a cutaway), not a hollow shell.
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#8fa6a3"), // cool steel, faint teal
      metalness: 0.8,
      roughness: 0.4,
      envMapIntensity: 1.15,
      side: THREE.DoubleSide,
      clippingPlanes: [clip],
      clipShadows: false,
    });
  }, [clip]);

  // normalize: recenter + scale longest axis to FIT_SIZE, find the build axis, apply steel
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

    // build along the model's longest world axis (hull length for a vessel)
    const dims = [size.x, size.y, size.z];
    const idx = (dims.indexOf(Math.max(...dims)) as 0 | 1 | 2) ?? 0;
    const normal = new THREE.Vector3(0, 0, 0);
    normal.setComponent(idx, -1); // reveal from the negative end toward positive
    axis.current = { idx, half: FIT_SIZE / 2, normal };
    clip.normal.copy(normal);
    clip.constant = FIT_SIZE / 2; // start fully clipped (nothing shown)

    // GLB loaded + positioned → tell the loader it can clear.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("am:scene-ready"));
    }
  }, [scene, material, clip]);

  useFrame((state, dt) => {
    const p = scrollState.progress;
    // build: 0 (only bow) at p=0 → 1 (full hull) at p=ASSEMBLE_END
    const build = motionState.reduced ? 1 : easeInOut(window01(p, 0, ASSEMBLE_END));
    const { half, normal } = axis.current;
    // constant goes +half (all clipped) → -half (all shown); pad so it overshoots
    const reveal = half + EDGE_PAD - build * (2 * half + 2 * EDGE_PAD);
    clip.constant = reveal;

    // ride the thin teal build edge at the current cut line, fade out once built
    if (edgeRef.current) {
      const pos = normal.clone().multiplyScalar(-reveal); // world point on the plane
      edgeRef.current.position.copy(pos);
      // orient the edge quad to face along the build axis
      edgeRef.current.lookAt(pos.clone().add(normal));
      const visible = !motionState.reduced && build > 0.02 && build < 0.985;
      edgeRef.current.visible = visible;
      const mat = edgeRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = visible ? 0.5 * Math.sin(Math.min(build, 1) * Math.PI) + 0.18 : 0;
    }

    if (groupRef.current) {
      if (!motionState.reduced) {
        // slow showcase rotation, easing in only once the hull is mostly built
        const spin = window01(p, 0.45, 1);
        groupRef.current.rotation.y += dt * (0.03 + 0.12 * spin);
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
      {/* thin emissive build edge that rides the sweep line */}
      <mesh ref={edgeRef} visible={false} renderOrder={2}>
        <planeGeometry args={[FIT_SIZE * 1.25, FIT_SIZE * 0.9]} />
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

/* ---------- billboarded ADVANTAGE MARINE tag (fades in as it assembles) ----------
   Rendered via drei <Html> with the real .font-display (Cinzel) class so the
   wordmark matches the page type — billboards automatically (transform mode). */
function AdvantageTag() {
  const wrapRef = useRef<HTMLDivElement>(null!);

  useFrame(() => {
    const p = scrollState.progress;
    // fade in once the vessel is mostly assembled
    const o = smooth(window01(p, 0.5, 0.72));
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

/* ---------- scroll-driven camera: cinematic push as the hull builds → settle → slight orbit ---------- */
function Rig() {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.1, 0));
  const kpos = useMemo(
    () => [
      new THREE.Vector3(1.4, 1.2, 7.6), // 0.00 — 3/4 establishing, watch the build sweep
      new THREE.Vector3(0.0, 0.5, 6.0), // 0.60 — settled hero, hull mid-frame
      new THREE.Vector3(-1.3, 0.95, 6.1), // 1.00 — slight orbit for the tag reveal
    ],
    []
  );
  const stops = useMemo(() => [0, ASSEMBLE_END, 1], []);

  useFrame(() => {
    const p = scrollState.progress;
    let seg = 0;
    while (seg < stops.length - 2 && p > stops[seg + 1]) seg++;
    const t = smooth(window01(p, stops[seg], stops[seg + 1]));
    // portrait phones have a narrow horizontal FOV — back the camera off so the
    // long horizontal hull fits the frame instead of being cropped / oversized.
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
      gl={{ antialias: true, powerPreference: "high-performance", localClippingEnabled: true }}
      camera={{ position: [1.4, 1.2, 7.6], fov: 40, near: 0.1, far: 200 }}
      onCreated={({ gl, invalidate }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.localClippingEnabled = true;
        // bridge: GSAP ScrollTrigger onUpdate calls this to re-render on scroll
        sceneState.invalidate = invalidate;
        // Hardening: if the GPU drops the WebGL context (driver reset, OOM,
        // shader-program failure) the canvas would otherwise stay a blank void.
        // Surface it so the host can swap in the static poster hero instead.
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
