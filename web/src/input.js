// Entrada: teclado + botões de toque (◀ ▶ à esquerda; ATAQUE, PULO e DASH à direita).
// Os toques chegam a qualquer momento (eventos); viram "pedidos" com buffer que a simulação consome no passo fixo.

import { PLAYER } from './config.js';

const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const JUMP = new Set(['Space', 'KeyW', 'ArrowUp', 'KeyZ']);
const DASH = new Set(['ShiftLeft', 'ShiftRight', 'KeyK', 'KeyX', 'KeyL']);
const ATTACK = new Set(['KeyJ', 'KeyC', 'Enter']);
const ATTACK_BUFFER = 0.12;

export class Input {
  constructor() {
    this.enabled = false;
    this.jumpBuf = 0;
    this.dashBuf = 0;
    this.attackBuf = 0;
    this.moveX = 0;
    this._keys = new Set();
    this._touch = { left: false, right: false, jump: false, attack: false, lastDir: 0 };
    this._bot = null;       // usado só em testes automáticos
    this._bindKeyboard();
  }

  get moveDir() { return this.moveX > 0 ? 1 : this.moveX < 0 ? -1 : 0; }
  get jumpHeld() {
    if (this._bot) return this._bot.jumpHeld;
    for (const k of JUMP) if (this._keys.has(k)) return true;
    return this._touch.jump;
  }
  get attackHeld() {
    if (this._bot) return this._bot.attackHeld;
    for (const k of ATTACK) if (this._keys.has(k)) return true;
    return this._touch.attack;
  }
  hasJump() { return this.jumpBuf > 0; }
  hasDash() { return this.dashBuf > 0; }
  wantsAttack() { return this.attackBuf > 0 || this.attackHeld; }
  consumeJump() { this.jumpBuf = 0; }
  consumeDash() { this.dashBuf = 0; }
  consumeAttack() { this.attackBuf = 0; }
  clear() { this.jumpBuf = 0; this.dashBuf = 0; this.attackBuf = 0; }

  pressJump() { if (this.enabled) this.jumpBuf = PLAYER.jumpBuffer; }
  pressDash() { if (this.enabled) this.dashBuf = PLAYER.dashBuffer; }
  pressAttack() { if (this.enabled) this.attackBuf = ATTACK_BUFFER; }

  tick(dt) {
    this.jumpBuf -= dt;
    this.dashBuf -= dt;
    this.attackBuf -= dt;
    if (this._bot) { this.moveX = this._bot.moveX; return; }
    let x = 0;
    for (const k of LEFT) if (this._keys.has(k)) x -= 1;
    for (const k of RIGHT) if (this._keys.has(k)) x += 1;
    if (x === 0) {
      const t = this._touch;
      if (t.left && t.right) x = t.lastDir;          // os dois apertados: vale o último
      else x = (t.right ? 1 : 0) - (t.left ? 1 : 0);
    }
    this.moveX = Math.sign(x);
  }

  setBot(bot) { this._bot = bot; }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      const tg = e.target;                            // digitando num campo (conta): o jogo não captura a tecla
      if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA')) return;
      if (JUMP.has(e.code) || DASH.has(e.code) || LEFT.has(e.code) || RIGHT.has(e.code) || ATTACK.has(e.code)) e.preventDefault();
      if (e.repeat) return;
      this._keys.add(e.code);
      if (JUMP.has(e.code)) this.pressJump();
      if (DASH.has(e.code)) this.pressDash();
      if (ATTACK.has(e.code)) this.pressAttack();
    });
    window.addEventListener('keyup', (e) => this._keys.delete(e.code));
    window.addEventListener('blur', () => {
      this._keys.clear();
      Object.assign(this._touch, { left: false, right: false, jump: false, attack: false });
    });
  }

  // Botões de toque com multitoque (cada dedo é um ponteiro independente)
  bindTouch({ leftBtn, rightBtn, jumpBtn, dashBtn, attackBtn }) {
    const t = this._touch;
    const bind = (btn, onDown, onUp) => {
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        try { btn.setPointerCapture(e.pointerId); } catch { /* sem captura */ }
        btn.classList.add('on');
        onDown();
      });
      const up = () => { btn.classList.remove('on'); onUp(); };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointercancel', up);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    };
    bind(leftBtn, () => { t.left = true; t.lastDir = -1; }, () => { t.left = false; });
    bind(rightBtn, () => { t.right = true; t.lastDir = 1; }, () => { t.right = false; });
    bind(jumpBtn, () => { t.jump = true; this.pressJump(); }, () => { t.jump = false; });
    bind(dashBtn, () => this.pressDash(), () => {});
    bind(attackBtn, () => { t.attack = true; this.pressAttack(); }, () => { t.attack = false; });
  }
}
