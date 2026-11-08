// G Batty (XP), Sucata (moedas douradas) e Health Packs. Ficam no chão flutuando; dentro do raio do ímã, voam até o jogador.

import { PICKUP, TILE, WATER } from './config.js';
import { EMPTY, SOLID } from './world.js';

export const PK = { BATTERY: 0, SCRAP: 1, HEALTH: 2 };

export class Pickups {
  constructor(game) {
    this.game = game;
    this.pool = Array.from({ length: PICKUP.maxActive }, () => ({ active: false }));
    this.count = 0;
  }

  reset() { for (const o of this.pool) o.active = false; this.count = 0; }

  spawn(kind, x, y, value) {
    let o = null;
    for (const c of this.pool) if (!c.active) { o = c; break; }
    if (!o) {
      // Pool cheio: funde na bateria mais próxima em vez de criar outra (limite de desempenho)
      if (kind !== PK.BATTERY) return;
      let best = null, bestD = Infinity;
      for (const c of this.pool) {
        if (c.kind !== PK.BATTERY || c.state === 'fly') continue;
        const d = Math.abs(c.x - x) + Math.abs(c.y - y);
        if (d < bestD) { bestD = d; best = c; }
      }
      if (best) best.value += value;
      return;
    }
    o.active = true; o.kind = kind; o.value = value;
    o.x = x; o.y = y;
    o.vx = (Math.random() - 0.5) * 140; o.vy = -160 - Math.random() * 80;
    o.state = 'fall'; o.speed = 0; o.t = Math.random() * 6;
    this.count++;
  }

  step(dt) {
    const g = this.game, p = g.player, w = g.world;
    const radius = PICKUP.magnetRadius * g.magnetMult;
    const px = p.cx, py = p.cy;
    for (const o of this.pool) {
      if (!o.active) continue;
      o.t += dt;
      const dx = px - o.x, dy = py - o.y;
      const dist = Math.hypot(dx, dy);

      if (o.state !== 'fly' && !p.isDead && dist < radius) { o.state = 'fly'; o.speed = PICKUP.flyStartSpeed; }

      if (o.state === 'fly') {
        // Vector3.MoveTowards: avança direto até o jogador, sem passar do ponto
        o.speed = Math.min(PICKUP.flyMaxSpeed, o.speed + PICKUP.flyAccel * dt);
        const step = o.speed * dt;
        if (dist <= Math.max(step, PICKUP.collectRadius)) { this._collect(o); continue; }
        o.x += (dx / dist) * step; o.y += (dy / dist) * step;
      } else if (o.state === 'fall') {
        if (this.water) { o.vy = Math.min(o.vy + WATER.pickupGravity * dt, WATER.pickupMaxFall); o.vx *= 0.95; }   // na água descem devagar
        else { o.vy = Math.min(o.vy + 900 * dt, 600); o.vx *= 0.98; }
        o.x += o.vx * dt;
        const ny = o.y + o.vy * dt;
        const ty = Math.floor((ny + 5) / TILE);
        const tile = w.tileAt(Math.floor(o.x / TILE), ty);
        if (o.vy > 0 && tile !== EMPTY && (tile === SOLID || (o.y + 5) <= ty * TILE + 1)) { o.y = ty * TILE - 6; o.state = 'rest'; }
        else o.y = ny;
        if (o.y > -6) { o.y = -6; o.state = 'rest'; }
      }
      // longe demais (o jogador foi embora): some para liberar o pool
      if (Math.abs(dx) > 1600) { o.active = false; this.count--; }
    }
  }

  _collect(o) {
    const g = this.game;
    o.active = false;
    this.count--;
    if (o.kind === PK.BATTERY) g.addXp(o.value);
    else if (o.kind === PK.SCRAP) g.addScrap(o.value);
    else g.healPercent(o.value);
    g.fx.pickup(o.kind, o.x, o.y);
  }
}
