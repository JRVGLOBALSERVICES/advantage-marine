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
   VESSEL — EXPLODE → ASSEMBLE on a single fused mesh.
   The GLB is one mesh / one node / no materials (~245k verts), so
   there are no sub-meshes to detach. Instead we displace each vertex
   outward (along its normal + a per-triangle pseudo-random vector
   seeded from position) by a single uniform `uExplode`:
     scroll 0.00 → uExplode 1  (fully exploded / detached cloud)
     scroll 0.60 → uExplode 0  (fully assembled vessel)
   Reads as "parts fly together into the vessel".
   ════════════════════════════════════════════════════════════════ */

const ASSEMBLE_END = 0.6; // progress where the vessel is fully assembled
const FIT_SIZE = 3.2; // longest axis fit, world units (fixed → scale never tracks viewport)
const MODEL_URL = "/models/vessel.glb";

// easeOutCubic — clean settle, no bounce
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

function Vessel() {
  const { scene } = useGLTF(MODEL_URL);
  const explodeRef = useRef({ value: 1 });
  const groupRef = useRef<THREE.Group>(null!);

  // brushed marine-steel material, cool tinted slightly teal
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color("#8fa6a3"), // cool steel, faint teal
      metalness: 0.8,
      roughness: 0.4,
      envMapIntensity: 1.15,
    });
    // patch the shader: outward vertex displacement driven by uExplode
    m.onBeforeCompile = (shader) => {
      shader.uniforms.uExplode = explodeRef.current;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
           uniform float uExplode;
           // cheap hash → per-triangle pseudo-random unit-ish vector
           vec3 hash3(vec3 p){
             p = vec3(
               dot(p, vec3(127.1, 311.7, 74.7)),
               dot(p, vec3(269.5, 183.3, 246.1)),
               dot(p, vec3(113.5, 271.9, 124.6))
             );
             return fract(sin(p) * 43758.5453123) * 2.0 - 1.0;
           }`
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
           // seed from quantized position so neighbouring verts move together
           vec3 seed = floor(position * 6.0);
           vec3 rnd = normalize(hash3(seed) + 0.0001);
           // expand outward mostly along the normal (hull "breathes apart") with a
           // mild random bias so it reads as the vessel loosening, not disintegrating
           vec3 dir = normalize(normal + rnd * 0.5);
           transformed += dir * uExplode * (0.55 + 0.45 * length(rnd)) * 0.8;`
        );
    };
    return m;
  }, []);

  // normalize: recenter to origin + scale longest axis to FIT_SIZE, apply steel
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
    // GLB loaded + positioned → tell the loader it can clear.
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("am:scene-ready"));
    }
  }, [scene, material]);

  useFrame((state, dt) => {
    const p = scrollState.progress;
    // uExplode: 1 (exploded) at p=0 → 0 (assembled) at p=ASSEMBLE_END
    const assembled = easeOut(window01(p, 0, ASSEMBLE_END));
    explodeRef.current.value = motionState.reduced ? 0 : 1 - assembled;

    if (groupRef.current) {
      // slow showcase rotation once assembled; settle, no spin while scattered
      if (!motionState.reduced) {
        const spin = window01(p, 0.35, 1);
        groupRef.current.rotation.y += dt * (0.04 + 0.12 * spin);
        // gentle bob "in the water"
        groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.6) * 0.04;
        // keep the demand loop alive while ambient motion plays
        state.invalidate();
      } else {
        groupRef.current.position.y = 0;
      }
    }
  });

  return (
    <group ref={groupRef} rotation={[0, -0.5, 0]}>
      <primitive object={scene} />
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

/* ---------- scroll-driven camera: wide on the scatter → settle on the vessel ---------- */
function Rig() {
  const { camera, size } = useThree();
  const target = useRef(new THREE.Vector3(0, 0.2, 0));
  const kpos = useMemo(
    () => [
      new THREE.Vector3(0.2, 1.5, 8.4), // 0.00 wide — see the scattered cloud
      new THREE.Vector3(0.0, 0.6, 6.2), // 0.60 settled hero, vessel mid-frame
      new THREE.Vector3(-1.1, 0.9, 6.0), // 1.00 slight orbit for the tag reveal
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
}: {
  onContextLost?: () => void;
}) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop="always"
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0.2, 1.5, 8.4], fov: 40, near: 0.1, far: 200 }}
      onCreated={({ gl, invalidate }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
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
