'use client';

import { cn } from '@/lib/utils';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * DottedSurface — a quiet teal sine-wave particle field (THREE.Points grid)
 * sat behind an inner-page hero-slug header on the cream Advantage Marine page.
 *
 * Adapted from the pasted Three.js component:
 * - single LIGHT theme: points are teal ink (#30837b), fog + clearColor keyed to
 *   the cream paper, opacity dropped to ~0.35 so it reads as a faint survey grid
 *   behind text rather than a loud field.
 * - container is `absolute inset-0 -z-0` (NOT fixed) so it lives behind a header
 *   block, with a subtle scroll parallax (translateY ~ scrollY * 0.15).
 * - prefers-reduced-motion: render a static field (no rAF loop) and no parallax.
 * - SSR-safe: all THREE/window/document access is inside useEffect.
 */

const SEPARATION = 150;
const AMOUNTX = 40;
const AMOUNTY = 60;

// Teal ink (#30837b) as 0..1 linear-ish rgb — faint teal on cream.
const POINT_R = 48 / 255;
const POINT_G = 131 / 255;
const POINT_B = 123 / 255;

// Cream paper (#F4EBD9) for the scene fog.
const FOG_COLOR = 0xf4ebd9;

export function DottedSurface({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const container = containerRef.current;
    if (!container) return;

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ── scene / camera / renderer ─────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(FOG_COLOR, 1500, 4500);

    const camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / Math.max(container.clientHeight, 1),
      1,
      10000,
    );
    camera.position.set(0, 355, 1220);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0); // transparent — cream page shows through
    container.appendChild(renderer.domElement);

    // ── point grid geometry ───────────────────────────────────────────────
    const numParticles = AMOUNTX * AMOUNTY;
    const positions = new Float32Array(numParticles * 3);
    const colors = new Float32Array(numParticles * 3);

    let i = 0;
    for (let ix = 0; ix < AMOUNTX; ix++) {
      for (let iy = 0; iy < AMOUNTY; iy++) {
        const x = ix * SEPARATION - (AMOUNTX * SEPARATION) / 2;
        const y = 0;
        const z = iy * SEPARATION - (AMOUNTY * SEPARATION) / 2;

        positions[i] = x;
        positions[i + 1] = y;
        positions[i + 2] = z;

        colors[i] = POINT_R;
        colors[i + 1] = POINT_G;
        colors[i + 2] = POINT_B;

        i += 3;
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 8,
      vertexColors: true,
      transparent: true,
      opacity: 0.35, // quiet texture behind text, not a loud field
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let count = 0;

    // Position the wave field once (static or animated start frame).
    const writeWave = () => {
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      let idx = 0;
      for (let ix = 0; ix < AMOUNTX; ix++) {
        for (let iy = 0; iy < AMOUNTY; iy++) {
          arr[idx + 1] =
            Math.sin((ix + count) * 0.3) * 50 +
            Math.sin((iy + count) * 0.5) * 50;
          idx += 3;
        }
      }
      posAttr.needsUpdate = true;
    };

    // ── animation loop (skipped under reduced motion) ─────────────────────
    let frameId = 0;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      writeWave();
      renderer.render(scene, camera);
      count += 0.1;
    };

    if (prefersReduced) {
      // Static field: one frame, no rAF loop, no parallax.
      writeWave();
      renderer.render(scene, camera);
    } else {
      animate();
    }

    // ── scroll parallax (rAF-throttled, gated on motion preference) ───────
    let parallaxTicking = false;
    const applyParallax = () => {
      const offset = window.scrollY * 0.15;
      container.style.transform = `translate3d(0, ${offset}px, 0)`;
      parallaxTicking = false;
    };
    const onScroll = () => {
      if (parallaxTicking) return;
      parallaxTicking = true;
      requestAnimationFrame(applyParallax);
    };
    if (!prefersReduced) {
      window.addEventListener('scroll', onScroll, { passive: true });
      applyParallax();
    }

    // ── resize ────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = container.clientWidth;
      const h = Math.max(container.clientHeight, 1);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (prefersReduced) renderer.render(scene, camera);
    };
    window.addEventListener('resize', onResize);

    // ── cleanup ───────────────────────────────────────────────────────────
    return () => {
      if (frameId) cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);

      scene.remove(points);
      geometry.dispose();
      material.dispose();
      renderer.dispose();

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn('absolute inset-0 -z-0 pointer-events-none', className)}
    />
  );
}

export default DottedSurface;
