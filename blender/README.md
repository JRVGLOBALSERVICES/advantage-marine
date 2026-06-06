# Blender — Home hero OSV (work in progress)

Source model and Blender pipeline for the home-page offshore support vessel.

## Attribution (CC-BY — required)

Base model **"OSV"** by **Brout (@davidbroutian)** on Sketchfab,
licensed **CC Attribution 4.0**. Source:
https://sketchfab.com/3d-models/osv-91ebf443614146cabe4a3602b6f71679

> Modifications by Advantage Marine: brand recolor (gunmetal `#586068`
> hull), material/realism pass, cleanup, and (in progress) rigging for the
> scroll explode→assemble hero. Attribution to the original author is
> retained per the CC-BY licence and must remain credited on the live site.

## Files

| File | What |
|---|---|
| `OSV_source.blend` | Untouched original (56,497 tris, 27 named parts, single `Osv` atlas material) |
| `OSV_advantage.blend` | Working file — gunmetal recolor, empty material slots removed, smooth-shaded, texture packed |
| `textures/OSV_original.png` | Original 4K atlas (red livery) |
| `textures/OSV_gunmetal.png` | Recolored atlas — red hull pixels remapped to gunmetal `#586068` |
| `scripts/inspect.py` | Dump objects / materials / dims |
| `scripts/gunmetal.py` | Recolor red→gunmetal in the atlas (Blender bundled numpy) |
| `scripts/build_blend.py` | Repath texture, clean slots, smooth-shade, pack, save working blend |
| `scripts/render_gm.py` | Hero preview render (Cycles CPU, AgX, light stage) |

## Run headless

```bash
blender --background --python blender/scripts/render_gm.py
```

## Status / next

- [x] Source vetted (free, CC-BY, commercial-OK) and imported
- [x] Brand recolor — gunmetal `#586068` hull, white superstructure, teal glass (reads as `#22eeff`)
- [x] Cleanup — empty material slots removed, smooth shading
- [ ] Realism pass — bevels on hard edges, baked AO, weathering
- [ ] Web optimize — decimate lifeboats (36,840 tris = 65% of model) + fence; Draco GLB
- [ ] Rig for scroll FX — name/axis parts for explode→assemble survey beats
- [ ] Hero frames — re-render branded sequence or wire a live GLB
