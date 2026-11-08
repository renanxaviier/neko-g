# Gera site/index.html (wiki do Neko G) a partir dos dados do jogo + manifesto das tiras de sprites.
# Números conferidos em web/src/{chars,config,talents,biomes,boss,enemies,skills,meta,missions}.js e docs/.
import json, html, re

MAN = json.load(open('/tmp/wiki_tools/manifest.json'))
VERSION = re.search(r"VERSION = '([^']+)'", open('/home/claude/web/src/config.js').read()).group(1)
APK = 'https://github.com/renanxaviier/neko-g/actions/workflows/android-apk.yml'
E = html.escape


def spr(name, alt='', k=None, cls='', fit=None):
    """Tira de quadros: caixa com overflow escondido e a <img> deslizando em steps()."""
    m = MAN[name]
    w, h, n, fps = m['w'], m['h'], m['n'], m['fps']
    if k is None:
        k = 1.0
    if fit:  # (larg máx, alt máx) em px
        k = min(k, fit[0] / w, fit[1] / h)
    W, H = round(w * k), round(h * k)
    fps = max(2.5, min(12, fps))
    anim = f'--n:{n};--d:{n / fps:.2f}s;' if n > 1 else ''
    c = 'spr' + (' anim' if n > 1 else '') + (' ' + cls if cls else '')
    return (f'<span class="{c}" style="width:{W}px;height:{H}px;{anim}">'
            f'<img src="img/{name}.webp" alt="{E(alt)}" width="{W * n}" height="{H}" loading="lazy" decoding="async"></span>')


# ---------------- Dados ----------------
SECTORS = [  # id, nome, sub, cor, descrição (ambientação [PROPOSTA]; ver docs/historia.md)
    ('distrito', 'DISTRITO NEON', 'Onde tudo começa', '#ff4df0', 'Prédios cobertos de letreiros, chuva fina e telhados de grade. É o bairro de origem do bando e o primeiro setor de toda partida.'),
    ('coast', 'CYBER-COAST', 'Orla cibernética', '#4dffd2', 'Calçadão de coqueiros neon à beira de um mar escuro, com bancos, letreiros de praia e bares que nunca fecham.'),
    ('favelas', 'FAVELAS DE DADOS', 'Submundo vertical', '#ffb03c', 'Barracos empilhados até o céu laranja de fumaça, fios por todo lado e plataformas enferrujadas. Aqui roda a internet clandestina da cidade.'),
    ('porto', 'PORTO AUTOMATIZADO', 'Doca 7', '#5ec8ff', 'Contêineres, guindastes, esteiras e semáforos de carga que trabalham sozinhos, dia e noite.'),
    ('deep', 'CYBER DEEP', 'Abismo cibernético', '#36e7ff', 'Setor submerso: aqui não se pula, se nada. PULO vira braçada e DASH vira torpedo. Recifes de fibra óptica, anêmonas balançando e um letreiro que pisca no fundo.'),
    ('fabrica', 'FÁBRICA DE ROBÔS', 'Linha de montagem', '#ff9a3c', 'Esteiras, braços robóticos e faíscas laranja: é aqui que a horda é montada, peça por peça.'),
    ('subway', 'DATA SUBWAY', 'Centro de dados subterrâneo', '#36d8ff', 'Um metrô abandonado que virou centro de dados: trilhos, cabos pelo chão e racks de servidores zumbindo.'),
    ('genelab', 'GENELAB', 'Laboratório de clonagem genética', '#4dff8c', 'Tubos com criaturas em formação, braços robóticos e luz verde-ácido. Os sapos e camaleões da horda saem daqui.'),
    ('mall', 'NEON MALL', 'Shopping de hologramas', '#ff6ad5', 'Vitrines de hologramas, fliperamas e uma liquidação de 50% que nunca termina.'),
    ('casino', 'CYBER CASINO', 'Distrito dos cassinos', '#ffd84d', 'Roletas, caça-níqueis e tapete vermelho. O lugar onde a cidade aposta tudo.'),
    ('cage', 'THE CAGE', 'Arena de combate clandestina', '#ff4d6a', 'Cerca elétrica, pilhas de pneus e arquibancada sob holofotes. Os monstros mais pesados lutam aqui.'),
    ('jungle', 'GLOW JUNGLE', 'Jardins biocibernéticos', '#c46cff', 'Árvores de neon roxo, raízes gigantes, cipós de luz e cachoeiras que brilham no escuro.'),
    ('torre', 'TORRE CORPORATIVA', 'O topo da cidade', '#e8eeff', 'Escritórios de vidro e hologramas corporativos no 100º andar. Fim do caminho e origem do sinal.'),
]
SNAME = {s[0]: s[1] for s in SECTORS}
SCOLOR = {s[0]: s[3] for s in SECTORS}
SHORT = dict(distrito='Distrito Neon', coast='Cyber-Coast', favelas='Favelas de Dados', porto='Porto Automatizado', deep='Cyber Deep', fabrica='Fábrica de Robôs',
             subway='Data Subway', genelab='GeneLab', mall='Neon Mall', casino='Cyber Casino', cage='The Cage', jungle='Glow Jungle', torre='Torre Corporativa')

# SECTOR_ROSTER (web/src/biomes.js)
ROSTER = {
    'distrito': {'weak': ['rato', 'drone', 'morcego'], 'medium': ['hound'], 'tank': ['urso']},
    'coast': {'weak': ['rato', 'medusa', 'ornitorrinco'], 'medium': ['caranguejo', 'hound'], 'tank': ['crocodilo']},
    'favelas': {'weak': ['rato', 'esquilo', 'macaco', 'ratoasa'], 'medium': ['bode', 'hound'], 'tank': ['urso']},
    'porto': {'weak': ['ornitorrinco', 'drone', 'morcego'], 'medium': ['caranguejo', 'leaomarinho', 'dronev'], 'tank': ['panda', 'crocodilo']},
    'deep': {'weak': ['peixe', 'medusa', 'ourico'], 'medium': ['lula', 'caranguejo', 'tubarao', 'leaomarinho'], 'tank': ['crocodilo', 'querubim']},
    'fabrica': {'weak': ['drone', 'aranha', 'ratoasa'], 'medium': ['texugo', 'dronev', 'leaomarinho'], 'tank': ['rinoceronte', 'panda']},
    'subway': {'weak': ['rato', 'aranha', 'ratoasa', 'morcego'], 'medium': ['texugo', 'hound'], 'tank': ['crocodilo']},
    'genelab': {'weak': ['sapo', 'medusa', 'aranha'], 'medium': ['camaleao', 'vespa'], 'tank': ['gorila', 'urso']},
    'mall': {'weak': ['drone', 'macaco', 'esquilo'], 'medium': ['canguru', 'coruja', 'lobo'], 'tank': ['panda']},
    'casino': {'weak': ['ratoasa', 'drone', 'macaco', 'morcego'], 'medium': ['canguru', 'lobo', 'coruja', 'vespa'], 'tank': ['gorila', 'touro']},
    'cage': {'weak': ['rato', 'esquilo', 'ourico'], 'medium': ['canguru', 'bode', 'hound'], 'tank': ['touro', 'rinoceronte', 'gorila']},
    'jungle': {'weak': ['vagalume', 'sapo', 'ourico'], 'medium': ['camaleao', 'alce', 'vespa'], 'tank': ['crocodilo', 'gorila']},
    'torre': {'weak': ['drone', 'vagalume', 'aranha'], 'medium': ['coruja', 'dronev', 'lobo', 'leaomarinho'], 'tank': ['panda', 'rinoceronte', 'urso']},
}

# ENEMY_TYPES (web/src/enemies.js): nome, nível, vida, dano, voa?, comportamento (bestiário v0.8 + IA do código)
ENEMIES = [
    ('rato', 'Cyber-Rato', 'weak', 14, 5, False, 'Corre rápido pelas plataformas e pula atrás de você. Frágil, mas vem em bando.'),
    ('drone', 'Drone Olho', 'weak', 12, 4, True, 'Voa ondulando direto até você e fere ao encostar.'),
    ('morcego', 'Morcego Cibernético', 'weak', 10, 4, True, 'Voa por cima, para no ar por um instante e dá um mergulho rasante.'),
    ('esquilo', 'Esquilo Bombardeiro', 'weak', 16, 6, False, 'Mantém distância e arremessa bolotas explosivas em arco. Ergue a bolota antes de jogar.'),
    ('aranha', 'Aranha-Drone', 'weak', 12, 5, False, 'Desce do alto num fio de neon, balançando; ao tocar o chão vira corredora.'),
    ('ourico', 'Ouriço Neon', 'weak', 16, 5, False, 'Enrola, rola rápido (ricocheteia na parede) e solta 6 espinhos ao parar.'),
    ('sapo', 'Sapo Ácido', 'weak', 16, 5, False, 'Só anda pulando; de longe, cospe ácido em arco.'),
    ('medusa', 'Medusa Elétrica', 'weak', 14, 5, True, 'Nada no ar em impulsos; de perto, dá um choque em volta.'),
    ('ratoasa', 'Rato-Asa Bombardeiro', 'weak', 12, 6, True, 'Voa por cima de você e solta bombas.'),
    ('vagalume', 'Vaga-lume Bomba', 'weak', 8, 12, True, 'Voa tremido até você, pisca e explode. Não fere por contato: fuja da explosão.'),
    ('macaco', 'Macaco Hacker', 'weak', 16, 6, False, 'Arremessador, como o Esquilo: guarda distância e joga projéteis em arco.'),
    ('ornitorrinco', 'Ornitorrinco Atirador', 'weak', 18, 6, False, 'Para, carrega a arma e atira um raio ciano reto.'),
    ('peixe', 'Peixe-Lanterna Glitch', 'weak', 14, 5, True, 'Cardume do Cyber Deep: fica a uns 110 px de você e cospe uma bola de luz.'),
    ('hound', 'Scrap-Hound', 'medium', 45, 10, False, 'Cachorro de sucata: abaixa, avisa e dá uma investida curta em linha reta.'),
    ('lobo', 'Cyber-Lobo', 'medium', 55, 11, False, 'Mais rápido que o Hound; persegue e faz investidas pelo chão.'),
    ('vespa', 'Vespa Zangão', 'medium', 30, 9, True, 'Voa em zigue-zague, brilha e dá uma investida rápida com o ferrão.'),
    ('dronev', 'Drone Voador', 'medium', 28, 8, True, 'Fica de lado, a média distância, mira e dispara um laser.'),
    ('caranguejo', 'Caranguejo Blindado', 'medium', 50, 9, False, 'Chega perto, levanta as pinças e belisca. Quase não é empurrado.'),
    ('bode', 'Bode-Foguete', 'medium', 45, 10, False, 'Agacha, salta com foguetes num arco e cai com um pisão.'),
    ('canguru', 'Canguru Boxeador', 'medium', 55, 10, False, 'Anda pulando alto; de perto, dá um soco com avanço.'),
    ('camaleao', 'Camaleão Fantasma', 'medium', 40, 10, False, 'Chega quase invisível (repare na distorção); perto, aparece e dá uma linguada.'),
    ('coruja', 'Coruja de Vigilância', 'medium', 34, 8, True, 'Fica no alto e solta 2 mini-drones teleguiados.'),
    ('leaomarinho', 'Leão-Marinho Jato', 'medium', 45, 8, True, 'Voa de lado com propulsores e dispara rajadas de 3 tiros.'),
    ('alce', 'Alce de Plasma', 'medium', 60, 11, False, 'Os chifres brilham e ele faz uma investida forte.'),
    ('texugo', 'Texugo Voltaico', 'medium', 45, 10, False, 'Investida rápida soltando faíscas pelo caminho.'),
    ('tubarao', 'Tubarão-Torpedo', 'medium', 60, 12, True, 'Ronda em ondas ao seu lado, abre a boca (aviso) e dá um bote rápido em linha reta.'),
    ('lula', 'Cyber-Lula', 'medium', 48, 9, True, 'Nada em jatos, se alinha na sua altura e solta um raio horizontal. Linha rosa piscando = sai da frente.'),
    ('urso', 'Urso Cibernético', 'tank', 220, 16, False, 'Lento e muito resistente: avança sem parar e quase não sente empurrão.'),
    ('panda', 'Panda de Guerra', 'tank', 260, 15, False, 'Para, o braço-canhão brilha e ele dispara um tiro de plasma.'),
    ('gorila', 'Gorila de Aço', 'tank', 240, 16, False, 'Pancada no chão: anel de impacto e ondas que correm pelo chão. Pule!'),
    ('crocodilo', 'Crocodilo Mecânico', 'tank', 220, 15, False, 'Rasteiro e blindado; abre a boca e dá uma mordida com avanço.'),
    ('touro', 'Touro de Brasa', 'tank', 180, 15, False, 'Investida longa em linha reta; para ao bater na parede.'),
    ('rinoceronte', 'Rinoceronte Fornalha', 'tank', 320, 18, False, 'Investida ainda mais longa, e quase nada o empurra.'),
    ('querubim', 'Querubim-Tubarão', 'mini', 380, 16, True, 'Mini-chefe do Cyber Deep: aparece uma vez no meio do setor, ronda, abre a boca e dá um bote que morde.'),
]
TIER = {'weak': ('FRACO', '#4dffa6'), 'medium': ('MÉDIO', '#ffd84d'), 'tank': ('TANQUE', '#ff9a3c'), 'mini': ('MINI-CHEFE', '#ff4df0')}

BOSSES = [  # id, nome, vida base, voa, cor, golpes
    ('polvo', 'POLVO DE NEON', 900, True, '#ff4df0', ['Leque de orbes (mais orbes a cada fase)', 'Mergulho em você, e fica baixo e exposto por 1,3 s: hora de bater', 'Chama morcegos', 'Giro: anel de orbes em volta', 'Fase 3: chuva de tinta caindo do teto']),
    ('quimera', 'QUIMERA CIBERNÉTICA', 2600, False, '#ffc94d', ['3 fases marcadas pela cor: dourado → verde → ciano, mais rápida a cada uma', 'Garrada de perto e bote com ondas de choque ao cair', 'Cauda: orbes em arco; chicote da cauda atrás dela', 'Rugido que empurra você (na fase 3 chama 2 Scrap-Hounds)', 'Investida e botes em sequência']),
    ('dragao', 'O GRANDE GLITCH', 3200, True, '#5ef0ff', ['Laser magenta que varre a tela (linha de aviso piscando antes)', 'Cubos de glitch em leque', 'Teleporte para o outro lado (fase 2+)', 'Rasante que atravessa você em arco', 'Fase 3: chuva de cubos']),
    ('trex', 'T-REX CIBERNÉTICO', 5500, False, '#ff5a1a', ['Pisão com ondas de choque pelo chão: pule!', 'Mordida de perto; rabada se você ficar nas costas dele', 'Fase 2 (visor vermelho, abaixo de 50%): pisão duplo, investida e 3 lasers', 'Pedras caindo do teto no pisão da fase 2']),
    ('tita', 'TITÃ SOBRECARREGADO', 4200, False, '#ff9a3c', ['Salto esmagador na sua direção, com ondas de choque para os dois lados', 'Fase 2+: chuva de orbes depois do salto', 'Soco de perto', 'Anel de orbes disparado do núcleo']),
    ('rainha', 'A RAINHA DA SUCATA', 3000, True, '#ff4df0', ['Paira acima e de lado', 'Investida reta na sua altura (fase 2+: solta um anel de sucata ao parar)', 'Leque de orbes', 'Chuva de sucata']),
    ('sentinela', 'O SENTINELA DE DADOS', 3400, True, '#4dffa6', ['Some num glitch e reaparece em cima de você', 'Mergulho esmagador com ondas de dados', 'Anel de cubos', 'Leque de orbes']),
]
WATER_BOSSES = [
    ('mecha', 'MECHA-POVOADOR', 2000, False, '#ff9a3c', ['Variação aquática do Polvo: um escafandro gigante no fundo', 'Tentáculo no chão com ondas elétricas dos dois lados', 'Canhão da cabeça em leque; anel de choque (fase 2+)', 'Salto pesado que solta ondas (na fase 3 derruba destroços)']),
    ('serpente', 'O GRANDE GLITCH (SERPENTE)', 1800, True, '#5ef0ff', ['Variação aquática do Dragão: nada em ondas', 'Sopro de plasma que varre', 'Travessia rápida na sua altura', 'Anel de bolhas elétricas e cardume de Peixes-Lanterna (fase 2+)']),
]

CHARS = [  # id, nome, cor, preço, frase, traço, ataque (ícone, nome), começa com, arma, stats
    ('gato', 'GATO', '#ff4df0', 0, 'O mais rápido do bando: botas a jato e garras elétricas.', '2 pulos no ar', ('⚡', 'Garras Elétricas'), None,
     ('Garras Energizadas', 'Três garras de energia avançam e atravessam a horda.', 'Nv 5: lança para frente e para trás.', 'wpn_garras'),
     dict(hp=100, dmg=100, rng=100, spd=100, mag=100), 'Na água: braçada 18% mais forte.'),
    ('guaxinim', 'GUAXINIM', '#4dffa6', 120, 'O hacker do grupo: plana de paraquedas e solta drones.', 'Plana: segure PULO caindo', ('⌁', 'Lâmina Hacker'), 'Drones Orbitais',
     ('Corte de Dados', 'Corte dos dois lados; quem é atingido trava com glitch.', 'Nv 5: corte maior e glitch mais longo.', 'wpn_dados'),
     dict(hp=90, dmg=90, rng=110, spd=100, mag=130), 'Na água: segure PULO para flutuar parado.'),
    ('pug', 'PUG', '#ff9a3c', 160, 'A muralha: armadura pesada e soco de energia.', 'Queda pesada: DASH no ar vira mergulho com onda de choque · +30% de vida', ('✊', 'Soco de Energia'), None,
     ('Martelo de Impacto', 'Pancada pesada à frente e onda de choque pelo chão.', 'Nv 5: uma segunda onda de choque.', 'wpn_martelo'),
     dict(hp=130, dmg=135, rng=85, spd=91, mag=100), 'Na água: afunda mais rápido e a queda vira Âncora.'),
    ('coelho', 'COELHO', '#ff5ad8', 200, 'Pernas biônicas: ninguém pula mais alto.', '3 pulos no ar · pulo mais alto · um pouco mais rápido', ('☾', 'Chute Meia-Lua'), None, None,
     dict(hp=85, dmg=95, rng=110, spd=104, mag=100), None),
    ('macaco', 'MACACO', '#4dff7a', 220, 'Joga dados de código como arma.', 'Arremessa dados: já começa com Shurikens', ('⌨', 'Soco Hacker'), 'Shurikens de Holograma', None,
     dict(hp=90, dmg=80, rng=85, spd=104, mag=115), None),
    ('tatu', 'TATU', '#ffd84d', 260, 'Vira bola blindada e atropela a horda.', 'Tanque: o dash vira bola blindada que atropela · +40% de vida', ('⛏', 'Garra Blindada'), None, None,
     dict(hp=140, dmg=120, rng=90, spd=87, mag=100), None),
]

ACTIVES = [  # nome, ícone, cor, descrição, evolução (com passiva → nome: efeito)
    ('Garras Elétricas', '⚡', '#5ef0ff', 'Seu ataque básico: golpe elétrico à frente (botão ATAQUE). No nível 5 golpeia também para trás.', 'Turbo', 'Garras Relâmpago', 'cada golpe solta raios que saltam para 3 inimigos'),
    ('Shurikens de Holograma', '✦', '#ff4df0', 'O ATAQUE também lança shurikens que ricocheteiam nas paredes.', 'Resfriamento', 'Tempestade Holográfica', '+3 shurikens que ricocheteiam por muito mais tempo'),
    ('Drones Orbitais', '◉', '#4dffa6', 'Drones giram ao seu redor e ferem quem encostar.', 'Ímã', 'Enxame Magnético', '7 drones em órbita maior; ímã 50% mais forte'),
    ('Rastro de Fogo', '♨', '#ff8a2b', 'O dash deixa um rastro de fogo cibernético.', 'Blindagem', 'Inferno Neon', 'fogo mais largo e forte, que queima também enquanto você corre'),
    ('Raio em Cadeia', '↯', '#bff6ff', 'Automático: um raio atinge o inimigo mais próximo e salta para outros.', 'Amplificador', 'Tempestade Elétrica', 'dois raios por vez, até 10 saltos sem perder força'),
    ('Campo Tesla', '⊛', '#8c9bff', 'Automático: campo elétrico em volta dá choque em quem chegar perto.', 'Vampirismo Digital', 'Bobina Vampira', 'campo 40% maior e cada choque recupera vida'),
    ('Bumerangue de Plasma', '☾', '#ffb03c', 'Automático: vai e volta atravessando a horda.', 'Dash Duplo', 'Bumerangue Duplo', 'para os dois lados, +2, e cada dash lança um'),
]
PASSIVES = [
    ('Ímã', '⊕', '#7fd8ff', '+20% de raio de coleta das G Batty'),
    ('Blindagem', '♥', '#ff5c8a', '+10% de vida máxima (e cura esse valor)'),
    ('Turbo', '»', '#ffe14d', '+5% de velocidade e de dash'),
    ('Resfriamento', '❄', '#9ab8ff', '−6% no tempo de recarga das skills'),
    ('Vampirismo Digital', '❣', '#ff3b5c', 'cada abate recupera 0,3% da vida por nível'),
    ('Amplificador', '◎', '#ffd84d', '+8% no tamanho de golpes, campos, raios e bumerangues'),
    ('Dash Duplo', '⇉', '#5ef0ff', '2ª carga de dash; depois, −6% na recarga'),
]
LAB = [('♥', 'Chassi Reforçado', '+10% de vida máxima', '#ff5c8a'), ('»', 'Propulsores', '+4% de velocidade e +6% de dash', '#ffe14d'),
       ('⚡', 'Sobrecarga de Núcleo', '+8% de dano', '#5ef0ff'), ('⊕', 'Módulo Magnético', '+15% de raio de coleta', '#7fd8ff'),
       ('✦', 'Sorte Algorítmica', '+6% de chance de carta RARA', '#c04dff'), ('✸', 'Ataque Crítico', '+5% de chance de crítico (dano ×1,8 a ×2,2)', '#ffb02e')]
TALENTS = [('ATAQUE', '#ff4df0', ['Força: +3% de dano (5 níveis)', 'Precisão: +2% de crítico (3)', 'Ritmo: −3% de recarga (3)', 'Carrasco: +25% de dano em elites e chefes']),
           ('DEFESA', '#5ef0ff', ['Couraça: +4% de vida (5)', 'Resistência: −3% de dano recebido (3)', 'Nanorreparo: cura 1% a cada 8 s (3)', 'Escudo de Fase: bloqueia 1 golpe por fase']),
           ('MOBILIDADE', '#ffd84d', ['Passos Leves: +2% de velocidade (5)', 'Coletor: +8% de coleta (3)', 'Fôlego: −5% de recarga do dash (3)', 'Sorte Grande: +1 rerrolagem por partida'])]
MODS = [('🐀', 'ENXAME', 'Muito mais inimigos, mais frágeis'), ('🛡', 'BLINDADOS', 'Inimigos +50% vida · +60% Sucata'),
        ('🔥', 'FÚRIA', 'Inimigos +40% dano · +30% XP'), ('⚡', 'SOBRECARGA', 'Suas skills recarregam 20% mais rápido · inimigos +20% vida')]

NAME = {e[0]: e[1] for e in ENEMIES}


# ---------------- Blocos HTML ----------------
def char_cards():
    out = []
    for cid, name, color, price, line, trait, (aic, aname), start, wpn, st, water in CHARS:
        price_html = '<b class="free">GRÁTIS · INICIAL</b>' if price == 0 else f'<b class="coin">◆ {price}</b> <small>Cyber-Moedas</small>'
        bars = ''.join(
            f'<div class="bar"><span>{lab}</span><i style="--v:{min(100, v / 1.5):.0f}%"></i><b>{v}%</b></div>'
            for lab, v in (('Vida', st['hp']), ('Dano', st['dmg']), ('Alcance', st['rng']), ('Velocidade', st['spd']), ('Ímã', st['mag'])))
        rows = [f'<li><span class="k">Traço</span>{E(trait)}</li>', f'<li><span class="k">Ataque</span><span class="ico">{aic}</span> {E(aname)}</li>']
        if start: rows.append(f'<li><span class="k">Começa com</span>{E(start)}</li>')
        if water: rows.append(f'<li><span class="k">Submerso</span>{E(water)}</li>')
        if wpn:
            wn, wd, w5, wimg = wpn
            rows.append(f'<li class="wpn"><span class="k">Arma exclusiva</span><b>{E(wn)}</b> {E(wd)} <em>{E(w5)}</em>{spr(wimg, wn, fit=(120, 56))}</li>')
        else:
            rows.append('<li><span class="k">Arma exclusiva</span><em>em desenvolvimento</em></li>')
        out.append(f'''<article class="card char" style="--c:{color}">
  <div class="pedestal">{spr('char_' + cid, name, fit=(210, 220))}</div>
  <h3>{name}</h3><p class="line">{E(line)}</p>
  <ul class="facts">{''.join(rows)}</ul>
  <div class="bars">{bars}</div>
  <div class="price">{price_html}</div>
</article>''')
    out.append(f'''<article class="card char soon" style="--c:#5ef0ff">
  <div class="pedestal">{spr('char_corvo', 'Corvo', fit=(210, 220))}</div>
  <h3>CORVO <span class="tagsoon">EM BREVE</span></h3><p class="line">Vigia a cidade do alto.</p>
  <ul class="facts"><li><span class="k">Traço</span>Voo curto</li><li>Bate asas no ar e ataca de cima. Chega numa próxima atualização.</li></ul>
</article>''')
    return '\n'.join(out)


def enemy_cards():
    sectors_of = {e[0]: [] for e in ENEMIES}
    for sid, r in ROSTER.items():
        for tier in r.values():
            for eid in tier:
                if sid not in sectors_of[eid]: sectors_of[eid].append(sid)
    order = {s[0]: i for i, s in enumerate(SECTORS)}
    out = []
    for eid, name, tier, hp, dmg, fly, desc in ENEMIES:
        tl, tc = TIER[tier]
        m = MAN['en_' + eid]
        k = 1.0 if m['h'] >= 44 else min(2.0, 46 / m['h'])
        secs = sorted(sectors_of[eid], key=order.get)
        chips = ''.join(f'<i style="--c:{SCOLOR[s]}">{SHORT[s]}</i>' for s in secs)
        out.append(f'''<article class="card foe" data-s="{' '.join(secs)}" style="--c:{tc}">
  <div class="foe-img">{spr('en_' + eid, name, k=k, fit=(150, 96))}</div>
  <div class="foe-tx"><h4>{E(name)}</h4>
  <p class="meta"><b class="tier">{tl}</b>{' · VOA' if fly else ''} · ♥ {hp} · ✸ {dmg}</p>
  <p>{E(desc)}</p><p class="where">{chips}</p></div>
</article>''')
    return '\n'.join(out)


def boss_cards(lst, water=False):
    out = []
    for bid, name, hp, fly, color, atks in lst:
        li = ''.join(f'<li>{E(a)}</li>' for a in atks)
        out.append(f'''<article class="card boss" style="--c:{color}">
  <div class="boss-img">{spr('boss_' + bid, name, fit=(230, 170))}</div>
  <div><h4>{E(name)}</h4><p class="meta">♥ {hp} de vida base{' · VOA' if fly else ''}{' · SETOR SUBMERSO' if water else ''}</p>
  <ul class="atk">{li}</ul></div>
</article>''')
    return '\n'.join(out)


def sector_cards():
    out = []
    for i, (sid, name, sub, color, desc) in enumerate(SECTORS):
        r = ROSTER[sid]
        foes = ' · '.join(NAME[e] for e in r['weak'] + r['medium'] + r['tank'])
        out.append(f'''<article class="card sector" style="--c:{color}">
  <div class="shot"><img src="img/sec_{sid}.webp" alt="{E(name)} no jogo" width="396" height="360" loading="lazy" decoding="async"><span class="num">{i + 1:02d}</span></div>
  <div class="sec-tx"><h4>{name}</h4><p class="sub">{E(sub)}</p><p>{E(desc)}</p><p class="foes"><b>Horda:</b> {E(foes)}</p></div>
</article>''')
    return '\n'.join(out)


def filter_chips():
    out = ['<button class="chip on" data-f="all" style="--c:#ece8ff">TODOS</button>']
    for sid, name, _, color, _ in SECTORS:
        out.append(f'<button class="chip" data-f="{sid}" style="--c:{color}">{name}</button>')
    return ''.join(out)


def skills_html():
    a = ''.join(f'''<div class="skill" style="--c:{c}"><span class="ico">{ic}</span><div><b>{E(n)}</b><p>{E(d)}</p>
<p class="evo">Nv 8 + <b>{E(p)}</b> → <b>{E(en)}</b>: {E(ed)}.</p></div></div>''' for n, ic, c, d, p, en, ed in ACTIVES)
    p = ''.join(f'<div class="skill sm" style="--c:{c}"><span class="ico">{ic}</span><div><b>{E(n)}</b><p>{E(d)}</p></div></div>' for n, ic, c, d in PASSIVES)
    return a, p


ACT, PAS = skills_html()
LAB_HTML = ''.join(f'<li style="--c:{c}"><span class="ico">{ic}</span><b>{E(n)}</b> <span>{E(d)} por nível</span></li>' for ic, n, d, c in LAB)
TAL_HTML = ''.join(f'<div class="branch" style="--c:{c}"><h5>{n}</h5><ul>{"".join(f"<li>{E(t)}</li>" for t in ts)}</ul></div>' for n, c, ts in TALENTS)
MOD_HTML = ''.join(f'<li><span class="ico">{ic}</span> <b>{n}</b> · {E(d)}</li>' for ic, n, d in MODS)
LINEUP = ''.join(f'<div class="hero-char" style="--c:{c[2]};--i:{i}">{spr("char2_" + c[0], c[1], fit=(112, 116))}</div>' for i, c in enumerate(CHARS))
LINEUP += f'<div class="hero-char soon" style="--c:#5ef0ff;--i:6">{spr("char2_corvo", "Corvo", fit=(112, 116))}</div>'

CSS = r'''
:root { --pink:#ff4df0; --cyan:#5ef0ff; --gold:#ffd84d; --green:#4dffa6; --orange:#ff9a3c; --lilac:#b9a6ff; --text:#ece8ff; --bg:#06031a; --nav:56px; }
* { box-sizing: border-box; }
html { scroll-behavior: smooth; scroll-padding-top: calc(var(--nav) + 8px); -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.55 "Trebuchet MS", system-ui, sans-serif; overflow-x: hidden; }
body::before { content: ''; position: fixed; inset: 0; z-index: -2; background: radial-gradient(ellipse at 50% 0%, #2a0d44 0%, #0b0520 50%, #04020c 100%); }
body::after { content: ''; position: fixed; inset: 0; z-index: 50; pointer-events: none; background: repeating-linear-gradient(0deg, rgba(0,0,0,.14) 0 1px, transparent 1px 3px); }
a { color: var(--cyan); }
img { max-width: 100%; }
.wrap { width: min(1120px, 100%); margin: 0 auto; padding: 0 16px; }

/* Sprites animados: tira de quadros deslizando em passos */
.spr { display: inline-block; position: relative; overflow: hidden; flex: none; vertical-align: bottom; }
.spr img { display: block; position: absolute; left: 0; top: 0; max-width: none; height: 100%; width: auto; image-rendering: pixelated; }
.spr.anim img { animation: strip var(--d) steps(var(--n)) infinite; }
@keyframes strip { to { transform: translateX(-100%); } }

/* Menu fixo */
.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 40; height: var(--nav); display: flex; align-items: center; gap: 12px; padding: 0 12px;
  background: rgba(6,3,26,.86); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border-bottom: 1px solid rgba(255,77,240,.35); box-shadow: 0 0 18px rgba(255,77,240,.15); }
.nav .mini-logo { font-weight: 900; font-size: 20px; letter-spacing: 3px; text-decoration: none; color: #fff; text-shadow: 0 0 8px var(--pink); white-space: nowrap; }
.nav .mini-logo b { color: var(--cyan); text-shadow: 0 0 8px var(--cyan); }
.nav ul { display: flex; gap: 4px; margin: 0; padding: 0; list-style: none; overflow-x: auto; scrollbar-width: none; flex: 1; mask-image: linear-gradient(to right, #000 85%, transparent); -webkit-mask-image: linear-gradient(to right, #000 85%, transparent); }
.nav ul::-webkit-scrollbar { display: none; }
.nav li a { display: block; padding: 8px 10px; border-radius: 8px; color: var(--text); text-decoration: none; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; white-space: nowrap; }
.nav li a:hover, .nav li a.on { color: #fff; background: rgba(255,77,240,.16); box-shadow: inset 0 -2px 0 var(--pink); }
.nav .dl { flex: none; padding: 7px 12px; border-radius: 10px; border: 2px solid var(--pink); color: #fff; font-weight: 900; font-size: 12px; letter-spacing: 1px; text-decoration: none; box-shadow: 0 0 10px var(--pink); }
@media (min-width: 900px) { .nav ul { mask-image: none; -webkit-mask-image: none; justify-content: center; } }

/* Topo */
.hero { position: relative; min-height: 100svh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: calc(var(--nav) + 28px) 16px 40px; text-align: center; overflow: hidden; }
.grid { position: absolute; left: -50%; right: -50%; bottom: -6%; height: 44%; z-index: -1; background: repeating-linear-gradient(90deg, rgba(255,77,240,.35) 0 1px, transparent 1px 44px), repeating-linear-gradient(0deg, rgba(94,240,255,.3) 0 1px, transparent 1px 44px);
  transform: perspective(300px) rotateX(62deg); transform-origin: 50% 0; animation: grid 2.4s linear infinite; mask-image: linear-gradient(to top, #000 30%, transparent); -webkit-mask-image: linear-gradient(to top, #000 30%, transparent); }
@keyframes grid { to { background-position: 0 44px, 0 44px; } }
.studio { font-size: 13px; letter-spacing: 5px; color: var(--lilac); }
.studio b { color: #fff; font-size: 18px; letter-spacing: 3px; text-shadow: 0 0 8px #fff, 0 0 20px var(--pink); }
.logo { display: flex; align-items: baseline; justify-content: center; gap: 12px; margin: 0; font-weight: 900; font-size: clamp(64px, 21vw, 150px); letter-spacing: 6px; line-height: 1; }
.logo .neko { color: #fff; text-shadow: 0 0 6px #fff, 0 0 18px #ff4df0, 0 0 40px #ff4df0; animation: flick 1.6s steps(1) .2s both; }
.logo .g { color: var(--cyan); text-shadow: 0 0 6px #fff, 0 0 18px #5ef0ff, 0 0 40px #5ef0ff; animation: flick 1.6s steps(1) .65s both; }
@keyframes flick { 0% { opacity: 0; } 10% { opacity: 1; } 14% { opacity: .1; } 22% { opacity: 1; } 30% { opacity: .3; } 34%, 100% { opacity: 1; } }
.tagline { font-size: 12px; letter-spacing: 4px; color: var(--gold); text-shadow: 0 0 10px rgba(255,216,77,.5); }
.pitch { max-width: 560px; margin: 4px auto 0; font-size: 17px; opacity: .92; }
.lineup { display: flex; justify-content: center; align-items: flex-end; flex-wrap: wrap; gap: 0 4px; margin: 10px 0 4px; max-width: 1000px; }
.hero-char { animation: up .6s ease-out calc(.9s + var(--i) * .08s) both; filter: drop-shadow(0 0 10px color-mix(in srgb, var(--c) 45%, transparent)); }
.hero-char.soon { opacity: .55; filter: grayscale(.5); }
@media (max-width: 520px) { .lineup { zoom: .78; } }
@keyframes up { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
.cta { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-width: 240px; padding: 14px 22px; border-radius: 12px; border: 2px solid var(--c, var(--pink)); background: rgba(10,8,30,.85);
  color: #fff; font-size: 18px; font-weight: 900; letter-spacing: 1px; text-decoration: none; box-shadow: 0 0 14px var(--c, var(--pink)); animation: pulse 2.2s ease-in-out infinite; }
.btn:hover { background: rgba(255,77,240,.18); }
.btn.alt { --c: var(--cyan); animation: none; font-size: 15px; min-width: 0; padding: 10px 16px; }
@keyframes pulse { 50% { box-shadow: 0 0 28px var(--c, var(--pink)), 0 0 6px #fff; } }
.cta small { font-size: 12px; opacity: .7; }
.scroll-hint { margin-top: 6px; font-size: 11px; letter-spacing: 3px; opacity: .55; }

/* Seções */
section { padding: 56px 0 24px; }
.h2 { --c: var(--pink); margin: 0 0 6px; font-size: clamp(26px, 7vw, 40px); font-weight: 900; letter-spacing: 4px; text-transform: uppercase; color: #fff; text-shadow: 0 0 6px #fff, 0 0 18px var(--c), 0 0 36px var(--c); }
.kicker { margin: 0 0 22px; font-size: 12px; letter-spacing: 3px; color: var(--c, var(--cyan)); text-transform: uppercase; }
h3, h4, h5 { margin: 0; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
.card { --c: var(--cyan); border: 2px solid var(--c); border-radius: 14px; background: rgba(10,8,30,.9); box-shadow: 0 0 14px color-mix(in srgb, var(--c) 55%, transparent); padding: 16px; }
.card h3, .card h4 { color: #fff; text-shadow: 0 0 10px var(--c); }
.ico { color: var(--c); text-shadow: 0 0 8px var(--c); }
.lead { max-width: 760px; font-size: 17px; }

/* História */
.story { display: grid; gap: 18px; grid-template-columns: 1fr; align-items: start; }
.story p { margin: 0 0 14px; }
.story p:first-letter { font-size: 1.6em; font-weight: 900; color: var(--pink); text-shadow: 0 0 8px var(--pink); }
.story .shot-phone { justify-self: center; }
@media (min-width: 860px) { .story { grid-template-columns: 1.4fr 1fr; gap: 32px; } }

/* Como se joga */
.duo { display: grid; gap: 20px; grid-template-columns: 1fr; align-items: center; }
@media (min-width: 860px) { .duo { grid-template-columns: 1fr 1fr; } .duo.rev > :first-child { order: 2; } }
.phone { position: relative; width: min(280px, 78vw); margin: 0 auto; border: 3px solid var(--c, var(--pink)); border-radius: 26px; padding: 10px 8px; background: #05020f; box-shadow: 0 0 22px var(--c, var(--pink)); }
.phone img { display: block; width: 100%; height: auto; border-radius: 16px; }
.phone figcaption { margin-top: 8px; font-size: 12px; text-align: center; opacity: .75; }
.ctrls { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); margin: 14px 0; padding: 0; list-style: none; }
.ctrls li { --c: var(--lilac); display: flex; gap: 10px; align-items: center; padding: 10px 12px; border: 2px solid var(--c); border-radius: 12px; background: rgba(10,8,30,.75); font-size: 14px; }
.ctrls .key { flex: none; display: grid; place-items: center; width: 42px; height: 42px; border-radius: 50%; border: 2px dashed var(--c); color: var(--c); font-weight: 900; font-size: 18px; text-shadow: 0 0 8px var(--c); }
.moves { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); margin-top: 18px; }
.move { display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 8px; min-height: 186px; text-align: center; font-size: 13px; }
.move b { display: block; color: #fff; letter-spacing: 1px; font-size: 14px; text-transform: uppercase; }
.loop { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); margin: 18px 0; }
.loop .card { display: flex; gap: 12px; align-items: center; }
.loop .card p { margin: 4px 0 0; font-size: 14px; }
.skills { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
.skill { display: flex; gap: 12px; padding: 12px; border: 2px solid var(--c); border-radius: 12px; background: rgba(12,8,30,.9); box-shadow: 0 0 10px color-mix(in srgb, var(--c) 40%, transparent); }
.skill .ico { flex: none; width: 34px; font-size: 26px; text-align: center; line-height: 1.2; }
.skill p { margin: 2px 0 0; font-size: 14px; opacity: .9; }
.skill .evo { font-size: 13px; color: var(--gold); opacity: 1; }
.skill.sm { padding: 10px 12px; }
.h3 { margin: 30px 0 12px; font-size: 20px; color: #fff; text-shadow: 0 0 10px var(--c, var(--cyan)); }
.pills { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0; padding: 0; list-style: none; }
.pills li { padding: 6px 12px; border-radius: 999px; border: 1px solid var(--c, var(--lilac)); font-size: 14px; background: rgba(10,8,30,.7); }
.lab { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); margin: 10px 0; padding: 0; list-style: none; }
.lab li { --c: var(--cyan); display: flex; flex-wrap: wrap; gap: 4px 10px; align-items: baseline; padding: 10px 12px; border-left: 3px solid var(--c); background: rgba(10,8,30,.75); border-radius: 0 10px 10px 0; font-size: 14px; }
.lab .ico { font-size: 18px; }
.lab span:last-child { width: 100%; opacity: .8; }
.branches { display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); }
.branch { --c: var(--pink); padding: 12px 14px; border: 2px solid var(--c); border-radius: 12px; background: rgba(10,8,30,.85); }
.branch h5 { color: var(--c); text-shadow: 0 0 8px var(--c); font-size: 15px; }
.branch ul { margin: 8px 0 0; padding-left: 18px; font-size: 14px; }
.weapons { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); }
.weapons .card { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; font-size: 14px; }
.weapons .card p { margin: 0; }
.backup { --c: var(--gold); display: grid; gap: 16px; grid-template-columns: 1fr; align-items: center; }
.backup .count { font-size: 64px; font-weight: 900; color: var(--gold); text-shadow: 0 0 10px #fff, 0 0 28px var(--gold); text-align: center; line-height: 1; }
@media (min-width: 700px) { .backup { grid-template-columns: 140px 1fr; } }

/* Modos */
.modes { display: grid; gap: 18px; grid-template-columns: 1fr; }
@media (min-width: 860px) { .modes { grid-template-columns: 1fr 1fr; } }
.mode h3 { font-size: 26px; }
.mode h3 .ico { font-size: 28px; }
.mode ul { padding-left: 18px; margin: 10px 0 0; }
.mode li { margin: 5px 0; }
.mode .note { font-size: 13px; opacity: .75; }
.goals { display: grid; gap: 8px; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); margin: 12px 0; }
.goals div { padding: 10px; border: 1px dashed var(--c); border-radius: 10px; font-size: 14px; }
.goals b { display: block; color: var(--c); letter-spacing: 1px; }
.stars { color: var(--gold); text-shadow: 0 0 8px var(--gold); letter-spacing: 2px; }

/* Personagens */
.chars { display: grid; gap: 18px; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); }
.char { display: flex; flex-direction: column; gap: 8px; }
.char .pedestal { display: flex; justify-content: center; align-items: flex-end; min-height: 200px; padding-top: 6px; background: radial-gradient(ellipse at 50% 90%, color-mix(in srgb, var(--c) 25%, transparent), transparent 65%); }
.char h3 { font-size: 26px; text-align: center; }
.char .line { margin: 0; text-align: center; font-style: italic; opacity: .85; }
.facts { margin: 4px 0 0; padding: 0; list-style: none; font-size: 14px; }
.facts li { padding: 6px 0; border-top: 1px solid rgba(255,255,255,.08); }
.facts .k { display: block; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--c); }
.facts em { color: var(--gold); font-style: normal; }
.facts .wpn .spr { display: block; margin: 6px auto 0; }
.bars { display: grid; gap: 4px; margin-top: 4px; }
.bar { display: grid; grid-template-columns: 84px 1fr 46px; gap: 8px; align-items: center; font-size: 12px; }
.bar i { height: 8px; border-radius: 4px; background: rgba(255,255,255,.08); position: relative; overflow: hidden; }
.bar i::after { content: ''; position: absolute; inset: 0 auto 0 0; width: var(--v); background: linear-gradient(90deg, var(--c), #fff); box-shadow: 0 0 8px var(--c); border-radius: 4px; }
.bar b { text-align: right; }
.price { margin-top: auto; padding-top: 8px; text-align: center; }
.price .coin { color: var(--cyan); font-size: 20px; text-shadow: 0 0 8px var(--cyan); }
.price .free { color: var(--green); letter-spacing: 2px; text-shadow: 0 0 8px var(--green); }
.char.soon { border-style: dashed; }
.char.soon .pedestal { filter: grayscale(.4) brightness(.85); }
.tagsoon { display: inline-block; vertical-align: middle; margin-left: 6px; padding: 2px 8px; border-radius: 6px; background: var(--cyan); color: #06031a; font-size: 11px; letter-spacing: 2px; text-shadow: none; }
.fine { font-size: 13px; opacity: .7; }

/* Bestiário */
.chips { display: flex; gap: 8px; overflow-x: auto; padding: 4px 2px 12px; scrollbar-width: thin; }
.chip { --c: var(--cyan); flex: none; padding: 8px 12px; border-radius: 999px; border: 2px solid var(--c); background: rgba(10,8,30,.85); color: var(--text); font: 700 12px/1 "Trebuchet MS", system-ui, sans-serif; letter-spacing: 1px; cursor: pointer; }
.chip.on { background: var(--c); color: #06031a; box-shadow: 0 0 12px var(--c); }
.count { font-size: 13px; opacity: .75; margin: 0 0 12px; }
.foes-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); }
.foe { display: flex; gap: 12px; padding: 12px; align-items: flex-start; }
.foe[hidden] { display: none; }
.foe-img { flex: none; display: grid; place-items: center; width: 96px; min-height: 80px; border-radius: 10px; background: radial-gradient(circle at 50% 60%, color-mix(in srgb, var(--c) 18%, transparent), transparent 70%); }
.foe-img .spr { max-width: 96px; }
.foe h4 { font-size: 15px; letter-spacing: 1px; }
.foe p { margin: 4px 0 0; font-size: 13.5px; }
.meta { font-size: 12px !important; letter-spacing: 1px; opacity: .85; }
.tier { color: var(--c); }
.where { display: flex; flex-wrap: wrap; gap: 4px; }
.where i { --c: #fff; font-style: normal; font-size: 10.5px; padding: 1px 7px; border-radius: 999px; border: 1px solid var(--c); color: var(--c); letter-spacing: .5px; }
.bosses { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(310px, 1fr)); }
.boss { display: flex; flex-direction: column; gap: 8px; }
.boss-img { display: flex; justify-content: center; align-items: flex-end; min-height: 172px; background: radial-gradient(ellipse at 50% 85%, color-mix(in srgb, var(--c) 22%, transparent), transparent 70%); }
.boss h4 { font-size: 19px; }
.atk { margin: 6px 0 0; padding-left: 18px; font-size: 14px; }
.atk li { margin: 3px 0; }
.boss-rules { margin: 8px 0 18px; }

/* Cenários */
.sectors { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); }
.sector { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
.sector .shot { position: relative; aspect-ratio: 396 / 360; background: #05020f; }
.sector .shot img { display: block; width: 100%; height: 100%; object-fit: cover; image-rendering: pixelated; }
.sector .num { position: absolute; left: 10px; top: 8px; font-weight: 900; font-size: 26px; color: #fff; text-shadow: 0 0 8px var(--c), 0 0 18px var(--c); }
.sec-tx { padding: 12px 14px 14px; border-top: 2px solid var(--c); }
.sec-tx h4 { font-size: 18px; }
.sec-tx p { margin: 6px 0 0; font-size: 14px; }
.sec-tx .sub { margin: 0; font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: var(--c); }
.sec-tx .foes { font-size: 12.5px; opacity: .8; }

/* Download */
.steps { counter-reset: s; margin: 14px 0; padding: 0; list-style: none; display: grid; gap: 10px; }
.steps li { counter-increment: s; position: relative; padding: 12px 12px 12px 54px; border: 2px solid rgba(94,240,255,.5); border-radius: 12px; background: rgba(10,8,30,.8); }
.steps li::before { content: counter(s); position: absolute; left: 12px; top: 10px; width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; background: var(--cyan); color: #06031a; font-weight: 900; box-shadow: 0 0 10px var(--cyan); }
.play { --c: var(--green); text-align: center; }
.play b { color: var(--green); letter-spacing: 2px; text-shadow: 0 0 8px var(--green); }
footer { margin-top: 40px; padding: 26px 16px 40px; text-align: center; border-top: 1px solid rgba(255,77,240,.3); font-size: 13px; opacity: .85; }
footer .mini-logo { font-weight: 900; font-size: 22px; letter-spacing: 3px; color: #fff; text-shadow: 0 0 8px var(--pink); }
footer .mini-logo b { color: var(--cyan); text-shadow: 0 0 8px var(--cyan); }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .spr.anim img, .grid, .btn, .logo .neko, .logo .g, .hero-char { animation: none !important; }
}
'''

JS = r'''
// Filtro do bestiário por cenário
(function () {
  var chips = document.querySelectorAll('.chip'), foes = document.querySelectorAll('.foe'), out = document.getElementById('foe-count');
  function apply(f) {
    var n = 0;
    foes.forEach(function (el) { var ok = f === 'all' || (' ' + el.dataset.s + ' ').indexOf(' ' + f + ' ') >= 0; el.hidden = !ok; if (ok) n++; });
    out.textContent = n + (n === 1 ? ' inimigo' : ' inimigos') + (f === 'all' ? ' no total' : ' neste cenário');
  }
  chips.forEach(function (c) { c.addEventListener('click', function () { chips.forEach(function (x) { x.classList.toggle('on', x === c); x.setAttribute('aria-pressed', x === c); }); apply(c.dataset.f); }); });
  apply('all');
})();
// Destaca no menu a seção visível
(function () {
  if (!('IntersectionObserver' in window)) return;
  var links = {}; document.querySelectorAll('.nav li a').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
  window.addEventListener('scroll', function () { if (window.scrollY < 300) for (var k in links) links[k].classList.remove('on'); }, { passive: true });
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting && links[e.target.id]) { for (var k in links) links[k].classList.toggle('on', k === e.target.id); } }); }, { rootMargin: '-45% 0px -50% 0px' });
  document.querySelectorAll('main section[id]').forEach(function (s) { io.observe(s); });
})();
'''

PAGE = f'''<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Neko G · RX Games · roguelite de hordas cyberpunk</title>
<meta name="description" content="Neko G: plataforma 2D de ação e roguelite de hordas num mundo cyberpunk neon. Personagens, monstros, chefões, cenários, modos e download do APK de teste.">
<meta name="theme-color" content="#06031a">
<meta property="og:title" content="Neko G · RX Games">
<meta property="og:description" content="Plataforma 2D + hordas num mundo cyberpunk neon. Baixe o APK de teste.">
<link rel="icon" href="img/it_cyber.webp">
<style>{CSS}</style>
</head>
<body>
<nav class="nav" aria-label="Seções">
  <a class="mini-logo" href="#topo">NEKO <b>G</b></a>
  <ul>
    <li><a href="#historia">História</a></li>
    <li><a href="#jogar">Como jogar</a></li>
    <li><a href="#modos">Modos</a></li>
    <li><a href="#personagens">Personagens</a></li>
    <li><a href="#bestiario">Bestiário</a></li>
    <li><a href="#cenarios">Cenários</a></li>
    <li><a href="#baixar">Baixar</a></li>
  </ul>
  <a class="dl" href="#baixar">APK</a>
</nav>

<header class="hero" id="topo">
  <div class="grid" aria-hidden="true"></div>
  <div class="studio"><b>RX GAMES</b> apresenta</div>
  <h1 class="logo" aria-label="Neko G"><span class="neko">NEKO</span><span class="g">G</span></h1>
  <div class="tagline">ROGUELITE DE HORDAS · CYBERPUNK</div>
  <p class="pitch">A cidade foi hackeada. As máquinas viraram uma horda. Pule, dê dash, corte e sobreviva o máximo que puder com um bando de animais neon.</p>
  <div class="lineup" aria-label="Personagens">{LINEUP}</div>
  <div class="cta">
    <a class="btn" href="{APK}" target="_blank" rel="noopener">⬇ Baixar APK (teste)</a>
    <small>Android · fase de testes · precisa de conta no GitHub · <a href="#baixar">como instalar</a></small>
  </div>
  <div class="scroll-hint">▼ ROLE PARA CONHECER O JOGO</div>
</header>

<main>
<section id="historia"><div class="wrap">
  <h2 class="h2">História</h2><p class="kicker" style="--c:var(--pink)">A cidade que nunca desliga</p>
  <div class="story">
    <div class="lead">
      <p>Na metrópole neon, tudo tem um chip: os drones que recolhem o lixo, os cães de guarda do porto, os ratos do laboratório. Numa noite de chuva, um sinal partiu do 100º andar da <b>Torre Corporativa</b> e reescreveu cada um desses chips. Em segundos, as máquinas viraram uma horda que só obedece a uma ordem: caçar quem ainda pensa por conta própria.</p>
      <p>Alguns animais de rua tinham implantes caseiros, montados com sucata no Distrito Neon, que o sinal não conseguiu ler. Um gato de botas a jato, um guaxinim hacker, um pug de armadura, um coelho biônico, um macaco que joga dados de código e um tatu blindado formaram um bando. Nas ruas, chamam o grupo de <b>NEKO G</b>. O "G"? Cada um conta uma versão: Gangue, Glitch, Garras… ninguém confirma.</p>
      <p>Cada máquina derrubada solta uma <b>G Batty</b>, bateria ainda carregada que os implantes absorvem para ficar mais fortes no meio da luta. A <b>Sucata</b> volta para o Esconderijo, onde o Laboratório transforma restos de robô em upgrades permanentes.</p>
      <p>Todo implante do bando guarda uma única cópia de segurança, o <b>Protocolo de Backup</b>. Se o corpo cai, ele pode voltar uma vez, só uma.</p>
      <p>O caminho até o sinal atravessa 13 setores, cada um com um guardião gigante. E dizem que, quando alguém chega ao topo, o sinal reinicia mais forte, e a cidade inteira começa de novo.</p>
    </div>
    <figure class="phone shot-phone" style="--c:var(--pink)"><img src="img/shot_boss.webp" alt="O Gato enfrentando o Polvo de Neon no Distrito Neon" width="410" height="730" loading="lazy" decoding="async"><figcaption>O Gato contra o Polvo de Neon, guardião do Distrito.</figcaption></figure>
  </div>
</div></section>

<section id="jogar"><div class="wrap">
  <h2 class="h2" style="--c:var(--cyan)">Como se joga</h2><p class="kicker">Plataforma ágil + horda sem fim</p>
  <div class="duo">
    <figure class="phone" style="--c:var(--cyan)"><img src="img/shot_hud.webp" alt="Tela do jogo no Neon Mall com vida, nível, tempo e botões de toque" width="410" height="730" loading="lazy" decoding="async"><figcaption>Neon Mall: vida, nível, tempo até o chefão e os botões de toque.</figcaption></figure>
    <div>
      <p class="lead">O jogo é em pé (retrato), feito para o celular. Você corre e pula por uma arena horizontal sem fim enquanto a horda chega pelos dois lados, em ondas cada vez maiores. A movimentação é rápida e justa, no estilo Metroidvania: pulo variável, pulo duplo, deslizar e pular na parede, dash com invencibilidade.</p>
      <ul class="ctrls">
        <li style="--c:var(--lilac)"><span class="key">◀▶</span>Andar para os lados</li>
        <li style="--c:var(--pink)"><span class="key">⤒</span><span><b>PULO</b>: segure para ir mais alto; no ar, pule de novo</span></li>
        <li style="--c:var(--cyan)"><span class="key">⚡</span><span><b>DASH</b>: arrancada rápida, invencível por um instante</span></li>
        <li style="--c:var(--gold)"><span class="key">⚔</span><span><b>ATAQUE</b>: golpeia para onde você olha; segure para atacar sem parar</span></li>
      </ul>
      <p class="fine">Ataque automático é opcional (Opções). Dá para mudar tamanho e transparência dos botões e usar o modo canhoto. No teclado: A/D ou ←/→ andam, Espaço pula, J ataca, Shift dá dash.</p>
    </div>
  </div>

  <div class="moves">
    <div class="card move" style="--c:var(--pink)">{spr('gato_run', 'Gato correndo', k=1.2)}<span><b>Correr</b>Garras para a horda</span></div>
    <div class="card move" style="--c:var(--pink)">{spr('gato_airjump', 'Gato no pulo duplo', k=1.15)}<span><b>Pulo duplo</b>Botas a jato</span></div>
    <div class="card move" style="--c:var(--cyan)">{spr('gato_dash', 'Gato dando dash', k=1.2)}<span><b>Dash</b>Atravessa o perigo</span></div>
    <div class="card move" style="--c:var(--gold)">{spr('gato_attack', 'Gato atacando', k=1.2)}<span><b>Ataque</b>Garras Elétricas</span></div>
    <div class="card move" style="--c:var(--green)">{spr('guaxinim_glide', 'Guaxinim planando', k=1.1)}<span><b>Planar</b>Só o Guaxinim</span></div>
    <div class="card move" style="--c:var(--orange)">{spr('pug_slam', 'Pug na queda pesada', k=1.2)}<span><b>Queda pesada</b>Só o Pug</span></div>
  </div>

  <h3 class="h3" style="--c:var(--green)">G Batty, level up e cartas</h3>
  <div class="duo rev">
    <figure class="phone" style="--c:var(--green)"><img src="img/shot_levelup.webp" alt="Tela de level up com três cartas para escolher" width="410" height="730" loading="lazy" decoding="async"><figcaption>Level up: escolha 1 de 3 cartas.</figcaption></figure>
    <div>
      <div class="loop">
        <div class="card" style="--c:var(--green)">{spr('it_battery', 'G Batty', k=1.4)}<div><b>G Batty</b><p>Todo inimigo derrotado solta uma bateria de XP. Chegue perto e ela voa até você.</p></div></div>
        <div class="card" style="--c:#ff5c8a">{spr('it_hp', 'Cápsula de vida', k=1.1)}<div><b>Cápsula de vida</b><p>Cai de qualquer monstro, mais fácil dos tanques e quando sua vida está baixa.</p></div></div>
        <div class="card" style="--c:var(--gold)">{spr('it_coin', 'Sucata', k=1.4)}<div><b>Sucata</b><p>Moeda do jogo. Gaste no Laboratório e nas armas exclusivas.</p></div></div>
        <div class="card" style="--c:var(--cyan)">{spr('it_cyber', 'Cyber-Moeda', k=1.3)}<div><b>Cyber-Moedas</b><p>Vêm do check-in diário, das missões e dos chefões. Liberam personagens e o revive.</p></div></div>
      </div>
      <p>Barra de XP cheia = <b>level up</b>: a ação pausa e aparecem <b>3 cartas</b>. Cada uma é uma skill nova ou um nível a mais numa que você já tem. Cabem <b>4 skills ativas + 4 passivas</b>, cada uma até o <b>nível 8</b>. Dá para <b>rerrolar</b> as cartas 2 vezes e <b>banir</b> 1 carta por partida. Uma ativa no nível máximo com a passiva certa <b>evolui</b> para uma versão bem mais forte.</p>
    </div>
  </div>
  <h3 class="h3" style="--c:var(--pink)">Skills ativas e evoluções</h3>
  <div class="skills">{ACT}</div>
  <h3 class="h3" style="--c:var(--lilac)">Skills passivas</h3>
  <div class="skills">{PAS}</div>

  <h3 class="h3" style="--c:var(--gold)">Protocolo de Backup (revive)</h3>
  <div class="card backup">
    <div class="count">5</div>
    <div><p style="margin:0">Sua vida zerou? O jogo pausa e começa uma contagem de <b>5 segundos</b>. Assista a um anúncio ou pague <b>◆ 50 Cyber-Moedas</b> e volte com <b>50% da vida</b>, <b>3 s de invencibilidade</b> e uma explosão que empurra para longe todos os inimigos da tela. <b>Só 1 revive por partida.</b></p></div>
  </div>

  <h3 class="h3" style="--c:var(--orange)">Armas exclusivas</h3>
  <p>Cada personagem pode ter uma arma própria, comprada e evoluída com Sucata (150 · 300 · 500 · 800 · 1200) na tela Escolher personagem. Com a arma comprada, ele já começa a partida com ela disparando sozinha. O nível 5 dá um bônus especial.</p>
  <div class="weapons">
    <div class="card" style="--c:#ff4df0">{spr('wpn_garras', 'Garras Energizadas', k=1.2)}<h4>Garras Energizadas</h4><p>Gato · três garras de energia avançam e atravessam a horda.</p></div>
    <div class="card" style="--c:#4dffa6">{spr('wpn_dados', 'Corte de Dados', k=1.1)}<h4>Corte de Dados</h4><p>Guaxinim · corte dos dois lados; quem é atingido trava com glitch.</p></div>
    <div class="card" style="--c:#ff9a3c">{spr('wpn_martelo', 'Martelo de Impacto', k=1.0)}<h4>Martelo de Impacto</h4><p>Pug · pancada pesada à frente e onda de choque pelo chão.</p></div>
  </div>

  <h3 class="h3" style="--c:var(--cyan)">Esconderijo: Laboratório e talentos</h3>
  <p>Entre as partidas, a Sucata compra <b>upgrades permanentes</b> no Laboratório (níveis 1 a 5, valem para todos os personagens):</p>
  <ul class="lab">{LAB_HTML}</ul>
  <p>Além disso, cada personagem ganha <b>XP permanente</b> ao fim de toda partida e sobe até o <b>nível 30</b>. Cada nível dá 1 ponto de talento numa árvore de 3 ramos (o último talento de cada ramo pede 6 pontos no ramo; redistribuir é grátis):</p>
  <div class="branches">{TAL_HTML}</div>
  <p class="fine">Também há check-in de 7 dias (◆ 10 a ◆ 80) e 3 missões diárias que dão Cyber-Moedas.</p>
</div></section>

<section id="modos"><div class="wrap">
  <h2 class="h2" style="--c:var(--gold)">Modos de jogo</h2><p class="kicker" style="--c:var(--gold)">Dois jeitos de atravessar a cidade</p>
  <div class="modes">
    <article class="card mode" style="--c:var(--pink)">
      <h3><span class="ico">∞</span> Infinito</h3>
      <p>Setor atrás de setor até cair. Sobreviva o máximo e entre no <b>ranking global de tempo</b>.</p>
      <ul>
        <li>Cada setor é um cenário inteiro, com horda própria.</li>
        <li>O <b>chefão</b> chega depois de 2:30 no setor 1 e 2:20 nos seguintes (contagem no topo da tela).</li>
        <li>Venceu? Abre um <b>portal</b> na cor do próximo cenário: ao entrar, você recupera <b>+25% de vida</b> e fica 2 s invencível.</li>
        <li>Cada setor deixa a horda mais forte. Depois do 13º, a cidade recomeça no <b>Ciclo 2</b>, com chefões ainda mais resistentes.</li>
        <li>Seu nível e suas skills seguem com você de setor em setor.</li>
      </ul>
    </article>
    <article class="card mode" style="--c:var(--cyan)">
      <h3><span class="ico">▶</span> Jornada</h3>
      <p>Mapas em sequência, praticamente sem fim. Cada <b>mapa = 1 cenário</b>, com <b>4 fases + chefe</b> (uns 6 a 8 minutos). O mapa 1 é sempre o Distrito; depois, a cada ciclo de 13 os cenários vêm embaralhados, iguais para todo mundo.</p>
      <div class="goals" style="--c:var(--cyan)">
        <div><b>⏱ SOBREVIVA</b>60 s, +10 s por fase</div>
        <div><b>☠ DERROTE</b>32 inimigos, +9 por fase</div>
        <div><b>➜ CHEGUE À SAÍDA</b>corra até o portal</div>
        <div><b>★ CAÇADA DE ELITE</b>3 a 6 elites com vida ×4 (mapa 2+)</div>
        <div><b>🔋 COLETE G BATTY</b>40 baterias, +8 por fase (mapa 2+)</div>
        <div><b>⚠ CHEFE</b>a fase final: o chefe surge em 5 s</div>
      </div>
      <p><b>Modificador do mapa</b> (a partir do mapa 2, um por mapa):</p>
      <ul class="pills" style="--c:var(--cyan)">{MOD_HTML}</ul>
      <ul>
        <li><span class="stars">★★★</span> por mapa: vencer · sem usar o revive · terminar com 50% de vida ou mais. Cada estrela nova vale ◆ 2.</li>
        <li><b>Expedição:</b> venceu o mapa? Siga para o próximo mantendo nível, skills e armas, com +35% de vida. Quanto mais forte você chega, mais forte a horda fica.</li>
        <li>Recompensas: chefe ◆ 5 (◆ 1 se o mapa já foi vencido), vitória +Sucata (30 + 8 por mapa) e ◆ 5 na primeira vez.</li>
        <li>As cartas valem para o mapa inteiro. O botão 🗺 MAPAS mostra o caminho, as estrelas e deixa repetir mapas vencidos.</li>
      </ul>
    </article>
  </div>
</div></section>

<section id="personagens"><div class="wrap">
  <h2 class="h2" style="--c:var(--green)">Personagens</h2><p class="kicker" style="--c:var(--green)">O bando Neko G</p>
  <p class="lead">Todos pulam, dão pulo duplo, deslizam e pulam na parede e dão dash. Cada um tem um traço de movimento, um ataque básico e atributos próprios. O Gato é grátis; os outros são liberados com Cyber-Moedas.</p>
  <div class="chars">{char_cards()}</div>
  <p class="fine">Valores da fase de testes; podem mudar até o lançamento. Barras em relação ao Gato (100%).</p>
</div></section>

<section id="bestiario"><div class="wrap">
  <h2 class="h2" style="--c:var(--orange)">Bestiário</h2><p class="kicker" style="--c:var(--orange)">A horda cibernética</p>
  <p class="lead">Todo ataque tem aviso (pisca, brilha, abaixa ou abre a boca) antes de acontecer. Cada cenário tem sua horda: no começo só fracos, depois entram médios e tanques. Toque num cenário para filtrar.</p>
  <div class="chips" role="group" aria-label="Filtrar por cenário">{filter_chips()}</div>
  <p class="count" id="foe-count" aria-live="polite"></p>
  <div class="foes-grid">{enemy_cards()}</div>
  <p class="fine">♥ vida base · ✸ dano base. A horda ganha vida e dano conforme o setor avança.</p>

  <h3 class="h3" style="--c:var(--pink)">Chefões</h3>
  <div class="boss-rules"><p>Um chefão guarda cada setor (no Infinito) e cada mapa (na Jornada), na ordem Polvo → Quimera → Glitch → T-Rex → Titã → Rainha → Sentinela. Tem barra de vida no topo, fases que mudam o ritmo e golpes sempre avisados. Não sofre empurrão nem atordoamento. Derrotado, garante <b>level up, Sucata, cápsula de vida grande e ◆ 5 Cyber-Moedas</b>.</p></div>
  <div class="bosses">{boss_cards(BOSSES)}</div>
  <h3 class="h3" style="--c:var(--cyan)">Chefões do Cyber Deep</h3>
  <p>No setor submerso, o guardião é a versão aquática de um chefão (um dos dois é sorteado por partida).</p>
  <div class="bosses">{boss_cards(WATER_BOSSES, True)}</div>
</div></section>

<section id="cenarios"><div class="wrap">
  <h2 class="h2" style="--c:var(--lilac)">Cenários</h2><p class="kicker" style="--c:var(--lilac)">13 setores até o topo da cidade</p>
  <div class="sectors">{sector_cards()}</div>
  <p class="fine">Imagens capturadas do jogo (versão {E(VERSION)}).</p>
</div></section>

<section id="baixar"><div class="wrap">
  <h2 class="h2" style="--c:var(--pink)">Baixar e testar</h2><p class="kicker" style="--c:var(--pink)">Fase de testes · Android</p>
  <div class="duo">
    <div>
      <p class="lead">O Neko G está em <b>fase de testes</b>: o jogo muda quase todo dia e sua opinião decide o que vem a seguir. O APK de teste sai automaticamente do GitHub a cada atualização.</p>
      <ol class="steps">
        <li>Entre (ou crie uma conta grátis) no <b>GitHub</b>. Sem conta, o GitHub não libera o download.</li>
        <li>Abra a página <a href="{APK}" target="_blank" rel="noopener">APK Android (teste)</a>, toque na execução mais recente (no topo, com ✓ verde).</li>
        <li>Em <b>Artifacts</b>, baixe <b>neko-g-apk-&lt;número&gt;</b>. Vem um .zip: abra e extraia o arquivo .apk.</li>
        <li>Toque no .apk e permita <b>instalar apps de fontes desconhecidas</b> quando o Android pedir.</li>
        <li>Jogue! Depois, conte o que achou pelo botão <b>💬 Feedback</b> do jogo.</li>
      </ol>
      <a class="btn" href="{APK}" target="_blank" rel="noopener">⬇ Baixar APK (teste)</a>
    </div>
    <div class="card" style="--c:var(--cyan)">
      <h4>O que pedimos aos testadores</h4>
      <ul class="atk">
        <li>Jogar pelo menos 3 partidas (Jornada e Infinito) e trocar de personagem.</li>
        <li>Testar as Opções: tamanho e transparência dos botões, modo canhoto, ataque automático ligado e desligado.</li>
        <li>Mandar o feedback pelo botão 💬 (nota, assuntos e texto; o diagnóstico do aparelho vai junto).</li>
        <li>Contar: ataque automático ou manual? Onde travou ou ficou confuso? A dificuldade subiu rápido demais?</li>
      </ul>
      <div class="card play" style="margin-top:14px"><b>EM BREVE NA GOOGLE PLAY</b><p class="fine" style="margin:6px 0 0">Antes da loja vem um teste fechado com testadores inscritos. Fique de olho.</p></div>
    </div>
  </div>
</div></section>
</main>

<footer>
  <div class="mini-logo">NEKO <b>G</b></div>
  <p>© 2026 RX Games · Neko G versão {E(VERSION)}</p>
  <p class="fine">Jogo em desenvolvimento. Nomes, valores e artes podem mudar.</p>
</footer>
<script>{JS}</script>
</body>
</html>
'''

open('/home/claude/site/index.html', 'w').write(PAGE)
print('ok', len(PAGE))
