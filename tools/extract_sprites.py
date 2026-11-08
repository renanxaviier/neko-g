"""Recorta sprites de uma folha conceitual em JPG (fundo azul-marinho liso) e gera PNGs transparentes.
Uso: python3 -I extract_sprites.py <folha.jpg> <x0> <y0> <x1> <y1> <prefixo_saida> [tolerancia] [area_minima]
"""
import sys, json
import numpy as np
from PIL import Image
from scipy import ndimage

def extract(path, rect, out_prefix, tol=18.0, min_area=1500, hole_area=30, group_px=10, glow=False):
    img = np.array(Image.open(path).convert('RGB')).astype(np.float32)
    x0, y0, x1, y1 = rect
    crop = img[y0:y1, x0:x1]
    border = np.concatenate([crop[0], crop[-1], crop[:, 0], crop[:, -1]])
    bg = np.median(border, axis=0)
    dist = np.linalg.norm(crop - bg, axis=2)
    near = dist < tol
    lab, n = ndimage.label(near)
    sizes = ndimage.sum(near, lab, range(n + 1))
    # fundo = manchas da cor do fundo grandes o bastante (inclui vãos entre pernas, cauda etc.)
    bgmask = sizes[lab] >= hole_area
    bgmask[lab == 0] = False
    fg = ~bgmask
    fg = ndimage.binary_opening(fg, iterations=1)
    groups, gn = ndimage.label(ndimage.binary_dilation(fg, iterations=group_px))
    frames = []
    for gi in range(1, gn + 1):
        m = (groups == gi) & fg
        area = int(m.sum())
        if area < min_area: continue
        ys, xs = np.where(m)
        by0, by1, bx0, bx1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        rgba = np.zeros((by1 - by0, bx1 - bx0, 4), np.uint8)
        sub = crop[by0:by1, bx0:bx1]
        if glow:
            # Efeitos luminosos sobre fundo preto: transparência pelo brilho (mantém o halo neon sem borda escura)
            lum = (sub.max(axis=2) - bg.max()) / (255 - bg.max())
            a = np.clip(lum, 0, 1) ** 0.85
            a *= ndimage.binary_dilation(m[by0:by1, bx0:bx1], iterations=4)
            rgb = np.where(a[..., None] > 0.02, (sub - bg) / np.maximum(a[..., None], 0.02), 0)
            rgba[..., :3] = rgb.clip(0, 255).astype(np.uint8)
            rgba[..., 3] = (a * 255).astype(np.uint8)
        else:
            rgba[..., :3] = sub.clip(0, 255).astype(np.uint8)
            rgba[..., 3] = (m[by0:by1, bx0:bx1] * 255).astype(np.uint8)
        frames.append(dict(x=int(bx0 + x0), y=int(by0 + y0), w=int(bx1 - bx0), h=int(by1 - by0), area=area, img=rgba))
    # ordem de leitura: linhas (por centro vertical) e depois colunas
    frames.sort(key=lambda f: (round((f['y'] + f['h'] / 2) / 120), f['x']))
    meta = []
    for i, f in enumerate(frames):
        Image.fromarray(f['img']).save(f'{out_prefix}_{i}.png')
        meta.append({k: f[k] for k in ('x', 'y', 'w', 'h', 'area')})
    return meta

if __name__ == '__main__':
    a = sys.argv
    meta = extract(a[1], tuple(map(int, a[2:6])), a[6], float(a[7]) if len(a) > 7 else 18.0, int(a[8]) if len(a) > 8 else 1500)
    print(json.dumps(meta))
