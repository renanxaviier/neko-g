"""Chefões novos (assets/concept/chefoes_novos.jpg) → /tmp/ext/<id>_<anim>_<i>.png. Caixas na imagem reduzida (2000 px)."""
import sys
import numpy as np
from PIL import Image
sys.path.insert(0, '/home/claude/tools')
from cutlib import cut

S = np.array(Image.open('/home/claude/assets/concept/chefoes_novos.jpg').convert('RGB')).astype(np.float32)
K = 2576 / 2000
FR = {
    'tita': {'walk': (80, 352, [(25, 238), (255, 462), (464, 692)]), 'jump': (80, 352, [(752, 1055)]),
             'air': (80, 352, [(1200, 1415)]), 'land': (80, 352, [(1535, 1945)])},
    'rainha': {'hover': (448, 722, [(28, 348), (362, 692)]), 'dash': (448, 722, [(725, 1198)]),
               'wall': (448, 722, [(1228, 1515)]), 'turn': (448, 722, [(1605, 1965)])},
    'sentinela': {'fly': (812, 1085, [(22, 228), (238, 445), (452, 660), (668, 875)]), 'tpout': (812, 1085, [(890, 1165)]),
                  'tpin': (812, 1085, [(1262, 1515)]), 'dive': (812, 1085, [(1650, 1945)])},
}
for bid, anims in FR.items():
    for an, (y0, y1, cols) in anims.items():
        for i, (x0, x1) in enumerate(cols):
            im = cut(S, tuple(round(v * K) for v in (x0, y0, x1, y1)), keep_all=True)
            im.save(f'/tmp/ext/{bid}_{an}_{i}.png')
        print(bid, an, len(cols), im.size)
