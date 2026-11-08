// Desenho no canvas. Visual pixel art neon: sprites pré-desenhados (com o brilho já "assado" = neon barato),
// movimento suave (posições interpoladas, sem prender na grade), partículas aditivas e parallax em 3 camadas.

import { Ambient } from './ambient.js';
import { TILE, CHUNK_W, CHUNK_H, VIEW_W } from './config.js';
import { SOLID, ONEWAY, EMPTY } from './world.js';
import { PS } from './player.js';
import { ENEMY_TYPES } from './enemies.js';
import { PK } from './pickups.js';
import { Rng, hash } from './rng.js';
import { BIOMES, biomeIndexAt } from './biomes.js';
import { BIOME_ART, NEAR_SS } from './biomeArt.js';
import { ATLAS, ATLAS_SS, BIOME_SHEETS } from './atlasData.js';
import { Juice } from './juice.js';
import { sectorInfo } from './biomes.js';

const PAD = 6;
const CHUNK_PX = CHUNK_W * TILE;
const lerp = (a, b, t) => a + (b - a) * t;

// Cada quadro sabe de qual folha veio (fr.s); a folha é carregada sob demanda (Render._sheet)
for (const a of Object.values(ATLAS)) for (const f of a.frames) f.s = a.s;

const RUSH = new Set(['charge', 'dash', 'swoop', 'sweep', 'lunge', 'leap', 'bite']);   // investidas: deixam rastro

const BEAM_COLORS = { pink: ['#c04dff', '#ff4df0', '#ff9af0'], cyan: ['#1a8aff', '#5ef0ff', '#c8fbff'] };

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h));
  return c;
}

function rr(x, X, Y, W, H, r) {
  x.beginPath();
  x.moveTo(X + r, Y); x.lineTo(X + W - r, Y); x.quadraticCurveTo(X + W, Y, X + W, Y + r);
  x.lineTo(X + W, Y + H - r); x.quadraticCurveTo(X + W, Y + H, X + W - r, Y + H);
  x.lineTo(X + r, Y + H); x.quadraticCurveTo(X, Y + H, X, Y + H - r);
  x.lineTo(X, Y + r); x.quadraticCurveTo(X, Y, X + r, Y);
  x.closePath();
}

function sprite(w, h, draw, glow, blur = 5) {
  const c = makeCanvas(w + PAD * 2, h + PAD * 2);
  const x = c.getContext('2d');
  x.translate(PAD, PAD);
  if (glow) { x.shadowColor = glow; x.shadowBlur = blur; }
  draw(x, w, h);
  const white = makeCanvas(c.width, c.height);
  const wx = white.getContext('2d');
  wx.drawImage(c, 0, 0);
  wx.globalCompositeOperation = 'source-in';
  wx.fillStyle = '#ffffff';
  wx.fillRect(0, 0, white.width, white.height);
  return { img: c, white, w, h };
}

// ---------------- Desenhos (formas provisórias no estilo da arte conceitual) ----------------

const DRAW = {
  gato(x, w, h) {
    x.strokeStyle = '#ff9a3c'; x.lineWidth = 3; x.lineCap = 'round';
    x.beginPath(); x.moveTo(4, h - 11); x.quadraticCurveTo(-5, h - 15, -2, h - 26); x.stroke();
    x.fillStyle = '#e8761f'; x.fillRect(5, h - 6, 5, 6); x.fillRect(13, h - 6, 5, 6);
    x.fillStyle = '#1fb5d6'; rr(x, 3, 14, 17, 16, 4); x.fill();
    x.fillStyle = '#ff4df0'; x.fillRect(10, 16, 3, 11);
    x.fillStyle = '#ff9a3c'; rr(x, 3, 2, 17, 13, 5); x.fill();
    x.beginPath(); x.moveTo(4, 5); x.lineTo(6, -3); x.lineTo(10, 3); x.fill();
    x.beginPath(); x.moveTo(13, 3); x.lineTo(17, -3); x.lineTo(19, 5); x.fill();
    x.fillStyle = '#5ef0ff'; rr(x, 8, 6, 13, 4, 2); x.fill();
    x.fillStyle = '#ff4df0'; x.fillRect(15, 6, 5, 4);
  },
  rato(x, w, h) {
    x.strokeStyle = '#ff7ab0'; x.lineWidth = 1.5;
    x.beginPath(); x.moveTo(3, h - 5); x.quadraticCurveTo(-5, h - 2, -4, h - 10); x.stroke();
    x.fillStyle = '#8fa3b8'; x.beginPath(); x.ellipse(w / 2, h / 2 + 1, w / 2 - 1, h / 2 - 1, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#b8c6d6'; x.beginPath(); x.arc(w - 7, 3, 3, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#4dff88'; x.fillRect(w - 5, 5, 3, 2); x.fillRect(5, 4, 6, 2);
  },
  esquilo(x, w, h) {
    x.fillStyle = '#c8682c';
    x.beginPath(); x.ellipse(2, h / 2 - 2, 6, 10, -0.3, 0, Math.PI * 2); x.fill();
    rr(x, 5, 6, 13, 15, 5); x.fill();
    x.beginPath(); x.arc(14, 6, 5, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ffffff'; x.fillRect(15, 4, 2, 2);
    x.fillStyle = '#ff9a3c'; x.beginPath(); x.arc(17, 14, 3, 0, Math.PI * 2); x.fill();
  },
  drone(x, w, h) {
    x.strokeStyle = '#c3c9d8'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(-3, h / 2); x.lineTo(4, h / 2); x.moveTo(w - 4, h / 2); x.lineTo(w + 3, h / 2); x.stroke();
    x.fillStyle = '#8b93a8'; x.beginPath(); x.arc(w / 2, h / 2, w / 2 - 2, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ff3b5c'; x.beginPath(); x.arc(w / 2, h / 2, 4, 0, Math.PI * 2); x.fill();
  },
  morcego(x, w, h) {
    x.fillStyle = '#9a4dff';
    x.beginPath(); x.moveTo(w / 2, h / 2); x.lineTo(0, 0); x.lineTo(3, h); x.closePath(); x.fill();
    x.beginPath(); x.moveTo(w / 2, h / 2); x.lineTo(w, 0); x.lineTo(w - 3, h); x.closePath(); x.fill();
    x.fillStyle = '#6b5a8f'; x.beginPath(); x.arc(w / 2, h / 2, 6, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#ff7ab0'; x.fillRect(w / 2 - 3, h / 2 - 2, 2, 2); x.fillRect(w / 2 + 1, h / 2 - 2, 2, 2);
  },
  hound(x, w, h) {
    x.fillStyle = '#5d6270';
    rr(x, 2, 5, w - 10, 11, 4); x.fill();
    rr(x, w - 12, 2, 12, 10, 3); x.fill();
    x.fillRect(5, 14, 4, h - 14); x.fillRect(w - 16, 14, 4, h - 14);
    x.fillStyle = '#ff7a1a';
    for (let i = 0; i < 4; i++) { x.beginPath(); x.moveTo(6 + i * 5, 6); x.lineTo(8 + i * 5, 0); x.lineTo(10 + i * 5, 6); x.fill(); }
    x.fillStyle = '#ff3b3b'; x.fillRect(w - 5, 5, 3, 2);
  },
  vespa(x, w, h) {
    x.fillStyle = 'rgba(220,240,255,0.8)';
    x.beginPath(); x.ellipse(8, 3, 6, 4, -0.5, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#e8c020'; x.beginPath(); x.ellipse(w / 2, h / 2 + 2, w / 2 - 1, h / 2 - 3, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#1a1420'; x.fillRect(7, 5, 3, h - 8); x.fillRect(13, 5, 3, h - 8);
    x.fillStyle = '#ffe14d'; x.beginPath(); x.moveTo(0, h / 2 + 2); x.lineTo(-4, h / 2 + 4); x.lineTo(1, h / 2 + 5); x.fill();
  },
  urso(x, w, h) {
    x.fillStyle = '#6a4a32';
    x.beginPath(); x.arc(9, 7, 5, 0, Math.PI * 2); x.arc(w - 9, 7, 5, 0, Math.PI * 2); x.fill();
    rr(x, 4, 4, w - 8, 18, 8); x.fill();
    rr(x, 1, 18, w - 2, h - 18, 9); x.fill();
    x.fillStyle = '#8a8f99'; rr(x, w - 12, 22, 12, 18, 4); x.fill();
    x.strokeStyle = '#ff2b4a'; x.lineWidth = 2;
    x.beginPath(); x.moveTo(10, 26); x.lineTo(20, 32); x.lineTo(30, 26); x.stroke();
    x.fillStyle = '#ff2b4a'; x.fillRect(12, 11, 4, 3); x.fillRect(w - 16, 11, 4, 3);
  },
  battery(x) {
    x.fillStyle = '#5ef0ff'; rr(x, 0, 2, 8, 11, 2); x.fill();
    x.fillRect(2, 0, 4, 2);
    x.fillStyle = '#0b2a3a'; x.fillRect(3, 5, 2, 5); x.fillRect(2, 6.5, 4, 2);
  },
  scrap(x) {
    x.fillStyle = '#ffc94d'; x.beginPath(); x.arc(5, 5, 5, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#a8761a'; x.beginPath(); x.arc(5, 5, 2, 0, Math.PI * 2); x.fill();
  },
  health(x) {
    x.fillStyle = '#ff5c8a'; rr(x, 0, 0, 11, 12, 4); x.fill();
    x.fillStyle = '#ffffff'; x.fillRect(4, 2, 3, 8); x.fillRect(1.5, 4.5, 8, 3);
  },
  shuriken(x) {
    x.fillStyle = '#ff4df0';
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4, r = i % 2 ? 2 : 6;
      x.lineTo(6 + Math.cos(a) * r, 6 + Math.sin(a) * r);
    }
    x.closePath(); x.fill();
  },
  drone_orb(x) {
    x.fillStyle = '#4dffa6'; x.beginPath(); x.arc(5, 5, 5, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#e8fff4'; x.beginPath(); x.arc(5, 5, 2, 0, Math.PI * 2); x.fill();
  },
  acorn(x) {
    x.fillStyle = '#ff9a3c'; x.beginPath(); x.ellipse(4, 6, 4, 4.5, 0, 0, Math.PI * 2); x.fill();
    x.fillStyle = '#7a4a1a'; x.fillRect(0, 0, 8, 3);
  },
};

// ---------------- Cenário ----------------

function buildChunkCanvas(v, biome, ci, R) {
  const T = R.bioTex[biome.id];                  // texturas da folha de cenários (se já carregaram)
  const ox = ci * CHUNK_PX;                      // origem do chunk no mundo: alinha as texturas entre chunks
  const c = makeCanvas(CHUNK_PX, CHUNK_H * TILE);
  const x = c.getContext('2d');
  const at = (r, col) => (r < 0 || r >= CHUNK_H || col < 0 || col >= CHUNK_W) ? -1 : v.grid[r * CHUNK_W + col];
  const rng = new Rng(hash(0x5eed, ci));
  c.props = [];                                  // onde cada peça ficou (para as animações de ambiente)

  // Peças de cenário do bioma, atrás dos blocos (não colidem)
  if (R.atlas && biome.props.length) {
    const n = 1 + (rng.chance(0.6) ? 1 : 0) + (rng.chance(0.3) ? 1 : 0) + (biome.propsExtra || 0);
    let total = 0;
    for (const [, w] of biome.props) total += w;
    const used = [];
    for (let k = 0; k < n; k++) {
      let roll = rng.next() * total, name = biome.props[0][0], pa = 0.85, lift = 0;
      for (const [nm, w, al, lf] of biome.props) { roll -= w; if (roll < 0) { name = nm; pa = al || 0.85; lift = lf || 0; break; } }
      const fr = R._frameAt(name, 0);
      if (!fr) continue;
      const pw = fr[2] / ATLAS_SS;
      let px = rng.range(pw / 2 + 4, CHUNK_PX - pw / 2 - 4);
      if (used.some((u) => Math.abs(u - px) < pw * 0.8)) continue;
      used.push(px);
      const col = Math.max(0, Math.min(CHUNK_W - 1, Math.floor(px / TILE)));
      let h = 0;
      for (let r = CHUNK_H - 1; r >= 0 && at(r, col) === SOLID; r--) h++;
      const footY = name === 'prop.claw' ? 5 * TILE : (CHUNK_H - h) * TILE - lift;   // lift: placas penduradas
      if (name.startsWith('deco.')) {               // animado: o ambient.js desenha a cada quadro
        c.props.push({ n: name, live: true, fx: px, fy: footY, x: px - fr[4] / ATLAS_SS, y: footY - fr[5] / ATLAS_SS, w: fr[2] / ATLAS_SS, h: fr[3] / ATLAS_SS, seed: rng.next() * 100 });
        continue;
      }
      x.globalAlpha = pa;
      x.imageSmoothingEnabled = true;
      x.drawImage(R._img(fr.s), fr[0], fr[1], fr[2], fr[3], px - fr[4] / ATLAS_SS, footY - fr[5] / ATLAS_SS, fr[2] / ATLAS_SS, fr[3] / ATLAS_SS);
      x.globalAlpha = 1;
      c.props.push({ n: name.slice(5), x: px - fr[4] / ATLAS_SS, y: footY - fr[5] / ATLAS_SS, w: fr[2] / ATLAS_SS, h: fr[3] / ATLAS_SS, seed: rng.next() * 100 });
    }
  }

  const [c0, c1, c2] = biome.solid;
  if (T) {
    // Preenchimento com textura repetível alinhada ao mundo + faixa de superfície + sombra pela profundidade
    const fillP = x.createPattern(T.fill, 'repeat'), topP = x.createPattern(T.top, 'repeat');
    const fw = T.fill.width, tw = T.top.width, th = T.top.height;
    for (let col = 0; col < CHUNK_W; col++) {
      let depth = 0;
      for (let r = 0; r < CHUNK_H; r++) {
        if (v.grid[r * CHUNK_W + col] !== SOLID) { depth = 0; continue; }
        const X = col * TILE, Y = r * TILE;
        x.save(); x.translate(-(ox % fw), 0); x.fillStyle = fillP; x.fillRect(X + (ox % fw), Y, TILE, TILE); x.restore();
        const above = at(r - 1, col);
        if (depth === 0 && above !== SOLID) {
          x.save(); x.translate(-(ox % tw), Y); x.fillStyle = topP; x.fillRect(X + (ox % tw), 0, TILE, th); x.restore();
        } else if (depth > 0) {
          x.fillStyle = `rgba(4,2,12,${Math.min(0.6, 0.12 + depth * 0.1)})`; x.fillRect(X, Y, TILE, TILE);
        }
        depth++;
      }
    }
  } else {
    for (let r = 0; r < CHUNK_H; r++) {
      for (let col = 0; col < CHUNK_W; col++) {
        if (v.grid[r * CHUNK_W + col] !== SOLID) continue;
        const X = col * TILE, Y = r * TILE;
        x.fillStyle = c0; x.fillRect(X, Y, TILE, TILE);
        x.fillStyle = c1; x.fillRect(X + 2, Y + 2, TILE - 4, TILE - 4);
        if ((col + r) % 3 === 0) { x.fillStyle = c2; x.fillRect(X + 8, Y + 10, 3, 3); }
      }
    }
  }

  // Plataformas de mão única: sprite do bioma esticado sobre cada trecho contínuo
  const plat = R.atlas ? R._frameAt(biome.platform, 0) : null;
  const platP = T ? x.createPattern(T.plat, 'repeat') : null;
  for (let r = 0; r < CHUNK_H; r++) {
    let col = 0;
    while (col < CHUNK_W) {
      if (v.grid[r * CHUNK_W + col] !== ONEWAY) { col++; continue; }
      let end = col;
      while (end < CHUNK_W && v.grid[r * CHUNK_W + end] === ONEWAY) end++;
      const X = col * TILE, Y = r * TILE, W = (end - col) * TILE;
      if (platP) {
        const pw = T.plat.width;
        x.save(); x.translate(-(ox % pw), Y); x.fillStyle = platP; x.fillRect(X + (ox % pw), 0, W, T.plat.height); x.restore();
      } else if (plat) {
        const ph = Math.max(12, Math.min(34, (fr2h(plat) / fr2w(plat)) * W));
        x.imageSmoothingEnabled = true;
        x.drawImage(R._img(plat.s), plat[0], plat[1], plat[2], plat[3], X, Y, W, ph);
      } else {
        x.fillStyle = '#2a1d4a'; x.fillRect(X, Y, W, 9);
      }
      col = end;
    }
  }

  // Bordas neon (com brilho) só onde o bloco fica exposto
  x.shadowBlur = 8;
  for (let r = 0; r < CHUNK_H; r++) {
    for (let col = 0; col < CHUNK_W; col++) {
      const t = v.grid[r * CHUNK_W + col];
      const X = col * TILE, Y = r * TILE;
      if (t === SOLID) {
        const above = at(r - 1, col);
        if (above === EMPTY || above === ONEWAY || above === -1) {
          x.shadowColor = biome.edge; x.fillStyle = biome.edge; x.fillRect(X, Y, TILE, T ? 2 : 3);
        }
        x.shadowColor = biome.side; x.fillStyle = biome.side;
        if (at(r, col - 1) === EMPTY) x.fillRect(X, Y, 2, TILE);
        if (at(r, col + 1) === EMPTY) x.fillRect(X + TILE - 2, Y, 2, TILE);
      } else if (t === ONEWAY) {
        x.shadowColor = biome.oneway; x.fillStyle = biome.oneway; x.fillRect(X, Y, TILE, 2);
      }
    }
  }
  return c;
}

const fr2w = (fr) => fr[2];
const fr2h = (fr) => fr[3];

// Silhuetas do fundo, com variação por bioma
function buildSkyline(width, height, rng, opt) {
  const c = makeCanvas(width, height);
  const x = c.getContext('2d');
  const kind = opt.kind || 'city';
  let bx = 0;
  while (bx < width) {
    let bw = rng.int(opt.minW, opt.maxW);
    let bh = rng.int(opt.minH, opt.maxH);
    x.fillStyle = opt.color;
    if (kind === 'shacks') {
      // barracos empilhados, irregulares
      let y = height;
      const floors = rng.int(2, 6);
      for (let f = 0; f < floors && y > 40; f++) {
        const w2 = bw * rng.range(0.7, 1.1), h2 = rng.int(18, 34), off = rng.range(-8, 8);
        x.fillRect(bx + off, y - h2, Math.min(w2, width - bx), h2);
        if (opt.windows && rng.chance(0.6)) { x.fillStyle = opt.win[rng.int(0, opt.win.length)]; x.fillRect(bx + off + 4, y - h2 + 6, 4, 5); x.fillStyle = opt.color; }
        y -= h2;
      }
      bx += bw * 0.8;
      continue;
    }
    if (kind === 'tunnel') {
      // subterrâneo: pilares, vigas e canos (o "céu" é o teto do túnel)
      x.fillRect(bx, 0, rng.int(14, 26), height);
      if (rng.chance(0.6)) x.fillRect(bx, rng.int(20, 90), rng.int(60, 140), rng.int(4, 9));
      if (opt.windows && rng.chance(0.5)) { x.fillStyle = opt.win[rng.int(0, opt.win.length)]; x.fillRect(bx + 4, rng.int(40, height - 40), 3, rng.int(8, 30)); x.fillStyle = opt.color; }
      bx += rng.int(50, 110);
      continue;
    }
    if (kind === 'reef') {
      // fundo do mar: rochas pontudas, colunas de coral e algas compridas
      const tx = bx + bw / 2;
      if (rng.chance(0.45)) {
        const th = rng.int(60, height - 40);
        x.beginPath(); x.moveTo(bx, height); x.lineTo(tx - 6, height - th); x.lineTo(tx + 8, height - th * 0.92); x.lineTo(bx + bw, height); x.fill();
      } else if (rng.chance(0.5)) {
        for (let k = 0; k < 3; k++) {
          const kh = rng.int(50, Math.min(220, height - 20)), kx = bx + k * 7;
          x.fillRect(kx, height - kh, 3, kh);
          for (let yy = height - kh; yy < height; yy += 14) x.fillRect(kx + (Math.floor(yy / 14) % 2 ? 3 : -4), yy, 4, 6);
        }
      } else {
        const th = rng.int(30, 90);
        x.fillRect(tx - 10, height - th, 20, th);
        x.beginPath(); x.arc(tx, height - th, 16, Math.PI, 0); x.fill();
      }
      if (opt.windows && rng.chance(0.4)) { x.fillStyle = opt.win[rng.int(0, opt.win.length)]; x.fillRect(tx + rng.int(-6, 6), height - rng.int(20, 60), 2, 2); x.fillStyle = opt.color; }
      bx += bw * 0.75;
      continue;
    }
    if (kind === 'trees') {
      // floresta: troncos tortos com copas redondas
      const th = rng.int(80, height - 30), tx = bx + bw / 2;
      x.fillRect(tx - 4, height - th, 8, th);
      for (let k = 0; k < 4; k++) { x.beginPath(); x.arc(tx + rng.range(-bw * 0.5, bw * 0.5), height - th + rng.range(-12, 10), rng.range(bw * 0.35, bw * 0.6), 0, Math.PI * 2); x.fill(); }
      if (opt.windows && rng.chance(0.5)) { x.fillStyle = opt.win[rng.int(0, opt.win.length)]; x.beginPath(); x.arc(tx + rng.range(-12, 12), height - th + rng.range(0, 30), 2, 0, 6.3); x.fill(); x.fillStyle = opt.color; }
      bx += bw * 0.7;
      continue;
    }
    if (kind === 'tower') {
      // topo da cidade: arranha-céus altíssimos e finos, com faixas de vidro
      bh = Math.round(bh * 1.25); bw = Math.round(bw * 0.8);
    }
    if (kind === 'port' && rng.chance(0.35)) {
      // pilha de contêineres
      const cols = rng.int(2, 4), rows = rng.int(1, 4);
      for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) x.fillRect(bx + k * 26, height - (r + 1) * 14, 24, 13);
      bw = cols * 26;
    } else if (kind === 'port' && rng.chance(0.3)) {
      // guindaste
      x.fillRect(bx + 10, height - bh, 6, bh);
      x.fillRect(bx - 20, height - bh, 70, 5);
      x.fillRect(bx + 40, height - bh, 2, rng.int(30, 70));
      bw = 60;
    } else if (kind === 'coast' && rng.chance(0.4)) {
      // coqueiro
      const th = rng.int(70, 130);
      x.fillRect(bx + 8, height - th, 4, th);
      for (let a = 0; a < 6; a++) {
        x.beginPath(); x.ellipse(bx + 10 + Math.cos(a) * 14, height - th + Math.sin(a) * 4, 16, 4, a, 0, Math.PI * 2); x.fill();
      }
      bw = 34;
    } else {
      if (kind === 'coast') bh = Math.round(bh * 0.6);
      x.fillRect(bx, height - bh, Math.min(bw, width - bx), bh);
      if (opt.antenna && rng.chance(0.3)) x.fillRect(bx + bw / 2, height - bh - 18, 2, 18);
      if (opt.windows) {
        for (let wy = height - bh + 8; wy < height - 6; wy += 10) {
          for (let wx = bx + 5; wx < bx + bw - 6; wx += 8) {
            if (!rng.chance(opt.windows)) continue;
            x.fillStyle = opt.win[rng.int(0, opt.win.length)];
            x.fillRect(wx, wy, 3, 4);
          }
        }
        x.fillStyle = opt.color;
      }
    }
    bx += bw + rng.int(0, opt.gap);
  }
  return c;
}

function buildSigns(width, height, rng, words, colors) {
  const c = makeCanvas(width, height);
  const x = c.getContext('2d');
  let sx = 30;
  while (sx < width - 60) {
    const color = colors[rng.int(0, colors.length)];
    const word = words[rng.int(0, words.length)];
    const vertical = rng.chance(0.4);
    const top = rng.int(40, height - 160);
    x.fillStyle = '#120c26';
    x.fillRect(sx + 10, top, 4, height - top);
    x.shadowColor = color; x.shadowBlur = 10;
    x.strokeStyle = color; x.lineWidth = 2;
    x.fillStyle = color;
    x.font = 'bold 13px monospace';
    if (vertical) {
      const h = word.length * 14 + 10;
      x.strokeRect(sx, top, 24, h);
      for (let i = 0; i < word.length; i++) x.fillText(word[i], sx + 7, top + 16 + i * 14);
    } else {
      const w = word.length * 9 + 14;
      x.strokeRect(sx, top, w, 22);
      x.fillText(word, sx + 7, top + 16);
    }
    x.shadowBlur = 0;
    sx += rng.int(90, 170);
  }
  return c;
}

// ---------------- Renderer ----------------

export class Renderer {
  constructor(canvas, game) {
    this.canvas = canvas;
    this.game = game;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.ambient = new Ambient(this);      // cenários vivos (ambient.js)
    this.chunkCache = new Map();          // poucos chunks visíveis por vez: cache pequeno (LRU)
    this.spr = {};
    this.debug = false;
    this.fps = 60; this._fpsAcc = 0; this._fpsN = 0;
    this._build();
    this.atlas = null; this.atlasWhite = null;
    // Desempenho: a imagem é decodificada UMA vez (ImageBitmap) e fica pronta na memória. Com <img>,
    // o navegador decodifica no primeiro desenho e pode descartar e decodificar de novo depois (engasgos).
    // A versão branca (piscar de dano) é feita só para os quadros que piscam, sob demanda.
    this.whiteCache = new Map();
    // Folhas de sprites: núcleo (personagens, inimigos, efeitos) sempre; chefões ao começar a partida;
    // peças de cenário só do bioma atual (e do próximo, quando o portal abre). As outras são liberadas.
    this.sheets = {};
    this._sheet('core');
    for (const b of ['coast', 'favelas', 'porto']) this._bioSheets(b);   // tela inicial
    // Texturas dos biomas (pequenas: carregam já); camadas próximas carregam quando o bioma aparece
    this.bioTex = {}; this.bioNear = {};
    for (const [id, a] of Object.entries(BIOME_ART)) {
      const t = new Image();
      t.onload = () => {
        const cut = (r) => { const c = makeCanvas(r[2], r[3]); c.getContext('2d').drawImage(t, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]); return c; };
        this.bioTex[id] = { fill: cut(a.fill), top: cut(a.top), plat: cut(a.plat) };
      };
      t.src = `assets/biomes/${id}_tex.webp`;
    }
  }

  // Carrega uma folha (uma vez) e devolve o bitmap, ou null enquanto não chegou
  _sheet(name) {
    let S = this.sheets[name];
    if (!S) {
      S = this.sheets[name] = { img: null };
      const img = new Image();
      img.onload = () => {
        const done = (bmp) => {
          if (this.sheets[name] !== S) { if (bmp.close) bmp.close(); return; }   // liberada antes de terminar
          S.img = bmp;
          if (name === 'core') this.atlas = bmp;
          this.chunkCache.clear();
        };
        if (window.createImageBitmap) createImageBitmap(img).then(done, () => done(img)); else done(img);
      };
      img.src = `assets/sprites/${name}.webp`;
    }
    return S.img;
  }

  _bioSheets(bid) { for (const sh of BIOME_SHEETS[bid] || []) this._sheet(sh); }
  _bioReady(bid) { return (BIOME_SHEETS[bid] || []).every((sh) => this.sheets[sh] && this.sheets[sh].img); }

  // Troca de setor: garante as folhas do cenário e solta da memória as que não servem mais
  _syncSheets(g) {
    const info = g.sectorInfo, key = g.state === 'title' ? 'title' : info ? info.n : -1;
    const portalKey = g.portal ? 1 : 0;
    if (key === this._sheetKey && portalKey === this._portalKey) return;
    this._sheetKey = key; this._portalKey = portalKey;
    const keep = new Set(['core']);
    if (key === 'title' || !info) for (const b of ['coast', 'favelas', 'porto']) for (const sh of BIOME_SHEETS[b] || []) keep.add(sh);
    else {
      keep.add('boss');
      for (const sh of BIOME_SHEETS[info.biome.id] || []) keep.add(sh);
      if (g.portal && !info.journey) for (const sh of BIOME_SHEETS[sectorInfo(info.n + 1).biome.id] || []) keep.add(sh);   // próximo setor
    }
    for (const sh of keep) this._sheet(sh);
    for (const [name, S] of Object.entries(this.sheets)) {
      if (keep.has(name)) continue;
      if (S.img && S.img.close) S.img.close();
      delete this.sheets[name];
      for (const k of this.whiteCache.keys()) if (k.s === name) this.whiteCache.delete(k);
    }
  }

  _near(id) {
    if (!BIOME_ART[id]) return null;
    let n = this.bioNear[id];
    if (!n) {
      n = this.bioNear[id] = { ready: null };
      const im = new Image();
      im.onload = () => { if (window.createImageBitmap) createImageBitmap(im).then((b) => { n.ready = b; }, () => { n.ready = im; }); else n.ready = im; };
      im.src = `assets/biomes/${id}_near.webp`;
    }
    return n.ready;
  }

  // Quadro de uma animação do atlas no tempo t (ou null se o atlas ainda não carregou)
  _frame(name, t) {
    const a = ATLAS[name];
    if (!a || !this._img(a.s)) return null;
    let i = Math.floor(Math.max(0, t) * a.fps);
    i = a.loop ? i % a.frames.length : Math.min(i, a.frames.length - 1);
    return a.frames[i];
  }

  _img(sheet) { const S = this.sheets[sheet]; return S ? S.img : null; }

  _frameAt(name, i) {
    const a = ATLAS[name];
    if (!a || !this._img(a.s)) return null;
    return a.frames[i % a.frames.length];
  }

  // Desenha o quadro com a âncora (pés ou centro) no ponto (x, y)
  // Chefões: animação por código em cima dos poucos quadros da folha — respiração, passada,
  // agachar antes do golpe, inclinar no salto, achatar ao pousar, esticar na investida, flutuar.
  _drawBoss(ctx, e, fr, x, y, facing, white, t) {
    let sx = 1, sy = 1, rot = 0, dx = 0, dy = 0;
    const st = e.state, sp = Math.abs(e.vx);
    if (e.def.flying) {
      dy = Math.sin(t * 2.4 + e._q) * 4;
      rot = Math.max(-0.2, Math.min(0.2, e.vx / 900)) * facing;
      sy = 1 + Math.sin(t * 4.8) * 0.025; sx = 1 - Math.sin(t * 4.8) * 0.02;
      if (st === 'tele') { const k = 1 + Math.sin(t * 34) * 0.04; sx *= k; sy *= k; dx = (Math.random() - 0.5) * 2; }
      if (st === 'dash' || st === 'swoop') { sx = 1.12; sy = 0.9; rot = Math.atan2(e.vy, Math.abs(e.vx) + 1) * 0.35 * facing; }
      if (st === 'rest') { sy = 0.9; sx = 1.08; }
      this._drawFrame(ctx, fr, x + e.w / 2 + dx, y + e.h / 2 + dy, facing, white, sx, sy, rot);
    } else {
      if (st === 'tele') {                           // prepara o golpe: abaixa, treme
        const k = Math.min(1, (e.flash > 0 ? 1 : 0.6));
        sy = 1 - 0.1 * k; sx = 1 + 0.07 * k; dx = (Math.random() - 0.5) * 2.5;
        if (e.next === 'roar') { sy = 1.06; sx = 0.97; rot = -0.08 * facing; }
      } else if (st === 'leap') {
        rot = Math.max(-0.35, Math.min(0.35, e.vy / 1100)) * facing; sy = 1.06; sx = 0.95;
      } else if (st === 'charge' || st === 'swipe' || st === 'bite') {
        rot = 0.07 * facing; sx = 1.1; sy = 0.93; dy = Math.sin(t * 40) * 1.2;
      } else if (sp > 25 && e.onGround) {            // passada: sobe e desce, balança
        const ph = t * (6 + sp / 30);
        dy = -Math.abs(Math.sin(ph)) * 3; rot = Math.sin(ph) * 0.035 * facing; sy = 1 + Math.sin(ph * 2) * 0.025;
      } else {                                       // parado: respira
        sy = 1 + Math.sin(t * 3) * 0.02; sx = 1 - Math.sin(t * 3) * 0.012;
      }
      if (e.landT > 0) { sy *= 0.84; sx *= 1.12; }  // pouso pesado
      this._drawFrame(ctx, fr, x + e.w / 2 + dx, y + e.h + dy, facing, white, sx, sy, rot);
    }
    if (st === 'charge' || st === 'swoop' || st === 'dash') {   // rastro de velocidade
      ctx.save(); ctx.globalAlpha = 0.25; ctx.globalCompositeOperation = 'lighter';
      const bx = e.def.flying ? y + e.h / 2 + dy : y + e.h + dy;
      this._drawFrame(ctx, fr, x + e.w / 2 - Math.sign(e.vx || facing) * 14, bx, facing, false, sx, sy, rot);
      ctx.restore();
    }
  }

  _white(fr) {
    let c = this.whiteCache.get(fr);
    if (!c) {
      c = makeCanvas(fr[2], fr[3]);
      const x = c.getContext('2d');
      x.drawImage(this._img(fr.s), fr[0], fr[1], fr[2], fr[3], 0, 0, fr[2], fr[3]);
      x.globalCompositeOperation = 'source-in'; x.fillStyle = '#ffffff'; x.fillRect(0, 0, fr[2], fr[3]);
      if (this.whiteCache.size > 160) this.whiteCache.delete(this.whiteCache.keys().next().value);
      this.whiteCache.set(fr, c);
    }
    return c;
  }

  _drawFrame(ctx, fr, x, y, facing, white, sx = 1, sy = 1, rot = 0) {
    const k = 1 / (fr[6] || ATLAS_SS);
    ctx.save();
    ctx.translate(x, y);
    if (rot) ctx.rotate(rot);
    ctx.scale(facing * sx * k, sy * k);
    if (white) ctx.drawImage(this._white(fr), 0, 0, fr[2], fr[3], -fr[4], -fr[5], fr[2], fr[3]);
    else ctx.drawImage(this._img(fr.s), fr[0], fr[1], fr[2], fr[3], -fr[4], -fr[5], fr[2], fr[3]);
    ctx.restore();
  }

  _build() {
    const s = this.spr;
    s.gato = sprite(22, 34, DRAW.gato, '#5ef0ff', 4);
    for (const [id, d] of Object.entries(ENEMY_TYPES)) if (DRAW[id]) s[id] = sprite(d.w, d.h, DRAW[id], d.glow, 5);
    s.battery = sprite(8, 13, DRAW.battery, '#5ef0ff', 6);
    s.scrap = sprite(10, 10, DRAW.scrap, '#ffc94d', 6);
    s.health = sprite(11, 12, DRAW.health, '#ff5c8a', 6);
    s.shuriken = sprite(12, 12, DRAW.shuriken, '#ff4df0', 6);
    s.orb = sprite(10, 10, DRAW.drone_orb, '#4dffa6', 7);
    s.acorn = sprite(8, 10, DRAW.acorn, '#ff9a3c', 5);
    const rng = new Rng(77);
    this.bgCache = new Map();
    this.bgBiome = 0; this.bgPrev = 0; this.bgFade = 1;
    this.stars = Array.from({ length: 60 }, () => ({ x: rng.next(), y: rng.next() * 0.6, s: rng.chance(0.2) ? 2 : 1 }));
  }

  resize() {
    for (const b of this.bgCache.values()) b.sky = null;
  }

  // Fundo de cada bioma: céu + 3 camadas de parallax (feito na primeira vez que o bioma aparece)
  _bg(bi) {
    let b = this.bgCache.get(bi);
    if (b) return b;
    const B = BIOMES[bi], rng = new Rng(77 + bi * 1000);
    b = {
      biome: B, sky: null,
      layers: [
        { img: buildSkyline(960, 360, rng, { kind: B.skyline, color: B.far, minW: 30, maxW: 80, minH: 120, maxH: 320, gap: 6, windows: 0, antenna: true }), fx: 0.9, fy: 0.85, baseY: -40 },
        { img: buildSkyline(960, 300, rng, { kind: B.skyline, color: B.mid, minW: 40, maxW: 90, minH: 90, maxH: 260, gap: 20, windows: 0.25, win: B.windows }), fx: 0.75, fy: 0.7, baseY: -30 },
        { img: buildSigns(960, 320, rng, B.words, B.signColors), fx: 0.55, fy: 0.5, baseY: -20, neon: true },
      ],
    };
    this.bgCache.set(bi, b);
    return b;
  }

  _drawBackground(ctx, bi, alpha, W, H, left, top, s, camX, pulse, refTop) {
    const b = this._bg(bi);
    if (!b.sky || b.skyH !== H) {
      b.sky = ctx.createLinearGradient(0, 0, 0, H);
      b.sky.addColorStop(0, b.biome.sky[0]); b.sky.addColorStop(0.55, b.biome.sky[1]); b.sky.addColorStop(1, b.biome.sky[2]);
      b.skyH = H;
    }
    ctx.globalAlpha = alpha;
    ctx.fillStyle = b.sky; ctx.fillRect(0, 0, W, H);
    if (b.biome.stars) {
      ctx.fillStyle = 'rgba(200,190,255,0.5)';
      for (const st of this.stars) ctx.fillRect(((st.x * W - camX * 0.02 * s) % W + W) % W, st.y * H, st.s, st.s);
    }
    for (const L of b.layers) {
      const lw = L.img.width * s, lh = L.img.height * s;
      const offX = ((left * (1 - L.fx) * s) % lw + lw) % lw;
      const effTop = refTop + (top - refTop) * (1 - L.fy);
      const y = (L.baseY - L.img.height - effTop) * s;
      ctx.globalAlpha = alpha * (L.neon ? 0.7 + 0.3 * pulse : 1);
      for (let x = -offX; x < W; x += lw) ctx.drawImage(L.img, x, y, lw, lh);
    }
    // Camada próxima: a faixa de cenário do bioma (palmeiras, prédios, guindastes)
    const near = this._near(b.biome.id);
    if (near) {
      const k = s / NEAR_SS, lw = near.width * k, lh = near.height * k;
      const fx = 0.35, fy = 0.35, baseY = -26;
      const step = lw * (1 - 0.14);                   // laterais esmaecidas (build_biomes: NEAR_FEATHER) se sobrepõem
      const offX = ((left * (1 - fx) * s) % step + step) % step;
      const effTop = refTop + (top - refTop) * (1 - fy);
      const y = (baseY - effTop) * s - lh;
      ctx.globalAlpha = alpha * 0.78;
      for (let x = -offX - step; x < W; x += step) ctx.drawImage(near, x, y, lw, lh);
      this._band = { y, h: lh, offX };                // faixa próxima: referência das animações de fundo
      ctx.globalAlpha = alpha;
      ctx.fillStyle = b.biome.far;
      if (y + lh < H) ctx.fillRect(0, y + lh - 1, W, H - y - lh + 1);
      // véu do céu por cima: empurra a camada para trás e mantém os inimigos legíveis
      ctx.globalAlpha = alpha * 0.34; ctx.fillStyle = b.biome.sky[1]; ctx.fillRect(0, y, W, lh);
    }
    ctx.globalAlpha = 1;
  }

  // Prepara os pedaços vizinhos em momentos livres (evita montar um pedaço inteiro no meio de um quadro)
  prewarm(world, ci) {
    if (this._warmBusy) return;
    const todo = [ci + 1, ci - 1, ci + 2, ci - 2].filter((c) => !this.chunkCache.has(this._chunkKey(world, c)));
    if (!todo.length) return;
    this._warmBusy = true;
    const idle = window.requestIdleCallback || ((f) => setTimeout(() => f({ timeRemaining: () => 8 }), 50));
    idle(() => { this._warmBusy = false; if (this.game.world === world) this._chunk(world, todo[0]); }, { timeout: 400 });
  }

  _chunkKey(world, ci) {
    const bid = BIOMES[biomeIndexAt(ci)].id;
    return `${world.seed}:${ci}:${this.atlas ? 1 : 0}${this.bioTex[bid] ? 1 : 0}${this._bioReady(bid) ? 1 : 0}`;
  }

  _chunk(world, ci) {
    const key = this._chunkKey(world, ci);
    let c = this.chunkCache.get(key);
    if (c) { this.chunkCache.delete(key); this.chunkCache.set(key, c); return c; }
    c = buildChunkCanvas(world.variantAt(ci), BIOMES[biomeIndexAt(ci)], ci, this);
    this.chunkCache.set(key, c);
    if (this.chunkCache.size > 12) this.chunkCache.delete(this.chunkCache.keys().next().value);
    return c;
  }

  // Tela inicial: a cidade passa, o Gato corre e alguns monstros o perseguem (só visual)
  _titleScene(dt) {
    const g = this.game, cam = g.camera, p = g.player;
    if (this._titleWorld !== g.world) {
      this._titleWorld = g.world;
      this._tt = 0;
      cam.snap(p);
    }
    this._tt += dt;
    const speed = 165;
    cam.prevX = cam.x; cam.x += speed * dt;
    cam.prevY = cam.y = -2 * TILE - p.h / 2 + 0.02 * cam.viewH;   // gato um pouco acima do meio, longe dos cartões
    cam._updateView();
    p.prevX = p.x; p.x = cam.x - 20 - p.w / 2; p.prevY = p.y; p.y = -2 * TILE - p.h;
    p.state = PS.Run; p.facing = 1; p.animT += dt; p.attackT += dt; p.sx = 1; p.sy = 1;
    if (this._tt % 2.4 < dt) { p.attackT = 0; p.attackCombo = (p.attackCombo || 0) ^ 1; }
  }

  _titleChasers(ctx) {
    const cam = this.game.camera, t = this._tt || 0;
    const groundY = -2 * TILE;
    const list = [
      ['rato.move', -95 + Math.sin(t * 2.1) * 10, groundY, true],
      ['rato.move', -135 + Math.sin(t * 1.7 + 1) * 8, groundY, true],
      ['hound.move', -190 + Math.sin(t * 1.3) * 14, groundY, true],
      ['drone.move', -80 + Math.sin(t * 1.1) * 30, groundY - 110 + Math.sin(t * 3) * 12, false],
      ['morcego.move', 60 + Math.sin(t * 0.9) * 40, groundY - 190 + Math.sin(t * 2.4) * 18, false],
    ];
    for (const [anim, dx, y] of list) {
      const fr = this._frame(anim, t + dx * 0.01);
      if (fr) this._drawFrame(ctx, fr, cam.x + dx, y, 1, false);
    }
  }

  // Miniatura animada de personagem (cartões da tela inicial)
  drawThumb(canvas, anim, t, locked) {
    const fr = this._frame(anim, t);
    const x = canvas.getContext('2d');
    x.clearRect(0, 0, canvas.width, canvas.height);
    if (!fr) return;
    const k = Math.min((canvas.height * 0.86) / fr[3], (canvas.width * 0.9) / fr[2]);
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    if (locked) x.filter = 'grayscale(1) brightness(0.45)';
    x.drawImage(this._img(fr.s), fr[0], fr[1], fr[2], fr[3], canvas.width / 2 - fr[4] * k, canvas.height - 4 - fr[5] * k, fr[2] * k, fr[3] * k);
    x.filter = 'none';
  }

  // Sprite centralizado num canvas da interface (ex.: emblema de Level Up)
  drawCentered(canvas, anim, t) {
    const fr = this._frame(anim, t);
    const x = canvas.getContext('2d');
    x.clearRect(0, 0, canvas.width, canvas.height);
    if (!fr) return;
    const k = Math.min((canvas.height * 0.92) / fr[3], (canvas.width * 0.92) / fr[2]) * (1 + 0.04 * Math.sin(t * 6));
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(this._img(fr.s), fr[0], fr[1], fr[2], fr[3], canvas.width / 2 - fr[2] * k / 2, canvas.height / 2 - fr[3] * k / 2 + Math.sin(t * 3) * 3, fr[2] * k, fr[3] * k);
  }

  draw(alpha, realDt) {
    const g = this.game, ctx = this.ctx, cam = g.camera, W = this.canvas.width, H = this.canvas.height;
    this._syncSheets(g);
    if (g.state === 'title') { this._titleScene(realDt); alpha = 1; }
    const s = cam.scale;
    const shake = g.fx.shakeAmt;
    const camX = lerp(cam.prevX, cam.x, alpha) + (shake ? (Math.random() - 0.5) * shake : 0);
    const camY = lerp(cam.prevY, cam.y, alpha) + (shake ? (Math.random() - 0.5) * shake : 0);
    const left = camX - VIEW_W / 2, top = camY - cam.viewH / 2;
    const pulse = g.audio.pulse();

    // Fundo do bioma onde a câmera está, com transição suave ao trocar
    const refTop = -82 - 0.57 * cam.viewH;          // topo da câmera com o jogador no chão inicial
    const bNow = biomeIndexAt(Math.floor(camX / CHUNK_PX));
    if (bNow !== this.bgBiome) { this.bgPrev = this.bgBiome; this.bgBiome = bNow; this.bgFade = 0; }
    this.bgFade = Math.min(1, this.bgFade + realDt / 1.2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (this.bgFade < 1) this._drawBackground(ctx, this.bgPrev, 1, W, H, left, top, s, camX, pulse, refTop);
    this._band = null;
    this._drawBackground(ctx, this.bgBiome, this.bgFade < 1 ? this.bgFade : 1, W, H, left, top, s, camX, pulse, refTop);
    // Cenário vivo: animações de fundo (qualidade acompanha a resolução dinâmica)
    const res = (window.__fps && window.__fps.res) || 2;
    const q = res >= 1.7 ? 1 : res >= 1.45 ? 0.7 : 0.5;
    const band = this._band || { y: (-26 - (refTop + (top - refTop) * 0.65)) * s - 200 * s, h: 200 * s, offX: left * s * 0.65 };
    if (this.bgFade >= 1 || this.bgFade > 0.5) this.ambient.bg(ctx, BIOMES[this.bgBiome].id, W, H, s, g.time, band, realDt, q);

    // Mundo
    ctx.setTransform(s, 0, 0, s, Math.round(-left * s), Math.round(-top * s));
    const c0 = Math.floor(left / CHUNK_PX), c1 = Math.floor((left + VIEW_W) / CHUNK_PX);
    const vis = this._vis || (this._vis = []);
    vis.length = 0;
    for (let ci = c0; ci <= c1; ci++) { const ch = this._chunk(g.world, ci); ctx.drawImage(ch, ci * CHUNK_PX, -CHUNK_H * TILE); vis.push({ c: ch, ci }); }
    this.ambient.world(ctx, vis, g.time, { left, right: left + VIEW_W, id: BIOMES[this.bgBiome].id });
    this.prewarm(g.world, Math.floor((c0 + c1) / 2));
    const below = top + cam.viewH + 2;
    if (below > 0) {
      const TB = this.bioTex[BIOMES[this.bgBiome].id];
      if (TB) {
        if (!TB.fillP) TB.fillP = ctx.createPattern(TB.fill, 'repeat');
        ctx.fillStyle = TB.fillP; ctx.fillRect(left - 2, 0, VIEW_W + 4, below);
        ctx.fillStyle = 'rgba(4,2,12,0.6)'; ctx.fillRect(left - 2, 0, VIEW_W + 4, below);
      } else {
        ctx.fillStyle = BIOMES[this.bgBiome].solid[0]; ctx.fillRect(left - 2, 0, VIEW_W + 4, below);
      }
      ctx.fillStyle = 'rgba(122,60,255,0.10)';
      for (let yy = 22; yy < below; yy += 32) ctx.fillRect(left - 2, yy, VIEW_W + 4, 1);
    }

    ctx.imageSmoothingEnabled = true;            // sprites do atlas: redução suave (o cenário fica nítido)
    ctx.imageSmoothingQuality = 'high';
    this._fire(ctx);
    this._skillFx(ctx, g.time);
    if (g.portal) this._portal(ctx, g.portal, g.time);
    this._pickups(ctx, alpha, pulse);
    this._enemies(ctx, alpha);
    if (g.state === 'title') this._titleChasers(ctx);
    this._shots(ctx);
    this._player(ctx, alpha);
    this._skillsFx(ctx);
    this._effects(ctx);
    this._particles(ctx);
    if (g.water) g.water.drawWorld(ctx, g.time, left, left + VIEW_W);
    g.juice.drawWorld(ctx);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (g.water) g.water.drawScreen(ctx, W, H, s, g.time, left, top, q);
    if (g.state !== 'title') g.juice.drawScreen(ctx, this.canvas, W, H, s, left, top, q);
    if (g.state !== 'title') this._indicators(ctx, left, top, s, W, H);
    if (g.portal && g.state !== 'title') this._portalArrow(ctx, g.portal, left, top, s, W, H, g.time);
    if (g.warp) this._warpOverlay(ctx, g.warp, W, H);
    if (g.hurtFlash > 0) { ctx.fillStyle = `rgba(255,30,70,${Math.min(0.25, g.hurtFlash)})`; ctx.fillRect(0, 0, W, H); }
    if (this.debug) this._debug(ctx, realDt);
  }

  // Portal para o próximo setor: anel neon girando, miolo escuro com espiral e brilho no chão
  _portal(ctx, P, t) {
    const open = Math.min(1, P.t / 0.8);
    const cx = P.x, cy = P.y - 32, rx = 20 * open, ry = 31 * open;
    if (rx < 1) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const glow = ctx.createRadialGradient(cx, cy, 2, cx, cy, ry * 1.8);
    glow.addColorStop(0, P.color); glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = 0.35 + 0.1 * Math.sin(t * 6); ctx.fillStyle = glow;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx * 1.8, ry * 1.6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#05030f';
    ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.86, ry * 0.88, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.9;
    ctx.strokeStyle = P.color; ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) {                         // espiral
      const a0 = t * 3 + i * 2.09;
      ctx.beginPath();
      for (let k = 0; k <= 14; k++) {
        const f = k / 14, a = a0 + f * 3.2;
        const px = cx + Math.cos(a) * rx * 0.8 * (1 - f), py = cy + Math.sin(a) * ry * 0.8 * (1 - f);
        k ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    ctx.lineWidth = 3; ctx.setLineDash([7, 5]); ctx.lineDashOffset = -t * 30;
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]); ctx.lineWidth = 1.5; ctx.strokeStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(cx, cy, rx * 0.92, ry * 0.94, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = 0.5; ctx.fillStyle = P.color;
    ctx.beginPath(); ctx.ellipse(cx, P.y, rx * 1.5, 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Seta na borda da tela apontando para o portal quando ele está fora de vista
  _portalArrow(ctx, P, left, top, s, W, H, t) {
    const sx = (P.x - left) * s, sy = (P.y - 32 - top) * s;
    const m = 34;
    if (sx > m && sx < W - m && sy > m && sy < H - m) return;
    const x = Math.max(m, Math.min(W - m, sx)), y = Math.max(m + 60, Math.min(H * 0.6, sy));
    const a = Math.atan2(sy - y, sx - x);
    const b = 1 + 0.12 * Math.sin(t * 8);
    ctx.save(); ctx.translate(x, y); ctx.scale(b, b);
    ctx.fillStyle = 'rgba(5,3,15,0.75)'; ctx.strokeStyle = P.color; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.rotate(a); ctx.fillStyle = P.color;
    ctx.beginPath(); ctx.moveTo(14, 0); ctx.lineTo(4, -7); ctx.lineTo(4, 7); ctx.closePath(); ctx.fill();
    ctx.rotate(-a); ctx.font = 'bold 9px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff';
    ctx.fillText('PORTAL', 0, 30);
    ctx.restore();
  }

  // Transição de setor: clarão na cor do próximo cenário + linhas de glitch
  _warpOverlay(ctx, w, W, H) {
    const k = w.t < 0.45 ? w.t / 0.45 : Math.max(0, 1 - (w.t - 0.45) / 0.65);
    ctx.save();
    ctx.globalAlpha = k; ctx.fillStyle = '#05030f'; ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    ctx.globalAlpha = k * 0.6; ctx.fillStyle = w.color;
    for (let i = 0; i < 14; i++) { const y = Math.random() * H; ctx.fillRect(0, y, W, 2 + Math.random() * 10); }
    ctx.globalAlpha = k * 0.35;
    const r = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6);
    r.addColorStop(0, w.color); r.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // Campo Tesla (anel elétrico em volta do jogador) e Bumerangues de Plasma
  _skillFx(ctx, t) {
    const sk = this.game.skills, p = this.game.player;
    if (sk.actives.has('tesla') && sk.teslaR) {
      const r = sk.teslaR, k = sk.teslaPulse / 0.18;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = sk.evolved.has('tesla') ? '#ff6ad5' : '#8c9bff';
      ctx.globalAlpha = 0.22 + 0.5 * k; ctx.lineWidth = 1.5 + 2 * k;
      ctx.setLineDash([6, 8]); ctx.lineDashOffset = -t * 40;
      ctx.beginPath(); ctx.ellipse(p.cx, p.cy - 4, r, r * 0.85, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 0.05 + 0.1 * k; ctx.fillStyle = ctx.strokeStyle;
      ctx.beginPath(); ctx.ellipse(p.cx, p.cy - 4, r, r * 0.85, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
    let any = false;
    for (const b of sk.booms) if (b.active) { any = true; break; }
    if (!any) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const b of sk.booms) {
      if (!b.active) continue;
      Juice.push(b, b.x, b.y, this.game.time, 8);
      this.game.juice.ribbon(ctx, b, this.game.time, '#ffb03c', 6, 0.16);
      ctx.globalCompositeOperation = 'lighter';
      ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot);
      ctx.strokeStyle = '#ffb03c'; ctx.globalAlpha = 0.35; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(0, 0, 9, 0.3, Math.PI * 1.25); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = 3.5; ctx.strokeStyle = '#ffe2a8'; ctx.beginPath(); ctx.arc(0, 0, 9, 0.3, Math.PI * 1.25); ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  _fire(ctx) {
    const fire = this.game.skills.fire;
    ctx.globalCompositeOperation = 'lighter';
    for (const f of fire) {
      if (!f.active) continue;
      const k = f.life / f.max;
      const flick = 0.85 + Math.random() * 0.3;
      ctx.globalAlpha = 0.5 * k;
      ctx.fillStyle = '#ff5a1a';
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r * flick, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 0.7 * k;
      ctx.fillStyle = '#ffd04d';
      ctx.beginPath(); ctx.arc(f.x, f.y - 3, f.r * 0.45 * flick, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  _pickups(ctx, alpha, pulse) {
    const S = this.spr;
    for (const o of this.game.pickups.pool) {
      if (!o.active) continue;
      if (this.atlas) {
        const bob = o.state === 'rest' ? Math.sin(o.t * 3) * 2 - 3 : 0;
        let fr, k = 1;
        if (o.kind === PK.BATTERY) {
          const tier = o.value < 35 ? 0 : o.value < 90 ? 1 : o.value < 200 ? 2 : 3;   // bateria mais "cheia" = mais XP
          fr = this._frameAt('it.battery', tier); k = 1 + 0.12 * pulse;
        } else if (o.kind === PK.SCRAP) fr = this._frame('it.coin', o.t);
        else { fr = this._frame('it.hp', o.t); k = (o.value >= 0.2 ? 1.25 : 1) * (1 + 0.1 * pulse); }
        if (fr) { this._drawFrame(ctx, fr, o.x, o.y + bob, 1, false, k, k); continue; }
      }
      const spr = o.kind === PK.BATTERY ? S.battery : o.kind === PK.SCRAP ? S.scrap : S.health;
      const bob = o.state === 'rest' ? Math.sin(o.t * 3) * 2 - 2 : 0;
      const k = o.kind === PK.BATTERY ? 1 + 0.15 * pulse + Math.min(0.6, (o.value - 20) / 200)
        : o.kind === PK.HEALTH ? (o.value >= 0.2 ? 1.5 : 1.15) * (1 + 0.12 * pulse) : 1;
      const w = spr.img.width * k, h = spr.img.height * k;
      ctx.drawImage(spr.img, o.x - w / 2, o.y - h / 2 + bob, w, h);
    }
  }

  _enemies(ctx, alpha) {
    const S = this.spr, t = this.game.time;
    for (const e of this.game.enemies.pool) {
      if (!e.active) continue;
      const spr = S[e.type];
      const x = lerp(e.prevX, e.x, alpha), y = lerp(e.prevY, e.y, alpha);
      const tele = e.state === 'tele';
      const white = e.flash > 0 && (!tele || Math.floor(t * 20) % 2 === 0);
      const striking = e.state === 'charge' || e.state === 'dash' || e.state === 'shoot';
      let anim = e.type + '.move';
      if (striking && ATLAS[e.type + '.atk']) anim = e.type + '.atk';
      else if ((tele || striking) && ATLAS[e.type + '.tele']) anim = e.type + '.tele';
      if (e.anim) anim = e.anim;
      if (e.hurtT > 0 && !e.def.boss && ATLAS[e.type + '.hurt'] && e.state !== 'zap' && e.state !== 'lunge') anim = e.type + '.hurt';
      if (e.beam) this._beam(ctx, e.beam, t);
      if (RUSH.has(e.state)) Juice.push(e, x + e.w / 2, y + e.h / 2, t, 10);
      if (e._tr) this.game.juice.ribbon(ctx, e, t, e.def.glow, Math.min(26, e.h * 0.55), 0.25);
      if (e.state === 'hang' && e.threadY) {      // fio da Aranha-Drone
        ctx.strokeStyle = 'rgba(255,77,240,0.55)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x + e.w / 2, e.threadY); ctx.lineTo(x + e.w / 2, y - 14); ctx.stroke();
      }
      const fr = this._frame(anim, e.t);
      if (fr) {
        const facing = e.state === 'charge' ? e.lockX : e.facing;
        if (e.cloak) ctx.globalAlpha = 0.13 + 0.07 * Math.sin(t * 9 + e._q);     // camaleão camuflado
        if (e.tongue > 0) {                        // linguada do camaleão
          const mx = x + e.w / 2 + facing * e.w * 0.45, my = y + e.h * 0.4, len = 80 * Math.min(1, (0.2 - e.tongue) / 0.06 + 0.2);
          ctx.strokeStyle = '#ff6ad5'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx + facing * len, my); ctx.stroke();
          ctx.fillStyle = '#ff4df0'; ctx.beginPath(); ctx.arc(mx + facing * len, my, 4, 0, Math.PI * 2); ctx.fill();
        }
        if (e.def.boss) { this._drawBoss(ctx, e, fr, x, y, facing, white, t); continue; }
        if (e.def.flying) this._drawFrame(ctx, fr, x + e.w / 2, y + e.h / 2, facing, white);
        else this._drawFrame(ctx, fr, x + e.w / 2, y + e.h, facing, white, tele ? 1.06 : 1, tele ? 0.94 : 1);
        ctx.globalAlpha = 1;
        if (e.def.tier !== 'weak' && !e.def.prop && !e.def.boss && e.hp < e.maxHp) {
          ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y - 9, e.w, 3);
          ctx.fillStyle = e.def.glow; ctx.fillRect(x, y - 9, e.w * Math.max(0, e.hp / e.maxHp), 3);
        }
        continue;
      }
      if (!spr) continue;
      ctx.save();
      ctx.translate(x + e.w / 2, y + e.h / 2);
      if (e.facing < 0) ctx.scale(-1, 1);
      if (tele) ctx.scale(1.12, 0.9);
      ctx.drawImage(white ? spr.white : spr.img, -e.w / 2 - PAD, -e.h / 2 - PAD);
      ctx.restore();
      if (e.def.tier !== 'weak' && e.hp < e.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x, y - 7, e.w, 3);
        ctx.fillStyle = e.def.glow; ctx.fillRect(x, y - 7, e.w * Math.max(0, e.hp / e.maxHp), 3);
      }
    }
  }

  // Laser do Dragão: aviso fino piscando, depois feixe grosso com núcleo branco
  // Raios: cor por dono (col: 'pink' padrão, 'cyan' serpente), largura (w) e raio em zigue-zague (zig, Cyber-Lula)
  _beam(ctx, b, t) {
    const C = BEAM_COLORS[b.col] || BEAM_COLORS.pink;
    const ex = b.x + Math.cos(b.a) * b.len, ey = b.y + Math.sin(b.a) * b.len;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (b.warn) {
      ctx.globalAlpha = Math.floor(t * 16) % 2 ? 0.7 : 0.25;
      ctx.strokeStyle = C[1]; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(b.a) * (b.len || 360), b.y + Math.sin(b.a) * (b.len || 360)); ctx.stroke();
    } else {
      const w = (12 + Math.sin(t * 40) * 2) * (b.w || 1);
      const path = () => {
        ctx.beginPath(); ctx.moveTo(b.x, b.y);
        if (b.zig) {                                  // raio: pontos tremendo a cada quadro
          const n = 9, nx = -Math.sin(b.a), ny = Math.cos(b.a), seed = Math.floor(t * 30);
          for (let i = 1; i < n; i++) {
            const k = i / n, j = (Math.sin(seed * 12.9 + i * 78.2) * 43758.5 % 1) * 9;
            ctx.lineTo(b.x + (ex - b.x) * k + nx * j, b.y + (ey - b.y) * k + ny * j);
          }
        }
        ctx.lineTo(ex, ey);
      };
      ctx.globalAlpha = 0.35; ctx.strokeStyle = C[0]; ctx.lineWidth = w * 2.2; path(); ctx.stroke();
      ctx.globalAlpha = 0.9; ctx.strokeStyle = C[1]; ctx.lineWidth = w; path(); ctx.stroke();
      ctx.globalAlpha = 1; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = w * 0.35; path(); ctx.stroke();
      ctx.fillStyle = C[2]; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.arc(b.x, b.y, w * 0.9, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  _bossShot(ctx, sh) {
    ctx.globalCompositeOperation = 'lighter';
    if (sh.kind === 'orb') {
      const r = sh.r + Math.sin(sh.t * 30) * 1.2;
      ctx.globalAlpha = 0.35; ctx.fillStyle = sh.color; ctx.beginPath(); ctx.arc(sh.x, sh.y, r * 1.9, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(sh.x, sh.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(sh.x, sh.y, r * 0.45, 0, Math.PI * 2); ctx.fill();
    } else if (sh.kind === 'cube') {
      ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate(sh.t * 4);
      const r = sh.r;
      ctx.globalAlpha = 0.3; ctx.fillStyle = sh.color; ctx.fillRect(-r * 1.6, -r * 1.6, r * 3.2, r * 3.2);
      ctx.globalAlpha = 1; ctx.strokeStyle = sh.color; ctx.lineWidth = 2; ctx.strokeRect(-r, -r, r * 2, r * 2);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-r * 0.5, -r * 0.5, 3, 3); ctx.fillRect(r * 0.2, r * 0.2, 3, 3);
      ctx.restore();
      if (Math.random() < 0.3) { ctx.globalAlpha = 0.6; ctx.fillStyle = sh.color; ctx.fillRect(sh.x - sh.vx * 0.06 + (Math.random() - 0.5) * 8, sh.y - sh.vy * 0.06, 4, 2); }
    } else if (sh.kind === 'wave') {
      const dir = Math.sign(sh.vx) || 1, k = Math.min(1, sh.life * 2);
      ctx.globalAlpha = 0.45 * k; ctx.fillStyle = sh.color;
      ctx.beginPath(); ctx.ellipse(sh.x - dir * 6, sh.y + 4, 18, 14, 0, Math.PI, 0); ctx.fill();
      ctx.globalAlpha = 0.95 * k; ctx.strokeStyle = sh.color; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(sh.x, sh.y + 6, 12, 15, 0, Math.PI, 0); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.ellipse(sh.x, sh.y + 6, 8, 11, 0, Math.PI, 0); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  _shots(ctx) {
    const S = this.spr;
    const acorn = this._frame('esquilo.acorn', 0);
    for (const sh of this.game.enemies.shots) {
      if (!sh.active) continue;
      if (sh.kind === 'orb' || sh.kind === 'cube' || sh.kind === 'wave') { this._bossShot(ctx, sh); continue; }
      if (sh.kind === 'acorn' || !sh.kind) {
        if (acorn) this._drawFrame(ctx, acorn, sh.x, sh.y, 1, false, 0.6, 0.6, sh.life * 8);
        else ctx.drawImage(S.acorn.img, sh.x - 10, sh.y - 11);
        continue;
      }
      const fr = this._frame(sh.kind === 'laser' ? 'fx.laser' : 'fx.fireball', 0);
      if (!fr) continue;
      ctx.globalCompositeOperation = 'lighter';
      this._drawFrame(ctx, fr, sh.x, sh.y, 1, false, 1, 1, Math.atan2(sh.vy, sh.vx));
      ctx.globalCompositeOperation = 'source-over';
    }
    const star = this._frame('fx.shuriken', 0), star2 = this._frame('fx.star', 0);
    for (const sh of this.game.skills.shots) {
      if (!sh.active) continue;
      if (star) {
        ctx.globalCompositeOperation = 'lighter';
        this._drawFrame(ctx, sh.evo ? star2 : star, sh.x, sh.y, 1, false, sh.evo ? 1.3 : 1, sh.evo ? 1.3 : 1, sh.rot);
        ctx.globalCompositeOperation = 'source-over';
        continue;
      }
      ctx.save(); ctx.translate(sh.x, sh.y); ctx.rotate(sh.rot);
      const k = sh.evo ? 1.4 : 1;
      ctx.drawImage(S.shuriken.img, -12 * k, -12 * k, 24 * k, 24 * k);
      ctx.restore();
    }
  }

  _player(ctx, alpha) {
    const g = this.game, p = g.player, spr = this.spr.gato;
    const x = lerp(p.prevX, p.x, alpha), y = lerp(p.prevY, p.y, alpha);
    // rastro em fita no dash / torpedo / queda do Pug
    if (p.isDashing || p.state === PS.Slam) Juice.push(p, x + p.w / 2, y + p.h * 0.55, g.time, 9);
    if (p._tr) g.juice.ribbon(ctx, p, g.time, g.char.melee.color, p.inWater ? 10 : 12, 0.2);
    let rot = 0, bob = 0;
    if (p.state === PS.Run) bob = -Math.abs(Math.sin(p.animT * 15)) * 2;
    if (p.state === PS.WallSlide) rot = -p.wallDir * 0.12;
    if (p.state === PS.Death) rot = p.facing * Math.PI / 2 * Math.min(1, g.deathAnim * 5);
    const blink = g.iframes > 0 && Math.floor(g.time * 12.5) % 2 === 0;   // GDD 10.2: pisca o alpha
    const [anim, at] = this._playerAnim(p, g);
    const fr = this._frame(anim, at);
    if (fr) {
      ctx.globalAlpha = blink ? 0.3 : 1;
      const lean = p.state === PS.Death ? 0 : rot;
      this._drawFrame(ctx, fr, x + p.w / 2, y + p.h, p.facing, false, p.sx, p.sy, lean);
      if (g.hurtFlash > 0) { ctx.globalAlpha = 0.8; this._drawFrame(ctx, fr, x + p.w / 2, y + p.h, p.facing, true, p.sx, p.sy, lean); }
      ctx.globalAlpha = 1;
      this._lastPlayerFrame = fr;
      return;
    }
    ctx.save();
    ctx.translate(x + p.w / 2, y + p.h);
    ctx.rotate(rot);
    ctx.scale(p.facing * p.sx, p.sy);
    ctx.globalAlpha = blink ? 0.3 : 1;
    ctx.drawImage(spr.img, -spr.w / 2 - PAD, -spr.h - PAD + bob);
    if (g.hurtFlash > 0) { ctx.globalAlpha = 0.8; ctx.drawImage(spr.white, -spr.w / 2 - PAD, -spr.h - PAD + bob); }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  _playerAnim(p, g) {
    const P = g.char.prefix;
    if (p.state === PS.Death) return [P + '.death', g.deathAnim];
    if (p.state === PS.Hit) return [P + '.hit', p.animT];
    if (p.state === PS.Slam) return [P + '.slam', p.animT];
    if (p.slamT < 0.22 && ATLAS[P + '.land']) return [P + '.land', 0];
    if (p.state === PS.Dash) return [P + '.dash', p.animT];
    if (p.state === PS.WallSlide) return [P + '.wall', 0];
    if (p.attackT < 0.16) return [P + (p.attackCombo ? '.attack2' : '.attack'), p.attackT];
    if (p.state === PS.Glide) return [P + '.glide', p.animT];
    if (p.state === PS.Jump) return [P + (p.airJumpT < 0.35 ? '.airjump' : '.jump'), p.animT];
    if (p.state === PS.Fall) return [P + '.fall', p.animT];
    if (p.state === PS.Run) return [P + '.run', p.animT];
    return [P + '.idle', p.animT];
  }

  _skillsFx(ctx) {
    const sk = this.game.skills, orb = this.spr.orb;
    const t = this.game.time;
    for (let i = 0; i < sk.droneCount; i++) {
      const d = sk.dronePos[i];
      const fr = this._frame('ally.drone', t + i * 0.13);
      if (fr) {                                    // drone aliado (folha de inimigos, olho recolorido) + brilho
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.45;
        ctx.drawImage(orb.img, d.x - orb.img.width / 2, d.y - orb.img.height / 2);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
        this._drawFrame(ctx, fr, d.x, d.y + Math.sin(t * 9 + i) * 1.5, Math.cos(sk.droneAngle + (i * Math.PI * 2) / sk.droneCount) < 0 ? -1 : 1, false);
      } else ctx.drawImage(orb.img, d.x - orb.img.width / 2, d.y - orb.img.height / 2);
    }
  }

  _effects(ctx) {
    const S = this.spr;
    ctx.globalCompositeOperation = 'lighter';
    for (const e of this.game.fx.effects) {
      if (e.life <= 0) continue;
      const k = e.life / e.max;
      ctx.globalAlpha = k;
      if (e.type === 'seq') {                    // animação de morte da folha (um quadro por fatia da vida)
        const a = ATLAS[e.anim];
        if (a && this._img(a.s)) {
          const fr = a.frames[Math.min(a.frames.length - 1, Math.floor((1 - k) * a.frames.length))];
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = Math.min(1, k * 4);
          this._drawFrame(ctx, fr, e.x, e.y + e.vy * (1 - k) * e.max, e.flip, false, e.sc, e.sc);
          ctx.globalCompositeOperation = 'lighter';
        }
        continue;
      }
      if (e.type === 'spr') {
        const fr = this._frameAt(e.anim, e.fi);
        if (fr) {
          ctx.globalCompositeOperation = e.add ? 'lighter' : 'source-over';
          ctx.globalAlpha = e.fade ? Math.min(1, k * 1.6) : 1;
          const sc = e.sc * (1 + e.grow * (1 - k));
          this._drawFrame(ctx, fr, e.x, e.y, e.flip, false, sc, sc, e.rot);
          ctx.globalCompositeOperation = 'lighter';
        }
        continue;
      }
      if (e.type === 'slash' && this.atlas) {
        const fr = this._frame(e.anim || (e.evo ? 'fx.slashC' : e.combo ? 'fx.slashB' : 'fx.slashA'), 0);
        if (fr) {
          const sc = e.range / 88;
          ctx.globalAlpha = Math.min(1, k * 1.5);
          this._drawFrame(ctx, fr, e.x + e.dir * e.range * 0.5, e.y - 4, e.dir, false, sc, sc * (0.9 + 0.2 * (1 - k)));
          continue;
        }
      }
      if (e.type === 'slash') {
        ctx.strokeStyle = e.color; ctx.lineWidth = 4;
        const cx = e.x + e.dir * e.range * 0.3;
        const a0 = e.dir > 0 ? -1.1 : Math.PI - 1.1, a1 = e.dir > 0 ? 1.1 : Math.PI + 1.1;
        ctx.beginPath(); ctx.arc(cx, e.y - 6, e.range * 0.75, a0, a1); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(cx, e.y - 6, e.range * 0.58, a0 + 0.3, a1 - 0.3); ctx.stroke();
      } else if (e.type === 'bolt') {
        ctx.strokeStyle = e.color; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(e.x, e.y);
        for (let i = 1; i < 5; i++) {
          const t = i / 5;
          ctx.lineTo(lerp(e.x, e.x2, t) + (Math.random() - 0.5) * 12, lerp(e.y, e.y2, t) + (Math.random() - 0.5) * 12);
        }
        ctx.lineTo(e.x2, e.y2); ctx.stroke();
      } else if (e.type === 'crit') {
        const age = 1 - k, pop = age < 0.15 ? 0.6 + age / 0.15 * 0.6 : 1.2 - Math.min(0.2, (age - 0.15));
        const y = e.y - age * 26;
        ctx.globalAlpha = Math.min(1, k * 2.2);
        ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.translate(e.x, y); ctx.scale(pop, pop);
        ctx.font = 'bold 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 3; ctx.strokeStyle = '#3a1600'; ctx.strokeText('CRÍTICO!', 0, 0);
        ctx.fillStyle = '#ffd84d'; ctx.fillText('CRÍTICO!', 0, 0);
        ctx.restore();
      } else if (e.type === 'ring') {
        ctx.strokeStyle = e.color; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.stroke();
      } else if (e.type === 'ghost') {
        ctx.globalAlpha = 0.35 * k;
        const gf = this._frame(e.anim || 'gato.dash', 0);
        if (gf) { this._drawFrame(ctx, gf, e.x + e.w / 2, e.y + e.h, e.facing, true); continue; }
        ctx.save(); ctx.translate(e.x + e.w / 2, e.y + e.h); ctx.scale(e.facing, 1);
        ctx.drawImage(S.gato.white, -S.gato.w / 2 - PAD, -S.gato.h - PAD);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  _particles(ctx) {
    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.game.fx.parts) {
      if (p.life <= 0) continue;
      ctx.globalAlpha = Math.min(1, p.life / p.max * 1.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  // Setas na borda da tela para inimigos chegando de fora (essencial em retrato)
  _indicators(ctx, left, top, s, W, H) {
    const RANGE = 320;
    const yMin = 130 * (W / 400), yMax = H * 0.66;
    const used = this._indUsed || (this._indUsed = new Uint8Array(512));
    used.fill(0);
    for (const e of this.game.enemies.pool) {
      if (!e.active || e.def.prop) continue;
      const sx = (e.cx - left) * s, sy = (e.cy - top) * s;
      let ex, ey, dir;
      if (sx < 0 && sx > -RANGE * s) { ex = 14 * s; ey = sy; dir = -1; }
      else if (sx > W && sx < W + RANGE * s) { ex = W - 14 * s; ey = sy; dir = 1; }
      else continue;
      const dist = dir < 0 ? -sx / s : (sx - W) / s;
      ey = Math.max(yMin, Math.min(yMax, ey));
      const size = (e.def.tier === 'tank' ? 12 : e.def.tier === 'medium' ? 9 : 7) * s;
      const bucket = (dir < 0 ? 0 : 256) + Math.min(255, Math.floor(ey / (16 * s)));
      if (used[bucket]) continue;                     // uma seta por faixa de altura (sem amontoar)
      used[bucket] = 1;
      ctx.globalAlpha = 0.35 + 0.65 * (1 - dist / RANGE);
      ctx.fillStyle = e.def.glow;
      ctx.beginPath();
      ctx.moveTo(ex + dir * size, ey);
      ctx.lineTo(ex - dir * size, ey - size);
      ctx.lineTo(ex - dir * size, ey + size);
      ctx.closePath(); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _debug(ctx, realDt) {
    this._fpsAcc += realDt; this._fpsN++;
    if (this._fpsAcc >= 0.5) { this.fps = Math.round(this._fpsN / this._fpsAcc); this._fpsAcc = 0; this._fpsN = 0; }
    const g = this.game;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, this.canvas.height - 40, this.canvas.width, 40);
    ctx.fillStyle = '#9fffcf'; ctx.font = `${Math.round(this.canvas.width / 30)}px monospace`;
    ctx.fillText(`FPS ${this.fps} | inimigos ${g.enemies.count} | itens ${g.pickups.count} | ${g.player.state} | chunk ${Math.floor(g.player.cx / CHUNK_PX)}`, 8, this.canvas.height - 14);
  }
}
