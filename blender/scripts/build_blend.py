import bpy, mathutils, math
bpy.ops.wm.open_mainfile(filepath="/tmp/osv/source/OSV.blend")

# point material at gunmetal texture, pack it
for im in bpy.data.images:
    if im.name.lower().startswith("osv"):
        im.filepath="/tmp/osv/textures/OSV_gunmetal.png"; im.source='FILE'; im.reload()

# clean empty material slots (SmallCrane had ~270 None slots)
for o in bpy.data.objects:
    if o.type=='MESH':
        slots=[i for i,s in enumerate(o.material_slots) if s.material is None]
        if slots:
            bpy.context.view_layer.objects.active=o
            # rebuild: keep only the real material
            mats=[s.material for s in o.material_slots if s.material]
            o.data.materials.clear()
            for m in mats: o.data.materials.append(m)
            for p in o.data.polygons: p.material_index=0

# realism on material
m=bpy.data.materials['Osv']
for n in m.node_tree.nodes:
    if n.type=='BSDF_PRINCIPLED':
        n.inputs['Roughness'].default_value=0.45
        n.inputs['Metallic'].default_value=0.2

# shade smooth with autosmooth-equivalent (angle) for nicer normals
for o in bpy.data.objects:
    if o.type=='MESH':
        for p in o.data.polygons: p.use_smooth=True
        bpy.context.view_layer.objects.active=o
        try: bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))
        except Exception as e: pass

# pack texture into blend so it's portable
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath="/tmp/osv/OSV_advantage.blend")
print("SAVED BLEND")
