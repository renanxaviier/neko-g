"""Monta o atlas de sprites do jogo a partir dos quadros recortados (/tmp/ext/*.png).
Gera web/assets/sprites/atlas.png e web/src/atlasData.js.

Cada animação: lista de quadros-fonte, fps, loop, altura visual de referência (px de mundo) e âncora.
- âncora 'feet': x = centro da cabeça (estável entre quadros), y = base (pés no chão)
- âncora 'center': centro de massa (voadores)
"""
import json
import numpy as np
from PIL import Image

EXT = '/tmp/ext/'
SS = 2.5   # pixels do atlas por pixel de mundo (nitidez em telas 2x)

def split_wide(name, idx, parts):
    """Divide um quadro que veio grudado (ex.: efeito do golpe ligou dois quadros) na coluna de menor opacidade."""
    im = np.array(Image.open(f'{EXT}{name}_{idx}.png'))
    a = im[..., 3] > 0
    cols = a.sum(axis=0)
    w = im.shape[1]
    cuts = []
    for k in range(1, parts):
        lo, hi = int(w * (k / parts - 0.15)), int(w * (k / parts + 0.15))
        cuts.append(lo + int(np.argmin(cols[lo:hi])))
    edges = [0] + cuts + [w]
    out = []
    for i in range(parts):
        sub = im[:, edges[i]:edges[i + 1]]
        ys, xs = np.where(sub[..., 3] > 0)
        sub = sub[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
        p = f'{EXT}{name}_{idx}_{i}.png'
        Image.fromarray(sub).save(p)
        out.append(p)
    return out

def f(name, *idx):
    return [f'{EXT}{name}_{i}.png' for i in idx]

atk = split_wide('gatoB_attack', 1, 2)
atk2 = split_wide('gatoB_attack', 3, 2)

def crop_left(name, idx, frac, out):
    im = Image.open(f'{EXT}{name}_{idx}.png')
    sub = im.crop((0, 0, int(im.width * frac), im.height))
    sub = sub.crop(sub.getbbox())
    p = f'{EXT}{out}.png'; sub.save(p); return [p]

dronev_body = crop_left('dronev', 1, 0.42, 'dronev_atk_body')

def strip_rule(name, idx, out):
    """Remove a linha divisória da folha que grudou no quadro (linhas finas quase inteiras) e sobras soltas."""
    from scipy import ndimage
    im = np.array(Image.open(f'{EXT}{name}_{idx}.png'))
    a = im[..., 3] > 0
    rows = a.mean(axis=1)
    for y in np.where(rows > 0.45)[0]:
        im[max(0, y - 1):y + 2, :, 3] = 0
    a = im[..., 3] > 0
    lab, n = ndimage.label(a)
    if n > 1:
        sizes = ndimage.sum(a, lab, range(n + 1))
        keep = sizes >= sizes.max() * 0.04
        keep[0] = False
        im[..., 3] = np.where(keep[lab], im[..., 3], 0)
    img = Image.fromarray(im)
    img = img.crop(img.getbbox())
    p = f'{EXT}{out}.png'; img.save(p); return [p]

trex_visor = strip_rule('trex', 0, 'trex_visor')


# nome: (quadros, fps, loop, escala_ref(px_fonte, px_mundo), âncora)
ANIMS = {
    'gato.idle':    (f('gato_idle', 0, 1, 2, 3), 6, True, (173, 46), 'feet'),
    'gato.run':     (f('gato_run', 0, 1, 2, 3, 4, 5), 13, True, (173, 46), 'feet'),
    'gato.jump':    (f('gatoA_jump', 1, 2), 8, True, (173, 46), 'feet'),
    'gato.airjump': (f('gatoB_airjump', 0, 1), 14, True, (173, 46), 'top'),
    'gato.fall':    (f('gatoA_fall', 0, 1), 6, True, (173, 46), 'feet'),
    'gato.wall':    ([f'{EXT}gatoA_wallfix_1.png'], 1, True, (173, 46), 'feet'),
    'gato.dash':    (f('gato_dash', 0, 1), 16, True, (173, 46), 'feet'),
    'gato.attack':  (f('gatoB_attack', 0) + atk, 20, False, (173, 46), 'feet'),
    'gato.attack2': (f('gatoB_attack', 2) + atk2, 20, False, (173, 46), 'feet'),
    'guaxinim.idle': (f('guaxinim_idle', 0, 1, 2, 3), 6, True, (177, 47), 'feet'),
    'pug.idle':     (f('pug_idle', 0, 1, 2, 3), 6, True, (179, 47), 'feet'),
    'gato.hit':     (f('gatoB_hit', 0, 3), 10, True, (173, 46), 'feet'),
    'gato.death':   (f('gatoB_death', 0, 1), 6, False, (173, 46), 'feet'),

    'rato.move':    (f('rato', 0, 1), 8, True, (108, 27), 'feet'),
    'esquilo.move': (f('esquilo', 2, 6), 6, True, (125, 33), 'feet'),
    'esquilo.tele': (f('esquilo', 0, 1), 8, True, (125, 33), 'feet'),
    'esquilo.acorn': (f('esquilo', 7), 1, True, (125, 33), 'center'),
    'drone.move':   (f('drone', 0, 1, 3), 8, True, (94, 25), 'center'),
    'drone.tele':   (f('drone', 2), 1, True, (94, 25), 'center'),
    'morcego.move': (f('morcego', 0, 1, 2), 9, True, (124, 31), 'center'),
    'morcego.tele': (f('morcego', 3), 1, True, (124, 31), 'center'),
    'hound.move':   (f('hound', 0, 2), 7, True, (151, 41), 'feet'),
    'hound.tele':   (f('hound', 1), 1, True, (151, 41), 'feet'),
    'vespa.move':   (f('vespa', 0, 1, 2), 12, True, (158, 35), 'center'),
    'vespa.tele':   (f('vespa', 3), 1, True, (158, 35), 'center'),
    'urso.move':    (f('urso', 0, 1), 4, True, (224, 64), 'feet'),
    # ---- folha extra: inimigos novos ----
    'lobo.move':    (f('lobo2', 0), 1, True, (156, 40), 'feet'),
    'lobo.tele':    (f('lobo2', 1), 1, True, (156, 40), 'feet'),
    'lobo.atk':     (f('lobo2', 2), 1, True, (156, 40), 'feet'),
    'panda.move':   (f('panda2', 0, 1), 4, True, (234, 62), 'feet'),
    'panda.tele':   (f('panda2', 2), 1, True, (234, 62), 'feet'),
    'aranha.move':  (f('aranha', 4, 5, 6, 7), 10, True, (80, 21), 'feet'),
    'aranha.hang':  (f('aranha', 0, 1, 2, 3), 5, True, (80, 21), 'feet'),
    'ally.drone':   (f('ally', 0, 1), 8, True, (47, 14), 'center'),
    # ---- v0.8: inimigos próprios de cada cenário (folhas 1, 2 e 3) ----
    'alce.move':        (f('alce', 0), 1, True, (382, 46), 'feet'),
    'alce.atk':         (f('alce', 1), 1, True, (382, 46), 'feet'),
    'bode.move':        (f('bode', 0), 1, True, (188, 34), 'feet'),
    'bode.tele':        (f('bode', 1), 1, True, (188, 34), 'feet'),
    'bode.leap':        (f('bode', 2), 1, True, (188, 34), 'feet'),
    'bode.atk':         (f('bode', 3), 1, True, (188, 34), 'feet'),
    'camaleao.move':    (f('camaleao', 1, 2), 3, True, (163, 26), 'feet'),
    'camaleao.tele':    (f('camaleao', 3), 1, True, (163, 26), 'feet'),
    'canguru.move':     (f('canguru', 0, 1, 2), 8, True, (259, 40), 'feet'),
    'caranguejo.move':  (f('caranguejo', 0, 2), 6, True, (100, 24), 'feet'),
    'caranguejo.tele':  (f('caranguejo', 1), 1, True, (100, 24), 'feet'),
    'caranguejo.atk':   (f('caranguejo', 3), 1, True, (100, 24), 'feet'),
    'coruja.move':      (f('coruja', 1), 1, True, (200, 30), 'center'),
    'crocodilo.move':   (f('crocodilo', 0), 1, True, (169, 30), 'feet'),
    'crocodilo.tele':   (f('crocodilo', 1), 1, True, (169, 30), 'feet'),
    'crocodilo.atk':    (f('crocodilo', 1), 1, True, (169, 30), 'feet'),
    'gorila.move':      (f('gorila', 0, 1), 4, True, (225, 52), 'feet'),
    'gorila.tele':      (f('gorila', 2), 1, True, (225, 52), 'feet'),
    'leaomarinho.move': (f('leaomarinho', 0, 1), 6, True, (156, 32), 'center'),
    'leaomarinho.atk':  (f('leaomarinho', 2), 1, True, (156, 32), 'center'),
    'macaco.move':      (f('macaco', 0, 1), 6, True, (174, 30), 'feet'),
    'macaco.tele':      (f('macaco', 2), 1, True, (174, 30), 'feet'),
    'medusa.move':      (f('medusa', 0, 1, 2, 3), 7, True, (219, 32), 'center'),
    'ornitorrinco.move': (f('ornitorrinco', 0), 1, True, (137, 26), 'feet'),
    'ourico.move':      (f('ourico', 0, 1, 4, 5), 6, True, (94, 20), 'feet'),
    'ourico.atk':       (f('ourico', 2, 3, 6, 7), 14, True, (94, 20), 'feet'),
    'ratoasa.move':     (f('ratoasa', 0, 1, 3, 5), 10, True, (164, 26), 'center'),
    'rinoceronte.move': (f('rinoceronte', 0, 1), 5, True, (183, 46), 'feet'),
    'sapo.move':        (f('sapo', 1), 1, True, (184, 28), 'feet'),
    'sapo.leap':        (f('sapo', 0), 1, True, (184, 28), 'feet'),
    'sapo.tele':        (f('sapo', 2), 1, True, (184, 28), 'feet'),
    'texugo.move':      (f('texugo', 0, 2), 8, True, (143, 26), 'feet'),
    'texugo.atk':       (f('texugo', 3, 1), 12, True, (143, 26), 'feet'),
    'touro.move':       (f('touro', 0, 1), 6, True, (185, 40), 'feet'),
    'touro.atk':        (f('touro', 2), 1, True, (185, 40), 'feet'),
    'vagalume.move':    (f('vagalume', 0, 1, 2, 3, 4, 5, 6), 14, True, (106, 20), 'center'),
    'dronev.move':  (f('dronev', 0), 1, True, (174, 34), 'center'),
    'dronev.tele':  (dronev_body, 1, True, (174, 34), 'center'),
    'dronev.dead':  (f('dronev', 2), 1, True, (174, 34), 'center'),
    'caixa.move':   (f('caixa', 0), 1, True, (212, 30), 'feet'),
    'loot.move':    (f('loot', 0), 1, True, (190, 28), 'feet'),
    # ---- efeitos ----
    'fx.slashA':    (f('fx_melee', 0), 1, True, (155, 60), 'center'),
    'fx.slashB':    (f('fx_melee', 1), 1, True, (158, 60), 'center'),
    'fx.slashC':    (f('fx_melee', 2), 1, True, (162, 60), 'center'),
    'fx.spark':     (f('fx_melee', 3, 4, 5), 1, True, (84, 22), 'center'),
    'fx.shuriken':  (f('fx_proj1', 3), 1, True, (85, 22), 'center'),
    'fx.star':      (f('fx_proj1', 5), 1, True, (85, 22), 'center'),
    'fx.bolt':      (f('fx_proj1', 0), 1, True, (54, 10), 'center'),
    'fx.fireball':  (f('fx_proj1', 2), 1, True, (75, 16), 'center'),
    'fx.laser':     (f('fx_proj2', 0), 1, True, (44, 9), 'center'),
    'fx.burst':     (f('fx_burst', 0), 1, True, (146, 34), 'center'),
    'fx.debris':    (f('fx_debris', 0), 1, True, (148, 40), 'center'),
    'fx.smoke':     (f('fx_smoke', 0), 1, True, (161, 40), 'center'),
    'fx.glitch':    (f('fx_glitch', 0), 1, True, (139, 34), 'center'),
    'fx.levelup':   (f('fx_lvl', 0), 1, True, (334, 90), 'center'),
    # ---- itens ----
    'it.battery':   (f('it_bat', 0, 1, 2, 3), 1, True, (92, 17), 'center'),
    'it.hp':        (f('it_hp', 0, 1, 2), 5, True, (102, 19), 'center'),
    'it.coin':      (f('it_coin', 1, 3), 5, True, (84, 14), 'center'),
    'it.cyber':     (f('it_coin', 4), 1, True, (110, 15), 'center'),
    # ---- Guaxinim ----
    'guaxinim.run':     (f('guaxinim_run', 0, 1, 2, 3, 4, 5), 13, True, (177, 47), 'feet'),
    'guaxinim.jump':    (f('guaxA_jump', 0, 1), 8, True, (177, 47), 'feet'),
    'guaxinim.airjump': (f('guaxA_jump', 1), 1, True, (177, 47), 'feet'),
    'guaxinim.fall':    (f('guaxA_fall', 0), 1, True, (177, 47), 'feet'),
    'guaxinim.glide':   (f('guaxinim_jump', 0, 1, 2), 6, True, (177, 47), 'feet'),
    'guaxinim.wall':    (f('guaxA_jump', 2), 1, True, (177, 47), 'feet'),
    'guaxinim.dash':    (f('guaxinim_run', 1), 1, True, (177, 47), 'feet'),
    'guaxinim.attack':  (f('guaxB_attack', 0, 1, 2), 20, False, (177, 47), 'feet'),
    'guaxinim.attack2': (f('guaxB_attack', 3, 4, 5), 20, False, (177, 47), 'feet'),
    'guaxinim.hit':     (f('guaxinim_hurt', 0, 2), 10, True, (177, 47), 'feet'),
    'guaxinim.death':   (f('guaxB_death', 0, 1), 6, False, (177, 47), 'feet'),
    # ---- Pug ----
    'pug.run':     (f('pug_run', 0, 1, 2, 3, 4, 5), 12, True, (179, 47), 'feet'),
    'pug.jump':    (f('pugA_jump', 1), 1, True, (179, 47), 'feet'),
    'pug.airjump': (f('pugA_jump', 2), 1, True, (179, 47), 'top'),
    'pug.fall':    (f('pugA_fall', 0, 1), 8, True, (179, 47), 'feet'),
    'pug.wall':    (f('pugA_wall', 0), 1, True, (179, 47), 'top'),
    'pug.dash':    (f('pug_run', 3), 1, True, (179, 47), 'feet'),
    'pug.slam':    (f('pugA_fall', 1), 1, True, (179, 47), 'feet'),
    'pug.land':    (f('pug_jump', 1), 1, True, (179, 47), 'feet'),
    'pug.attack':  (f('pugB_attack', 0, 1, 2), 18, False, (179, 47), 'feet'),
    'pug.attack2': (f('pugB_attack', 3, 4, 5), 18, False, (179, 47), 'feet'),
    'pug.hit':     (f('pugB_hit', 1), 1, True, (179, 47), 'feet'),
    'pug.death':   (f('pugB_death', 0, 1), 6, False, (179, 47), 'feet'),
    # ---- biomas: plataformas e cenário ----
    'plat.grate':   (f('plat_r', 2), 1, True, (45, 16), 'feet'),
    'plat.long':    (f('plat_r', 0), 1, True, (81, 26), 'feet'),
    'plat.pipes':   (f('plat_l', 0), 1, True, (138, 40), 'feet'),
    'plat.rust':    (f('plat_l', 1), 1, True, (123, 34), 'feet'),
    'prop.claw':    (f('porto', 0), 1, True, (211, 84), 'feet'),
    'prop.server1': (f('porto', 1), 1, True, (108, 46), 'feet'),
    'prop.server2': (f('porto', 2), 1, True, (109, 46), 'feet'),
    'prop.pipe1':   (f('porto', 3), 1, True, (326, 118), 'feet'),
    'prop.pipe2':   (f('porto', 4), 1, True, (375, 128), 'feet'),
    'prop.container': (f('porto', 5), 1, True, (133, 64), 'feet'),
    # ---- chefes ----
    'polvo.move':   (f('polvo', 0), 1, True, (180, 92), 'center'),
    'polvo.tele':   (f('polvo', 1, 2, 3), 10, True, (180, 92), 'center'),
    'quimera.p1':   (f('quimera', 0), 1, True, (201, 84), 'feet'),
    'quimera.p2':   (f('quimera', 1), 1, True, (201, 84), 'feet'),
    'quimera.p3':   (f('quimera', 2, 3), 6, True, (201, 84), 'feet'),
    'dragao.move':  (f('dragao', 0, 2), 3, True, (262, 124), 'center'),
    'trex.move':    (f('trex', 1, 2), 4, True, (252, 118), 'feet'),
    'trex.p2':      (f('trex', 3) + trex_visor, 4, True, (252, 118), 'feet'),
    # ---- folha de cenários (tools/build_biomes.py) ----
    'prop.bench': (f('bio_bench', 0), 1, True, (88, 26), 'feet'),
    'prop.bench2': (f('bio_bench2', 0), 1, True, (89, 26), 'feet'),
    'prop.trash': (f('bio_trash', 0), 1, True, (94, 24), 'feet'),
    'prop.scaffold': (f('bio_scaffold', 0), 1, True, (378, 150), 'feet'),
    'prop.conveyor': (f('bio_conveyor', 0), 1, True, (103, 30), 'feet'),
    'prop.pipes': (f('bio_pipes', 0), 1, True, (178, 70), 'feet'),
    'prop.control': (f('bio_control', 0), 1, True, (85, 26), 'feet'),
    'prop.signal': (f('bio_signal', 0), 1, True, (90, 34), 'feet'),
    'prop.panel': (f('bio_panel', 0), 1, True, (102, 36), 'feet'),
    'prop.tlight_r': (f('bio_tlight_r', 0), 1, True, (70, 30), 'feet'),
    'prop.tlight_y': (f('bio_tlight_y', 0), 1, True, (70, 30), 'feet'),
    'prop.gate': (f('bio_gate', 0), 1, True, (195, 104), 'feet'),
    'prop.containers': (f('bio_containers', 0), 1, True, (277, 120), 'feet'),
    'prop.container_o': (f('bio_container_o', 0), 1, True, (164, 64), 'feet'),
    'prop.palm_b': (f('bio_palm_b', 0), 1, True, (204, 96), 'feet'),
    'prop.palm_p': (f('bio_palm_p', 0), 1, True, (196, 96), 'feet'),
    'prop.sign_h': (f('bio_sign_h', 0), 1, True, (81, 22), 'feet'),
    'prop.sign_v': (f('bio_sign_v', 0), 1, True, (124, 40), 'feet'),
    'prop.sign_v2': (f('bio_sign_v2', 0), 1, True, (147, 40), 'feet'),
    'prop.fsign1': (f('bio_fsign1', 0), 1, True, (145, 40), 'feet'),
    'prop.fsign2': (f('bio_fsign2', 0), 1, True, (135, 36), 'feet'),
    'prop.dish': (f('bio_dish', 0), 1, True, (93, 26), 'feet'),
    'prop.catwalk': (f('bio_catwalk', 0), 1, True, (253, 96), 'feet'),
    # ---- v0.9: Cyber Deep (folha cenario_deep.jpg; quadros de tools/build_deep.py) ----
    'deco.anem0':   (f('anemona', 0), 1, True, (140, 30), 'feet'),
    'deco.anem1':   (f('anemona', 1), 1, True, (140, 30), 'feet'),
    'deco.anem2':   (f('anemona', 2), 1, True, (140, 30), 'feet'),
    'deco.anem3':   (f('anemona', 3), 1, True, (140, 30), 'feet'),
    'deco.jelly':   (f('agviva', 0, 1, 5), 3, True, (140, 34), 'center'),
    'deco.jellyS':  (f('agviva', 2, 3, 4), 4, True, (140, 34), 'center'),
    'deco.sign':    (f('letreiro', 0), 1, True, (122, 28), 'feet'),
    'deco.curto':   (f('curto', 0, 1, 2), 12, True, (119, 24), 'feet'),
    'deco.vaz':     (['/tmp/ext/vaz0_0.png', '/tmp/ext/vaz1_0.png', '/tmp/ext/vaz2_0.png'], 5, True, (136, 32), 'feet'),
    'tubarao.move': (f('tubarao', 0), 1, True, (174, 40), 'center'),
    'tubarao.atk':  (f('tubarao', 2), 1, True, (174, 40), 'center'),
    # ---- v0.10: monstros aquáticos (inimigos_aquaticos.jpg; quadros de tools/build_aquatic.py) ----
    'peixe.move':     (f('aq_peixe', 0, 1, 2, 3), 8, True, (117, 22), 'center'),
    'peixe.tele':     (f('aq_peixe', 4, 5), 6, True, (117, 22), 'center'),
    'peixe.atk':      (f('aq_peixe', 6), 1, True, (117, 22), 'bodyL'),
    'peixe.hurt':     (f('aq_peixe', 7, 8), 12, True, (117, 22), 'center'),
    'peixe.death':    (f('aq_peixe', 9, 10, 11), 1, False, (117, 22), 'center'),
    'lula.move':      (f('aq_lula', 0, 1, 2, 3), 8, True, (197, 42), 'center'),
    'lula.tele':      (f('aq_lula', 4), 1, True, (197, 42), 'bodyL'),
    'lula.atk':       (f('aq_lula', 5), 1, True, (197, 42), 'bodyL'),
    'lula.hurt':      (f('aq_lula', 6, 7), 10, True, (197, 42), 'center'),
    'lula.death':     (f('aq_lula', 8, 9, 10), 1, False, (197, 42), 'center'),
    'querubim.move':  (f('aq_querubim', 0, 1, 2, 3), 8, True, (139, 46), 'center'),
    'querubim.tele':  (f('aq_querubim', 4), 1, True, (139, 46), 'center'),
    'querubim.atk':   (f('aq_querubim', 5, 6), 8, True, (139, 46), 'center'),
    'querubim.hurt':  (f('aq_querubim', 7, 8), 10, True, (139, 46), 'center'),
    'querubim.death': (f('aq_querubim', 9, 10, 11), 1, False, (139, 46), 'center'),
    'serpente.move':  (f('aq_glitch', 0, 1), 3, True, (180, 66), 'center'),
    'serpente.tele':  (f('aq_glitch', 2), 1, True, (240, 66), 'center'),
    'serpente.atk':   (f('aq_glitch', 3), 1, True, (240, 66), 'bodyL'),
    'serpente.hurt':  (f('aq_glitch', 4, 5), 8, True, (190, 66), 'center'),
    'serpente.death': (f('aq_glitch', 6, 7, 8, 9), 1, False, (180, 66), 'center'),
    'mecha.move':     (f('aq_mecha', 0, 1, 2), 5, True, (218, 80), 'feet'),
    'mecha.tele':     (f('aq_mecha', 3), 1, True, (218, 80), 'feet'),
    'mecha.atk':      (f('aq_mecha', 4, 5), 8, True, (218, 80), 'feet'),
    'mecha.hurt':     (f('aq_mecha', 6, 7), 8, True, (218, 80), 'feet'),
    'mecha.death':    (f('aq_mecha', 8, 9, 10), 1, False, (218, 80), 'feet'),
    # ---- v0.15: personagens no pedestal (tela Escolher personagem; quadros de tools/build_menu.py) ----
    **{f'menu.{c}': (f(f'menu_{c}', 0, 1, 2), 4, True, (100, 16.2 if c == 'coelho' else 32), 'bottom')
       for c in ('gato', 'guaxinim', 'pug', 'coelho', 'macaco', 'tatu', 'corvo')},
}

# Peças de cenário geradas por build_biomes.py que ainda não estão declaradas acima (folha 2 em diante)
import json as _json
for _n, (_w, _h, _wh) in _json.load(open('/home/claude/tools/bio_props.json')).items():
    if f'prop.{_n}' not in ANIMS:
        ANIMS[f'prop.{_n}'] = ([f'/tmp/ext/bio_{_n}_0.png'], 1, True, (_h, _wh), 'feet')


def anchor(img, mode, body_h=None):
    a = np.array(img)[..., 3].astype(np.float32) / 255
    h, w = a.shape
    ys, xs = np.mgrid[0:h, 0:w]
    if mode == 'bottom':                   # base do quadro, no meio (pedestais da tela de personagens)
        return w / 2, float(h)
    if mode == 'top':                      # pés = topo + altura do corpo (ignora jatos/efeitos abaixo)
        top = a[: max(1, int(body_h * 0.45))]
        ys2, xs2 = np.mgrid[0:top.shape[0], 0:w]
        return float((top * xs2).sum() / (top.sum() or 1)), float(body_h)
    if mode == 'bodyL':                    # quadro com raio saindo pela direita: âncora no corpo (lado esquerdo)
        cut = max(1, int(w * 0.45))
        sub = a[:, :cut]; tot = sub.sum() or 1
        return float((sub * xs[:, :cut]).sum() / tot), float((sub * ys[:, :cut]).sum() / tot)
    if mode == 'feet':
        top = a[: max(1, int(h * 0.45))]
        tw = top.sum() or 1
        ax = float((top * xs[: top.shape[0]]).sum() / tw)
        return ax, float(h)
    tot = a.sum() or 1
    return float((a * xs).sum() / tot), float((a * ys).sum() / tot)

frames = []   # (anim, idx, img, ax, ay)
LOW_SS = {'polvo', 'quimera', 'dragao', 'trex'}     # chefes: menos resolução (são grandes; economiza atlas)
def ss_of(name): return 1.6 if name.split('.')[0] in LOW_SS else SS

for name, (paths, fps, loop, (src_h, world_h), mode) in ANIMS.items():
    k = world_h / src_h * ss_of(name)
    for i, p in enumerate(paths):
        im = Image.open(p).convert('RGBA')
        # pré-multiplica para não criar halo escuro ao reduzir
        arr = np.array(im).astype(np.float32)
        arr[..., :3] *= arr[..., 3:4] / 255
        im = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
        nw, nh = max(1, round(im.width * k)), max(1, round(im.height * k))
        im = im.resize((nw, nh), Image.LANCZOS)
        arr = np.array(im).astype(np.float32)
        al = arr[..., 3:4]
        arr[..., :3] = np.where(al > 0, arr[..., :3] * 255 / np.maximum(al, 1), 0)
        im = Image.fromarray(arr.clip(0, 255).astype(np.uint8))
        ax, ay = anchor(im, mode, src_h * k)
        frames.append((name, i, im, ax, ay))

# ---- Folhas separadas (v0.10): núcleo + chefões + peças de cenário por bioma ----
# Uma imagem só já passava de 4096 px de altura (limite de textura de celulares antigos) e ocupava ~32 MB
# decodificada. Agora o jogo carrega o núcleo (personagens, inimigos, efeitos) e só as peças do cenário atual.
import re
BOSSES = {'polvo', 'quimera', 'dragao', 'trex', 'mecha', 'serpente'}
bsrc = open('/home/claude/web/src/biomes.js').read()
bsrc = bsrc[bsrc.index('export const BIOMES'):bsrc.index('export const SECTOR_ROSTER')]
uses = {}                                                   # peça → biomas que a usam
marks = [(m.start(), m.group(1)) for m in re.finditer(r"(?<![a-z])id: '(\w+)'", bsrc)]
for k, (pos0, bid) in enumerate(marks):
    chunk = bsrc[pos0:marks[k + 1][0] if k + 1 < len(marks) else len(bsrc)]
    for nm in set(re.findall(r"'((?:prop|deco)\.[a-zA-Z0-9_]+)'", chunk)):
        uses.setdefault(nm, set()).add(bid)

def sheet_of(name):
    pre = name.split('.')[0]
    if pre in BOSSES: return 'boss'
    if pre == 'menu': return 'menu'                         # só na tela de personagens
    if pre in ('prop', 'deco'):
        if name not in uses: return None                    # peça que nenhum cenário usa: fica de fora
        b = uses[name]
        return 'bio_' + next(iter(b)) if len(b) == 1 else 'bio_shared'
    return 'core'

W = 2048   # largura: mantém cada folha abaixo de 4096 px de altura
sheets = {}
for fr in frames:
    sh = sheet_of(fr[0])
    if sh: sheets.setdefault(sh, []).append(fr)

data = {}
sizes = {}
for sh, lst in sheets.items():
    x = y = shelf = 0
    pos = {}
    for name, i, im, ax, ay in sorted(lst, key=lambda t: -t[2].height):
        if x + im.width + 2 > W:
            x, y, shelf = 0, y + shelf + 2, 0
        pos[(name, i)] = (x, y)
        x += im.width + 2
        shelf = max(shelf, im.height)
    H = y + shelf + 2
    wmax = max(pos[(n, i)][0] + im.width for n, i, im, _, _ in lst) + 2
    atlas = Image.new('RGBA', (min(W, wmax), H), (0, 0, 0, 0))
    for name, i, im, ax, ay in lst:
        px, py = pos[(name, i)]
        atlas.alpha_composite(im, (px, py))
        paths, fps, loop, _, mode = ANIMS[name]
        a = data.setdefault(name, {'fps': fps, 'loop': loop, 's': sh, 'frames': []})
        f = [px, py, im.width, im.height, round(ax, 1), round(ay, 1)]
        if ss_of(name) != SS: f.append(ss_of(name))
        a['frames'].append(f)
    atlas.save(f'/home/claude/web/assets/sprites/{sh}.webp', 'WEBP', quality=90, method=6)
    sizes[sh] = atlas.size
    assert H <= 4096, (sh, H)

# Folhas de que cada bioma precisa (além do núcleo)
need = {}
for nm, bs in uses.items():
    sh = sheet_of(nm)
    for b in bs: need.setdefault(b, set()).add(sh)
with open('/home/claude/web/src/atlasData.js', 'w') as fh:
    fh.write('// Gerado por tools/build_atlas.py — não editar à mão.\n')
    fh.write('// frames: [x, y, w, h, âncoraX, âncoraY] em pixels da folha s (assets/sprites/{s}.webp); SS = pixels da folha por pixel de mundo.\n')
    fh.write(f'export const ATLAS_SS = {SS};\n')
    fh.write('export const ATLAS = ' + json.dumps(data, separators=(',', ':')) + ';\n')
    fh.write('export const SHEET_SIZES = ' + json.dumps(sizes, separators=(',', ':')) + ';\n')
    fh.write('export const BIOME_SHEETS = ' + json.dumps({b: sorted(v) for b, v in need.items()}, separators=(',', ':')) + ';\n')
import os
for sh, (w, h) in sorted(sizes.items()):
    print(f'{sh:14s} {w}x{h}  {os.path.getsize(f"/home/claude/web/assets/sprites/{sh}.webp") // 1024} KB')
print('quadros', len(frames))
