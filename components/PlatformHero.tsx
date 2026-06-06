"use client";

/* ──────────────────────────────────────────────────────────────────────────
   CONTACT — LIVE OFFSHORE-PLATFORM HERO
   Replaces the old static hero photo with a real-time WebGL scene: a detailed
   offshore production platform (jacket legs + topside modules, derrick and
   cranes) standing in a live three.js `Water` ocean under a physical `Sky` at
   golden hour. The camera slowly orbits and answers the pointer (desktop), so
   the contact page opens on something alive rather than a flat image.

   The platform model is Draco-compressed (~1 MB) and loaded through
   GLTFLoader + DRACOLoader (decoder in /public/draco). Reduced-motion or a
   WebGL failure falls back to the original photo via the `fallback` prop.
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";

const MODEL_URL = "/models/platform.glb";
const WATER_NORMALS_URL = "/textures/waternormals.jpg";

export default function PlatformHero({ fallback }: { fallback: string }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [reduced, setReduced] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || reduced || !mountRef.current) return;
    const mount = mountRef.current;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      setFailed(true);
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.5;
    renderer.domElement.className = "absolute inset-0 h-full w-full";
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, 1, 1, 20000);

    // ── ocean ──
    const waterNormals = new THREE.TextureLoader().load(WATER_NORMALS_URL, (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    });
    const sun = new THREE.Vector3();
    const water = new Water(new THREE.PlaneGeometry(20000, 20000), {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xfff1d8,
      waterColor: 0x0e3344,
      distortionScale: 3.2,
      fog: false,
    });
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // ── sky + low golden sun ──
    const sky = new Sky();
    sky.scale.setScalar(20000);
    scene.add(sky);
    const skyU = sky.material.uniforms;
    skyU["turbidity"].value = 9;
    skyU["rayleigh"].value = 2.2;
    skyU["mieCoefficient"].value = 0.005;
    skyU["mieDirectionalG"].value = 0.86;
    sun.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 6), THREE.MathUtils.degToRad(150));
    skyU["sunPosition"].value.copy(sun);
    water.material.uniforms["sunDirection"].value.copy(sun).normalize();

    const pmrem = new THREE.PMREMGenerator(renderer);
    const sceneEnv = new THREE.Scene();
    sceneEnv.add(sky);
    const envRT = pmrem.fromScene(sceneEnv);
    scene.add(sky);
    scene.environment = envRT.texture;

    const key = new THREE.DirectionalLight(0xffe6c4, 2.6);
    key.position.copy(sun).multiplyScalar(300);
    scene.add(key);
    scene.add(new THREE.HemisphereLight(0xbfe0f2, 0x0b2733, 0.5));

    // ── platform (Draco) ──
    const platform = new THREE.Group();
    scene.add(platform);
    let radius = 80; // bounding radius after scaling — set on load, frames camera
    let centerY = 10;

    const draco = new DRACOLoader();
    draco.setDecoderPath("/draco/");
    const loader = new GLTFLoader();
    loader.setDRACOLoader(draco);
    loader.load(
      MODEL_URL,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const s = 130 / Math.max(size.x, size.z); // normalise footprint
        model.scale.setScalar(s);
        // centre on X/Z; sink the lower ~16% of the jacket below the waterline
        const WATERLINE = 0.16;
        model.position.x = -center.x * s;
        model.position.z = -center.z * s;
        model.position.y = -(box.min.y + size.y * WATERLINE) * s;
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh && mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if ("envMapIntensity" in mat) mat.envMapIntensity = 1.0;
          }
        });
        platform.add(model);
        radius = (Math.max(size.x, size.y, size.z) * s) / 2;
        centerY = size.y * (0.5 - WATERLINE) * s;
        frame();
      },
      undefined,
      () => draco.dispose()
    );

    // ── camera framing (auto-fit the platform; low cinematic ¾) ──
    let camDist = 240;
    const frame = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      const portrait = w < h;
      camera.fov = portrait ? 60 : 48;
      camera.updateProjectionMatrix();
      // distance that fits the bounding sphere in the (smaller) vertical fov
      const vfov = THREE.MathUtils.degToRad(camera.fov);
      const fit = radius / Math.sin(vfov / 2);
      camDist = fit * (portrait ? 1.5 : 1.25);
    };
    frame();

    // ── pointer parallax (desktop) ──
    const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
    const fine = window.matchMedia("(pointer: fine)").matches;
    const onPointerMove = (e: PointerEvent) => {
      ptr.tx = (e.clientX / (mount.clientWidth || 1) - 0.5) * 2;
      ptr.ty = (e.clientY / (mount.clientHeight || 1) - 0.5) * 2;
    };
    if (fine) window.addEventListener("pointermove", onPointerMove);

    // ── render loop (paused offscreen) ──
    const clock = new THREE.Clock();
    let visible = true;
    let raf = 0;
    let azimuth = 0.5;
    const render = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      water.material.uniforms["time"].value += dt;

      ptr.x += (ptr.tx - ptr.x) * 0.04;
      ptr.y += (ptr.ty - ptr.y) * 0.04;
      azimuth += dt * 0.035; // slow auto-orbit
      const az = azimuth + ptr.x * 0.35;
      const elev = 0.16 + ptr.y * 0.08; // low, grazing the water
      const cy = Math.sin(elev) * camDist + centerY;
      const cr = Math.cos(elev) * camDist;
      camera.position.set(Math.sin(az) * cr, cy, Math.cos(az) * cr);
      camera.lookAt(0, centerY + radius * 0.12, 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !visible) {
          visible = true;
          clock.getDelta();
          raf = requestAnimationFrame(render);
        } else if (!entry.isIntersecting && visible) {
          visible = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 }
    );
    io.observe(mount);

    const onResize = () => frame();
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointerMove);
      cancelAnimationFrame(raf);
      io.disconnect();
      scene.environment = null;
      envRT.dispose();
      pmrem.dispose();
      waterNormals.dispose();
      draco.dispose();
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, [mounted, reduced]);

  // reduced-motion / WebGL failure → the original photo
  if ((mounted && reduced) || failed) {
    return (
      <Image src={fallback} alt="Advantage Marine offshore platform" fill priority sizes="100vw" className="object-cover" />
    );
  }

  return (
    <>
      {/* poster underlay paints instantly while the scene hydrates */}
      <Image src={fallback} alt="Advantage Marine offshore platform" fill priority sizes="100vw" className="object-cover" />
      <div ref={mountRef} className="absolute inset-0" />
    </>
  );
}
