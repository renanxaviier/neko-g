// Mundo infinito em chunks (esquerda e direita) + colisão por tiles.
// Coordenadas: y cresce para baixo. O chunk ocupa y de -CHUNK_H*TILE até 0; abaixo de y = 0 é tudo sólido.

import { TILE, CHUNK_W, CHUNK_H } from './config.js';
import { TEMPLATES } from './chunks.js';
import { Rng, hash, weightedIndex } from './rng.js';

export const EMPTY = 0, SOLID = 1, ONEWAY = 2;

const GEN = {
  maxHeightStep: 2,       // diferença máxima de altura entre bordas vizinhas (tiles)
  avoidRepeatLast: 2,
  breatherInterval: 6,
  maxDifficulty: (distance) => distance / 4,
};

// ---------- Pré-processamento dos templates (uma vez) ----------

function buildGrid(rows, mirror) {
  const grid = new Uint8Array(CHUNK_W * CHUNK_H);
  const pad = CHUNK_H - rows.length;
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    for (let c = 0; c < CHUNK_W; c++) {
      const ch = row[mirror ? CHUNK_W - 1 - c : c];
      grid[(r + pad) * CHUNK_W + c] = ch === '#' ? SOLID : ch === '=' ? ONEWAY : EMPTY;
    }
  }
  return grid;
}

function edgeHeight(grid, col) {
  let h = 0;
  for (let r = CHUNK_H - 1; r >= 0 && grid[r * CHUNK_W + col] === SOLID; r--) h++;
  return h;
}

export function validateTemplates() {
  const errors = [];
  for (const t of TEMPLATES) {
    if (t.rows.length > CHUNK_H) errors.push(`${t.id}: mais de ${CHUNK_H} linhas`);
    t.rows.forEach((row, i) => {
      if (row.length !== CHUNK_W) errors.push(`${t.id}: linha ${i} tem ${row.length} colunas`);
      if (/[^.#=]/.test(row)) errors.push(`${t.id}: caractere inválido na linha ${i}`);
    });
  }
  return errors;
}

export const VARIANTS = [];
TEMPLATES.forEach((t, ti) => {
  for (let m = 0; m < 2; m++) {
    const grid = buildGrid(t.rows, m === 1);
    VARIANTS.push({
      id: VARIANTS.length, template: ti, mirror: m === 1, name: t.id,
      grid, leftH: edgeHeight(grid, 0), rightH: edgeHeight(grid, CHUNK_W - 1),
      weight: t.weight * 0.5, difficulty: t.difficulty, minDistance: t.minDistance, breather: t.breather,
    });
  }
});

// ---------- Mundo ----------

export class World {
  constructor(seed, flat = false) {
    this.seed = seed >>> 0;
    this.flat = flat;               // cena da tela inicial: só chão plano
    this.chunks = new Map();      // índice do chunk → índice da variante (o layout fica guardado: voltar mostra o mesmo)
    this.chunks.set(0, 0);        // chunk inicial
    this.minIdx = 0;
    this.maxIdx = 0;
    this._candidates = [];
  }

  variantAt(ci) {
    if (ci > this.maxIdx) while (this.maxIdx < ci) this._generate(++this.maxIdx, true);
    else if (ci < this.minIdx) while (this.minIdx > ci) this._generate(--this.minIdx, false);
    return VARIANTS[this.chunks.get(ci)];
  }

  tileAt(tx, ty) {
    if (ty >= 0) return SOLID;
    if (ty < -CHUNK_H) return EMPTY;
    const ci = Math.floor(tx / CHUNK_W);
    const v = this.variantAt(ci);
    return v.grid[(ty + CHUNK_H) * CHUNK_W + (tx - ci * CHUNK_W)];
  }

  isSolidAt(px, py) { return this.tileAt(Math.floor(px / TILE), Math.floor(py / TILE)) === SOLID; }

  // Superfícies onde algo de altura h pode ficar em pé, na coluna de tiles tx. Retorna o y (topo) mais próximo de nearY.
  surfaceNear(tx, nearY, hTiles = 1) {
    let best = null, bestD = Infinity;
    for (let ty = -CHUNK_H; ty <= 0; ty++) {
      const t = this.tileAt(tx, ty);
      if (t === EMPTY) continue;
      let free = true;
      for (let k = 1; k <= hTiles; k++) if (this.tileAt(tx, ty - k) === SOLID) { free = false; break; }
      if (!free || this.tileAt(tx, ty - 1) !== EMPTY) continue;
      const y = ty * TILE;
      const d = Math.abs(y - nearY);
      if (d < bestD) { bestD = d; best = y; }
    }
    return best;
  }

  // Sorteio ponderado com passadas que relaxam as regras (nunca trava por falta de chunk compatível).
  _generate(ci, toRight) {
    const neighbor = VARIANTS[this.chunks.get(toRight ? ci - 1 : ci + 1)];
    const edge = toRight ? neighbor.rightH : neighbor.leftH;
    const distance = Math.abs(ci);
    const maxDiff = GEN.maxDifficulty(distance);
    const wantBreather = distance % GEN.breatherInterval === 0;
    const rng = new Rng(hash(this.seed ^ 0xa5a5a5a5, ci));
    const cands = this._candidates;

    for (let pass = 0; pass < 4; pass++) {
      cands.length = 0;
      for (let i = 2; i < VARIANTS.length; i++) {           // 0 e 1 = chunk inicial
        const v = VARIANTS[i];
        if (v.weight <= 0) continue;
        if (this.flat && v.name !== 'plataformas') continue;
        const myEdge = toRight ? v.leftH : v.rightH;
        if (pass <= 2 && Math.abs(myEdge - edge) > GEN.maxHeightStep) continue;
        if (pass <= 1 && (v.difficulty > maxDiff || distance < v.minDistance)) continue;
        if (pass === 0 && (this._isRecent(v.template, ci, toRight) || (wantBreather && !v.breather))) continue;
        cands.push(v);
      }
      if (cands.length === 0) continue;
      const k = weightedIndex(rng, cands, (v) => v.weight);
      this.chunks.set(ci, cands[k].id);
      return;
    }
    this.chunks.set(ci, 0);
  }

  _isRecent(template, ci, toRight) {
    for (let i = 1; i <= GEN.avoidRepeatLast; i++) {
      const id = this.chunks.get(toRight ? ci - i : ci + i);
      if (id !== undefined && VARIANTS[id].template === template) return true;
    }
    return false;
  }
}

// ---------- Colisão AABB contra tiles (e = {x, y, w, h} com x,y no canto superior esquerdo) ----------

const EPS = 0.001;

export function moveX(world, e, dx) {
  if (dx === 0) return 0;
  e.x += dx;
  const top = Math.floor(e.y / TILE), bottom = Math.floor((e.y + e.h - EPS) / TILE);
  if (dx > 0) {
    const tx = Math.floor((e.x + e.w - EPS) / TILE);
    for (let ty = top; ty <= bottom; ty++) if (world.tileAt(tx, ty) === SOLID) { e.x = tx * TILE - e.w; return 1; }
  } else {
    const tx = Math.floor(e.x / TILE);
    for (let ty = top; ty <= bottom; ty++) if (world.tileAt(tx, ty) === SOLID) { e.x = (tx + 1) * TILE; return -1; }
  }
  return 0;
}

export function moveY(world, e, dy, oneWay = true) {
  if (dy === 0) return 0;
  const prevBottom = e.y + e.h;
  e.y += dy;
  const left = Math.floor(e.x / TILE), right = Math.floor((e.x + e.w - EPS) / TILE);
  if (dy > 0) {
    const ty = Math.floor((e.y + e.h - EPS) / TILE);
    const tileTop = ty * TILE;
    for (let tx = left; tx <= right; tx++) {
      const t = world.tileAt(tx, ty);
      if (t === SOLID || (oneWay && t === ONEWAY && prevBottom <= tileTop + EPS)) { e.y = tileTop - e.h; return 1; }
    }
  } else {
    const ty = Math.floor(e.y / TILE);
    for (let tx = left; tx <= right; tx++) if (world.tileAt(tx, ty) === SOLID) { e.y = (ty + 1) * TILE; return -1; }
  }
  return 0;
}

// "Raios" de parede: dois pontos (alto e baixo) logo ao lado; os dois precisam bater.
export function touchingWall(world, e, dir) {
  const x = dir > 0 ? e.x + e.w + 1 : e.x - 1;
  return world.isSolidAt(x, e.y + 4) && world.isSolidAt(x, e.y + e.h - 4);
}
