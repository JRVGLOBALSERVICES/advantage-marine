import numpy as np, bpy
img = bpy.data.images.load("/tmp/osv/textures/OSV.png")
w,h = img.size
px = np.array(img.pixels[:], dtype=np.float32).reshape(h,w,4)
r,g,b = px[...,0],px[...,1],px[...,2]
red = (r>0.45)&(g<0.33)&(b<0.33)&(r-g>0.18)&(r-b>0.18)
# gunmetal #586068 -> linear-ish sRGB stored values
hull = np.array([0.345,0.376,0.408])
lum = np.clip(0.78+0.5*(r-0.5),0.45,1.25)
for i in range(3):
    px[...,i] = np.where(red, np.clip(hull[i]*lum,0,1), px[...,i])
img.pixels = px.reshape(-1).tolist()
img.filepath_raw="/tmp/osv/textures/OSV_gunmetal.png"; img.file_format='PNG'; img.save()
print("gunmetal px:", int(red.sum()))
