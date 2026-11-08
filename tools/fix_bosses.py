"""Recorte dos chefões sobre fundo azul-escuro (não preto) da folha de inimigos.
O fundo vira transparente e o brilho (glow) fica com transparência suave, sem as manchas escuras
do recorte por tolerância. Rodar antes de tools/build_atlas.py:  python3 -I tools/fix_bosses.py"""
import numpy as np
from PIL import Image
from scipy import ndimage

SHEET = '/home/claude/assets/concept/inimigos_folha1.jpg'
S = np.array(Image.open(SHEET).convert('RGB')).astype(np.float32)

FRAMES = {   # nome: retângulos (x0, y0, x1, y1) de cada quadro
    'quimera': [(1326, 1192, 1616, 1406), (1626, 1192, 1916, 1406), (1924, 1192, 2236, 1408), (2240, 1187, 2560, 1408)],
}


def soft(rect):
    x0, y0, x1, y1 = rect
    c = S[y0:y1, x0:x1].copy()
    border = np.concatenate([c[0], c[-1], c[:, 0], c[:, -1]])
    bg = np.median(border, axis=0)
    d = np.sqrt(((c - bg) ** 2).sum(2))
    lum, blum = c.mean(2), bg.mean()
    a = np.ones(d.shape, np.float32)
    lighter = lum >= blum - 3                      # brilho/fundo; o contorno do bicho é mais escuro que o fundo
    a[lighter] = np.clip((d[lighter] - 12) / 60, 0, 1)
    dark = ~lighter
    a[dark] = np.clip((d[dark] - 6) / 20, 0, 1)
    solid = a > 0.6
    lab, n = ndimage.label(ndimage.binary_dilation(solid, iterations=4))
    sz = ndimage.sum(solid, lab, range(n + 1)); sz[0] = 0
    keep = sz >= max(400, sz.max() * 0.05)
    a *= keep[lab]
    # tira o "véu" do fundo que sobra no brilho (cor desmisturada do fundo)
    al = np.maximum(a[..., None], 1e-3)
    col = np.where(a[..., None] > 0.02, (c - bg * (1 - al)) / al, c)
    rgba = np.dstack([col.clip(0, 255), a * 255]).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')
    return im.crop(im.getbbox())


for name, rects in FRAMES.items():
    for i, r in enumerate(rects):
        im = soft(r)
        im.save(f'/tmp/ext/{name}_{i}.png')
        print(name, i, im.size)
