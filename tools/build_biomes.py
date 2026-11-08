"""Arte dos biomas a partir de assets/concept/cenarios_biomas.jpg (fundo preto).

Gera:
- web/assets/biomes/{bioma}_near.webp : faixa de cenário (camada de parallax próxima), fundo preto removido
- web/assets/biomes/{bioma}_tex.webp  : texturas em escala de mundo (1 px = 1 px de mundo), empilhadas:
      fill (preenchimento dos blocos, repetível), top (faixa da superfície), plat (plataforma de mão única)
- /tmp/ext/bio_{nome}_0.png           : peças de cenário recortadas (entram no atlas via build_atlas.py)
- web/src/biomeArt.js                 : medidas de tudo acima
Uso: python3 -I tools/build_biomes.py
"""
import json, os
import numpy as np
from PIL import Image
from scipy import ndimage

SHEET = '/home/claude/assets/concept/cenarios_biomas.jpg'
SHEET2 = '/home/claude/assets/concept/cenarios_biomas2.jpg'      # 6 cenários novos (v0.7)
SHEET3 = '/home/claude/assets/concept/cenario_deep.jpg'           # Abismo Cibernético (subaquático, v0.9)
OUT = '/home/claude/web/assets/biomes/'
EXT = '/tmp/ext/'
os.makedirs(OUT, exist_ok=True)
os.makedirs(EXT, exist_ok=True)
SRC = {1: np.array(Image.open(SHEET).convert('RGB')).astype(np.float32),
       2: np.array(Image.open(SHEET2).convert('RGB')).astype(np.float32),
       3: np.array(Image.open(SHEET3).convert('RGB')).astype(np.float32)}
src = SRC[1]


def use(n):
    global src
    src = SRC[n]


def cut(rect, tol=30, hole=600, open_it=True):
    """Recorta o retângulo e torna transparente o preto do fundo (manchas escuras grandes)."""
    x0, y0, x1, y1 = rect
    c = src[y0:y1, x0:x1]
    near = c.max(axis=2) < tol
    lab, n = ndimage.label(near)
    sizes = ndimage.sum(near, lab, range(n + 1))
    bg = (sizes[lab] >= hole) & (lab > 0)
    fg = ~bg
    if open_it:
        fg = ndimage.binary_opening(fg, iterations=1)
    a = fg.astype(np.float32)
    # borda suave de 1 px
    a = np.maximum(a * 0.0, ndimage.uniform_filter(a, 3)) * fg + 0.0
    rgba = np.dstack([c, a * 255]).clip(0, 255).astype(np.uint8)
    im = Image.fromarray(rgba, 'RGBA')
    bb = im.getbbox()
    return im.crop(bb) if bb else im


def cut_key(rect, key, ktol=36, tol=30, hole=300):
    """Como cut(), mas também trata como fundo a cor do piso/parede (amostrada no ponto key da folha)."""
    x0, y0, x1, y1 = rect
    c = src[y0:y1, x0:x1]
    kc = src[key[1], key[0]]
    d = np.sqrt(((c - kc) ** 2).sum(2))
    near = (c.max(axis=2) < tol) | (d < ktol)
    lab, n = ndimage.label(near)
    sizes = ndimage.sum(near, lab, range(n + 1))
    bg = (sizes[lab] >= hole) & (lab > 0)
    fg = ndimage.binary_opening(~bg, iterations=1)
    lab2, n2 = ndimage.label(fg)                      # fica só com as partes grandes (tira farelos)
    if n2:
        sz = ndimage.sum(fg, lab2, range(n2 + 1)); sz[0] = 0
        fg = sz[lab2] >= max(60, sz.max() * 0.04)
    a = ndimage.uniform_filter(fg.astype(np.float32), 3) * fg
    im = Image.fromarray(np.dstack([c, a * 255]).clip(0, 255).astype(np.uint8), 'RGBA')
    bb = im.getbbox()
    return im.crop(bb) if bb else im


def opaque(rect):
    x0, y0, x1, y1 = rect
    return Image.fromarray(src[y0:y1, x0:x1].clip(0, 255).astype(np.uint8), 'RGB').convert('RGBA')


def resize(im, h):
    """Redimensiona mantendo proporção para a altura h (pré-multiplicando alfa para não criar halo)."""
    w = max(1, round(im.width * h / im.height))
    arr = np.array(im).astype(np.float32)
    arr[..., :3] *= arr[..., 3:4] / 255
    r = Image.fromarray(arr.clip(0, 255).astype(np.uint8)).resize((w, h), Image.LANCZOS)
    arr = np.array(r).astype(np.float32)
    al = arr[..., 3:4]
    arr[..., :3] = np.where(al > 0, arr[..., :3] * 255 / np.maximum(al, 1), 0)
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), 'RGBA')


def mirror_tile(im, both=True):
    """Textura repetível sem emenda: original + espelho (horizontal e, se pedir, vertical)."""
    w, h = im.size
    row = Image.new('RGBA', (w * 2, h))
    row.paste(im, (0, 0)); row.paste(im.transpose(Image.FLIP_LEFT_RIGHT), (w, 0))
    if not both:
        return row
    full = Image.new('RGBA', (w * 2, h * 2))
    full.paste(row, (0, 0)); full.paste(row.transpose(Image.FLIP_TOP_BOTTOM), (0, h))
    return full


NEAR_FEATHER = 0.14   # fração da largura que esmaece em cada lado (as cópias se sobrepõem e se misturam)


def feather(im, fx=NEAR_FEATHER, ft=0.2):
    """Esmaece as laterais e o topo da faixa próxima: sem emenda seca ao repetir, sem topo serrilhado."""
    a = np.array(im).astype(np.float32)
    h, w = a.shape[:2]
    sm = lambda v: v * v * (3 - 2 * v)
    xs = np.arange(w, dtype=np.float32)
    fw = max(1, int(w * fx))
    rx = np.clip(np.minimum(xs, w - 1 - xs) / fw, 0, 1)
    ys = np.arange(h, dtype=np.float32)
    ry = np.clip(ys / max(1, h * ft), 0, 1)
    a[..., 3] *= sm(rx)[None, :] * sm(ry)[:, None]
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')


def gen_fill(style, base, line, accent, size=64, seed=1):
    """Preenchimento de bloco gerado (repete sem emenda): 'tiles', 'panel' ou 'concrete'."""
    rng = np.random.default_rng(seed)
    hexc = lambda c: np.array([int(c[i:i + 2], 16) for i in (1, 3, 5)], np.float32)
    B, L, A = hexc(base), hexc(line), hexc(accent)
    img = np.ones((size, size, 3), np.float32) * B
    n = ndimage.gaussian_filter(rng.normal(0, 1, (size, size)), 1.2, mode='wrap')
    img += n[..., None] * 6
    if style == 'tiles':
        q = size // 2
        for k in (0, q):
            img[k, :] = L; img[:, k] = L
            img[k + 1, :] = img[k + 1, :] * 0.8 + B * 0.35; img[:, k + 1] = img[:, k + 1] * 0.8 + B * 0.35
        img[q // 2, q // 2] = A; img[q + q // 2, q + q // 2] = A
    elif style == 'panel':
        img[0, :] = L; img[:, 0] = L; img[size // 2, :] = L
        img[1, :] = B * 1.25; img[:, 1] = B * 1.25
        for (y, x) in ((4, 4), (4, size - 5), (size // 2 - 4, 4), (size // 2 - 4, size - 5), (size // 2 + 4, 4), (size - 5, size - 5)):
            img[y:y + 2, x:x + 2] = L * 1.3
        img[size // 2 + 10:size // 2 + 12, 8:size - 8] = A * 0.6 + B * 0.4
    else:   # concrete: manchas grandes suaves, sem rachadura repetida
        big = ndimage.gaussian_filter(rng.normal(0, 1, (size, size)), 6, mode='wrap')
        img += big[..., None] * 18
        img[rng.random((size, size)) > 0.985] *= 0.75
    rgba = np.dstack([img.clip(0, 255), np.full((size, size), 255, np.float32)]).astype(np.uint8)
    return Image.fromarray(rgba, 'RGBA')


def shade(im, k):
    arr = np.array(im).astype(np.float32)
    arr[..., :3] *= k
    return Image.fromarray(arr.clip(0, 255).astype(np.uint8), 'RGBA')


NEAR_SS = 1.6      # pixels da imagem por pixel de mundo na camada próxima

BIOMES = {
    'coast': dict(
        near=((30, 80, 1282, 418), 230),
        fill=((1312, 88, 1795, 192), 46, 0.55, True),
        top=((34, 372, 1278, 416), 14, 1.0),
        plat=((2196, 334, 2392, 398), 14, 1.0),
    ),
    'favelas': dict(
        near=((30, 555, 1282, 940), 250),
        fill=((1330, 884, 1800, 932), 30, 0.5, True),
        top=((1388, 563, 1802, 611), 16, 0.95),
        plat=((1902, 680, 2543, 724), 13, 1.0),
    ),
    'porto': dict(
        near=((30, 1036, 1282, 1346), 210),
        fill=((1312, 1309, 1820, 1338), 18, 0.6, True),
        top=((1934, 1037, 2346, 1073), 14, 1.0),
        plat=((1934, 1037, 2346, 1073), 12, 1.0),
    ),
}

# Folha 2 (cenarios_biomas2.jpg): setores 5 em diante
BIOMES2 = {
    'subway': dict(
        near=((12, 172, 805, 468), 220),
        fill=((12, 404, 805, 466), 26, 0.55, False),
        top=((12, 290, 805, 322), 14, 1.0),
        plat=((12, 172, 805, 196), 12, 1.0),
    ),
    'genelab': dict(
        near=((1297, 152, 1846, 470), 210),
        fill=((1700, 412, 2090, 446), 26, 0.55, False), fillgen=('panel', '#2a363e', '#1a2329', '#4dff8c'),
        top=((1310, 446, 2090, 466), 12, 1.0),
        plat=((1310, 446, 2090, 462), 12, 1.0),
    ),
    'mall': dict(
        near=((12, 655, 708, 955), 210),
        fill=((14, 662, 250, 712), 30, 0.6, False), fillgen=('tiles', '#3a2d5c', '#5a4488', '#ff6ad5'),
        top=((140, 856, 700, 884), 14, 1.0),
        plat=((270, 702, 470, 730), 12, 1.0),
    ),
    'cage': dict(
        near=((1297, 580, 2565, 955), 230), clear=[(1297, 580, 1610, 660)],
        fill=((1950, 880, 2200, 950), 34, 0.6, False), fillgen=('concrete', '#3a3742', '#2a2830', '#ff4d6a'),
        top=((1302, 700, 1690, 728), 14, 1.0),
        plat=((1302, 700, 1690, 722), 12, 1.0),
    ),
    'jungle': dict(
        near=((12, 1114, 700, 1430), 230),
        fill=((14, 1350, 280, 1425), 34, 0.55, False),
        top=((282, 1292, 588, 1334), 14, 1.0),
        plat=((262, 1166, 470, 1196), 12, 1.0),
    ),
    'casino': dict(
        near=((1297, 1040, 1960, 1430), 220), clear=[(1297, 1040, 1700, 1116)],
        fill=((1300, 1100, 1460, 1200), 34, 0.55, False),
        top=((1530, 1290, 2020, 1318), 14, 1.0),
        plat=((1720, 1222, 1880, 1252), 12, 1.0),
    ),
}

# Folha 3 (cenario_deep.jpg): Abismo Cibernético — setor subaquático
BIOMES3 = {
    'deep': dict(
        near=((36, 124, 2542, 442), 230),
        fill=((740, 862, 1140, 900), 24, 0.95, True),
        top=((738, 818, 1142, 858), 14, 1.0),
        plat=((948, 684, 1084, 722), 12, 1.0),
    ),
}

PROPS3 = {
    'reef1':     ((40, 150, 286, 442), 96, 'cut'),
    'reef2':     ((392, 214, 640, 442), 80, 'cut', {'clear': [(0, 0, 58, 62), (50, 0, 120, 26)]}),
    'kelp_c':    ((660, 236, 912, 442), 64, 'cut', {'tol': 44, 'clear': [(0, 0, 110, 48), (120, 0, 252, 40)]}),
    'sub':       ((928, 138, 1418, 442), 112, 'cut', {'tol': 34}),
    'deepgate':  ((1434, 128, 1848, 442), 120, 'cut'),
    'pipe_w':    ((1862, 128, 2318, 442), 104, 'cut'),
    'bubbles_c': ((2322, 128, 2542, 442), 80, 'cut'),
    'rocks_crab': ((40, 590, 372, 905), 100, 'cut'),
    'rocks_box': ((388, 580, 718, 905), 100, 'cut'),
    'leak_v':    ((1162, 562, 1236, 905), 104, 'cut'),
    'pipe_u':    ((1296, 556, 1672, 722), 50, 'cut'),
    'ladder':    ((1702, 566, 1842, 790), 66, 'cut'),
    'ladder2':   ((1298, 772, 1442, 905), 40, 'cut'),
    'railing':   ((1462, 816, 1830, 905), 30, 'cut'),
    'crates':    ((1876, 576, 2204, 742), 48, 'cut'),
    'crate':     ((1876, 770, 2102, 905), 40, 'cut'),
    'mine':      ((2204, 552, 2322, 792), 70, 'cut', {'clear': [(0, 170, 30, 240)]}),
    'mine2':     ((2122, 758, 2242, 905), 44, 'cut'),
    'bars':      ((2334, 574, 2538, 742), 52, 'cut'),
    'barrier':   ((2312, 768, 2538, 905), 40, 'cut'),
}

PROPS2 = {
    'servers1':  ((846, 160, 1044, 352), 66, 'cut'),
    'servers2':  ((1068, 160, 1264, 352), 66, 'cut'),
    'tube_p':    ((1880, 78, 1992, 288), 64, 'cut'),
    'tube_g':    ((2004, 78, 2118, 288), 64, 'cut'),
    'tube_c':    ((2138, 78, 2248, 288), 64, 'cut'),
    'tube_g2':   ((2278, 92, 2362, 288), 56, 'cut'),
    'tube_m':    ((2374, 96, 2458, 288), 56, 'cut'),
    'tube_b':    ((2466, 96, 2548, 288), 56, 'cut'),
    'labdesk':   ((1900, 302, 2044, 390), 30, 'cut', {'key': (2060, 380)}),
    'labpc':     ((2112, 348, 2210, 462), 32, 'cut'),
    'robotarm':  ((2196, 292, 2352, 466), 52, 'cut', {'clear': [(0, 88, 40, 174)]}),
    'robotarm2': ((2350, 296, 2484, 466), 50, 'cut'),
    'terminal':  ((2482, 346, 2552, 466), 34, 'cut'),
    'poster_p':  ((370, 558, 436, 668), 34, 'cut', {'lift': True}),
    'holo':      ((460, 556, 600, 690), 44, 'cut'),
    'poster_m':  ((610, 558, 674, 664), 34, 'cut'),
    'poster_y':  ((356, 760, 414, 840), 26, 'cut'),
    'shopwin':   ((714, 552, 1004, 730), 62, 'cut'),
    'sign_g':    ((1018, 562, 1158, 626), 20, 'cut'),
    'sign_trd':  ((1026, 646, 1168, 730), 26, 'cut'),
    'sign_vm':   ((1192, 560, 1264, 746), 52, 'cut'),
    'shopdoor':  ((731, 742, 970, 914), 62, 'cut'),
    'arcade1':   ((983, 758, 1114, 910), 44, 'cut'),
    'arcade2':   ((1152, 762, 1274, 910), 42, 'cut'),
    'tires':     ((2278, 818, 2404, 918), 30, 'cut', {'key': (2420, 905), 'ktol': 52}),
    'tire':      ((2212, 852, 2278, 894), 12, 'cut', {'key': (2240, 905)}),
    'efence':    ((1898, 738, 2084, 862), 50, 'cut', {'key': (1990, 875)}),
    'stands':    ((1297, 662, 1848, 884), 96, 'cut'),
    'gtree':     ((730, 1036, 1050, 1318), 124, 'cut', {'tol': 40, 'key': (760, 1340), 'ktol': 28}),
    
    'fall':      ((1132, 1094, 1282, 1330), 80, 'cut', {'tol': 40}),
    'plant_c':   ((736, 1266, 800, 1400), 34, 'cut', {'tol': 40, 'key': (770, 1410)}),
    'casino1':   ((1964, 1036, 2258, 1238), 90, 'cut'),
    'casino2':   ((2276, 1036, 2568, 1228), 90, 'cut'),
    'roulette':  ((2052, 1238, 2238, 1340), 30, 'cut', {'key': (2100, 1400)}),
    'cards':     ((2246, 1266, 2424, 1422), 38, 'cut', {'key': (2200, 1410)}),
    'slot1':     ((2408, 1228, 2492, 1334), 36, 'cut', {'key': (2440, 1400)}),
    'slot2':     ((2488, 1236, 2556, 1366), 40, 'cut', {'key': (2440, 1400)}),
}

PROPS = {
    # nome: (retângulo, altura no mundo, recorte)
    'bench':     ((2046, 214, 2194, 314), 26, 'cut'),
    'bench2':    ((2204, 214, 2352, 314), 26, 'cut'),
    'trash':     ((1940, 210, 2020, 314), 24, 'cut'),
    'scaffold':  ((1308, 556, 1826, 942), 150, 'cut'),
    'conveyor':  ((1310, 1118, 1748, 1224), 30, 'cut'),
    'pipes':     ((1310, 1036, 1928, 1218), 70, 'pipes'),
    'control':   ((2088, 1128, 2172, 1214), 26, 'cut'),
    'signal':    ((2378, 1034, 2428, 1124), 34, 'cut'),
    'panel':     ((2438, 1034, 2546, 1136), 36, 'cut'),
    'tlight_r':  ((986, 1036, 1040, 1106), 30, 'cut'),
    'tlight_y':  ((1092, 1036, 1146, 1106), 30, 'cut'),
    'gate':      ((972, 1110, 1282, 1312), 110, 'cut'),
    'containers': ((707, 1062, 933, 1339), 120, 'opaque'),
    'container_o': ((397, 1224, 623, 1388), 64, 'opaque'),
    # v0.5: peças isoladas que faltavam (reenvio da folha)
    'palm_b':    ((30, 88, 194, 292), 96, 'cut', {'tol': 80}),
    'palm_p':    ((1100, 88, 1280, 292), 96, 'cut', {'tol': 50}),
    'sign_h':    ((665, 180, 870, 266), 22, 'cut'),
    'sign_v':    ((888, 105, 956, 238), 40, 'cut'),
    'sign_v2':   ((970, 135, 1040, 290), 40, 'cut'),
    'fsign1':    ((285, 575, 340, 720), 40, 'cut'),
    'fsign2':    ((812, 560, 865, 695), 36, 'cut'),
    'dish':      ((1090, 560, 1280, 655), 26, 'cut'),
    'catwalk':   ((1845, 1160, 2545, 1418), 96, 'cut', {'clear': [(0, 0, 340, 64)]}),
}

data = {'nearSS': NEAR_SS, 'nearFeather': NEAR_FEATHER, 'biomes': {}}
ALL_BIOMES = [(1, k, v) for k, v in BIOMES.items()] + [(2, k, v) for k, v in BIOMES2.items()] + [(3, k, v) for k, v in BIOMES3.items()]
for sheet, bid, B in ALL_BIOMES:
    use(sheet)
    rect, wh = B['near']
    keep = src.copy() if B.get('clear') else None
    for cx0, cy0, cx1, cy1 in B.get('clear', []):          # apaga rótulos da folha que caem no recorte
        src[cy0:cy1, cx0:cx1] = 0
    near = feather(resize(cut(rect, tol=26, hole=400), round(wh * NEAR_SS)))
    if keep is not None:
        src[:] = keep
    near.save(f'{OUT}{bid}_near.webp', 'WEBP', quality=82, method=6)
    parts, info, y = [], {}, 0
    for key in ('fill', 'top', 'plat'):
        r, h, k, *rest = B[key]
        if key == 'fill' and B.get('fillgen'):
            st, b0, l0, a0 = B['fillgen']
            im = shade(gen_fill(st, b0, l0, a0, seed=len(bid)), 0.8)
        else:
            im = shade(resize(opaque(r), h), k)
            im = mirror_tile(im, both=bool(rest and rest[0])) if key == 'fill' else mirror_tile(im, both=False)
        info[key] = [0, y, im.width, im.height]
        parts.append((im, y)); y += im.height + 2
    tex = Image.new('RGBA', (max(p.width for p, _ in parts), y))
    for im, yy in parts:
        tex.paste(im, (0, yy))
    tex.save(f'{OUT}{bid}_tex.webp', 'WEBP', quality=88, method=6)
    data['biomes'][bid] = dict(near=[near.width, near.height], **info)
    print(bid, 'near', near.size, 'tex', tex.size,
          os.path.getsize(f'{OUT}{bid}_near.webp') // 1024, 'KB +', os.path.getsize(f'{OUT}{bid}_tex.webp') // 1024, 'KB')

ALL_PROPS = ([(1, k, v) for k, v in PROPS.items()] + [(2, k, v) for k, v in PROPS2.items()]
             + [(3, k, v) for k, v in PROPS3.items()])
for sheet, name, (rect, wh, mode, *opt) in ALL_PROPS:
    use(sheet)
    opt = opt[0] if opt else {}
    if mode == 'opaque':
        im = opaque(rect)
    elif mode == 'pipes':
        im = cut(rect, tol=30, hole=200)
        # tira a esteira, que fica embaixo dos canos no mesmo retângulo
        arr = np.array(im)
        arr[int(arr.shape[0] * 0.40):, : int(arr.shape[1] * 0.73)] = 0
        im = Image.fromarray(arr, 'RGBA'); im = im.crop(im.getbbox())
    elif mode == 'crane':
        # guindaste: acima da cerca o fundo é preto; abaixo dela, só a torre (colunas centrais)
        im = cut(rect, tol=30, hole=200)
        arr = np.array(im)
        fence_y = 1206 - rect[1]
        cx0, cx1 = 105 - (rect[0] - 38) + 0, 185 - (rect[0] - 38)
        arr[fence_y:, :cx0] = 0; arr[fence_y:, cx1:] = 0
        im = Image.fromarray(arr, 'RGBA'); im = im.crop(im.getbbox())
    else:
        if opt.get('clear'):                       # apaga lixo vizinho (px relativos ao retângulo)
            x0, y0, x1, y1 = rect
            keep = src[y0:y1, x0:x1].copy()
            for cx0, cy0, cx1, cy1 in opt['clear']:
                src[y0 + cy0:y0 + cy1, x0 + cx0:x0 + cx1] = 0
            im = cut(rect, tol=opt.get('tol', 30))
            src[y0:y1, x0:x1] = keep
        elif opt.get('key'):
            im = cut_key(rect, opt['key'], ktol=opt.get('ktol', 36), tol=opt.get('tol', 30))
        else:
            im = cut(rect, tol=opt.get('tol', 30))
    im.save(f'{EXT}bio_{name}_0.png')
    data.setdefault('props', {})[name] = [im.width, im.height, wh]

with open('/home/claude/tools/bio_props.json', 'w') as fh:   # build_atlas.py inclui todas as peças
    json.dump(data['props'], fh)
with open('/home/claude/web/src/biomeArt.js', 'w') as fh:
    fh.write('// Gerado por tools/build_biomes.py — não editar à mão.\n')
    fh.write('// near: [w, h] da camada próxima (nearSS px por px de mundo); fill/top/plat: [x, y, w, h] em {bioma}_tex.webp (1 px = 1 px de mundo).\n')
    fh.write('export const BIOME_ART = ' + json.dumps(data['biomes'], separators=(',', ':')) + ';\n')
    fh.write(f'export const NEAR_SS = {NEAR_SS};\n')
print('props', {k: v[:2] for k, v in data['props'].items()})
