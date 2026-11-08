"""Monstros aquáticos (assets/concept/inimigos_aquaticos.jpg) → /tmp/ext/{nome}_{i}.png
Uso: python3 -I tools/build_aquatic.py   (depois rode build_atlas.py)"""
import sys, json
sys.path.insert(0, '/home/claude/tools')
import numpy as np
from PIL import Image
from scipy import ndimage
S = '/home/claude/assets/concept/inimigos_aquaticos.jpg'
E = '/tmp/ext/'

# nome: lista de retângulos (ordem: movimento, ataque, dano, morte)
FRAMES = {
    'lula': [(40, 95, 235, 295), (250, 95, 440, 295), (455, 95, 645, 295), (660, 95, 850, 295),
             (910, 95, 1146, 272), (1146, 95, 1528, 272),
             (1565, 95, 1742, 292), (1758, 95, 1938, 292),
             (1968, 95, 2162, 292), (2168, 95, 2352, 292), (2355, 95, 2548, 292)],
    'peixe': [(45, 398, 242, 522), (255, 398, 452, 522), (465, 398, 662, 522), (675, 398, 872, 522),
              (918, 398, 1112, 522), (1115, 398, 1322, 522), (1325, 398, 1540, 522),
              (1562, 398, 1748, 522), (1765, 398, 1942, 522),
              (1968, 396, 2162, 526), (2165, 400, 2342, 526), (2348, 400, 2522, 526)],
    'querubim': [(30, 640, 228, 788), (244, 640, 442, 788), (455, 640, 658, 788), (668, 640, 868, 788),
                 (914, 640, 1112, 792), (1128, 640, 1314, 792), (1332, 640, 1532, 792),
                 (1565, 632, 1732, 792), (1748, 626, 1928, 792),
                 (1962, 628, 2142, 792), (2148, 660, 2342, 792), (2345, 640, 2562, 792)],
    'glitch': [(18, 895, 446, 1078), (458, 888, 898, 1078),
               (924, 893, 1127, 1078), (1132, 893, 1522, 1078),
               (1550, 893, 1722, 1082), (1724, 886, 1908, 1082),
               (1932, 893, 2082, 1078), (2084, 893, 2222, 1078), (2224, 938, 2382, 1078), (2388, 940, 2562, 1078)],
    'mecha': [(28, 1188, 292, 1418), (298, 1188, 562, 1418), (568, 1188, 824, 1418),
              (848, 1188, 1076, 1418), (1076, 1188, 1298, 1418), (1298, 1188, 1502, 1418),
              (1518, 1195, 1697, 1418), (1698, 1195, 1878, 1418),
              (1898, 1195, 2082, 1418), (2080, 1195, 2302, 1418), (2300, 1195, 2562, 1418)],
}
SRC = np.array(Image.open(S).convert('RGB')).astype(np.float32)


def cut(rect, solid_min=62, tol=24):
    """Recorte híbrido: o corpo fica opaco; o brilho neon em volta vira transparência pela luminosidade
    (sem o halo escuro que sobraria de um recorte comum, e sem deixar o contorno escuro do corpo vazado)."""
    x0, y0, x1, y1 = rect
    c = SRC[y0:y1, x0:x1]
    border = np.concatenate([c[0], c[-1], c[:, 0], c[:, -1]])
    bg = np.median(border, axis=0)
    mx = c.max(axis=2)
    d = np.linalg.norm(c - bg, axis=2)
    solid = ndimage.binary_closing(mx > solid_min, iterations=2)
    holes = ndimage.binary_fill_holes(solid) & ~solid          # tapa só furinhos (vãos grandes são fundo de verdade)
    hl, hn = ndimage.label(holes)
    if hn:
        hs = ndimage.sum(holes, hl, range(hn + 1)); hs[0] = 1e9
        solid |= (hs[hl] < 90) & holes
        solid |= holes & (d > tol * 1.6)                       # vão escuro mas com cor (parte do corpo)
    solid = ndimage.binary_opening(solid, iterations=1)
    solid |= ndimage.binary_dilation(solid, iterations=1) & (d > tol)
    ag = np.clip((mx - bg.max()) / (255 - bg.max()), 0, 1) ** 0.85
    ag[ag < 0.06] = 0
    a = np.where(solid, 1.0, ag)
    # fica só com o grupo principal (descarta pedaços do quadro vizinho)
    lab, n = ndimage.label(ndimage.binary_dilation(a > 0.15, iterations=12))
    if n > 1:
        sz = ndimage.sum(a, lab, range(n + 1)); sz[0] = 0
        a = a * (lab == int(np.argmax(sz)))
    rgb = np.where(solid[..., None], c, np.where(a[..., None] > 0.02, (c - bg) / np.maximum(a[..., None], 0.02), 0))
    im = Image.fromarray(np.dstack([rgb.clip(0, 255), a * 255]).astype(np.uint8), 'RGBA')
    return im.crop(im.getbbox())


out = {}
for name, rects in FRAMES.items():
    out[name] = []
    for i, r in enumerate(rects):
        im = cut(r)
        im.save(f'{E}aq_{name}_{i}.png')
        out[name].append(im.size)
print(json.dumps(out))
