"""Personagens no pedestal (tela Escolher personagem) → /tmp/ext/menu_{id}_{i}.png
Folhas: assets/concept/menu_personagens.jpg (6 personagens) e menu_coelho.jpg (Coelho corrigido).
Uso: python3 -I tools/build_menu.py   (depois rode build_atlas.py)"""
import sys
sys.path.insert(0, '/home/claude/tools')
import numpy as np
from PIL import Image
from cutlib import cut

A = np.array(Image.open('/home/claude/assets/concept/menu_personagens.jpg').convert('RGB')).astype(np.float32)
B = np.array(Image.open('/home/claude/assets/concept/menu_coelho.jpg').convert('RGB')).astype(np.float32)
L = [(55, 405), (465, 815), (875, 1215)]          # colunas da esquerda
R = [(1370, 1712), (1780, 2122), (2190, 2530)]    # colunas da direita
ROWS = {
    'gato': (A, L, 82, 378), 'guaxinim': (A, L, 452, 705), 'pug': (A, L, 768, 1024),
    'macaco': (A, R, 452, 705), 'tatu': (A, R, 772, 1026), 'corvo': (A, R, 1104, 1405),
    'coelho': (B, [(230, 860), (1000, 1630), (1780, 2410)], 150, 905),
}
# Abaixo do Pug a folha tem uma faixa de ondas de choque encostando nos pedestais 2 e 3:
# a parte de baixo desses pedestais é trocada pela do 1º (os pedestais são iguais, a 410 px de distância).
def clean_pug(S, rect):
    out = S.copy()
    k = round((rect[0] - 55) / 410)
    if k:
        out[990:1024, 50 + 410 * k:410 + 410 * k] = S[990:1024, 50:410]
    out[1024:1080, :1250] = S[1024:1080, :1250] * 0 + np.median(S[1100:1110, 0:40].reshape(-1, 3), axis=0)
    return out


for cid, (S, cols, y0, y1) in ROWS.items():
    for i, (x0, x1) in enumerate(cols):
        src = clean_pug(S, (x0, y0, x1, y1)) if cid == 'pug' else S
        im = cut(src, (x0, y0, x1, y1))
        im.save(f'/tmp/ext/menu_{cid}_{i}.png')
        print(cid, i, im.size)
