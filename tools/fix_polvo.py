# Recorte do Polvo de Neon (substitui a extração genérica: cabeça inteira, sem rótulo, brilho suave).
# Rodar depois da extração geral e antes de tools/build_atlas.py. O quadro 1 da folha tem o rótulo por cima; usamos o 2 no lugar.
import numpy as np
from PIL import Image
from scipy import ndimage
S = np.array(Image.open('/home/claude/assets/concept/inimigos_folha1.jpg').convert('RGB')).astype(np.float32)
bg = np.median(S[1395:1430, 330:345].reshape(-1, 3), axis=0)   # fundo azul-escuro perto do polvo
print('bg', bg)

def frame(x0, y0, x1, y1, erase_text=False):
    c = S[y0:y1, x0:x1].copy()
    if erase_text:   # tira o rótulo "Polvo de Neon" (branco) e preenche com o vizinho mais próximo
        sat = c.max(2) - c.min(2)
        txt = (c.min(2) > 150) & (sat < 60)
        txt[45:] = False
        txt = ndimage.binary_dilation(txt, iterations=2)
        idx = ndimage.distance_transform_edt(txt, return_distances=False, return_indices=True)
        c = c[idx[0], idx[1]]
        # fora da cabeça o preenchimento vira fundo
    d = np.sqrt(((c - bg) ** 2).sum(2))
    lum, blum = c.mean(2), bg.mean()
    alpha = np.ones(d.shape, np.float32)
    lighter = lum >= blum - 4                       # halo/fundo (contorno do corpo é mais escuro que o fundo)
    alpha[lighter] = np.clip((d[lighter] - 14) / 70, 0, 1)
    # mantém só o componente principal (+ faíscas que encostam nele)
    solid = alpha > 0.5
    lab, n = ndimage.label(ndimage.binary_dilation(solid, iterations=6))
    sizes = ndimage.sum(solid, lab, range(n + 1)); sizes[0] = 0
    keep = sizes > 800
    alpha *= keep[lab]
    if erase_text:   # fundo que o preenchimento puxou para a área do texto
        pass
    rgba = np.dstack([c, alpha * 255]).clip(0, 255).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA'); return im.crop(im.getbbox())

out = [frame(28, 1190, 330, 1436, True), frame(335, 1190, 625, 1436), frame(625, 1190, 925, 1436), frame(925, 1190, 1300, 1436)]
for i, im in enumerate(out):
    im.save(f'/tmp/ext/polvo_{i}.png'); print(i, im.size)
bgc = Image.new('RGBA', (sum(i.width for i in out) + 40, max(i.height for i in out)), (40, 200, 90, 255))
x = 0
for im in out: bgc.alpha_composite(im, (x, 0)); x += im.width + 10
dk = Image.new('RGBA', bgc.size, (12, 8, 30, 255)); x = 0
for im in out: dk.alpha_composite(im, (x, 0)); x += im.width + 10
o = Image.new('RGBA', (bgc.width, bgc.height * 2)); o.paste(bgc, (0, 0)); o.paste(dk, (0, bgc.height)); o.save('/tmp/pv_fix.png')
import shutil; shutil.copy('/tmp/ext/polvo_1.png', '/tmp/ext/polvo_0.png')
