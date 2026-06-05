import * as THREE from "three";

/* ─────────────────────────── vessel explode ───────────────────────────
   Single source of truth for the exploded-view offsets used by BOTH the
   home hero (VesselHeroV4Scene) and the contact constellation.

   WHY THIS EXISTS: the v4 GLB (advantage-vessel-v4.glb) carries NO per-part
   `explode` extras — the earlier extras-driven path read `mesh.userData.explode`
   and got `null` for all 104 nodes, so every offset was (0,0,0) and the
   "complete → split → rejoin" animation was a silent no-op. Rather than
   re-author 104 custom-property vectors in Blender, we derive the offset
   geometrically at runtime from each part's position relative to the vessel
   centroid. No per-name table, no GLB dependency, works for any re-export.

   THE LOOK: a radial blow-apart from the centroid, vertically amplified so the
   superstructure / mast / crane lift clear of the hull (the engineering
   exploded-view read in Rj's reference), while the hull + deck core — which
   sit on the centroid — stay put as the anchor everything separates from.
   X (length) and Z (beam) get a gentler push so the ship reads as "opened up",
   not scattered into confetti. ──────────────────────────────────────────── */

// per-axis spread multipliers (applied to the part's offset-from-centroid)
const SPREAD_X = 0.5; // along length — gentle, keeps the silhouette legible
const SPREAD_Y = 1.45; // vertical — amplified, the dominant exploded direction
const SPREAD_Z = 0.75; // across beam — port/stbd parts swing outboard

/** Geometric explode offset for one part. `partCenter` and `vesselCenter` are
 *  in the same (three-space, Y-up) coordinate frame; `maxDim` scales the
 *  minimum-separation nudge so it stays proportionate to the model. */
export function computeExplodeOffset(
  partCenter: THREE.Vector3,
  vesselCenter: THREE.Vector3,
  maxDim: number,
): THREE.Vector3 {
  const radial = partCenter.clone().sub(vesselCenter);
  const offset = new THREE.Vector3(
    radial.x * SPREAD_X,
    radial.y * SPREAD_Y,
    radial.z * SPREAD_Z,
  );
  // Parts clustered on the centroid (hull, deck plate) would barely move and
  // read as "stuck". Give them a small upward drift along their dominant axis
  // so the whole assembly visibly participates in the split.
  if (offset.length() < maxDim * 0.04) {
    offset.y += maxDim * 0.06;
  }
  return offset;
}
