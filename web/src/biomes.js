// Biomas: o mundo muda de cara conforme o jogador se afasta do início (para os dois lados).
// Cada bioma tem paleta, plataformas, peças de cenário, céu/fundo próprios e favorece alguns inimigos.

export const BIOME_SIZE = 6;        // chunks por região (~4600 px, ~20 s correndo)

export const BIOMES = [
  {
    id: 'distrito', name: 'DISTRITO NEON', color: '#ff4df0',
    sky: ['#070514', '#1c0c3a', '#3d1150'], stars: true,
    far: '#191338', mid: '#221a4d', windows: ['rgba(94,240,255,0.55)', 'rgba(255,201,77,0.45)'],
    signColors: ['#ff4df0', '#5ef0ff', '#ffe14d', '#4dffa6'], words: ['NEON', 'BYTE', '24H', 'HACK', 'RAMEN', 'CYBER', 'VOLT'],
    solid: ['#140f26', '#1b1438', '#2a1f55'], edge: '#36e7ff', side: '#7a3cff', oneway: '#ff4df0',
    platform: 'plat.grate', props: [], skyline: 'city',
    favor: { rato: 1.4, drone: 1.4, morcego: 1.2, aranha: 1.2 },
  },
  {
    id: 'coast', name: 'CYBER-COAST', color: '#4dffd2',
    sky: ['#04101c', '#0c3346', '#2a7a78'], stars: true,
    far: '#0f2a3a', mid: '#133a48', windows: ['rgba(77,255,210,0.5)', 'rgba(255,77,240,0.45)'],
    signColors: ['#4dffd2', '#ff4df0', '#5ef0ff'], words: ['SURF', 'COAST', 'BAR', 'SOL', 'WAVE'],
    solid: ['#0c1d24', '#11303a', '#1d4a52'], edge: '#4dffd2', side: '#ff4df0', oneway: '#5ef0ff',
    platform: 'plat.grate', props: [['prop.palm_b', 2.2, 0.9], ['prop.palm_p', 2, 0.9], ['prop.bench', 1.5], ['prop.bench2', 1.2], ['prop.trash', 1.5], ['prop.sign_h', 1, 0.9, 64], ['prop.sign_v', 1, 0.9, 50], ['prop.sign_v2', 1, 0.9, 44]], skyline: 'coast',
    favor: { drone: 1.8, vespa: 2, dronev: 2, morcego: 1.6 },
  },
  {
    id: 'favelas', name: 'FAVELAS DE DADOS', color: '#ffb03c',
    sky: ['#110707', '#3a1910', '#7a3414'], stars: false,
    far: '#2a1410', mid: '#3a1e14', windows: ['rgba(255,176,60,0.55)', 'rgba(255,90,26,0.45)'],
    signColors: ['#ffb03c', '#ff5a1a', '#ff4df0', '#4dffa6'], words: ['DADOS', 'LAN', 'GATO NET', 'REPARO', 'BIT'],
    solid: ['#1c120e', '#291a12', '#3a2416'], edge: '#ffb03c', side: '#ff5a1a', oneway: '#ffc94d',
    platform: 'plat.rust', props: [['prop.scaffold', 1, 0.55], ['prop.server1', 1], ['prop.pipe1', 0.7], ['prop.container_o', 0.6], ['prop.fsign1', 1.2, 0.9, 58], ['prop.fsign2', 1.2, 0.9, 72], ['prop.dish', 1]], skyline: 'shacks',
    favor: { rato: 2, esquilo: 2, hound: 1.5, lobo: 1.5, aranha: 2.2 },
  },
  {
    id: 'porto', name: 'PORTO AUTOMATIZADO', color: '#5ec8ff',
    sky: ['#04080f', '#0b1c33', '#1d3d5c'], stars: true,
    far: '#0f1a2e', mid: '#16263e', windows: ['rgba(94,200,255,0.5)', 'rgba(77,255,166,0.4)'],
    signColors: ['#5ec8ff', '#4dffa6', '#ffe14d'], words: ['DOCA 7', 'CARGA', 'PORTO', 'BOT'],
    solid: ['#0d131e', '#152031', '#20304a'], edge: '#5ec8ff', side: '#2a8aff', oneway: '#5ef0ff',
    platform: 'plat.pipes', props: [['prop.containers', 1.2], ['prop.container_o', 1.5], ['prop.gate', 0.8], ['prop.conveyor', 1.2], ['prop.pipes', 0.8], ['prop.control', 1], ['prop.signal', 1], ['prop.panel', 1], ['prop.tlight_r', 0.6], ['prop.tlight_y', 0.6], ['prop.claw', 0.5], ['prop.catwalk', 0.7, 0.5]], skyline: 'port',
    favor: { dronev: 2, panda: 2, urso: 1.5, hound: 1.5 },
  },
  // ---------- Setores novos (folha cenarios_biomas2.jpg) ----------
  {
    id: 'subway', name: 'DATA SUBWAY', sub: 'Centro de Dados Subterrâneo', color: '#36d8ff',
    sky: ['#020409', '#06101c', '#0b1a2a'], stars: false,
    far: '#0a1420', mid: '#0f1d2e', windows: ['rgba(54,216,255,0.6)', 'rgba(77,255,140,0.5)'],
    signColors: ['#36d8ff', '#4dff8c', '#ff4d6a'], words: ['DATA', 'LINHA 0', 'SERVER', '404', 'NODE'],
    solid: ['#0b1018', '#111a26', '#1a2638'], edge: '#36d8ff', side: '#4dff8c', oneway: '#36d8ff',
    platform: 'plat.pipes', props: [['prop.servers1', 1.4], ['prop.servers2', 1.4], ['prop.pipes', 0.6], ['prop.panel', 0.8], ['prop.control', 0.8]], skyline: 'tunnel',
    favor: { rato: 2, aranha: 2.2, morcego: 1.8, drone: 1.2 },
  },
  {
    id: 'genelab', name: 'GENELAB', sub: 'Laboratório de Clonagem Genética', color: '#4dff8c',
    sky: ['#03080a', '#0b1c1a', '#16302a'], stars: false,
    far: '#0d1c1c', mid: '#132826', windows: ['rgba(77,255,140,0.55)', 'rgba(255,77,240,0.45)'],
    signColors: ['#4dff8c', '#ff4df0', '#36d8ff'], words: ['DNA', 'CLONE', 'BIO', 'LAB 2', 'GEN'],
    solid: ['#10161a', '#18222a', '#24323c'], edge: '#4dff8c', side: '#ff4df0', oneway: '#4dff8c',
    platform: 'plat.grate', props: [['prop.tube_p', 1], ['prop.tube_g', 1], ['prop.tube_c', 1], ['prop.tube_g2', 0.8], ['prop.tube_m', 0.8], ['prop.tube_b', 0.8], ['prop.labdesk', 1], ['prop.labpc', 0.9], ['prop.robotarm', 1], ['prop.robotarm2', 1], ['prop.terminal', 0.8]], skyline: 'city',
    favor: { sapo: 2, vespa: 1.6, aranha: 1.5, dronev: 1.4 },
  },
  {
    id: 'mall', name: 'NEON MALL', sub: 'Shopping de Hologramas', color: '#ff6ad5',
    sky: ['#0c0516', '#24103a', '#4a1a5c'], stars: false,
    far: '#21123a', mid: '#2c1850', windows: ['rgba(255,106,213,0.6)', 'rgba(106,220,255,0.55)', 'rgba(255,216,77,0.5)'],
    signColors: ['#ff6ad5', '#6adcff', '#ffd84d', '#b98cff'], words: ['SALE', 'MALL', '50%', 'HOLO', 'SHOP', 'FOOD'],
    solid: ['#1a1030', '#251642', '#352058'], edge: '#ff6ad5', side: '#6adcff', oneway: '#ffd84d',
    platform: 'plat.grate', props: [['prop.shopwin', 1.2], ['prop.shopdoor', 1.2], ['prop.arcade1', 1], ['prop.arcade2', 1], ['prop.holo', 1], ['prop.poster_p', 0.7, 0.9, 40], ['prop.poster_m', 0.7, 0.9, 44], ['prop.poster_y', 0.6, 0.9, 30], ['prop.sign_g', 0.7, 0.9, 70], ['prop.sign_trd', 0.7, 0.9, 64], ['prop.sign_vm', 0.6, 0.9, 40]], skyline: 'city',
    favor: { drone: 1.6, esquilo: 1.6, macaco: 1.5, dronev: 1.4 },
  },
  {
    id: 'casino', name: 'CYBER CASINO', sub: 'Distrito dos Cassinos', color: '#ffd84d',
    sky: ['#0c0406', '#2a0a12', '#55141e'], stars: true,
    far: '#2a0c14', mid: '#3a121c', windows: ['rgba(255,216,77,0.65)', 'rgba(255,59,92,0.5)'],
    signColors: ['#ffd84d', '#ff3b5c', '#4dffd2'], words: ['777', 'JACKPOT', 'BET', 'WIN', 'CASSINO'],
    solid: ['#1a0a0e', '#2a1016', '#3c1820'], edge: '#ffd84d', side: '#ff3b5c', oneway: '#ffd84d',
    platform: 'plat.rust', props: [['prop.casino1', 0.8], ['prop.casino2', 0.8], ['prop.roulette', 1], ['prop.cards', 1], ['prop.slot1', 1.2], ['prop.slot2', 1.2]], skyline: 'city',
    favor: { lobo: 1.6, gorila: 1.5, touro: 1.5, hound: 1.4 },
  },
  {
    id: 'cage', name: 'THE CAGE', sub: 'Arena de Combate Clandestina', color: '#ff4d6a',
    sky: ['#050506', '#14121a', '#2a222c'], stars: false,
    far: '#18161e', mid: '#211e28', windows: ['rgba(255,77,106,0.55)', 'rgba(106,220,255,0.45)'],
    signColors: ['#ff4d6a', '#6adcff', '#ffd84d'], words: ['FIGHT', 'KO', 'ARENA', 'PERIGO', 'VS'],
    solid: ['#141218', '#1e1a22', '#2c2630'], edge: '#ff4d6a', side: '#6adcff', oneway: '#ffb03c',
    platform: 'plat.rust', props: [['prop.efence', 1.4], ['prop.tires', 1.2], ['prop.tire', 1], ['prop.stands', 0.5, 0.6]], skyline: 'shacks',
    favor: { hound: 1.8, lobo: 1.8, urso: 1.6, touro: 1.6, gorila: 1.4 },
  },
  {
    id: 'jungle', name: 'GLOW JUNGLE', sub: 'Jardins Biocibernéticos', color: '#c46cff',
    sky: ['#04030c', '#100a26', '#1e1440'], stars: true,
    far: '#120c26', mid: '#1a1236', windows: ['rgba(255,77,240,0.55)', 'rgba(54,216,255,0.55)'],
    signColors: ['#c46cff', '#36d8ff', '#ff4df0'], words: ['BIO', 'ROOT', 'SEIVA', 'VIDA'],
    solid: ['#100c18', '#181226', '#241a36'], edge: '#c46cff', side: '#36d8ff', oneway: '#ff4df0',
    platform: 'plat.rust', props: [['prop.gtree', 0.8, 0.95], ['prop.plant_c', 1.4], ['prop.fall', 0.6]], skyline: 'trees',
    favor: { sapo: 2, camaleao: 2, macaco: 1.8, vespa: 1.6, crocodilo: 1.4 },
  },
  // ---------- Setor submerso (folha cenario_deep.jpg) ----------
  {
    id: 'deep', name: 'CYBER DEEP', sub: 'Abismo Cibernético', color: '#36e7ff', medium: 'water', music: 'deep',
    sky: ['#010612', '#032038', '#0a3a58'], stars: false,
    far: '#05203a', mid: '#082a46', windows: ['rgba(94,240,255,0.5)', 'rgba(255,77,240,0.45)'],
    signColors: ['#36e7ff', '#ff4df0', '#4dff8c'], words: ['DEEP', 'SONAR', 'SUB-7', 'ABISMO', 'O²'],
    solid: ['#0c1030', '#141a44', '#1e2658'], edge: '#36e7ff', side: '#ff4df0', oneway: '#ff4df0',
    platform: 'plat.pipes', propsExtra: 2,
    props: [['prop.reef1', 1.2], ['prop.reef2', 1.2], ['prop.kelp_c', 1.3], ['prop.bubbles_c', 0.8], ['prop.sub', 0.45], ['prop.deepgate', 0.35],
      ['prop.pipe_w', 0.45], ['prop.rocks_crab', 0.5], ['prop.rocks_box', 0.4], ['prop.leak_v', 0.35], ['prop.pipe_u', 0.5], ['prop.ladder', 0.4],
      ['prop.crates', 0.7], ['prop.crate', 0.7], ['prop.mine', 0.6], ['prop.mine2', 0.4], ['prop.bars', 0.45], ['prop.barrier', 0.45],
      ['deco.anem0', 1, 1], ['deco.anem1', 1, 1], ['deco.anem2', 1, 1], ['deco.anem3', 1, 1],
      ['deco.sign', 0.35, 1, 84], ['deco.curto', 0.5, 1, 70], ['deco.vaz', 0.5, 1, 56]],
    skyline: 'reef',
    favor: { peixe: 2, lula: 1.8, medusa: 1.6, tubarao: 1.4 },
  },
  // ---------- Setores feitos por código (sem folha ainda) ----------
  {
    id: 'fabrica', name: 'FÁBRICA DE ROBÔS', sub: 'Linha de montagem', color: '#ff9a3c',
    sky: ['#080402', '#1e0e06', '#3c1a08'], stars: false,
    far: '#1e100a', mid: '#2a160c', windows: ['rgba(255,154,60,0.6)', 'rgba(255,216,77,0.45)'],
    signColors: ['#ff9a3c', '#ffd84d', '#36d8ff'], words: ['PERIGO', 'MONTAGEM', 'BOT', 'LINHA 3', 'AÇO'],
    solid: ['#16100c', '#221812', '#32241a'], edge: '#ff9a3c', side: '#ffd84d', oneway: '#ff9a3c',
    platform: 'plat.pipes', props: [['prop.conveyor', 1.4], ['prop.pipes', 0.8], ['prop.robotarm', 1.2], ['prop.robotarm2', 1.2], ['prop.control', 1], ['prop.panel', 1], ['prop.containers', 0.6], ['prop.claw', 0.6]], skyline: 'port',
    favor: { dronev: 2, drone: 1.6, panda: 1.6, caranguejo: 1.5 },
  },
  {
    id: 'torre', name: 'TORRE CORPORATIVA', sub: 'O topo da cidade', color: '#ffffff',
    sky: ['#02030a', '#0a1030', '#24306a'], stars: true,
    far: '#0e1430', mid: '#151c40', windows: ['rgba(200,220,255,0.6)', 'rgba(94,240,255,0.5)'],
    signColors: ['#ffffff', '#5ef0ff', '#ff4df0'], words: ['CORP', 'CEO', 'ÔMEGA', 'TOP', '100º'],
    solid: ['#0c1022', '#141a34', '#1e2648'], edge: '#cfe0ff', side: '#5ef0ff', oneway: '#ffffff',
    platform: 'plat.grate', props: [['prop.terminal', 1], ['prop.labdesk', 1], ['prop.labpc', 1], ['prop.holo', 1.2], ['prop.servers1', 0.6], ['prop.sign_vm', 0.5, 0.9, 40]], skyline: 'tower',
    favor: { dronev: 2, panda: 1.8, urso: 1.6, gorila: 1.6, vespa: 1.4 },
  },
];

// Cada cenário pode ter medium: 'water' (setor submerso, docs/subaquatico.md). Sem o campo = 'air'.
// props: [nome, peso, opacidade, altura (pendurado)]. 'deco.*' são animados: não vão para o pedaço pronto,
// o ambient.js desenha a cada quadro (anêmonas balançando, letreiro com glitch, curto-circuito, vazamento).

// ---------- Elenco de inimigos de cada cenário (v0.8) ----------
// [tipo, peso, a partir de (fração do setor até o chefão; 0 = desde o início)]
// Dentro do setor: começa só com fracos; médios e tanques entram aos poucos (ver Spawner em enemies.js).
export const SECTOR_ROSTER = {
  distrito: { weak: [['rato', 3], ['drone', 2], ['morcego', 1.2, 0.3]], medium: [['hound', 1]], tank: [['urso', 1]] },
  coast:    { weak: [['rato', 1.6], ['medusa', 1.6], ['ornitorrinco', 1.3, 0.2]], medium: [['caranguejo', 1.6], ['hound', 0.6]], tank: [['crocodilo', 1]] },
  favelas:  { weak: [['rato', 2], ['esquilo', 1.1], ['macaco', 1.1], ['ratoasa', 0.8, 0.35]], medium: [['bode', 1.3], ['hound', 1.1]], tank: [['urso', 1]] },
  porto:    { weak: [['ornitorrinco', 1.4], ['drone', 1.4], ['morcego', 1]], medium: [['caranguejo', 1.4], ['leaomarinho', 1.2], ['dronev', 0.8]], tank: [['panda', 1], ['crocodilo', 0.8]] },
  deep:     { weak: [['peixe', 2.4], ['medusa', 1.3], ['ourico', 0.6]], medium: [['lula', 1.6], ['caranguejo', 1], ['tubarao', 1], ['leaomarinho', 0.6]], tank: [['crocodilo', 1], ['querubim', 0.35]] },
  fabrica:  { weak: [['drone', 2], ['aranha', 1.3], ['ratoasa', 0.8]], medium: [['texugo', 1.5], ['dronev', 1.2], ['leaomarinho', 0.8]], tank: [['rinoceronte', 1], ['panda', 0.8]] },
  subway:   { weak: [['rato', 2.2], ['aranha', 1.5], ['ratoasa', 1.3], ['morcego', 1]], medium: [['texugo', 1.4], ['hound', 1]], tank: [['crocodilo', 1]] },
  genelab:  { weak: [['sapo', 1.6], ['medusa', 1.3], ['aranha', 1.1]], medium: [['camaleao', 1.5], ['vespa', 1.1]], tank: [['gorila', 0.9], ['urso', 0.6]] },
  mall:     { weak: [['drone', 1.6], ['macaco', 1.5], ['esquilo', 1.2]], medium: [['canguru', 1.3], ['coruja', 1.2], ['lobo', 0.8]], tank: [['panda', 1]] },
  casino:   { weak: [['ratoasa', 1.2], ['drone', 1.2], ['macaco', 1.1], ['morcego', 1]], medium: [['canguru', 1.2], ['lobo', 1.2], ['coruja', 1], ['vespa', 0.8]], tank: [['gorila', 1.2], ['touro', 1]] },
  cage:     { weak: [['rato', 1.3], ['esquilo', 1.1], ['ourico', 1]], medium: [['canguru', 1.6], ['bode', 1.2], ['hound', 1.2]], tank: [['touro', 1.2], ['rinoceronte', 1], ['gorila', 1]] },
  jungle:   { weak: [['vagalume', 1.6], ['sapo', 1.4], ['ourico', 1.3]], medium: [['camaleao', 1.2], ['alce', 1.3], ['vespa', 1]], tank: [['crocodilo', 1.2], ['gorila', 0.6]] },
  torre:    { weak: [['drone', 1.3], ['vagalume', 1.1], ['aranha', 1]], medium: [['coruja', 1.4], ['dronev', 1.3], ['lobo', 1], ['leaomarinho', 1]], tank: [['panda', 1.2], ['rinoceronte', 1], ['urso', 0.8]] },
};

// ---------- Setores (progressão por portal) ----------
// Ordem da campanha; depois do último, recomeça no primeiro em um CICLO mais difícil.
export const SECTOR_ORDER = ['distrito', 'coast', 'favelas', 'porto', 'deep', 'fabrica', 'subway', 'genelab', 'mall', 'casino', 'cage', 'jungle', 'torre'];
const SECTOR_IDX = SECTOR_ORDER.map((id) => BIOMES.findIndex((b) => b.id === id));

export function sectorInfo(n) {
  const len = SECTOR_ORDER.length;
  const cycle = Math.floor(n / len);
  const bi = SECTOR_IDX[n % len];
  return { n, num: n + 1, cycle, biome: BIOMES[bi], bi, last: n % len === len - 1 };
}

// Enquanto há uma partida, o setor atual decide o bioma de todo o mundo (-1 = regra antiga, por distância)
let sectorBiome = -1;
export function setSectorBiome(bi) { sectorBiome = bi; }

// Região 0 (perto do início) é sempre o Distrito Neon; depois os biomas se alternam,
// em ordens diferentes para a direita e para a esquerda.
export function biomeIndexAt(ci) {
  if (sectorBiome >= 0) return sectorBiome;
  const region = Math.floor((Math.abs(ci) + 3) / BIOME_SIZE);
  if (region === 0) return 0;
  return ci >= 0 ? region % 4 : (region * 3) % 4;     // tela inicial: só os 4 primeiros
}

export const biomeAt = (ci) => BIOMES[biomeIndexAt(ci)];
