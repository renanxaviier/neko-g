// Check-in de 7 dias e missões diárias: as fontes de Cyber-Moedas (GDD 6.1 / 10.6).
// Datas pelo relógio do aparelho [no app Android: validar no servidor, GDD 10.7 item 9].

import { Rng, hash } from './rng.js';
import { CHARS } from './chars.js';

export const CHECKIN_REWARDS = [10, 15, 20, 25, 30, 40, 80];   // dia 1 … dia 7 (Cyber-Moedas)

// Tipos de missão. 'sum' acumula entre partidas do dia; 'best' vale o melhor de uma partida.
const POOL = [
  { type: 'kills',  mode: 'sum',  target: 150, reward: 15, text: (t) => `Derrote ${t} inimigos` },
  { type: 'survive', mode: 'best', target: 300, reward: 20, text: (t) => `Sobreviva ${t / 60} minutos numa partida` },
  { type: 'scrap',  mode: 'sum',  target: 60,  reward: 10, text: (t) => `Colete ${t} Sucata` },
  { type: 'level',  mode: 'best', target: 10,  reward: 15, text: (t) => `Alcance o nível ${t} numa partida` },
  { type: 'crates', mode: 'sum',  target: 5,   reward: 10, text: (t) => `Quebre ${t} caixas` },
  { type: 'tanks',  mode: 'sum',  target: 3,   reward: 20, text: (t) => `Derrote ${t} tanques (Urso ou Panda)` },
  { type: 'biomes', mode: 'best', target: 2,   reward: 15, text: (t) => `Visite ${t} biomas diferentes numa partida` },
  { type: 'runs',   mode: 'sum',  target: 3,   reward: 10, text: (t) => `Jogue ${t} partidas` },
  { type: 'evo',    mode: 'sum',  target: 1,   reward: 25, text: () => 'Faça uma evolução de skill' },
  { type: 'boss',   mode: 'sum',  target: 1,   reward: 30, text: () => 'Derrote um chefão' },
  { type: 'char',   mode: 'best', target: 180, reward: 25, text: (t, c) => `Sobreviva ${t / 60} minutos usando o ${CHARS[c].name.charAt(0) + CHARS[c].name.slice(1).toLowerCase()}` },
];

export function today(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function daysBetween(a, b) {
  const pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  return Math.round((Date.UTC(pb[0], pb[1] - 1, pb[2]) - Date.UTC(pa[0], pa[1] - 1, pa[2])) / 86400000);
}

// ---------------- Check-in ----------------

export function checkinState(meta) {
  const c = meta.checkin || (meta.checkin = { last: '', streak: 0 });
  const t = today();
  if (c.last === t) return { claimedToday: true, day: c.streak, canClaim: false };
  const gap = c.last ? daysBetween(c.last, t) : 99;
  const next = gap === 1 ? (c.streak % 7) + 1 : 1;             // perdeu um dia: volta ao dia 1
  return { claimedToday: false, day: next, canClaim: true };
}

export function claimCheckin(meta) {
  const st = checkinState(meta);
  if (!st.canClaim) return 0;
  const reward = CHECKIN_REWARDS[st.day - 1];
  meta.checkin = { last: today(), streak: st.day };
  meta.cyberCoins += reward;
  return reward;
}

// ---------------- Missões diárias ----------------

export function ensureDaily(meta) {
  const t = today();
  if (meta.daily && meta.daily.date === t) return meta.daily;
  const rng = new Rng(hash(0xd417, Number(t.replace(/-/g, ''))));
  const pool = POOL.filter((p) => p.type !== 'char' || meta.chars.length > 0);
  const picked = [];
  while (picked.length < 3 && pool.length) picked.push(pool.splice(rng.int(0, pool.length), 1)[0]);
  meta.daily = {
    date: t,
    missions: picked.map((p) => {
      const m = { type: p.type, target: p.target, reward: p.reward, progress: 0, claimed: false };
      if (p.type === 'char') m.char = meta.chars[rng.int(0, meta.chars.length)];
      return m;
    }),
  };
  return meta.daily;
}

export function missionText(m) {
  const p = POOL.find((x) => x.type === m.type);
  return p ? p.text(m.target, m.char) : m.type;
}

const done = (m) => m.progress >= m.target;

// Aplica o resultado de uma partida. Retorna as missões que acabaram de ser concluídas.
export function applyRun(meta, run) {
  const daily = ensureDaily(meta);
  const value = {
    kills: run.kills, survive: run.time, scrap: run.scrap, level: run.level, crates: run.crates,
    tanks: run.tanks, biomes: run.biomes, runs: 1, evo: run.evos, boss: run.bosses || 0,
  };
  const completed = [];
  for (const m of daily.missions) {
    if (done(m)) continue;
    const p = POOL.find((x) => x.type === m.type);
    let v = value[m.type] || 0;
    if (m.type === 'char') v = run.char === m.char ? run.time : 0;
    m.progress = p.mode === 'sum' ? m.progress + v : Math.max(m.progress, v);
    if (done(m)) completed.push(m);
  }
  return completed;
}

export function claimMission(meta, i) {
  const m = ensureDaily(meta).missions[i];
  if (!m || m.claimed || !done(m)) return 0;
  m.claimed = true;
  meta.cyberCoins += m.reward;
  return m.reward;
}

export function hasClaimable(meta) {
  return checkinState(meta).canClaim || ensureDaily(meta).missions.some((m) => done(m) && !m.claimed);
}
