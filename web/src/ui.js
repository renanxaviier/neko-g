// Interface em HTML por cima do canvas: HUD, cartas de level up, Segunda Chance, Game Over e tela inicial.

import { GS } from './game.js';
import { RUN, JOURNEY, WEAPONS, VERSION } from './config.js';
import { UPGRADES, upgradeCost, MAX_UPGRADE } from './meta.js';
import { CHARS, ROSTER, charInfo } from './chars.js';
import { errorText } from './cloud.js';
import { exitApp } from './platform.js';
const saveMeta = (g) => { if (g.saveMeta) g.saveMeta(); };
import { journeyMap, goalText, goalIntro, starText, starCount, STAGE_TYPES } from './journey.js';
import { BOSS_TYPES, BOSS_ORDER } from './boss.js';
import { notifications, CHANGELOG } from './notify.js';
import { BRANCHES, TALENTS, charLevel, talentsOf, spentIn, pointsLeft, canLearn } from './talents.js';
import { iconSvg, ATTACK_LABEL, ATTACK_COLOR } from './controlIcons.js';

const SIZES = [[0.85, 'P'], [1, 'M'], [1.15, 'G'], [1.3, 'GG']];
const ALPHAS = [[1, '100%'], [0.75, '75%'], [0.5, '50%']];
import { CHECKIN_REWARDS, checkinState, ensureDaily, missionText, hasClaimable } from './missions.js';

const $ = (id) => document.getElementById(id);
const fmtTime = (t) => {
  const s = Math.floor(t);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export class UI {
  constructor(game, handlers) {
    this.game = game;
    this.h = handlers;
    for (const s of document.querySelectorAll('.tbtn .ico')) s.innerHTML = iconSvg(s.dataset.ic);
    this._ctl = { atk: $('btn-attack'), jump: $('btn-jump'), dash: $('btn-dash'), s: {} };
    this.el = {
      hud: $('hud'), hpFill: $('hp-fill'), hpText: $('hp-text'), xpFill: $('xp-fill'), lvl: $('lvl'),
      time: $('time'), kills: $('kills'), scrap: $('scrap'), skills: $('skills'), mute: $('btn-mute'),
      title: $('ov-title'), best: $('title-best'),
      levelup: $('ov-levelup'), cards: $('cards'), lvTitle: $('lv-title'),
      revive: $('ov-revive'), count: $('revive-count'), ring: $('revive-ring'), ad: $('btn-ad'), coins: $('btn-coins'), decline: $('btn-decline'), adSim: $('ad-sim'), adLeft: $('ad-left'),
      over: $('ov-over'), overStats: $('over-stats'), restart: $('btn-restart'),
      controls: $('controls'), badge: $('lv-badge'), hideout: $('ov-hideout'), upgrades: $('upgrades'), walletScrap: $('wallet-scrap'), coinIc: $('coin-ic'), banner: $('biome-banner'), bannerName: $('biome-name'), logo: $('logo'), tapMusic: $('tap-music'),
      thumbs: [], toast: $('toast'), chars: $('ov-chars'), csBig: $('cs-big'), chip: $('btn-char'),
    };
    this._last = {};
    this._cardsReadyAt = 0;

    $('btn-start').addEventListener('click', () => this.h.start({ mode: 'endless' }));
    $('btn-journey').addEventListener('click', () => this.h.start({ mode: 'journey', map: game.meta.jMax || 0 }));
    $('btn-maps').addEventListener('click', () => this.showMaps(true));
    this._initCharSelect();
    $('tl-back').addEventListener('click', () => this.showTalents(null));
    $('tl-reset').addEventListener('click', () => { if (this.game.resetTalents(this._tlId)) this._renderTalents(); });
    $('btn-maps-back').addEventListener('click', () => this.showMaps(false));
    this.el.restart.addEventListener('click', () => {
      const r = game.lastResult;
      if (r && r.mode === 'journey' && r.victory && game.continueJourney()) return;   // expedição: segue com o mesmo nível e skills
      this.h.start((r && r.next) || { mode: 'endless' });
    });
    $('btn-menu').addEventListener('click', () => game.toTitle());
    $('btn-hideout').addEventListener('click', () => this.showHideout(true));
    $('btn-over-hideout').addEventListener('click', () => { game.toTitle(); this.showHideout(true); });
    $('btn-hideout-back').addEventListener('click', () => this.showHideout(false));
    // Primeiro toque na tela inicial liga a música (o navegador só deixa tocar som depois de um toque)
    this.el.title.addEventListener('pointerdown', () => {
      game.audio.unlock();
      if (game.audio.music.paused) game.audio.startMusic();
      this.el.tapMusic.classList.add('hidden');
    });
    this.el.ad.addEventListener('click', () => game.watchAd());
    this.el.decline.addEventListener('click', () => game.declineRevive());
    this.el.mute.addEventListener('pointerdown', (e) => { e.stopPropagation(); this._setMuteIcon(game.audio.toggleMute()); });
    this.el.coins.addEventListener('click', () => game.reviveWithCoins());
    // Pausa: botão no HUD, menu com opções e "Encerrar partida" (pede confirmação com um segundo toque)
    $('btn-pause').addEventListener('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); game.pause(); });
    $('btn-resume').addEventListener('click', () => game.resume());
    $('btn-quit').addEventListener('click', () => {
      const b = $('btn-quit');
      if (!b.classList.contains('confirm')) { b.classList.add('confirm'); b.textContent = 'Toque de novo para encerrar'; return; }
      game.quitRun();
    });
    // Opções (pausa e tela inicial)
    const opt = (id, fn) => $(id).addEventListener('click', () => { fn(); this._refreshOpts(); });
    opt('opt-sound', () => this._setMuteIcon(game.audio.toggleMute()));
    opt('opt-shake', () => game.setOption('shake', !game.settings.shake));
    opt('opt-numbers', () => game.setOption('numbers', !game.settings.numbers));
    opt('opt-perf', () => game.setOption('perf', !game.settings.perf));
    opt('opt-auto', () => game.setOption('auto', !game.settings.auto));
    opt('opt-vib', () => { game.setOption('vib', !game.settings.vib); game.vibe(40); });
    opt('opt-lefty', () => game.setOption('lefty', !game.settings.lefty));
    opt('opt-size', () => { const L = SIZES.map((x) => x[0]), i = L.indexOf(game.settings.size); game.setOption('size', L[(i + 1) % L.length]); });
    opt('opt-alpha', () => { const L = ALPHAS.map((x) => x[0]), i = L.indexOf(game.settings.alpha); game.setOption('alpha', L[(i + 1) % L.length]); });
    opt('opt-tut', () => { game.meta.tutDone = false; this._toast('O tutorial aparece na próxima partida'); });
    $('btn-opts').addEventListener('click', () => this.showOpts(true));
    $('btn-feedback').addEventListener('click', () => this.showFeedback(true));
    $('btn-over-fb').addEventListener('click', () => this.showFeedback(true));
    $('fb-back').addEventListener('click', () => this.showFeedback(false));
    $('fb-wa').addEventListener('click', () => this._sendFeedback('wa'));
    $('fb-mail').addEventListener('click', () => this._sendFeedback('mail'));
    $('fb-copy').addEventListener('click', () => this._sendFeedback('copy'));
    $('ver').textContent = `v${VERSION}`;
    $('btn-title-opts').addEventListener('click', () => this.showOpts(true));
    $('btn-opts-back').addEventListener('click', () => this.showOpts(false));
    this._applyControls();
    $('btn-exit-app').addEventListener('click', () => exitApp());
    $('btn-missions').addEventListener('click', () => this.showMissions(true));
    $('btn-missions-back').addEventListener('click', () => this.showMissions(false));
    $('btn-checkin-open').addEventListener('click', () => { this.showMissions(false); this.showCheckin(true); });
    $('btn-checkin-back').addEventListener('click', () => this.showCheckin(false));
    $('btn-checkin').addEventListener('click', () => {
      const r = game.claimCheckin();
      if (r) { this._coinFly(r); this._renderCheckin(); setTimeout(() => this.showCheckin(false), 900); }
    });
    this._setMuteIcon(game.audio.muted);
    this._renderChars();
    this._showBest();
    // v0.19: nada abre sozinho; os avisos (check-in, missões, talentos…) ficam no sino
    $('btn-bell').addEventListener('click', () => this.showNotif(true));
    $('nt-close').addEventListener('click', () => this.showNotif(false));
    $('ov-notif').addEventListener('click', (e) => { if (e.target.id === 'ov-notif') this.showNotif(false); });
    this._bell();
  }

  // ---------------- Notificações ----------------
  _bell() {
    const n = notifications(this.game.meta).length, b = $('bell-n');
    b.textContent = n > 9 ? '9+' : n; b.classList.toggle('hidden', !n);
    $('btn-bell').classList.toggle('has', n > 0);
  }

  showNotif(on) {
    $('ov-notif').classList.toggle('hidden', !on);
    if (!on) { this._bell(); return; }
    this.game.audio.sfx('select');
    const list = notifications(this.game.meta), box = $('nt-list');
    box.innerHTML = list.length ? list.map((n, i) => `<button class="nt" data-i="${i}" style="--nc:${n.color}"><span class="ic">${n.icon}</span><span class="tx"><b>${n.title}</b><small>${n.sub}</small></span><span class="go">›</span></button>${
      n.id === 'news' ? `<div class="nt-news">${CHANGELOG.map((c) => `• ${c}`).join('<br>')}</div>` : ''}`).join('')
      : '<div class="nt-empty">Tudo em dia! Nenhuma novidade agora.</div>';
    box.querySelectorAll('.nt').forEach((b) => b.addEventListener('click', () => this._notifGo(list[Number(b.dataset.i)])));
  }

  _notifGo(n) {
    const g = this.game, m = g.meta;
    this.showNotif(false);
    if (n.action === 'checkin') return this.showCheckin(true);
    if (n.action === 'missions') return this.showMissions(true);
    if (n.action === 'hideout') return this.showHideout(true);
    if (n.action === 'news') { m.seenVer = VERSION; g.saveMeta(); this._bell(); return this.showNotif(true); }
    if (n.action === 'maps') { m.seenJ = m.jMax || 0; g.saveMeta(); return this.showMaps(true); }
    if (n.action === 'char' || n.action === 'talents') {
      this.showChars(true);
      const i = ROSTER.indexOf(n.arg);
      if (i >= 0 && i !== this._cs) this._csGo(i - this._cs);
      if (n.action === 'talents') this.showTalents(n.arg);
    }
  }

  // ---------------- Conta e ranking ----------------
  attachCloud(cloud) {
    this.cloud = cloud;
    cloud.onChange(() => { this._renderChip(); if (!$('ov-account').classList.contains('hidden')) this._renderAccount(); });
    $('acct-chip').addEventListener('click', () => this.showAccount(true));
    $('btn-account').addEventListener('click', () => this.showAccount(true));
    $('btn-account-back').addEventListener('click', () => this.showAccount(false));
    $('btn-ranking').addEventListener('click', () => this.showRanking(true));
    $('btn-ranking-back').addEventListener('click', () => this.showRanking(false));
    $('btn-nick').addEventListener('click', () => this._act(() => cloud.setNick($('nick').value), 'Apelido salvo ✓'));
    $('btn-google').addEventListener('click', () => this._act(() => this._withSwitch(() => cloud.google()), null));
    $('btn-signup').addEventListener('click', () => this._act(() => cloud.signUp($('email').value, $('pass').value), 'Conta criada! Seu progresso agora está salvo na nuvem ✓'));
    $('btn-signin').addEventListener('click', async () => {
      if (cloud.user && cloud.user.guest && this._guestHasProgress()) {
        const ok = await this._confirm('Você está jogando como convidado e tem progresso neste aparelho. Entrar numa conta que já existe troca esse progresso pelo da conta. Para guardar o progresso de convidado, use "Criar conta".');
        if (!ok) return;
      }
      this._act(() => cloud.signIn($('email').value, $('pass').value), 'Bem-vindo de volta ✓');
    });
    $('btn-reset').addEventListener('click', () => {
      if (!$('email').value.trim()) return this._msg('Digite seu e-mail acima e toque de novo em "Esqueci a senha".');
      this._act(() => cloud.reset($('email').value), 'Enviamos um e-mail para você criar uma nova senha.');
    });
    $('btn-signout').addEventListener('click', async () => {
      const ok = await this._confirm('Seu progresso continua guardado na conta. Este aparelho volta a jogar como um convidado novo (do zero) até você entrar de novo.');
      if (ok) this._act(() => cloud.signOut(), 'Você saiu da conta.');
    });
    $('email-form').addEventListener('submit', (ev) => ev.preventDefault());
    // Painel DEV (conta master)
    $('btn-dev').addEventListener('click', () => this.showDev(true));
    $('btn-dev-back').addEventListener('click', () => this.showDev(false));
    const msgs = { maxUpgrades: 'Esconderijo no nível máximo ✓', resetDaily: 'Missões novas e check-in liberado ✓', resetBest: 'Recorde zerado ✓' };
    for (const b of document.querySelectorAll('[data-dev]')) {
      b.addEventListener('pointerdown', (e) => e.stopPropagation());
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        this.game.devAction(b.dataset.dev);
        $('dev-msg').textContent = msgs[b.dataset.dev] || '';
        this._renderDev();
      });
    }
    $('dev-toggle').addEventListener('pointerdown', (e) => e.stopPropagation());
    $('dev-toggle').addEventListener('click', () => $('dev-bar').classList.toggle('hidden'));
    this._renderChip();
  }

  _guestHasProgress() { const m = this.game.meta; return m.runs > 0 || m.scrap > 0 || m.cyberCoins > 0; }

  // Google: se a conta já existe com outro progresso, pergunta antes de trocar
  async _withSwitch(fn) {
    try { await fn(); } catch (e) {
      if (e && e.code === 'in-use') {
        const ok = !this._guestHasProgress() || await this._confirm('Essa conta Google já tem progresso salvo. Entrar nela troca o progresso de convidado deste aparelho pelo da conta.');
        if (ok) await e.proceed();
        return;
      }
      throw e;
    }
  }

  async _act(fn, okText) {
    const panel = $('ov-account').querySelector('.panel');
    panel.classList.add('busy');
    for (const b of panel.querySelectorAll('button')) if (!b.closest('#acct-confirm')) b.disabled = true;   // a confirmação continua clicável
    this._msg('Aguarde…', true);
    try { await fn(); this._msg(okText || '', true); $('pass').value = ''; } catch (e) { console.warn(e); this._msg(errorText(e)); }
    panel.classList.remove('busy');
    for (const b of panel.querySelectorAll('button')) b.disabled = false;
    this._renderAccount();
  }

  _msg(t, ok = false) { const m = $('acct-msg'); m.textContent = t; m.classList.toggle('ok', ok); }

  _confirm(text) {
    return new Promise((res) => {
      const box = $('acct-confirm');
      $('confirm-text').textContent = text;
      box.classList.remove('hidden');
      const done = (v) => { box.classList.add('hidden'); $('btn-confirm-yes').onclick = $('btn-confirm-no').onclick = null; res(v); };
      $('btn-confirm-yes').onclick = () => done(true);
      $('btn-confirm-no').onclick = () => done(false);
    });
  }

  showDev(on) {
    $('ov-dev').classList.toggle('hidden', !on);
    this._overlayTitle(on);
    if (on) { $('dev-msg').textContent = ''; this._renderDev(); } else { this._showBest(); this._renderChars(); }
  }

  _renderDev() {
    const g = this.game, dev = g.isDev;
    $('btn-dev').classList.toggle('hidden', !dev);
    $('dev-hud').classList.toggle('hidden', !dev);
    $('dev-god').classList.toggle('on', !!g.devGod);
    $('dev-god2').innerHTML = `🛡 Invencível: <b>${g.devGod ? 'SIM' : 'NÃO'}</b>`;
    $('dev-fps').innerHTML = `📈 Mostrar FPS: <b>${g.showFps ? 'SIM' : 'NÃO'}</b>`;
    $('fps-meter').classList.toggle('hidden', !((dev && g.showFps) || g.settings.perf));
  }

  _renderChip() {
    const c = this.cloud, chip = $('acct-chip');
    if (!c) return;
    chip.classList.toggle('dev', c.isDev);
    this._renderDev();
    $('acct-label').textContent = c.label();
    chip.classList.toggle('on', !!(c.user && !c.user.guest && !c.isDev && c.mode !== 'offline'));
    chip.classList.toggle('guest', !!(c.user && c.user.guest));
  }

  showAccount(on) {
    $('ov-account').classList.toggle('hidden', !on);
    this._overlayTitle(on);
    if (on) { this._msg(''); $('acct-confirm').classList.add('hidden'); $('nick').value = this.game.meta.nick || ''; this._renderAccount(); }
    else { this._showBest(); this._renderChars(); this._renderChip(); }
  }

  _renderAccount() {
    const c = this.cloud, u = c && c.user;
    $('acct-demo').classList.toggle('hidden', !(c && c.isDemo));
    const st = $('acct-status');
    if (!c || c.mode === 'offline') st.innerHTML = 'Sem conexão com o servidor. Seu progresso está salvo <b>neste aparelho</b> e sobe para a nuvem quando a conexão voltar.';
    else if (!u) st.textContent = 'Conectando…';
    else if (u.guest) st.innerHTML = 'Você está jogando como <b>convidado</b>. O progresso já vai para a nuvem, mas só volta neste aparelho. <b>Crie uma conta</b> para recuperar tudo se trocar de celular.';
    else st.innerHTML = `Conectado com <b>${u.provider === 'google' ? 'Google' : 'e-mail'}</b>${u.email ? ` · ${u.email}` : ''}.<br>Seu progresso e recordes estão salvos na nuvem.`;
    const guest = !u || u.guest;
    $('acct-guest').classList.toggle('hidden', !guest || !c || c.mode === 'offline');
    $('acct-user').classList.toggle('hidden', guest);
    if (document.activeElement !== $('nick')) $('nick').value = this.game.meta.nick || '';
  }

  showRanking(on) {
    $('ov-ranking').classList.toggle('hidden', !on);
    this._overlayTitle(on);
    if (on) this._renderRanking(); else this._showBest();
  }

  async _renderRanking() {
    const list = $('rank-list'), me = $('rank-me'), c = this.cloud;
    $('rank-demo').classList.toggle('hidden', !(c && c.isDemo));
    if (!c || !c.ready) { list.innerHTML = '<div class="rk-empty">Ranking indisponível sem conexão.</div>'; me.textContent = ''; return; }
    list.innerHTML = '<div class="rk-empty">Carregando…</div>';
    try {
      const r = await c.leaderboard(50);
      const ic = { gato: '🐱', guaxinim: '🦝', pug: '🐶' };
      const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
      list.innerHTML = r.list.length ? r.list.map((e, i) =>
        `<div class="rk${e.uid === r.me ? ' me' : ''}"><span class="p">${i + 1}º</span><span>${ic[e.char] || '🐾'}</span><span class="n">${esc(e.nick || '???')}</span><span class="t">${fmtTime(e.best)}</span></div>`).join('')
        : '<div class="rk-empty">Ninguém no ranking ainda. Seja o primeiro!</div>';
      me.innerHTML = r.best > 0 ? `Você (<b>${esc(this.game.meta.nick)}</b>): <b>${r.rank}º</b> lugar · recorde ${fmtTime(r.best)}` : 'Jogue uma partida para entrar no ranking.';
      const mine = list.querySelector('.me');
      if (mine) mine.scrollIntoView({ block: 'center' });
    } catch (e) {
      console.warn(e);
      list.innerHTML = `<div class="rk-empty">${errorText(e)}</div>`;
    }
  }

  // Progresso trocado (login em outra conta ou save mais novo vindo da nuvem)
  refreshMeta() {
    this._renderChars(); this._showBest(); this._renderChip();
    if (!this.el.hideout.classList.contains('hidden')) this._renderHideout();
  }

  onScoreSent(r) {
    if (this.game.lastResult !== r) return;
    $('over-rank').textContent = r.ranked ? '🏆 Novo recorde enviado ao ranking global!' : '';
  }

  // ---------------- Missões e check-in ----------------
  _overlayTitle(on) { this.el.title.classList.toggle('hidden', on || this.game.state !== GS.Title); }

  showMissions(on) {
    $('ov-missions').classList.toggle('hidden', !on);
    this._overlayTitle(on);
    if (on) this._renderMissions(); else { this._showBest(); this._renderChars(); }
  }

  _renderMissions() {
    const g = this.game, d = ensureDaily(g.meta), list = $('mission-list');
    list.innerHTML = '';
    d.missions.forEach((m, i) => {
      const done = m.progress >= m.target;
      const row = document.createElement('div');
      row.className = 'ms' + (m.claimed ? ' claimed' : done ? ' done' : '');
      const isTime = m.type === 'survive' || m.type === 'char';
      const prog = isTime ? `${fmtTime(Math.min(m.progress, m.target))} / ${fmtTime(m.target)}` : `${Math.min(m.progress, m.target)} / ${m.target}`;
      row.innerHTML = `<b>${missionText(m)}</b><div class="bar"><i style="width:${Math.min(100, (100 * m.progress) / m.target)}%"></i></div><small>${prog}</small>`;
      const btn = document.createElement('button');
      btn.className = 'buy';
      btn.textContent = m.claimed ? '✓' : `◆ ${m.reward}`;
      btn.disabled = m.claimed || !done;
      btn.addEventListener('click', () => { const r = g.claimMission(i); if (r) { this._coinFly(r); this._renderMissions(); } });
      row.appendChild(btn);
      list.appendChild(row);
    });
    const now = new Date(), mid = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const left = Math.max(0, Math.floor((mid - now) / 60000));
    $('mission-reset').textContent = `Novas missões em ${Math.floor(left / 60)}h ${String(left % 60).padStart(2, '0')}min · ◆ ${g.meta.cyberCoins} Cyber-Moedas`;
  }

  showCheckin(on) {
    $('ov-checkin').classList.toggle('hidden', !on);
    this._overlayTitle(on);
    if (on) this._renderCheckin(); else { this._showBest(); this._renderChars(); }
  }

  _renderCheckin() {
    const st = checkinState(this.game.meta), days = $('days');
    const current = st.day;                                      // dia de hoje (já resgatado ou a resgatar)
    days.innerHTML = CHECKIN_REWARDS.map((r, i) => {
      const n = i + 1;
      const got = n < current || (n === current && st.claimedToday);
      const now = n === current && st.canClaim;
      return `<div class="day${got ? ' got' : ''}${now ? ' now' : ''}${n === 7 ? ' big' : ''}">DIA ${n}<b>◆ ${r}</b></div>`;
    }).join('');
    const b = $('btn-checkin');
    b.disabled = !st.canClaim;
    b.classList.toggle('pulse', st.canClaim);
    b.textContent = st.canClaim ? `◆ Resgatar ${CHECKIN_REWARDS[current - 1]}` : 'Volte amanhã ✓';
  }

  _coinFly(n) {
    const d = document.createElement('div');
    d.className = 'coinfly';
    d.textContent = `+◆ ${n}`;
    document.getElementById('app').appendChild(d);
    setTimeout(() => d.remove(), 1200);
  }

  // ---------------- Personagens ----------------
  // Tela inicial: só um botão com o personagem atual. A escolha fica na tela "Escolher personagem".
  _renderChars() {
    const g = this.game, ch = CHARS[g.meta.selected] || CHARS.gato;
    $('chip-name').textContent = ch.name;
    $('chip-trait').textContent = ch.trait;
    this.el.chip.style.setProperty('--cc', ch.color);
    const c = $('chip-cv');
    c.dataset.anim = 'menu.' + ch.id;
    this.el.thumbs = [c];
  }

  _initCharSelect() {
    this.el.chip.addEventListener('click', () => { this.game.audio.sfx('select'); this.showChars(true); });
    $('cs-back').addEventListener('click', () => this.showChars(false));
    $('cs-prev').addEventListener('click', () => this._csGo(-1));
    $('cs-next').addEventListener('click', () => this._csGo(1));
    $('cs-action').addEventListener('click', () => this._csAction());
    // Deslizar o dedo no palco troca de personagem
    const st = $('cs-stage');
    let x0 = null;
    st.addEventListener('pointerdown', (e) => { if (e.target === st || e.target === this.el.csBig) x0 = e.clientX; });
    st.addEventListener('pointerup', (e) => {
      if (x0 === null) return;
      const dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 40) this._csGo(dx < 0 ? 1 : -1);
    });
    st.addEventListener('pointercancel', () => { x0 = null; });
    // Fileira com todos os personagens
    const strip = $('cs-strip');
    this._pips = ROSTER.map((id, i) => {
      const b = document.createElement('button');
      b.className = 'cs-pip';
      b.style.setProperty('--pc', charInfo(id).color);
      b.innerHTML = '<canvas width="96" height="96"></canvas>';
      b.addEventListener('click', () => { if (i !== this._cs) this._csGo(i - this._cs); });
      strip.appendChild(b);
      return b;
    });
  }

  showChars(on) {
    this.el.chars.classList.toggle('hidden', !on);
    this.el.title.classList.toggle('hidden', on || this.game.state !== GS.Title);
    if (on) {
      this._cs = Math.max(0, ROSTER.indexOf(this.game.meta.selected));
      this._slide = 0;
      this._csRender(0);
    } else { this._renderChars(); this._showBest(); }
  }

  _csGo(d) {
    this._cs = (this._cs + d + ROSTER.length) % ROSTER.length;
    this.game.audio.sfx('select');
    this._csRender(d);
  }

  _csWallet() { const m = this.game.meta; $('cs-wallet').innerHTML = `◆ <b>${m.cyberCoins}</b> &nbsp;⚙ <b>${m.scrap}</b>`; }

  _csState(id) {
    const m = this.game.meta;
    if (!CHARS[id]) return 'soon';
    if (!m.chars.includes(id)) return 'lock';
    return m.selected === id ? 'sel' : 'own';
  }

  _csRender(dir) {
    const m = this.game.meta, id = ROSTER[this._cs], ch = charInfo(id), st = this._csState(id);
    this.el.chars.style.setProperty('--cc', ch.color);
    this._csWallet();
    $('cs-name').textContent = ch.name;
    $('cs-trait').textContent = ch.trait;
    const tag = $('cs-tag');
    tag.className = 'cs-tag ' + st;
    tag.textContent = st === 'soon' ? 'EM BREVE' : st === 'lock' ? '🔒 BLOQUEADO' : st === 'sel' ? '✓ EM USO' : '';
    tag.classList.toggle('hidden', st === 'own');
    if (ch.soon) {
      $('cs-melee').textContent = '';
      $('cs-stats').innerHTML = `<div class="cs-teaser" style="grid-column: 1 / -1">${ch.teaser}<small>ARTE PRONTA · JOGABILIDADE EM DESENVOLVIMENTO</small></div>`;
    } else {
      $('cs-melee').textContent = `${ch.melee.icon} Ataque: ${ch.melee.name}`;
      const P = ch.player || {};
      const rows = [
        ['VIDA', ch.hpMult / 1.4], ['DANO', ch.melee.dmg / 1.4], ['ALCANCE', ch.melee.range / 1.2],
        ['VELOCIDADE', (P.maxRunSpeed || 225) / 240], ['ÍMÃ', ch.magnetMult / 1.4],
      ];
      $('cs-stats').innerHTML = rows.map(([k, v]) => `<span>${k}</span><div class="bar"><i style="--w:${Math.round(Math.min(1, v) * 100)}%"></i></div>`).join('');
    }
    this._csWeapon(ch, st);
    this._csLevel(ch, st);
    const a = $('cs-action');
    a.disabled = st === 'soon';
    a.classList.toggle('pulse', st === 'own');
    a.textContent = st === 'soon' ? 'EM BREVE' : st === 'lock' ? `◆ ${ch.price} · DESBLOQUEAR` : st === 'sel' ? '▶ JOGAR' : 'SELECIONAR';
    this._pips.forEach((b, i) => {
      const s2 = this._csState(ROSTER[i]);
      b.className = 'cs-pip' + (i === this._cs ? ' cur' : '') + (s2 === 'sel' ? ' sel' : '') + (s2 === 'lock' ? ' lock' : '');
    });
    if (dir) {
      this._slide = Math.sign(dir);                 // o palco desliza do lugar antigo até o centro
      const info = $('cs-info');
      info.classList.remove('pop'); void info.offsetWidth; info.classList.add('pop');
    }
  }

  // Nível permanente do personagem + botão da árvore de talentos
  _csLevel(ch, st) {
    const box = $('cs-level');
    box.classList.toggle('hidden', !!ch.soon);
    if (ch.soon) return;
    const m = this.game.meta, L = charLevel((m.cxp || {})[ch.id]), pts = pointsLeft(m, ch.id);
    const w = L.need ? Math.round((100 * L.into) / L.need) : 100;
    box.innerHTML = `<span class="lv">NV ${L.lvl}</span><span class="xb"><i style="--w:${w}%"></i></span>`;
    const b = document.createElement('button');
    b.className = pts > 0 && st !== 'lock' ? 'has' : '';
    b.textContent = st === 'lock' ? '★ TALENTOS 🔒' : pts > 0 ? `★ TALENTOS (${pts})` : '★ TALENTOS';
    b.disabled = st === 'lock';
    b.addEventListener('click', () => this.showTalents(ch.id));
    box.appendChild(b);
  }

  showTalents(id) {
    const ov = $('ov-talents');
    if (!id) { ov.classList.add('hidden'); this._csRender(0); return; }
    this._tlId = id;
    ov.classList.remove('hidden');
    this._renderTalents();
  }

  _renderTalents(pop) {
    const g = this.game, m = g.meta, id = this._tlId, ch = CHARS[id], tal = talentsOf(m, id), L = charLevel((m.cxp || {})[id]);
    $('tl-title').textContent = `TALENTOS · ${ch.name}`;
    $('tl-pts').textContent = `${pointsLeft(m, id)} ponto(s)`;
    $('tl-sub').textContent = `Nível ${L.lvl}${L.need ? ` · ${L.into}/${L.need} XP para o próximo` : ' (máximo)'}. Cada nível dá 1 ponto. Toque num talento para gastar. O XP vem de toda partida com este personagem.`;
    $('tl-tree').innerHTML = BRANCHES.map((B) => `<div class="tl-col" style="--bc:${B.color}"><h4>${B.name}<small>${spentIn(tal, B.id)} pontos</small></h4>${
      TALENTS.filter((t) => t.b === B.id).map((t) => {
        const r = tal[t.id] || 0, locked = t.req && spentIn(tal, t.b) < t.req;
        const cls = (r >= t.max ? ' full' : canLearn(m, id, t.id) ? ' can' : '') + (locked ? ' lock' : '') + (pop === t.id ? ' pop' : '');
        return `<button class="tl${cls}" data-t="${t.id}" ${locked ? `data-req="🔒${t.req}"` : ''}><span class="ic">${t.icon}</span><b>${t.name}</b><i>${t.desc(Math.max(1, r))}</i><span class="rk">${Array.from({ length: t.max }, (_, k) => `<span class="${k < r ? 'on' : ''}"></span>`).join('')}</span></button>`;
      }).join('')}</div>`).join('');
    $('tl-tree').querySelectorAll('.tl').forEach((b) => b.addEventListener('click', () => {
      const tid = b.dataset.t;
      if (!g.learnTalent(id, tid)) { const t = TALENTS.find((x) => x.id === tid); this._toast(t.req && spentIn(tal, t.b) < t.req ? `Gaste ${t.req} pontos neste ramo para liberar` : pointsLeft(m, id) <= 0 ? 'Sem pontos: jogue para subir de nível' : 'Talento no máximo'); return; }
      this._renderTalents(tid);
    }));
  }

  // Arma exclusiva do personagem: nível 0–5, comprada com Sucata (só depois de ter o personagem)
  _csWeapon(ch, st, bought) {
    const box = $('cs-weapon'), D = ch.weapon && WEAPONS[ch.weapon];
    box.classList.toggle('hidden', !D);
    if (!D) return;
    const m = this.game.meta, lvl = (m.weapons || {})[ch.weapon] || 0, cost = WEAPONS.costs[lvl];
    box.style.setProperty('--wc', D.color);
    box.className = 'cs-weapon' + (bought ? ' bought' : '');
    const pips = Array.from({ length: WEAPONS.costs.length }, (_, i) => `<span class="${i < lvl ? 'on' : ''}"></span>`).join('');
    const info = lvl >= 4 ? D.max5 : D.desc;
    box.innerHTML = `<span class="wi">${D.icon}</span><span class="wt"><small>ARMA EXCLUSIVA${lvl ? ` · NV ${lvl}` : ''}</small><b>${D.name}</b><i>${info}</i><span class="pips">${pips}</span></span>`;
    const b = document.createElement('button');
    b.className = 'wb';
    b.textContent = cost === undefined ? 'MÁX' : st === 'lock' ? '🔒' : `${lvl ? '▲' : 'COMPRAR'} ⚙ ${cost}`;
    b.disabled = cost === undefined || st === 'lock' || m.scrap < cost;
    b.addEventListener('click', () => {
      if (this.game.buyWeapon(ch.weapon)) { this._toast(`${D.name} nível ${lvl + 1}!`); this._csWeapon(ch, st, true); this._csWallet(); }
    });
    box.appendChild(b);
    if (st !== 'lock' && cost !== undefined && m.scrap < cost) b.title = `Faltam ⚙ ${cost - m.scrap}`;
  }

  _csAction() {
    const g = this.game, m = g.meta, id = ROSTER[this._cs], ch = CHARS[id], st = this._csState(id);
    if (st === 'soon') return;
    if (st === 'sel') { this.showChars(false); return this.h.start({ mode: 'journey', map: m.jMax || 0 }); }
    if (st === 'own') { g.selectChar(id); g.audio.sfx('select'); }
    else if (g.unlockChar(id)) this._toast(`${ch.name} desbloqueado!`);
    else {
      const a = $('cs-action');
      a.classList.add('nope');
      this._toast(`Faltam ◆ ${ch.price - m.cyberCoins} Cyber-Moedas (missões e check-in diário)`);
      setTimeout(() => a.classList.remove('nope'), 400);
      return;
    }
    this._csRender(0);
  }

  _toast(msg) {
    const t = !$('ov-feedback').classList.contains('hidden') || !$('ov-opts').classList.contains('hidden') ? $('fb-toast') : !$('ov-talents').classList.contains('hidden') ? $('tl-toast') : this.el.chars.classList.contains('hidden') ? this.el.toast : $('cs-toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.add('hidden'), 2400);
  }

  // ---------------- Esconderijo ----------------
  showHideout(on) {
    this.el.hideout.classList.toggle('hidden', !on);
    this.el.title.classList.toggle('hidden', on || this.game.state !== GS.Title);
    if (on) this._renderHideout();
    else this._showBest();
  }

  _renderHideout(boughtKey) {
    const g = this.game, m = g.meta;
    this.el.walletScrap.textContent = m.scrap;
    this.el.upgrades.innerHTML = '';
    for (const u of UPGRADES) {
      const lvl = m.upgrades[u.key] || 0;
      const cost = upgradeCost(lvl);
      const row = document.createElement('div');
      row.className = 'up' + (boughtKey === u.key ? ' bought' : '');
      row.style.setProperty('--c', u.color);
      const pips = Array.from({ length: MAX_UPGRADE }, (_, i) => `<span class="${i < lvl ? 'on' : ''}"></span>`).join('');
      const now = lvl ? u.effect(lvl) : 'sem bônus';
      const next = cost === null ? '' : ` → <i>${u.effect(lvl + 1)}</i>`;
      row.innerHTML = `<span class="ic">${u.icon}</span><span><b>${u.name}</b><span class="ef">${now}${next}</span><div class="pips">${pips}</div></span>`;
      const btn = document.createElement('button');
      btn.className = 'buy' + (cost === null ? ' max' : '');
      btn.textContent = cost === null ? 'MÁX' : `⚙ ${cost}`;
      btn.disabled = cost === null || m.scrap < cost;
      btn.addEventListener('click', () => { if (g.buyUpgrade(u.key)) this._renderHideout(u.key); });
      row.appendChild(btn);
      this.el.upgrades.appendChild(row);
    }
  }

  showBiome(b, small = 'ENTRANDO EM', warn = false) {
    const e = this.el;
    e.banner.querySelector('small').textContent = small;
    e.banner.classList.toggle('warn', warn);
    e.bannerName.textContent = b.name;
    e.banner.style.setProperty('--bc', b.color);
    e.banner.classList.remove('hidden');
    e.banner.style.animation = 'none';
    void e.banner.offsetWidth;                 // reinicia a animação
    e.banner.style.animation = '';
    clearTimeout(this._bannerT);
    this._bannerT = setTimeout(() => e.banner.classList.add('hidden'), 2700);
  }

  adFailed() {
    const e = this.el;
    e.ad.disabled = true;
    e.ad.textContent = 'Anúncio indisponível agora';
    setTimeout(() => { e.ad.textContent = '▶ Assistir anúncio'; e.ad.disabled = false; }, 2500);
  }

  // Botão "voltar" do Android: fecha painéis; na tela inicial sai do app; durante a partida não faz nada
  _showPause() {
    const g = this.game, q = $('btn-quit');
    q.classList.remove('confirm'); q.textContent = 'Encerrar partida';
    $('pause-time').textContent = `⏱ ${fmtTime(Math.floor(g.runTime))}`;
    $('pause-sector').textContent = g.sectorInfo ? `S${g.sectorInfo.num} · ${g.sectorInfo.biome.name}` : '';
    $('pause-kills').textContent = `☠ ${g.kills}`;
    this._refreshOpts();
  }

  // Início de fase: contagem 3-2-1 → "VAI!" com o jogo parado enquanto carrega (tela escura no começo, depois um véu)
  _stageFade() {
    const g = this.game, el = $('stage-fade'), t = g.introT;
    if (!(t > -0.45)) { if (!el.classList.contains('hidden')) el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    // escuro no começo (carregando), depois clareia até um véu leve para o jogador ver a fase durante a contagem
    const e = (g.introMax || 1) - t, D = RUN.introDark;
    const a = t <= 0 ? 0 : e < D ? 1 : Math.max(0.3, 1 - ((e - D) / 0.7) * 0.7);
    el.style.background = `rgba(5,3,15,${a.toFixed(3)})`;
    const b = $('stage-go');
    const txt = t <= 0 ? 'VAI!' : g.introHold ? 'CARREGANDO…' : String(Math.ceil(t));
    if (txt !== b.textContent) {
      b.textContent = txt;
      b.className = t <= 0 ? 'go' : g.introHold ? '' : 'num';
      b.style.animation = 'none'; void b.offsetWidth; b.style.animation = '';   // reinicia o "pop" a cada número
    }
    b.style.opacity = t > 0 ? 1 : Math.max(0, 1 + t / 0.45).toFixed(2);
    if (t <= 0 && g.introT > -1) g.introT -= 1 / 60;   // contagem do "VAI!" sumindo (o jogo já está rodando)
  }

  // ---------------- Tutorial da 1ª partida ----------------
  // Dicas curtas no topo, uma de cada vez; cada uma termina quando o jogador faz a ação (ou depois de um tempo).
  _tutorial() {
    const g = this.game, p = g.player, T = this._tut || (this._tut = { i: -1, t: 0, x0: 0 });
    if (g.meta.tutDone) { if (T.i >= 0) this._tutEnd(); return; }
    const touch = matchMedia('(pointer: coarse)').matches;
    const STEPS = [
      { txt: touch ? '◀ ▶  Ande com os botões da esquerda' : '◀ ▶  Ande com A/D ou as setas', btn: ['btn-left', 'btn-right'], done: () => Math.abs(p.x - T.x0) > 140 },
      { txt: 'Toque PULO. No ar, toque de novo: pulo duplo!', btn: ['btn-jump'], done: () => p.airJumpT < 0.3 },
      { txt: 'DASH: avanço rápido que atravessa inimigos sem levar dano', btn: ['btn-dash'], done: () => p.isDashing },
      { txt: g.settings.auto ? 'O ataque é automático perto dos inimigos (dá para mudar em ⚙ Opções)' : 'Segure ATAQUE para golpear. Prefere automático? Ligue em ⚙ Opções', btn: g.settings.auto ? [] : ['btn-attack'], done: () => T.t > 5 },
      { txt: 'Pegue as G Batty ⚡ que os inimigos soltam para subir de nível e escolher skills', btn: [], done: () => g.level > 1 || T.t > 7 },
      { txt: 'Cumpra o objetivo da fase (barra no topo) e entre no portal. Boa sorte!', btn: [], done: () => T.t > 5 },
    ];
    if (T.i < 0) { T.i = 0; T.t = 0; T.x0 = p.x; this._tutShow(STEPS); }
    T.t += 1 / 60;
    if (STEPS[T.i].done() && T.t > 1.2) {
      T.i++; T.t = 0; T.x0 = p.x;
      if (T.i >= STEPS.length) { g.meta.tutDone = true; saveMeta(g); this._tutEnd(); return; }
      this.game.audio.sfx('select');
      this._tutShow(STEPS);
    }
  }

  _tutShow(STEPS) {
    const T = this._tut, st = STEPS[T.i], el = $('tut');
    $('tut-text').textContent = st.txt;
    $('tut-step').textContent = `DICA ${T.i + 1}/${STEPS.length}`;
    el.classList.remove('hidden'); el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    document.querySelectorAll('.tbtn.tut-on').forEach((b) => b.classList.remove('tut-on'));
    for (const id of st.btn) $(id).classList.add('tut-on');
  }

  _tutEnd() {
    $('tut').classList.add('hidden');
    document.querySelectorAll('.tbtn.tut-on').forEach((b) => b.classList.remove('tut-on'));
    if (this._tut) this._tut.i = -1;
  }

  // ---------------- Feedback dos testadores ----------------
  // Nota, assuntos e texto livre + diagnóstico (versão, aparelho, desempenho, progresso). Envia pelo WhatsApp
  // ou e-mail do próprio testador (ele escolhe o contato); nada é enviado sozinho.
  showFeedback(on) {
    $('ov-feedback').classList.toggle('hidden', !on);
    if (!on) return;
    this._fb = this._fb || { stars: 0, tags: new Set() };
    const st = $('fb-stars'), tg = $('fb-tags');
    st.innerHTML = [1, 2, 3, 4, 5].map((n) => `<button data-n="${n}" class="${n <= this._fb.stars ? 'on' : ''}">★</button>`).join('');
    st.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { this._fb.stars = Number(b.dataset.n); this.showFeedback(true); }));
    const TAGS = ['Diversão', 'Controles', 'Dificuldade', 'Desempenho', 'Bug', 'Visual', 'Música', 'Menus'];
    tg.innerHTML = TAGS.map((t) => `<button class="${this._fb.tags.has(t) ? 'on' : ''}">${t}</button>`).join('');
    tg.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { const t = b.textContent; this._fb.tags.has(t) ? this._fb.tags.delete(t) : this._fb.tags.add(t); b.classList.toggle('on'); }));
    $('fb-diag').textContent = this._diag();
  }

  _diag() {
    const g = this.game, m = g.meta, f = window.__fps || {}, r = g.lastResult;
    const ua = navigator.userAgent.match(/Android [\d.]+; ([^;)]+)/);
    return `Neko G v${VERSION} · ${ua ? ua[1].trim() : navigator.platform} · tela ${screen.width}x${screen.height} @${(window.devicePixelRatio || 1).toFixed(2)}\n` +
      `${f.fps || '?'} fps / ${f.hz || '?'} Hz · res ${f.res || 2}x · personagem ${g.char ? g.char.name : m.selected} · mapa ${(m.jMax || 0) + 1} · partidas ${m.runs}` +
      (r ? `\núltima: ${r.mode === 'journey' ? `mapa ${r.map}${r.victory ? ' vencido' : ''}` : `setor ${r.sector}`} · ${Math.round(r.time)} s · ${r.kills} abates` : '');
  }

  _sendFeedback(how) {
    const fb = this._fb || { stars: 0, tags: new Set() };
    const txt = `💬 Feedback Neko G\nNota: ${'★'.repeat(fb.stars) || '-'}\nAssuntos: ${[...fb.tags].join(', ') || '-'}\n\n${$('fb-text').value.trim() || '(sem texto)'}\n\n— ${this._diag()}`;
    if (how === 'copy') {
      (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => this._toast('Texto copiado!'), () => this._toast('Não deu para copiar'));
      return;
    }
    const url = how === 'wa' ? `https://wa.me/?text=${encodeURIComponent(txt)}` : `mailto:?subject=${encodeURIComponent(`Feedback Neko G v${VERSION}`)}&body=${encodeURIComponent(txt)}`;
    if (how === 'wa') window.open(url, '_blank'); else location.href = url;
  }

  showOpts(on) {
    $('ov-opts').classList.toggle('hidden', !on);
    if (on) this._refreshOpts();
  }

  // Botões na tela: tamanho, transparência, canhoto e sem botão ATAQUE no ataque automático
  _applyControls() {
    const S = this.game.settings, c = this.el.controls;
    c.style.setProperty('--cs', S.size); c.style.setProperty('--co', S.alpha);
    c.classList.toggle('auto', !!S.auto); c.classList.toggle('lefty', !!S.lefty);
  }

  _refreshOpts() {
    const g = this.game, S = g.settings;
    $('fps-meter').classList.toggle('hidden', !S.perf && !g.showFps);
    for (const [id, on] of [['opt-sound', !g.audio.muted], ['opt-shake', S.shake], ['opt-numbers', S.numbers], ['opt-perf', !!S.perf],
      ['opt-auto', !!S.auto], ['opt-vib', !!S.vib], ['opt-lefty', !!S.lefty]]) {
      const b = $(id); b.classList.toggle('on', on); b.querySelector('b').textContent = on ? 'LIGADO' : 'DESLIGADO';
    }
    const lab = (L, v) => (L.find((x) => x[0] === v) || L[1] || L[0])[1];
    $('opt-size').querySelector('b').textContent = lab(SIZES, S.size);
    $('opt-alpha').querySelector('b').textContent = lab(ALPHAS, S.alpha);
    $('opt-tut').querySelector('b').textContent = g.meta.tutDone ? 'VISTO' : 'NA PRÓXIMA';
    this._applyControls();
  }

  back(exit) {
    const open = ['ov-checkin', 'ov-missions', 'ov-hideout', 'ov-account', 'ov-ranking', 'ov-dev'].find((id) => !$(id).classList.contains('hidden'));
    if (!$('ov-maps').classList.contains('hidden')) return this.showMaps(false);
    if (!$('ov-notif').classList.contains('hidden')) return this.showNotif(false);
    if (!$('ov-opts').classList.contains('hidden')) return this.showOpts(false);
    if (!$('ov-feedback').classList.contains('hidden')) return this.showFeedback(false);
    if (!$('ov-talents').classList.contains('hidden')) return this.showTalents(null);
    if (!this.el.chars.classList.contains('hidden')) return this.showChars(false);
    if (open === 'ov-dev') return this.showDev(false);
    if (open === 'ov-account') return this.showAccount(false);
    if (open === 'ov-ranking') return this.showRanking(false);
    if (open === 'ov-checkin') return this.showCheckin(false);
    if (open === 'ov-missions') return this.showMissions(false);
    if (open === 'ov-hideout') return this.showHideout(false);
    const st = this.game.state;
    if (st === GS.Title) exit();
    else if (st === GS.GameOver) this.game.toTitle();
    else if (st === GS.Playing) this.game.pause();           // voltar do Android durante a partida = pausa
    else if (st === GS.Paused) this.game.resume();
  }

  showSector(info) {
    const cyc = info.cycle ? ` · CICLO ${info.cycle + 1}` : '';
    this.showBiome({ name: info.biome.name, color: info.biome.color }, `SETOR ${info.num}${cyc}`);
    const bar = $('sector-bar');
    bar.style.setProperty('--sc', info.biome.color);
    $('sector-name').textContent = `S${info.num} · ${info.biome.name}`;
    this._last.sec = null;
  }
  showPortal(next) { if (next.stageLabel !== undefined) return this.showBiome({ name: 'PORTAL ABERTO', color: next.biome.color }, `ENTRE: ${next.stageLabel}`); this.showBiome({ name: 'PORTAL ABERTO', color: next.biome.color }, `ENTRE PARA O SETOR ${next.num}: ${next.biome.name}`); }

  _updateSector() {
    const g = this.game, L = this._last;
    let key, pct, tag, cls = '';
    if (g.mode === 'journey' && g.stageInfo) {         // Jornada: barra = progresso do objetivo da fase
      const st = g.stageInfo;
      if (g.mapDoneT > 0) { key = 'w'; pct = 100; tag = 'MAPA VENCIDO!'; cls = 'portal'; }
      else if (g.stageDone && g.portal) { key = 'p'; pct = 100; tag = 'PORTAL ➜'; cls = 'portal'; }
      else if (st.type === 'boss') { key = g.boss ? 'b' : 'bw'; pct = g.boss ? (100 * g.boss.hp) / g.boss.maxHp : 100; tag = 'CHEFE!'; cls = 'boss'; if (g.boss) key += Math.round(pct); }
      else { const pr = g.stageProgress(); tag = goalText(st, pr); key = tag; pct = 100 * g.stageFrac(); }
    } else if (g.portal) { key = 'p'; pct = 100; tag = 'PORTAL ➜'; cls = 'portal'; }
    else if (g.boss) { key = 'b'; pct = 100; tag = 'CHEFÃO!'; cls = 'boss'; }
    else {
      const left = Math.max(0, Math.ceil(g.sectorBossAt - g.sectorTime));
      key = left; pct = Math.min(100, (100 * g.sectorTime) / g.sectorBossAt);
      tag = `CHEFÃO ${fmtTime(left)}`;
    }
    if (L.sec === key) return;
    L.sec = key;
    $('sector-fill').style.width = `${pct.toFixed(1)}%`;
    $('sector-tag').textContent = tag;
    const bar = $('sector-bar');
    bar.classList.toggle('boss', cls === 'boss'); bar.classList.toggle('portal', cls === 'portal');
  }

  showBossWarning(def) { this.showBiome({ name: def.name, color: def.glow }, '⚠ CHEFÃO SE APROXIMANDO ⚠', true); }
  showBossDown(def, coins = 5) { this.showBiome({ name: 'CHEFÃO DERROTADO!', color: def.glow }, `+◆ ${coins} CYBER-MOEDA${coins === 1 ? '' : 'S'}`); }
  bossPhase(ph) { if (this.game.juice) this.game.juice.glitch(0.3); this.showBiome({ name: `FASE ${ph}`, color: '#ff3b5c' }, 'O CHEFÃO ESTÁ FURIOSO', true); }

  _setMuteIcon(muted) { this.el.mute.textContent = muted ? '🔇' : '♪'; }

  // Mapa da Jornada: caminho que sobe (mapa 1 embaixo), um nó por mapa. Toque num nó = detalhes + jogar.
  showMaps(on) {
    $('ov-maps').classList.toggle('hidden', !on);
    this.el.title.classList.toggle('hidden', on || this.game.state !== GS.Title);
    if (!on) { this._showBest(); return; }
    const meta = this.game.meta, jm = meta.jMax || 0, js = meta.jStars || {};
    if ((meta.seenJ || 0) !== jm) { meta.seenJ = jm; this.game.saveMeta(); }   // aviso "mapa liberado" visto
    const total = jm + 3;                                   // vencidos + próximo + 2 bloqueados (prévia)
    const STEP = 104, PAD = 70, PADB = 120, H = PAD + PADB + STEP * (total - 1);
    const path = $('map-list'), scroll = $('jm-scroll');
    path.style.height = `${H}px`;
    const W = Math.min(420, scroll.clientWidth || 360);
    const pos = (m) => ({ x: W * (0.5 + 0.3 * Math.sin(m * 1.15)), y: H - PADB - m * STEP });
    let svg = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">`;
    for (let m = 0; m < total - 1; m++) {
      const a = pos(m), b = pos(m + 1), done = m < jm, col = journeyMap(m + 1).biome.color;
      const my = (a.y + b.y) / 2;
      svg += `<path d="M${a.x} ${a.y} C${a.x} ${my} ${b.x} ${my} ${b.x} ${b.y}" fill="none" stroke="${done ? col : '#3a3352'}" stroke-width="${done ? 4 : 3}" ${done ? `style="filter: drop-shadow(0 0 4px ${col})"` : 'stroke-dasharray="6 8"'} />`;
    }
    svg += '</svg>';
    let html = svg;
    let starsAll = 0;
    for (let m = 0; m < total; m++) {
      const info = journeyMap(m), p = pos(m), bits = js[m] || 0;
      starsAll += starCount(bits);
      if (m > 0 && m % 13 === 0) html += `<div class="jm-cycle" style="top:${p.y + STEP / 2}px">CICLO ${info.cycle + 1} · MAIS DIFÍCIL</div>`;
      const cls = m < jm ? 'done' : m === jm ? 'next' : 'lock';
      html += `<button class="jm-node ${cls}" data-m="${m}" style="left:${p.x}px; top:${p.y}px; --c:${info.biome.color}">
        <span class="c">${cls === 'lock' ? '🔒' : m + 1}${info.mod && cls !== 'lock' ? `<span class="md">${info.mod.icon}</span>` : ''}</span>
        <span class="nm">${info.biome.name}</span><span class="st">${cls === 'done' ? starText(bits) : cls === 'next' ? '☆☆☆' : ''}</span></button>`;
    }
    path.innerHTML = html;
    $('jm-stars').textContent = `★ ${starsAll}/${jm * 3}`;
    path.querySelectorAll('.jm-node').forEach((b) => b.addEventListener('click', () => this._jmSelect(Number(b.dataset.m))));
    this._jmSelect(jm);
    requestAnimationFrame(() => { scroll.scrollTop = pos(jm).y - scroll.clientHeight * 0.55; });
  }

  _jmSelect(m) {
    const meta = this.game.meta, jm = meta.jMax || 0, info = journeyMap(m), bits = (meta.jStars || {})[m] || 0;
    document.querySelectorAll('.jm-node').forEach((b) => b.classList.toggle('sel', Number(b.dataset.m) === m));
    const card = $('jm-card');
    card.style.setProperty('--c', info.biome.color);
    const boss = info.biome.medium === 'water' ? 'Chefe aquático' : (BOSS_TYPES[BOSS_ORDER[m % BOSS_ORDER.length]] || {}).name || 'Chefe';
    const stages = info.stages.map((st, i) => {
      const T = STAGE_TYPES[st.type];
      const lbl = st.type === 'boss' ? boss : st.type === 'survive' ? `${st.goal}s` : st.type === 'reach' ? `${Math.round(st.goal / 32)} m` : `${st.goal}`;
      return `<span class="${st.type === 'boss' ? 'boss' : ''}">${T.icon}<small>${st.type === 'boss' ? 'CHEFE' : `FASE ${i + 1}`}<br>${lbl}</small></span>`;
    }).join('');
    const replay = m < jm;
    card.innerHTML = `<h3>MAPA ${m + 1} · ${info.biome.name}<small>${replay ? starText(bits) : ''}</small></h3>
      <div class="jm-stages">${stages}</div>
      ${info.mod ? `<div class="jm-mod">${info.mod.icon} <b>${info.mod.name}</b> · ${info.mod.desc}</div>` : '<div class="jm-meta">Sem modificador · mapa de aprendizado</div>'}
      <div class="jm-meta">${replay ? 'Já vencido: mais fácil para você, metade do bônus. Estrelas que faltam ainda dão ◆.' : `Vencer: ⚙ Sucata + ◆ ${JOURNEY.clearCoins} · cada estrela ◆ ${JOURNEY.starCoins}${info.cycle ? ` · ciclo ${info.cycle + 1}` : ''}`}</div>
      <button class="btn primary" id="jm-play">▶ ${replay ? 'JOGAR DE NOVO' : 'JOGAR'}</button>`;
    $('jm-play').addEventListener('click', () => { this.showMaps(false); this.h.start({ mode: 'journey', map: m }); });
  }

  // Início de cada fase da Jornada: anúncio com o objetivo
  showStage(map, s, st, last) {
    let tag = last ? `MAPA ${map.num} · CHEFE` : `MAPA ${map.num} · FASE ${s + 1}/${map.stages.length - 1}`;
    if (s === 0 && this.game.expedition > 1) tag += ` · EXPEDIÇÃO ${this.game.expedition}`;
    this.showBiome({ name: s === 0 ? map.biome.name : (last ? 'CHEFE' : `FASE ${s + 1}`), color: map.biome.color }, s === 0 ? `${tag} · ${goalIntro(st)}` : goalIntro(st));
    if (s === 0 && map.mod) {                           // modificador do mapa: aviso logo depois do nome
      clearTimeout(this._modT);
      this._modT = setTimeout(() => { if (this.game.map === map && this.game.stage === 0) this.showBiome({ name: `${map.mod.icon} ${map.mod.name}`, color: '#ffd84d' }, `MODIFICADOR DO MAPA · ${map.mod.desc}`, true); }, 3200);
    }
    $('sector-bar').style.setProperty('--sc', map.biome.color);
    $('sector-name').textContent = `M${map.num} · ${last ? 'CHEFE' : `${s + 1}/${map.stages.length - 1}`} · ${map.biome.name}`;
    this._last.sec = null;
  }

  _showBest() {
    this._bell();
    const m = this.game.meta;
    const jm = m.jMax || 0;
    $('journey-map').textContent = `Mapa ${jm + 1} · ${journeyMap(jm).biome.name}`;
    $('btn-missions').innerHTML = '◆ MISSÕES' + (hasClaimable(m) ? '<span class="dot"></span>' : '');
    this.el.best.innerHTML = m.runs
      ? `<span>Recorde <b>${fmtTime(m.bestTime)}</b></span><span>⚙ <b>${m.scrap}</b></span><span>◆ <b>${m.cyberCoins}</b></span>`
      : `<span>Sua primeira corrida te espera</span><span>◆ <b>${m.cyberCoins}</b></span>`;
  }

  onState(s) {
    const e = this.el;
    e.title.classList.toggle('hidden', s !== GS.Title);
    if (s !== GS.Title) { e.hideout.classList.add('hidden'); for (const id of ['ov-missions', 'ov-checkin', 'ov-account', 'ov-ranking', 'ov-dev', 'ov-maps']) $(id).classList.add('hidden'); }
    e.levelup.classList.toggle('hidden', s !== GS.LevelUp);
    e.revive.classList.toggle('hidden', s !== GS.Revive);
    e.over.classList.toggle('hidden', s !== GS.GameOver);
    $('ov-pause').classList.toggle('hidden', s !== GS.Paused);
    if (s === GS.Paused) this._showPause();
    e.hud.classList.toggle('hidden', s === GS.Title);
    e.controls.classList.toggle('hidden', s !== GS.Playing);
    if (s === GS.Revive) {
      e.adSim.classList.add('hidden'); e.ad.disabled = false;
      const cost = RUN.reviveCyberCoinCost, have = this.game.meta.cyberCoins;
      e.coins.textContent = `◆ ${cost} Cyber-Moedas (você tem ${have})`;
      e.coins.disabled = have < cost;
    }
    if (s === GS.Title || s === GS.GameOver) { this._tutEnd(); $('stage-fade').classList.add('hidden'); }
    if (s !== GS.Title) { this.el.chars.classList.add('hidden'); $('ov-maps').classList.add('hidden'); $('ov-talents').classList.add('hidden'); $('ov-notif').classList.add('hidden'); if (s !== GS.Paused) $('ov-opts').classList.add('hidden'); }
    if (s === GS.GameOver) { clearTimeout(this._bannerT); clearTimeout(this._modT); e.banner.classList.add('hidden'); this._showOver(); }
    if (s === GS.Title) { this._renderChars(); this._showBest(); this.el.tapMusic.classList.toggle('hidden', !this.game.audio.music.paused); }
    if (s === GS.Playing || s === GS.Start) this._refreshSkills();
  }

  showLevelUp(choices) {
    const e = this.el;
    e.lvTitle.textContent = `NÍVEL ${this.game.level - this.game.pendingLevels + 1}!`;
    e.lvTitle.classList.remove('pop'); void e.lvTitle.offsetWidth; e.lvTitle.classList.add('pop');
    e.cards.innerHTML = '';
    choices.forEach((c) => {
      const b = document.createElement('button');
      b.className = 'card' + (c.kind === 'evo' ? ' evo' : '') + (c.rare ? ' rare' : '');
      b.style.setProperty('--c', c.color);
      b.innerHTML = `<span class="ic">${c.icon}</span><span class="tx"><b>${c.title}</b><i>${c.tag}</i><span>${c.text}</span></span>`;
      if (!c.id) b.classList.add('heal');
      b.addEventListener('click', () => {
        if (performance.now() < this._cardsReadyAt) return;      // evita escolha acidental (dedo ainda na tela)
        if (this._banMode) { if (c.id) { this._setBanMode(false); this.game.banCard(c); } return; }
        this.game.pickCard(c);
        this._refreshSkills();
      });
      e.cards.appendChild(b);
    });
    this._cardsReadyAt = performance.now() + 350;
    this._setBanMode(false);
    const g = this.game;
    $('reroll-n').textContent = g.rerolls; $('ban-n').textContent = g.bans;
    $('btn-reroll').disabled = g.rerolls <= 0; $('btn-ban').disabled = g.bans <= 0;
    if (!this._lvBound) {
      this._lvBound = true;
      $('btn-reroll').addEventListener('click', () => { this._setBanMode(false); this.game.rerollCards(); });
      $('btn-ban').addEventListener('click', () => this._setBanMode(!this._banMode));
    }
  }

  _setBanMode(on) {
    this._banMode = on && this.game.bans > 0;
    this.el.cards.classList.toggle('banmode', this._banMode);
    $('btn-ban').classList.toggle('on', this._banMode);
    $('ban-hint').classList.toggle('hidden', !this._banMode);
  }

  _refreshSkills() {
    const g = this.game, list = g.skills.slots(), W = g.skills.weapon;
    // arma exclusiva primeiro (borda dourada), depois as skills da partida
    this.el.skills.innerHTML = (W ? `<span class="chip wpn" style="--c:${W.def.color}">${W.def.icon}<small>${W.lvl}</small></span>` : '') + list.map((s) =>
      `<span class="chip${s.kind === 'passive' ? ' pas' : ''}${s.evolved ? ' evo' : ''}" style="--c:${s.color}">${s.icon}<small>${s.evolved ? 'EVO' : s.l}</small></span>`).join('');
  }

  // Medidor de desempenho (opção da pausa): FPS, taxa da tela, tempo de lógica/desenho e piores quadros
  _perfMeter() {
    const f = window.__fps, P = window.__perf, g = this.game, el = $('fps-meter');
    const n = Math.max(1, P.wn);
    const txt = `${f.fps} fps / ${f.hz} Hz · res ${f.res || 2}x\n` +
      `quadro ${(P.wsum / n).toFixed(1)} ms (pior ${P.wmax.toFixed(1)}) · lógica ${(P.wstep / n).toFixed(1)} · desenho ${(P.wdraw / n).toFixed(1)}\n` +
      `lentos ${P.wslow}/${n} · inimigos ${g.enemies.count} · itens ${g.pickups.count} · efeitos ${g.fx.effects.filter((e) => e.life > 0).length}`;
    el.textContent = txt;
    el.classList.toggle('bad', f.fps < f.hz * 0.8); el.classList.toggle('warn', f.fps >= f.hz * 0.8 && P.wslow > n * 0.05);
    P.wsum = P.wstep = P.wdraw = P.wmax = 0; P.wn = P.wslow = 0;
  }

  _charXpLine(r) {
    if (!r.charXp) return '';
    return `<div class="lbl over-char">${r.charName} <b>+${r.charXp} XP</b> · NV ${r.charLvl.lvl}${r.charUp ? ` <b class="rec">▲ SUBIU DE NÍVEL! +${r.charUp} ponto${r.charUp > 1 ? 's' : ''} de talento</b>` : ''}</div>`;
  }

  _showOver() {
    const r = this.game.lastResult;
    $('over-title').textContent = r.mode === 'journey' ? (r.victory ? 'MAPA CONCLUÍDO!' : 'MAPA FALHOU') : 'FIM DE JOGO';
    this.el.restart.textContent = r.mode === 'journey' ? (r.victory ? `▶ Seguir para o mapa ${r.map + 1} · mantém Nv ${r.carry}` : '↻ Tentar de novo') : '↻ Jogar de novo';
    if (r.mode === 'journey') {
      const bonus = r.victory ? `<div class="lbl">Bônus do mapa: <b class="rec">+⚙ ${r.bonusScrap}</b>${r.bonusCoins ? ` · <b class="rec">+◆ ${r.bonusCoins}</b>` : ''}${r.replay ? ' · mapa repetido (metade)' : ''}</div>` : '';
      const st = r.victory ? `<div class="over-stars">${[1, 2, 4].map((b, i) => `<span class="${r.stars & b ? 'on' : ''}${r.newStars & b ? ' new' : ''}" style="animation-delay:${0.25 + i * 0.3}s"><i>★</i><small>${['Vencer', 'Sem revive', 'Vida ≥ 50%'][i]}</small></span>`).join('')}</div>${r.starCoins ? `<div class="lbl">Estrelas novas: <b class="rec">+◆ ${r.starCoins}</b></div>` : ''}` : '';
      const mod = (r.mod ? `<div class="lbl">${r.mod.icon} Modificador: <b>${r.mod.name}</b></div>` : '') +
        (r.victory ? `<div class="lbl exp-note">Expedição: siga com nível, skills e vida (+35%). Os inimigos acompanham a sua força.${r.expedition > 1 ? ` <b>${r.expedition} mapas seguidos!</b>` : ''}</div>` : '');
      this.el.overStats.innerHTML = `
      <div class="big" style="text-shadow: 0 0 12px ${r.sectorColor}">MAPA ${r.map}</div>
      <div class="lbl"><b style="color:${r.sectorColor}">${r.sectorName}</b> · ${r.victory ? 'chefe derrotado' : `parou na ${r.stage > r.stages - 1 ? 'luta com o chefe' : `fase ${r.stage}/${r.stages - 1}`}`}</div>
      <div class="grid3"><div><b>${fmtTime(r.time)}</b><span>tempo</span></div><div><b>${r.kills}</b><span>abates</span></div><div><b>${r.scrap}</b><span>Sucata</span></div></div>
      ${st}${bonus}${mod}
      ${this._charXpLine(r)}
      <div class="lbl">Sucata guardada: ${r.totalScrap}</div>`;
      $('over-rank').textContent = '';
      const md = r.missionsDone || [];
      $('over-missions').innerHTML = md.length ? 'MISSÕES CONCLUÍDAS · resgate no menu<br>' + md.map((m) => `✔ ${missionText(m)} · ◆ ${m.reward}`).join('<br>') : '';
      this._showBest();
      return;
    }
    this.el.overStats.innerHTML = `
      <div class="big">${fmtTime(r.time)}</div>
      <div class="lbl">tempo de sobrevivência${r.best ? ' · <b class="rec">NOVO RECORDE!</b>' : ''}</div>
      <div class="grid3"><div><b>${r.kills}</b><span>abates</span></div><div><b>${r.level}</b><span>nível</span></div><div><b>${r.scrap}</b><span>Sucata</span></div></div>
      <div class="lbl">Chegou ao <b style="color:${r.sectorColor}">SETOR ${r.sector}</b> · ${r.sectorName}</div>
      <div class="lbl">Recorde ${fmtTime(r.bestTime)} · Sucata guardada: ${r.totalScrap}</div>
      ${this._charXpLine(r)}`;
    const md = r.missionsDone || [];
    $('over-rank').textContent = this.game.isDev ? 'Conta DEV: partidas ficam fora do ranking' : r.best && r.rankPending ? 'Enviando recorde ao ranking…' : r.ranked ? '🏆 Novo recorde enviado ao ranking global!' : '';
    $('over-missions').innerHTML = md.length ? 'MISSÕES CONCLUÍDAS · resgate no menu<br>' + md.map((m) => `✔ ${missionText(m)} · ◆ ${m.reward}`).join('<br>') : '';
    this._showBest();
  }

  // Chamado todo quadro: só mexe no DOM quando o valor muda
  // Botões de toque: ícone muda conforme o personagem e a situação; anéis de recarga; pontos de pulo no ar
  _setIcon(btn, key, name, label) {
    const s = this._ctl.s;
    if (s[key] === name) return;
    s[key] = name;
    btn.querySelector('.ico').innerHTML = iconSvg(name);
    btn.querySelector('small').textContent = label;
  }

  _setCd(btn, key, frac) {
    const s = this._ctl.s, q = Math.round(frac * 20) / 20;      // 5% de passo: poucas mudanças de estilo
    if (s[key] === q) return;
    const was = s[key];
    s[key] = q;
    btn.classList.toggle('cool', q > 0);
    btn.style.setProperty('--cd', q);
    if (q === 0 && was > 0) { btn.classList.remove('ready'); void btn.offsetWidth; btn.classList.add('ready'); }
  }

  _updateControls() {
    const g = this.game, p = g.player, C = p.C, c = this._ctl, s = c.s, ch = g.char;
    if (!ch) return;
    // Ataque: arma do personagem + recarga das Garras
    this._setIcon(c.atk, 'atk', ch.id, ATTACK_LABEL[ch.id] || 'ATAQUE');
    const ac = ATTACK_COLOR[ch.id] || ch.melee.color;
    if (s.atkColor !== ac) { s.atkColor = ac; c.atk.style.setProperty('--c', ac); }
    const t = g.skills.timers.get('garras') || 0;
    if (t > (s.atkPrev || 0) + 0.01) s.atkMax = t;              // timer reiniciou: novo total
    s.atkPrev = t;
    this._setCd(c.atk, 'atkCd', s.atkMax ? Math.min(1, t / s.atkMax) : 0);
    // Dash: no Pug, no ar, vira Queda pesada
    const slam = !!C.slam && !p.onGround;
    this._setIcon(c.dash, 'dash', slam ? 'slam' : 'dash', slam ? 'QUEDA' : 'DASH');
    if (s.dashAlt !== slam) { s.dashAlt = slam; c.dash.classList.toggle('alt', slam); }
    this._setCd(c.dash, 'dashCd', Math.max(0, Math.min(1, p.dashCd / C.dashCooldown)));
    // Pulo: pontos = pulos no ar restantes; Guaxinim sem pulos no ar → Planar
    const air = !p.onGround;
    const glide = !!C.glide && air && p.airJumps <= 0;
    this._setIcon(c.jump, 'jump', glide ? 'glide' : 'jump', glide ? 'PLANAR' : 'PULO');
    const pipKey = `${C.maxAirJumps}/${p.airJumps}`;
    if (s.pips !== pipKey) {
      s.pips = pipKey;
      let h = '';
      for (let i = 0; i < C.maxAirJumps; i++) h += i < p.airJumps ? '<b></b>' : '<b class="off"></b>';
      c.jump.querySelector('.pips').innerHTML = h;
    }
  }

  update() {
    const g = this.game, e = this.el, L = this._last;
    if (g.state === GS.Title) {
      if (!e.hideout.classList.contains('hidden') && g.renderer) g.renderer.drawCentered(e.coinIc, 'it.coin', performance.now() / 1000);
      e.logo.style.setProperty('--b', g.audio.pulse().toFixed(3));
      const t = performance.now() / 1000;
      if (!g.renderer) return;
      if (!e.chars.classList.contains('hidden')) {
        const R = g.renderer, cv = e.csBig, dpr = Math.min(2, window.devicePixelRatio || 1);
        const cw = Math.round(cv.clientWidth * dpr), ch = Math.round(cv.clientHeight * dpr);
        if (cw && (cv.width !== cw || cv.height !== ch)) { cv.width = cw; cv.height = ch; }
        const now = performance.now(), dt = Math.min(0.05, (now - (this._csT || now)) / 1000);
        this._csT = now;
        if (this._slide) { this._slide *= Math.exp(-dt * 12); if (Math.abs(this._slide) < 0.004) this._slide = 0; }
        if (!this._csItems) this._csItems = ROSTER.map((id) => ({ id, color: charInfo(id).color, dim: null }));
        for (const it of this._csItems) it.dim = this._csState(it.id) === 'soon' ? 'saturate(0.45) brightness(0.7)' : null;
        R.drawCharStage(cv, this._csItems, this._cs, t, this._slide);
        this._pips.forEach((b, i) => {
          const s2 = this._csState(ROSTER[i]);
          R.drawThumb(b.firstChild, 'menu.' + ROSTER[i], i === this._cs ? t : 0, s2 === 'soon' ? 'grayscale(1) brightness(0.35)' : s2 === 'lock' ? 'grayscale(0.7) brightness(0.6)' : false);
        });
      } else e.thumbs.forEach((c, i) => g.renderer.drawThumb(c, c.dataset.anim, t + i * 0.37, !!c.dataset.locked));
      return;
    }
    this._updateControls();
    if (g.state === GS.Playing) { this._stageFade(); if (!(g.introT > 0)) this._tutorial(); }
    if ((g.showFps || g.settings.perf) && window.__fps && (this._fpsT = (this._fpsT || 0) + 1) % 30 === 0) this._perfMeter();
    if (g.sectorInfo) this._updateSector();
    const hp = Math.max(0, Math.ceil(g.hp));
    if (L.hp !== hp || L.maxHp !== g.maxHp) {
      L.hp = hp; L.maxHp = g.maxHp;
      const w = `${(100 * hp) / g.maxHp}%`;
      if (L.hp !== undefined && hp < L.hpPrev) { const h = $('hp'); h.classList.remove('hit'); void h.offsetWidth; h.classList.add('hit'); }
      L.hpPrev = hp;
      e.hpFill.style.width = w; $('hp-lag').style.width = w;
      e.hpText.textContent = `${hp}/${g.maxHp}`;
    }
    const xpPct = Math.floor((100 * g.xp) / g.xpNeed);
    if (L.xp !== xpPct) { L.xp = xpPct; e.xpFill.style.width = `${xpPct}%`; }
    if (L.lvl !== g.level) { L.lvl = g.level; e.lvl.textContent = `Nv ${g.level}`; }
    const t = Math.floor(g.runTime);
    if (L.t !== t) { L.t = t; e.time.textContent = fmtTime(t); }
    if (L.k !== g.kills) { L.k = g.kills; e.kills.textContent = `☠ ${g.kills}`; }
    if (L.s !== g.scrap) { L.s = g.scrap; e.scrap.textContent = `⚙ ${g.scrap}`; }
    const b = g.boss;
    if (L.boss !== b) {
      L.boss = b; L.bhp = undefined;
      $('boss-bar').classList.toggle('hidden', !b);
      if (b) { $('boss-name').textContent = b.def.name; $('boss-bar').style.setProperty('--bc', b.def.glow); }
    }
    if (b) {
      const pct = Math.max(0, Math.round((1000 * b.hp) / b.maxHp)) / 10;
      if (L.bhp !== pct) {
        const now = performance.now();
        if (L.bhp !== undefined && pct < L.bhp && now - (L.bShake || 0) > 260) {   // tremida (no máximo ~4 por segundo)
          L.bShake = now; const bb = $('boss-bar'); bb.classList.remove('shake'); void bb.offsetWidth; bb.classList.add('shake');
        }
        L.bhp = pct; $('boss-fill').style.width = `${pct}%`; $('boss-lag').style.width = `${pct}%`;
      }
    }

    if (g.state === GS.LevelUp && g.renderer) g.renderer.drawCentered(e.badge, 'fx.levelup', performance.now() / 1000);
    if (g.state === GS.Revive) {
      const c = Math.ceil(g.reviveT);
      if (L.c !== c) { L.c = c; e.count.textContent = c; }
      e.ring.style.setProperty('--p', `${(g.reviveT / RUN.reviveCountdown) * 100}%`);
      e.adSim.classList.toggle('hidden', !g.adPlaying);
      e.ad.disabled = g.adPlaying;
      e.decline.disabled = g.adPlaying;
      e.coins.disabled = g.adPlaying || g.meta.cyberCoins < RUN.reviveCyberCoinCost;
      if (g.adPlaying) e.adLeft.textContent = Math.ceil(g.adT);
    }
  }
}
