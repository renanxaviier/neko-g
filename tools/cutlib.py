"""Recorte híbrido de sprites em fundo escuro (usado por build_aquatic.py e build_menu.py):
o corpo fica opaco; o brilho neon em volta vira transparência pela luminosidade."""
import numpy as np
from PIL import Image
from scipy import ndimage


def cut(SRC, rect, solid_min=62, tol=24, keep_all=False):
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
        solid |= holes & (d > tol * 1.6)
    solid = ndimage.binary_opening(solid, iterations=1)
    solid |= ndimage.binary_dilation(solid, iterations=1) & (d > tol)
    ag = np.clip((mx - bg.max()) / (255 - bg.max()), 0, 1) ** 0.85
    ag[ag < 0.06] = 0
    a = np.where(solid, 1.0, ag)
    if not keep_all:                                           # só o grupo principal (descarta pedaços vizinhos)
        lab, n = ndimage.label(ndimage.binary_dilation(a > 0.15, iterations=12))
        if n > 1:
            sz = ndimage.sum(a, lab, range(n + 1)); sz[0] = 0
            a = a * (lab == int(np.argmax(sz)))
    rgb = np.where(solid[..., None], c, np.where(a[..., None] > 0.02, (c - bg) / np.maximum(a[..., None], 0.02), 0))
    im = Image.fromarray(np.dstack([rgb.clip(0, 255), a * 255]).astype(np.uint8), 'RGBA')
    return im.crop(im.getbbox())
