// Jornada etapa 2 (GDD 3.5c) [PROPOSTA]: nível permanente de cada personagem e árvore de talentos.
// O personagem ganha XP ao fim de toda partida (abates, tempo, fases e mapas vencidos). Cada nível = 1 ponto de talento.
// Os pontos são de cada personagem; a árvore é a mesma para todos (3 ramos). Valores de balanceamento ficam aqui.

export const CHAR_LEVEL = {
  max: 30,
  base: 220, per: 110,                 // XP para passar do nível L: base + per × (L − 1)
  xpKill: 1, xpPerSec: 0.5, xpStage: 25, xpWin: 150,
};

export const BRANCHES = [
  { id: 'atk', name: 'ATAQUE', color: '#ff4df0' },
  { id: 'def', name: 'DEFESA', color: '#5ef0ff' },
  { id: 'mob', name: 'MOBILIDADE', color: '#ffd84d' },
];

// req = pontos já gastos no mesmo ramo para liberar o talento
export const TALENTS = [
  { id: 'forca',      b: 'atk', icon: '⚔', name: 'Força',        max: 5, v: 0.03, desc: (r) => `+${3 * r}% de dano` },
  { id: 'precisao',   b: 'atk', icon: '✸', name: 'Precisão',     max: 3, v: 0.02, desc: (r) => `+${2 * r}% de chance de crítico` },
  { id: 'ritmo',      b: 'atk', icon: '⏩', name: 'Ritmo',        max: 3, v: 0.03, desc: (r) => `−${3 * r}% na recarga das skills` },
  { id: 'carrasco',   b: 'atk', icon: '☠', name: 'Carrasco',     max: 1, v: 0.25, req: 6, desc: () => '+25% de dano em elites e chefes' },
  { id: 'couraca',    b: 'def', icon: '♥', name: 'Couraça',      max: 5, v: 0.04, desc: (r) => `+${4 * r}% de HP máximo` },
  { id: 'resist',     b: 'def', icon: '⛨', name: 'Resistência',  max: 3, v: 0.03, desc: (r) => `−${3 * r}% de dano recebido` },
  { id: 'regen',      b: 'def', icon: '✚', name: 'Nanorreparo',  max: 3, v: 0.01, desc: (r) => `cura ${r}% do HP a cada 8 s` },
  { id: 'escudo',     b: 'def', icon: '◈', name: 'Escudo de Fase', max: 1, req: 6, desc: () => 'começa cada fase/setor com um escudo que bloqueia 1 golpe' },
  { id: 'veloz',      b: 'mob', icon: '»', name: 'Passos Leves', max: 5, v: 0.02, desc: (r) => `+${2 * r}% de velocidade` },
  { id: 'ima',        b: 'mob', icon: '⊕', name: 'Coletor',      max: 3, v: 0.08, desc: (r) => `+${8 * r}% de raio de coleta` },
  { id: 'folego',     b: 'mob', icon: '⇉', name: 'Fôlego',       max: 3, v: 0.05, desc: (r) => `−${5 * r}% na recarga do dash` },
  { id: 'sorte',      b: 'mob', icon: '🎲', name: 'Sorte Grande', max: 1, req: 6, desc: () => '+1 rerrolagem de cartas por partida' },
];
export const TALENT = Object.fromEntries(TALENTS.map((t) => [t.id, t]));

export const xpToNext = (lvl) => CHAR_LEVEL.base + CHAR_LEVEL.per * (lvl - 1);

// XP total → { lvl, into (XP dentro do nível), need (XP do nível) }
export function charLevel(xp) {
  let lvl = 1, rest = Math.max(0, Math.floor(xp || 0));
  while (lvl < CHAR_LEVEL.max && rest >= xpToNext(lvl)) { rest -= xpToNext(lvl); lvl++; }
  return { lvl, into: rest, need: lvl >= CHAR_LEVEL.max ? 0 : xpToNext(lvl) };
}

export const talentsOf = (meta, id) => ((meta.tal || {})[id]) || {};
export const spentIn = (tal, b) => TALENTS.reduce((n, t) => n + (t.b === b || !b ? (tal[t.id] || 0) : 0), 0);
export function pointsLeft(meta, id) {
  return charLevel((meta.cxp || {})[id]).lvl - 1 - spentIn(talentsOf(meta, id));
}

export function canLearn(meta, id, tid) {
  const t = TALENT[tid], tal = talentsOf(meta, id);
  if (!t || (tal[tid] || 0) >= t.max || pointsLeft(meta, id) <= 0) return false;
  return !t.req || spentIn(tal, t.b) >= t.req;
}

// Multiplicadores da partida a partir dos talentos do personagem
export function talentStats(meta, id) {
  const r = (k) => talentsOf(meta, id)[k] || 0;
  return {
    damage: 1 + TALENT.forca.v * r('forca'),
    crit: TALENT.precisao.v * r('precisao'),
    cd: 1 - TALENT.ritmo.v * r('ritmo'),
    bossDmg: r('carrasco') ? 1 + TALENT.carrasco.v : 1,
    hp: 1 + TALENT.couraca.v * r('couraca'),
    taken: 1 - TALENT.resist.v * r('resist'),
    regen: TALENT.regen.v * r('regen'),
    shield: r('escudo'),
    speed: 1 + TALENT.veloz.v * r('veloz'),
    magnet: 1 + TALENT.ima.v * r('ima'),
    dash: 1 - TALENT.folego.v * r('folego'),
    rerolls: r('sorte'),
  };
}

// XP do personagem ao fim da partida
export function runCharXp(run) {
  const C = CHAR_LEVEL;
  return Math.round(run.kills * C.xpKill + run.time * C.xpPerSec + (run.stages || 0) * C.xpStage + (run.victory ? C.xpWin : 0));
}
