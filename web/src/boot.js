// Abertura do jogo (v0.21): vinheta "RX Games apresenta" + logo NEKO G + carregamento de verdade antes da tela inicial.
// Espera as folhas de sprites, as camadas da tela inicial, as texturas dos cenários e a música; desenha cada
// imagem uma vez na GPU (sem engasgo depois) e roda a tela inicial por trás para aquecer. Só então mostra
// "Toque para começar", e o toque libera o som (exigência do Android/navegador) e começa a música.

import { VERSION } from './config.js';

const TIPS = [
  'O dash atravessa inimigos sem levar dano.',
  'Pegue as G Batty ⚡ para subir de nível e escolher skills.',
  'Na Jornada, vencer um mapa deixa seguir com o mesmo nível.',
  'Cada personagem tem uma arma exclusiva e talentos próprios.',
  'Vença sem revive e com a vida alta para ganhar 3 estrelas.',
  'No Cyber Deep você nada: toque PULO para dar braçadas.',
];
const MIN_MS = 4300;          // vinheta RX Games (≈2,6 s) + logo do jogo acendendo
const LOAD_AT = 3600;         // a barra de carregamento só aparece depois da vinheta (se ainda faltar algo)
const MAX_MS = 12000;         // se algo não carregar, segue mesmo assim

export function runBoot({ renderer, audio, game }) {
  const $ = (id) => document.getElementById(id);
  const ov = $('ov-boot');
  const skip = (navigator.webdriver && !game.params.has('intro')) || game.params.has('nointro');
  if (skip || !ov) { if (ov) ov.remove(); return; }

  $('boot-ver').textContent = `v${VERSION}`;
  const bar = $('boot-bar'), pct = $('boot-pct'), tip = $('boot-tip'), go = $('boot-go'), cv = $('boot-char');
  let tipI = Math.floor(Math.random() * TIPS.length);
  tip.textContent = TIPS[tipI];
  const tipT = setInterval(() => { tipI = (tipI + 1) % TIPS.length; tip.classList.remove('in'); void tip.offsetWidth; tip.textContent = TIPS[tipI]; tip.classList.add('in'); }, 2600);

  const t0 = performance.now();
  let musicOk = false, shown = 0, ready = false, warmed = 0;
  const m = audio.music;
  if (m.readyState >= 3) musicOk = true;
  else { m.addEventListener('canplaythrough', () => { musicOk = true; }, { once: true }); try { m.load(); } catch { /* segue */ } }
  setTimeout(() => { musicOk = true; }, 6000);       // música não pode travar a abertura

  const tick = () => {
    if (!ov.isConnected) return;
    const now = performance.now();
    const [ok, total] = renderer.bootStatus();
    const fonts = !document.fonts || document.fonts.status === 'loaded';
    const done = ok + (musicOk ? 1 : 0) + (fonts ? 1 : 0), all = total + 2;
    const target = Math.min(1, done / all);
    shown += (target - shown) * 0.12;                 // barra anda suave
    bar.style.transform = `scaleX(${shown.toFixed(3)})`;
    pct.textContent = `${Math.round(shown * 100)}%`;
    if (now - t0 > LOAD_AT - 400 && renderer.sheets.menu && renderer.sheets.menu.img) {
      renderer.drawThumb(cv, 'menu.' + (game.meta.selected || 'gato'), now / 1000);
      cv.classList.add('on');
    }
    if (now - t0 > LOAD_AT && !ready && shown < 0.98) ov.classList.add('show-load');   // só mostra a barra se ainda estiver carregando
    if (done === all && warmed < 20) { renderer.warmGpu(); warmed++; }   // ~20 quadros com tudo pronto
    const loaded = (done === all && warmed >= 20) || now - t0 > MAX_MS;
    if (loaded && now - t0 > MIN_MS && !ready) {
      ready = true;
      bar.style.transform = 'scaleX(1)'; pct.textContent = '100%';
      ov.classList.add('ready'); ov.classList.remove('show-load');
      go.classList.remove('hidden');
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const enter = () => {
    if (!ready) return;
    ov.classList.remove('show-load');
    clearInterval(tipT);
    audio.unlock();
    if (audio.music.paused) audio.startMusic();
    const tm = document.getElementById('tap-music');
    if (tm) tm.classList.add('hidden');                 // a música já começou no toque da abertura
    ov.classList.add('out');
    setTimeout(() => ov.remove(), 450);
    window.removeEventListener('keydown', key);
  };
  const key = (e) => { if (e.key === 'Enter' || e.key === ' ') enter(); };
  ov.addEventListener('pointerdown', enter);
  window.addEventListener('keydown', key);
}
