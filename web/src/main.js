// Inicialização e laço principal: simulação em passo fixo (60 Hz) + desenho interpolado a cada quadro.

import { STEP } from './config.js';
import { Input } from './input.js';
import { AudioSys } from './audio.js';
import { Game, GS } from './game.js';
import { Renderer } from './render.js';
import { UI } from './ui.js';
import { initPlatform } from './platform.js';
import { Cloud } from './cloud.js';
import { setSaveHook } from './game.js';

const params = new URLSearchParams(location.search);
const canvas = document.getElementById('game');
const app = document.getElementById('app');

const audio = new AudioSys('assets/music/steel_laced_pursuit.mp3');
const input = new Input();
input.bindTouch({
  leftBtn: document.getElementById('btn-left'),
  rightBtn: document.getElementById('btn-right'),
  jumpBtn: document.getElementById('btn-jump'),
  dashBtn: document.getElementById('btn-dash'),
  attackBtn: document.getElementById('btn-attack'),
});

const game = new Game({ audio, input, params });
const renderer = new Renderer(canvas, game);
window.__R = renderer;                   // testes: folhas carregadas etc.
renderer.debug = params.has('debug');
game.renderer = renderer;
if (params.has('coins')) {                     // só para testes: define o saldo de Cyber-Moedas
  game.meta.cyberCoins = Number(params.get('coins')) || 0;
  try { localStorage.setItem('neonpaws.save.v1', JSON.stringify(game.meta)); } catch { /* sem armazenamento */ }
}

const start = (opts) => {
  audio.unlock();
  if (audio.music.paused) audio.startMusic();
  game.newRun(opts);
};
game.ui = new UI(game, { start, restart: start });
game.ui.onState(GS.Title);

// Conta e nuvem (Firebase; sem configuração = modo demonstração). O jogo não espera: começa com o save local.
const cloud = new Cloud(game);
game.cloud = cloud;
setSaveHook(() => cloud.queueSave());
game.ui.attachCloud(cloud);
cloud.init(params);
window.__cloud = cloud;

// Resolução: até 2x a densidade da tela (mais que isso só custa bateria em celular simples).
// Resolução dinâmica: se o aparelho não acompanhar a taxa da tela, baixa a resolução em passos
// (2 → 1,7 → 1,45 → 1,25); se sobrar folga por bastante tempo, sobe de novo.
const RES_STEPS = [2, 1.7, 1.45, 1.25];
let resStep = 0, appW = app.clientWidth, appH = app.clientHeight;
if (window.ResizeObserver) new ResizeObserver(() => { appW = app.clientWidth; appH = app.clientHeight; resize(); }).observe(app);
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, RES_STEPS[resStep]);
  const w = Math.round(appW * dpr), h = Math.round(appH * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w; canvas.height = h;
    game.camera.resize(w, h);
    renderer.resize();
  }
}
window.addEventListener('resize', () => { appW = app.clientWidth; appH = app.clientHeight; resize(); });

// Mede o ritmo real dos quadros (janela de 2 s) e ajusta a resolução
const fpsMon = { t: 0, n: 0, slow: 0, fps: 60, hz: 60, good: 0 };
window.__fps = fpsMon;
function watchFps(dtMs) {
  fpsMon.t += dtMs; fpsMon.n++;
  if (dtMs > fpsMon.target * 1.6) fpsMon.slow++;
  if (fpsMon.t < 2000) return;
  fpsMon.fps = Math.round((fpsMon.n * 1000) / fpsMon.t);
  const slowShare = fpsMon.slow / fpsMon.n;
  if (game.isSimulating) {
    if (slowShare > 0.12 && resStep < RES_STEPS.length - 1) { resStep++; resize(); fpsMon.good = 0; }
    else if (slowShare < 0.02 && resStep > 0 && ++fpsMon.good >= 5) { resStep--; resize(); fpsMon.good = 0; }
  }
  fpsMon.res = RES_STEPS[resStep];
  fpsMon.t = 0; fpsMon.n = 0; fpsMon.slow = 0;
}
// Taxa da tela (60/90/120 Hz): estimada nos primeiros quadros
fpsMon.target = 1000 / 60;
{ let k = 0, acc = 0, prev = 0; const probe = (t) => { if (prev) { acc += t - prev; k++; } prev = t; if (k < 30) requestAnimationFrame(probe); else { fpsMon.target = Math.max(1000 / 144, acc / k); fpsMon.hz = Math.round(1000 / fpsMon.target); } }; requestAnimationFrame(probe); }
resize();
game.player.reset(12 * 32, -2 * 32);          // fundo da tela inicial: o cenário do começo
game.camera.snap(game.player);

initPlatform({
  back: (exit) => game.ui.back(exit),
  pause: () => { game.pause(); audio.pauseMusic(); },     // app foi para o segundo plano: pausa a partida
});

// Teclado: Esc ou P pausa / continua
window.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape' && e.code !== 'KeyP') return;
  if (game.state === GS.Playing) game.pause();
  else if (game.state === GS.Paused) game.resume();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { game.pause(); audio.pauseMusic(); }
  else if (game.state !== GS.Title) audio.resumeMusic();
});

// ---------------- Bot de teste (?bot=1): joga sozinho para testes automáticos ----------------
let bot = null;
if (params.has('bot')) {
  bot = { moveX: 1, jumpHeld: false, attackHeld: true, t: 0, dir: 1, jt: 0, dt: 0, pick: 0 };
  input.setBot(bot);
}
function botTick(dt) {
  if (!bot) return;
  bot.t += dt; bot.jt -= dt; bot.dt -= dt;
  if (bot.t > 3.5) { bot.t = 0; bot.dir = -bot.dir; }
  bot.moveX = bot.dir;
  if (bot.jt <= 0) { input.pressJump(); bot.jumpHeld = true; bot.jt = 0.9; }
  if (bot.jt < 0.65) bot.jumpHeld = false;
  if (bot.dt <= 0) { input.pressDash(); bot.dt = 2.2; }
  if (game.state === GS.LevelUp) { bot.pick += dt; if (bot.pick > 0.4) { bot.pick = 0; document.querySelector('#cards .card')?.click(); } }
  if (game.state === GS.Revive && !game.adPlaying) game.watchAd();
  if (game.state === GS.GameOver && params.has('loop')) start();
}

// ---------------- Laço ----------------
const speed = Math.max(1, Number(params.get('speed')) || 1);
let last = performance.now();
let acc = 0;

const perf = { frames: 0, sum: 0, max: 0 };
window.__perf = perf;

function frame(now) {
  const t0 = performance.now();
  const realDt = Math.min(0.1, (now - last) / 1000);
  last = now;
  watchFps(realDt * 1000);
  game.realtime(realDt);
  botTick(realDt * speed);

  if (game.hitStop > 0) {
    game.hitStop -= realDt;                    // micro-pausa de impacto
  } else if (game.isSimulating) {
    acc += realDt * speed;
    let steps = 0;
    while (acc >= STEP && game.isSimulating && steps < 8 * speed) {
      game.step(STEP);
      acc -= STEP;
      steps++;
    }
    if (!game.isSimulating) acc = 0;
  } else {
    acc = 0;
  }

  renderer.draw(game.isSimulating ? acc / STEP : 1, realDt);
  game.ui.update();
  const ms = (performance.now() - t0) / speed;
  perf.frames++; perf.sum += ms; perf.max = Math.max(perf.max, ms);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

window.__game = game;               // para testes automáticos
window.__start = start;
