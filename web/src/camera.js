// Câmera: segue o jogador com antecipação na direção do movimento (importante em retrato, onde a largura é pequena).
// Na vertical usa a última altura em que o jogador pisou (não balança a cada pulo) e só acompanha subidas/quedas grandes.
// O jogador fica um pouco abaixo do meio da tela, acima da área dos polegares.

import { VIEW_W, TILE, CHUNK_H } from './config.js';

const MIN_TOP = -(CHUNK_H + 12) * TILE;

export class Camera {
  constructor() {
    this.x = 0; this.y = 0; this.prevX = 0; this.prevY = 0;
    this.anchorY = 0;
    this.scale = 1; this.viewW = VIEW_W; this.viewH = 900;
    this.view = { left: 0, right: 0, top: 0, bottom: 0 };
  }

  resize(canvasW, canvasH) {
    this.scale = canvasW / VIEW_W;
    this.viewH = canvasH / this.scale;
    this._updateView();
  }

  snap(p) {
    this.anchorY = p.cy;
    this.x = p.cx; this.y = this._targetY(p);
    this.prevX = this.x; this.prevY = this.y;
    this._updateView();
  }

  step(dt, p) {
    this.prevX = this.x; this.prevY = this.y;
    const lookAhead = p.isDead ? 0 : p.facing * 45 + p.vx * 0.1;
    this.x += (p.cx + lookAhead - this.x) * Math.min(1, dt * 5);
    if (p.onGround) this.anchorY = p.cy;
    this.y += (this._targetY(p) - this.y) * Math.min(1, dt * 3.5);
    this._updateView();
  }

  _targetY(p) {
    const vh = this.viewH;
    let focus = this.anchorY;
    if (p.cy < focus - 0.18 * vh) focus = p.cy + 0.18 * vh;     // subiu bastante: acompanha
    if (p.cy > focus + 0.10 * vh) focus = p.cy - 0.10 * vh;     // caiu bastante: acompanha
    const y = focus - 0.11 * vh;                                // jogador ~61% da altura da tela (mais visão acima)
    return Math.max((this.minTop ?? MIN_TOP) + vh / 2, Math.min(0, y));   // minTop: na água, não sobe muito além da superfície
  }

  _updateView() {
    const v = this.view;
    v.left = this.x - VIEW_W / 2; v.right = this.x + VIEW_W / 2;
    v.top = this.y - this.viewH / 2; v.bottom = this.y + this.viewH / 2;
  }
}
