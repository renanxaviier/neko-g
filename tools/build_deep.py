"""Quadros animados da folha Abismo Cibernético (assets/concept/cenario_deep.jpg) → /tmp/ext/*.png
Uso: python3 -I tools/build_deep.py   (depois rode build_atlas.py)"""
import sys, json
sys.path.insert(0, '/home/claude/tools')
from extract_sprites import extract
from PIL import Image
S = '/home/claude/assets/concept/cenario_deep.jpg'
E = '/tmp/ext/'
out = {}


def one(rect, name, i, glow):
    """Um quadro por retângulo: junta tudo o que estiver dentro (group_px grande) e renomeia para name_i."""
    m = extract(S, rect, f'/tmp/deepx/{name}{i}', tol=26, min_area=300, group_px=60, glow=glow)
    big = max(range(len(m)), key=lambda k: m[k]['area'])
    Image.open(f'/tmp/deepx/{name}{i}_{big}.png').save(f'{E}{name}_{i}.png')
    return m[big]


ANEM = [(38, 1026, 168, 1172), (188, 1026, 318, 1172), (328, 1026, 474, 1172), (476, 1026, 624, 1172)]
JELLY = [(766, 1228, 864, 1372), (898, 1228, 1018, 1372), (1048, 1228, 1248, 1372),
         (1284, 1224, 1470, 1372), (1496, 1224, 1694, 1372), (1732, 1224, 1834, 1398)]
out['anemona'] = [one(r, 'anemona', i, False) for i, r in enumerate(ANEM)]
out['agviva'] = [one(r, 'agviva', i, True) for i, r in enumerate(JELLY)]
out['curto'] = extract(S, (2050, 1030, 2548, 1160), E + 'curto', tol=26, min_area=800, group_px=6, glow=True)
out['letreiro'] = extract(S, (1290, 1024, 1728, 1150), E + 'letreiro', tol=26, min_area=800, group_px=24, glow=True)
# vazamento: um cano longo com três estados de gota (a folha os desenhou lado a lado)
for i, (x0, x1) in enumerate(((1932, 2136), (2136, 2340), (2340, 2546))):
    m = extract(S, (x0, 1222, x1, 1372), E + f'vaz{i}', tol=26, min_area=300, group_px=40, glow=True)
    out[f'vaz{i}'] = m
print(json.dumps({k: [(f['w'], f['h']) for f in v] for k, v in out.items()}))
