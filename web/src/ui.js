// Interface em HTML por cima do canvas: HUD, cartas de level up, Segunda Chance, Game Over e tela inicial.

import { GS } from './game.js';
import { RUN } from './config.js';
import { UPGRADES, upgradeCost, MAX_UPGRADE } from './meta.js';
import { CHARS, CHAR_ORDER } from './chars.js';
import { errorText } from './cloud.js';
import { exitApp } from './platform.js';
import { journeyMap, goalText, goalIntro } from './journey.js';
import { iconSvg, ATTACK_LABEL, ATTACK_COLOR } from './controlIcons.js';
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
      thumbs: [], chars: $('chars'), toast: $('toast'),
    };
    this._last = {};
    this._cardsReadyAt = 0;

    $('btn-start').addEventListener('click', () => this.h.start({ mode: 'endless' }));
    $('btn-journey').addEventListener('click', () => this.h.start({ mode: 'journey', map: game.meta.jMax || 0 }));
    $('btn-maps').addEventListener('click', () => this.showMaps(true));
    $('btn-maps-back').addEventListener('click', () => this.showMaps(false));
    this.el.restart.addEventListener('click', () => this.h.start((game.lastResult && game.lastResult.next) || { mode: 'endless' }));
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
    $('opt-sound').addEventListener('click', () => { this._setMuteIcon(game.audio.toggleMute()); this._refreshOpts(); });
    $('opt-shake').addEventListener('click', () => { game.setOption('shake', !game.settings.shake); this._refreshOpts(); });
    $('opt-numbers').addEventListener('click', () => { game.setOption('numbers', !game.settings.numbers); this._refreshOpts(); });
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
    // Primeira abertura do dia: mostra o check-in
    if (checkinState(game.meta).canClaim) setTimeout(() => { if (game.state === GS.Title) this.showCheckin(true); }, 600);
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
    $('fps-meter').classList.toggle('hidden', !(dev && g.showFps));
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
  _renderChars() {
    const g = this.game, m = g.meta;
    this.el.chars.innerHTML = '';
    this.el.thumbs = [];
    for (const id of CHAR_ORDER) {
      const ch = CHARS[id];
      const owned = m.chars.includes(id);
      const card = document.createElement('button');
      card.className = 'pc' + (m.selected === id ? ' sel' : '') + (owned ? '' : ' lock');
      card.innerHTML = `<canvas width="120" height="90"></canvas><b>${ch.name}</b><small>${owned ? ch.trait : `◆ ${ch.price} Cyber-Moedas`}</small>`;
      const c = card.querySelector('canvas');
      c.dataset.anim = ch.prefix + '.idle';
      if (!owned) c.dataset.locked = '1';
      this.el.thumbs.push(c);
      card.addEventListener('click', () => {
        if (owned) { g.selectChar(id); g.audio.sfx('select'); }
        else if (g.unlockChar(id)) this._toast(`${ch.name} desbloqueado!`);
        else {
          card.classList.add('nope');
          this._toast(`Faltam ◆ ${ch.price - m.cyberCoins} Cyber-Moedas (missões e check-in diário)`);
          setTimeout(() => card.classList.remove('nope'), 400);
          return;
        }
        this._renderChars();
        this._showBest();
      });
      this.el.chars.appendChild(card);
    }
  }

  _toast(msg) {
    const t = this.el.toast;
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

  _refreshOpts() {
    const g = this.game;
    for (const [id, on] of [['opt-sound', !g.audio.muted], ['opt-shake', g.settings.shake], ['opt-numbers', g.settings.numbers]]) {
      const b = $(id); b.classList.toggle('on', on); b.querySelector('b').textContent = on ? 'LIGADO' : 'DESLIGADO';
    }
  }

  back(exit) {
    const open = ['ov-checkin', 'ov-missions', 'ov-hideout', 'ov-account', 'ov-ranking', 'ov-dev'].find((id) => !$(id).classList.contains('hidden'));
    if (!$('ov-maps').classList.contains('hidden')) return this.showMaps(false);
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

  // Lista de mapas da Jornada: o próximo (novo) no topo, depois os já vencidos (para repetir)
  showMaps(on) {
    $('ov-maps').classList.toggle('hidden', !on);
    if (!on) return;
    const jm = this.game.meta.jMax || 0, list = $('map-list');
    list.innerHTML = '';
    for (let m = jm; m >= 0; m--) {
      const info = journeyMap(m), b = document.createElement('button');
      b.className = 'map-row' + (m === jm ? ' new' : '');
      b.style.setProperty('--c', info.biome.color);
      const cyc = info.cycle ? ` · ciclo ${info.cycle + 1}` : '';
      b.innerHTML = `<span class="n">${m + 1}</span><span class="nm"><b>${info.biome.name}</b><i>${info.stages.length - 1} fases + chefe${cyc}</i></span><span class="st">${m === jm ? 'NOVO' : '✔ vencido'}</span>`;
      b.addEventListener('click', () => { this.showMaps(false); this.h.start({ mode: 'journey', map: m }); });
      list.appendChild(b);
    }
  }

  // Início de cada fase da Jornada: anúncio com o objetivo
  showStage(map, s, st, last) {
    const tag = last ? `MAPA ${map.num} · CHEFE` : `MAPA ${map.num} · FASE ${s + 1}/${map.stages.length - 1}`;
    this.showBiome({ name: s === 0 ? map.biome.name : (last ? 'CHEFE' : `FASE ${s + 1}`), color: map.biome.color }, s === 0 ? `${tag} · ${goalIntro(st)}` : goalIntro(st));
    $('sector-bar').style.setProperty('--sc', map.biome.color);
    $('sector-name').textContent = `M${map.num} · ${last ? 'CHEFE' : `${s + 1}/${map.stages.length - 1}`} · ${map.biome.name}`;
    this._last.sec = null;
  }

  _showBest() {
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
    if (s === GS.GameOver) { clearTimeout(this._bannerT); e.banner.classList.add('hidden'); this._showOver(); }
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
    const list = this.game.skills.slots();
    this.el.skills.innerHTML = list.map((s) =>
      `<span class="chip${s.kind === 'passive' ? ' pas' : ''}${s.evolved ? ' evo' : ''}" style="--c:${s.color}">${s.icon}<small>${s.evolved ? 'EVO' : s.l}</small></span>`).join('');
  }

  _showOver() {
    const r = this.game.lastResult;
    $('over-title').textContent = r.mode === 'journey' ? (r.victory ? 'MAPA CONCLUÍDO!' : 'MAPA FALHOU') : 'FIM DE JOGO';
    this.el.restart.textContent = r.mode === 'journey' ? (r.victory ? `▶ Próximo mapa (${r.map + 1})` : '↻ Tentar de novo') : '↻ Jogar de novo';
    if (r.mode === 'journey') {
      const bonus = r.victory ? `<div class="lbl">Bônus do mapa: <b class="rec">+⚙ ${r.bonusScrap}</b>${r.bonusCoins ? ` · <b class="rec">+◆ ${r.bonusCoins}</b>` : ''}${r.replay ? ' · mapa repetido (metade)' : ''}</div>` : '';
      this.el.overStats.innerHTML = `
      <div class="big" style="text-shadow: 0 0 12px ${r.sectorColor}">MAPA ${r.map}</div>
      <div class="lbl"><b style="color:${r.sectorColor}">${r.sectorName}</b> · ${r.victory ? 'chefe derrotado' : `parou na ${r.stage > r.stages - 1 ? 'luta com o chefe' : `fase ${r.stage}/${r.stages - 1}`}`}</div>
      <div class="grid3"><div><b>${fmtTime(r.time)}</b><span>tempo</span></div><div><b>${r.kills}</b><span>abates</span></div><div><b>${r.scrap}</b><span>Sucata</span></div></div>
      ${bonus}
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
      <div class="lbl">Recorde ${fmtTime(r.bestTime)} · Sucata guardada: ${r.totalScrap}</div>`;
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
      if (g.renderer) e.thumbs.forEach((c, i) => g.renderer.drawThumb(c, c.dataset.anim, t + i * 0.37, !!c.dataset.locked));
      return;
    }
    this._updateControls();
    if (g.showFps && window.__fps && (this._fpsT = (this._fpsT || 0) + 1) % 30 === 0) {
      const f = window.__fps;
      $('fps-meter').textContent = `${f.fps} fps · tela ${f.hz} Hz · res ${f.res || 2}x · inimigos ${g.enemies.count}`;
    }
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
