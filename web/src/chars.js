// Personagens jogáveis. Cada um tem um traço de movimento, um ataque básico próprio e skills iniciais.
// O ataque básico usa a skill 'garras' por baixo (mesma progressão), com nome, visual e números do personagem.

export const CHARS = {
  gato: {
    id: 'gato', name: 'GATO', price: 0, prefix: 'gato',
    trait: '2 pulos no ar', color: '#ff4df0',
    melee: { name: 'Garras Elétricas', icon: '⚡', color: '#ff4df0', slash: ['fx.slashA', 'fx.slashB'], dmg: 1, range: 1 },
    start: ['garras'], weapon: 'garrasE',
    player: { maxAirJumps: 2 },
    hpMult: 1, magnetMult: 1,
  },
  guaxinim: {
    id: 'guaxinim', name: 'GUAXINIM', price: 120, prefix: 'guaxinim',
    trait: 'Plana · começa com Drones', color: '#4dffa6',
    melee: { name: 'Lâmina Hacker', icon: '⌁', color: '#4dffa6', slash: ['fx.slashB', 'fx.slashC'], dmg: 0.9, range: 1.1 },
    start: ['garras', 'drones'], weapon: 'corteDados',
    player: { glide: true, glideFall: 75 },
    hpMult: 0.9, magnetMult: 1.3,
  },
  pug: {
    id: 'pug', name: 'PUG', price: 160, prefix: 'pug',
    trait: 'Queda pesada · +30% HP', color: '#ff9a3c',
    melee: { name: 'Soco de Energia', icon: '✊', color: '#ff9a3c', slash: [], dmg: 1.35, range: 0.85 },
    start: ['garras'], weapon: 'martelo',
    player: { slam: true, maxRunSpeed: 205 },
    hpMult: 1.3, magnetMult: 1,
  },

  // v0.16: personagens novos [PROPOSTA] (traços e números para o game-designer revisar)
  coelho: {
    id: 'coelho', name: 'COELHO', price: 200, prefix: 'coelho', color: '#ff5ad8',
    trait: '3 pulos no ar · pulo mais alto',
    melee: { name: 'Chute Meia-Lua', icon: '☾', color: '#ff5ad8', slash: ['fx.slashA', 'fx.slashC'], dmg: 0.95, range: 1.1 },
    start: ['garras'], weapon: 'luaE',
    player: { maxAirJumps: 3, jumpHeight: 124, maxRunSpeed: 235 },
    hpMult: 0.85, magnetMult: 1,
  },
  macaco: {
    id: 'macaco', name: 'MACACO', price: 220, prefix: 'macaco', color: '#4dff7a',
    trait: 'Arremessa dados · começa com Shurikens',
    melee: { name: 'Soco Hacker', icon: '⌨', color: '#4dff7a', slash: ['fx.slashB'], dmg: 0.8, range: 0.85 },
    start: ['garras', 'shuriken'], weapon: 'plasma',
    player: { maxRunSpeed: 235 },
    hpMult: 0.9, magnetMult: 1.15,
  },
  tatu: {
    id: 'tatu', name: 'TATU', price: 260, prefix: 'tatu', color: '#ffd84d',
    trait: 'Tanque · dash em bola atropela · +40% HP',
    melee: { name: 'Garra Blindada', icon: '⛏', color: '#ffd84d', slash: ['fx.slashA'], dmg: 1.2, range: 0.9 },
    start: ['garras'], weapon: 'choque',
    player: { maxRunSpeed: 195, ballDash: true },
    hpMult: 1.4, magnetMult: 1,
  },
};

export const CHAR_ORDER = ['gato', 'guaxinim', 'pug', 'coelho', 'macaco', 'tatu'];

// Personagens já desenhados, ainda sem jogabilidade: aparecem na tela "Escolher personagem" como "Em breve".
// Traços abaixo são [PROPOSTA] até o game-designer fechar cada um.
export const CHARS_SOON = {
  corvo:  { id: 'corvo',  name: 'CORVO',  soon: true, color: '#5ef0ff', trait: 'Voo curto', teaser: 'Bate asas no ar e ataca de cima. (Faltam as folhas de jogo.)' },
};

// Ordem da tela de escolha (jogáveis primeiro)
export const ROSTER = [...CHAR_ORDER, 'corvo'];
export const charInfo = (id) => CHARS[id] || CHARS_SOON[id];
