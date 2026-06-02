"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, useGLTF, ContactShadows } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";

/* ════════════════════════════════════════════════════════════════
   PLATFORM — offshore oil & gas rig, reconstructed from Rj's
   reference photo via Meshy image-to-3D, decimated + meshopt'd to
   ~390k tris / 5.7 MB. It keeps its own baked PBR textures (steel +
   yellow crane booms), so we DON'T override the material — we only
   recenter, fit, and bump envMap so the steel catches the rig lights.

   Slow showcase rotation + subtle pointer parallax. No OrbitControls
   (keeps it a calm brand object, not a toy). frameloop is gated to
   in-view by the parent so it doesn't burn the GPU off-screen.
   ════════════════════════════════════════════════════════════════ */

const MODEL_URL = "/models/platform.glb";
const FIT_SIZE = 4.4; // longest axis fit, world units (fixed → never tracks viewport)

const INK = "#10211e"; // --color-ink, literal for the GL backdrop

function Platform() {
  const { scene } = useGLTF(MODEL_URL);
  const groupRef = useRef<THREE.Group>(null!);
  const tilt = useRef({ x: 0, y: 0 });

  // recenter to origin, fit longest axis, keep baked PBR, bump envMap
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
          mat.envMapIntensity = 1.05;
          mat.needsUpdate = true;
        }
        const g = mesh.geometry as THREE.BufferGeometry;
        if (!g.attributes.normal) g.computeVertexNormals();
      }
    });
  }, [scene]);

  useFrame((state, dt) => {
    if (!groupRef.current) return;
    // calm continuous turntable
    groupRef.current.rotation.y += dt * 0.18;
    // subtle pointer parallax on the rig itself (eased toward target)
    const px = state.pointer.x;
    const py = state.pointer.y;
    tilt.current.x += (-py * 0.12 - tilt.current.x) * 0.05;
    tilt.current.y += (px * 0.18 - tilt.current.y) * 0.05;
    groupRef.current.rotation.x = tilt.current.x;
    // gentle vertical drift "afloat"
    groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.06 - 0.1;
  });

  return (
    <group ref={groupRef} rotation={[0.05, 0.4, 0]}>
      <primitive object={scene} />
    </group>
  );
}

/* scroll/pointer-independent camera — fixed framing, lets the model turn */
function Rig() {
  const { camera, size } = useThree();
  useEffect(() => {
    // portrait / narrow → back off so the wide topside isn't cropped
    const aspect = size.width / Math.max(size.height, 1);
    const dist = aspect < 1.1 ? 9.2 : 7.6;
    camera.position.set(0.4, 1.1, dist);
    camera.lookAt(0, 0.1, 0);
  }, [camera, size]);
  return null;
}

export default function PlatformScene({ active = true }: { active?: boolean }) {
  return (
    <Canvas
      dpr={[1, 1.8]}
      frameloop={active ? "always" : "demand"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0.4, 1.1, 7.6], fov: 38, near: 0.1, far: 200 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <color attach="background" args={[INK]} />
      <fog attach="fog" args={[INK, 12, 30]} />

      <Suspense fallback={null}>
        <ambientLight intensity={0.45} />
        {/* key — warm rig-deck light from upper right */}
        <directionalLight position={[6, 7, 4]} intensity={2.1} color="#fff2dc" />
        {/* fill — cool teal bounce from the water */}
        <directionalLight position={[-5, 1.5, -2]} intensity={0.7} color="#9fe6da" />

        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2.4} position={[5, 5, 3]} scale={7} color="#eafff9" />
          <Lightformer form="rect" intensity={1.2} position={[-5, 1, -3]} scale={5} color="#7fd9cb" />
          <Lightformer form="ring" intensity={1.6} position={[0, 4, 7]} scale={3} color="#ffffff" />
        </Environment>

        <Platform />

        {/* soft grounding shadow → the rig reads as standing in dark water */}
        <ContactShadows
          position={[0, -2.0, 0]}
          opacity={0.5}
          scale={16}
          blur={2.6}
          far={5}
          color="#000000"
          frames={active ? Infinity : 1}
        />

        <Rig />
      </Suspense>
    </Canvas>
  );
}

useGLTF.preload(MODEL_URL);
