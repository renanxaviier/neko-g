// Chefões (GDD 3.2 / bestiário): surgem em marcos de tempo, têm fases e ataques telegrafados.
// Usam o mesmo pool de inimigos (as skills acertam neles normalmente); a IA de cada um fica aqui.

import { TILE, VIEW_W, WATER } from './config.js';

export const BOSS_ORDER = ['polvo', 'quimera', 'dragao', 'trex'];
// Variações aquáticas (setor submerso): um dos dois é sorteado por partida (?wboss=mecha|serpente para testar)
export const WATER_BOSSES = ['mecha', 'serpente'];
export const BOSS_FIRST = 180;          // primeiro chefe aos 3:00
export const BOSS_EVERY = 180;          // depois, a cada 3 minutos

const B = { tier: 'boss', ai: 'boss', xp: 0, scrap: 0, kbResist: 1, boss: true };
export const BOSS_TYPES = {
  polvo:   { ...B, name: 'POLVO DE NEON',       w: 88,  h: 60,  hp: 900,  speed: 95,  dmg: 12, color: '#6b5a8f', glow: '#ff4df0', flying: true },
  quimera: { ...B, name: 'QUIMERA CIBERNÉTICA', w: 92,  h: 62,  hp: 2600, speed: 105, dmg: 16, color: '#c8962c', glow: '#ffc94d', jump: 520 },
  dragao:  { ...B, name: 'O GRANDE GLITCH',     w: 100, h: 78,  hp: 3200, speed: 120, dmg: 14, color: '#2a8a9a', glow: '#5ef0ff', flying: true },
  trex:    { ...B, name: 'T-REX CIBERNÉTICO',   w: 78,  h: 100, hp: 5500, speed: 70,  dmg: 20, color: '#5a5a70', glow: '#ff5a1a', jump: 500 },
  mecha:   { ...B, name: 'MECHA-POVOADOR',      w: 62,  h: 74,  hp: 2000, speed: 62,  dmg: 17, color: '#5a5060', glow: '#ff9a3c', jump: 470 },
  serpente:{ ...B, name: 'O GRANDE GLITCH',     w: 118, h: 40,  hp: 1800, speed: 125, dmg: 14, color: '#2a8a9a', glow: '#5ef0ff', flying: true },
};

const GRAVITY = 1350;

function approach(o, key, target, step) {
  const d = target - o[key];
  o[key] = Math.abs(d) <= step ? target : o[key] + Math.sign(d) * step;
}

function flyTo(e, tx, ty, speed, acc, dt) {
  const dx = tx - e.cx, dy = ty - e.cy, n = Math.hypot(dx, dy) || 1;
  const sp = Math.min(speed * Math.min(3.5, 1 + n / 160), n * 4);      // longe do alvo: acelera para não ficar para trás
  const a = acc * (n > 200 ? 2.2 : 1);
  approach(e, 'vx', (dx / n) * sp, a * dt);
  approach(e, 'vy', (dy / n) * sp, a * dt);
}

function tele(E, e, next, time) {
  e.state = 'tele'; e.st = time; e.flash = time; e.next = next;
  E.game.fx.sfx('select');
}

// Leque de tiros mirando no jogador
function fan(E, e, p, n, spread, speed, kind, color, opt = {}) {
  const base = Math.atan2(p.cy - e.cy, p.cx - e.cx);
  for (let i = 0; i < n; i++) {
    const a = base + (n === 1 ? 0 : (i / (n - 1) - 0.5) * spread);
    E.shoot(e.cx + Math.cos(a) * 20, e.cy + Math.sin(a) * 20, Math.cos(a) * speed, Math.sin(a) * speed, kind, e.def.dmg * 0.75, { color, ...opt });
  }
}

// Golpe corpo a corpo: área retangular à frente do chefão (dir = lado), com efeito de garra
function melee(E, e, p, dir, reach, height, dmg, slashColor) {
  const g = E.game;
  const x0 = dir > 0 ? e.cx : e.cx - reach, x1 = dir > 0 ? e.cx + reach : e.cx;
  const y0 = e.y + e.h * 0.5 - height / 2, y1 = y0 + height;
  g.fx.slash(e.cx + dir * reach * 0.45, e.y + e.h * 0.45, dir, reach * 0.9, slashColor, 0, false, 'fx.slashA');
  if (!p.isDead && p.x + p.w > x0 && p.x < x1 && p.y + p.h > y0 && p.y < y1) g.damagePlayer(dmg * g.enemyDamageMult, e.cx);
}

// Anel de projéteis em todas as direções
function ring(E, e, n, speed, kind, color, dmg, off = 0, opt = {}) {
  for (let i = 0; i < n; i++) {
    const a = off + (i / n) * Math.PI * 2;
    E.shoot(e.cx + Math.cos(a) * 24, e.cy + Math.sin(a) * 24, Math.cos(a) * speed, Math.sin(a) * speed, kind, dmg, { color, ...opt });
  }
}

// Chuva: projéteis caem do alto da tela em volta do jogador (aviso no chão antes)
function rain(E, e, p, n, spread, kind, color, dmg) {
  const g = E.game, top = g.camera.view.top;
  for (let i = 0; i < n; i++) {
    const x = p.cx + (i / Math.max(1, n - 1) - 0.5) * spread + (Math.random() - 0.5) * 24;
    E.shoot(x, top - 20 - Math.random() * 80, 0, 60, kind, dmg, { color, grav: 600, life: 3.5 });
  }
}

export function bossPhase(e) {
  const r = e.hp / e.maxHp;
  return r > 0.66 ? 1 : r > 0.33 ? 2 : 3;
}

export function bossAI(E, e, dt, p) {
  const g = E.game, d = e.def;
  const dx = p.cx - e.cx, dir = dx >= 0 ? 1 : -1;
  const ph = bossPhase(e);
  if (e.landT > 0) e.landT -= dt;
  if (!d.flying) {                                 // pouso pesado depois de qualquer salto: achata e treme a tela
    if (e.onGround && (e.airT || 0) > 0.25) { e.landT = 0.18; g.fx.shake(3); g.fx.emit(e.cx, e.y + e.h, 8, '#9a8aa8', 120, 0.35, 2, 300, Math.PI, -Math.PI / 2); }
    e.airT = e.onGround ? 0 : (e.airT || 0) + dt;
  }
  if (e.state !== 'charge' && e.state !== 'leap' && e.state !== 'swipe' && e.state !== 'bite' && e.state !== 'beam' && e.state !== 'sweep' && e.state !== 'slam') {
    if (e.type === 'trex') {                       // o T-Rex é pesado para virar: dá para ficar nas costas dele
      if (dir !== e.facing) { e.turnT = (e.turnT || 0) + dt; if (e.turnT > 0.7) { e.facing = dir; e.turnT = 0; } } else e.turnT = 0;
    } else e.facing = dir;
  }

  // Ficou muito para trás: some num glitch e reaparece na borda da tela
  if (!d.flying && Math.abs(dx) > VIEW_W * 1.1 && e.state === 'move') {
    const view = g.camera.view, x = dir > 0 ? view.left - 20 : view.right + 20;
    const sy = g.world.surfaceNear(Math.floor((p.cx - dir * VIEW_W * 0.55) / TILE), p.bottom, Math.ceil(d.h / TILE));
    if (sy !== null) {
      g.fx.sprite('fx.glitch', e.cx, e.cy, 0.4, 2.4);
      e.x = p.cx - dir * VIEW_W * 0.55 - d.w / 2; e.y = sy - d.h - 0.5; e.vx = 0; e.vy = 0;
      g.fx.sprite('fx.glitch', e.cx, e.cy, 0.4, 2.4);
      void x;
    }
  }

  switch (e.type) {
    case 'polvo': polvo(E, e, dt, p, ph, dir); break;
    case 'quimera': quimera(E, e, dt, p, ph, dir); break;
    case 'dragao': dragao(E, e, dt, p, ph, dir); break;
    case 'trex': trex(E, e, dt, p, ph, dir); break;
    case 'mecha': mecha(E, e, dt, p, ph, dir); break;
    case 'serpente': serpente(E, e, dt, p, ph, dir); break;
  }
}

// Troca de fase dos chefões aquáticos: quadros de dano da folha, tremor e aviso
function phaseHit(E, e, ph) {
  if (ph === e.lastPh) return;
  if (e.lastPh) {
    const g = E.game;
    e.hurtT = 0.7; g.fx.shake(7); g.fx.sfx('killbig');
    g.fx.sprite('fx.glitch', e.cx, e.cy, 0.5, 3);
    if (g.water) g.water.emit(e.cx, e.cy, 8, e.w * 0.3, 1.4);
    if (g.ui) g.ui.bossPhase(ph);
  }
  e.lastPh = ph;
}

// ---------------- Mecha-Povoador (variação aquática do Polvo) ----------------
// Escafandro gigante que anda no fundo: tentáculo no chão com ondas elétricas, canhão da cabeça,
// anel de choque (fase 2) e salto pesado (fase 3). A água deixa a queda lenta: dá tempo de sair de baixo.
function mechaSlam(E, e, p, ph) {
  const g = E.game, d = e.def;
  melee(E, e, p, e.facing, 92, e.h * 0.7, d.dmg, '#ffd84d');
  for (const s of [-1, 1]) E.shoot(e.cx + s * 28, e.y + e.h - 9, s * (ph >= 2 ? 280 : 220), 0, 'wave', d.dmg * 0.6, { color: '#ffd84d', ghost: true, life: 1.4 });
  g.fx.emit(e.cx + e.facing * 30, e.y + e.h - 4, 18, '#ffe14d', 240, 0.35, 2, 300, Math.PI, -Math.PI / 2);
  g.fx.shake(8); g.fx.sfx('cannon');
  g.juice.shock(e.cx + e.facing * 20, e.y + e.h - 6, 130, 0.08, 0.45);
  if (g.water) g.water.emit(e.cx + e.facing * 30, e.y + e.h - 8, 6, 16, 1.3);
}

function mecha(E, e, dt, p, ph, dir) {
  const g = E.game, d = e.def;
  phaseHit(E, e, ph);
  e.vy = Math.min(e.vy + GRAVITY * 0.5 * dt, 380);
  e.anim = e.hurtT > 0 ? 'mecha.hurt' : e.state === 'tele' ? 'mecha.tele' : (e.state === 'slam' || e.state === 'shoot') ? 'mecha.atk' : 'mecha.move';
  if (e.hurtT > 0) { approach(e, 'vx', 0, 1500 * dt); return; }
  if (e.state === 'tele') {
    approach(e, 'vx', 0, 1500 * dt);
    if ((e.st -= dt) > 0) return;
    if (e.next === 'slam') { e.state = 'slam'; e.st = 0.4; mechaSlam(E, e, p, ph); return; }
    if (e.next === 'cannon') {
      fan(E, e, p, ph >= 2 ? 5 : 3, ph >= 2 ? 0.9 : 0.6, 210, 'orb', '#ff9a3c');
      g.fx.sfx('laser'); e.state = 'shoot'; e.st = 0.35; return;
    }
    if (e.next === 'shock') {
      ring(E, e, ph === 3 ? 14 : 10, 150, 'orb', '#ff4df0', d.dmg * 0.55, e.t);
      g.fx.sfx('laser'); e.state = 'shoot'; e.st = 0.4; return;
    }
    if (e.next === 'leap') { e.vy = -d.jump; e.vx = e.lockX * 200; e.onGround = false; e.state = 'leap'; e.st = 2; g.fx.sfx('dash'); return; }
    e.state = 'move'; e.cd = ph === 1 ? 1.6 : 1.2;
    return;
  }
  if (e.state === 'slam' || e.state === 'shoot') {
    approach(e, 'vx', 0, 1500 * dt);
    if ((e.st -= dt) <= 0) { e.state = 'rec'; e.st = 0.35; }
    return;
  }
  if (e.state === 'leap') {
    if ((e.st -= dt) <= 1.85 && e.onGround) { mechaSlam(E, e, p, ph); if (ph === 3) rain(E, e, p, 5, 260, 'orb', '#ff9a3c', d.dmg * 0.5); e.state = 'rec'; e.st = 0.6; }
    else if (e.st <= 0) { e.state = 'rec'; e.st = 0.3; }
    return;
  }
  if (e.state === 'rec') { approach(e, 'vx', 0, 1400 * dt); if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = ph === 1 ? 1.3 : 0.9; } return; }
  const spd = d.speed * (ph === 3 ? 1.3 : 1);
  approach(e, 'vx', Math.abs(p.cx - e.cx) > 50 ? dir * spd : 0, 600 * dt);
  if (e.onGround && (e.hitWall !== 0 || (p.bottom < e.y - 70 && e.cd < 0.3))) e.vy = -d.jump * 0.8;
  if (e.cd <= 0 && e.onGround) {
    e.k = (e.k || 0) + 1;
    let pick;
    if (Math.abs(p.cx - e.cx) < 105 && Math.abs(p.cy - e.cy) < 80) pick = 'slam';
    else {
      const opts = ph === 1 ? ['cannon', 'slam', 'cannon'] : ph === 2 ? ['cannon', 'shock', 'leap', 'cannon'] : ['leap', 'shock', 'cannon', 'leap', 'shock'];
      pick = opts[e.k % opts.length];
    }
    e.lockX = dir;
    tele(E, e, pick, pick === 'slam' ? 0.55 : pick === 'leap' ? 0.5 : 0.65);
  }
}

// ---------------- O Grande Glitch — serpente aquática (variação aquática do Dragão) ----------------
// Nada em ondas pela tela: sopro de plasma que varre, travessia rápida na altura do jogador,
// anel de bolhas elétricas (fase 2+) e cardume de peixes-lanterna (fase 2+).
function serpente(E, e, dt, p, ph, dir) {
  const g = E.game, d = e.def;
  phaseHit(E, e, ph);
  e.beam = null;
  e.anim = e.hurtT > 0 ? 'serpente.hurt' : (e.state === 'tele' && e.next === 'breath') ? 'serpente.tele' : e.state === 'beam' ? (Math.abs(Math.sin(e.beam0 || 0)) < 0.22 ? 'serpente.atk' : 'serpente.tele') : 'serpente.move';
  const top = WATER.top + e.h;
  if (e.hurtT > 0) { e.vx *= 0.9; e.vy *= 0.9; return; }
  const mouth = () => ({ x: e.cx + e.facing * 44, y: e.cy - 8 });
  if (e.state === 'tele') {
    e.vx *= 0.88; e.vy *= 0.88;
    if (e.next === 'breath') { e.facing = e.lockF; const m = mouth(); e.beam = { x: m.x, y: m.y, a: e.aim, len: 320, warn: true, col: 'cyan' }; }
    if ((e.st -= dt) > 0) return;
    if (e.next === 'breath') { e.state = 'beam'; e.st = ph >= 2 ? 1.3 : 1.0; e.st0 = e.st; g.fx.sfx('laser'); return; }
    if (e.next === 'sweep') { e.state = 'sweep'; e.st = 1.1; e.ty = Math.max(top, p.cy); g.fx.sfx('dash'); return; }
    if (e.next === 'bubbles') {
      ring(E, e, ph === 3 ? 14 : 10, 140, 'orb', '#5ef0ff', d.dmg * 0.55, e.t);
      if (ph === 3) ring(E, e, 10, 100, 'orb', '#9ffcff', d.dmg * 0.5, e.t + 0.3);
      if (g.water) g.water.emit(e.cx, e.cy, 10, 30, 1.4);
      g.fx.sfx('laser');
    }
    if (e.next === 'summon') {
      for (let i = 0; i < (ph === 3 ? 4 : 3); i++) {
        if (g.enemies.count > 60) break;
        const m = E.spawn('peixe', e.cx + (i - 1.5) * 26, e.cy + 10, 1 + g.runTime / 300);
        if (m) { m.vy = 80; m.cd = 1.5 + i * 0.4; }
      }
      g.fx.sprite('fx.burst', e.cx, e.cy, 0.4, 2);
    }
    e.state = 'move'; e.cd = ph === 1 ? 1.7 : ph === 2 ? 1.3 : 1.0;
    return;
  }
  if (e.state === 'beam') {
    e.vx *= 0.9; e.vy *= 0.9;
    const k = 1 - e.st / e.st0;
    const a = e.aim + e.sweep * (k - 0.5) * (ph >= 2 ? 0.9 : 0.6) * e.facing;
    const m = mouth(), len = 320;
    e.beam = { x: m.x, y: m.y, a, len, col: 'cyan', w: 1.1 }; e.beam0 = a;
    const ex = m.x + Math.cos(a) * len, ey = m.y + Math.sin(a) * len;
    const vx = ex - m.x, vy = ey - m.y, tt = Math.max(0, Math.min(1, ((p.cx - m.x) * vx + (p.cy - m.y) * vy) / (vx * vx + vy * vy)));
    if (Math.hypot(p.cx - (m.x + vx * tt), p.cy - (m.y + vy * tt)) < 17 && !p.isDead) g.damagePlayer(d.dmg * g.enemyDamageMult, m.x);
    if (Math.random() < 0.5) g.fx.emit(ex, ey, 1, '#5ef0ff', 120, 0.3, 2);
    if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = 1.1; e.beam = null; }
    return;
  }
  if (e.state === 'sweep') {                      // travessia: atravessa a tela na altura do jogador
    e.vx = e.facing * 380;
    approach(e, 'vy', (e.ty - e.cy) * 3, 900 * dt);
    if (Math.random() < 0.5) g.fx.emit(e.cx - e.facing * 50, e.cy, 1, '#5ef0ff', 60, 0.4, 2);
    if (g.water && Math.random() < 0.2) g.water.emit(e.cx - e.facing * 56, e.cy, 1, 8);
    if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = 0.8; e.vx *= 0.3; }
    return;
  }
  const t = e.t;
  flyTo(e, p.cx + Math.cos(t * 0.5) * 160, Math.max(top, Math.min(p.cy - 70 + Math.sin(t * 1.3) * 40, -e.h - 30)), d.speed, 230, dt);
  if (e.cd <= 0) {
    e.k = (e.k || 0) + 1;
    const opts = ph === 1 ? ['breath', 'sweep', 'bubbles'] : ph === 2 ? ['breath', 'sweep', 'bubbles', 'summon'] : ['breath', 'sweep', 'summon', 'bubbles', 'breath', 'sweep'];
    const pick = opts[e.k % opts.length];
    if (pick === 'breath') {
      const m = mouth();
      const a = Math.max(-0.9, Math.min(0.9, Math.atan2(p.cy - m.y, Math.max(20, (p.cx - m.x) * e.facing))));   // sempre para a frente
      e.aim = e.facing > 0 ? a : Math.PI - a;
      e.sweep = Math.random() < 0.5 ? 1 : -1;
      e.lockF = e.facing;
    }
    tele(E, e, pick, pick === 'breath' ? 0.85 : 0.55);
  }
}

// ---------------- Polvo de Neon ----------------
// Flutua no alto; leque de orbes elétricos, mergulho e invocação de morcegos.
function polvo(E, e, dt, p, ph) {
  const g = E.game;
  e.anim = e.state === 'tele' ? 'polvo.tele' : 'polvo.move';
  if (e.state === 'tele') {
    e.vx *= 0.9; e.vy *= 0.9;
    if ((e.st -= dt) > 0) return;
    if (e.next === 'volley') {
      fan(E, e, p, ph >= 2 ? 7 : 5, ph >= 2 ? 1.3 : 1.0, 190, 'orb', '#ff4df0');
      if (ph === 3) { e.state = 'tele'; e.st = 0.45; e.next = 'volley2'; return; }
      g.fx.sfx('laser');
    } else if (e.next === 'volley2') {
      fan(E, e, p, 6, 1.6, 230, 'orb', '#c04dff');
    } else if (e.next === 'dive') {
      const n = Math.hypot(e.lockX - e.cx, e.lockY - e.cy) || 1;
      e.vx = ((e.lockX - e.cx) / n) * 380; e.vy = ((e.lockY - e.cy) / n) * 380;
      e.state = 'dash'; e.st = 0.55; return;
    } else if (e.next === 'spin') {               // fase 2+: anel de orbes girando (duas ondas defasadas)
      ring(E, e, ph === 3 ? 12 : 10, 150, 'orb', '#ff4df0', e.def.dmg * 0.6, e.t);
      e.state = 'tele'; e.st = 0.35; e.next = ph === 3 ? 'spin2' : 'none'; g.fx.sfx('laser'); return;
    } else if (e.next === 'spin2') {
      ring(E, e, 12, 180, 'orb', '#c04dff', e.def.dmg * 0.6, e.t + 0.26);
    } else if (e.next === 'rain') {               // fase 3: tinta neon caindo do teto
      rain(E, e, p, 7, 300, 'orb', '#c04dff', e.def.dmg * 0.6);
      g.fx.sfx('throw');
    } else if (e.next === 'summon') {
      for (let i = 0; i < (ph >= 2 ? 4 : 3); i++) {
        if (g.enemies.count > 60) break;
        const m = E.spawn('morcego', e.cx + (i - 1.5) * 30, e.cy - 20, 1 + g.runTime / 300);
        if (m) { m.vy = -120; m.cd = 1.2 + i * 0.3; }
      }
      g.fx.sprite('fx.burst', e.cx, e.cy, 0.4, 2);
    }
    e.state = 'move'; e.cd = ph === 1 ? 1.7 : ph === 2 ? 1.3 : 1.0;
    return;
  }
  if (e.state === 'dash') {
    const W = E.game.world;                       // para no chão de verdade (o terreno muda de altura)
    const hitGround = W && (W.isSolidAt(e.cx, e.y + e.h + 6) || W.isSolidAt(e.x + 6, e.y + e.h + 6) || W.isSolidAt(e.x + e.w - 6, e.y + e.h + 6));
    if (hitGround && e.vy > 0) { e.vy = 0; e.y = Math.floor((e.y + e.h + 6) / 32) * 32 - e.h - 8; }
    if ((e.st -= dt) <= 0 || hitGround || e.y > -e.h - 6) { e.state = 'rest'; e.st = 1.3; e.vx *= 0.2; e.vy = 0; }
    return;
  }
  if (e.state === 'rest') {                      // depois do mergulho fica baixo e exposto: janela para bater
    e.vx *= 0.9; e.vy = Math.sin(e.t * 6) * 15;
    if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = 0.8; e.vy = -160; }
    return;
  }
  flyTo(e, p.cx + Math.sin(e.t * 0.7) * 110, Math.min(p.cy - 82 + Math.sin(e.t * 1.7) * 22, -e.h - 40), e.def.speed, 260, dt);
  if (e.cd <= 0) {
    e.k = (e.k || 0) + 1;
    const seq = ph === 1 ? ['volley', 'dive', 'volley', 'summon']
      : ph === 2 ? ['volley', 'spin', 'dive', 'summon', 'spin', 'dive']
      : ['spin', 'dive', 'rain', 'volley', 'dive', 'summon', 'rain'];
    const pick = seq[e.k % seq.length];
    if (pick === 'dive') { e.lockX = p.cx; e.lockY = p.cy; }
    tele(E, e, pick, pick === 'dive' ? 0.55 : 0.75);
  }
}

// ---------------- Quimera Cibernética ----------------
// Três fases (dourado → verde → ciano): bote, cauda de escorpião (projéteis em arco) e investida.
function quimera(E, e, dt, p, ph, dir) {
  const g = E.game, d = e.def;
  const spd = d.speed * (ph === 1 ? 1 : ph === 2 ? 1.2 : 1.45);
  e.anim = 'quimera.p' + ph;
  if (ph !== e.lastPh) {
    if (e.lastPh) { g.fx.sprite('fx.glitch', e.cx, e.cy, 0.5, 2.6); g.fx.shake(6); g.fx.sfx('killbig'); g.ui && g.ui.bossPhase(ph); }
    e.lastPh = ph;
  }
  e.vy = Math.min(e.vy + GRAVITY * dt, 800);
  if (e.state === 'tele') {
    approach(e, 'vx', 0, 1500 * dt);
    if ((e.st -= dt) > 0) return;
    if (e.next === 'pounce') {
      e.vy = -520; e.vx = e.lockX * Math.min(420, Math.abs(p.cx - e.cx) * 1.6 + 120);
      e.state = 'leap'; e.st = 1.2; return;
    }
    if (e.next === 'tail') {
      const n = ph === 3 ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const T = 0.8 + i * 0.12, G = 700;
        const tx = p.cx + (i - (n - 1) / 2) * 46, sx = e.cx - e.facing * 30, sy = e.y + 4;
        E.shoot(sx, sy, (tx - sx) / T, (p.cy - sy - 0.5 * G * T * T) / T, 'orb', d.dmg * 0.7, { color: ph === 1 ? '#ffc94d' : ph === 2 ? '#4dffa6' : '#5ef0ff', grav: G, life: 3 });
      }
      g.fx.sfx('throw');
    }
    if (e.next === 'charge') { e.state = 'charge'; e.st = 0.7; e.vx = e.lockX * 440; g.fx.sfx('dash'); return; }
    if (e.next === 'swipe') {                     // bote curto com garrada (perto)
      e.vx = e.lockX * 320; e.state = 'swipe'; e.st = 0.22; e.hitDone = false; g.fx.sfx('claw'); return;
    }
    if (e.next === 'lash') {                      // fase 2+: chicote da cauda em volta (anel de orbes + golpe atrás)
      melee(E, e, p, -e.facing, 96, e.h + 30, d.dmg, ph === 2 ? '#4dffa6' : '#5ef0ff');
      ring(E, e, ph === 3 ? 10 : 8, 170, 'orb', ph === 2 ? '#4dffa6' : '#5ef0ff', d.dmg * 0.6, e.t);
      g.fx.effect('ring', { x: e.cx, y: e.cy, r: 8, maxR: 110, color: ph === 2 ? '#4dffa6' : '#5ef0ff', life: 0.35 });
      g.fx.shake(4); g.fx.sfx('boom');
    }
    if (e.next === 'roar') {                      // fase 2+: rugido — onda que empurra e (fase 3) chama 2 Hounds
      g.fx.shake(10); g.fx.sfx('roar');
      g.fx.effect('ring', { x: e.cx, y: e.cy, r: 10, maxR: 200, color: '#ffc94d', life: 0.5 });
      if (Math.abs(p.cx - e.cx) < 200 && !p.isDead) { p.vx = Math.sign(p.cx - e.cx || 1) * 420; p.vy = -260; }
      if (ph === 3) for (const s of [-1, 1]) { if (g.enemies.count < 60) E.spawn('hound', e.cx + s * 70, e.y + e.h - 24, 1 + g.runTime / 300); }
      e.state = 'rec'; e.st = 0.5; return;
    }
    e.state = 'move'; e.cd = ph === 1 ? 1.3 : ph === 2 ? 1.0 : 0.75;
    return;
  }
  if (e.state === 'swipe') {
    if (!e.hitDone && e.st < 0.12) { e.hitDone = true; melee(E, e, p, e.lockX, 84, e.h + 10, d.dmg * 1.1, '#ffc94d'); }
    if ((e.st -= dt) <= 0) { e.state = 'rec'; e.st = 0.3; }
    return;
  }
  if (e.state === 'leap') {
    e.st -= dt;
    if ((e.onGround && e.vy >= 0 && e.st < 1.05) || e.st <= 0) {
      g.fx.shake(5); g.fx.sfx('land');
      E.shoot(e.cx, e.y + e.h - 8, 240, 0, 'wave', d.dmg * 0.6, { color: '#ffc94d', ghost: true, life: 0.9 });
      E.shoot(e.cx, e.y + e.h - 8, -240, 0, 'wave', d.dmg * 0.6, { color: '#ffc94d', ghost: true, life: 0.9 });
      e.landT = 0.18;
      if (e.chain > 0) { e.chain--; e.lockX = p.cx >= e.cx ? 1 : -1; e.state = 'tele'; e.st = 0.28; e.next = 'pounce'; return; }   // fase 3: botes em sequência
      e.state = 'rec'; e.st = 0.45;
    }
    return;
  }
  if (e.state === 'charge') {
    e.vx = e.lockX * 440;
    if ((e.st -= dt) <= 0 || e.hitWall !== 0) { e.state = 'rec'; e.st = 0.5; }
    return;
  }
  if (e.state === 'rec') { approach(e, 'vx', 0, 1400 * dt); if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = 0.8; } return; }
  approach(e, 'vx', Math.abs(p.cx - e.cx) > 50 ? dir * spd : 0, 900 * dt);
  if (e.onGround && (e.hitWall !== 0 || (p.bottom < e.y - 40 && e.cd < 0.3))) e.vy = -d.jump;
  // pulinho para trás quando o jogador gruda nela (fase 2+)
  if (ph >= 2 && e.onGround && Math.abs(p.cx - e.cx) < 40 && e.cd > 0.4 && Math.random() < dt * 2.5) { e.vy = -380; e.vx = -dir * 260; }
  if (e.cd <= 0 && e.onGround) {
    e.k = (e.k || 0) + 1;
    const near = Math.abs(p.cx - e.cx) < 120 && Math.abs(p.cy - e.cy) < 80;
    let pick;
    if (near) pick = ph === 1 ? 'swipe' : (e.k % 2 ? 'swipe' : 'lash');
    else {
      const opts = ph === 1 ? ['pounce', 'tail', 'pounce', 'tail']
        : ph === 2 ? ['pounce', 'tail', 'charge', 'roar', 'pounce', 'tail']
        : ['pounce', 'charge', 'tail', 'roar', 'pounce', 'lash'];
      pick = opts[e.k % opts.length];
    }
    e.lockX = dir;
    e.chain = pick === 'pounce' && ph === 3 ? 2 : 0;
    tele(E, e, pick, pick === 'tail' ? 0.6 : pick === 'swipe' ? 0.35 : pick === 'roar' ? 0.7 : 0.55);
  }
}

// ---------------- O Grande Glitch (Dragão Cyber) ----------------
// Serpenteia; laser magenta que varre, cubos de glitch e (fase 2+) teleporte.
function dragao(E, e, dt, p, ph) {
  const g = E.game;
  e.anim = 'dragao.move';
  e.beam = null;
  if (e.state === 'tele') {
    e.vx *= 0.88; e.vy *= 0.88;
    if (e.next === 'beam') e.beam = { x: e.cx + e.facing * 46, y: e.cy - 22, a: e.aim, len: 60, warn: true };
    if ((e.st -= dt) > 0) return;
    if (e.next === 'beam') { e.state = 'beam'; e.st = ph >= 2 ? 1.4 : 1.1; e.st0 = e.st; g.fx.sfx('laser'); return; }
    if (e.next === 'cubes') fan(E, e, p, ph >= 2 ? 6 : 4, ph >= 2 ? 1.8 : 1.2, 165, 'cube', '#5ef0ff', { life: 3.2 });
    if (e.next === 'swoop') {                     // rasante em arco atravessando o jogador
      e.state = 'swoop'; e.st = 0.9; e.sx0 = e.cx; e.sy0 = e.cy; e.tx = p.cx + (p.cx - e.cx) * 0.9; e.ty = p.cy; g.fx.sfx('dash'); return;
    }
    if (e.next === 'cuberain') { rain(E, e, p, 8, 340, 'cube', '#5ef0ff', e.def.dmg * 0.6); g.fx.sfx('laser'); }
    if (e.next === 'blink') {
      g.fx.sprite('fx.glitch', e.cx, e.cy, 0.5, 3);
      const side = e.cx > p.cx ? -1 : 1;
      e.x = p.cx + side * 150 - e.w / 2; e.y = Math.min(p.cy - 130, -e.h - 50); e.vx = 0; e.vy = 0;
      g.fx.sprite('fx.glitch', e.cx, e.cy, 0.5, 3); g.fx.sfx('dash');
    }
    e.state = 'move'; e.cd = ph === 1 ? 1.8 : ph === 2 ? 1.35 : 1.0;
    return;
  }
  if (e.state === 'beam') {
    e.vx *= 0.9; e.vy *= 0.9;
    const k = 1 - e.st / e.st0;
    const a = e.aim + e.sweep * (k - 0.5) * (ph >= 2 ? 1.5 : 1.1);
    const bx = e.cx + e.facing * 46, by = e.cy - 22, len = 360;
    e.beam = { x: bx, y: by, a, len };
    // dano: distância do jogador ao segmento do laser
    const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
    const vx = ex - bx, vy = ey - by, t = Math.max(0, Math.min(1, ((p.cx - bx) * vx + (p.cy - by) * vy) / (vx * vx + vy * vy)));
    const dist = Math.hypot(p.cx - (bx + vx * t), p.cy - (by + vy * t));
    if (dist < 16 && !p.isDead) g.damagePlayer(e.def.dmg * g.enemyDamageMult, bx);
    if (Math.random() < 0.5) g.fx.emit(bx + vx * 0.9, by + vy * 0.9, 1, '#ff4df0', 120, 0.3, 2);
    if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = 1.2; e.beam = null; }
    return;
  }
  if (e.state === 'swoop') {
    const k = 1 - e.st / 0.9;
    const x = e.sx0 + (e.tx - e.sx0) * k, y = e.sy0 + (e.ty - e.sy0) * Math.sin(k * Math.PI) * 1.1;   // arco para baixo e de volta
    e.vx = (x - e.cx) / Math.max(dt, 1e-3); e.vy = (Math.min(y, -e.h * 0.5 - 4) - e.cy) / Math.max(dt, 1e-3);
    if (Math.random() < 0.6) g.fx.emit(e.cx, e.cy, 1, '#5ef0ff', 60, 0.4, 2);
    if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = 0.9; e.vx *= 0.3; e.vy *= 0.3; }
    return;
  }
  const t = e.t;
  flyTo(e, p.cx + Math.cos(t * 0.55) * 150, Math.min(p.cy - 90 + Math.sin(t * 1.4) * 40, -e.h - 30), e.def.speed, 240, dt);
  if (e.cd <= 0) {
    e.k = (e.k || 0) + 1;
    const opts = ph === 1 ? ['beam', 'cubes', 'swoop']
      : ph === 2 ? ['beam', 'swoop', 'cubes', 'blink']
      : ['beam', 'cuberain', 'swoop', 'blink', 'cubes', 'cuberain'];
    const pick = opts[e.k % opts.length];
    if (pick === 'beam') {
      e.aim = Math.atan2(p.cy - (e.cy - 22), p.cx - (e.cx + e.facing * 46));
      e.sweep = Math.random() < 0.5 ? 1 : -1;
    }
    tele(E, e, pick, pick === 'beam' ? 0.9 : 0.6);
  }
}

// ---------------- T-Rex Cibernético ----------------
// Fase 1: pisões com ondas de choque no chão (pule!). Fase 2 (visor vermelho): investida e lasers.
function trex(E, e, dt, p, ph, dir) {
  const g = E.game, d = e.def;
  const p2 = e.hp / e.maxHp <= 0.5;
  e.anim = p2 ? 'trex.p2' : 'trex.move';
  if (p2 && !e.enraged) { e.enraged = true; g.fx.sprite('fx.glitch', e.cx, e.cy, 0.5, 3); g.fx.shake(8); g.fx.sfx('killbig'); g.ui && g.ui.bossPhase(2); }
  e.vy = Math.min(e.vy + GRAVITY * dt, 800);
  const spd = d.speed * (p2 ? 1.35 : 1);
  if (e.state === 'tele') {
    approach(e, 'vx', 0, 1500 * dt);
    if ((e.st -= dt) > 0) return;
    if (e.next === 'stomp' || e.next === 'stomp2') {
      g.fx.shake(9); g.fx.sfx('cannon');
      g.juice.shock(e.cx, e.y + e.h - 6, 140, 0.08, 0.45);
      g.fx.sprite('fx.smoke', e.cx, e.y + e.h - 6, 0.6, 1.6, { add: false, grow: 0.5 });
      for (const s of [-1, 1]) E.shoot(e.cx + s * 30, e.y + e.h - 9, s * (p2 ? 300 : 250), 0, 'wave', d.dmg * 0.6, { color: '#ff5a1a', ghost: true, life: 1.5 });
      if (e.next === 'stomp' && p2) { e.state = 'tele'; e.st = 0.55; e.next = 'stomp2'; return; }
    }
    if (e.next === 'stomp' || e.next === 'stomp2') {
      if (p2) rain(E, e, p, 5, 260, 'orb', '#ff9a3c', d.dmg * 0.5);    // fase 2: o pisão derruba pedras do teto
    }
    if (e.next === 'bite') { e.state = 'bite'; e.st = 0.3; e.vx = e.lockX * 380; e.hitDone = false; g.fx.sfx('roar'); return; }
    if (e.next === 'tailswipe') {                 // rabada: golpe atrás, empurra o jogador
      melee(E, e, p, -e.facing, 110, e.h * 0.6, d.dmg, '#ff5a1a');
      if (Math.abs(p.cx - e.cx) < 120 && Math.sign(p.cx - e.cx) === -e.facing && !p.isDead) { p.vx = -e.facing * 380; p.vy = -220; }
      g.fx.shake(5); g.fx.sfx('boom');
      e.state = 'rec'; e.st = 0.4; return;
    }
    if (e.next === 'charge') { e.state = 'charge'; e.st = 0.85; e.vx = e.lockX * 430; g.fx.sfx('dash'); return; }
    if (e.next === 'laser') { e.state = 'shoot'; e.st = 0.75; e.shots = 3; e.fireCd = 0; return; }
    e.state = 'move'; e.cd = p2 ? 1.1 : 1.6;
    return;
  }
  if (e.state === 'shoot') {
    approach(e, 'vx', 0, 1500 * dt);
    if (e.fireCd <= 0 && e.shots > 0) {
      e.shots--; e.fireCd = 0.22;
      const sx = e.cx + e.facing * 30, sy = e.y + 22, a = Math.atan2(p.cy - sy, p.cx - sx);
      E.shoot(sx, sy, Math.cos(a) * 520, Math.sin(a) * 520, 'laser', d.dmg * 0.6, {});
      g.fx.sfx('laser');
    }
    if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = 1.0; }
    return;
  }
  if (e.state === 'bite') {
    if (!e.hitDone && e.st < 0.18) { e.hitDone = true; melee(E, e, p, e.lockX, 96, 60, d.dmg * 1.2, '#ff5a1a'); g.fx.shake(4); }
    if ((e.st -= dt) <= 0) { e.state = 'rec'; e.st = 0.35; }
    return;
  }
  if (e.state === 'charge') {
    e.vx = e.lockX * 430;
    if (Math.random() < 0.3) g.fx.emit(e.cx - e.lockX * 30, e.y + e.h - 4, 2, '#ff9a3c', 90, 0.35, 2);
    if ((e.st -= dt) <= 0 || e.hitWall !== 0) { if (e.hitWall) g.fx.shake(7); e.state = 'rec'; e.st = 0.6; }
    return;
  }
  if (e.state === 'rec') { approach(e, 'vx', 0, 1400 * dt); if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = 0.7; } return; }
  approach(e, 'vx', Math.abs(p.cx - e.cx) > 40 ? dir * spd : 0, 700 * dt);
  if (e.onGround && (e.hitWall !== 0 || (p.bottom < e.y - 60 && e.cd < 0.3))) e.vy = -d.jump;
  if (e.cd <= 0 && e.onGround) {
    e.k = (e.k || 0) + 1;
    const near = Math.abs(p.cx - e.cx) < 130;
    const behind = near && Math.sign(p.cx - e.cx) === -e.facing;
    let pick;
    if (behind) pick = 'tailswipe';
    else if (near) pick = e.k % 2 ? 'bite' : 'stomp';
    else {
      const opts = p2 ? ['stomp', 'charge', 'laser', 'bite', 'stomp', 'laser'] : ['stomp', 'bite', 'stomp', 'charge'];
      pick = opts[e.k % opts.length];
    }
    e.lockX = dir;
    tele(E, e, pick, pick === 'stomp' ? 0.7 : pick === 'tailswipe' ? 0.4 : pick === 'bite' ? 0.45 : 0.6);
  }
}
