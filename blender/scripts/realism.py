import bpy, math
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath="/tmp/osv/OSV_advantage.blend")
meshes=[o for o in bpy.data.objects if o.type=='MESH']

# bbox
def bbox(objs):
    mn=[1e9]*3; mx=[-1e9]*3
    for o in objs:
        for v in o.bound_box:
            w=o.matrix_world@Vector(v)
            for i in range(3): mn[i]=min(mn[i],w[i]); mx[i]=max(mx[i],w[i])
    return Vector([(mn[i]+mx[i])/2 for i in range(3)]),Vector([mx[i]-mn[i] for i in range(3)]),mn,mx
gc,gdim,gmn,gmx=bbox(meshes)

# --- realism on parts: bevel for edge highlights + weighted normals ---
for o in meshes:
    bpy.context.view_layer.objects.active=o
    bev=o.modifiers.new('bevel','BEVEL')
    bev.width=0.06; bev.segments=2; bev.limit_method='ANGLE'; bev.angle_limit=math.radians(40); bev.harden_normals=True
    wn=o.modifiers.new('wn','WEIGHTED_NORMAL'); wn.keep_sharp=True
    for p in o.data.polygons: p.use_smooth=True

# --- material: painted steel ---
m=bpy.data.materials['Osv']
bsdf=[n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'][0]
bsdf.inputs['Metallic'].default_value=0.45
bsdf.inputs['Roughness'].default_value=0.36
if 'Coat Weight' in bsdf.inputs: bsdf.inputs['Coat Weight'].default_value=0.12
if 'Specular IOR Level' in bsdf.inputs: bsdf.inputs['Specular IOR Level'].default_value=0.6

# --- world: HDRI lighting + cream camera background ---
w=bpy.context.scene.world; w.use_nodes=True; nt=w.node_tree; nt.nodes.clear()
out=nt.nodes.new('ShaderNodeOutputWorld')
mix=nt.nodes.new('ShaderNodeMixRGB')
lp=nt.nodes.new('ShaderNodeLightPath')
env=nt.nodes.new('ShaderNodeTexEnvironment'); env.image=bpy.data.images.load("/tmp/studio.hdr")
envbg=nt.nodes.new('ShaderNodeBackground')      # lighting/reflection
creambg=nt.nodes.new('ShaderNodeBackground'); creambg.inputs[1].default_value=1.0
creambg.inputs[0].default_value=(0.90,0.88,0.83,1)  # cream camera bg
envbg.inputs[1].default_value=0.42
addsh=nt.nodes.new('ShaderNodeMixShader')
nt.links.new(env.outputs[0],envbg.inputs[0])
nt.links.new(lp.outputs['Is Camera Ray'],addsh.inputs[0])
nt.links.new(envbg.outputs[0],addsh.inputs[1])
nt.links.new(creambg.outputs[0],addsh.inputs[2])
nt.links.new(addsh.outputs[0],out.inputs[0])

# --- grounding floor + soft shadow ---
bpy.ops.mesh.primitive_plane_add(size=gdim.length*3, location=(gc.x,gc.y,gmn[2]+0.02))
floor=bpy.context.active_object
fm=bpy.data.materials.new('Floor'); fm.use_nodes=True; floor.data.materials.append(fm)
fb=[n for n in fm.node_tree.nodes if n.type=='BSDF_PRINCIPLED'][0]
fb.inputs['Base Color'].default_value=(0.93,0.91,0.86,1); fb.inputs['Roughness'].default_value=0.5; fb.inputs['Metallic'].default_value=0.0

# key sun for crisp shadow
S=bpy.data.lights.new('S','SUN'); S.energy=5.5; S.angle=0.2
so=bpy.data.objects.new('S',S); bpy.context.collection.objects.link(so); so.rotation_euler=(math.radians(55),math.radians(12),math.radians(130))
R=bpy.data.lights.new('R','SUN'); R.energy=3.5; R.angle=0.1
ro=bpy.data.objects.new('R',R); bpy.context.collection.objects.link(ro); ro.rotation_euler=(math.radians(70),0,math.radians(-50))

# camera 3/4 bow
co=bpy.data.objects.new('C',bpy.data.cameras.new('C')); bpy.context.collection.objects.link(co); bpy.context.scene.camera=co
d=gdim.length
co.location=gc+Vector((d*0.5,-d*0.66,d*0.3)); co.rotation_euler=(gc-co.location).to_track_quat('-Z','Y').to_euler(); co.data.lens=50

sc=bpy.context.scene
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=128; sc.cycles.use_denoising=True
sc.render.resolution_x=1920; sc.render.resolution_y=1080
sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Medium High Contrast'
sc.render.filepath="/tmp/osv/render_realism2.png"
bpy.ops.render.render(write_still=True); print("REALISM DONE")
