// Cenários vivos (referência: vídeo do produtor, 07/11/2026). Tudo desenhado por código, leve:
// poucas formas por quadro, brilhos pré-desenhados e nenhuma criação de gradiente a cada quadro.
//  - bg():    efeitos de fundo em coordenadas de TELA (atrás dos blocos): trem, holofotes, plateia, fogos,
//             vaga-lumes, hologramas andando, holofotes da torre, faíscas da fábrica.
//  - world(): efeitos presos às peças do cenário em coordenadas do MUNDO: raios nos servidores, bolhas
//             nos tubos, solda dos braços robóticos, cerca elétrica, cachoeira, luzes do cassino etc.
// A qualidade (q) cai junto com a resolução dinâmica: menos partículas em aparelho apertado.

import { CHUNK_W, CHUNK_H, TILE } from './config.js';

const CHUNK_PX = CHUNK_W * TILE;
const TAU = Math.PI * 2;

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const fract = (v) => v - Math.floor(v);
const hash1 = (n) => fract(Math.sin(n * 127.1 + 311.7) * 43758.5453);

export class Ambient {
  constructor(R) {
    this.R = R;              // renderizador (atlas e quadros das peças animadas)
    this.dots = {};          // brilho redondo por cor
    this.cones = {};         // cone de holofote por cor
    this.fw = [];            // partículas de fogos (tela)
    this.fwT = 1;
    this.flies = Array.from({ length: 30 }, (_, i) => ({ x: hash1(i), y: hash1(i + 50), p: hash1(i + 90) * TAU, c: i % 3 }));
  }

  dot(color) {
    let c = this.dots[color];
    if (!c) {
      c = this.dots[color] = canvas(32, 32);
      const x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, color); g.addColorStop(0.35, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, 32, 32);
    }
    return c;
  }

  cone(color) {
    let c = this.cones[color];
    if (!c) {
      c = this.cones[color] = canvas(128, 512);
      const x = c.getContext('2d');
      const g = x.createLinearGradient(0, 0, 0, 512);
      g.addColorStop(0, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      x.beginPath(); x.moveTo(58, 0); x.lineTo(70, 0); x.lineTo(128, 512); x.lineTo(0, 512); x.closePath(); x.fill();
    }
    return c;
  }

  _glow(ctx, color, x, y, r, a) {
    ctx.globalAlpha = a;
    ctx.drawImage(this.dot(color), x - r, y - r, r * 2, r * 2);
  }

  // Raio elétrico em zigue-zague entre dois pontos (camada larga + núcleo branco)
  _arc(ctx, x0, y0, x1, y1, seed, color, width = 1) {
    const n = 7, pts = [];
    for (let i = 0; i <= n; i++) {
      const k = i / n, j = i === 0 || i === n ? 0 : (hash1(seed + i * 7.3) - 0.5) * 10;
      pts.push([x0 + (x1 - x0) * k + j * 0.4, y0 + (y1 - y0) * k + j]);
    }
    for (const [w, col, a] of [[width * 4, color, 0.35], [width, '#ffffff', 0.95]]) {
      ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w;
      ctx.beginPath(); pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py))); ctx.stroke();
    }
  }

  // Holofote: cone girando a partir de (x, y); dir = 1 aponta para baixo, -1 para cima
  _spot(ctx, color, x, y, len, ang, a, dir = 1) {
    ctx.save();
    ctx.translate(x, y); ctx.rotate(ang + (dir < 0 ? Math.PI : 0));
    ctx.globalAlpha = a;
    ctx.drawImage(this.cone(color), -len * 0.25, 0, len * 0.5, len);
    ctx.restore();
  }

  // ================= Fundo (tela) =================
  bg(ctx, id, W, H, s, t, band, dt, q) {
    if (!band) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const by = band.y, bh = band.h, ground = by + bh * 0.74;   // linha 'do chão' visível da faixa (a base dela fica atrás dos blocos)
    switch (id) {
      case 'subway': {                       // trem atravessando o túnel a cada ~10 s
        const cyc = 10, ph = (t % cyc) / 3.2;
        if (ph < 1) {
          const len = W * 1.6, x = W + 60 - ph * (W + len + 120), y = by + bh * 0.36, th = bh * 0.15;
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 0.8; ctx.fillStyle = '#2a3a4e'; ctx.fillRect(x, y, len, th);
          ctx.fillStyle = '#3c5068'; ctx.fillRect(x, y, len, th * 0.12);
          ctx.fillStyle = '#36d8ff'; ctx.fillRect(x, y + th * 0.72, len, th * 0.08);
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = 0.45; ctx.fillStyle = '#bfe8ff';
          const ww = th * 0.34, gap = th * 0.75;
          for (let wx = x + gap * 0.6; wx < x + len - ww; wx += gap) if (wx > -ww && wx < W) ctx.fillRect(wx, y + th * 0.18, ww, th * 0.32);
          this._glow(ctx, '#ffffff', x + 4, y + th * 0.5, th * 1.4, 0.7);           // farol
          ctx.globalAlpha = 0.25; ctx.fillStyle = '#36d8ff';
          for (let i = 0; i < 5; i++) ctx.fillRect(x + len + i * 30 * s, y + th * (0.2 + i * 0.13), 80 * s, 1.5 * s);
        }
        // luzes do teto piscando
        for (let i = 0; i < 6; i++) {
          const lx = ((i / 6) * W + (t * 4 * s) % (W / 6)) % W;
          const on = hash1(Math.floor(t * 3) + i) > 0.12;
          if (on) this._glow(ctx, '#4dff8c', lx, by + bh * 0.08, 10 * s, 0.25);
        }
        break;
      }
      case 'cage': {                         // holofotes amarelos varrendo, plateia, fumaça
        for (let i = 0; i < 3; i++) {
          const x = W * (0.18 + i * 0.32), ang = Math.sin(t * 0.7 + i * 2.1) * 0.55;
          this._spot(ctx, '#ffd24d', x, 0, H * 0.95, ang, 0.2);
          this._glow(ctx, '#fff3b0', x, 6 * s, 9 * s, 0.9);
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#07050b';
        const step = 11 * s, n = Math.ceil(W / step) + 1;
        for (let i = 0; i < n; i++) {
          const hx = i * step + ((band.offX * 0.4) % step), bob = Math.abs(Math.sin(t * (5 + (i % 4)) + i)) * 3 * s;
          const hy = ground - 10 * s - (i % 3) * 3 * s - bob;
          ctx.globalAlpha = 0.92;
          ctx.beginPath(); ctx.arc(hx, hy, 3.4 * s, 0, TAU); ctx.fill();
          ctx.fillRect(hx - 4.5 * s, hy + 3 * s, 9 * s, 12 * s);
          if (i % 5 === 0 && Math.sin(t * 4 + i) > 0.6) { ctx.fillRect(hx + 2 * s, hy - 7 * s - bob, 1.6 * s, 8 * s); }   // braço erguido
        }
        ctx.globalCompositeOperation = 'lighter';
        for (let i = 0; i < 6 * q; i++) {    // flashes de celular na plateia
          if (hash1(Math.floor(t * 2) * 13 + i) > 0.86) this._glow(ctx, '#ffffff', hash1(i * 3.1 + Math.floor(t * 2)) * W, ground - 18 * s, 4 * s, 0.8);
        }
        for (let i = 0; i < 3; i++) {        // fumaça subindo dos cantos
          const k = fract(t * 0.12 + i / 3), x = (i % 2 ? W * 0.85 : W * 0.12) + Math.sin(t + i) * 10 * s;
          this._glow(ctx, '#8a8098', x, ground - k * bh * 0.8, (18 + k * 40) * s, 0.12 * (1 - k));
        }
        break;
      }
      case 'casino': {                       // holofotes coloridos para cima + fogos de artifício
        const cols = ['#ffd84d', '#ff3b5c', '#4dffd2', '#ff4df0'];
        for (let i = 0; i < 4; i++) {
          const x = W * (0.12 + i * 0.25), ang = Math.sin(t * 0.9 + i * 1.7) * 0.45;
          this._spot(ctx, cols[i], x, ground, H * 0.8, ang, 0.16, -1);
        }
        this.fwT -= dt;
        if (this.fwT <= 0 && this.fw.length < 140 * q) {
          this.fwT = 1.3 + Math.random() * 1.6;
          const cx = W * (0.15 + Math.random() * 0.7), cy = H * (0.1 + Math.random() * 0.25), col = cols[(Math.random() * 4) | 0];
          const n = Math.round(26 * q);
          for (let i = 0; i < n; i++) {
            const a = (i / n) * TAU, sp = (60 + Math.random() * 40) * s;
            this.fw.push({ x: cx, y: cy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 1.3, col });
          }
        }
        this._fireworks(ctx, dt, s);
        break;
      }
      case 'jungle': {                       // vaga-lumes e esporos brilhantes
        const cols = ['#d6ff6b', '#5ef0ff', '#ff6ad5'];
        const n = Math.round(this.flies.length * q);
        for (let i = 0; i < n; i++) {
          const f = this.flies[i];
          const x = fract(f.x - band.offX * 0.0006 + Math.sin(t * 0.3 + f.p) * 0.02) * W;
          const y = by + bh * (0.15 + f.y * 0.85) + Math.sin(t * 0.8 + f.p) * 12 * s;
          const a = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.2 + f.p * 3));
          this._glow(ctx, cols[f.c], x, y, 5 * s, a);
        }
        break;
      }
      case 'mall': {                         // pessoas em holograma passeando
        for (let i = 0; i < 6; i++) {
          const dir = i % 2 ? 1 : -1, spd = (14 + (i % 3) * 6) * s;
          const span = W + 80 * s;
          let x = fract(hash1(i) + dir * t * spd / span) * span - 40 * s;
          if (dir < 0) x = W - x;
          const y = ground - 4 * s - (i % 3) * 7 * s;
          this._holoPerson(ctx, x, y, s * (0.9 + (i % 3) * 0.12), t + i, dir, i % 2 ? '#5ef0ff' : '#ff6ad5');
        }
        break;
      }
      case 'genelab': {                      // feixe de escaneamento verde subindo e descendo
        const k = (Math.sin(t * 0.6) + 1) / 2, y = by + bh * (0.1 + k * 0.8);
        ctx.globalAlpha = 0.18; ctx.fillStyle = '#4dff8c'; ctx.fillRect(0, y, W, 2 * s);
        ctx.globalAlpha = 0.06; ctx.fillRect(0, y - 8 * s, W, 18 * s);
        break;
      }
      case 'torre': {                        // holofotes varrendo o céu + luzes de aviso piscando
        for (let i = 0; i < 2; i++) this._spot(ctx, '#cfe0ff', W * (0.25 + i * 0.5), ground, H * 1.1, Math.sin(t * 0.35 + i * 2.4) * 0.6, 0.12, -1);
        for (let i = 0; i < 7; i++) if (Math.sin(t * 3 + i * 1.7) > 0.4) this._glow(ctx, '#ff3b5c', hash1(i + 7) * W, by + bh * (0.05 + hash1(i + 3) * 0.3), 4 * s, 0.9);
        break;
      }
      case 'fabrica': {                      // chuva de faíscas e vapor
        for (let i = 0; i < 18 * q; i++) {
          const k = fract(t * 0.9 + hash1(i)), x = hash1(i + 40) * W + Math.floor(t * 0.25 + hash1(i)) * 37 % W;
          if (hash1(i + Math.floor(t * 0.9 + hash1(i))) > 0.55) continue;
          ctx.globalAlpha = 0.9 * (1 - k); ctx.fillStyle = '#ffb03c';
          ctx.fillRect(x % W, by + bh * 0.15 + k * k * bh * 0.85, 1.5 * s, 4 * s);
        }
        for (let i = 0; i < 3; i++) {
          const k = fract(t * 0.15 + i / 3), x = W * (0.2 + i * 0.3);
          this._glow(ctx, '#c8b8a8', x, ground - k * bh, (14 + k * 34) * s, 0.1 * (1 - k));
        }
        break;
      }
      case 'deep': {                         // correnteza de dados, neve marinha e pulso de sonar
        for (let i = 0; i < 7; i++) {        // fluxo de água digital: traços e setas deslizando
          const y = by + bh * (0.12 + hash1(i + 3) * 0.6), sp = (40 + hash1(i) * 60) * s;
          const len = (60 + hash1(i + 7) * 90) * s, x = ((hash1(i + 11) * W + t * sp) % (W + len * 2)) - len;
          ctx.globalAlpha = 0.22; ctx.fillStyle = i % 3 ? '#36e7ff' : '#7a8cff';
          for (let k = 0; k < len; k += 7 * s) ctx.fillRect(x + k, y, 4 * s, 1.5 * s);
          ctx.globalAlpha = 0.35;
          ctx.beginPath(); ctx.moveTo(x + len + 6 * s, y + 0.75 * s); ctx.lineTo(x + len, y - 3 * s); ctx.lineTo(x + len, y + 4.5 * s); ctx.fill();
        }
        ctx.fillStyle = '#bfefff';
        for (let i = 0; i < 40 * q; i++) {   // neve marinha caindo devagar
          const x = fract(hash1(i) + Math.sin(t * 0.3 + i) * 0.01 - band.offX / W * 0.3) * W;
          const y = fract(hash1(i + 20) + t * (0.015 + hash1(i + 30) * 0.02)) * H;
          ctx.globalAlpha = 0.25 + 0.25 * hash1(i + 5); ctx.fillRect(x, y, 1.2 * s, 1.2 * s);
        }
        const ph = (t % 6) / 6;              // sonar
        if (ph < 0.5) {
          ctx.globalAlpha = 0.25 * (1 - ph * 2); ctx.strokeStyle = '#36e7ff'; ctx.lineWidth = 1.5 * s;
          ctx.beginPath(); ctx.arc(W * 0.7, by + bh * 0.4, ph * 2 * W * 0.5, 0, TAU); ctx.stroke();
        }
        break;
      }
    }
    ctx.restore();
  }

  _fireworks(ctx, dt, s) {
    const list = this.fw;
    for (let i = list.length - 1; i >= 0; i--) {
      const p = list[i];
      p.life -= dt;
      if (p.life <= 0) { list[i] = list[list.length - 1]; list.pop(); continue; }
      p.vy += 40 * s * dt; p.vx *= 0.985; p.vy *= 0.985;
      p.x += p.vx * dt; p.y += p.vy * dt;
      ctx.globalAlpha = Math.min(1, p.life * 1.4); ctx.fillStyle = p.col;
      ctx.fillRect(p.x, p.y, 2 * s, 2 * s);
    }
  }

  _holoPerson(ctx, x, y, k, t, dir, col) {
    if (hash1(Math.floor(t * 6)) < 0.06) return;            // falha do holograma
    const step = Math.sin(t * 7) * 3 * k, gl = hash1(Math.floor(t * 9)) < 0.1 ? 3 * k : 0;
    ctx.globalAlpha = 0.32; ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 2 * k;
    const cx = x + gl;
    ctx.beginPath(); ctx.arc(cx, y - 26 * k, 3.6 * k, 0, TAU); ctx.fill();          // cabeça
    ctx.fillRect(cx - 3.5 * k, y - 22 * k, 7 * k, 11 * k);                          // corpo
    ctx.beginPath();                                                                 // pernas e braços
    ctx.moveTo(cx - 1.5 * k, y - 11 * k); ctx.lineTo(cx - 1.5 * k + step, y);
    ctx.moveTo(cx + 1.5 * k, y - 11 * k); ctx.lineTo(cx + 1.5 * k - step, y);
    ctx.moveTo(cx - 3.5 * k, y - 20 * k); ctx.lineTo(cx - 3.5 * k - step * 0.6 * dir, y - 13 * k);
    ctx.moveTo(cx + 3.5 * k, y - 20 * k); ctx.lineTo(cx + 3.5 * k + step * 0.6 * dir, y - 13 * k);
    ctx.stroke();
    ctx.globalAlpha = 0.12; ctx.fillRect(cx - 6 * k, y, 12 * k, 1.5 * k);             // base do projetor
  }

  // ================= Peças do cenário (mundo) =================
  world(ctx, chunks, t, view) {
    ctx.save();
    // peças animadas do atlas (deco.*): desenhadas a cada quadro, por cima do pedaço pronto
    for (const { c, ci } of chunks) {
      if (!c.props) continue;
      const ox = ci * CHUNK_PX, oy = -CHUNK_H * TILE;
      for (const p of c.props) if (p.live && ox + p.x < view.right && ox + p.x + p.w > view.left) this._live(ctx, p, ox, oy, t);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const { c, ci } of chunks) {
      if (!c.props) continue;
      const ox = ci * CHUNK_PX, oy = -CHUNK_H * TILE;
      for (const p of c.props) {
        if (p.live) continue;
        const x = ox + p.x, y = oy + p.y, w = p.w, h = p.h;
        if (x > view.right || x + w < view.left) continue;
        this._prop(ctx, p.n, x, y, w, h, t, p.seed);
      }
    }
    if (view.id === 'deep') this._jellies(ctx, chunks, t, view);
    ctx.restore();
  }

  // Peças animadas do Cyber Deep: anêmonas balançando, letreiro com glitch, viga em curto, cano vazando
  _live(ctx, p, ox, oy, t) {
    const R = this.R, x = ox + p.fx, y = oy + p.fy;
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    if (p.n.startsWith('deco.anem')) {
      const fr = R._frameAt(p.n, 0); if (!fr) return;
      const sw = Math.sin(t * 1.5 + p.seed) * 0.13 + Math.sin(t * 3.7 + p.seed * 2) * 0.03;
      ctx.save(); ctx.translate(x, y); ctx.transform(1, 0, sw, 1, 0, 0);
      R._drawFrame(ctx, fr, 0, 0, 1, false, 1, 1 + Math.sin(t * 2 + p.seed) * 0.03);
      ctx.restore();
      ctx.globalCompositeOperation = 'lighter';
      this._glow(ctx, '#ff6ad5', x - sw * p.h * 0.7, y - p.h * 0.7, p.h * 0.55, 0.12 + 0.06 * Math.sin(t * 2.4 + p.seed));
      return;
    }
    if (p.n === 'deco.sign') {
      const fr = R._frameAt('deco.sign', 0); if (!fr) return;
      const g = Math.floor(t * 10 + p.seed), off = hash1(g) < 0.18;
      if (hash1(g + 3) < 0.05) ctx.globalAlpha = 0.35;              // pisca apagando
      R._drawFrame(ctx, fr, x, y, 1, false);
      if (off) {                                                     // glitch: cópia deslocada e fatias
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45;
        R._drawFrame(ctx, fr, x + (hash1(g + 1) - 0.5) * 6, y, 1, false);
        ctx.globalAlpha = 0.5; ctx.fillStyle = '#ff4df0';
        ctx.fillRect(p.x + ox, y - p.h * hash1(g + 2), p.w, 1.5);
      }
      return;
    }
    if (p.n === 'deco.curto' || p.n === 'deco.vaz') {
      const burst = p.n === 'deco.vaz' || fract(t / 3 + p.seed) < 0.45;
      const fr = burst ? R._frame(p.n, t + p.seed) : R._frameAt(p.n, 2);
      if (!fr) return;
      R._drawFrame(ctx, fr, x, y, 1, false);
      if (burst && p.n === 'deco.curto') {
        ctx.globalCompositeOperation = 'lighter';
        this._glow(ctx, '#bfe8ff', x, y - p.h * 0.55, p.h * (0.8 + 0.4 * hash1(Math.floor(t * 20))), 0.45);
      }
    }
  }

  // Águas-vivas de fibra óptica flutuando na água aberta (decoração, sem colisão)
  _jellies(ctx, chunks, t, view) {
    const R = this.R;
    for (const { ci } of chunks) {
      for (let k = 0; k < 2; k++) {
        const sd = ci * 7.31 + k * 3.7, side = hash1(sd + 1) < 0.4;
        const anim = side ? 'deco.jellyS' : 'deco.jelly';
        const fr = R._frame(anim, t + hash1(sd) * 3); if (!fr) continue;
        const dir = hash1(sd + 2) < 0.5 ? -1 : 1;
        const x = ci * CHUNK_PX + hash1(sd + 3) * CHUNK_PX + (side ? fract(t * 0.02 + hash1(sd)) * 240 * dir : Math.sin(t * 0.4 + sd) * 20);
        const y = -CHUNK_H * TILE * (0.45 + hash1(sd + 4) * 0.4) + Math.sin(t * 0.9 + sd) * 14;
        if (x < view.left - 80 || x > view.right + 80) continue;
        ctx.globalAlpha = 0.55;
        R._drawFrame(ctx, fr, x, y, side ? dir : 1, false);
      }
    }
  }

  _prop(ctx, n, x, y, w, h, t, seed) {
    switch (n) {
      case 'servers1': case 'servers2': case 'panel': case 'control': case 'terminal': case 'labpc': {
        for (let i = 0; i < 8; i++) {                        // LEDs piscando
          if (hash1(seed + i * 3.7 + Math.floor(t * (2 + i % 3))) < 0.45) continue;
          const lx = x + w * (0.18 + hash1(seed + i) * 0.64), ly = y + h * (0.2 + hash1(seed + i + 9) * 0.6);
          this._glow(ctx, i % 3 ? '#4dff8c' : '#36d8ff', lx, ly, 2.2, 0.9);
        }
        if (n.startsWith('servers') && fract(t / 2.6 + seed) < 0.12) {   // raio pulando entre os racks
          const k = Math.floor(t * 20);
          this._arc(ctx, x + w * 0.2, y + 2, x + w * 0.8, y + h * 0.15, seed + k, '#5ef0ff');
        }
        break;
      }
      case 'tube_p': case 'tube_g': case 'tube_c': case 'tube_g2': case 'tube_m': case 'tube_b': {
        const col = { tube_p: '#ff4df0', tube_g: '#4dff8c', tube_c: '#5ef0ff', tube_g2: '#9dff4d', tube_m: '#ff6ad5', tube_b: '#4da6ff' }[n];
        ctx.globalAlpha = 0.07 + 0.05 * Math.sin(t * 2 + seed); ctx.fillStyle = col;   // líquido pulsando
        ctx.fillRect(x + w * 0.22, y + h * 0.18, w * 0.56, h * 0.6);
        for (let i = 0; i < 5; i++) {                         // bolhas subindo
          const k = fract(t * (0.35 + hash1(seed + i) * 0.3) + hash1(seed + i * 5)), bx = x + w * (0.3 + hash1(seed + i * 2) * 0.4) + Math.sin(t * 3 + i) * 1.5;
          this._glow(ctx, '#ffffff', bx, y + h * (0.76 - k * 0.56), 1.6 + (i % 2), 0.55 * (1 - k * 0.6));
        }
        break;
      }
      case 'robotarm': case 'robotarm2': {                    // solda na ponta do braço
        if (fract(t / 1.7 + seed) < 0.35) {
          const tx = x + w * (n === 'robotarm' ? 0.22 : 0.3), ty = y + h * 0.18;
          this._glow(ctx, '#bff6ff', tx, ty, 6 + Math.random() * 3, 0.9);
          ctx.globalAlpha = 0.9; ctx.strokeStyle = '#ffd24d'; ctx.lineWidth = 0.8;
          ctx.beginPath();
          for (let i = 0; i < 5; i++) { const a = Math.random() * TAU, r = 3 + Math.random() * 7; ctx.moveTo(tx, ty); ctx.lineTo(tx + Math.cos(a) * r, ty + Math.sin(a) * r + 2); }
          ctx.stroke();
        }
        break;
      }
      case 'efence': {                                         // cerca dando choque
        if (fract(t / 1.3 + seed) < 0.2) {
          const k = Math.floor(t * 18);
          this._arc(ctx, x + w * 0.08, y + h * (0.25 + hash1(k) * 0.4), x + w * 0.92, y + h * (0.25 + hash1(k + 1) * 0.4), seed + k, '#ff4df0');
        }
        break;
      }
      case 'fall': {                                           // cachoeira correndo + névoa
        ctx.globalAlpha = 0.3; ctx.fillStyle = '#d8fbff';
        const cx0 = x + w * 0.42, cw = w * 0.2, top = y + h * 0.1, bot = y + h * 0.78;
        for (let i = 0; i < 6; i++) {
          const k = fract(t * 1.6 + i / 6), sx = cx0 + hash1(i + seed) * cw;
          ctx.fillRect(sx, top + k * (bot - top), 1.2, 9);
        }
        for (let i = 0; i < 3; i++) this._glow(ctx, '#bff6ff', cx0 + cw * (i / 2), bot + Math.sin(t * 3 + i) * 2, 7, 0.22);
        break;
      }
      case 'gtree': case 'plant_c': {                          // brilho respirando
        this._glow(ctx, n === 'gtree' ? '#ff6ad5' : '#5ef0ff', x + w / 2, y + h * (n === 'gtree' ? 0.25 : 0.4), w * 0.45, 0.07 + 0.05 * Math.sin(t * 1.5 + seed));
        break;
      }
      case 'casino1': case 'casino2': {                        // letreiro com lâmpadas em sequência
        const nb = 12, y0 = y + h * 0.06;
        for (let i = 0; i < nb; i++) {
          if ((i + Math.floor(t * 8)) % 3) continue;
          this._glow(ctx, '#ffe27a', x + w * (0.08 + (i / (nb - 1)) * 0.84), y0, 3.2, 0.95);
        }
        this._glow(ctx, n === 'casino1' ? '#ff3b5c' : '#4dffd2', x + w / 2, y + h * 0.42, w * 0.38, 0.1 + 0.06 * Math.sin(t * 4));
        break;
      }
      case 'slot1': case 'slot2': {                            // tela girando + moedinhas de vez em quando
        ctx.globalAlpha = 0.18 + 0.12 * Math.sin(t * 12 + seed); ctx.fillStyle = hash1(Math.floor(t * 6) + seed) > 0.5 ? '#ffd84d' : '#ff3b5c';
        ctx.fillRect(x + w * 0.22, y + h * 0.3, w * 0.56, h * 0.18);
        const k = fract(t / 2.2 + seed);
        if (k < 0.3) for (let i = 0; i < 3; i++) this._glow(ctx, '#ffd84d', x + w * (0.35 + i * 0.15), y + h * 0.62 - Math.sin((k / 0.3) * Math.PI) * (10 + i * 4), 2.6, 0.9);
        break;
      }
      case 'roulette': {
        const a = t * 5 + seed;
        this._glow(ctx, '#ffffff', x + w * 0.5 + Math.cos(a) * w * 0.18, y + h * 0.45 + Math.sin(a) * h * 0.08, 3, 0.95);
        break;
      }
      case 'arcade1': case 'arcade2': case 'shopwin': case 'holo': {   // telas e vitrines piscando
        ctx.globalAlpha = 0.1 + 0.08 * Math.sin(t * 9 + seed) + (hash1(Math.floor(t * 4) + seed) > 0.9 ? 0.15 : 0);
        ctx.fillStyle = hash1(Math.floor(t * 1.5) + seed) > 0.5 ? '#5ef0ff' : '#ff6ad5';
        if (n === 'holo') { ctx.fillRect(x + w * 0.3, y - h * 0.15, w * 0.4, h * 0.6); break; }
        ctx.fillRect(x + w * 0.24, y + h * 0.16, w * 0.52, h * 0.3);
        break;
      }
    }
  }
}
