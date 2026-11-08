// Efeitos ("juice"): partículas, golpes, raios, anéis, rastro do dash, tremor de tela e gatilhos de som.

import { LIMITS } from './config.js';
import { ATLAS } from './atlasData.js';

export class Fx {
  constructor(game) {
    this.game = game;
    this.parts = Array.from({ length: LIMITS.particles }, () => ({ life: 0 }));
    this.effects = Array.from({ length: LIMITS.effects }, () => ({ life: 0 }));
    this.shakeAmt = 0;
    this._pi = 0;
    this._hitSfxT = 0;
    this._pickupT = 0;
    this._pickupCombo = 0;
  }

  reset() {
    for (const p of this.parts) p.life = 0;
    for (const e of this.effects) e.life = 0;
    this.shakeAmt = 0;
  }

  sfx(name, opt) { this.game.audio.sfx(name, opt); }
  shake(a) { if (this.game.settings.shake) this.shakeAmt = Math.max(this.shakeAmt, a); }

  emit(x, y, n, color, speed, life, size = 2, gravity = 0, spread = Math.PI * 2, angle = 0) {
    for (let i = 0; i < n; i++) {
      const p = this.parts[this._pi];
      this._pi = (this._pi + 1) % this.parts.length;
      const a = angle + (Math.random() - 0.5) * spread;
      const s = speed * (0.4 + Math.random() * 0.8);
      p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s;
      p.life = p.max = life * (0.6 + Math.random() * 0.6);
      p.color = color; p.size = size; p.g = gravity;
    }
  }

  effect(type, props) {
    let e = this.effects.find((o) => o.life <= 0);
    if (!e) e = this.effects[0];
    Object.assign(e, props);
    e.type = type;
    e.max = e.life;
    return e;
  }

  // Efeito de sprite do atlas (faíscas, fumaça, destroços...). fi = índice do quadro.
  sprite(anim, x, y, life, sc = 1, opt = {}) {
    return this.effect('spr', { anim, x, y, life, sc, fi: opt.fi || 0, rot: opt.rot || 0, flip: opt.flip || 1,
      add: opt.add !== false, grow: opt.grow || 0, vy: opt.vy || 0, vx: opt.vx || 0, fade: opt.fade !== false });
  }

  // ---------- Movimento do jogador ----------
  jump(p, air) {
    this.emit(p.cx, p.bottom, air ? 8 : 6, air ? '#5ef0ff' : '#b9a6ff', 90, 0.3, 2, 200, Math.PI * 0.8, Math.PI / 2);
    this.sfx(air ? 'airjump' : 'jump');
  }
  // Braçada (na água): bolhas saindo dos pés e som de pulo mais grave
  stroke(p) {
    const w = this.game.water;
    if (w) w.emit(p.cx, p.bottom - 6, 3, 6);
    this.sfx('airjump');
  }
  wallJump(p, dir) {
    this.emit(dir > 0 ? p.x : p.x + p.w, p.cy, 8, '#ff4df0', 120, 0.3, 2, 100, Math.PI * 0.6, dir > 0 ? Math.PI : 0);
    this.sfx('jump');
  }
  land(p, impact) {
    if (impact < 80) return;
    this.emit(p.cx, p.bottom, Math.min(14, 4 + impact / 60), '#8f7fd0', 70 + impact * 0.15, 0.35, 2, 300, Math.PI * 0.9, -Math.PI / 2);
    if (impact > 600) this.shake(3);
    this.sfx('land');
  }
  dash(p, dir) {
    this.emit(p.cx, p.cy, 10, '#5ef0ff', 160, 0.25, 2, 0, 0.8, dir > 0 ? Math.PI : 0);
    this.sfx('dash');
  }
  slam(p) { this.game.onSlam(p); }
  afterimage(p) {
    this.effect('ghost', { x: p.x, y: p.y, w: p.w, h: p.h, facing: p.facing, life: 0.16, anim: this.game.char.prefix + '.dash' });
  }

  // ---------- Combate ----------
  // Crítico: estrela dourada + "CRÍTICO!" subindo (texto limitado para não poluir a tela)
  crit(e) {
    this.sprite('fx.spark', e.cx, e.cy, 0.18, 1.8, { fi: 0, rot: Math.random() * 6.28 });
    this.emit(e.cx, e.cy, 6, '#ffd84d', 170, 0.3, 2);
    if (this._critT > 0) return;
    this._critT = 0.12;
    if (!this.game.juice || !this.game.juice.numbersOn) this.effect('crit', { x: e.cx + (Math.random() - 0.5) * 10, y: e.y - 4, life: 0.55 });   // com números de dano, o número dourado já diz que foi crítico
    if (this._critSfxT <= 0) { this.sfx('claw'); this._critSfxT = 0.1; }
  }

  enemyHit(e, amount = 0, crit = false) {
    const J = this.game.juice;
    if (J) { J.number(e, amount, crit); if (crit || (e.def.boss && amount >= 40)) J.flare(e.cx + (Math.random() - 0.5) * e.w * 0.4, e.cy + (Math.random() - 0.5) * e.h * 0.4, crit ? 34 : 26); }
    this.emit(e.cx, e.cy, 2, e.def.glow, 120, 0.2, 2);
    if (Math.random() < 0.7) this.sprite('fx.spark', e.cx + (Math.random() - 0.5) * e.w * 0.6, e.cy + (Math.random() - 0.5) * e.h * 0.5, 0.14, 0.9 + Math.random() * 0.4, { fi: (Math.random() * 3) | 0, rot: Math.random() * 6.28 });
    if (this._hitSfxT <= 0) { this.sfx('hit'); this._hitSfxT = 0.05; }
  }
  // Quadros de morte da folha (monstros aquáticos): x, y = âncora (centro, ou pés se o quadro for 'feet')
  seq(anim, x, y, life, flip = 1, sc = 1, vy = 0, vx = 0, add = false) {
    return this.effect('seq', { anim, x, y, life, flip, sc, vy, vx, add });
  }
  kill(e) {
    const big = e.def.tier !== 'weak';
    if (ATLAS[e.type + '.death']) {
      this.seq(e.type + '.death', e.cx, e.cy, big ? 0.75 : 0.5, e.facing || 1, 1, 10);
      this.emit(e.cx, e.cy, big ? 14 : 6, e.def.glow, big ? 180 : 120, 0.4, 2, 100);
      if (big) this.shake(e.def.tier === 'tank' ? 6 : 3);
      if (e.def.tier === 'tank' && this.game.juice) this.game.juice.shock(e.cx, e.cy, 80, 0.05, 0.35);
      this.sfx(big ? 'killbig' : 'kill');
      return;
    }
    if (e.type === 'dronev') this.sprite('fx.burst', e.cx, e.cy, 0.3, 1);
    if (e.type === 'dronev') this.sprite('dronev.dead', e.cx, e.cy, 0.6, 1, { add: false, vy: 160, rot: 0.3 });
    else if (big) { this.sprite('fx.debris', e.cx, e.cy, 0.45, e.def.tier === 'tank' ? 1.4 : 1, { add: false, grow: 0.5 }); this.sprite('fx.smoke', e.cx, e.cy - 8, 0.7, 1, { add: false, vy: -40, grow: 0.4 }); }
    else this.sprite('fx.burst', e.cx, e.cy, 0.3, 0.75, { grow: 0.6 });
    this.emit(e.cx, e.cy, big ? 22 : 10, e.def.glow, big ? 220 : 160, 0.45, big ? 3 : 2, 200);
    this.emit(e.cx, e.cy, big ? 8 : 4, '#ffffff', 90, 0.25, 2);
    if (e.def.tier === 'tank' && this.game.juice) this.game.juice.shock(e.cx, e.cy, 80, 0.05, 0.35);
    if (big) { this.shake(e.def.tier === 'tank' ? 6 : 3); this.effect('ring', { x: e.cx, y: e.cy, r: 4, maxR: e.def.tier === 'tank' ? 70 : 40, color: e.def.glow, life: 0.3 }); }
    this.sfx(big ? 'killbig' : 'kill');
  }
  // Morte de chefe: sequência de explosões, anel grande e tremor forte
  bossDeath(e) {
    const c = e.def.glow;
    if (ATLAS[e.type + '.death']) this.seq(e.type + '.death', e.cx, e.def.flying ? e.cy : e.y + e.h, 1.4, e.facing || 1, 1, e.def.flying ? 18 : 0);
    for (let i = 0; i < 6; i++) {
      const ox = (Math.random() - 0.5) * e.w, oy = (Math.random() - 0.5) * e.h;
      this.sprite(i % 2 ? 'fx.debris' : 'fx.burst', e.cx + ox, e.cy + oy, 0.4 + i * 0.08, 1.4 + Math.random(), { add: i % 2 === 0, grow: 0.6 });
    }
    this.sprite('fx.smoke', e.cx, e.cy - 10, 1.0, 2.4, { add: false, vy: -40, grow: 0.5 });
    this.sprite('fx.glitch', e.cx, e.cy, 0.6, 3.2);
    this.emit(e.cx, e.cy, 60, c, 320, 0.8, 3, 200);
    this.emit(e.cx, e.cy, 25, '#ffffff', 200, 0.4, 2);
    this.effect('ring', { x: e.cx, y: e.cy, r: 8, maxR: 180, color: c, life: 0.5 });
    this.effect('ring', { x: e.cx, y: e.cy, r: 4, maxR: 110, color: '#ffffff', life: 0.35 });
    this.shake(16);
    if (this.game.juice) { this.game.juice.shock(e.cx, e.cy, 230, 0.11, 0.7); this.game.juice.glitch(0.3); }
    this.sfx('killbig'); this.sfx('boom');
  }

  explosion(x, y, color, r) {
    this.emit(x, y, 12, color, 180, 0.35, 2, 150);
    this.effect('ring', { x, y, r: 4, maxR: r, color, life: 0.25 });
    this.sfx('boom');
  }
  spark(x, y, color) { this.emit(x, y, 3, color, 100, 0.15, 1); }
  slash(x, y, dir, range, color, combo = 0, evo = false, anim = null) { this.effect('slash', { x, y, dir, range, color, combo, evo, anim, life: 0.14 }); }
  impact(x, y, kind) {
    this.sprite('fx.spark', x, y, 0.16, kind === 'laser' ? 1.1 : 1.3, { fi: kind === 'laser' ? 1 : 0, rot: Math.random() * 6.28 });
    this.emit(x, y, 5, kind === 'laser' ? '#5ef0ff' : '#ffc94d', 140, 0.2, 2);
  }
  propBreak(e) {
    this.sprite('fx.debris', e.cx, e.cy, 0.5, 1, { add: false, grow: 0.6 });
    this.sprite('fx.smoke', e.cx, e.cy - 6, 0.6, 0.8, { add: false, vy: -40, grow: 0.4 });
    this.emit(e.cx, e.cy, 12, e.def.glow, 200, 0.4, 2, 300);
    this.shake(4);
    this.sfx('crate');
  }
  lightning(x1, y1, x2, y2) { this.effect('bolt', { x: x1, y: y1, x2, y2, color: '#d9fbff', life: 0.12 }); }
  ring(x, y, color, maxR, life) { this.effect('ring', { x, y, r: 6, maxR, color, life }); }
  playerHurt(p) {
    this.emit(p.cx, p.cy, 14, '#ff3355', 200, 0.4, 2, 200);
    this.shake(7);
    this.sfx('hurt');
  }
  pickup(kind, x, y) {
    const color = kind === 0 ? '#5ef0ff' : kind === 1 ? '#ffc94d' : '#ff5c8a';
    this.emit(x, y, 3, color, 60, 0.2, 1);
    if (this._pickupT > 0) return;
    this._pickupT = 0.035;
    this._pickupCombo = Math.min(12, this._pickupCombo + 1);
    this.sfx(kind === 0 ? 'pickup' : kind === 1 ? 'coin' : 'heal', { combo: this._pickupCombo });
  }

  // ---------- Atualização ----------
  step(dt) {
    this._hitSfxT -= dt;
    this._pickupT -= dt;
    if (this._pickupT < -0.5) this._pickupCombo = 0;
    for (const p of this.parts) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.vx *= 0.97;
    }
    for (const e of this.effects) {
      if (e.life <= 0) continue;
      e.life -= dt;
      if (e.type === 'spr') { e.x += e.vx * dt; e.y += e.vy * dt; }
      if (e.type === 'ring') e.r += (e.maxR - e.r) * Math.min(1, dt * 18);
    }
    this.shakeAmt = Math.max(0, this.shakeAmt - dt * 30);
    this._critT = (this._critT || 0) - dt; this._critSfxT = (this._critSfxT || 0) - dt;
  }
}
