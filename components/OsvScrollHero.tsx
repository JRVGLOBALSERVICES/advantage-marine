"use client";

/* ──────────────────────────────────────────────────────────────────────────
   OSV LIVE-OCEAN HERO
   A real-time WebGL scene: the brand-recoloured ADVANTAGE offshore support
   vessel (gunmetal hull, white superstructure, deck crane, helideck) riding a
   live reflective ocean. The sea is the classic three.js `Water` shader (moving
   normals + sun glitter) under a physical `Sky` with a low golden sun — the
   "ocean effect" reference. The vessel is the actual Blender model exported to
   glTF (/public/models/osv.glb, brand gunmetal atlas baked in), seated at its
   waterline and gently heaving/pitching/rolling on the swell.

   WHY VANILLA three (not R3F): the project ships `three` only — no
   @react-three/fiber — so the scene is a plain WebGLRenderer driven by a rAF
   loop. GSAP ScrollTrigger writes scrollState.progress; the loop reads it to
   orbit the camera, drift the cruise and cross-fade the copy beats. No React
   re-renders per frame.

   MOBILE = SAME SCENE: portrait reframes the camera (taller fov, pulled back,
   vessel centred) but renders the identical live ocean + model — not a poster.

   iOS-safe pinning: CSS `position: sticky` (NOT ScrollTrigger pin). The render
   loop pauses when the hero scrolls out of view (IntersectionObserver) and the
   pixel ratio is capped for battery. Reduced-motion / no-JS falls back to the
   poster frame + stacked copy.
   ────────────────────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import { Water } from "three/examples/jsm/objects/Water.js";
import { Sky } from "three/examples/jsm/objects/Sky.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { scrollState, motionState } from "@/lib/scroll";
import BlurText from "./ui/BlurText";
import { NumberTicker } from "./ui/NumberTicker";
import ScrollCue from "./ScrollCue";

gsap.registerPlugin(ScrollTrigger);

const MODEL_URL = "/models/osv.glb";
const WATER_NORMALS_URL = "/textures/waternormals.jpg";
const POSTER = "/media/home/hero-osv-poster.jpg";
/* The cinematic reel kept as durable, indexable content for VideoObject schema. */
const REEL_URL =
  "https://res.cloudinary.com/de3gn7o77/video/upload/advantage-marine/deliverables/advantage-osv-reel-16x9-4k.mp4";

/* trapezoid 0→1 visibility window */
function trap(p: number, a: number, b: number, c: number, d: number) {
  if (p <= a || p >= d) return 0;
  if (p < b) return (p - a) / (b - a);
  if (p < c) return 1;
  return 1 - (p - c) / (d - c);
}

type Beat = {
  kicker: string;
  head: [string, string];
  lead: string;
  stat: { value: number; suffix: string; decimals?: number };
  statLabel: string;
};

/* Three beats latched to the cruise: vessel underway → read down to the steel →
   cleared by class. Copy is grounded ONLY in lib/content (10+ yrs afloat, the
   4,630 m² Johor yard, 12 class/ISO certs). No invented metrics. */
const BEATS: Beat[] = [
  {
    kicker: "00 — Offshore support, surveyed to class",
    head: ["Built to work", "where the sea won't."],
    lead: "An offshore support vessel earns open water only when the survey behind it holds — hull, propulsion, deck systems. We build that confidence, then prove it underwater.",
    stat: { value: 10, suffix: "+" },
    statLabel: "Years afloat · IMCA / OGP standard",
  },
  {
    kicker: "01 — Read down to the steel",
    head: ["Every weld,", "every anode."],
    lead: "Before a vessel sails, our divers and NDT teams read what the surface hides — hull plating, welds and cathodic protection — and document each one to class.",
    stat: { value: 4630, suffix: " m²" },
    statLabel: "Johor fabrication & dive facility",
  },
  {
    kicker: "02 — Underway, cleared by class",
    head: ["Proven at sea.", "Signed to class."],
    lead: "Systems seated, livery on, underway. The Chasing M2 ROV and our dive teams verify the steel the surface can't see — documented to ISO and class society.",
    stat: { value: 12, suffix: "" },
    statLabel: "ISO & class-society certifications",
  },
];

function BeatBlock({
  beat,
  innerRef,
  stacked,
  active,
}: {
  beat: Beat;
  innerRef?: (el: HTMLDivElement | null) => void;
  stacked?: boolean;
  active: boolean;
}) {
  return (
    <div
      ref={innerRef}
      style={{
        ...(stacked ? { gridArea: "1 / 1" } : {}),
        // soft dark halo so cream type holds even where it rises over bright sky
        textShadow: "0 2px 28px oklch(0.12 0.03 235 / 0.55), 0 1px 3px oklch(0.12 0.03 235 / 0.4)",
      }}
      className="max-w-[44rem] will-change-[opacity,transform]"
    >
      {/* Design A — cinematic full-bleed: brand display type straight on the
          ship (no card), light cream on the dark base wash, cyan accent rule +
          stat. Site fonts (font-display) and the real type scale. */}
      <div className="flex items-center gap-[var(--space-sm)] mb-[var(--space-sm)]">
        <span
          aria-hidden
          className="h-px w-[clamp(1.75rem,3vw,3.25rem)] shrink-0"
          style={{ background: "var(--color-accent)", boxShadow: "0 0 10px var(--color-accent)" }}
        />
        <p className="eyebrow !mb-0 text-[color:var(--color-accent)]">{beat.kicker}</p>
      </div>
      <div className="mb-[var(--space-md)]" style={{ fontSize: "var(--text-display)" }}>
        <BlurText
          text={beat.head[0]}
          inView={active}
          animateBy="words"
          className="font-display font-bold leading-[1.04] tracking-[-0.01em] text-[color:var(--color-paper)]"
        />
        <BlurText
          text={beat.head[1]}
          inView={active}
          delay={140}
          animateBy="words"
          className="font-display font-light leading-[1.04] tracking-[-0.01em] text-[color:color-mix(in_oklch,var(--color-paper)_74%,transparent)]"
        />
      </div>
      <p
        className="max-w-[36rem] leading-[1.55]"
        style={{ fontSize: "var(--text-lead)", color: "color-mix(in oklch, var(--color-paper) 84%, transparent)" }}
      >
        {beat.lead}
      </p>
      <div className="mt-[var(--space-lg)] flex items-end gap-[var(--space-md)] flex-wrap">
        <span
          className="font-display font-bold leading-none text-[color:var(--color-accent)] flex items-baseline"
          style={{ fontSize: "var(--text-stat)" }}
        >
          <NumberTicker
            value={beat.stat.value}
            start={active}
            decimalPlaces={beat.stat.decimals ?? 0}
            className="text-[color:var(--color-accent)]"
          />
          <span>{beat.stat.suffix}</span>
        </span>
        <span
          className="eyebrow pb-2 max-w-[14rem] !tracking-[0.18em] normal-case"
          style={{ color: "color-mix(in oklch, var(--color-paper) 72%, transparent)" }}
        >
          {beat.statLabel}
        </span>
      </div>
    </div>
  );
}

/* Reduced-motion / no-JS: poster frame + headline, remaining beats stacked. */
function StaticHero() {
  return (
    <>
      <header id="top" className="relative h-[100lvh] overflow-hidden bg-[color:var(--color-paper)]">
        <Image src={POSTER} alt="Advantage Marine offshore support vessel" fill priority sizes="100vw" className="object-cover" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(125% 95% at 0% 100%, oklch(0.16 0.035 235 / 0.52) 0%, transparent 55%), linear-gradient(to top, oklch(0.15 0.03 235 / 0.42) 0%, transparent 44%)",
          }}
        />
        <div className="absolute inset-0 grid items-end" style={{ padding: "clamp(1.5rem,5vw,3.5rem)" }}>
          <BeatBlock beat={BEATS[0]} active />
        </div>
      </header>
      <section className="px-[clamp(1.5rem,4vw,4rem)] py-[var(--space-2xl)] grid gap-[var(--space-2xl)] max-w-[min(1200px,92vw)] mx-auto">
        {BEATS.slice(1).map((beat, i) => (
          <BeatBlock key={i} beat={beat} active />
        ))}
      </section>
    </>
  );
}

export default function OsvScrollHero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shownRef = useRef<boolean[]>(BEATS.map(() => false));
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [active, setActive] = useState<boolean[]>(BEATS.map(() => false));

  useEffect(() => {
    const r = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    motionState.reduced = r;
    setReduced(r);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || reduced || !sectionRef.current || !mountRef.current) return;
    const mount = mountRef.current;

    // ── renderer ──────────────────────────────────────────────────────────
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      // no WebGL → poster underlay already covers it; just signal ready
      window.dispatchEvent(new Event("am:scene-ready"));
      return;
    }
    const isPortrait = () => mount.clientWidth < mount.clientHeight;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isPortrait() ? 1.75 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.52;
    renderer.domElement.className = "absolute inset-0 h-full w-full";
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(46, 1, 1, 20000);

    // ── ocean (live Water shader) ───────────────────────────────────────────
    const sun = new THREE.Vector3();
    const waterNormals = new THREE.TextureLoader().load(WATER_NORMALS_URL, (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
    });
    const water = new Water(new THREE.PlaneGeometry(20000, 20000), {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals,
      sunDirection: new THREE.Vector3(),
      sunColor: 0xffffff,
      waterColor: 0x103a4a, // deep brand teal sea
      distortionScale: 3.4,
      fog: false,
    });
    water.rotation.x = -Math.PI / 2;
    scene.add(water);

    // ── sky (physical, low golden sun) ──────────────────────────────────────
    const sky = new Sky();
    sky.scale.setScalar(20000);
    scene.add(sky);
    const skyU = sky.material.uniforms;
    skyU["turbidity"].value = 8;
    skyU["rayleigh"].value = 1.6;
    skyU["mieCoefficient"].value = 0.006;
    skyU["mieDirectionalG"].value = 0.86;

    const SUN_ELEVATION = 3.2; // degrees above horizon → long glitter path
    const SUN_AZIMUTH = 178; // sun roughly behind the vessel toward the horizon
    const pmrem = new THREE.PMREMGenerator(renderer);
    const sceneEnv = new THREE.Scene();
    let envRT: THREE.WebGLRenderTarget | null = null;
    const updateSun = () => {
      const phi = THREE.MathUtils.degToRad(90 - SUN_ELEVATION);
      const theta = THREE.MathUtils.degToRad(SUN_AZIMUTH);
      sun.setFromSphericalCoords(1, phi, theta);
      skyU["sunPosition"].value.copy(sun);
      water.material.uniforms["sunDirection"].value.copy(sun).normalize();
      if (envRT) envRT.dispose();
      sceneEnv.add(sky); // pmrem captures only the sky
      envRT = pmrem.fromScene(sceneEnv);
      scene.add(sky);
      scene.environment = envRT.texture;
    };
    updateSun();

    // ── lights (sun key + sky/sea fill) ─────────────────────────────────────
    const key = new THREE.DirectionalLight(0xffe9cf, 2.4);
    key.position.copy(sun).multiplyScalar(200);
    scene.add(key);
    scene.add(new THREE.HemisphereLight(0xbfe0f2, 0x0c2a36, 0.55));

    // ── the vessel ──────────────────────────────────────────────────────────
    // Bow is at the model's +Z (helideck/bridge forward, open cargo deck aft).
    // Heading angles the hull so the bow points screen-LEFT and slightly toward
    // camera → the cinematic front-starboard ¾ of the concept. The vessel cruises
    // ALONG this bow vector with scroll: ¾ off-screen right → off to the left.
    const HEADING = THREE.MathUtils.degToRad(-60);
    const bowDir = new THREE.Vector3(Math.sin(HEADING), 0, Math.cos(HEADING)); // unit, XZ
    const SHIP_LEN = 100;
    const CRUISE_START = -92; // travel @ p=0 → ¾ off-screen RIGHT (bow entering)
    const CRUISE_END = 98; //   travel @ p=1 → ¾ off-screen LEFT (stern exiting)

    const ship = new THREE.Group();
    ship.rotation.y = HEADING; // constant heading; bob uses x/z below
    scene.add(ship);
    const shipBaseY = 0;

    // ── wake / water-trail ───────────────────────────────────────────────────
    // A foam ribbon laid flat on the sea, trailing astern along -bowDir, plus a
    // bright bow-spray crescent. Procedural CanvasTextures (no extra asset): a
    // widening Kelvin churn for the wake, a soft crescent for the bow. The wake
    // texture scrolls each frame so the foam streams backward.
    const makeTex = (w: number, h: number, paint: (d: Uint8ClampedArray) => void) => {
      const cv = document.createElement("canvas");
      cv.width = w;
      cv.height = h;
      const c = cv.getContext("2d")!;
      const img = c.createImageData(w, h);
      paint(img.data);
      c.putImageData(img, 0, 0);
      const tex = new THREE.CanvasTexture(cv);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.ClampToEdgeWrapping;
      tex.wrapT = THREE.RepeatWrapping;
      return tex;
    };
    const WAKE_W = 72;
    const WAKE_L = 240;
    const WAKE_TW = 160;
    const WAKE_TH = 640;
    const wakeTex = makeTex(WAKE_TW, WAKE_TH, (d) => {
      // canvas top (v→1 after flipY) = near stern (strong); bottom = far (fades)
      for (let y = 0; y < WAKE_TH; y++) {
        const t = y / WAKE_TH; // 0 near-stern → 1 far astern
        const env = Math.pow(1 - t, 1.35);
        const halfCore = 5 + t * 50; // churn widens with distance
        const lineX = t * WAKE_TW * 0.4; // diverging Kelvin foam lines (~19°)
        for (let x = 0; x < WAKE_TW; x++) {
          const dx = Math.abs(x - WAKE_TW / 2);
          let a = dx < halfCore ? env * (1 - dx / halfCore) * 0.85 : 0;
          const dL = Math.abs(dx - lineX);
          if (dL < 11) a = Math.max(a, env * (1 - dL / 11) * 0.8);
          a *= 0.65 + Math.random() * 0.7; // foam speckle
          const i = (y * WAKE_TW + x) * 4;
          d[i] = d[i + 1] = d[i + 2] = 255;
          d[i + 3] = Math.min(255, a * 255);
        }
      }
    });
    const wake = new THREE.Mesh(
      new THREE.PlaneGeometry(WAKE_W, WAKE_L),
      new THREE.MeshBasicMaterial({
        map: wakeTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.92,
        blending: THREE.NormalBlending,
      })
    );
    // lie flat (normal up) with the plane's +Y axis toward the bow → near edge
    // sits at the stern, length runs astern
    {
      const up = new THREE.Vector3(0, 1, 0);
      const mx = new THREE.Vector3().crossVectors(up, bowDir).normalize();
      wake.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(mx, bowDir, up));
    }
    wake.renderOrder = 1;
    scene.add(wake);

    const bowTex = makeTex(128, 128, (d) => {
      for (let y = 0; y < 128; y++)
        for (let x = 0; x < 128; x++) {
          const dx = (x - 64) / 64;
          const dy = (y - 78) / 64;
          const r = Math.sqrt(dx * dx + dy * dy * 1.7);
          let a = r < 1 ? Math.pow(1 - r, 1.6) : 0;
          a *= 0.6 + Math.random() * 0.8;
          const i = (y * 128 + x) * 4;
          d[i] = d[i + 1] = d[i + 2] = 255;
          d[i + 3] = Math.min(255, a * 255);
        }
    });
    const bowFoam = new THREE.Mesh(
      new THREE.PlaneGeometry(34, 26),
      new THREE.MeshBasicMaterial({ map: bowTex, transparent: true, depthWrite: false, opacity: 0.85 })
    );
    bowFoam.rotation.x = -Math.PI / 2;
    bowFoam.rotation.z = -HEADING;
    bowFoam.renderOrder = 1;
    scene.add(bowFoam);

    let ready = false;
    const signalReady = () => {
      if (ready) return;
      ready = true;
      window.dispatchEvent(new Event("am:scene-ready"));
    };

    new GLTFLoader().load(
      MODEL_URL,
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);
        const s = SHIP_LEN / size.z; // world units along the hull
        model.scale.setScalar(s);
        // centre on X/Z; seat the keel below the y=0 waterline by DRAFT
        const DRAFT = 8.5;
        model.position.x = -center.x * s;
        model.position.z = -center.z * s;
        model.position.y = -box.min.y * s - DRAFT;
        model.traverse((o) => {
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh && mesh.material) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            if ("envMapIntensity" in mat) mat.envMapIntensity = 1.05;
          }
        });
        ship.add(model);
        signalReady();
      },
      undefined,
      () => signalReady() // model failed → poster underlay stays, don't hang the loader
    );

    // ── camera framing (fixed cinematic pose, re-derived per aspect) ─────────
    // Low and close, looking just left of centre over the water — the vessel
    // cruises across this fixed frame. Portrait keeps the SAME scene, pulled
    // back / wider fov so the hull still reads above the bottom copy column.
    const cam = { px: 12, py: 8.5, pz: 78, tx: -4, ty: 8 };
    const frame = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < h ? 1.75 : 2));
      camera.aspect = w / h;
      if (w < h) {
        // portrait / mobile — SAME cruise, camera pulled back (three.js fov is
        // vertical, so a tall frame needs distance) so the hull still reads
        camera.fov = 44;
        cam.px = 12;
        cam.py = 18;
        cam.pz = 210;
        cam.tx = -2;
        cam.ty = 12;
      } else {
        camera.fov = 46;
        cam.px = 12;
        cam.py = 8.5;
        cam.pz = 78;
        cam.tx = -4;
        cam.ty = 8;
      }
      camera.updateProjectionMatrix();
    };
    frame();

    // ── beats: opacity / rise windows across the cruise ──────────────────────
    const windows: [number, number, number, number][] = [
      [-0.1, -0.05, 0.16, 0.28],
      [0.36, 0.45, 0.56, 0.66],
      [0.74, 0.84, 0.99, 1.06],
    ];
    const updateBeats = (p: number) => {
      let changed = false;
      beatRefs.current.forEach((el, i) => {
        if (!el) return;
        const o = trap(p, ...windows[i]);
        el.style.opacity = String(o);
        el.style.transform = `translateY(${(1 - o) * 26}px)`;
        if (o > 0.4 && !shownRef.current[i]) {
          shownRef.current[i] = true;
          changed = true;
        }
      });
      if (changed) setActive([...shownRef.current]);
    };

    // ── scroll → progress ────────────────────────────────────────────────────
    const st = ScrollTrigger.create({
      trigger: sectionRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        scrollState.progress = self.progress;
      },
    });

    // ── render loop (paused offscreen) ───────────────────────────────────────
    const clock = new THREE.Clock();
    let elapsed = 0;
    let visible = true;
    let raf = 0;
    const render = () => {
      const dt = Math.min(clock.getDelta(), 0.05);
      elapsed += dt;
      const p = Math.min(Math.max(scrollState.progress, 0), 1);

      // live sea + streaming wake foam
      water.material.uniforms["time"].value += dt;
      wakeTex.offset.y = (wakeTex.offset.y - dt * 0.22) % 1;

      // cruise: translate the vessel along its bow vector with scroll —
      // ¾ off-screen right (p=0) → off to the left (p=1)
      const travel = CRUISE_START + (CRUISE_END - CRUISE_START) * p;
      const shipX = bowDir.x * travel;
      const shipZ = bowDir.z * travel;

      // swell — heave / pitch / roll layered on the constant heading
      ship.position.set(
        shipX,
        shipBaseY + Math.sin(elapsed * 0.7) * 0.7 + Math.sin(elapsed * 1.9 + 1) * 0.18,
        shipZ
      );
      ship.rotation.x = Math.sin(elapsed * 0.55) * 0.018; // pitch
      ship.rotation.z = Math.sin(elapsed * 0.42 + 0.6) * 0.022; // roll

      // wake trails astern of the stern; bow spray sits at the bow waterline
      const back = SHIP_LEN * 0.5 + WAKE_L * 0.5 - 14;
      wake.position.set(shipX - bowDir.x * back, 0.25, shipZ - bowDir.z * back);
      const fwd = SHIP_LEN * 0.5 - 6;
      bowFoam.position.set(shipX + bowDir.x * fwd, 0.3, shipZ + bowDir.z * fwd);

      // fixed cinematic camera with a faint breathing dolly
      camera.position.set(cam.px, cam.py + Math.sin(elapsed * 0.3) * 0.3, cam.pz);
      camera.lookAt(cam.tx, cam.ty, 0);

      updateBeats(p);
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    // pause the loop when the hero is fully scrolled away
    const io = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = entry.isIntersecting;
        if (nowVisible && !visible) {
          visible = true;
          clock.getDelta(); // drop the idle gap so the sea doesn't jump
          raf = requestAnimationFrame(render);
        } else if (!nowVisible && visible) {
          visible = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 }
    );
    io.observe(mount);

    // poster is already painted under the canvas — release the loader even if
    // the model decode is slow
    const readyTimer = window.setTimeout(signalReady, 1200);

    const onResize = () => frame();
    window.addEventListener("resize", onResize);

    return () => {
      window.clearTimeout(readyTimer);
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
      io.disconnect();
      st.kill();
      scene.environment = null;
      if (envRT) envRT.dispose();
      pmrem.dispose();
      waterNormals.dispose();
      wakeTex.dispose();
      bowTex.dispose();
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

  if (mounted && reduced) return <StaticHero />;

  return (
    <section id="top" ref={sectionRef} className="relative" style={{ height: "320lvh" }}>
      {/* VideoObject schema — the reel is real indexable content (§ video SEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoObject",
            name: "ADVANTAGE — offshore support vessel, surveyed to class",
            description:
              "An Advantage Marine offshore support vessel underway on open water — hull, superstructure, deck crane and helideck — surveyed by divers and the Chasing M2 ROV and cleared to class.",
            thumbnailUrl: [POSTER],
            uploadDate: "2026-06-06",
            duration: "PT15S",
            contentUrl: REEL_URL,
          }),
        }}
      />
      <div className="sticky top-0 h-[100lvh] overflow-hidden bg-[color:var(--color-paper)]">
        {/* poster underlay — instant paint before the WebGL scene hydrates */}
        <Image
          src={POSTER}
          alt="Advantage Marine offshore support vessel"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        {/* the live ocean + vessel scene mounts here (canvas appended) */}
        <div ref={mountRef} className="absolute inset-0" />

        {/* cinematic grounding — a soft dark wash at the base + lower-left so the
           copy sits on depth, while the upper/right of the ocean stays clean and
           bright with the sun glitter. */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to right, oklch(0.12 0.03 235 / 0.66) 0%, oklch(0.12 0.03 235 / 0.34) 30%, transparent 56%), linear-gradient(to top, oklch(0.12 0.03 235 / 0.5) 0%, oklch(0.13 0.03 235 / 0.14) 38%, transparent 64%)",
          }}
        />
        {/* mobile: portrait copy overlaps more of the vessel — run the base wash
           a touch stronger/taller for contrast. */}
        <div
          className="absolute inset-0 pointer-events-none sm:hidden"
          style={{
            background:
              "linear-gradient(to top, oklch(0.14 0.03 235 / 0.5) 0%, oklch(0.15 0.03 235 / 0.22) 30%, transparent 60%)",
          }}
        />

        {/* copy layer — three beats stacked, cross-faded on scrub */}
        <div className="absolute inset-0 grid items-end pointer-events-none" style={{ padding: "clamp(1.5rem,4vw,4rem)" }}>
          <div className="grid">
            {BEATS.map((beat, i) => (
              <BeatBlock
                key={i}
                beat={beat}
                stacked
                active={active[i]}
                innerRef={(el) => (beatRefs.current[i] = el)}
              />
            ))}
          </div>
        </div>

        <div className="absolute bottom-[var(--space-md)] right-[clamp(1.5rem,4vw,4rem)]">
          <ScrollCue />
        </div>
      </div>
    </section>
  );
}
