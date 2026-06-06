import bpy, mathutils, math
bpy.ops.wm.open_mainfile(filepath="/tmp/osv/OSV_advantage.blend")
mins=[1e9]*3; maxs=[-1e9]*3
for o in bpy.data.objects:
    if o.type=='MESH':
        for v in o.bound_box:
            wv=o.matrix_world@mathutils.Vector(v)
            for i in range(3): mins[i]=min(mins[i],wv[i]); maxs[i]=max(maxs[i],wv[i])
center=mathutils.Vector([(mins[i]+maxs[i])/2 for i in range(3)]); size=max(maxs[i]-mins[i] for i in range(3))
world=bpy.context.scene.world; world.use_nodes=True
bg=world.node_tree.nodes['Background']; bg.inputs[0].default_value=(0.95,0.96,0.99,1); bg.inputs[1].default_value=1.1
L=bpy.data.lights.new('S','SUN'); L.energy=4.5; L.angle=0.15
lo=bpy.data.objects.new('S',L); bpy.context.collection.objects.link(lo); lo.rotation_euler=(math.radians(58),math.radians(8),math.radians(135))
F=bpy.data.lights.new('F','SUN'); F.energy=1.3; fo=bpy.data.objects.new('F',F); bpy.context.collection.objects.link(fo); fo.rotation_euler=(math.radians(62),0,math.radians(-35))
cam=bpy.data.cameras.new('C'); co=bpy.data.objects.new('C',cam); bpy.context.collection.objects.link(co); bpy.context.scene.camera=co
co.location=center+mathutils.Vector((size*0.52,-size*0.66,size*0.32)); co.rotation_euler=(center-co.location).to_track_quat('-Z','Y').to_euler(); cam.lens=50
sc=bpy.context.scene; sc.render.engine='CYCLES'; sc.cycles.device='CPU'; sc.cycles.samples=72; sc.cycles.use_denoising=True
sc.render.resolution_x=1600; sc.render.resolution_y=900; sc.view_settings.view_transform='AgX'; sc.view_settings.look='AgX - Medium High Contrast'
sc.render.filepath="/tmp/osv/render_gunmetal.png"; bpy.ops.render.render(write_still=True); print("DONE")
