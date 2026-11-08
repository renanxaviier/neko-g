# Recorta sprites das folhas do jogo para o site (tiras de quadros WebP) e grava o manifesto.
import sys, json, math
sys.path.insert(0, '/tmp/wiki_tools')
from PIL import Image
import atlas
A = atlas.load()
SP = '/home/claude/web/assets/sprites/'
OUT = '/home/claude/site/img/'
sheets = {}
def sheet(s):
    if s not in sheets: sheets[s] = Image.open(SP + s + '.webp').convert('RGBA')
    return sheets[s]
man = {}

def strip(name, keys, scale=1.0, nearest=False, maxw=None, maxh=None, lossless=False, q=86, every=1):
    frames = []
    for k in keys:
        a = A[k]
        for f in a['frames'][::every]:
            frames.append((a['s'], f))
    ax = max(f[4] for _, f in frames); ay = max(f[5] for _, f in frames)
    rx = max(f[2] - f[4] for _, f in frames); ry = max(f[3] - f[5] for _, f in frames)
    cw, ch = math.ceil(ax + rx), math.ceil(ay + ry)
    sc = scale
    if maxw: sc = min(sc, maxw / cw)
    if maxh: sc = min(sc, maxh / ch)
    if nearest: sc = max(1, round(sc))
    W, H = max(1, round(cw * sc)), max(1, round(ch * sc))
    out = Image.new('RGBA', (W * len(frames), H), (0, 0, 0, 0))
    for i, (s, f) in enumerate(frames):
        x, y, w, h, fax, fay = f[:6]
        im = sheet(s).crop((x, y, x + w, y + h))
        cell = Image.new('RGBA', (cw, ch), (0, 0, 0, 0))
        cell.paste(im, (round(ax - fax), round(ay - fay)))
        cell = cell.resize((W, H), Image.NEAREST if nearest else Image.LANCZOS)
        out.paste(cell, (i * W, 0))
    fn = name + '.webp'
    if lossless: out.save(OUT + fn, 'WEBP', lossless=True, method=6)
    else: out.save(OUT + fn, 'WEBP', quality=q, method=6, alpha_quality=90)
    fps = A[keys[0]].get('fps', 6)
    man[name] = {'w': W, 'h': H, 'n': len(frames), 'fps': fps}

# Personagens (folha menu = pixel art nativa: NEAREST ×3)
for c in ['gato', 'guaxinim', 'pug', 'coelho', 'macaco', 'tatu', 'corvo']:
    strip('char_' + c, ['menu.' + c], scale=3, nearest=True, lossless=True)
    strip('char2_' + c, ['menu.' + c], scale=2, nearest=True, lossless=True)

# Movimentos do gato (Como se joga)
for k in ['run', 'airjump', 'dash', 'attack']:
    strip('gato_' + k, ['gato.' + k], scale=0.62)
strip('guaxinim_glide', ['guaxinim.glide'], scale=0.62)
strip('pug_slam', ['pug.slam', 'pug.land'], scale=0.62)

# Inimigos (quadros de movimento)
EN = ['rato','esquilo','drone','aranha','morcego','ourico','sapo','medusa','ratoasa','vagalume','macaco','ornitorrinco','peixe',
      'hound','vespa','lobo','dronev','caranguejo','bode','canguru','camaleao','coruja','leaomarinho','tubarao','lula','alce','texugo',
      'urso','panda','gorila','crocodilo','touro','rinoceronte','querubim']
for e in EN:
    keys = [e + '.move']
    if len(A[e + '.move']['frames']) == 1:
        for extra in ('tele', 'atk', 'leap'):
            if e + '.' + extra in A: keys.append(e + '.' + extra); break
    strip('en_' + e, keys, scale=0.7, maxw=150, maxh=100)

# Chefões
BS = {'polvo': ['polvo.move', 'polvo.tele'], 'quimera': ['quimera.p1', 'quimera.p2', 'quimera.p3'], 'dragao': ['dragao.move'],
      'trex': ['trex.move', 'trex.p2'], 'tita': ['tita.walk'], 'rainha': ['rainha.hover', 'rainha.dash'],
      'sentinela': ['sentinela.fly'], 'mecha': ['mecha.move'], 'serpente': ['serpente.move']}
for b, keys in BS.items():
    strip('boss_' + b, keys, scale=0.8, maxw=230, maxh=170)

# Itens e armas exclusivas
for it in ['battery', 'coin', 'cyber', 'hp']:
    strip('it_' + it, ['it.' + it], scale=1)
for w in ['garras', 'dados', 'martelo']:
    strip('wpn_' + w, ['wpn.' + w], scale=0.55)

json.dump(man, open('/tmp/wiki_tools/manifest.json', 'w'), indent=0)
print(json.dumps(man))
