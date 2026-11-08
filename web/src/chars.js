// Personagens jogáveis. Cada um tem um traço de movimento, um ataque básico próprio e skills iniciais.
// O ataque básico usa a skill 'garras' por baixo (mesma progressão), com nome, visual e números do personagem.

export const CHARS = {
  gato: {
    id: 'gato', name: 'GATO', price: 0, prefix: 'gato',
    trait: '2 pulos no ar',
    melee: { name: 'Garras Elétricas', icon: '⚡', color: '#ff4df0', slash: ['fx.slashA', 'fx.slashB'], dmg: 1, range: 1 },
    start: ['garras'],
    player: { maxAirJumps: 2 },
    hpMult: 1, magnetMult: 1,
  },
  guaxinim: {
    id: 'guaxinim', name: 'GUAXINIM', price: 120, prefix: 'guaxinim',
    trait: 'Plana · começa com Drones',
    melee: { name: 'Lâmina Hacker', icon: '⌁', color: '#4dffa6', slash: ['fx.slashB', 'fx.slashC'], dmg: 0.9, range: 1.1 },
    start: ['garras', 'drones'],
    player: { glide: true, glideFall: 75 },
    hpMult: 0.9, magnetMult: 1.3,
  },
  pug: {
    id: 'pug', name: 'PUG', price: 160, prefix: 'pug',
    trait: 'Queda pesada · +30% HP',
    melee: { name: 'Soco de Energia', icon: '✊', color: '#ff9a3c', slash: [], dmg: 1.35, range: 0.85 },
    start: ['garras'],
    player: { slam: true, maxRunSpeed: 205 },
    hpMult: 1.3, magnetMult: 1,
  },
};

export const CHAR_ORDER = ['gato', 'guaxinim', 'pug'];
