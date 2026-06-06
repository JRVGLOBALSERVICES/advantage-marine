import bpy, math
from mathutils import Vector
bpy.ops.wm.open_mainfile(filepath="/tmp/osv/OSV_advantage.blend")
meshes=[o for o in bpy.data.objects if o.type=='MESH']
def bbox(objs, extra=None):
    mn=[1e9]*3; mx=[-1e9]*3
    for o in objs:
        e=extra.get(o.name,Vector((0,0,0))) if extra else Vector((0,0,0))
        for v in o.bound_box:
            w=o.matrix_world@Vector(v); w=w+e
            for i in range(3): mn[i]=min(mn[i],w[i]); mx[i]=max(mx[i],w[i])
    return Vector([(mn[i]+mx[i])/2 for i in range(3)]), Vector([mx[i]-mn[i] for i in range(3)])
gc,gdim=bbox(meshes)
hc,_=bbox([o for o in meshes if o.name=='OsvHull'] or meshes)

anchor={'OsvHull','OsvRearPlatform'}
down={'OsvRudderLeft','OsvRudderRight','PropellerLeft','PropellerRight'}
offsets={}
for o in meshes:
    if o.name in anchor: offsets[o.name]=Vector((0,0,0)); continue
    pc,_=bbox([o]); rel=pc-hc
    off=Vector((0,0,0))
    off.x=(1 if rel.x>=0 else -1)*gdim.x*0.42         # gentle beam split
    off.y=rel.y*0.18
    if o.name in down:
        off.z=-gdim.z*0.32; off.x*=1.15
    else:
        off.z=(0.18+max(rel.z,0)/max(gdim.z,1e-3)*0.5)*gdim.z*0.55
    offsets[o.name]=off

# exploded extent -> fit camera
ec,ed=bbox(meshes, offsets)
N=72; mid=36
for o in meshes:
    base=o.location.copy(); off=offsets[o.name]
    o.location=base; o.keyframe_insert('location',frame=1)
    o.location=base+off; o.keyframe_insert('location',frame=mid)
    o.location=base; o.keyframe_insert('location',frame=N)
    if o.animation_data and o.animation_data.action:
        for fc in o.animation_data.action.fcurves:
            for kp in fc.keyframe_points: kp.interpolation='SINE'; kp.easing='EASE_IN_OUT'

world=bpy.context.scene.world; world.use_nodes=True
bg=world.node_tree.nodes['Background']; bg.inputs[0].default_value=(0.95,0.96,0.99,1); bg.inputs[1].default_value=1.1
S=bpy.data.lights.new('S','SUN'); S.energy=4.5; S.angle=0.15
so=bpy.data.objects.new('S',S); bpy.context.collection.objects.link(so); so.rotation_euler=(math.radians(58),math.radians(8),math.radians(135))
F=bpy.data.lights.new('F','SUN'); F.energy=1.3; fo=bpy.data.objects.new('F',F); bpy.context.collection.objects.link(fo); fo.rotation_euler=(math.radians(62),0,math.radians(-35))
co=bpy.data.objects.new('C',bpy.data.cameras.new('C')); bpy.context.collection.objects.link(co); bpy.context.scene.camera=co
reach=max(ed.x, ed.y*0.6, ed.z)*1.5
co.location=ec+Vector((reach*0.5,-reach*0.78,reach*0.4)); co.rotation_euler=(ec-co.location).to_track_quat('-Z','Y').to_euler(); co.data.lens=42

sc=bpy.context.scene
sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=40; sc.cycles.use_denoising=True
sc.render.resolution_x=1280; sc.render.resolution_y=720
sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Medium High Contrast'
import sys
MODE=sys.argv[-1]
if MODE=='still':
    sc.frame_set(36); sc.render.filepath="/tmp/osv/explode_still2.png"; bpy.ops.render.render(write_still=True)
else:
    sc.frame_start=1; sc.frame_end=N; sc.render.fps=24
    sc.render.image_settings.file_format='FFMPEG'; sc.render.ffmpeg.format='MPEG4'; sc.render.ffmpeg.codec='H264'; sc.render.ffmpeg.constant_rate_factor='HIGH'
    sc.render.filepath="/tmp/osv/explode_preview2.mp4"; bpy.ops.render.render(animation=True)
print("DONE", MODE)
