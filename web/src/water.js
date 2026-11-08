// Efeito de água do setor submerso (Cyber Deep): tom azul por profundidade, cáusticas, feixes de luz,
// bolhas e linha da superfície. Tudo pré-desenhado uma vez e só deslizado na tela (barato em celular fraco).

import { WATER } from './config.js';

const MAX_BUB = 40;

function canvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

// Cáusticas: rede de luz ondulada, repetível sem emenda (senos com período = tamanho da textura)
function buildCaustics(N = 96) {
  const c = canvas(N, N), x = c.getContext('2d');
  const img = x.createImageData(N, N), d = img.data;
  const k = (Math.PI * 2) / N;
  for (let j = 0; j < N; j++) {
    for (let i = 0; i < N; i++) {
      const a = Math.sin(i * k * 2 + 1.7 * Math.sin(j * k * 3));
      const b = Math.sin(j * k * 2 + 1.7 * Math.sin(i * k * 2 + 0.6));
      const c2 = Math.sin((i + j) * k + 1.3 * Math.sin((i - j) * k * 2));
      const v = Math.abs(a + b + c2) / 3;
      const lum = Math.pow(Math.max(0, 1 - v * 3.2), 3);
      const o = (j * N + i) * 4;
      d[o] = 120; d[o + 1] = 230; d[o + 2] = 255; d[o + 3] = Math.round(lum * 255);
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}

// Feixe de luz vindo da superfície: faixa vertical que some para baixo e nas laterais
function buildRay() {
  const W = 48, H = 256, c = canvas(W, H), x = c.getContext('2d');
  const gv = x.createLinearGradient(0, 0, 0, H);
  gv.addColorStop(0, 'rgba(150,235,255,0.55)'); gv.addColorStop(0.5, 'rgba(110,200,255,0.18)'); gv.addColorStop(1, 'rgba(90,180,255,0)');
  x.fillStyle = gv; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'destination-in';
  const gh = x.createLinearGradient(0, 0, W, 0);
  gh.addColorStop(0, 'rgba(0,0,0,0)'); gh.addColorStop(0.5, 'rgba(0,0,0,1)'); gh.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = gh; x.fillRect(0, 0, W, H);
  return c;
}

// Bolha: anel claro com brilho
function buildBubble() {
  const c = canvas(16, 16), x = c.getContext('2d');
  x.strokeStyle = 'rgba(170,240,255,0.9)'; x.lineWidth = 1.4;
  x.beginPath(); x.arc(8, 8, 5.5, 0, Math.PI * 2); x.stroke();
  x.fillStyle = 'rgba(120,220,255,0.18)'; x.fill();
  x.fillStyle = 'rgba(255,255,255,0.9)'; x.fillRect(5, 5, 2, 2);
  return c;
}

export class WaterFx {
  constructor() {
    this.bub = Array.from({ length: MAX_BUB }, () => ({ life: 0 }));
    this._bi = 0;
    this._ambT = 0;
    this.caus = null; this.ray = null; this.bubImg = null;
  }

  _ensure() {
    if (this.caus) return;
    this.caus = buildCaustics();
    this.ray = buildRay();
    this.bubImg = buildBubble();
  }

  reset() { for (const b of this.bub) b.life = 0; }

  // Solta n bolhas em (x, y) do mundo
  emit(x, y, n = 3, spread = 6, big = 1) {
    for (let i = 0; i < n; i++) {
      const b = this.bub[this._bi]; this._bi = (this._bi + 1) % MAX_BUB;
      b.x = x + (Math.random() - 0.5) * spread * 2; b.y = y + (Math.random() - 0.5) * spread;
      b.vy = -(30 + Math.random() * 40); b.ph = Math.random() * 6.3;
      b.r = (0.35 + Math.random() * 0.45) * big;
      b.life = b.max = 1.6 + Math.random() * 1.4;
    }
  }

  step(dt, view) {
    // bolhas do fundo (fontes termais), poucas por segundo
    this._ambT -= dt;
    if (this._ambT <= 0 && view) {
      this._ambT = 0.35 + Math.random() * 0.4;
      this.emit(view.left + Math.random() * (view.right - view.left), view.bottom + 4, 1 + (Math.random() < 0.3 ? 1 : 0), 3);
    }
    for (const b of this.bub) {
      if (b.life <= 0) continue;
      b.life -= dt;
      b.vy = Math.max(-95, b.vy - 40 * dt);
      b.y += b.vy * dt;
      b.ph += dt * 5;
      if (b.y < WATER.top + 6) b.life = 0;          // estoura na superfície
    }
  }

  // Coordenadas do mundo (depois dos inimigos e do jogador)
  drawWorld(ctx, t, left, right) {
    this._ensure();
    const img = this.bubImg;
    for (const b of this.bub) {
      if (b.life <= 0) continue;
      const sz = 16 * b.r, x = b.x + Math.sin(b.ph) * 2.2;
      ctx.globalAlpha = Math.min(1, b.life * 2, (b.max - b.life) * 6);
      ctx.drawImage(img, x - sz / 2, b.y - sz / 2, sz, sz);
    }
    ctx.globalAlpha = 1;
    // Superfície: linha de ondas e a luz do lado de fora
    const y0 = WATER.top;
    ctx.fillStyle = 'rgba(120,220,255,0.10)';
    ctx.fillRect(left - 4, y0 - 400, right - left + 8, 400);
    ctx.fillStyle = 'rgba(160,240,255,0.75)';
    const x0 = Math.floor(left / 6) * 6;
    for (let x = x0; x < right + 6; x += 6) {
      const h = Math.sin(x * 0.045 + t * 2.2) * 2.5 + Math.sin(x * 0.11 - t * 3.1) * 1.2;
      ctx.fillRect(x, y0 + h, 6, 2);
    }
  }

  // Coordenadas de tela (por cima de tudo, antes da interface). q = qualidade (resolução dinâmica)
  drawScreen(ctx, W, H, s, t, left, top, q) {
    this._ensure();
    // tom azul: mais claro perto da superfície, mais escuro no fundo
    const surfY = (WATER.top - top) * s;
    if (!this._tint || this._tintH !== H) {
      this._tint = ctx.createLinearGradient(0, 0, 0, H);
      this._tint.addColorStop(0, 'rgba(30,140,220,0.16)');
      this._tint.addColorStop(1, 'rgba(0,16,60,0.34)');
      this._tintH = H;
    }
    ctx.fillStyle = this._tint;
    ctx.fillRect(0, Math.max(0, surfY), W, H);

    ctx.globalCompositeOperation = 'lighter';
    // feixes de luz da superfície (parallax lento + balanço)
    const rw = 70 * s, rh = Math.min(H * 0.9, 360 * s);
    const ry = Math.max(0, surfY);
    for (let i = 0; i < 4; i++) {
      const base = ((i * 173 - left * 0.25) % 520 + 520) % 520;
      const x = (base - 60) * s + Math.sin(t * 0.5 + i * 1.7) * 18 * s;
      ctx.globalAlpha = 0.35 + 0.2 * Math.sin(t * 0.8 + i * 2.1);
      ctx.save();
      ctx.translate(x, ry);
      ctx.transform(1, 0, 0.35, 1, 0, 0);                 // inclinado, como luz de cima
      ctx.drawImage(this.ray, 0, 0, rw, rh);
      ctx.restore();
    }
    // cáusticas: textura repetida deslizando (duas camadas em sentidos opostos quando sobra desempenho)
    if (!this._pat) this._pat = ctx.createPattern(this.caus, 'repeat');
    const layers = q >= 0.7 ? 2 : 1;
    for (let k = 0; k < layers; k++) {
      const sc = (k ? 2.2 : 1.7) * s / 2;
      const ox = -left * s * 0.5 + t * (k ? -9 : 7) * s, oy = -top * s * 0.5 + t * (k ? 4 : -3) * s;
      ctx.globalAlpha = k ? 0.05 : 0.075;
      const offX = ox % (96 * sc), offY = oy % (96 * sc), y0 = Math.max(0, surfY);
      ctx.save();
      ctx.setTransform(sc, 0, 0, sc, offX, offY);
      ctx.fillStyle = this._pat;
      ctx.fillRect(-96 * 2, (y0 - offY) / sc, W / sc + 96 * 4, (H - y0) / sc + 96);
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }
}
