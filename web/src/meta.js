// Meta-progressão: upgrades permanentes do Esconderijo, comprados com Sucata (GDD 6.2 / 10.6).
// Valores de custo são [PROPOSTA] do economy-designer; ajuste aqui.

export const MAX_UPGRADE = 5;
export const UPGRADE_COSTS = [40, 90, 180, 320, 520];      // custo para ir ao nível 1, 2, 3, 4, 5

export const UPGRADES = [
  { key: 'hp',     name: 'Chassi Reforçado',     icon: '♥', color: '#ff5c8a', effect: (l) => `+${10 * l}% HP máximo` },
  { key: 'speed',  name: 'Propulsores',          icon: '»', color: '#ffe14d', effect: (l) => `+${4 * l}% velocidade · +${6 * l}% dash` },
  { key: 'damage', name: 'Sobrecarga de Núcleo', icon: '⚡', color: '#5ef0ff', effect: (l) => `+${8 * l}% de dano` },
  { key: 'magnet', name: 'Módulo Magnético',     icon: '⊕', color: '#7fd8ff', effect: (l) => `+${15 * l}% raio de coleta` },
  { key: 'luck',   name: 'Sorte Algorítmica',    icon: '✦', color: '#c04dff', effect: (l) => `${6 * l}% de chance de carta RARA` },
  { key: 'crit',   name: 'Ataque Crítico',       icon: '✸', color: '#ffb02e', effect: (l) => `${5 * l}% de chance de crítico · dano ×${String(critMultAt(l)).replace('.', ',')}` },
];

// Crítico: 5% de chance por nível; o dano do crítico sobe de ×1,8 (nível 1) a ×2,2 (nível 5)
export const critMultAt = (l) => (l > 0 ? Math.round((1.7 + 0.1 * l) * 10) / 10 : 1);

export const upgradeCost = (level) => (level >= MAX_UPGRADE ? null : UPGRADE_COSTS[level]);

// Multiplicadores usados na partida (calculados a partir dos níveis salvos)
export function metaStats(u) {
  return {
    hpMult: 1 + 0.10 * u.hp,
    speedMult: 1 + 0.04 * u.speed,
    dashMult: 1 + 0.06 * u.speed,
    damageMult: 1 + 0.08 * u.damage,
    magnetMult: 1 + 0.15 * u.magnet,
    rareChance: 0.06 * u.luck,
    critChance: 0.05 * (u.crit || 0),
    critMult: critMultAt(u.crit || 0),
  };
}
