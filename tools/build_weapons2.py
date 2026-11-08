# Armas v0.24: recorta a lâmina meia-lua (Coelho) de assets/concept/armas_vfx.jpg → /tmp/ext/wpn_lua_{0,1}.png (ciano e rosa)
import numpy as np
from PIL import Image
S = np.array(Image.open('/home/claude/assets/concept/armas_vfx.jpg').convert('RGB')).astype(np.float32)
K = 2576 / 2000
def glow(box):
    x0,y0,x1,y1=[int(v*K) for v in box]
    c=S[y0:y1,x0:x1]
    mx = c.max(axis=2)
    a = np.clip((mx - 14) / 200, 0, 1) ** 0.9
    a[a < 0.05] = 0
    rgb = np.where(a[..., None] > 0.02, c / np.maximum(a[..., None], 0.02), 0)
    im = Image.fromarray(np.dstack([rgb.clip(0, 255), a * 255]).astype(np.uint8), 'RGBA')
    return im.crop(im.getbbox())
a=glow((1355,295,1492,452)); a.save('/tmp/ext/wpn_lua_0.png')
import numpy as np
arr=np.array(a); r=arr[...,0].copy(); arr[...,0]=arr[...,1]; arr[...,1]=(r*0.3+arr[...,1]*0.0).astype(np.uint8)
Image.fromarray(arr,'RGBA').save('/tmp/ext/wpn_lua_1.png')
