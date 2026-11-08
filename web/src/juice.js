// Efeitos "de acabamento" feitos por código (sem sprites), pensados para celular:
//  - rastro em fita (dash, torpedo, bumerangues, investidas de chefões e tubarões)
//  - números de dano (dígitos pré-desenhados; golpes seguidos no mesmo inimigo somam num número só)
//  - brilho de impacto (estrela de 4 pontas pré-desenhada) em críticos e golpes fortes
//  - onda de distorção na tela (pisões, explosões, morte de chefe): a tela é redesenhada ampliada num anel
//  - glitch na tela (dano no jogador, troca de fase, portal): faixas deslocadas + separação de cores
//  - brilho neon (bloom) leve: a tela reduzida e borrada somada por cima — só com sobra de desempenho
// Tudo é pré-desenhado uma vez; a cada quadro só há drawImage e linhas. A qualidade (q) segue a resolução dinâmica.

const MAX_NUM = 36, MAX_SHOCK = 2, MAX_FLARE = 12;

function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// Dígitos com contorno escuro (branco = normal, dourado = crítico)
function buildDigits() {
  const H = 26, W = 17, c = canvas(W * 10, H * 2), x = c.getContext('2d');
  x.font = 'bold 22px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.lineJoin = 'round';
  for (let row = 0; row < 2; row++) {
    for (let d = 0; d < 10; d++) {
      const cx = d * W + W / 2, cy = row * H + H / 2 + 1;
      x.lineWidth = 5; x.strokeStyle = row ? '#5a1a00' : '#1a0a2a'; x.strokeText(String(d), cx, cy);
      x.fillStyle = row ? '#ffd84d' : '#ffffff'; x.fillText(String(d), cx, cy);
    }
  }
  return { img: c, W, H };
}

function buildFlare() {
  const S = 64, c = canvas(S, S), x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.15, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  x.globalCompositeOperation = 'lighter';
  for (const [w, h] of [[S, 3], [3, S]]) {               // raios em cruz
    const gl = x.createLinearGradient(S / 2 - w / 2, S / 2 - h / 2, S / 2 + w / 2, S / 2 + h / 2);
    gl.addColorStop(0, 'rgba(255,255,255,0)'); gl.addColorStop(0.5, 'rgba(255,255,255,0.95)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = gl; x.fillRect(S / 2 - w / 2, S / 2 - h / 2, w, h);
  }
  return c;
}

export class Juice {
  constructor() {
    this.nums = Array.from({ length: MAX_NUM }, () => ({ life: 0 }));
    this.shocks = [];
    this.flares = Array.from({ length: MAX_FLARE }, () => ({ life: 0 }));
    this.glitchT = 0; this.glitchMax = 0;
    this.digits = null; this.flareImg = null; this._bloom = null;
    this.bloomOn = true; this.numbersOn = true;
  }

  _ensure() {
    if (this.digits) return;
    this.digits = buildDigits();
    this.flareImg = buildFlare();
  }

  reset() {
    for (const n of this.nums) n.life = 0;
    for (const f of this.flares) f.life = 0;
    this.shocks.length = 0; this.glitchT = 0;
  }

  // ---------- gatilhos ----------
  number(e, amount, crit) {
    if (!this.numbersOn || amount < 1 || amount > 1e5) return;
    // golpes seguidos no mesmo inimigo viram um número só, que cresce
    for (const n of this.nums) {
      if (n.life > 0 && n.ref === e && n.age < 0.18 && n.crit === crit) { n.v += amount; n.age = 0; n.life = n.max; n.pop = 1; return; }
    }
    let n = this.nums.find((o) => o.life <= 0);
    if (!n) n = this.nums.reduce((a, b) => (a.life < b.life ? a : b));
    n.ref = e; n.v = amount; n.crit = crit; n.x = e.cx + (Math.random() - 0.5) * e.w * 0.5; n.y = e.y - 2;
    n.vx = (Math.random() - 0.5) * 30; n.age = 0; n.life = n.max = crit ? 0.9 : 0.65; n.pop = 1;
  }

  flare(x, y, size, color) {
    let f = this.flares.find((o) => o.life <= 0) || this.flares[0];
    f.x = x; f.y = y; f.size = size; f.color = color; f.life = f.max = 0.18; f.rot = Math.random() * 0.8;
  }

  // Onda de distorção (coordenadas do mundo). strength ~ 0,04 a 0,12
  shock(x, y, radius, strength = 0.07, life = 0.45) {
    if (this.shocks.length >= MAX_SHOCK) this.shocks.shift();
    this.shocks.push({ x, y, R: radius, k: strength, t: 0, life });
  }

  glitch(time) { if (time > this.glitchT) { this.glitchT = this.glitchMax = time; } }

  step(dt) {
    for (const n of this.nums) {
      if (n.life <= 0) continue;
      n.life -= dt; n.age += dt; n.pop = Math.max(0, n.pop - dt * 6);
      n.y -= (n.crit ? 34 : 26) * dt; n.x += n.vx * dt;
    }
    for (const f of this.flares) if (f.life > 0) f.life -= dt;
    for (let i = this.shocks.length - 1; i >= 0; i--) { const s = this.shocks[i]; s.t += dt; if (s.t >= s.life) this.shocks.splice(i, 1); }
    if (this.glitchT > 0) this.glitchT -= dt;
  }

  // ---------- rastro em fita (o dono guarda os pontos em o._tr) ----------
  static push(o, x, y, now, max = 10) {
    const tr = o._tr || (o._tr = []);
    const last = tr[tr.length - 1];
    if (last && Math.abs(last.x - x) + Math.abs(last.y - y) < 2) { last.t = now; return; }
    tr.push({ x, y, t: now });
    if (tr.length > max) tr.shift();
  }

  // Fita que afina e some com a idade dos pontos (life em s); duas passadas: halo colorido + miolo claro
  ribbon(ctx, o, now, color, width, life = 0.22) {
    const tr = o._tr;
    if (!tr) return;
    while (tr.length && now - tr[0].t > life) tr.shift();
    if (tr.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const [col, wk, al] of [[color, 1, 0.55], ['#ffffff', 0.35, 0.8]]) {
      ctx.strokeStyle = col;
      for (let i = 1; i < tr.length; i++) {
        const a = tr[i - 1], b = tr[i], k = 1 - (now - b.t) / life;
        if (k <= 0) continue;
        ctx.globalAlpha = al * k;
        ctx.lineWidth = Math.max(0.5, width * wk * (0.3 + 0.7 * (i / tr.length)));
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    ctx.restore();
  }

  // ---------- desenho em coordenadas do mundo (depois das partículas) ----------
  drawWorld(ctx) {
    this._ensure();
    for (const f of this.flares) {
      if (f.life <= 0) continue;
      const k = f.life / f.max, sz = f.size * (0.6 + 0.6 * (1 - k));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = k;
      ctx.translate(f.x, f.y); ctx.rotate(f.rot);
      ctx.drawImage(this.flareImg, -sz / 2, -sz / 2, sz, sz);
      ctx.restore();
    }
    ctx.save();
    const D = this.digits;
    for (const n of this.nums) {
      if (n.life <= 0) continue;
      const str = String(Math.round(n.v));
      const sc = (n.crit ? 0.62 : 0.46) * (1 + n.pop * 0.5);
      const w = D.W * sc * 0.82, h = D.H * sc;
      ctx.globalAlpha = Math.min(1, n.life / n.max * 3);
      let x = n.x - (str.length * w) / 2;
      const row = n.crit ? 1 : 0;
      for (let i = 0; i < str.length; i++) {
        const d = str.charCodeAt(i) - 48;
        ctx.drawImage(D.img, d * D.W, row * D.H, D.W, D.H, x, n.y - h, w / 0.82, h);
        x += w;
      }
    }
    ctx.restore();
  }

  // ---------- desenho em coordenadas de tela (depois do mundo e da água) ----------
  drawScreen(ctx, cv, W, H, s, left, top, q) {
    // onda de distorção: a tela é redesenhada ampliada dentro de um anel que cresce
    if (q >= 0.7) {
      for (const sh of this.shocks) {
        const k = sh.t / sh.life, cx = (sh.x - left) * s, cy = (sh.y - top) * s;
        const r = sh.R * s * (0.15 + 0.85 * k), th = Math.max(6, r * 0.28), amp = sh.k * (1 - k);
        if (r < 4) continue;
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, r + th, 0, Math.PI * 2); ctx.arc(cx, cy, Math.max(0, r - th), 0, Math.PI * 2, true);
        ctx.clip();
        const z = 1 + amp, sw = (r + th) * 2, sx = cx - sw / 2, sy = cy - sw / 2;
        ctx.drawImage(cv, sx, sy, sw, sw, cx - (sw * z) / 2, cy - (sw * z) / 2, sw * z, sw * z);
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.25 * (1 - k);
        ctx.strokeStyle = '#bfefff'; ctx.lineWidth = 2 * s;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }
    // brilho neon: tela reduzida 1/8 (borra de graça ao ampliar) somada por cima
    // Só com sobra de desempenho: se a soma custar mais de ~1,5 ms por quadro, desliga sozinha na partida.
    // (Se a placa de vídeo apertar, a resolução dinâmica baixa a qualidade e o brilho também sai.)
    if (this.bloomOn && q >= 1) {
      const t0 = performance.now();
      const bw = Math.max(1, Math.round(W / 8)), bh = Math.max(1, Math.round(H / 8));
      let b = this._bloom;
      if (!b || b.width !== bw || b.height !== bh) { b = this._bloom = canvas(bw, bh); b.x = b.getContext('2d'); }
      b.x.imageSmoothingEnabled = true;
      b.x.globalCompositeOperation = 'copy';
      b.x.filter = 'none';
      b.x.drawImage(cv, 0, 0, bw, bh);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.16;
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(b, 0, 0, W, H);
      ctx.restore();
      const dt = performance.now() - t0;
      this._bloomMs = this._bloomMs === undefined ? dt : this._bloomMs * 0.9 + dt * 0.1;
      if ((this._bloomN = (this._bloomN || 0) + 1) > 30 && this._bloomMs > 1.5) this.bloomOn = false;
    }
    // glitch: faixas da tela deslocadas e uma cópia ciano/magenta
    if (this.glitchT > 0) {
      const k = this.glitchT / this.glitchMax, n = 3 + Math.round(4 * k);
      ctx.save();
      // copiar faixas da própria tela é caro em celular simples: só com qualidade alta (senão ficam só as linhas neon)
      for (let i = 0; q >= 0.7 && i < n; i++) {
        const y = Math.random() * H, h = (6 + Math.random() * 26) * s * 0.5, dx = (Math.random() - 0.5) * 22 * s * k;
        ctx.drawImage(cv, 0, y, W, h, dx, y, W, h);
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.22 * k;
      ctx.fillStyle = '#ff4df0'; ctx.fillRect(0, Math.random() * H, W, 2 * s);
      ctx.fillStyle = '#5ef0ff'; ctx.fillRect(0, Math.random() * H, W, 2 * s);
      ctx.restore();
    }
  }
}
