"""Efeitos de armas (assets/concept/armas_vfx.jpg) → /tmp/ext/wpn_<id>_<i>.png.
Os quadros de cada faixa são separados automaticamente pelas colunas vazias.
Efeitos de luz: alfa pela luminosidade (fundo preto some). Peças sólidas (martelo, armas) usam o recorte híbrido."""
import sys
import numpy as np
from PIL import Image
from scipy import ndimage
sys.path.insert(0, '/home/claude/tools')
from cutlib import cut

S = np.array(Image.open('/home/claude/assets/concept/armas_vfx.jpg').convert('RGB')).astype(np.float32)
K = 2576 / 2000                                              # coordenadas medidas na imagem reduzida (2000 px)

# id: (x0, y0, x1, y1) da faixa (na imagem reduzida), modo
BANDS = {
    'laser':   (40, 115, 990, 240, 'glow'),
    'trail':   (40, 320, 990, 450, 'glow'),
    'plasma':  (40, 535, 990, 695, 'glow'),
    'shock':   (40, 745, 990, 880, 'glow'),
    'glitch':  (40, 935, 990, 1105, 'glow'),
    'dados':   (1045, 105, 1975, 225, 'glow'),
    'energia': (1045, 275, 1975, 475, 'glow'),
    'arcos':   (1045, 535, 1975, 700, 'glow'),
    'martelo': (1045, 760, 1975, 910, 'solid'),
    'garras':  (1045, 975, 1975, 1090, 'glow'),
}


# Faixas com quadros encostados: cortes manuais (x na imagem reduzida)
SPLITS = {'dados': [(1048, 1152), (1155, 1318), (1322, 1495), (1500, 1675), (1680, 1822), (1824, 1972)]}
CLOSE = {'dados': 3, 'martelo': 3, 'energia': 3, 'laser': 4, 'shock': 5, 'glitch': 5, 'arcos': 4}


def glow(c):
    mx = c.max(axis=2)
    a = np.clip((mx - 14) / 200, 0, 1) ** 0.9
    a[a < 0.05] = 0
    rgb = np.where(a[..., None] > 0.02, c / np.maximum(a[..., None], 0.02), 0)
    im = Image.fromarray(np.dstack([rgb.clip(0, 255), a * 255]).astype(np.uint8), 'RGBA')
    return im.crop(im.getbbox())


out = {}
for bid, (x0, y0, x1, y1, mode) in BANDS.items():
    X0, Y0, X1, Y1 = (round(v * K) for v in (x0, y0, x1, y1))
    band = S[Y0:Y1, X0:X1]
    col = (band.max(axis=2) > 40).sum(axis=0) > 0
    col = ndimage.binary_closing(col, iterations=CLOSE.get(bid, 10))   # junta faíscas soltas do mesmo quadro
    lab, n = ndimage.label(col)
    frames = []
    if bid in SPLITS:
        for a, b in SPLITS[bid]:
            r = (round(a * K), Y0, round(b * K), Y1)
            frames.append(glow(S[r[1]:r[3], r[0]:r[2]]))
        n = 0
    for i in range(1, n + 1):
        xs = np.where(lab == i)[0]
        if len(xs) < 25: continue
        fx0, fx1 = X0 + xs[0], X0 + xs[-1] + 1
        rect = (max(0, fx0 - 4), Y0, min(S.shape[1], fx1 + 4), Y1)
        im = cut(S, rect, keep_all=True) if mode == 'solid' else glow(S[rect[1]:rect[3], rect[0]:rect[2]])
        frames.append(im)
    for i, im in enumerate(frames):
        im.save(f'/tmp/ext/wpn_{bid}_{i}.png')
    out[bid] = [im.size for im in frames]
    print(bid, len(frames), out[bid])
