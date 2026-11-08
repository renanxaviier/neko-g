// Skills ativas (disparo automático por timer) e passivas, níveis 1–8, 4 + 4 slots, evoluções e sorteio das cartas.

import { SKILL_LIMITS, LIMITS, WEAPONS } from './config.js';

const MAX = SKILL_LIMITS.maxLevel;

export const SKILLS = {
  garras: {
    kind: 'active', name: 'Garras Elétricas', icon: '⚡', color: '#5ef0ff',
    evo: 'turbo', evoName: 'Garras Relâmpago', evoDesc: 'Cada golpe solta raios que saltam para 3 inimigos próximos.',
    desc: (l) => l === 1 ? 'Seu ataque: golpe elétrico à frente (botão ATAQUE).' : l === 5 ? 'Passa a golpear também para trás.' : '+dano, +alcance, mais rápido.',
  },
  shuriken: {
    kind: 'active', name: 'Shurikens de Holograma', icon: '✦', color: '#ff4df0',
    evo: 'resfriamento', evoName: 'Tempestade Holográfica', evoDesc: '+3 shurikens que ricocheteiam por muito mais tempo.',
    desc: (l) => l === 1 ? 'O ATAQUE também lança shurikens à frente; ricocheteiam nas paredes.' : l % 2 === 1 ? '+1 shuriken.' : '+dano e +ricochetes.',
  },
  drones: {
    kind: 'active', name: 'Drones Orbitais', icon: '◉', color: '#4dffa6',
    evo: 'ima', evoName: 'Enxame Magnético', evoDesc: '7 drones em órbita maior; o ímã fica 50% mais forte.',
    desc: (l) => l === 1 ? 'Um drone gira ao seu redor e fere quem encostar.' : l % 2 === 0 ? '+1 drone.' : '+dano, órbita maior.',
  },
  rastro: {
    kind: 'active', name: 'Rastro de Fogo', icon: '♨', color: '#ff8a2b',
    evo: 'blindagem', evoName: 'Inferno Neon', evoDesc: 'Fogo mais largo e forte; queima também enquanto você corre.',
    desc: (l) => l === 1 ? 'O dash deixa um rastro de fogo cibernético.' : '+dano e +duração do fogo.',
  },
  // ---- v0.9: primeiro lote de cartas novas (escolhido pelo produtor) ----
  raio: {
    kind: 'active', name: 'Raio em Cadeia', icon: '↯', color: '#bff6ff',
    evo: 'area', evoName: 'Tempestade Elétrica', evoDesc: 'Dois raios por vez, que saltam para até 10 inimigos sem perder força.',
    desc: (l) => l === 1 ? 'Automático: um raio atinge o inimigo mais próximo e salta para outros.' : l % 2 === 0 ? '+1 salto do raio.' : '+dano e dispara mais rápido.',
  },
  tesla: {
    kind: 'active', name: 'Campo Tesla', icon: '⊛', color: '#8c9bff',
    evo: 'vampirismo', evoName: 'Bobina Vampira', evoDesc: 'Campo 40% maior, e cada choque recupera um pouco de vida.',
    desc: (l) => l === 1 ? 'Automático: um campo elétrico ao seu redor dá choque em quem chegar perto.' : '+dano e +tamanho do campo.',
  },
  bumerangue: {
    kind: 'active', name: 'Bumerangue de Plasma', icon: '☾', color: '#ffb03c',
    evo: 'dashduplo', evoName: 'Bumerangue Duplo', evoDesc: 'Lança para os dois lados, +2 bumerangues, e cada dash também lança um.',
    desc: (l) => l === 1 ? 'Automático: um bumerangue vai e volta atravessando a horda.' : l % 3 === 0 ? '+1 bumerangue.' : '+dano e +alcance.',
  },
  vampirismo: { kind: 'passive', name: 'Vampirismo Digital', icon: '❣', color: '#ff3b5c', desc: (l) => `Cada abate recupera ${(0.3 * l).toFixed(1).replace('.', ',')}% do HP (até 2 vezes por segundo).` },
  area:       { kind: 'passive', name: 'Amplificador',       icon: '◎', color: '#ffd84d', desc: () => '+8% no tamanho de golpes, campos, raios e bumerangues.' },
  dashduplo:  { kind: 'passive', name: 'Dash Duplo',         icon: '⇉', color: '#5ef0ff', desc: (l) => l === 1 ? 'Ganha uma 2ª carga: dois dashes seguidos.' : '−6% na recarga do dash.' },
  ima:          { kind: 'passive', name: 'Ímã',          icon: '⊕', color: '#7fd8ff', desc: () => '+20% raio de coleta das G Batty.' },
  blindagem:    { kind: 'passive', name: 'Blindagem',    icon: '♥', color: '#ff5c8a', desc: () => '+10% de HP máximo (e cura esse valor).' },
  turbo:        { kind: 'passive', name: 'Turbo',        icon: '»', color: '#ffe14d', desc: () => '+5% de velocidade e de dash.' },
  resfriamento: { kind: 'passive', name: 'Resfriamento', icon: '❄', color: '#9ab8ff', desc: () => '−6% no tempo de recarga das skills.' },
};

const ACTIVE_IDS = Object.keys(SKILLS).filter((k) => SKILLS[k].kind === 'active');
const PASSIVE_IDS = Object.keys(SKILLS).filter((k) => SKILLS[k].kind === 'passive');

const stats = {
  garras: (l, evo) => ({ cd: 0.32 * Math.pow(0.96, l - 1) * (evo ? 0.8 : 1), dmg: (15 + 5 * (l - 1)) * (evo ? 1.3 : 1), range: 78 + 6 * l, back: l >= 5 }),
  shuriken: (l, evo) => ({ cd: 0.7 * Math.pow(0.95, l - 1), count: 1 + Math.floor((l - 1) / 2) + (evo ? 3 : 0), bounces: evo ? 8 : 2 + Math.floor(l / 3), dmg: 10 + 3 * l, life: evo ? 3.2 : 2.2, pierce: evo ? 6 : 3 }),
  drones: (l, evo) => ({ count: evo ? 7 : Math.min(5, 1 + Math.floor(l / 2)), radius: 54 + 3 * l + (evo ? 24 : 0), spin: 3 + 0.15 * l, dmg: 7 + 3 * l }),
  rastro: (l, evo) => ({ life: 1.4 + 0.12 * l, dps: (22 + 7 * l) * (evo ? 1.8 : 1), r: evo ? 22 : 14 }),
  raio: (l, evo) => ({ cd: 1.9 * Math.pow(0.94, l - 1), jumps: evo ? 10 : 2 + Math.floor(l / 2), dmg: 14 + 5 * l, range: 115, decay: evo ? 1 : 0.88, bolts: evo ? 2 : 1, reach: 290 }),
  tesla: (l, evo) => ({ cd: 0.5, r: (46 + 4 * l) * (evo ? 1.4 : 1), dmg: 6 + 3 * l }),
  bumerangue: (l, evo) => ({ cd: 1.7 * Math.pow(0.95, l - 1), count: 1 + Math.floor(l / 3) + (evo ? 2 : 0), dmg: 12 + 4 * l, dist: 190 + 8 * l, both: evo }),
};
const AUTO = ['raio', 'tesla', 'bumerangue'];        // ativas automáticas (não dependem do botão ATAQUE)

export class Skills {
  constructor(game) {
    this.game = game;
    this.actives = new Map();
    this.passives = new Map();
    this.evolved = new Set();
    this.timers = new Map();
    this.shots = Array.from({ length: LIMITS.projectiles }, () => ({ active: false }));
    this.fire = Array.from({ length: LIMITS.fire }, () => ({ active: false }));
    this.dronePos = Array.from({ length: 8 }, () => ({ x: 0, y: 0 }));
    this.droneCount = 0;
    this.droneAngle = 0;
    this._near = [];
    this._hitList = [];
    this._trailX = null;
    this._autoFireT = 0;
    this.booms = Array.from({ length: 14 }, () => ({ active: false }));
    this.banned = new Set();                         // cartas banidas nesta partida
    this.teslaPulse = 0; this.teslaR = 0;
    this._wasDashing = false;
  }

  reset(startSkills) {
    this.actives.clear(); this.passives.clear(); this.evolved.clear(); this.timers.clear(); this.banned.clear();
    for (const s of this.shots) s.active = false;
    for (const b of this.booms) b.active = false;
    this.teslaR = 0;
    for (const f of this.fire) f.active = false;
    // Arma exclusiva do personagem (comprada na tela de personagens): dispara sozinha
    const g = this.game, wid = g.char && g.char.weapon, wl = wid ? ((g.meta.weapons || {})[wid] || 0) : 0;
    this.weapon = wl ? { id: wid, lvl: wl, t: 1.2, def: WEAPONS[wid] } : null;
    this.swipes = this.swipes || Array.from({ length: 6 }, () => ({ active: false, hit: new Set() }));
    for (const w of this.swipes) w.active = false;
    this.waves = this.waves || Array.from({ length: 6 }, () => ({ active: false, hit: new Set() }));
    for (const w of this.waves) w.active = false;
    this.droneCount = 0;
    this._trailX = null;
    for (const id of [].concat(startSkills || [])) this.gain(id);
    this.applyPassives();
  }

  level(id) { return this.actives.get(id) || this.passives.get(id) || 0; }
  isEvolved(id) { return this.evolved.has(id); }

  gain(id) {
    const map = SKILLS[id].kind === 'active' ? this.actives : this.passives;
    map.set(id, Math.min(MAX, (map.get(id) || 0) + 1));
    if (SKILLS[id].kind === 'active' && !this.timers.has(id)) this.timers.set(id, 0.3);
    this.applyPassives();
  }

  evolve(id) { this.evolved.add(id); if (this.game.runStats) this.game.runStats.evos++; this.applyPassives(); }

  applyPassives() {
    const g = this.game;
    const ima = this.passives.get('ima') || 0;
    g.magnetMult = (1 + 0.2 * ima) * (this.evolved.has('drones') ? 1.5 : 1) * g.meta.magnetMult * (g.char ? g.char.magnetMult : 1) * ((g.tal && g.tal.magnet) || 1);
    g.cdMult = Math.pow(0.94, this.passives.get('resfriamento') || 0) * ((g.mod && g.mod.cd) || 1) * ((g.tal && g.tal.cd) || 1);   // + Ritmo (talento)   // Sobrecarga (Jornada)
    const turbo = 1 + 0.05 * (this.passives.get('turbo') || 0);
    g.player.speedMult = turbo * g.meta.speedMult * ((g.tal && g.tal.speed) || 1);
    g.player.dashMult = turbo * g.meta.dashMult;
    g.setMaxHpMult(1 + 0.1 * (this.passives.get('blindagem') || 0));
    g.areaMult = 1 + 0.08 * (this.passives.get('area') || 0);
    g.vampLvl = this.passives.get('vampirismo') || 0;
    const dd = this.passives.get('dashduplo') || 0;
    g.player.dashMax = dd ? 2 : 1;
    g.player.dashCdMult = Math.pow(0.94, Math.max(0, dd - 1)) * ((g.tal && g.tal.dash) || 1);
  }

  // ---------------- Simulação ----------------

  step(dt) {
    const g = this.game, p = g.player;
    if (p.isDead) return;

    // Garras e Shurikens: disparam quando o jogador aperta/segura ATAQUE, cada um no seu tempo de recarga
    const wants = g.input.wantsAttack();
    let fired = false;
    for (const [id, lvl] of this.actives) {
      if (id === 'drones' || id === 'rastro' || AUTO.includes(id)) continue;
      let t = this.timers.get(id) - dt;
      if (t <= 0 && wants) {
        fired = true;
        const evo = this.evolved.has(id);
        if (id === 'garras') this._claws(lvl, evo);
        else if (id === 'shuriken') this._shurikens(lvl, evo);
        t = (id === 'garras' ? stats.garras(lvl, evo).cd : stats.shuriken(lvl, evo).cd) * g.cdMult;
      }
      this.timers.set(id, Math.max(t, 0));
    }
    if (fired) g.input.consumeAttack();

    // Ativas automáticas: cada uma no seu tempo de recarga
    for (const id of AUTO) {
      const lvl = this.actives.get(id);
      if (!lvl) continue;
      let t = this.timers.get(id) - dt;
      if (t <= 0) {
        const evo = this.evolved.has(id);
        const ok = id === 'raio' ? this._raio(lvl, evo) : id === 'tesla' ? this._tesla(lvl, evo) : this._bumerangue(lvl, evo);
        t = ok === false ? 0.2 : stats[id](lvl, evo).cd * (id === 'tesla' ? 1 : g.cdMult);
      }
      this.timers.set(id, t);
    }
    // Tatu: o dash vira uma bola blindada que atropela (cada inimigo leva dano uma vez por dash)
    if (p.C.ballDash && p.isDashing) {
      if (!this._wasDashing) (this._ballHit || (this._ballHit = new Set())).clear();
      const near = g.enemies.grid.query(p.x - 20, p.y - 10, p.x + p.w + 20, p.y + p.h + 10, this._near);
      for (let i = 0; i < near.length; i++) {
        const e = near[i];
        if (!e.active || this._ballHit.has(e) || e.x > p.x + p.w + 8 || e.x + e.w < p.x - 8 || e.y > p.y + p.h || e.y + e.h < p.y) continue;
        this._ballHit.add(e);
        g.enemies.hurt(e, (22 + 3 * g.level) * g.damageMult, p.cx, 260);
        g.fx.emit(e.cx, e.cy, 5, '#ffd84d', 160, 0.3, 2);
      }
      if (this._ballHit.size && !this._ballShook) { g.fx.shake(3); this._ballShook = true; }
    } else this._ballShook = false;
    // Bumerangue Duplo: cada dash também lança um
    if (p.isDashing && !this._wasDashing && this.evolved.has('bumerangue')) this._throwBoom(p.dashDir || p.facing, 0, stats.bumerangue(this.actives.get('bumerangue'), true));
    this._wasDashing = p.isDashing;
    this.teslaPulse = Math.max(0, this.teslaPulse - dt);
    this._stepBooms(dt);

    if (this.weapon) this._weaponStep(dt);
    this._drones(dt);
    this._rastro(dt);
    this._stepShots(dt);
    this._stepFire(dt);
  }

  // ---------------- Armas exclusivas (v0.16) ----------------
  _weaponStep(dt) {
    const W = this.weapon, D = W.def, g = this.game;
    this._stepSwipes(dt); this._stepWaves(dt);
    if ((W.t -= dt) > 0) return;
    const near = this._nearestDist();
    if (near > 300) { W.t = 0.25; return; }            // ninguém perto: espera (não gasta o golpe no vazio)
    W.t = D.cd * Math.pow(D.cdMul, W.lvl - 1) * g.cdMult;
    const dmg = (D.dmg + D.dmgPer * (W.lvl - 1)) * g.damageMult;
    if (W.id === 'garrasE') this._wGarras(D, W.lvl, dmg);
    else if (W.id === 'corteDados') this._wDados(D, W.lvl, dmg);
    else if (W.id === 'martelo') this._wMartelo(D, W.lvl, dmg);
  }

  _nearestDist() {
    const p = this.game.player;
    const near = this.game.enemies.grid.query(p.cx - 300, p.cy - 300, p.cx + 300, p.cy + 300, this._near);
    let best = 1e9;
    for (let i = 0; i < near.length; i++) { const e = near[i]; if (e.active && !e.def.prop) best = Math.min(best, Math.abs(e.cx - p.cx) + Math.abs(e.cy - p.cy) * 0.5); }
    return best;
  }

  // Garras Energizadas (Gato): três garras que avançam atravessando tudo
  _wGarras(D, lvl, dmg) {
    const g = this.game, p = g.player, dirs = lvl >= 5 ? [p.facing, -p.facing] : [p.facing];
    for (const dir of dirs) {
      const w = this.swipes.find((o) => !o.active);
      if (!w) break;
      w.active = true; w.hit.clear();
      w.x = p.cx + dir * 20; w.y = p.cy - 6; w.dir = dir; w.left = D.range * g.areaMult; w.dmg = dmg; w.h = D.h * g.areaMult;
      g.fx.seq(D.anim, w.x + dir * 40, w.y, D.range / D.speed + 0.05, dir, 1.05 * g.areaMult, 0, dir * D.speed, true);
    }
    g.fx.sfx('claw');
  }

  _stepSwipes(dt) {
    const g = this.game, D = WEAPONS.garrasE;
    for (const w of this.swipes) {
      if (!w.active) continue;
      const step = D.speed * dt;
      w.x += w.dir * step; w.left -= step;
      if (w.left <= 0) { w.active = false; continue; }
      const x0 = Math.min(w.x, w.x + w.dir * 46), x1 = Math.max(w.x, w.x + w.dir * 46), y0 = w.y - w.h / 2, y1 = w.y + w.h / 2;
      const near = g.enemies.grid.query(x0 - 30, y0 - 30, x1 + 30, y1 + 30, this._near);
      for (let i = 0; i < near.length; i++) {
        const e = near[i];
        if (!e.active || w.hit.has(e) || e.x > x1 || e.x + e.w < x0 || e.y > y1 || e.y + e.h < y0) continue;
        w.hit.add(e);
        g.enemies.hurt(e, w.dmg, w.x - w.dir * 30, 120);
      }
    }
  }

  // Corte de Dados (Guaxinim): corte dos dois lados; quem é atingido trava (glitch)
  _wDados(D, lvl, dmg) {
    const g = this.game, p = g.player, r = D.r * g.areaMult * (lvl >= 5 ? 1.25 : 1), stun = D.stun * (lvl >= 5 ? 2 : 1);
    for (const dir of [1, -1]) g.fx.seq(D.anim, p.cx + dir * r * 0.55, p.cy - 4, 0.36, dir, r / 92, 0, 0, true);
    const near = g.enemies.grid.query(p.cx - r - 20, p.cy - r - 20, p.cx + r + 20, p.cy + r + 20, this._near);
    let n = 0;
    for (let i = 0; i < near.length; i++) {
      const e = near[i];
      if (!e.active || e.def.prop || Math.abs(e.cx - p.cx) > r + e.w / 2 || Math.abs(e.cy - p.cy) > r * 0.6 + e.h / 2) continue;
      g.enemies.hurt(e, dmg, p.cx, 40);
      if (!e.def.boss) e.stun = Math.max(e.stun, stun);
      if (n++ < 6) g.fx.emit(e.cx, e.cy, 3, '#4dffa6', 90, 0.35, 2);
    }
    if (n && g.juice) g.juice.glitch(0.12);
    g.fx.sfx('laser');
  }

  // Martelo de Impacto (Pug): pancada à frente + onda de choque pelo chão (duas no Nv 5)
  _wMartelo(D, lvl, dmg) {
    const g = this.game, p = g.player, dir = p.facing, fx = p.cx + dir * 46;
    g.fx.seq(D.anim, fx, p.bottom + 4, 0.42, dir, 1.05 * g.areaMult);
    const x0 = Math.min(p.cx, p.cx + dir * D.front * g.areaMult), x1 = Math.max(p.cx, p.cx + dir * D.front * g.areaMult);
    const near = g.enemies.grid.query(x0 - 20, p.cy - 70, x1 + 20, p.bottom + 20, this._near);
    for (let i = 0; i < near.length; i++) {
      const e = near[i];
      if (!e.active || e.x > x1 || e.x + e.w < x0 || e.y > p.bottom + 10 || e.y + e.h < p.cy - 60) continue;
      g.enemies.hurt(e, dmg, p.cx, D.knock);
    }
    g.fx.shake(5);
    if (g.juice) g.juice.shock(fx, p.bottom - 6, 90);
    this._wave(fx, p.bottom, dmg * D.waveDmg, D.wave * g.areaMult, 0.08);
    if (lvl >= 5) this._wave(fx, p.bottom, dmg * D.waveDmg, D.wave * 1.4 * g.areaMult, 0.4);
    g.fx.sfx('boom');
  }

  _wave(x, y, dmg, reach, delay) {
    const w = this.waves.find((o) => !o.active);
    if (!w) return;
    Object.assign(w, { active: true, x, y, dmg, reach, r: 0, delay });
    w.hit.clear();
  }

  _stepWaves(dt) {
    const g = this.game;
    for (const w of this.waves) {
      if (!w.active) continue;
      if ((w.delay -= dt) > 0) continue;
      const r0 = w.r; w.r += 620 * dt;
      if (w.r >= w.reach) { w.active = false; continue; }
      const near = g.enemies.grid.query(w.x - w.r - 20, w.y - 60, w.x + w.r + 20, w.y + 10, this._near);
      for (let i = 0; i < near.length; i++) {
        const e = near[i];
        if (!e.active || w.hit.has(e) || e.def.flying || e.y + e.h < w.y - 50) continue;
        if (Math.abs(e.cx - w.x) > w.r) continue;
        w.hit.add(e);
        g.enemies.hurt(e, w.dmg, w.x, 220);
        if (!e.def.boss) e.vy = Math.min(e.vy, -260);
      }
      if (Math.floor(r0 / 28) !== Math.floor(w.r / 28)) for (const s of [1, -1]) { g.fx.emit(w.x + s * w.r, w.y - 3, 3, '#ff9a3c', 110, 0.35, 2, 500); g.fx.emit(w.x + s * w.r, w.y - 2, 1, '#ffd84d', 60, 0.25, 3, 200); }
    }
  }

  // Garras: golpe em área à frente (e atrás a partir do Nv 5)
  _claws(lvl, evo) {
    const g = this.game, p = g.player;
    const s = { ...stats.garras(lvl, evo) };
    const mel = g.char.melee;
    s.range *= mel.range * g.areaMult;
    const dmg = s.dmg * g.damageMult * mel.dmg;
    p.attackT = 0;
    p.attackCombo = (p.attackCombo || 0) ^ 1;   // alterna as duas sequências de golpe da folha
    const sides = s.back ? [p.facing, -p.facing] : [p.facing];
    const hits = this._hitList; hits.length = 0;
    for (let k = 0; k < sides.length; k++) {
      const dir = sides[k];
      const x0 = dir > 0 ? p.cx - 16 : p.cx - s.range, x1 = dir > 0 ? p.cx + s.range : p.cx + 16;
      const y0 = p.cy - 42, y1 = p.cy + 26;
      const anim = evo ? 'fx.slashC' : mel.slash.length ? mel.slash[(p.attackCombo || 0) % mel.slash.length] : null;
      if (anim) g.fx.slash(p.cx, p.cy, dir, s.range, mel.color, p.attackCombo || 0, evo, anim);
      const near = g.enemies.grid.query(x0 - 30, y0 - 30, x1 + 30, y1 + 30, this._near);
      for (let i = 0; i < near.length; i++) {
        const e = near[i];
        if (!e.active || e.x > x1 || e.x + e.w < x0 || e.y > y1 || e.y + e.h < y0) continue;
        g.enemies.hurt(e, k === 0 ? dmg : dmg * 0.7, p.cx, 160);
        hits.push(e);
      }
    }
    g.fx.sfx('claw');
    if (hits.length) g.addHitStop(0.018);
    if (evo) this._chain(hits, dmg * 0.6);
  }

  _chain(sources, dmg) {
    const g = this.game;
    const n = Math.min(3, sources.length || 0);
    for (let i = 0; i < n; i++) {
      const src = sources[i];
      let best = null, bestD = 120;
      for (const e of g.enemies.pool) {
        if (!e.active || e === src || sources.includes(e)) continue;
        const d = Math.hypot(e.cx - src.cx, e.cy - src.cy);
        if (d < bestD) { bestD = d; best = e; }
      }
      if (best) { g.fx.lightning(src.cx, src.cy, best.cx, best.cy); g.enemies.hurt(best, dmg, src.cx, 40); }
    }
  }

  // Raio em Cadeia: acerta o mais próximo e salta de inimigo em inimigo
  _raio(lvl, evo) {
    const g = this.game, p = g.player, s = stats.raio(lvl, evo);
    const reach = s.reach, range = s.range * g.areaMult;
    const hit = new Set();
    let fired = false;
    for (let b = 0; b < s.bolts; b++) {
      let first = null, bd = reach;
      for (const e of g.enemies.pool) {
        if (!e.active || e.def.prop || hit.has(e)) continue;
        const d = Math.hypot(e.cx - p.cx, e.cy - p.cy);
        if (d < bd) { bd = d; first = e; }
      }
      if (!first) break;
      fired = true;
      g.fx.lightning(p.cx, p.cy - 10, first.cx, first.cy);
      let cur = first, dmg = s.dmg * g.damageMult;
      hit.add(cur); g.enemies.hurt(cur, dmg, p.cx, 30);
      for (let j = 0; j < s.jumps; j++) {
        let nx = null, nd = range;
        const near = g.enemies.grid.query(cur.cx - range, cur.cy - range, cur.cx + range, cur.cy + range, this._near);
        for (let i = 0; i < near.length; i++) {
          const e = near[i];
          if (!e.active || e.def.prop || hit.has(e)) continue;
          const d = Math.hypot(e.cx - cur.cx, e.cy - cur.cy);
          if (d < nd) { nd = d; nx = e; }
        }
        if (!nx) break;
        dmg *= s.decay;
        g.fx.lightning(cur.cx, cur.cy, nx.cx, nx.cy);
        hit.add(nx); g.enemies.hurt(nx, dmg, cur.cx, 20);
        cur = nx;
      }
    }
    if (fired) g.fx.sfx('laser');
    return fired;
  }

  // Campo Tesla: choque em todos dentro do raio, a cada meio segundo
  _tesla(lvl, evo) {
    const g = this.game, p = g.player, s = stats.tesla(lvl, evo);
    const r = s.r * g.areaMult;
    this.teslaR = r;
    const near = g.enemies.grid.query(p.cx - r, p.cy - r, p.cx + r, p.cy + r, this._near);
    let n = 0;
    for (let i = 0; i < near.length; i++) {
      const e = near[i];
      if (!e.active || e.def.prop || Math.hypot(e.cx - p.cx, e.cy - p.cy) > r + Math.max(e.w, e.h) * 0.4) continue;
      g.enemies.hurt(e, s.dmg * g.damageMult, p.cx, 25);
      if (n < 3) g.fx.lightning(p.cx, p.cy - 6, e.cx, e.cy);
      n++;
    }
    if (n) {
      this.teslaPulse = 0.18;
      if (evo) g.hp = Math.min(g.maxHp, g.hp + g.maxHp * Math.min(0.01, 0.0015 * n));   // Bobina Vampira
    }
    return true;
  }

  // Bumerangue de Plasma: vai até o alcance, para e volta para o jogador, atravessando inimigos
  _bumerangue(lvl, evo) {
    const p = this.game.player, s = stats.bumerangue(lvl, evo);
    for (let k = 0; k < s.count; k++) {
      const dir = s.both && k % 2 ? -p.facing : p.facing;
      this._throwBoom(dir, s.both ? Math.floor(k / 2) : k, s);
    }
    this.game.fx.sfx('throw');
    return true;
  }

  _throwBoom(dir, k, s) {
    const b = this.booms.find((o) => !o.active);
    if (!b) return;
    const p = this.game.player;
    b.active = true; b.x = p.cx; b.y = p.cy - 6 - k * 12; b.dir = dir; b.t = 0; b.back = false; b._tr = null;
    b.T = 0.5 + s.dist / 900; b.dist = s.dist; b.x0 = b.x; b.y0 = b.y; b.dy = (k - 0.5) * 18;
    b.dmg = s.dmg * this.game.damageMult; b.rot = 0;
  }

  _stepBooms(dt) {
    const g = this.game, p = g.player, rad = 12 * g.areaMult;
    for (const b of this.booms) {
      if (!b.active) continue;
      b.t += dt; b.rot += dt * 16;
      if (!b.back) {
        const k = Math.min(1, b.t / b.T), e = Math.sin(k * Math.PI / 2);   // desacelera no fim da ida
        b.x = b.x0 + b.dir * b.dist * e; b.y = b.y0 + b.dy * e;
        if (k >= 1) { b.back = true; b.sp = 120; }
      } else {
        b.sp = Math.min(560, b.sp + 900 * dt);
        const dx = p.cx - b.x, dy = p.cy - 6 - b.y, d = Math.hypot(dx, dy) || 1;
        b.x += (dx / d) * b.sp * dt; b.y += (dy / d) * b.sp * dt;
        if (d < 16 || b.t > 4) { b.active = false; continue; }
      }
      const near = g.enemies.grid.query(b.x - rad - 30, b.y - rad - 30, b.x + rad + 30, b.y + rad + 30, this._near);
      for (let i = 0; i < near.length; i++) {
        const e = near[i];
        if (!e.active || e.boomCd > 0) continue;
        if (b.x < e.x - rad || b.x > e.x + e.w + rad || b.y < e.y - rad || b.y > e.y + e.h + rad) continue;
        e.boomCd = 0.3;
        g.enemies.hurt(e, b.dmg, b.x, 50);
      }
    }
  }

  _shurikens(lvl, evo) {
    const g = this.game, p = g.player;
    const s = stats.shuriken(lvl, evo);
    const base = p.facing > 0 ? -0.12 : Math.PI + 0.12;   // para onde o jogador olha
    for (let i = 0; i < s.count; i++) {
      const sh = this.shots.find((o) => !o.active);
      if (!sh) break;
      const a = base + (i - (s.count - 1) / 2) * 0.22;
      sh.active = true; sh.x = p.cx; sh.y = p.cy - 4;
      sh.vx = Math.cos(a) * 430; sh.vy = Math.sin(a) * 430;
      sh.life = s.life; sh.bounces = s.bounces; sh.dmg = s.dmg * g.damageMult; sh.pierce = s.pierce;
      sh.hits = 0; sh.last = null; sh.lastT = 0; sh.rot = 0; sh.evo = evo;
    }
    g.fx.sfx('shuriken');
  }

  _stepShots(dt) {
    const g = this.game, w = g.world, p = g.player;
    for (const s of this.shots) {
      if (!s.active) continue;
      s.life -= dt; s.lastT -= dt; s.rot += dt * 18;
      s.x += s.vx * dt;
      if (w.isSolidAt(s.x, s.y)) { s.x -= s.vx * dt; s.vx = -s.vx; s.bounces--; g.fx.spark(s.x, s.y, '#ff4df0'); }
      s.y += s.vy * dt;
      if (w.isSolidAt(s.x, s.y)) { s.y -= s.vy * dt; s.vy = -s.vy; s.bounces--; g.fx.spark(s.x, s.y, '#ff4df0'); }
      if (s.bounces < 0 || s.life <= 0 || Math.abs(s.x - p.cx) > 700) { s.active = false; continue; }
      const near = g.enemies.grid.query(s.x - 40, s.y - 40, s.x + 40, s.y + 40, this._near);
      for (let i = 0; i < near.length; i++) {
        const e = near[i];
        if (!e.active || (e === s.last && s.lastT > 0)) continue;
        if (s.x < e.x - 7 || s.x > e.x + e.w + 7 || s.y < e.y - 7 || s.y > e.y + e.h + 7) continue;
        g.enemies.hurt(e, s.dmg, s.x, 40);
        s.last = e; s.lastT = 0.25; s.hits++;
        if (s.hits >= s.pierce) { s.active = false; break; }
      }
    }
  }

  _drones(dt) {
    const lvl = this.actives.get('drones') || 0;
    this.droneCount = 0;
    if (!lvl) return;
    const g = this.game, p = g.player;
    const s = stats.drones(lvl, this.evolved.has('drones'));
    s.radius *= g.areaMult;
    this.droneAngle += s.spin * dt;
    this.droneCount = s.count;
    for (let k = 0; k < s.count; k++) {
      const a = this.droneAngle + (k * Math.PI * 2) / s.count;
      const d = this.dronePos[k];
      d.x = p.cx + Math.cos(a) * s.radius;
      d.y = p.cy + Math.sin(a) * s.radius * 0.8;
      const near = g.enemies.grid.query(d.x - 40, d.y - 40, d.x + 40, d.y + 40, this._near);
      for (let i = 0; i < near.length; i++) {
        const e = near[i];
        if (!e.active || e.droneCd > 0) continue;
        if (d.x < e.x - 9 || d.x > e.x + e.w + 9 || d.y < e.y - 9 || d.y > e.y + e.h + 9) continue;
        e.droneCd = 0.4;
        g.enemies.hurt(e, s.dmg * g.damageMult, d.x, 50);
      }
    }
  }

  _rastro(dt) {
    const lvl = this.actives.get('rastro') || 0;
    if (!lvl) return;
    const p = this.game.player;
    const evo = this.evolved.has('rastro');
    if (p.isDashing) {
      if (this._trailX === null || Math.abs(p.cx - this._trailX) >= 14) { this._dropFire(p.cx, p.bottom - 6, lvl, evo); this._trailX = p.cx; }
    } else {
      this._trailX = null;
      if (evo && p.onGround && Math.abs(p.vx) > 40) {
        this._autoFireT -= dt;
        if (this._autoFireT <= 0) { this._dropFire(p.cx, p.bottom - 6, lvl, evo); this._autoFireT = 0.25; }
      }
    }
  }

  _dropFire(x, y, lvl, evo) {
    const f = this.fire.find((o) => !o.active);
    if (!f) return;
    const s = stats.rastro(lvl, evo);
    f.active = true; f.x = x; f.y = y; f.r = s.r * this.game.areaMult; f.life = f.max = s.life; f.dps = s.dps * this.game.damageMult;
  }

  _stepFire(dt) {
    const g = this.game;
    for (const f of this.fire) {
      if (!f.active) continue;
      f.life -= dt;
      if (f.life <= 0) { f.active = false; continue; }
      const near = g.enemies.grid.query(f.x - f.r - 30, f.y - f.r - 30, f.x + f.r + 30, f.y + f.r + 30, this._near);
      for (let i = 0; i < near.length; i++) {
        const e = near[i];
        if (!e.active || e.fireCd > 0) continue;
        if (f.x < e.x - f.r || f.x > e.x + e.w + f.r || f.y < e.y - f.r || f.y > e.y + e.h + f.r) continue;
        e.fireCd = 0.2;
        g.enemies.hurt(e, f.dps * 0.2, f.x, 0);
      }
    }
  }

  // ---------------- Cartas de level up ----------------

  buildChoices(rng) {
    const pool = [];
    const ok = (id) => !this.banned.has(id);
    for (const [id, l] of this.actives) {
      if (l < MAX && ok(id)) pool.push({ id, kind: 'up', w: 3 });               // skills que já tem: peso maior (GDD 10.5)
      else if (!this.evolved.has(id) && this.passives.has(SKILLS[id].evo)) pool.push({ id, kind: 'evo', w: 30 });
    }
    for (const [id, l] of this.passives) if (l < MAX && ok(id)) pool.push({ id, kind: 'up', w: 3 });
    if (this.actives.size < SKILL_LIMITS.actives) for (const id of ACTIVE_IDS) if (!this.actives.has(id) && ok(id)) pool.push({ id, kind: 'new', w: 1 });
    if (this.passives.size < SKILL_LIMITS.passives) for (const id of PASSIVE_IDS) if (!this.passives.has(id) && ok(id)) pool.push({ id, kind: 'new', w: 1 });

    const out = [];
    while (out.length < 3 && pool.length) {
      let total = 0;
      for (const c of pool) total += c.w;
      let roll = rng.next() * total, idx = pool.length - 1;
      for (let i = 0; i < pool.length; i++) { roll -= pool[i].w; if (roll < 0) { idx = i; break; } }
      out.push(pool.splice(idx, 1)[0]);
    }
    const rare = this.game.meta.rareChance;
    for (const c of out) {
      if ((c.kind === 'up' || c.kind === 'new') && this.level(c.id) + 2 <= MAX && rng.next() < rare) c.rare = true;
    }
    if (out.length < 3) out.push({ kind: 'heal' });
    if (out.length < 3) out.push({ kind: 'scrap' });
    return out.map((c) => this.describe(c));
  }

  describe(c) {
    if (c.kind === 'heal') return { ...c, title: 'Kit de Reparos', icon: '✚', color: '#ff5c8a', tag: 'CURA', text: 'Recupera 30% do HP.' };
    if (c.kind === 'scrap') return { ...c, title: 'Sucata Extra', icon: '⚙', color: '#ffc94d', tag: 'BÔNUS', text: '+25 Sucata.' };
    let s = SKILLS[c.id];
    if (c.id === 'garras') {           // o ataque básico tem nome e visual do personagem
      const m = this.game.char.melee;
      s = { ...s, name: m.name, icon: m.icon, color: m.color, desc: (l) => l === 1 ? 'Seu ataque básico (botão ATAQUE).' : l === 5 ? 'Passa a golpear também para trás.' : '+dano, +alcance, mais rápido.' };
    }
    if (c.kind === 'evo') return { ...c, title: s.evoName, icon: s.icon, color: '#ffffff', tag: 'EVOLUÇÃO', text: s.evoDesc };
    const next = this.level(c.id) + (c.rare ? 2 : 1);
    const base = c.kind === 'new' ? (s.kind === 'active' ? 'NOVA ATIVA' : 'NOVA PASSIVA') : `Nv ${this.level(c.id)} → ${next}`;
    return {
      ...c, title: s.name, icon: s.icon, color: c.rare ? '#c04dff' : s.color,
      tag: c.rare ? `RARA · ${base}${c.kind === 'new' ? ' (Nv 2)' : ''}` : base,
      text: c.rare ? `Vale 2 níveis! ${s.desc(next)}` : s.desc(next),
    };
  }

  apply(choice) {
    const g = this.game;
    if (choice.kind === 'heal') g.healPercent(0.3);
    else if (choice.kind === 'scrap') g.addScrap(25);
    else if (choice.kind === 'evo') this.evolve(choice.id);
    else { this.gain(choice.id); if (choice.rare) this.gain(choice.id); }
  }

  // Para o HUD
  slots() {
    const list = [];
    const m = this.game.char.melee;
    for (const [id, l] of this.actives) list.push({ ...SKILLS[id], ...(id === 'garras' ? { icon: m.icon, color: m.color } : {}), id, l, evolved: this.evolved.has(id) });
    for (const [id, l] of this.passives) list.push({ ...SKILLS[id], id, l, evolved: false });
    return list;
  }
}
