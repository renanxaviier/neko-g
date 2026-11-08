"""Coelho, Macaco e Tatu (assets/concept/personagens_novos.jpg e personagens_novos2.jpg) → /tmp/ext/<id>_<anim>_<i>.png.
Caixas medidas na imagem reduzida (2000 px de largura); o recorte fica só com o grupo principal (rótulos somem)."""
import sys
import numpy as np
from PIL import Image
sys.path.insert(0, '/home/claude/tools')
from cutlib import cut

A = np.array(Image.open('/home/claude/assets/concept/personagens_novos.jpg').convert('RGB')).astype(np.float32)
B = np.array(Image.open('/home/claude/assets/concept/personagens_novos2.jpg').convert('RGB')).astype(np.float32)
K = 2576 / 2000

FR = {
    'coelho': {
        'idle':    (B, 92, 282, [(75, 250)]),
        'run':     (B, 92, 282, [(315, 505), (525, 725)]),
        'dash':    (B, 110, 282, [(740, 1012)]),
        'attack':  (B, 92, 282, [(1030, 1355)]),
        'hit':     (B, 92, 282, [(1378, 1572)]),
        'death':   (B, 100, 282, [(1575, 1752), (1752, 1978)]),
        'jump':    (A, 92, 318, [(55, 268)]),
        'airjump': (A, 96, 318, [(318, 515), (548, 735)]),
        'fall':    (A, 100, 318, [(785, 1005)]),
        'land':    (A, 100, 318, [(1035, 1315)]),
        'wall':    (A, 100, 318, [(1395, 1645)]),
    },
    'macaco': {
        'idle':    (B, 642, 830, [(55, 298)]),
        'run':     (B, 642, 830, [(318, 512), (520, 740)]),
        'dash':    (B, 642, 830, [(748, 1005)]),
        'attack':  (B, 642, 830, [(1045, 1350)]),
        'hit':     (B, 642, 830, [(1395, 1585)]),
        'death':   (B, 628, 830, [(1650, 1965)]),
        'jump':    (A, 376, 555, [(50, 280)]),
        'airjump': (A, 376, 555, [(315, 505), (520, 735)]),
        'fall':    (A, 376, 555, [(785, 1000)]),
        'land':    (A, 376, 555, [(1075, 1325)]),
        'wall':    (A, 376, 555, [(1385, 1655)]),
    },
    'tatu': {
        'idle':    (B, 918, 1100, [(70, 290)]),
        'run':     (B, 918, 1100, [(290, 510), (512, 752)]),
        'dash':    (B, 918, 1100, [(752, 980)]),
        'attack':  (B, 918, 1100, [(1025, 1400)]),
        'hit':     (B, 918, 1100, [(1415, 1670)]),
        'death':   (B, 918, 1100, [(1685, 1965)]),
        'jump':    (A, 918, 1100, [(20, 285)]),
        'airjump': (A, 655, 830, [(325, 505), (550, 735)]),
        'fall':    (A, 918, 1100, [(775, 1005)]),
        'land':    (A, 918, 1100, [(1035, 1395)]),
        'wall':    (A, 918, 1100, [(1415, 1665)]),
    },
}

for cid, anims in FR.items():
    for an, (S, y0, y1, cols) in anims.items():
        for i, (x0, x1) in enumerate(cols):
            r = tuple(round(v * K) for v in (x0, y0, x1, y1))
            im = cut(S, r)
            im.save(f'/tmp/ext/{cid}_{an}_{i}.png')
        print(cid, an, len(cols), im.size)
