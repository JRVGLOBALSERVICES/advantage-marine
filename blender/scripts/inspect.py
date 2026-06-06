import bpy, bmesh
bpy.ops.wm.open_mainfile(filepath="/tmp/osv/source/OSV.blend")

print("=== OBJECTS ===")
total_tris = 0
for o in bpy.data.objects:
    if o.type == 'MESH':
        me = o.data
        tris = sum(len(p.vertices)-2 for p in me.polygons)
        total_tris += tris
        print(f"  {o.name:30s} verts={len(me.vertices):6d} tris={tris:6d} mats={[ (m.name if m else None) for m in me.materials]}")
    else:
        print(f"  {o.name:30s} type={o.type}")
print(f"TOTAL MESH OBJECTS tris={total_tris}")

print("\n=== MATERIALS ===")
for m in bpy.data.materials:
    print(f"  {m.name}  nodes={m.use_nodes}")
    if m.use_nodes:
        for n in m.node_tree.nodes:
            if n.type=='BSDF_PRINCIPLED':
                bc=n.inputs['Base Color']
                print(f"     Principled baseColor={'tex' if bc.is_linked else tuple(round(x,3) for x in bc.default_value)} metallic={n.inputs['Metallic'].default_value} rough={n.inputs['Roughness'].default_value}")

print("\n=== IMAGES ===")
for im in bpy.data.images:
    print(f"  {im.name} {im.size[0]}x{im.size[1]} src={im.source}")

print("\n=== SCENE DIMS (bbox of all) ===")
import mathutils
mins=[1e9]*3; maxs=[-1e9]*3
for o in bpy.data.objects:
    if o.type=='MESH':
        for v in o.bound_box:
            w=o.matrix_world @ mathutils.Vector(v)
            for i in range(3):
                mins[i]=min(mins[i],w[i]); maxs[i]=max(maxs[i],w[i])
dims=[round(maxs[i]-mins[i],2) for i in range(3)]
print(f"  X(len?)={dims[0]} Y={dims[1]} Z={dims[2]}  (Blender Z-up)")
