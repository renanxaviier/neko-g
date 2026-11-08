// Modo Jornada: mapas gerados a partir do número do mapa (mesmo mapa = mesma sequência, para todos).
// Cada mapa = um cenário com JOURNEY.stagesPerMap fases de objetivos variados + a fase do chefe.
// A dificuldade sobe com o número do mapa; a cada volta pelos cenários (ciclo) tudo fica mais forte.

import { JOURNEY as J } from './config.js';
import { BIOMES, SECTOR_ORDER } from './biomes.js';
import { Rng } from './rng.js';

const hash = (a, b) => (Math.imul(a ^ 0x5bd1e995, 0x27d4eb2d) ^ Math.imul(b + 1, 0x165667b1)) >>> 0;

export const STAGE_TYPES = {
  survive: { icon: '⏱', label: 'SOBREVIVA' },
  hunt: { icon: '☠', label: 'DERROTE' },
  reach: { icon: '➜', label: 'CHEGUE À SAÍDA' },
  elite: { icon: '★', label: 'CAÇADA DE ELITE' },
  collect: { icon: '⚡', label: 'COLETE G BATTY' },
  boss: { icon: '⚠', label: 'DERROTE O CHEFE' },
};

// Ordem dos cenários: o 1º mapa é sempre o Distrito; depois, a cada ciclo, os cenários aparecem
// embaralhados (sem repetir o anterior), então a sequência muda de volta para volta.
function biomeOrder(cycle) {
  const ids = SECTOR_ORDER.slice();
  const rng = new Rng(hash(0x6a09e667, cycle));
  for (let i = ids.length - 1; i > 0; i--) { const j = rng.int(0, i + 1); [ids[i], ids[j]] = [ids[j], ids[i]]; }
  if (cycle === 0) { ids.splice(ids.indexOf('distrito'), 1); ids.unshift('distrito'); }
  return ids;
}

export function journeyMap(m) {
  const L = SECTOR_ORDER.length, cycle = Math.floor(m / L);
  let order = biomeOrder(cycle);
  if (cycle > 0 && m % L === 0) {                          // não repete o último cenário do ciclo anterior
    const prev = biomeOrder(cycle - 1)[L - 1];
    if (order[0] === prev) order = [order[1], order[0], ...order.slice(2)];
  }
  const id = order[m % L];
  const bi = BIOMES.findIndex((b) => b.id === id);
  const rng = new Rng(hash(0x3c6ef372, m));
  const types = m < 1 ? ['survive', 'hunt', 'reach'] : ['survive', 'hunt', 'reach', 'elite', 'collect'];
  let mod = null;
  if (m >= J.modFrom) { const ks = Object.keys(J.mods); const k = ks[new Rng(hash(0x9b05688c, m)).int(0, ks.length)]; mod = { id: k, ...J.mods[k] }; }
  const stages = [];
  let last = '';
  for (let s = 0; s < J.stagesPerMap; s++) {
    let type;
    if (m === 0 && s === 0) type = 'survive';             // primeira fase do jogo: a mais simples
    else { const pool = types.filter((t) => t !== last); type = pool[rng.int(0, pool.length)]; }
    last = type;
    stages.push(stageGoal(type, s, m));
  }
  stages.push({ type: 'boss', goal: 1 });
  return { n: m, num: m + 1, cycle, biome: BIOMES[bi], bi, stages, mod, last: false, journey: true };
}

function stageGoal(type, s, m) {
  if (type === 'survive') return { type, goal: J.survive.base + J.survive.perStage * s };
  if (type === 'hunt') return { type, goal: Math.min(J.hunt.max, Math.round((J.hunt.base + J.hunt.perStage * s) * (1 + J.hunt.perMap * m))) };
  if (type === 'elite') return { type, goal: Math.min(J.elite.max, Math.floor(J.elite.base + J.elite.perStage * s)) };
  if (type === 'collect') return { type, goal: Math.min(J.collect.max, Math.round((J.collect.base + J.collect.perStage * s) * (1 + J.collect.perMap * m))) };
  return { type, goal: J.reach.base + J.reach.perStage * s };
}

// Estrelas (bits): 1 = venceu · 2 = sem revive · 4 = vida ≥ JOURNEY.starHp no fim
export const starCount = (bits) => (bits & 1) + ((bits >> 1) & 1) + ((bits >> 2) & 1);
export const starText = (bits) => [1, 2, 4].map((b) => (bits & b ? '★' : '☆')).join('');

// Texto curto do objetivo (faixa do setor e anúncio da fase)
export function goalText(st, progress) {
  const T = STAGE_TYPES[st.type];
  if (st.type === 'survive') { const left = Math.max(0, Math.ceil(st.goal - progress)); return `${T.icon} ${T.label} ${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; }
  if (st.type === 'hunt') return `${T.icon} ${Math.min(st.goal, Math.floor(progress))}/${st.goal}`;
  if (st.type === 'reach') return `${T.icon} SAÍDA ${Math.max(0, Math.round((st.goal - progress) / 32))} m`;
  if (st.type === 'elite') return `${T.icon} ELITE ${Math.min(st.goal, Math.floor(progress))}/${st.goal}`;
  if (st.type === 'collect') return `${T.icon} G BATTY ${Math.min(st.goal, Math.floor(progress))}/${st.goal}`;
  return `${T.icon} CHEFE`;
}

export function goalIntro(st) {
  if (st.type === 'survive') return `SOBREVIVA ${st.goal} SEGUNDOS`;
  if (st.type === 'hunt') return `DERROTE ${st.goal} INIMIGOS`;
  if (st.type === 'reach') return `CHEGUE À SAÍDA (${Math.round(st.goal / 32)} m) · siga a seta`;
  if (st.type === 'elite') return `CAÇADA: DERROTE ${st.goal} ELITES ★ · siga a seta dourada`;
  if (st.type === 'collect') return `COLETE ${st.goal} G BATTY`;
  return 'O CHEFE ESTÁ CHEGANDO';
}
