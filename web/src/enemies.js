// Inimigos (pool fixo), IA simples por tipo, tiros inimigos e o spawner por tempo (GDD 10.3).

import { TILE, LIMITS, VIEW_W, CHUNK_W, WATER, JOURNEY } from './config.js';
import { moveX, moveY } from './world.js';
import { SpatialGrid } from './grid.js';
import { biomeAt, SECTOR_ROSTER, SECTOR_ORDER } from './biomes.js';
import { BOSS_TYPES, BOSS_ORDER, BOSS_FIRST, BOSS_EVERY, WATER_BOSSES, bossAI } from './boss.js';

const GRAVITY = 1350;
// Física dos inimigos que andam: na água afundam devagar e pulam mais "flutuado" (setWaterPhysics)
const PHYS = { g: GRAVITY, maxFall: 700, water: false };
export function setWaterPhysics(on) {
  PHYS.water = !!on;
  PHYS.g = on ? GRAVITY * WATER.enemyGravity : GRAVITY;
  PHYS.maxFall = on ? WATER.enemyMaxFall : 700;
}

export const ENEMY_TYPES = {
  rato:    { name: 'Cyber-Rato',          tier: 'weak',   ai: 'ground',    w: 30, h: 17, hp: 14,  speed: 125, dmg: 5,  xp: 20,  scrap: 0.15, color: '#8fa3b8', glow: '#4dff88', jump: 420 },
  esquilo: { name: 'Esquilo Bombardeiro', tier: 'weak',   ai: 'thrower',   w: 22, h: 26, hp: 16,  speed: 70,  dmg: 6,  xp: 20,  scrap: 0.15, color: '#c8682c', glow: '#ff9a3c', jump: 400 },
  drone:   { name: 'Drone Olho',          tier: 'weak',   ai: 'fly',       w: 24, h: 22, hp: 12,  speed: 85,  dmg: 4,  xp: 20,  scrap: 0.15, color: '#8b93a8', glow: '#ff3b5c', flying: true },
  aranha:  { name: 'Aranha-Drone',        tier: 'weak',   ai: 'dropper',   w: 26, h: 18, hp: 12,  speed: 115, dmg: 5,  xp: 20,  scrap: 0.15, color: '#4a4058', glow: '#ff4df0', jump: 380 },
  morcego: { name: 'Morcego Cibernético', tier: 'weak',   ai: 'swoop',     w: 30, h: 22, hp: 10,  speed: 95,  dmg: 4,  xp: 20,  scrap: 0.15, color: '#6b5a8f', glow: '#c04dff', flying: true },
  hound:   { name: 'Scrap-Hound',         tier: 'medium', ai: 'charger',   w: 44, h: 30, hp: 45,  speed: 140, dmg: 10, xp: 45,  scrap: 0.35, color: '#5d6270', glow: '#ff7a1a', jump: 430 },
  vespa:   { name: 'Vespa Zangão',        tier: 'medium', ai: 'flycharge', w: 24, h: 26, hp: 30,  speed: 130, dmg: 9,  xp: 45,  scrap: 0.35, color: '#e8c020', glow: '#ffe14d', flying: true },
  lobo:    { name: 'Cyber-Lobo',          tier: 'medium', ai: 'charger',   w: 46, h: 30, hp: 55,  speed: 165, dmg: 11, xp: 45,  scrap: 0.35, color: '#7a8aa0', glow: '#5ef0ff', jump: 470 },
  dronev:  { name: 'Drone Voador',        tier: 'medium', ai: 'sniper',    w: 32, h: 24, hp: 28,  speed: 115, dmg: 8,  xp: 45,  scrap: 0.35, color: '#8b93a8', glow: '#5ef0ff', flying: true },
  panda:   { name: 'Panda de Guerra',     tier: 'tank',   ai: 'gunner',    w: 44, h: 56, hp: 260, speed: 45,  dmg: 15, xp: 130, scrap: 1.0,  color: '#33323a', glow: '#ff7a1a', jump: 380, kbResist: 0.85 },
  caixa:   { name: 'Caixa',               tier: 'prop',   ai: 'prop',      w: 30, h: 28, hp: 18,  speed: 0,   dmg: 0,  xp: 0,   scrap: 0,    color: '#555', glow: '#ffc94d', prop: true },
  loot:    { name: 'Caixa Especial',      tier: 'prop',   ai: 'prop',      w: 28, h: 26, hp: 40,  speed: 0,   dmg: 0,  xp: 0,   scrap: 0,    color: '#555', glow: '#ff4df0', prop: true, rare: true },
  urso:    { name: 'Urso Cibernético',    tier: 'tank',   ai: 'ground',    w: 44, h: 54, hp: 220, speed: 55,  dmg: 16, xp: 120, scrap: 1.0,  color: '#6a4a32', glow: '#ff2b4a', jump: 380, kbResist: 0.85 },
  // ---- v0.8: inimigos próprios de cada cenário (ver SECTOR_ROSTER em biomes.js) ----
  // fracos
  ourico:      { name: 'Ouriço Neon',        tier: 'weak',   ai: 'roller',    w: 22, h: 18, hp: 16,  speed: 55,  dmg: 5,  xp: 20,  scrap: 0.15, color: '#4a8a3a', glow: '#7dff4d', jump: 360 },
  sapo:        { name: 'Sapo Ácido',         tier: 'weak',   ai: 'hopper',    w: 26, h: 24, hp: 16,  speed: 120, dmg: 5,  xp: 20,  scrap: 0.15, color: '#5a9a3a', glow: '#9dff4d', hop: 430, spit: true },
  medusa:      { name: 'Medusa Elétrica',    tier: 'weak',   ai: 'pulse',     w: 24, h: 26, hp: 14,  speed: 150, dmg: 5,  xp: 20,  scrap: 0.15, color: '#7a4ac0', glow: '#5ef0ff', flying: true },
  ratoasa:     { name: 'Rato-Asa Bombardeiro', tier: 'weak', ai: 'bomber',    w: 30, h: 22, hp: 12,  speed: 110, dmg: 6,  xp: 20,  scrap: 0.15, color: '#7a6a8f', glow: '#c04dff', flying: true },
  vagalume:    { name: 'Vaga-lume Bomba',    tier: 'weak',   ai: 'kamikaze',  w: 18, h: 18, hp: 8,   speed: 120, dmg: 12, xp: 20,  scrap: 0.15, color: '#3a6a8a', glow: '#5ef0ff', flying: true, touch: 0 },
  macaco:      { name: 'Macaco Hacker',      tier: 'weak',   ai: 'thrower',   w: 22, h: 28, hp: 16,  speed: 90,  dmg: 6,  xp: 20,  scrap: 0.15, color: '#7a5a3a', glow: '#ffd84d', jump: 460 },
  ornitorrinco: { name: 'Ornitorrinco Atirador', tier: 'weak', ai: 'gunner',  w: 30, h: 24, hp: 18,  speed: 60,  dmg: 6,  xp: 20,  scrap: 0.15, color: '#6a4a32', glow: '#5ef0ff', jump: 380, shotColor: '#5ef0ff', shotCd: 2.0 },
  // médios
  caranguejo:  { name: 'Caranguejo Blindado', tier: 'medium', ai: 'brawler',  w: 34, h: 20, hp: 50,  speed: 95,  dmg: 9,  xp: 45,  scrap: 0.35, color: '#5a5a6a', glow: '#ff3b5c', jump: 380, reach: 40, strike: 'snap', kbResist: 0.4 },
  bode:        { name: 'Bode-Foguete',       tier: 'medium', ai: 'leaper',    w: 34, h: 30, hp: 45,  speed: 90,  dmg: 10, xp: 45,  scrap: 0.35, color: '#7a5a3a', glow: '#ff9a3c', jump: 420 },
  canguru:     { name: 'Canguru Boxeador',   tier: 'medium', ai: 'hopper',    w: 26, h: 38, hp: 55,  speed: 150, dmg: 10, xp: 45,  scrap: 0.35, color: '#a8683a', glow: '#ff3b5c', hop: 470, punch: true },
  camaleao:    { name: 'Camaleão Fantasma',  tier: 'medium', ai: 'stealth',   w: 26, h: 22, hp: 40,  speed: 80,  dmg: 10, xp: 45,  scrap: 0.35, color: '#4a7a5a', glow: '#ff4df0', jump: 380 },
  coruja:      { name: 'Coruja de Vigilância', tier: 'medium', ai: 'caster',  w: 30, h: 24, hp: 34,  speed: 100, dmg: 8,  xp: 45,  scrap: 0.35, color: '#6a5a8f', glow: '#c04dff', flying: true },
  leaomarinho: { name: 'Leão-Marinho Jato',  tier: 'medium', ai: 'jetgunner', w: 44, h: 28, hp: 45,  speed: 120, dmg: 8,  xp: 45,  scrap: 0.35, color: '#c8884a', glow: '#5ef0ff', flying: true },
  tubarao:     { name: 'Tubarão-Torpedo',    tier: 'medium', ai: 'swim',      w: 62, h: 26, hp: 60,  speed: 85,  dmg: 12, xp: 50,  scrap: 0.4,  color: '#5a6a8a', glow: '#5ef0ff', flying: true, lunge: 430, kbResist: 0.5 },
  // v0.10: monstros aquáticos (Cyber Deep)
  peixe:       { name: 'Peixe-Lanterna Glitch', tier: 'weak', ai: 'lantern',   w: 34, h: 18, hp: 14,  speed: 95,  dmg: 5,  xp: 20,  scrap: 0.15, color: '#d07ab0', glow: '#ffe14d', flying: true },
  lula:        { name: 'Cyber-Lula',         tier: 'medium', ai: 'squid',     w: 28, h: 36, hp: 48,  speed: 120, dmg: 9,  xp: 45,  scrap: 0.35, color: '#6a8ad0', glow: '#ff4df0', flying: true },
  alce:        { name: 'Alce de Plasma',     tier: 'medium', ai: 'charger',   w: 34, h: 44, hp: 60,  speed: 110, dmg: 11, xp: 45,  scrap: 0.35, color: '#6a4a3a', glow: '#ff4df0', jump: 440, chargeSpeed: 420, chargeTime: 0.55 },
  texugo:      { name: 'Texugo Voltaico',    tier: 'medium', ai: 'charger',   w: 40, h: 22, hp: 45,  speed: 130, dmg: 10, xp: 45,  scrap: 0.35, color: '#4a4a52', glow: '#ffd84d', jump: 420, chargeSpeed: 470, chargeTime: 0.5, sparks: true },
  // tanques
  gorila:      { name: 'Gorila de Aço',      tier: 'tank',   ai: 'brawler',   w: 44, h: 50, hp: 240, speed: 60,  dmg: 16, xp: 130, scrap: 1.0,  color: '#3a3a4a', glow: '#5ef0ff', jump: 400, reach: 60, strike: 'slam', kbResist: 0.85, tele: 0.6 },
  crocodilo:   { name: 'Crocodilo Mecânico', tier: 'tank',   ai: 'brawler',   w: 64, h: 24, hp: 220, speed: 70,  dmg: 15, xp: 120, scrap: 1.0,  color: '#3a5a3a', glow: '#7dff4d', jump: 360, reach: 56, strike: 'bite', kbResist: 0.85 },
  touro:       { name: 'Touro de Brasa',     tier: 'tank',   ai: 'charger',   w: 52, h: 36, hp: 180, speed: 80,  dmg: 15, xp: 120, scrap: 1.0,  color: '#3a3038', glow: '#ff7a1a', jump: 400, kbResist: 0.8, chargeSpeed: 480, chargeTime: 0.7 },
  querubim:    { name: 'Querubim-Tubarão',   tier: 'tank',   ai: 'swim',      w: 64, h: 32, hp: 380, speed: 80,  dmg: 16, xp: 160, scrap: 1.5,  color: '#7a6ad0', glow: '#c04dff', flying: true, lunge: 470, kbResist: 0.85, mini: true },
  rinoceronte: { name: 'Rinoceronte Fornalha', tier: 'tank', ai: 'charger',   w: 68, h: 42, hp: 320, speed: 55,  dmg: 18, xp: 140, scrap: 1.2,  color: '#3a3a44', glow: '#ff7a1a', jump: 360, kbResist: 0.92, chargeSpeed: 430, chargeTime: 0.9 },
  ...BOSS_TYPES,
};

class Enemy {
  constructor() { this.active = false; this._q = 0; }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
}

export class Enemies {
  constructor(game) {
    this.game = game;
    this.pool = Array.from({ length: LIMITS.enemies }, () => new Enemy());
    this.shots = Array.from({ length: LIMITS.enemyShots }, () => ({ active: false }));
    this.count = 0;
    this.grid = new SpatialGrid(64, 1024);
    this._near = [];
  }

  reset() {
    for (const e of this.pool) e.active = false;
    for (const s of this.shots) s.active = false;
    this.count = 0;
  }

  spawn(typeId, x, y, hpMult) {
    const e = this.pool.find((o) => !o.active);
    if (!e) return null;
    const d = ENEMY_TYPES[typeId];
    e.active = true; e.type = typeId; e.def = d;
    e.x = x; e.y = y; e.prevX = x; e.prevY = y; e.w = d.w; e.h = d.h;
    e.vx = 0; e.vy = 0;
    e.hp = e.maxHp = Math.round(d.hp * hpMult);
    e.onGround = false; e.hitWall = 0;
    e.state = d.ai === 'dropper' ? 'drop' : 'move'; e.st = 0; e.cd = 0.8 + Math.random(); e.t = Math.random() * 10;
    e.flash = 0; e.stun = 0; e.droneCd = 0; e.fireCd = 0; e.facing = 1;
    e.lockX = 0; e.lockY = 0;
    e.anim = null; e.beam = null; e.threadY = 0; e.k = 0; e.lastPh = 0; e.enraged = false;
    e.cloak = false; e.tongue = 0; e.hopT = 0; e.burst = 0; e.lockX = 0; e.boomCd = 0; e.hurtT = 0; e.hurtAt = -9; e.hitDone = false; e._tr = null;
    this.count++;
    return e;
  }

  // ---------- Passo da simulação ----------

  step(dt) {
    const g = this.game, p = g.player;
    this.grid.clear();
    for (const e of this.pool) if (e.active) this.grid.insert(e);

    for (const e of this.pool) {
      if (!e.active) continue;
      e.prevX = e.x; e.prevY = e.y;
      e.t += dt; e.flash -= dt; e.hurtT -= dt; e.stun -= dt; e.cd -= dt; e.droneCd -= dt; e.fireCd -= dt; e.tongue -= dt; e.boomCd -= dt;

      if (e.def.boss) bossAI(this, e, dt, p);
      else if (e.stun > 0) this._stunned(e, dt);
      else this._ai(e, dt, p);

      if (!e.def.prop) this._separate(e);
      this._move(e, dt);

      // Dano por contato (equivale a Trigger Enter + Stay; as i-frames evitam dano repetido)
      if (e.def.dmg > 0 && e.def.touch !== 0 && e.stun <= 0 && !p.isDead && overlap(e, p, 4)) g.damagePlayer(e.def.dmg * g.enemyDamageMult, e.cx);

      // Muito longe do jogador: recicla (o spawner repõe perto)
      if (!e.def.boss && (Math.abs(e.cx - p.cx) > VIEW_W * 1.8 || Math.abs(e.cy - p.cy) > 1500)) this.remove(e);
    }

    this._stepShots(dt, p);
  }

  _stunned(e, dt) {
    e.vx *= 0.9;
    if (e.def.flying) e.vy *= 0.9;
    else e.vy = Math.min(e.vy + PHYS.g * dt, PHYS.maxFall);
  }

  _ai(e, dt, p) {
    const d = e.def;
    const dx = p.cx - e.cx, dy = p.cy - e.cy;
    const dir = dx >= 0 ? 1 : -1;
    const dist = Math.hypot(dx, dy);
    e.facing = dir;

    switch (d.ai) {
      case 'ground': {
        approach(e, 'vx', dir * d.speed, 900 * dt);
        this._groundJumps(e, p, dx);
        e.vy = Math.min(e.vy + PHYS.g * dt, PHYS.maxFall);
        break;
      }
      case 'thrower': {
        const adx = Math.abs(dx);
        let want = 0;
        if (adx > 230) want = dir; else if (adx < 140) want = -dir;
        if (e.state === 'tele') {
          want = 0;
          e.st -= dt;
          if (e.st <= 0) { this._throwAcorn(e, p); e.state = 'move'; e.cd = 2.6; }
        } else if (e.cd <= 0 && adx < 330 && Math.abs(dy) < 260) {
          e.state = 'tele'; e.st = 0.35; e.flash = 0.35;
        }
        approach(e, 'vx', want * d.speed, 700 * dt);
        this._groundJumps(e, p, dx);
        e.vy = Math.min(e.vy + PHYS.g * dt, PHYS.maxFall);
        break;
      }
      case 'dropper': {                            // Aranha-Drone: desce do alto num fio, depois corre no chão
        if (e.state !== 'move') {
          if (e.state !== 'hang') { e.state = 'hang'; e.threadY = e.y - 30; e.sway = e.x; }
          if (e.onGround) { e.state = 'move'; e.anim = null; e.cd = 0.4; break; }
          e.anim = 'aranha.hang';
          e.vy = d.speed * 0.75;
          e.vx = Math.cos(e.t * 2.2 + e._q) * 28 + (p.cx - e.cx) * 0.25;   // balança e mira de leve no jogador
          break;
        }
        approach(e, 'vx', dir * d.speed, 900 * dt);
        this._groundJumps(e, p, dx);
        e.vy = Math.min(e.vy + PHYS.g * dt, PHYS.maxFall);
        break;
      }
      case 'fly': {
        const n = dist || 1;
        const bob = Math.sin(e.t * 3) * 40;
        approach(e, 'vx', (dx / n) * d.speed, 300 * dt);
        approach(e, 'vy', (dy / n) * d.speed + bob, 300 * dt);
        break;
      }
      case 'swoop':
      case 'flycharge': {
        if (e.state === 'tele') {
          e.vx *= 0.85; e.vy *= 0.85;
          e.st -= dt;
          if (e.st <= 0) {
            const n = Math.hypot(e.lockX - e.cx, e.lockY - e.cy) || 1;
            const sp = d.ai === 'swoop' ? 330 : 390;
            e.vx = ((e.lockX - e.cx) / n) * sp; e.vy = ((e.lockY - e.cy) / n) * sp;
            e.state = 'dash'; e.st = d.ai === 'swoop' ? 0.6 : 0.45;
          }
        } else if (e.state === 'dash') {
          e.st -= dt;
          if (e.st <= 0) { e.state = 'move'; e.cd = d.ai === 'swoop' ? 2.2 : 1.6; }
        } else {
          const tx = p.cx, ty = d.ai === 'swoop' ? p.cy - 90 : p.cy;
          const ddx = tx - e.cx, ddy = ty - e.cy, n = Math.hypot(ddx, ddy) || 1;
          const wave = Math.sin(e.t * 5) * 60;
          approach(e, 'vx', (ddx / n) * d.speed, 320 * dt);
          approach(e, 'vy', (ddy / n) * d.speed + wave, 320 * dt);
          if (e.cd <= 0 && dist < (d.ai === 'swoop' ? 260 : 210)) {
            e.state = 'tele'; e.st = d.ai === 'swoop' ? 0.4 : 0.35; e.flash = e.st;
            e.lockX = p.cx; e.lockY = p.cy;
          }
        }
        break;
      }
      case 'prop': {
        e.vx *= 0.8;
        e.vy = Math.min(e.vy + PHYS.g * dt, PHYS.maxFall);
        break;
      }
      case 'gunner': {
        const adx = Math.abs(dx);
        if (e.state === 'tele') {
          approach(e, 'vx', 0, 1200 * dt);
          e.st -= dt;
          if (e.st <= 0) { this._fire(e, p, 'bolt', 360); e.state = 'move'; e.cd = d.shotCd || 2.4; }
        } else {
          approach(e, 'vx', adx > 210 ? dir * d.speed : 0, 600 * dt);
          this._groundJumps(e, p, dx);
          if (e.cd <= 0 && adx < 300 && Math.abs(dy) < 90) { e.state = 'tele'; e.st = 0.6; e.flash = 0.6; e.lockX = dir; }
        }
        e.vy = Math.min(e.vy + PHYS.g * dt, PHYS.maxFall);
        break;
      }
      case 'sniper': {
        const side = e.cx >= p.cx ? 1 : -1;
        const tx = p.cx + side * 175, ty = p.cy - 45 + Math.sin(e.t * 2) * 15;
        if (e.state === 'tele') {
          e.vx *= 0.85; e.vy *= 0.85;
          e.st -= dt;
          if (e.st <= 0) { this._fire(e, p, 'laser', 560); e.state = 'shoot'; e.st = 0.25; e.cd = 2.2; }
        } else if (e.state === 'shoot') {
          e.st -= dt; e.vx *= 0.9; e.vy *= 0.9;
          if (e.st <= 0) e.state = 'move';
        } else {
          const ddx = tx - e.cx, ddy = ty - e.cy, n = Math.hypot(ddx, ddy) || 1;
          const sp = Math.min(d.speed, n * 3);
          approach(e, 'vx', (ddx / n) * sp, 300 * dt);
          approach(e, 'vy', (ddy / n) * sp, 300 * dt);
          if (e.cd <= 0 && n < 60) { e.state = 'tele'; e.st = 0.5; e.flash = 0.5; }
        }
        e.facing = dir;
        break;
      }
      // ----- v0.8 -----
      case 'brawler': {                            // anda até perto, prepara e golpeia (pinça, mordida ou pancada no chão)
        if (e.state === 'tele') {
          approach(e, 'vx', 0, 1500 * dt);
          if ((e.st -= dt) <= 0) { this._strike(e, p); e.state = 'rec'; e.st = d.strike === 'slam' ? 0.6 : 0.4; }
        } else if (e.state === 'rec') {
          approach(e, 'vx', 0, 1200 * dt);
          if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = d.tier === 'tank' ? 1.8 : 1.3; }
        } else {
          approach(e, 'vx', dir * d.speed, 900 * dt);
          this._groundJumps(e, p, dx);
          if (e.cd <= 0 && Math.abs(dx) < d.reach + e.w / 2 && Math.abs(dy) < 60) { e.state = 'tele'; e.st = d.tele || 0.4; e.flash = e.st; e.lockX = dir; }
        }
        e.vy = Math.min(e.vy + PHYS.g * dt, PHYS.maxFall);
        break;
      }
      case 'hopper': {                             // só se move pulando; canguru dá soco de perto, sapo cospe ácido
        if (e.state === 'tele') {
          approach(e, 'vx', 0, 1500 * dt);
          if ((e.st -= dt) <= 0) {
            if (d.spit) { this._spit(e, p); e.state = 'move'; e.cd = 2.4; }
            else { e.state = 'punch'; e.st = 0.16; e.vx = e.lockX * 340; this.game.fx.slash(e.cx + e.lockX * 22, e.cy, e.lockX, 40, d.glow, 0, false, 'fx.slashA'); }
          }
        } else if (e.state === 'punch') {
          if (overlap(e, p, -10) && !p.isDead) this.game.damagePlayer(d.dmg * 1.3 * this.game.enemyDamageMult, e.cx);
          if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = 1.4; }
        } else {
          if (e.onGround) {
            e.vx *= 0.82;
            e.hopT = (e.hopT || 0) - dt;
            e.anim = null;
            const near = Math.abs(dx) < 46 && Math.abs(dy) < 40;
            if (d.punch && near && e.cd <= 0) { e.state = 'tele'; e.st = 0.25; e.flash = 0.25; e.lockX = dir; }
            else if (d.spit && e.cd <= 0 && dist < 260 && Math.abs(dx) > 70) { e.state = 'tele'; e.st = 0.4; e.flash = 0.4; e.lockX = dir; e.anim = 'sapo.tele'; }
            else if (e.hopT <= 0) { e.vy = -(d.hop + (p.bottom < e.y - 40 ? 160 : 0)); e.vx = dir * d.speed; e.hopT = 0.45 + Math.random() * 0.35; }
          } else if (d.spit) e.anim = 'sapo.leap';
        }
        e.vy = Math.min(e.vy + PHYS.g * dt, PHYS.maxFall);
        break;
      }
      case 'leaper': {                             // bode: agacha, salta com foguetes num arco e cai com pisão
        if (e.state === 'tele') {
          approach(e, 'vx', 0, 1500 * dt); e.anim = 'bode.tele';
          if ((e.st -= dt) <= 0) {
            e.state = 'leap'; e.st = 0;
            e.vy = -600; e.vx = Math.max(-330, Math.min(330, (p.cx - e.cx) / 0.85));
            this.game.fx.sfx('dash');
          }
        } else if (e.state === 'leap') {
          e.st += dt; e.anim = 'bode.leap';
          if (Math.random() < 0.6) this.game.fx.emit(e.cx - e.facing * 12, e.y + e.h - 4, 1, '#ff9a3c', 70, 0.3, 2, -50);
          if (e.onGround && e.st > 0.15) { this._strike(e, p, 'stomp'); e.state = 'rec'; e.st = 0.45; e.anim = 'bode.atk'; }
        } else if (e.state === 'rec') {
          approach(e, 'vx', 0, 1200 * dt);
          if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = 2.2; e.anim = null; }
        } else {
          approach(e, 'vx', dir * d.speed, 900 * dt);
          this._groundJumps(e, p, dx);
          if (e.cd <= 0 && e.onGround && Math.abs(dx) < 300 && Math.abs(dx) > 60) { e.state = 'tele'; e.st = 0.45; e.flash = 0.45; }
        }
        e.vy = Math.min(e.vy + PHYS.g * dt, PHYS.maxFall);
        break;
      }
      case 'stealth': {                            // camaleão: chega invisível; perto, aparece e dá uma linguada
        e.cloak = e.state === 'move' && dist > 90;
        if (e.state === 'tele') {
          approach(e, 'vx', 0, 1500 * dt);
          if ((e.st -= dt) <= 0) { e.state = 'atk'; e.st = 0.2; this._strike(e, p, 'tongue'); }
        } else if (e.state === 'atk') {
          if ((e.st -= dt) <= 0) { e.state = 'rec'; e.st = 0.5; }
        } else if (e.state === 'rec') {
          approach(e, 'vx', 0, 1200 * dt);
          if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = 1.8; }
        } else {
          approach(e, 'vx', dir * d.speed, 700 * dt);
          this._groundJumps(e, p, dx);
          if (e.cd <= 0 && dist < 95 && Math.abs(dy) < 40) { e.state = 'tele'; e.st = 0.4; e.flash = 0.4; e.lockX = dir; }
        }
        e.vy = Math.min(e.vy + PHYS.g * dt, PHYS.maxFall);
        break;
      }
      case 'roller': {                             // ouriço: enrola, rola rápido (ricocheteia na parede) e solta espinhos
        if (e.state === 'tele') {
          approach(e, 'vx', 0, 1500 * dt); e.anim = 'ourico.atk';
          if ((e.st -= dt) <= 0) { e.state = 'roll'; e.st = 1.3; }
        } else if (e.state === 'roll') {
          e.vx = e.lockX * 340; e.anim = 'ourico.atk';
          if (e.hitWall !== 0) e.lockX = -e.lockX;
          if ((e.st -= dt) <= 0) {
            for (let i = 0; i < 6; i++) { const a = Math.PI + (i / 5) * Math.PI; this.shoot(e.cx, e.cy, Math.cos(a) * 180, Math.sin(a) * 180, 'orb', d.dmg * 0.8, { color: '#7dff4d', grav: 400, life: 1.4 }); }
            e.state = 'move'; e.cd = 2.4; e.anim = null;
          }
        } else {
          approach(e, 'vx', dir * d.speed, 700 * dt);
          this._groundJumps(e, p, dx);
          if (e.cd <= 0 && e.onGround && Math.abs(dx) < 240 && Math.abs(dy) < 40) { e.state = 'tele'; e.st = 0.45; e.flash = 0.45; e.lockX = dir; }
        }
        e.vy = Math.min(e.vy + PHYS.g * dt, PHYS.maxFall);
        break;
      }
      case 'pulse': {                              // medusa: nada em impulsos e dá choque em volta
        if (e.state === 'tele') {
          e.vx *= 0.9; e.vy *= 0.9;
          if ((e.st -= dt) <= 0) { this._strike(e, p, 'zap'); e.state = 'move'; e.cd = 2.8; }
          break;
        }
        e.vx *= 0.965; e.vy *= 0.965;
        e.hopT = (e.hopT || 0) - dt;
        if (e.hopT <= 0) { const n = dist || 1; e.vx = (dx / n) * d.speed; e.vy = (dy / n) * d.speed - 30; e.hopT = 1.1; }
        if (e.cd <= 0 && dist < 80) { e.state = 'tele'; e.st = 0.5; e.flash = 0.5; }
        break;
      }
      case 'bomber': {                             // rato-asa: voa por cima e solta bombas
        const tx = p.cx + Math.sin(e.t * 1.3 + e._q) * 70, ty = p.cy - 150;
        const ddx = tx - e.cx, ddy = ty - e.cy, n = Math.hypot(ddx, ddy) || 1;
        approach(e, 'vx', (ddx / n) * Math.min(d.speed, n * 2), 300 * dt);
        approach(e, 'vy', (ddy / n) * Math.min(d.speed, n * 2), 300 * dt);
        if (e.cd <= 0 && Math.abs(dx) < 70 && dy > 60) { this.shoot(e.cx, e.y + e.h, e.vx * 0.3, 40, 'acorn', d.dmg, { color: '#c04dff', life: 2 }); e.cd = 1.9; }
        break;
      }
      case 'kamikaze': {                           // vaga-lume: voa tremido até o jogador, pisca e explode
        if (e.state === 'tele') {
          e.vx *= 0.9; e.vy *= 0.9;
          e.flash = (Math.floor(e.st * 14) % 2) ? 0.05 : 0;
          if ((e.st -= dt) <= 0) { this._strike(e, p, 'boom'); this.remove(e); }
          break;
        }
        const n = dist || 1;
        approach(e, 'vx', (dx / n) * d.speed + Math.cos(e.t * 7 + e._q) * 60, 400 * dt);
        approach(e, 'vy', (dy / n) * d.speed + Math.sin(e.t * 9 + e._q) * 60, 400 * dt);
        if (dist < 44) { e.state = 'tele'; e.st = 0.6; }
        break;
      }
      case 'lantern': {                            // peixe-lanterna: cardume que mantém distância e cospe luz
        if (e.state === 'tele') {
          e.vx *= 0.9; e.vy *= 0.9; e.facing = e.lockX;
          if ((e.st -= dt) <= 0) {
            const a = Math.atan2(p.cy - e.cy, p.cx - e.cx);
            this.shoot(e.cx + e.lockX * 16, e.cy + 2, Math.cos(a) * 210, Math.sin(a) * 210, 'bolt', d.dmg, { color: '#ffe14d' });
            e.state = 'shot'; e.st = 0.3; this.game.fx.sfx('laser');
          }
          break;
        }
        if (e.state === 'shot') { e.anim = 'peixe.atk'; e.vx *= 0.92; e.vy *= 0.92; if ((e.st -= dt) <= 0) { e.state = 'move'; e.anim = null; e.cd = 2.4 + Math.random(); } break; }
        e.anim = null;
        const side = e.cx >= p.cx ? 1 : -1;
        const tx = p.cx + side * (110 + Math.sin(e._q * 7) * 30), ty = p.cy - 20 + Math.sin(e.t * 2.2 + e._q * 3) * 40;
        const ddx = tx - e.cx, ddy = ty - e.cy, n = Math.hypot(ddx, ddy) || 1;
        approach(e, 'vx', (ddx / n) * Math.min(d.speed, n * 2), 260 * dt);
        approach(e, 'vy', (ddy / n) * Math.min(d.speed, n * 2), 260 * dt);
        e.facing = dir;
        if (e.cd <= 0 && dist < 230) { e.state = 'tele'; e.st = 0.5; e.flash = 0.5; e.lockX = dir; }
        break;
      }
      case 'squid': {                              // cyber-lula: nada em jatos, alinha com o jogador e solta um raio
        if (e.state === 'tele') {
          e.vx *= 0.88; e.vy *= 0.88; e.facing = e.lockX; e.anim = 'lula.tele';
          e.beam = { x: e.cx + e.lockX * 14, y: e.cy, a: e.lockX > 0 ? 0 : Math.PI, len: 170, warn: true, col: 'pink' };
          if ((e.st -= dt) <= 0) { e.state = 'zap'; e.st = 0.45; this.game.fx.sfx('laser'); }
          break;
        }
        if (e.state === 'zap') {
          e.vx *= 0.9; e.vy *= 0.9; e.facing = e.lockX; e.anim = 'lula.atk';
          const bx = e.cx + e.lockX * 14, by = e.cy;
          e.beam = { x: bx, y: by, a: e.lockX > 0 ? 0 : Math.PI, len: 170, col: 'pink', w: 0.55, zig: true };
          const along = (p.cx - bx) * e.lockX;
          if (along > -6 && along < 176 && Math.abs(p.cy - by) < 14 && !p.isDead) this.game.damagePlayer(d.dmg * this.game.enemyDamageMult, bx);
          if ((e.st -= dt) <= 0) { e.state = 'move'; e.beam = null; e.anim = null; e.cd = 2.6; }
          break;
        }
        e.anim = null; e.beam = null;
        e.vx *= 0.97; e.vy *= 0.97;
        e.hopT = (e.hopT || 0) - dt;
        const side = e.cx >= p.cx ? 1 : -1;
        const tx = p.cx + side * 140, ty = p.cy;
        if (e.hopT <= 0) {                          // jato: impulso para o ponto de tiro
          const ddx = tx - e.cx, ddy = ty - e.cy, n = Math.hypot(ddx, ddy) || 1;
          e.vx = (ddx / n) * d.speed * Math.min(1, n / 60 + 0.4); e.vy = (ddy / n) * d.speed * Math.min(1, n / 60 + 0.4);
          e.hopT = 0.9;
          if (this.game.water) this.game.water.emit(e.cx, e.y + e.h, 2, 4);
        }
        e.facing = dir;
        if (e.cd <= 0 && Math.abs(p.cy - e.cy) < 26 && Math.abs(dx) < 175 && Math.abs(dx) > 40) { e.state = 'tele'; e.st = 0.6; e.flash = 0.6; e.lockX = dir; }
        break;
      }
      case 'swim': {                               // tubarão: ronda em ondas, mira, avisa (boca aberta) e dá o bote
        if (e.state === 'tele') {
          e.vx *= 0.88; e.vy *= 0.88; e.facing = e.lockX; e.anim = e.type + (e.type === 'tubarao' ? '.atk' : '.tele');
          if ((e.st -= dt) <= 0) {
            const n = Math.hypot(e.aimX, e.aimY) || 1;
            e.vx = (e.aimX / n) * d.lunge; e.vy = (e.aimY / n) * d.lunge * 0.6;
            e.state = 'lunge'; e.st = 0.55; e.hitDone = false;
            this.game.fx.sfx('dash');
            if (this.game.water) this.game.water.emit(e.cx - e.lockX * 26, e.cy, 4, 6);
          }
          break;
        }
        if (e.state === 'lunge') {
          e.facing = e.lockX; e.anim = e.type + '.atk';
          e.vx *= 0.985; e.vy *= 0.96;
          if (d.mini && !e.hitDone && Math.abs(p.cx - e.cx) < e.w * 0.7 && Math.abs(p.cy - e.cy) < 30) {   // mordida do mini-chefe
            e.hitDone = true; this.game.damagePlayer(d.dmg * 1.3 * this.game.enemyDamageMult, e.cx); this.game.fx.shake(5);
          }
          if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = 2.2; e.anim = null; }
          break;
        }
        e.anim = null;
        const side = e.cx >= p.cx ? 1 : -1;
        const tx = p.cx + side * 120, ty = p.cy + Math.sin(e.t * 1.6 + e._q) * 36;
        const ddx = tx - e.cx, ddy = ty - e.cy, n = Math.hypot(ddx, ddy) || 1;
        approach(e, 'vx', (ddx / n) * Math.min(d.speed, n * 2), 220 * dt);
        approach(e, 'vy', (ddy / n) * Math.min(d.speed * 0.7, n * 2), 180 * dt);
        if (Math.abs(e.vx) > 8) e.facing = e.vx > 0 ? 1 : -1;
        if (e.cd <= 0 && dist < 190 && Math.abs(dy) < 70) {
          e.state = 'tele'; e.st = 0.5; e.flash = 0.5; e.lockX = dir; e.aimX = dx; e.aimY = dy;
        }
        break;
      }
      case 'jetgunner': {                          // leão-marinho: voa de lado e dispara rajada de 3
        const side = e.cx >= p.cx ? 1 : -1;
        const tx = p.cx + side * 170, ty = p.cy - 30 + Math.sin(e.t * 2) * 20;
        if (e.state === 'tele') {
          e.vx *= 0.85; e.vy *= 0.85;
          if ((e.st -= dt) <= 0) { e.state = 'shoot'; e.st = 0.4; e.burst = 3; e.bt = 0; }
        } else if (e.state === 'shoot') {
          e.vx *= 0.9; e.vy *= 0.9;
          e.bt -= dt;
          if (e.burst > 0 && e.bt <= 0) { e.burst--; e.bt = 0.12; this.shoot(e.cx + dir * 20, e.cy, dir * 330, (dy / (Math.abs(dx) || 1)) * 60, 'bolt', d.dmg, { color: '#5ef0ff' }); this.game.fx.sfx('laser'); }
          if ((e.st -= dt) <= 0) { e.state = 'move'; e.cd = 2.4; }
        } else {
          const ddx = tx - e.cx, ddy = ty - e.cy, n = Math.hypot(ddx, ddy) || 1;
          approach(e, 'vx', (ddx / n) * Math.min(d.speed, n * 3), 300 * dt);
          approach(e, 'vy', (ddy / n) * Math.min(d.speed, n * 3), 300 * dt);
          if (e.cd <= 0 && n < 50) { e.state = 'tele'; e.st = 0.45; e.flash = 0.45; }
        }
        e.facing = dir;
        break;
      }
      case 'caster': {                             // coruja: fica no alto e solta mini-drones teleguiados
        const side = e.cx >= p.cx ? 1 : -1;
        const tx = p.cx + side * 190, ty = p.cy - 120 + Math.sin(e.t * 1.6) * 20;
        if (e.state === 'tele') {
          e.vx *= 0.88; e.vy *= 0.88;
          if ((e.st -= dt) <= 0) {
            for (const k of [-1, 1]) this.shoot(e.cx, e.cy, dir * 80, k * 90, 'orb', d.dmg, { color: '#c04dff', life: 3.2, home: 2.4, speed: 150 });
            e.state = 'move'; e.cd = 3.2; this.game.fx.sfx('laser');
          }
        } else {
          const ddx = tx - e.cx, ddy = ty - e.cy, n = Math.hypot(ddx, ddy) || 1;
          approach(e, 'vx', (ddx / n) * Math.min(d.speed, n * 2), 260 * dt);
          approach(e, 'vy', (ddy / n) * Math.min(d.speed, n * 2), 260 * dt);
          if (e.cd <= 0 && n < 80) { e.state = 'tele'; e.st = 0.5; e.flash = 0.5; }
        }
        e.facing = dir;
        break;
      }
      case 'charger': {
        if (e.state === 'tele') {
          approach(e, 'vx', 0, 1500 * dt);
          e.st -= dt;
          if (e.st <= 0) { e.state = 'charge'; e.st = d.chargeTime || 0.5; e.vx = e.lockX * (d.chargeSpeed || 380); }
        } else if (e.state === 'charge') {
          e.vx = e.lockX * (d.chargeSpeed || 380);
          if (d.sparks && Math.random() < 0.5) this.game.fx.emit(e.cx - e.lockX * e.w / 2, e.y + e.h, 1, '#ffd84d', 80, 0.3, 2);
          e.st -= dt;
          if (e.st <= 0 || e.hitWall !== 0) { e.state = 'rec'; e.st = 0.4; }
        } else if (e.state === 'rec') {
          approach(e, 'vx', 0, 1200 * dt);
          e.st -= dt;
          if (e.st <= 0) { e.state = 'move'; e.cd = 1.8; }
        } else {
          approach(e, 'vx', dir * d.speed, 900 * dt);
          this._groundJumps(e, p, dx);
          if (e.cd <= 0 && e.onGround && Math.abs(dx) < 230 && Math.abs(dy) < 50) {
            e.state = 'tele'; e.st = 0.65; e.flash = 0.65; e.lockX = dir;
          }
        }
        e.vy = Math.min(e.vy + PHYS.g * dt, PHYS.maxFall);
        break;
      }
    }
  }

  // Golpes corpo a corpo e explosões dos inimigos novos
  _strike(e, p, kind = e.def.strike) {
    const g = this.game, d = e.def, dm = g.enemyDamageMult;
    const dir = e.lockX || e.facing || 1;
    const front = (reach, h) => !p.isDead && Math.sign(p.cx - e.cx || dir) === dir && Math.abs(p.cx - e.cx) < reach + e.w / 2 && Math.abs(p.cy - e.cy) < h;
    if (kind === 'snap' || kind === 'bite') {
      if (kind === 'bite') e.vx = dir * 260;
      g.fx.slash(e.cx + dir * (e.w / 2 + 10), e.cy, dir, d.reach, d.glow, 0, false, 'fx.slashA');
      if (front(d.reach + 6, 40)) g.damagePlayer(d.dmg * 1.3 * dm, e.cx);
      g.fx.sfx('claw');
    } else if (kind === 'tongue') {
      e.tongue = 0.2;
      if (front(80, 30)) g.damagePlayer(d.dmg * 1.2 * dm, e.cx);
      g.fx.sfx('claw');
    } else if (kind === 'slam' || kind === 'stomp') {
      const r = kind === 'slam' ? 90 : 60;
      g.fx.effect('ring', { x: e.cx, y: e.y + e.h - 4, r: 6, maxR: r, color: d.glow, life: 0.35 });
      g.fx.shake(kind === 'slam' ? 6 : 3); g.fx.sfx('boom');
      if (kind === 'slam') g.juice.shock(e.cx, e.y + e.h - 4, 100, 0.06, 0.4);
      if (!p.isDead && Math.abs(p.cx - e.cx) < r && Math.abs(p.bottom - (e.y + e.h)) < 40) g.damagePlayer(d.dmg * 1.2 * dm, e.cx);
      if (kind === 'slam') for (const s of [-1, 1]) this.shoot(e.cx + s * 24, e.y + e.h - 8, s * 220, 0, 'wave', d.dmg * 0.7, { color: d.glow, life: 1.2, ghost: true });
    } else if (kind === 'zap') {
      g.fx.effect('ring', { x: e.cx, y: e.cy, r: 6, maxR: 60, color: '#5ef0ff', life: 0.3 });
      g.fx.sfx('laser');
      if (!p.isDead && Math.hypot(p.cx - e.cx, p.cy - e.cy) < 58) g.damagePlayer(d.dmg * 1.3 * dm, e.cx);
    } else if (kind === 'boom') {
      g.fx.explosion(e.cx, e.cy, d.glow, 50);
      g.juice.shock(e.cx, e.cy, 70, 0.06, 0.35);
      g.fx.sfx('boom');
      if (!p.isDead && Math.hypot(p.cx - e.cx, p.cy - e.cy) < 58) g.damagePlayer(d.dmg * dm, e.cx);
    }
  }

  _spit(e, p) {
    const T = 0.8, G = 700;
    const vx = (p.cx - e.cx) / T, vy = (p.cy - e.cy - 0.5 * G * T * T) / T;
    this.shoot(e.cx + e.facing * 10, e.y + 6, vx, vy, 'orb', e.def.dmg, { color: '#9dff4d', grav: G, life: 2 });
    this.game.fx.sfx('throw');
  }

  _groundJumps(e, p, dx) {
    if (!e.onGround) return;
    if (e.hitWall !== 0) { e.vy = -e.def.jump; return; }
    if (e.cd <= 0 && p.bottom < e.y - 30 && Math.abs(dx) < 170) { e.vy = -(e.def.jump + 60); e.cd = 1.2 + Math.random(); }
  }

  _separate(e) {
    const r = Math.max(e.w, e.h);
    const near = this.grid.query(e.cx - r - 24, e.cy - r - 24, e.cx + r + 24, e.cy + r + 24, this._near);
    for (let i = 0; i < near.length; i++) {
      const o = near[i];
      if (o === e || !o.active || o.def.prop) continue;
      const dx = e.cx - o.cx, dy = e.cy - o.cy;
      const ox = (e.w + o.w) * 0.5 - Math.abs(dx);
      const oy = (e.h + o.h) * 0.5 - Math.abs(dy);
      if (ox <= 0 || oy <= 0) continue;
      const sx = dx === 0 ? (e._q & 1 ? 1 : -1) : Math.sign(dx);
      if (e.def.flying) {
        e.x += sx * ox * 0.25;
        e.y += Math.sign(dy || 1) * oy * 0.25;
      } else {
        e.vx += sx * Math.min(ox, 12) * 6;
      }
    }
  }

  _move(e, dt) {
    if (e.def.flying) {
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.y > -e.h - 2) { e.y = -e.h - 2; e.vy = Math.min(e.vy, 0); }   // não afunda no chão
      if (PHYS.water && e.y < WATER.top && !e.def.boss) { e.y = WATER.top; e.vy = Math.max(e.vy, 0); }   // nem passa da superfície
      return;
    }
    e.hitWall = moveX(this.game.world, e, e.vx * dt);
    if (e.hitWall !== 0 && e.state !== 'charge') e.vx = 0;
    const hy = moveY(this.game.world, e, e.vy * dt, true);
    e.onGround = hy === 1;
    if (hy !== 0) e.vy = 0;
  }

  // ---------- Dano nos inimigos ----------

  hurt(e, amount, srcX, knock = 60) {
    if (!e.active) return;
    const g = this.game;
    let crit = false;
    if (g.critChance > 0 && amount < 1e5 && Math.random() < g.critChance) {   // Ataque Crítico (Esconderijo)
      amount *= g.critMult; crit = true;
      g.crits++;
      g.fx.crit(e);
    }
    e.hp -= amount;
    e.flash = 0.08;
    if (e.t - (e.hurtAt || -9) > 0.45) { e.hurtAt = e.t; e.hurtT = e.def.boss ? 0 : 0.14; }   // quadro de dano (folhas que têm)
    const resist = e.def.kbResist || 0;
    if (knock > 0) {
      e.vx += Math.sign(e.cx - srcX || 1) * knock * (1 - resist);
      e.stun = Math.max(e.stun, 0.08 * (1 - resist));
      if (!e.def.boss && (e.state === 'tele' || e.state === 'charge')) { e.state = 'move'; e.cd = Math.max(e.cd, 0.6); }
    }
    this.game.fx.enemyHit(e, amount, crit);
    if (e.hp <= 0) this.kill(e);
  }

  kill(e) {
    if (!e.active) return;
    this.remove(e);
    if (e.def.prop) this.game.onPropBroken(e);
    else this.game.onEnemyKilled(e);
  }

  countProps() {
    let n = 0;
    for (const e of this.pool) if (e.active && e.def.prop) n++;
    return n;
  }

  remove(e) {
    if (!e.active) return;
    e.active = false;
    if (this.game.boss === e) this.game.boss = null;
    this.count--;
  }

  // Explosão do revive: empurra para longe todos os inimigos visíveis (GDD 10.1)
  blastFrom(x, y, view) {
    for (const e of this.pool) {
      if (!e.active || e.def.prop || e.def.boss) continue;
      if (e.cx < view.left - 40 || e.cx > view.right + 40 || e.cy < view.top - 40 || e.cy > view.bottom + 40) continue;
      const dx = e.cx - x, dy = e.cy - y, n = Math.hypot(dx, dy) || 1;
      const resist = e.def.kbResist ? 0.5 : 1;
      e.vx = (dx / n) * 900 * resist;
      e.vy = e.def.flying ? (dy / n) * 700 * resist : -420 * resist;
      e.stun = 0.9;
      e.state = 'move'; e.cd = Math.max(e.cd, 1.2);
    }
    for (const s of this.shots) s.active = false;
  }

  // ---------- Tiros inimigos (bolotas do esquilo) ----------

  // Tiro reto (canhão do Panda, laser do Drone Voador)
  _fire(e, p, kind, speed) {
    const s = this.shots.find((o) => !o.active);
    if (!s) return;
    s.active = true; s.kind = kind; s.life = 2.2; s.dmg = e.def.dmg; s.grav = 0; s.ghost = false; s.r = 4;
    s.x = e.cx + e.facing * e.w * 0.45; s.y = kind === 'laser' ? e.cy + 2 : e.cy - 6;
    const dx = p.cx - s.x, dy = p.cy - s.y, n = Math.hypot(dx, dy) || 1;
    s.vx = (dx / n) * speed; s.vy = kind === 'laser' ? (dy / n) * speed : (dy / n) * speed * 0.6;
    this.game.fx.sfx(kind === 'laser' ? 'laser' : 'cannon');
  }

  // Tiro genérico (chefes): orbes, cubos, ondas de choque no chão (ghost = atravessa o cenário)
  shoot(x, y, vx, vy, kind, dmg, opt = {}) {
    const s = this.shots.find((o) => !o.active);
    if (!s) return null;
    s.active = true; s.kind = kind; s.x = x; s.y = y; s.vx = vx; s.vy = vy; s.dmg = dmg;
    s.life = opt.life || 2.6; s.color = opt.color || '#ff4df0'; s.grav = opt.grav || 0; s.ghost = !!opt.ghost;
    s.home = opt.home || 0; s.speed = opt.speed || Math.hypot(vx, vy);
    s.r = kind === 'wave' ? 10 : kind === 'cube' ? 9 : kind === 'orb' ? 7 : 4; s.t = 0;
    return s;
  }

  _throwAcorn(e, p) {
    const s = this.shots.find((o) => !o.active);
    if (!s) return;
    const T = 0.9, G = 900;
    s.active = true; s.kind = 'acorn'; s.x = e.cx; s.y = e.y + 4; s.life = 3; s.grav = 0; s.ghost = false; s.r = 4;
    s.vx = (p.cx - s.x) / T;
    s.vy = (p.cy - s.y - 0.5 * G * T * T) / T;
    s.dmg = e.def.dmg;
    this.game.fx.sfx('throw');
  }

  _stepShots(dt, p) {
    const g = this.game;
    for (const s of this.shots) {
      if (!s.active) continue;
      if (s.kind === 'acorn') s.vy += 900 * dt;
      if (s.grav) s.vy += s.grav * dt;
      if (s.home && !p.isDead) {                   // mini-drones da coruja: viram devagar na direção do jogador
        const a = Math.atan2(s.vy, s.vx), want = Math.atan2(p.cy - s.y, p.cx - s.x);
        let da = want - a; da = Math.atan2(Math.sin(da), Math.cos(da));
        const na = a + Math.max(-s.home * dt, Math.min(s.home * dt, da));
        s.vx = Math.cos(na) * s.speed; s.vy = Math.sin(na) * s.speed;
      }
      s.x += s.vx * dt; s.y += s.vy * dt;
      s.life -= dt; s.t = (s.t || 0) + dt;
      const r = s.r || 4;
      const hitPlayer = !p.isDead && s.x > p.x - r && s.x < p.x + p.w + r && s.y > p.y - r && s.y < p.y + p.h + (s.kind === 'wave' ? 2 : r);
      if (hitPlayer || s.life <= 0 || (!s.ghost && g.world.isSolidAt(s.x, s.y))) {
        s.active = false;
        if (s.kind === 'acorn') {
          g.fx.explosion(s.x, s.y, '#ff9a3c', 26);
          if (!p.isDead && Math.hypot(p.cx - s.x, p.cy - s.y) < 34) g.damagePlayer(s.dmg * g.enemyDamageMult, s.x);
        } else {
          g.fx.impact(s.x, s.y, s.kind);
          if (hitPlayer) g.damagePlayer(s.dmg * g.enemyDamageMult, s.x - s.vx * 0.05);
        }
      }
    }
  }
}

function approach(o, key, target, step) {
  const d = target - o[key];
  o[key] = Math.abs(d) <= step ? target : o[key] + Math.sign(d) * step;
}

function overlap(a, b, shrink) {
  return a.x < b.x + b.w - shrink && a.x + a.w > b.x + shrink && a.y < b.y + b.h - shrink && a.y + a.h > b.y + shrink;
}

// ---------------- Spawner por tempo (GDD 10.3) ----------------

export class Spawner {
  constructor(game) { this.game = game; this.reset(); }
  reset() { this.timer = 1.5; this.propTimer = 4; this.nextBoss = BOSS_FIRST; this.bossIdx = 0; this.warned = false; this.bossRetry = 0; }

  // Nível de pressão: n = setor (0..), p = quanto do setor já passou até o chefão (0 → 1, segue até 1,35)
  level() {
    const g = this.game;
    if (g.mode === 'journey' && g.map) {               // Jornada: dificuldade do mapa + fase; p = quanto do objetivo já foi feito
      return { n: g.diffN, p: Math.min(1.35, g.stageFrac()), cyc: g.map.cycle };
    }
    const n = g.sector || 0;
    const p = Math.min(1.35, (g.sectorTime || 0) / (g.sectorBossAt || 150));
    return { n, p, cyc: Math.floor(n / SECTOR_ORDER.length) };
  }

  step(dt) {
    const g = this.game;
    const L = this.level();
    this.propTimer -= dt;
    if (this.propTimer <= 0) { this.propTimer = 8; if (g.enemies.countProps() < 2) this._spawnProp(); }
    this._bossClock(dt);
    this._miniBoss();
    this.timer -= dt;
    if (this.timer > 0) return;
    this.timer = Math.max(0.55, 2.6 - 0.11 * L.n - 1.1 * L.p);                 // setor 1: 2,6 s → 1,5 s
    const alive = Math.min(70, Math.round(6 + 2.2 * L.n + L.p * (8 + 1.4 * L.n)));   // setor 1: 6 → 14 · setor 6: 17 → 32
    if (g.enemies.count >= alive * (g.boss ? 0.5 : 1)) return;                // com chefe em campo, metade da horda
    this._spawnGroup(L);
  }

  // Caixas destrutíveis aparecem no chão, fora da tela (12% de chance de ser a especial)
  _spawnProp() {
    const g = this.game, rng = g.rng, p = g.player, view = g.camera.view;
    const typeId = rng.chance(0.12) ? 'loot' : 'caixa';
    const def = ENEMY_TYPES[typeId];
    const side = p.input.moveDir || (rng.chance(0.5) ? 1 : -1);
    const x = side > 0 ? view.right + rng.range(30, 120) : view.left - rng.range(30, 120);
    const sy = g.world.surfaceNear(Math.floor(x / TILE), p.bottom, 1);
    if (sy !== null) g.enemies.spawn(typeId, x - def.w / 2, sy - def.h - 0.5, 1);
  }

  // Marcos de tempo: aviso 3 s antes e o chefe entra (só um por vez)
  // Um chefão por setor, depois de g.sectorBossAt segundos no setor (vencido → portal; ver game._openPortal)
  // Mini-chefe do setor submerso: o Querubim-Tubarão aparece uma vez, na metade do caminho até o chefão
  _miniBoss() {
    const g = this.game;
    if (!g.water || g.mode === 'journey' || this.miniFor === g.sector || g.boss || g.sectorCleared) return;
    if (g.sectorTime < g.sectorBossAt * 0.5) return;
    const p = g.player, view = g.camera.view, side = p.input.moveDir || 1, d = ENEMY_TYPES.querubim;
    const x = side > 0 ? view.right + 40 : view.left - 40 - d.w;
    const e = g.enemies.spawn('querubim', x, Math.min(p.cy - d.h / 2, -d.h - 20), g.sectorMult * (1 + 0.03 * (g.runTime / 60)));
    if (!e) return;
    this.miniFor = g.sector;
    if (g.ui) g.ui.showBiome({ name: d.name.toUpperCase(), color: d.glow }, '⚠ MINI-CHEFE ⚠', true);
    g.audio.sfx('alarm');
  }

  _bossClock(dt) {
    const g = this.game;
    if (g.boss || g.sectorCleared) return;
    let id = BOSS_ORDER[this.bossIdx % BOSS_ORDER.length];
    if (g.water) {                                  // setor submerso: um dos chefões aquáticos (sorteado por partida)
      const q = g.params && g.params.get('wboss');
      id = this.waterBoss || (this.waterBoss = WATER_BOSSES.includes(q) ? q : WATER_BOSSES[g.rng.chance(0.5) ? 0 : 1]);
    }
    if (!this.warned && g.sectorTime >= g.sectorBossAt - 3) { this.warned = true; g.onBossWarning(BOSS_TYPES[id]); }
    if (g.sectorTime < g.sectorBossAt || (this.bossRetry -= dt) > 0) return;
    const cycle = Math.floor(this.bossIdx / BOSS_ORDER.length);
    const hpMult = g.mode === 'journey' && g.map
      ? (1 + JOURNEY.bossHpPerMap * g.map.n) * (1 + JOURNEY.bossHpPerCycle * g.map.cycle)
      : (1 + 0.04 * (g.runTime / 60)) * (1 + 0.75 * cycle);
    const e = this._spawnBoss(id, hpMult);
    if (!e) { this.bossRetry = 0.5; return; }
    this.bossIdx++; this.warned = false; this.waterBoss = null;
    g.onBossSpawn(e);
  }

  _spawnBoss(id, hpMult) {
    const g = this.game, p = g.player, view = g.camera.view, d = ENEMY_TYPES[id];
    const side = p.input.moveDir || 1;
    if (d.flying) return g.enemies.spawn(id, p.cx - d.w / 2 + side * 60, view.top - d.h + 10, hpMult);
    for (const s of [side, -side]) {
      const x = s > 0 ? view.right + 50 : view.left - 50;
      const sy = g.world.surfaceNear(Math.floor(x / TILE), p.bottom, Math.ceil(d.h / TILE));
      if (sy !== null) return g.enemies.spawn(id, x - d.w / 2, sy - d.h - 0.5, hpMult);
    }
    return null;
  }

  _spawnGroup(L) {
    const g = this.game, rng = g.rng, p = g.player, view = g.camera.view;
    const typeId = pickType(rng, L, biomeAt(Math.floor(p.cx / (TILE * CHUNK_W))).id);
    const def = ENEMY_TYPES[typeId];
    let n = 1;
    if (def.tier === 'medium') n = 1 + (rng.chance(Math.min(0.6, 0.12 * L.n + 0.2 * L.p)) ? 1 : 0) + (L.n >= 6 && rng.chance(0.3) ? 1 : 0);
    else if (def.tier === 'weak') n = rng.int(2, Math.min(9, 4 + Math.floor(L.n / 3) + Math.floor(L.p * 2)));
    const ahead = p.input.moveDir || (rng.chance(0.5) ? 1 : -1);
    const side = rng.chance(0.6) ? ahead : -ahead;
    const fromTop = def.flying && rng.chance(0.3);
    const hpMult = (1 + 0.1 * L.n) * (1 + 0.3 * L.p) * (1 + 0.6 * L.cyc);     // sobe com o setor e ao longo dele

    for (let i = 0; i < n; i++) {
      const off = 40 + i * 28 + rng.range(0, 30);
      let x = side > 0 ? view.right + off : view.left - off;
      let y;
      if (def.ai === 'dropper') {                  // aranhas caem do alto, perto do jogador
        x = p.cx + side * rng.range(30, 170) + (i - n / 2) * 34;
        y = view.top - 30 - i * 26;
        if (g.world.isSolidAt(x, y + def.h)) continue;
      } else if (def.flying) {
        if (fromTop) { x = rng.range(view.left + 20, view.right - 20); y = view.top - 40 - i * 20; }
        else y = Math.min(-def.h - 40, rng.range(view.top + 120, p.cy - 20));
      } else {
        const sy = g.world.surfaceNear(Math.floor(x / TILE), p.bottom, Math.ceil(def.h / TILE));
        if (sy === null) continue;
        y = sy - def.h - 0.5;
      }
      g.enemies.spawn(typeId, x - def.w / 2, y, hpMult);
    }
  }
}

// Escolhe o inimigo pelo elenco do cenário: primeiro o nível (fraco/médio/tanque), depois o tipo.
// Médios entram depois de ~15% do setor; tanques no fim do setor 1 e cada vez mais cedo nos seguintes.
function pickType(rng, L, biomeId) {
  const R = SECTOR_ROSTER[biomeId] || SECTOR_ROSTER.distrito;
  const { n, p } = L;
  const med = Math.min(1.5, 0.15 * n + Math.max(0, p - 0.15) * 0.85);
  const tank = n === 0 ? Math.max(0, p - 0.7) * 0.5 : Math.min(0.8, 0.06 * n + Math.max(0, p - 0.45) * 0.45);
  let roll = rng.next() * (1 + med + tank);
  const tier = roll < 1 ? 'weak' : roll < 1 + med ? 'medium' : 'tank';
  const list = R[tier].filter((r) => (r[2] || 0) <= p || n > 0);
  const pool = list.length ? list : R.weak;
  let total = 0;
  for (const r of pool) total += r[1];
  roll = rng.next() * total;
  for (const r of pool) { roll -= r[1]; if (roll < 0) return r[0]; }
  return pool[0][0];
}
