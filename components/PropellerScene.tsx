"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { scrollState, motionState, window01, smooth } from "@/lib/scroll";

/* ════════════════════════════════════════════════════════════════
   Narrative windows (progress 0→1 over the pinned section)
   0.00–0.28  EXTRACT → ASSEMBLE  (parts fly in from exploded space)
   0.28–0.52  in-water currents   (beat 1)
   0.52–0.74  sonar / UT-scan     (beat 2)
   0.78–1.00  lift-out → reach    (hand-off to GlobalReach)
   ════════════════════════════════════════════════════════════════ */
const ASSEMBLE_END = 0.28;

// easeOutCubic — clean settle, no bounce (restraint over sloppy overshoot)
const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

// staggered part progress: 0 (exploded) → 1 (locked) across its own window
function partT(p: number, a: number, b: number) {
  return easeOut(window01(p, a, b));
}

/* ---------- procedural blade: twisted, cupped airfoil ---------- */
function useBladeGeometry() {
  return useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.1, 0);
    shape.bezierCurveTo(-0.34, 0.18, -0.42, 0.5, -0.2, 0.86);
    shape.quadraticCurveTo(0, 1.06, 0.22, 0.86);
    shape.bezierCurveTo(0.42, 0.5, 0.3, 0.16, 0.1, 0);
    shape.closePath();

    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 0.05,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.025,
      bevelSegments: 3,
      steps: 1,
      curveSegments: 32,
    });
    geo.translate(0, 0, -0.025);

    // helical pitch (twist around radial Y) + forward cup toward the tip
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const t = THREE.MathUtils.clamp(v.y, 0, 1.1);
      const twist = -0.95 * t;
      const c = Math.cos(twist);
      const s = Math.sin(twist);
      const x = v.x * c - v.z * s;
      const z = v.x * s + v.z * c;
      pos.setXYZ(i, x, v.y, z + 0.1 * t * t);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);
}

const BLADES = 5;
const BLADE_SCALE: [number, number, number] = [1.0, 1.45, 1.0];

function PropAssembly() {
  const blade = useBladeGeometry();
  const root = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!);

  // rotor refs
  const shaft = useRef<THREE.Group>(null!);
  const hub = useRef<THREE.Group>(null!);
  const rearCap = useRef<THREE.Group>(null!);
  const nose = useRef<THREE.Group>(null!);
  const bladeRefs = useRef<THREE.Group[]>([]);
  // static (non-spinning) refs
  const duct = useRef<THREE.Group>(null!);
  const struts = useRef<THREE.Group[]>([]);

  // bronze rotor — warm, polished
  const bronze = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#c89253"),
        metalness: 0.96,
        roughness: 0.3,
        envMapIntensity: 1.45,
      }),
    []
  );
  // stainless duct / shaft — cool, brushed (material contrast vs the bronze)
  const steel = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#9fb6c4"),
        metalness: 1.0,
        roughness: 0.42,
        envMapIntensity: 1.2,
      }),
    []
  );

  useFrame((_, dt) => {
    const p = scrollState.progress;

    // ── continuous rotor spin (accelerates as it locks together) ──
    const locked = window01(p, 0.18, ASSEMBLE_END);
    if (!motionState.reduced) spin.current.rotation.z -= dt * (0.18 + 0.7 * locked);

    // ── per-part assembly: pos/rot lerp exploded → home, staggered build ──
    // shaft (first), hub, rear cap, blades (staggered), nose, duct + struts (last)
    {
      const t = partT(p, 0.0, 0.1);
      shaft.current.position.set(0, 0, -1.18 + (1 - t) * -2.4);
      shaft.current.rotation.x = (1 - t) * 0.5;
    }
    {
      const t = partT(p, 0.02, 0.13);
      hub.current.position.set(0, (1 - t) * 0.0, (1 - t) * -0.4);
      hub.current.scale.setScalar(0.4 + 0.6 * t);
    }
    {
      const t = partT(p, 0.05, 0.16);
      rearCap.current.position.set(0, 0, -0.26 + (1 - t) * -1.5);
    }
    bladeRefs.current.forEach((g, i) => {
      if (!g) return;
      const base = (i * Math.PI * 2) / BLADES;
      const a = 0.08 + i * 0.02;
      const t = partT(p, a, a + 0.16);
      // radial extraction along +Y, slight forward fan, swirl into even spacing
      g.position.set(0, (1 - t) * 1.5, (1 - t) * 0.35);
      g.rotation.set(0, 0, base + (1 - t) * 0.7);
      g.scale.setScalar(0.6 + 0.4 * t);
    });
    {
      const t = partT(p, 0.16, 0.27);
      nose.current.position.set(0, 0, 0.5 + (1 - t) * 2.5);
      nose.current.rotation.z = (1 - t) * 1.4;
    }
    {
      // stainless duct slides on over the rotor last → "combine into one"
      const t = partT(p, 0.18, ASSEMBLE_END + 0.02);
      duct.current.position.set(0, 0, (1 - t) * 3.0);
      duct.current.scale.setScalar(1 + (1 - t) * 0.22);
      struts.current.forEach((s, i) => {
        if (!s) return;
        const st = partT(p, 0.19 + i * 0.015, ASSEMBLE_END + 0.02);
        s.scale.setScalar(st);
      });
    }

    // ── beat-3: lift the whole assembly out of frame + grow (hand-off) ──
    const lift = smooth(window01(p, 0.78, 1));
    root.current.position.y = lift * 5.6;
    const grow = 1 + smooth(window01(p, 0.5, 0.78)) * 0.1 + lift * 0.22;
    root.current.scale.setScalar(grow);
  });

  return (
    <group ref={root}>
      {/* stainless Kort duct (static shroud — real ducted thrusters don't spin the duct) */}
      <group ref={duct}>
        <mesh material={steel} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[2.32, 2.18, 0.95, 64, 1, true]} />
        </mesh>
        {/* leading rim */}
        <mesh material={steel} position={[0, 0, 0.48]}>
          <torusGeometry args={[2.3, 0.06, 16, 80]} />
        </mesh>
        {/* trailing rim */}
        <mesh material={steel} position={[0, 0, -0.48]}>
          <torusGeometry args={[2.16, 0.05, 16, 80]} />
        </mesh>
      </group>

      {/* stator struts: hub → duct (static) */}
      {[0, 1, 2].map((i) => {
        const ang = (i * Math.PI * 2) / 3 + Math.PI / 6;
        return (
          <group
            key={i}
            ref={(el) => {
              if (el) struts.current[i] = el;
            }}
            rotation={[0, 0, ang]}
          >
            <mesh material={steel} position={[0, 1.4, -0.05]}>
              <boxGeometry args={[0.08, 1.8, 0.16]} />
            </mesh>
          </group>
        );
      })}

      {/* ── rotor (spins) ── */}
      <group ref={spin}>
        {/* drive shaft */}
        <group ref={shaft}>
          <mesh material={steel} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 1.6, 24]} />
          </mesh>
        </group>

        {/* hub */}
        <group ref={hub}>
          <mesh material={bronze} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.34, 0.5, 0.5, 48]} />
          </mesh>
        </group>

        {/* rear cap */}
        <group ref={rearCap}>
          <mesh material={bronze} rotation={[Math.PI / 2, 0, 0]}>
            <sphereGeometry args={[0.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>

        {/* nose cone */}
        <group ref={nose}>
          <mesh material={bronze} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.34, 0.7, 48]} />
          </mesh>
        </group>

        {/* blades */}
        {Array.from({ length: BLADES }).map((_, i) => (
          <group
            key={i}
            ref={(el) => {
              if (el) bladeRefs.current[i] = el;
            }}
          >
            <mesh geometry={blade} material={bronze} position={[0, 0.42, 0]} scale={BLADE_SCALE} />
          </group>
        ))}
      </group>
    </group>
  );
}

/* ---------- water currents flowing through the disc (beat 1) ---------- */
function Currents({ count = 150 }: { count?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geom = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        r: 0.3 + Math.random() * 2.0,
        a: Math.random() * Math.PI * 2,
        z: Math.random() * 8 - 4,
        speed: 2 + Math.random() * 3,
        len: 0.3 + Math.random() * 0.9,
      })),
    [count]
  );
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#37c6f0"),
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    []
  );

  useFrame((_, dt) => {
    const p = scrollState.progress;
    // ramps in once assembled, fades before sonar
    const live = window01(p, ASSEMBLE_END, 0.36) * (1 - smooth(window01(p, 0.46, 0.54)));
    mat.opacity = motionState.reduced ? 0.28 : 0.5 * live;
    const inst = ref.current;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      if (!motionState.reduced) {
        s.z -= dt * s.speed;
        if (s.z < -4.2) s.z += 8.4;
      }
      dummy.position.set(Math.cos(s.a) * s.r, Math.sin(s.a) * s.r, s.z);
      dummy.scale.set(0.012, 0.012, s.len);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
    }
    inst.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geom, mat, count]} frustumCulled={false} />;
}

/* ---------- sonar / UT-scan rings (beat 2) ---------- */
function Sonar({ count = 4 }: { count?: number }) {
  const refs = useRef<THREE.Mesh[]>([]);
  const mats = useMemo(
    () =>
      Array.from(
        { length: count },
        () =>
          new THREE.MeshBasicMaterial({
            color: new THREE.Color("#f5b018"),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
          })
      ),
    [count]
  );

  useFrame(() => {
    const p = scrollState.progress;
    const active = window01(p, 0.52, 0.74);
    const t = (active * 2) % 1;
    for (let i = 0; i < count; i++) {
      const m = refs.current[i];
      if (!m) continue;
      const phase = (t + i / count) % 1;
      const sc = 0.4 + phase * 3.4;
      m.scale.set(sc, sc, sc);
      const liveOn = active > 0.001 && active < 0.999 ? 1 : 0;
      mats[i].opacity = liveOn * (1 - phase) * 0.5;
    }
  });

  return (
    <group>
      {Array.from({ length: count }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) refs.current[i] = el;
          }}
          material={mats[i]}
        >
          <torusGeometry args={[1, 0.012, 8, 96]} />
        </mesh>
      ))}
    </group>
  );
}

/* ---------- nautical depth-chart floor (beat 3) ---------- */
function ChartFloor() {
  const ref = useRef<THREE.GridHelper>(null!);
  useFrame(() => {
    const v = smooth(window01(scrollState.progress, 0.76, 1));
    const grid = ref.current;
    const mats = Array.isArray(grid.material) ? grid.material : [grid.material];
    mats.forEach((m) => {
      const mm = m as THREE.Material & { opacity: number; transparent: boolean };
      mm.transparent = true;
      mm.opacity = v * 0.55;
    });
  });
  return <gridHelper ref={ref} args={[64, 64, "#0799d1", "#0a3a55"]} position={[0, -2.7, -4]} />;
}

/* ---------- scroll-driven camera rig ---------- */
function Rig() {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));
  // keyframes: wide (see exploded parts) → settle → orbit → lift hand-off
  const kpos = useMemo(
    () => [
      new THREE.Vector3(3.4, 1.3, 7.6), // 0.00  wide 3/4, parts spread
      new THREE.Vector3(0.4, 0.35, 5.7), // 0.28  locked hero, centered
      new THREE.Vector3(-0.6, 0.2, 5.3), // 0.52  slight orbit for currents
      new THREE.Vector3(0.0, 1.0, 5.7), // 0.74  rise for sonar
      new THREE.Vector3(0.0, 2.8, 5.2), // 1.00  lift hand-off
    ],
    []
  );
  const ktar = useMemo(
    () => [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, -1.9, -1.2),
    ],
    []
  );
  const stops = useMemo(() => [0, 0.28, 0.52, 0.74, 1], []);

  useFrame(() => {
    const p = scrollState.progress;
    let seg = 0;
    while (seg < stops.length - 2 && p > stops[seg + 1]) seg++;
    const t = smooth(window01(p, stops[seg], stops[seg + 1]));
    const pos = kpos[seg].clone().lerp(kpos[seg + 1], t);
    const tar = ktar[seg].clone().lerp(ktar[seg + 1], t);
    camera.position.lerp(pos, 0.12);
    target.current.lerp(tar, 0.12);
    camera.lookAt(target.current);
  });
  return null;
}

export default function PropellerScene() {
  return (
    <Canvas
      dpr={[1, 1.8]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [3.4, 1.3, 7.6], fov: 38, near: 0.1, far: 100 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <color attach="background" args={["#04161f"]} />
      <fog attach="fog" args={["#04161f", 10, 26]} />

      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 5]} intensity={2.2} color="#bfe9ff" />
      <directionalLight position={[-5, -2, -3]} intensity={0.8} color="#f5b018" />

      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[3, 3, 4]} scale={6} color="#9fdcff" />
        <Lightformer form="rect" intensity={1.6} position={[-4, 1, -3]} scale={5} color="#ffd27a" />
        <Lightformer form="ring" intensity={2} position={[0, 2, 6]} scale={3} color="#ffffff" />
      </Environment>

      <PropAssembly />
      <Currents />
      <Sonar />
      <ChartFloor />
      <Rig />
    </Canvas>
  );
}
