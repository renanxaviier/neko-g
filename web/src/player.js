// Jogador: máquina de estados de movimentação (porte do PlayerController.cs).
// Pulo variável, coyote time, jump buffer, pulo duplo, wall slide/jump, dash horizontal com i-frames e cooldown.

import { PLAYER as C, WATER as WC } from './config.js';
import { moveX, moveY, touchingWall } from './world.js';

export const PS = { Idle: 'idle', Run: 'run', Jump: 'jump', Fall: 'fall', WallSlide: 'wallslide', Dash: 'dash', Hit: 'hit', Death: 'death', Glide: 'glide', Slam: 'slam' };

const jumpVelocity = (h) => Math.sqrt(2 * C.gravity * h);   // gravidade é a mesma para todos

export class Player {
  constructor(world, input, fx) {
    this.world = world;
    this.input = input;
    this.fx = fx;                 // callbacks de efeitos (pulo, aterrissagem, dash...)
    this.C = { ...C };
    this.w = this.C.w; this.h = this.C.h;
    this.speedMult = 1;
    this.dashMult = 1;
    this.reset(0, 0);
  }

  // Aplica o traço de movimento do personagem (ex.: 2 pulos no ar, planar, queda pesada)
  setCharacter(ch) { this.C = { ...C, ...(ch.player || {}) }; }

  // Meio em que o personagem está: 'air' ou 'water' (docs/subaquatico.md).
  // Na água os mesmos botões viram nado: PULO = braçada, DASH = torpedo, Queda do Pug = Âncora.
  setMedium(m) {
    this.medium = m || 'air';
    this.inWater = this.medium === 'water';
    this.strokeCd = 0;
    if (this.inWater && this.state === PS.Slam) this._setState(PS.Fall);
  }

  reset(footX, footY) {
    this.x = footX - this.w / 2; this.y = footY - this.h;
    this.prevX = this.x; this.prevY = this.y;
    this.vx = 0; this.vy = 0;
    this.state = PS.Idle; this.facing = 1;
    this.onGround = false; this.wasGrounded = false;
    this.coyote = 0; this.wallCoyote = 0; this.wallJumpLock = 0;
    this.dashT = 0; this.dashCd = 0; this.dashDir = 1; this.dashInvuln = 0;
    this.dashMax = this.dashMax || 1; this.dashStock = this.dashMax; this.dashCdMult = this.dashCdMult || 1;
    this.hitT = 0;
    this.wallDir = 0; this.lastWallDir = 0; this.wallSliding = false;
    this.jumpAscending = false;
    this.hitWallX = 0;
    this.lastVy = 0;
    this.gliding = false;
    this.sx = 1; this.sy = 1;     // squash & stretch (visual)
    this.animT = 0;
    this.attackT = 9; this.airJumpT = 9; this.slamT = 9;
    this.resetAir();
  }

  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  get bottom() { return this.y + this.h; }
  get isDashing() { return this.state === PS.Dash; }
  get isDead() { return this.state === PS.Death; }
  get dashInvulnerable() { return this.dashInvuln > 0 || this.state === PS.Dash || this.state === PS.Slam; }

  resetAir() { this.airJumps = this.C.maxAirJumps; this.airDashes = this.C.maxAirDashes + ((this.dashMax || 1) - 1); }

  step(dt) {
    this.prevX = this.x; this.prevY = this.y;
    this.animT += dt;
    this.attackT += dt;
    this.airJumpT += dt;
    this.slamT += dt;
    this.sx += (1 - this.sx) * Math.min(1, dt * 14);
    this.sy += (1 - this.sy) * Math.min(1, dt * 14);

    if (this.state === PS.Death) {
      this.vx *= 0.85;
      if (this.inWater) this.vy = Math.min(this.vy + WC.gravity * dt, WC.maxFall);
      else this.vy = Math.min(this.vy + this.C.gravity * this.C.fallGravityMult * dt, this.C.maxFall);
      this._integrate(dt);
      return;
    }
    if (this.inWater) { this._swimStep(dt); return; }

    // Chão (resultado do último movimento) e paredes
    const grounded = this.onGround;
    if (grounded) {
      if (!this.wasGrounded) this._landed();
      this.coyote = this.C.coyote;
      this.wallCoyote = 0;
      this.jumpAscending = false;
      this.resetAir();
    }
    this.wasGrounded = grounded;

    this.wallDir = touchingWall(this.world, this, 1) ? 1 : touchingWall(this.world, this, -1) ? -1 : 0;
    if (this.wallDir !== 0 && !grounded) { this.wallCoyote = this.C.wallCoyote; this.lastWallDir = this.wallDir; }

    if (!grounded) this.coyote -= dt;
    if (this.wallDir === 0) this.wallCoyote -= dt;
    this.wallJumpLock -= dt;
    this.dashCd -= dt;
    if (this.dashStock < (this.dashMax || 1) && !this.isDashing && (this.dashRegenT -= dt) <= 0) this.dashStock = this.dashMax;   // carga que sobrou volta sozinha
    this.dashInvuln -= dt;

    if (this.state === PS.Dash) this._tickDash(dt);
    else if (this.state === PS.Slam) this._tickSlam(dt);
    else if (this.state === PS.Hit) this._tickHit(dt);
    else if (!this._tryDash()) {
      this._tryJump();
      this._horizontal(dt);
      this._vertical(dt);
    }

    this.lastVy = this.vy;
    this._integrate(dt);
    if (this.state === PS.Slam && this.onGround) this._endSlam();
    else if (this.state !== PS.Dash && this.state !== PS.Hit && this.state !== PS.Slam) this._updateLocomotion();
  }

  // ---------------- Pulo ----------------

  _tryJump() {
    const inp = this.input;
    if (!inp.hasJump()) return;
    const canGround = this.onGround || this.coyote > 0;
    const canWall = !this.onGround && (this.wallDir !== 0 || this.wallCoyote > 0);

    if (canGround) {
      inp.consumeJump();
      this._doJump(jumpVelocity(this.C.jumpHeight));
      this.fx.jump(this, false);
    } else if (canWall) {
      inp.consumeJump();
      this._doWallJump(this.wallDir !== 0 ? this.wallDir : this.lastWallDir);
    } else if (this.airJumps > 0) {
      inp.consumeJump();
      this.airJumps--;
      this._doJump(jumpVelocity(this.C.airJumpHeight));
      this.airJumpT = 0;
      this.fx.jump(this, true);
    }
    // senão o pedido fica no buffer: se tocar o chão antes de expirar, pula ao aterrissar
  }

  _doJump(v) {
    this.coyote = 0; this.wallCoyote = 0;
    this.jumpAscending = true;
    this.onGround = false;
    this.vy = -v;
    this.sx = 0.75; this.sy = 1.3;
  }

  _doWallJump(wallDir) {
    const away = -wallDir;
    this.coyote = 0; this.wallCoyote = 0;
    this.wallJumpLock = this.C.wallJumpLock;
    this.jumpAscending = true;
    this.resetAir();
    this.vx = away * this.C.wallJumpSpeed;
    this.vy = -jumpVelocity(this.C.wallJumpHeight);
    this.facing = away;
    this.sx = 0.8; this.sy = 1.25;
    this.fx.wallJump(this, away);
  }

  // ---------------- Movimento ----------------

  _horizontal(dt) {
    if (this.wallJumpLock > 0) return;           // mantém o impulso do wall jump
    const dir = this.input.moveDir;
    const max = this.C.maxRunSpeed * this.speedMult;
    const target = dir * max;
    const turning = dir !== 0 && Math.abs(this.vx) > 1 && Math.sign(this.vx) !== dir;
    let rate = this.onGround ? (dir ? this.C.groundAccel : this.C.groundDecel) : (dir ? this.C.airAccel : this.C.airDecel);
    if (turning) rate += this.onGround ? this.C.groundDecel : this.C.airDecel;
    const d = target - this.vx, s = rate * dt;
    this.vx = Math.abs(d) <= s ? target : this.vx + Math.sign(d) * s;
    if (dir) this.facing = dir;
  }

  _vertical(dt) {
    let vy = this.vy;
    // Pulo variável: soltou o botão subindo → corta a subida
    if (this.jumpAscending) {
      if (vy >= 0) this.jumpAscending = false;
      else if (!this.input.jumpHeld) { vy *= this.C.jumpCut; this.jumpAscending = false; }
    }
    this.wallSliding = this._canWallSlide(vy);
    let g = 1;
    if (this.wallSliding) this.airDashes = this.C.maxAirDashes + ((this.dashMax || 1) - 1);            // parede recarrega o dash aéreo
    else if (vy > 0) g = this.C.fallGravityMult;
    else if (!this.onGround && this.input.jumpHeld && Math.abs(vy) < this.C.apexThreshold) g = this.C.apexGravityMult;
    vy += this.C.gravity * g * dt;
    if (this.wallSliding) vy = Math.min(vy, this.C.wallSlideMax);
    // Planar: segurando PULO enquanto cai, a queda fica lenta
    this.gliding = !!this.C.glide && !this.onGround && !this.wallSliding && vy > 0 && this.input.jumpHeld;
    if (this.gliding) vy = Math.min(vy, this.C.glideFall);
    this.vy = Math.min(vy, this.C.maxFall);
  }

  _canWallSlide(vy) {
    if (this.onGround || this.wallDir === 0 || vy < 0) return false;
    return !this.C.requireInputTowardWall || this.input.moveDir === this.wallDir;
  }

  // ---------------- Dash ----------------

  _tryDash() {
    const inp = this.input;
    if (!inp.hasDash() || this.dashCd > 0) return false;
    if (this.C.slam && !this.onGround && !this.wallSliding) {
      inp.consumeDash();
      this.jumpAscending = false;
      this.vx = 0; this.vy = 950;
      this.dashInvuln = 9;
      this.sx = 0.8; this.sy = 1.3;
      this._setState(PS.Slam);
      this.fx.sfx('dash');
      return true;
    }
    if (!this.onGround && this.airDashes <= 0) return false;
    inp.consumeDash();
    if (!this.onGround) this.airDashes--;
    this.dashStock = Math.max(0, (this.dashStock ?? 1) - 1);   // Dash Duplo: 2 cargas

    let dir = inp.moveDir || this.facing;
    if (this.wallSliding && dir === this.wallDir) dir = -dir;
    this.dashDir = dir;
    this.dashT = this.C.dashDuration;
    this.dashInvuln = this.C.dashDuration + this.C.dashExtraInvuln;
    this.jumpAscending = false;
    this.wallSliding = false;
    this.vx = dir * this.C.dashSpeed * this.dashMult;
    this.vy = 0;
    this.facing = dir;
    this.sx = 1.35; this.sy = 0.75;
    this._setState(PS.Dash);
    this.fx.dash(this, dir);
    return true;
  }

  _tickDash(dt) {
    this.dashT -= dt;
    this.vx = this.dashDir * this.C.dashSpeed * this.dashMult;
    this.vy = 0;
    if (this.dashT <= 0 || this.hitWallX === this.dashDir) this._endDash();
  }

  _tickSlam(dt) {
    this.vx = 0;
    this.vy = 950;
  }

  _endSlam() {
    this.dashInvuln = 0.2;
    this.dashCd = 0.5;
    this.sx = 1.4; this.sy = 0.7;
    this.slamT = 0;
    this.fx.slam(this);
    this._updateLocomotion();
  }

  _endDash() {
    // com carga sobrando, o próximo dash sai quase na hora; sem carga, recarrega tudo de uma vez
    if (this.dashStock > 0) { this.dashCd = 0.06; this.dashRegenT = this.C.dashCooldown * (this.dashCdMult || 1); }
    else { this.dashCd = this.C.dashCooldown * (this.dashCdMult || 1); this.dashStock = this.dashMax || 1; }
    const max = this.C.maxRunSpeed * this.speedMult;
    this.vx = Math.max(-max, Math.min(max, this.vx));
    this._updateLocomotion();
  }

  // ---------------- Nado (setor submerso) ----------------

  _swimStep(dt) {
    const grounded = this.onGround;
    if (grounded && !this.wasGrounded) this._landed();
    this.wasGrounded = grounded;
    if (grounded) this.resetAir();
    this.wallSliding = false; this.wallDir = 0;
    this.strokeCd -= dt;
    this.dashCd -= dt;
    if (this.dashStock < (this.dashMax || 1) && !this.isDashing && (this.dashRegenT -= dt) <= 0) this.dashStock = this.dashMax;
    this.dashInvuln -= dt;

    if (this.state === PS.Dash) {
      this.dashT -= dt;
      this.vx = this.dashDir * this.torpX; this.vy = this.torpY;
      if (this.dashT <= 0 || (this.hitWallX && this.hitWallX === this.dashDir)) this._endTorpedo();
    } else if (this.state === PS.Slam) {
      this.vx = 0; this.vy = WC.anchorSpeed;           // Âncora do Pug
    } else if (this.state === PS.Hit) {
      this._tickHit(dt);
    } else if (!this._tryTorpedo()) {
      this._stroke();
      this._swimMove(dt);
    }
    this.lastVy = this.vy;
    this._integrate(dt);
    // Superfície: não passa do teto de água (a cabeça fica no limite)
    if (this.y < WC.top) { this.y = WC.top; if (this.vy < 0) this.vy = 0; }
    if (this.state === PS.Slam && this.onGround) this._endSlam();
    else if (this.state !== PS.Dash && this.state !== PS.Hit && this.state !== PS.Slam) this._updateLocomotion();
  }

  // PULO = braçada: impulso para cima, sem limite (recarga curta). Funciona também saindo do fundo.
  _stroke() {
    const inp = this.input;
    if (!inp.hasJump() || this.strokeCd > 0) return;
    inp.consumeJump();
    const pow = WC.stroke * (this.C.maxAirJumps >= 2 ? WC.gatoStroke : 1) * (this.C.slam ? WC.pugStroke : 1);
    this.vy = Math.min(this.vy, 0) - pow;
    this.vy = Math.max(this.vy, -pow * 1.25);
    this.onGround = false;
    this.strokeCd = WC.strokeCd;
    this.airJumpT = 0;
    this.sx = 0.82; this.sy = 1.2;
    this.fx.stroke ? this.fx.stroke(this) : this.fx.jump(this, true);
  }

  _swimMove(dt) {
    const dir = this.input.moveDir;
    const max = WC.speed * (this.C.maxRunSpeed / C.maxRunSpeed) * this.speedMult;
    const target = dir * max;
    const rate = this.onGround ? (dir ? WC.groundAccel : WC.groundDecel) : (dir ? WC.accel : WC.drag);
    const d = target - this.vx, st = rate * dt;
    this.vx = Math.abs(d) <= st ? target : this.vx + Math.sign(d) * st;
    if (dir) this.facing = dir;
    // Vertical: afunda devagar; segurar PULO sobe devagar (Guaxinim: flutua parado)
    let vy = this.vy;
    const sink = WC.gravity * (this.C.slam ? WC.pugSink : 1);
    const maxFall = WC.maxFall * (this.C.slam ? WC.pugSink : 1);
    if (vy < 0) vy += (sink + WC.riseDrag * -vy) * dt;           // subida perde força com o arrasto
    else vy += sink * dt;
    this.gliding = false;
    if (this.input.jumpHeld && !this.onGround) {
      if (this.C.glide) { vy += (0 - vy) * Math.min(1, 6 * dt); this.gliding = vy > -20; }   // Flutuar
      else if (vy > -WC.holdRise) vy -= (sink + WC.holdLift) * dt;
    }
    this.vy = Math.min(vy, maxFall);
  }

  // DASH = torpedo: avanço de 0,25 s na direção do movimento (diagonal para cima com PULO apertado)
  _tryTorpedo() {
    const inp = this.input;
    if (!inp.hasDash() || this.dashCd > 0) return false;
    if (this.C.slam && !this.onGround) {
      inp.consumeDash();
      this.vx = 0; this.vy = WC.anchorSpeed;
      this.dashInvuln = 9;
      this.sx = 0.8; this.sy = 1.3;
      this._setState(PS.Slam);
      this.fx.sfx('dash');
      return true;
    }
    inp.consumeDash();
    this.dashStock = Math.max(0, (this.dashStock ?? 1) - 1);
    const dir = inp.moveDir || this.facing;
    const up = inp.jumpHeld ? 0.7 : 0;
    const sp = WC.torpedo * this.dashMult;
    this.dashDir = dir; this.facing = dir;
    this.torpX = sp * (up ? 0.72 : 1); this.torpY = -sp * up;
    this.dashT = WC.torpedoTime;
    this.dashInvuln = WC.torpedoTime + this.C.dashExtraInvuln;
    this.vx = dir * this.torpX; this.vy = this.torpY;
    this.onGround = false;
    this.sx = 1.35; this.sy = 0.75;
    this._setState(PS.Dash);
    this.fx.dash(this, dir);
    return true;
  }

  _endTorpedo() {
    this._endDash();
    this.vy *= 0.35;
  }

  // ---------------- Dano, morte, revive ----------------

  applyHit(srcX) {
    if (this.state === PS.Death || this.dashInvulnerable) return false;
    const dir = this.cx >= srcX ? 1 : -1;
    this.hitT = this.C.hitStun;
    this.jumpAscending = false;
    const k = this.inWater ? 0.6 : 1;                  // a água amortece o empurrão
    this.vx = dir * this.C.knockbackX * k;
    this.vy = -this.C.knockbackY * k;
    this._setState(PS.Hit);
    return true;
  }

  _tickHit(dt) {
    this.hitT -= dt;
    if (this.inWater) { this.vy = Math.min(this.vy + WC.gravity * dt, WC.maxFall); this.vx *= 1 - Math.min(1, 3 * dt); }
    else this.vy = Math.min(this.vy + this.C.gravity * (this.vy > 0 ? this.C.fallGravityMult : 1) * dt, this.C.maxFall);
    if (this.hitT <= 0) this._updateLocomotion();
  }

  die() {
    this.vx *= 0.3;
    this.vy = Math.max(this.vy, 0);
    this.jumpAscending = false;
    this.wallSliding = false;
    this._setState(PS.Death);
  }

  revive() {
    if (this.state !== PS.Death) return;
    this.resetAir();
    this.dashCd = 0;
    this._setState(this.onGround ? PS.Idle : PS.Fall);
  }

  // ---------------- Física e estados ----------------

  _integrate(dt) {
    const hx = moveX(this.world, this, this.vx * dt);
    this.hitWallX = hx;
    if (hx !== 0) this.vx = 0;
    const hy = moveY(this.world, this, this.vy * dt, true);
    this.onGround = hy === 1;
    if (hy !== 0) this.vy = 0;
  }

  _landed() {
    const impact = Math.max(0, this.lastVy);
    if (impact > 120) { this.sx = 1.25; this.sy = 0.75; }
    this.fx.land(this, impact);
  }

  _updateLocomotion() {
    let next;
    if (this.onGround) next = Math.abs(this.vx) > 10 ? PS.Run : PS.Idle;
    else if (this.wallSliding) next = PS.WallSlide;
    else if (this.gliding) next = PS.Glide;
    else next = this.vy < 0 ? PS.Jump : PS.Fall;
    this._setState(next);
  }

  _setState(s) { if (s !== this.state) this.animT = 0; this.state = s; }
}
