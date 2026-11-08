// Gerenciador da partida: máquina de estados (GDD 10.1), vida/i-frames, XP e nível, revive (1 por partida), estatísticas e save.

import { RUN, TILE, xpForLevel, SAVE_KEY, WATER, JOURNEY, WEAPONS } from './config.js';
import { journeyMap, starCount } from './journey.js';
import { talentStats, charLevel, runCharXp, canLearn } from './talents.js';
import { Rng } from './rng.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Enemies, Spawner, setWaterPhysics } from './enemies.js';
import { WaterFx } from './water.js';
import { Juice } from './juice.js';
import { Pickups, PK } from './pickups.js';
import { Skills } from './skills.js';
import { Fx } from './fx.js';
import { Camera } from './camera.js';
import { BIOMES, biomeIndexAt, sectorInfo, setSectorBiome } from './biomes.js';
import { CHUNK_W } from './config.js';
import { UPGRADES, upgradeCost, MAX_UPGRADE, metaStats } from './meta.js';
import { CHARS, CHAR_ORDER } from './chars.js';
import { nativeAds, showRewarded } from './platform.js';
import { applyRun, claimCheckin, claimMission, ensureDaily } from './missions.js';

export const GS = { Title: 'title', Start: 'start', Playing: 'playing', LevelUp: 'levelup', Revive: 'revive', GameOver: 'gameover', Paused: 'paused' };

export class Game {
  constructor({ audio, input, params }) {
    this.audio = audio;
    this.input = input;
    this.params = params;
    this.cfg = RUN;
    this.settings = loadSettings();                 // tremor de tela, números de dano (menu de pausa)
    this.god = params.has('god');           // só para testes automáticos
    this.ui = null;                         // definido pelo main
    this.state = GS.Title;
    this.time = 0;
    this.hitStop = 0;
    this.meta = loadSave();
    this.camera = new Camera();
    this.fx = new Fx(this);
    this.world = new World(1, true);
    this.player = new Player(this.world, input, this.fx);
    this.char = CHARS[this.meta.selected] || CHARS.gato;
    this.player.setCharacter(this.char);
    this.enemies = new Enemies(this);
    this.spawner = new Spawner(this);
    this.pickups = new Pickups(this);
    this.skills = new Skills(this);
    this.waterFx = new WaterFx(); this.water = null;   // setor submerso (Cyber Deep)
    this.juice = new Juice();                          // números de dano, rastros, distorção, glitch (juice.js)
    this.juice.numbersOn = this.settings.numbers;
    this.magnetMult = 1; this.cdMult = 1; this.damageMult = 1; this.enemyDamageMult = 1;
    this.maxHp = RUN.maxHP; this.hp = RUN.maxHP; this.maxHpBase = RUN.maxHP;
  }

  // ---------------- Partida ----------------

  // opts: { mode: 'endless' | 'journey', map: número do mapa (Jornada) }. Testes: ?journey=N
  newRun(opts = {}) {
    const qJ = this.params.has('journey') ? Number(this.params.get('journey')) || 0 : null;
    this.mode = opts.mode || (qJ !== null ? 'journey' : 'endless');
    this.runOpts = { mode: this.mode, map: opts.map ?? qJ ?? 0 };
    this.warps = 0;
    const seed = Number(this.params.get('seed')) || ((Date.now() ^ (Math.random() * 1e9)) >>> 0);
    this.seed = seed >>> 0;
    this.rng = new Rng(this.seed ^ 0x51ed27);
    this.world = new World(this.seed);
    this.player.world = this.world;
    this.char = CHARS[this.meta.selected] || CHARS.gato;
    this.player.setCharacter(this.char);
    this.player.reset(12 * TILE, -2 * TILE);           // centro do chunk inicial, em cima do chão
    this.enemies.reset();
    this.pickups.reset();
    this.fx.reset();
    this.juice.reset();
    this.spawner.reset();
    if (this.params.has('boss')) this.spawner.bossIdx = Number(this.params.get('boss')) || 0;    // testes: ?bossAt=5&boss=2

    // Atributos base globais (Esconderijo) — ainda sem tela de compra; ficam em 1x
    const T = this.tal = talentStats(this.meta, this.char.id);   // talentos do personagem (GDD 3.5c)
    this.maxHpBase = Math.round(RUN.maxHP * this.meta.hpMult * this.char.hpMult * T.hp);
    this.maxHp = this.maxHpBase; this.hp = this.maxHp;
    this.damageMult = this.meta.damageMult * T.damage;
    this.critChance = this.meta.critChance + T.crit; this.critMult = this.meta.critMult > 1 ? this.meta.critMult : 1.7;   // Ataque Crítico (Esconderijo + Precisão)
    this.shield = T.shield; this.regenT = 0;
    this.crits = 0;
    this.enemyDamageMult = 1;
    this.skills.reset(this.char.start);                 // ataque básico do personagem (+ skills iniciais)

    this.runTime = 0; this.kills = 0; this.scrap = 0;
    this.level = 1; this.xp = 0; this.xpNeed = xpForLevel(1); this.pendingLevels = 0;
    this.rerolls = 2 + this.tal.rerolls; this.bans = 1;                  // por partida (o Esconderijo pode aumentar no futuro)
    this.areaMult = 1; this.vampLvl = 0;
    this.hasRevived = false; this.usedRevive = false; this.isDying = false; this.dyingT = 0; this.deathAnim = 0;
    this.batteries = 0; this.elitesKilled = 0; this.mod = {};
    this.map = null; this.stageInfo = null; this.stage = 0;
    this.iframes = 0; this.hurtFlash = 0; this.hitStop = 0;
    this.reviveT = 0; this.adPlaying = false; this.adT = 0;
    this.camera.snap(this.player);
    this.biome = -1;
    this.runStats = { tanks: 0, crates: 0, evos: 0, bosses: 0, biomes: new Set() };
    this.boss = null;
    this.warp = null;
    if (this.mode === 'journey') this._enterMap(this.runOpts.map);
    else {
      const startSector = Number(this.params.get('sector')) || 0;   // testes: ?sector=5
      this.spawner.bossIdx = this.spawner.bossIdx || startSector;
      this._enterSector(startSector);
    }

    this.setState(GS.Start);
    this.iframes = RUN.startInvuln;                     // 3 s de invencibilidade no início
    this.setState(GS.Playing);
  }

  setState(s) {
    this.state = s;
    this.input.enabled = s === GS.Playing;
    if (s === GS.Playing) this.input.clear();           // o toque na carta/botão não vira pulo
    this.audio.setDuck(s === GS.Revive ? 0.3 : s === GS.LevelUp ? 0.55 : s === GS.GameOver ? 0.4 : s === GS.Paused ? 0.3 : 1);
    if (this.ui) this.ui.onState(s);
  }

  get isSimulating() { return this.state === GS.Playing; }

  // Um passo fixo da simulação (só no estado Playing; Level Up, Revive e Game Over = timeScale 0)
  step(dt) {
    this.time += dt;
    this.input.tick(dt);
    if (!this.isDying) { this.runTime += dt; this.sectorTime += dt; }   // tempo de sobrevivência só conta jogando
    if (this.tal && this.tal.regen && !this.isDying && (this.regenT += dt) >= 8) {   // Nanorreparo (talento)
      this.regenT = 0;
      if (this.hp < this.maxHp) { this.healPercent(this.tal.regen); }
    }
    this.iframes -= dt;
    this.hurtFlash -= dt;

    this.player.step(dt);
    if (this.player.isDashing) this.fx.afterimage(this.player);
    this.skills.step(dt);
    if (!this.isDying) this.spawner.step(dt);
    this.enemies.step(dt);
    this.pickups.step(dt);
    this.fx.step(dt);
    if (this.water) this.water.step(dt, this.camera.view);
    this.juice.step(dt);
    this.camera.step(dt, this.player);
    this._sectorStep(dt);
    if (this.mode === 'journey') this._journeyStep(dt);
    const bi = biomeIndexAt(Math.floor(this.player.cx / (TILE * CHUNK_W)));
    if (bi !== this.biome) { this.biome = bi; this.runStats.biomes.add(bi); if (this.ui) this.ui.showBiome(BIOMES[bi]); this.audio.sfx('biome'); }

    if (this.isDying) {
      this.deathAnim += dt;
      this.dyingT -= dt;
      if (this.dyingT <= 0) {
        this.isDying = false;
        if (this.hasRevived) this.gameOver();           // revive já usado → direto ao fim
        else this.openRevive();
      }
    } else if (this.pendingLevels > 0 && !this.warp) {     // não interrompe a transição de setor
      this.openLevelUp();
    }
  }

  // Coisas que correm em tempo real mesmo com o jogo pausado (contador da Segunda Chance, anúncio simulado)
  realtime(dt) {
    this.audio.update();
    if (this.state !== GS.Revive) return;
    if (this.adPlaying) {
      this.adT -= dt;
      if (this.adT <= 0) { this.adPlaying = false; this.revive(true); }
    } else {
      this.reviveT -= dt;
      if (this.reviveT <= 0) { this.reviveT = 0; this.gameOver(); }
    }
  }

  // ---------------- Vida ----------------

  damagePlayer(amount, srcX) {
    const p = this.player;
    if (this.state !== GS.Playing || this.isDying || p.isDead) return false;
    if (this.iframes > 0 || p.dashInvulnerable || this.god || this.devGod) return false;
    if (this.shield > 0) {                              // Escudo de Fase (talento): bloqueia um golpe
      this.shield--; this.iframes = 0.6;
      this.fx.effect('ring', { x: p.cx, y: p.cy, r: 10, maxR: 46, color: '#5ef0ff', life: 0.35 });
      this.audio.sfx('select');
      return false;
    }
    amount *= this.tal ? this.tal.taken : 1;            // Resistência (talento)
    this.hp = Math.max(0, this.hp - Math.round(amount));
    this.fx.playerHurt(p);
    this.juice.glitch(amount >= 12 ? 0.2 : 0.12);
    this.hurtFlash = 0.15;
    this.hitStop = 0.05;
    this.vibe(amount >= 12 ? 60 : 35);
    if (this.hp <= 0) {
      p.die();
      this.isDying = true;
      this.dyingT = RUN.deathSequence;                 // o personagem cai antes da Segunda Chance
      this.deathAnim = 0;
      this.audio.sfx('death');
      return true;
    }
    p.applyHit(srcX);
    this.iframes = RUN.damageIFrames;                   // 0,5 s ignorando novos danos
    return true;
  }

  healPercent(f) {
    if (this.hp <= 0) return;
    this.hp = Math.min(this.maxHp, this.hp + Math.ceil(this.maxHp * f));
  }

  // Pausa de impacto dos golpes comuns: curta e no máximo uma a cada RUN.hitStopGap s.
  // (Antes cada golpe que acertava congelava 25 ms: com ataque contínuo parecia queda de quadros.)
  addHitStop(t) {
    if (this.time - (this._hsAt || -9) < RUN.hitStopGap) return;
    this._hsAt = this.time;
    this.hitStop = Math.max(this.hitStop, t);
  }

  setMaxHpMult(m) {
    const old = this.maxHp;
    this.maxHp = Math.round(this.maxHpBase * m);
    if (this.maxHp > old && this.hp > 0) this.hp += this.maxHp - old;
    this.hp = Math.min(this.hp, this.maxHp);
  }

  // ---------------- Inimigos, XP, moedas ----------------

  onEnemyKilled(e) {
    if (e.def.boss) return this.onBossKilled(e);
    this.kills++;
    if (e.def.tier === 'tank') this.runStats.tanks++;
    if (this.water) this.water.emit(e.cx, e.cy, e.def.tier === 'weak' ? 3 : 6, e.w * 0.4, 1.2);
    if (this.vampLvl && this.time - (this._vampT || 0) >= 0.5) {      // Vampirismo Digital
      this._vampT = this.time;
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.003 * this.vampLvl);
    }
    const d = e.def, M = this.mod;
    const xp = Math.round(d.xp * (1 + 0.25 * (this.runTime / 60)) * (M.xp || 1) * (e.elite ? 3 : 1));   // baterias valem mais com o tempo
    this.pickups.spawn(PK.BATTERY, e.cx, e.cy, xp);                          // 100% soltam bateria
    if (this.rng.chance(d.scrap * (M.scrap || 1))) this.pickups.spawn(PK.SCRAP, e.cx, e.cy, d.tier === 'tank' ? 5 : d.tier === 'medium' ? 2 : 1);
    if (e.elite) {                                                            // elite: mais Sucata, uma cura e destaque
      this.elitesKilled++;
      for (let i = 0; i < JOURNEY.elite.scrap; i++) this.pickups.spawn(PK.SCRAP, e.cx + (i - 1.5) * 8, e.cy, 2);
      this.pickups.spawn(PK.HEALTH, e.cx, e.cy - 6, 0.15);
      this.fx.effect('ring', { x: e.cx, y: e.cy, r: 6, maxR: 80, color: '#ffd84d', life: 0.5 });
      if (this.juice) this.juice.shock(e.cx, e.cy, 70);
      const st = this.stageInfo;
      if (this.ui && st && st.type === 'elite') this.ui.showBiome({ name: 'ELITE DERROTADO!', color: '#ffd84d' }, `★ ${Math.min(st.goal, this.stageProgress())}/${st.goal}`);
    }
    const hd = RUN.healthDrop;
    const hpChance = hd.chance[d.tier] * (this.hp / this.maxHp < hd.lowHp ? hd.lowHpMult : 1);
    if (this.rng.chance(hpChance)) this.pickups.spawn(PK.HEALTH, e.cx, e.cy, hd.heal[d.tier]);
    this.fx.kill(e);
    if (d.tier !== 'weak') this.addHitStop(0.03);
  }

  // ---------------- Setores e portal (GDD 3.1b) ----------------
  // Cada setor é um cenário. Depois de SECTOR_BOSS_AT s aparece o chefão; vencido, abre um portal
  // para o próximo setor (mais difícil). Depois do último setor, recomeça num ciclo mais difícil.
  _enterSector(n) {
    const info = sectorInfo(n);
    this.sector = n; this.sectorInfo = info;
    if (this.tal) this.shield = this.tal.shield;
    setSectorBiome(info.bi);
    this._setWater(info.biome.medium === 'water');
    this.audio.setTrack(info.biome.music || 'main');
    this.sectorTime = 0; this.sectorCleared = false; this.portal = null;
    this.sectorBossAt = this.params.has('bossAt') ? Number(this.params.get('bossAt')) : (n === 0 ? 150 : 140);
    this.sectorMult = 1 + 0.12 * n;                    // vida dos inimigos comuns sobe a cada setor
    this.enemyDamageMult = 1 + 0.04 * n;               // e o dano também, um pouco
    this.biome = info.bi; this.runStats.biomes.add(info.bi);
    if (this.ui) this.ui.showSector(info);
  }

  // ---------------- Jornada (GDD 3.5): mapa = cenário com fases + chefe ----------------
  _enterMap(m) {
    const info = journeyMap(m);
    this.map = info; this.sector = m; this.sectorInfo = info;
    this.mapReplay = m < (this.meta.jMax || 0);
    setSectorBiome(info.bi);
    this._setWater(info.biome.medium === 'water');
    this.audio.setTrack(info.biome.music || 'main');
    this.biome = info.bi; this.runStats.biomes.add(info.bi);
    this.spawner.bossIdx = m;                          // o chefe do mapa segue a ordem dos chefões
    this.mapDoneT = 0;
    this.mod = info.mod || {};                         // modificador do mapa (Enxame, Blindados…)
    this.skills.applyPassives();
    this._enterStage(0);
  }

  _enterStage(s) {
    const st = this.map.stages[s], last = s === this.map.stages.length - 1;
    this.stage = s; this.stageInfo = st;
    this.sectorTime = 0; this.sectorCleared = false; this.portal = null; this.stageDone = false;
    this.stageKills0 = this.kills; this.stageX0 = this.player.cx;
    this.stageBat0 = this.batteries; this.stageElite0 = this.elitesKilled; this.eliteT = JOURNEY.elite.first;
    if (this.tal) this.shield = this.tal.shield;
    const n = this.map.n + s * JOURNEY.stageDiff, M = this.mod;
    this.diffN = n;
    this.sectorMult = (1 + 0.12 * n) * (M.hp || 1);
    this.enemyDamageMult = (1 + 0.04 * n) * (M.dmg || 1);
    this.sectorBossAt = st.type === 'boss' ? JOURNEY.bossDelay : Infinity;
    if (st.type === 'reach') this._placeExit(st.goal);
    if (this.ui) this.ui.showStage(this.map, s, st, last);
  }

  // Quanto do objetivo já foi feito (na unidade do objetivo) e a fração 0..1
  stageProgress() {
    const st = this.stageInfo;
    if (!st) return 0;
    if (st.type === 'survive') return this.sectorTime;
    if (st.type === 'hunt') return this.kills - this.stageKills0;
    if (st.type === 'reach') return this.portal && this.portal.exit ? Math.max(0, st.goal - Math.abs(this.portal.x - this.player.cx)) : st.goal;
    if (st.type === 'elite') return this.elitesKilled - this.stageElite0;
    if (st.type === 'collect') return this.batteries - this.stageBat0;
    return 0;
  }
  stageFrac() { const st = this.stageInfo; return !st || st.type === 'boss' ? 1 : Math.min(1, this.stageProgress() / st.goal); }

  // Saída da fase "chegue à saída": um portal longe, à direita (a seta da borda da tela aponta para ele)
  _placeExit(D) {
    const p = this.player, w = this.world;
    let x = p.cx + D, y = null;
    for (let k = 0; k < 40; k++, x += TILE * 3) { const sp = w.portalSpot(x, -2 * TILE, 2); if (sp) { x = sp.x; y = sp.y; break; } }
    if (y === null) y = -2 * TILE;
    this.portal = { x, y, t: 0, color: this.map.biome.color, next: this._nextStageInfo(), exit: true };
  }

  _nextStageInfo() {
    const s = this.stage + 1, st = this.map.stages[s];
    return { num: this.map.num, biome: this.map.biome, stageLabel: st ? (st.type === 'boss' ? 'CHEFE' : `FASE ${s + 1}`) : '' };
  }

  _journeyStep(dt) {
    const st = this.stageInfo;
    if (this.mapDoneT > 0) { if ((this.mapDoneT -= dt) <= 0) this._journeyWin(); return; }
    if (!st || this.stageDone || st.type === 'boss' || st.type === 'reach') return;
    if (st.type === 'elite' && (this.eliteT -= dt) <= 0) {      // um elite por vez; o próximo vem alguns segundos depois
      this.eliteT = 1;
      let alive = false;
      for (const e of this.enemies.pool) if (e.active && e.elite) { alive = true; break; }
      if (!alive && this.spawner.spawnElite()) this.eliteT = JOURNEY.elite.every;
    }
    if (this.stageProgress() >= st.goal) {
      this.stageDone = true; this.sectorCleared = true;
      if (this.ui) this.ui.showBiome({ name: 'FASE CONCLUÍDA!', color: this.map.biome.color }, 'ENTRE NO PORTAL');
      this.audio.sfx('levelup');
      this._openPortal(this.player.cx + 90 * (this.player.facing || 1));
    }
  }

  // Mapa vencido: bônus de Sucata (e Cyber-Moedas na 1ª vez) e libera o próximo
  _journeyWin() {
    const m = this.map.n, k = this.mapReplay ? JOURNEY.replayMult : 1;
    const bonusScrap = Math.round((JOURNEY.clearScrap.base + JOURNEY.clearScrap.perMap * m) * k);
    // Estrelas: vencer · sem revive · vida alta no fim. Cada estrela nova (1ª vez) dá Cyber-Moedas.
    const stars = 1 | (this.usedRevive ? 0 : 2) | (this.hp / this.maxHp >= JOURNEY.starHp ? 4 : 0);
    const js = this.meta.jStars || (this.meta.jStars = {});
    const old = js[m] || 0, fresh = stars & ~old;
    js[m] = old | stars;
    const starCoins = starCount(fresh) * JOURNEY.starCoins;
    const bonusCoins = (this.mapReplay ? 0 : JOURNEY.clearCoins) + starCoins;
    this.meta.cyberCoins += bonusCoins;
    this.meta.jMax = Math.max(this.meta.jMax || 0, m + 1);
    this.gameOver({ victory: true, bonusScrap, bonusCoins, stars, newStars: fresh, starCoins });
  }

  // Liga/desliga a água: física do jogador, dos inimigos e das baterias, efeito na tela e som abafado
  _setWater(on) {
    this.player.setMedium(on ? 'water' : 'air');
    setWaterPhysics(on);
    this.pickups.water = on;
    this.water = on ? this.waterFx : null;
    this.camera.minTop = on ? WATER.top - 150 : null;   // a superfície fica abaixo do HUD
    if (on) this.waterFx.reset();
    if (this.audio.setUnderwater) this.audio.setUnderwater(on);
  }

  _openPortal(x) {
    const p = this.player, w = this.world;
    let px = x;
    if (Math.abs(px - p.cx) > 260) px = p.cx + Math.sign(px - p.cx) * 160;   // não deixa longe demais
    // lugar livre (nunca dentro de parede): perto do ponto pedido, senão perto do jogador
    const spot = w.portalSpot(px, p.bottom) || w.portalSpot(p.cx, p.bottom, 20);
    let sy;
    if (spot) { px = spot.x; sy = spot.y; } else { px = p.cx; sy = p.bottom; }
    const next = this.mode === 'journey' ? this._nextStageInfo() : sectorInfo(this.sector + 1);
    this.portal = { x: px, y: sy, t: 0, color: next.biome.color, next };
    this.fx.effect('ring', { x: px, y: sy - 30, r: 6, maxR: 90, color: next.biome.color, life: 0.6 });
    this.audio.sfx('levelup');
    clearTimeout(this._portalMsgT);
    this._portalMsgT = setTimeout(() => { if (this.portal && this.ui) this.ui.showPortal(next); }, 2600);
  }

  _sectorStep(dt) {
    const P = this.portal;
    if (P) {
      P.t += dt;
      if (Math.random() < dt * 30) this.fx.emit(P.x + (Math.random() - 0.5) * 30, P.y - 30 + (Math.random() - 0.5) * 50, 1, P.color, 60, 0.6, 2, -40);
      const p = this.player;
      if (!this.warp && !this.isDying && P.t > 0.8 && Math.abs(p.cx - P.x) < 20 && p.bottom > P.y - 64 && p.y < P.y) this._warpStart();
    }
    if (this.warp) {
      this.warp.t += dt;
      if (!this.warp.done && this.warp.t >= 0.45) { this.warp.done = true; this._doWarp(); }
      if (this.warp.t >= 1.1) this.warp = null;
    }
  }

  _warpStart() {
    this.warp = { t: 0, done: false, color: this.portal.color };
    this.juice.glitch(0.45);
    this.iframes = Math.max(this.iframes, 2.5);
    this.audio.sfx('revive');
    this.fx.shake(6);
  }

  // Troca de setor: recolhe o que estava no chão, limpa os inimigos e gera o mundo novo
  _doWarp() {
    for (const o of this.pickups.pool) if (o.active) this.pickups._collect(o);
    this.enemies.reset(); this.pickups.reset(); this.fx.reset(); this.juice.reset();
    this.boss = null;
    this.warps = (this.warps || 0) + 1;
    this.world = new World((this.seed ^ Math.imul(this.warps + 1, 0x9e3779b1)) >>> 0);
    this.player.world = this.world;
    this.player.reset(12 * TILE, -2 * TILE);
    this.camera.snap(this.player);
    this.spawner.timer = 2.5; this.spawner.warned = false;
    if (this.mode === 'journey') this._enterStage(this.stage + 1);
    else {
      const n = this.sector + 1;
      this._enterSector(n);
      if (n > (this.meta.bestSector || 0)) { this.meta.bestSector = n; saveGame(this.meta); }
    }
    this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.25);   // respiro: +25% de vida
    this.iframes = Math.max(this.iframes, 2);
  }

  // ---------------- Chefões ----------------
  onBossWarning(def) {
    if (this.ui) this.ui.showBossWarning(def);
    this.audio.sfx('alarm');
  }

  onBossSpawn(e) {
    this.boss = e;
    this.juice.glitch(0.35);
    this.fx.sprite('fx.glitch', e.cx, e.cy, 0.6, 3);
    this.fx.shake(8);
    this.audio.sfx('roar');
  }

  // Recompensa garantida: level up (baterias), chuva de Sucata, vida e 5 Cyber-Moedas
  onBossKilled(e) {
    this.kills++;
    this.runStats.bosses++;
    this.boss = null;
    const need = Math.max(0, this.xpNeed - this.xp) + 40;
    for (let i = 0; i < 8; i++) this.pickups.spawn(PK.BATTERY, e.cx, e.cy, Math.ceil(need / 8));
    for (let i = 0; i < this.rng.int(16, 23); i++) this.pickups.spawn(PK.SCRAP, e.cx, e.cy, 1);
    this.pickups.spawn(PK.HEALTH, e.cx, e.cy, 0.3);
    const coins = this.mode === 'journey' && this.mapReplay ? JOURNEY.replayBossCoins : 5;
    this.meta.cyberCoins += coins;
    saveGame(this.meta);
    this.fx.bossDeath(e);
    this.hitStop = 0.18;
    this.vibe(120);
    if (this.ui) this.ui.showBossDown(e.def, coins);
    this.sectorCleared = true;
    if (this.mode === 'journey') { this.stageDone = true; this.mapDoneT = 3.5; }   // tempo para recolher as recompensas
    else this._openPortal(e.cx);
  }

  // Caixa quebrada: chuva de Sucata, bateria e chance de vida (a especial dá bem mais)
  onPropBroken(e) {
    this.runStats.crates++;
    const rare = !!e.def.rare;
    const coins = rare ? this.rng.int(8, 13) : this.rng.int(3, 6);
    for (let i = 0; i < coins; i++) this.pickups.spawn(PK.SCRAP, e.cx, e.cy, 1);
    this.pickups.spawn(PK.BATTERY, e.cx, e.cy, Math.round((rare ? 90 : 25) * (1 + 0.25 * (this.runTime / 60))));
    if (this.rng.chance(rare ? 0.6 : 0.15)) this.pickups.spawn(PK.HEALTH, e.cx, e.cy, rare ? 0.3 : 0.1);
    this.fx.propBreak(e);
  }

  // Queda pesada do Pug: onda de choque ao tocar o chão
  onSlam(p) {
    const lvl = this.skills.level('garras') || 1;
    const dmg = 28 * this.damageMult * this.char.melee.dmg * (1 + 0.15 * (lvl - 1));
    const R = 115;
    for (const e of this.enemies.pool) {
      if (!e.active) continue;
      const d = Math.hypot(e.cx - p.cx, e.cy - p.bottom);
      if (d < R) this.enemies.hurt(e, dmg * (1 - 0.4 * d / R), p.cx, 280);
    }
    this.fx.ring(p.cx, p.bottom - 4, '#ff9a3c', R, 0.35);
    this.fx.sprite('fx.debris', p.cx, p.bottom - 14, 0.45, 1.3, { add: false, grow: 0.6 });
    this.fx.emit(p.cx, p.bottom, 24, '#ff9a3c', 260, 0.45, 3, 400, Math.PI, -Math.PI / 2);
    this.fx.shake(9);
    this.juice.shock(p.cx, p.bottom - 4, R, 0.08);
    this.hitStop = Math.max(this.hitStop, 0.05);
    this.audio.sfx('killbig');
  }

  // ---------------- Personagens ----------------

  selectChar(id) {
    if (!this.meta.chars.includes(id)) return false;
    this.meta.selected = id;
    this.char = CHARS[id];
    this.player.setCharacter(this.char);
    saveGame(this.meta);
    return true;
  }

  // Talentos do personagem (GDD 3.5c)
  learnTalent(id, tid) {
    if (!canLearn(this.meta, id, tid)) return false;
    const tal = (this.meta.tal || (this.meta.tal = {}))[id] || (this.meta.tal[id] = {});
    tal[tid] = (tal[tid] || 0) + 1;
    this.audio.sfx('buy'); saveGame(this.meta);
    return true;
  }
  resetTalents(id) {
    if (!this.meta.tal || !this.meta.tal[id]) return false;
    this.meta.tal[id] = {}; this.audio.sfx('select'); saveGame(this.meta);
    return true;
  }

  // Arma exclusiva: compra o próximo nível com Sucata (o personagem precisa ser seu)
  buyWeapon(wid) {
    const D = WEAPONS[wid], m = this.meta;
    if (!D || !m.chars.includes(D.char)) return false;
    const w = m.weapons || (m.weapons = {}), lvl = w[wid] || 0;
    const cost = WEAPONS.costs[lvl];
    if (cost === undefined || m.scrap < cost) return false;
    m.scrap -= cost; w[wid] = lvl + 1;
    this.audio.sfx('buy');
    saveGame(m);
    return true;
  }

  unlockChar(id) {
    const ch = CHARS[id];
    if (!ch || this.meta.chars.includes(id) || this.meta.cyberCoins < ch.price) return false;
    this.meta.cyberCoins -= ch.price;
    this.meta.chars.push(id);
    this.audio.sfx('buy');
    return this.selectChar(id);
  }

  addXp(v) {
    this.xp += v;
    while (this.xp >= this.xpNeed) {
      this.xp -= this.xpNeed;
      this.level++;
      this.xpNeed = xpForLevel(this.level);
      this.pendingLevels++;
    }
  }

  addScrap(v) { this.scrap += v; }

  // ---------------- Level Up ----------------

  openLevelUp() {
    this.setState(GS.LevelUp);
    this.audio.sfx('levelup');
    this.ui.showLevelUp(this.skills.buildChoices(this.rng));
  }

  // Rerrolar: sorteia 3 cartas novas · Banir: a carta some de vez nesta partida (e sorteia de novo)
  rerollCards() {
    if (this.state !== GS.LevelUp || this.rerolls <= 0) return;
    this.rerolls--;
    this.audio.sfx('select');
    this.ui.showLevelUp(this.skills.buildChoices(this.rng));
  }

  banCard(choice) {
    if (this.state !== GS.LevelUp || this.bans <= 0 || !choice.id) return;
    this.bans--;
    this.skills.banned.add(choice.id);
    this.audio.sfx('hurt');
    this.ui.showLevelUp(this.skills.buildChoices(this.rng));
  }

  pickCard(choice) {
    if (this.state !== GS.LevelUp) return;
    this.skills.apply(choice);
    this.audio.sfx('select');
    this.pendingLevels = Math.max(0, this.pendingLevels - 1);
    if (this.pendingLevels > 0) this.ui.showLevelUp(this.skills.buildChoices(this.rng));
    else this.setState(GS.Playing);
  }

  // ---------------- Segunda Chance ----------------

  openRevive() {
    this.reviveT = RUN.reviveCountdown;
    this.adPlaying = false;
    this.setState(GS.Revive);
  }

  watchAd() {
    if (this.state !== GS.Revive || this.hasRevived || this.adPlaying) return;
    this.adPlaying = true;                              // contador pausa enquanto o anúncio passa
    if (nativeAds()) {                                  // app Android: anúncio premiado de verdade (AdMob)
      this.adT = Infinity;
      this.audio.pauseMusic();
      showRewarded().then((ok) => {
        this.adPlaying = false;
        if (this.state !== GS.Revive) return;
        if (ok) this.revive(true);
        else if (this.ui) this.ui.adFailed();
      });
      return;
    }
    this.adT = RUN.fakeAdSeconds;                       // navegador: anúncio simulado
  }

  revive(watchedAd) {
    if (!watchedAd || this.state !== GS.Revive || this.hasRevived) return false;
    this.hasRevived = !this.isDev;                      // apenas 1 por partida (conta DEV: sem limite)
    this.usedRevive = true;                             // perde a estrela "sem revive" da Jornada
    this.hp = Math.ceil(this.maxHp * RUN.reviveHP);     // 50% do HP
    this.player.revive();
    this.iframes = RUN.reviveInvuln;                    // 3 s de invencibilidade
    const p = this.player;
    this.enemies.blastFrom(p.cx, p.cy, this.camera.view);  // explosão que afasta todos os inimigos da tela
    this.fx.ring(p.cx, p.cy, '#5ef0ff', 260, 0.5);
    this.fx.ring(p.cx, p.cy, '#ff4df0', 180, 0.4);
    this.fx.emit(p.cx, p.cy, 40, '#5ef0ff', 380, 0.6, 3);
    this.fx.shake(10);
    this.audio.sfx('revive');
    this.setState(GS.Playing);
    return true;
  }

  toTitle() {
    setSectorBiome(-1);
    this._setWater(false);
    this.audio.setTrack('main');
    this.portal = null; this.warp = null;
    this.world = new World((Math.random() * 1e9) >>> 0, true);
    this.player.world = this.world;
    this.player.reset(12 * TILE, -2 * TILE);
    this.enemies.reset(); this.pickups.reset(); this.fx.reset();
    this.char = CHARS[this.meta.selected] || CHARS.gato;
    this.player.setCharacter(this.char);
    this.skills.reset([]);
    this.camera.snap(this.player);
    this.setState(GS.Title);
  }

  // ---------------- Esconderijo ----------------

  buyUpgrade(key) {
    const lvl = this.meta.upgrades[key] || 0;
    const cost = upgradeCost(lvl);
    if (cost === null || this.meta.scrap < cost) return false;
    this.meta.scrap -= cost;
    this.meta.upgrades[key] = Math.min(MAX_UPGRADE, lvl + 1);
    saveGame(this.meta);
    this.audio.sfx('buy');
    return true;
  }

  // Segunda Chance pagando com Cyber-Moedas (GDD 10.1)
  reviveWithCoins() {
    if (this.state !== GS.Revive || this.hasRevived || this.adPlaying) return false;
    if (this.meta.cyberCoins < RUN.reviveCyberCoinCost) return false;
    this.meta.cyberCoins -= RUN.reviveCyberCoinCost;
    saveGame(this.meta);
    return this.revive(true);
  }

  claimCheckin() { const r = claimCheckin(this.meta); if (r) { saveGame(this.meta); this.audio.sfx('buy'); } return r; }
  claimMission(i) { const r = claimMission(this.meta, i); if (r) { saveGame(this.meta); this.audio.sfx('buy'); } return r; }

  // ---------------- Conta master (DEV) ----------------
  get isDev() { return !!(this.cloud && this.cloud.isDev); }

  devOff() { setDevMode(false); this.devGod = false; }

  // Chamado após cada login/sincronização: liga ou desliga os privilégios
  applyDev() {
    const on = this.isDev;
    setDevMode(on);
    if (!on) { this.devGod = false; if (this.ui && this.ui.refreshMeta) this.ui.refreshMeta(); return; }
    const m = this.meta;
    for (const id of CHAR_ORDER) if (!m.chars.includes(id)) m.chars.push(id);
    if (!m.nick || /^(Gato|Guaxinim|Pug)-\d{4}$/.test(m.nick)) m.nick = 'RenanMaster';
    saveGame(m);
    if (this.ui && this.ui.refreshMeta) this.ui.refreshMeta();
  }

  devAction(a) {
    if (!this.isDev) return;
    const m = this.meta;
    switch (a) {
      case 'god': this.devGod = !this.devGod; break;
      case 'fps': this.showFps = !this.showFps; break;
      case 'maxUpgrades': for (const k of Object.keys(m.upgrades)) m.upgrades[k] = MAX_UPGRADE; saveGame(m); break;
      case 'resetDaily': delete m.daily; m.checkin = { last: '', streak: 0 }; saveGame(m); break;
      case 'resetBest': m.bestTime = 0; saveGame(m); break;
      case 'level': if (this.state === GS.Playing) { this.pendingLevels++; this.openLevelUp(); } break;
      case 'skip': if (this.state === GS.Playing) this.runTime += 60; break;
      case 'boss': if (this.state === GS.Playing && !this.boss && !this.sectorCleared) { this.sectorTime = Math.max(this.sectorTime, this.sectorBossAt - 3); } break;
      case 'sector': if (this.state === GS.Playing && !this.warp) { this.portal = this.portal || { x: this.player.cx, y: this.player.bottom, t: 1, color: sectorInfo(this.sector + 1).biome.color, next: sectorInfo(this.sector + 1) }; this._warpStart(); } break;
      case 'heal': this.hp = this.maxHp; break;
      case 'clear':
        for (const e of this.enemies.pool) if (e.active && !e.def.boss && !e.def.prop) this.enemies.hurt(e, 1e6, e.cx, 0);
        break;
    }
  }

  // ---------------- Save / conta ----------------
  save() { saveGame(this.meta); }
  async flushSave() { if (this.cloud) await this.cloud.flush().catch(() => {}); }

  // Troca o progresso inteiro (login em outra conta ou save mais novo da nuvem)
  replaceMeta(data) {
    const rev = data.rev || 0;
    this.meta = buildMeta(data);
    this.meta.rev = rev - 1;                         // saveGame soma 1: fica igual ao da nuvem
    saveGame(this.meta);
    if (this.ui && this.ui.refreshMeta) this.ui.refreshMeta();
  }

  declineRevive() { if (this.state === GS.Revive) this.gameOver(); }

  // ---------------- Fim ----------------

  // ---------------- Pausa ----------------
  // Só pausa jogando (no level up, revive e fim de jogo o tempo já está parado) e fora da transição de setor.
  pause() {
    if (this.state !== GS.Playing || this.isDying || this.warp) return false;
    this.setState(GS.Paused);
    return true;
  }

  resume() {
    if (this.state !== GS.Paused) return;
    this.iframes = Math.max(this.iframes, 0.6);      // meio segundo de folga para o dedo voltar aos botões
    this.setState(GS.Playing);
  }

  // Encerrar pelo menu de pausa: conta como fim de partida (guarda a Sucata e o recorde)
  quitRun() {
    if (this.state !== GS.Paused) return;
    this.gameOver();
  }

  saveMeta() { saveGame(this.meta); }

  // Vibração curta (Android); desligável nas opções
  vibe(ms) {
    if (!this.settings.vib || !navigator.vibrate) return;
    try { navigator.vibrate(ms); } catch { /* sem vibração */ }
  }

  setOption(key, on) {
    this.settings[key] = on;
    if (key === 'numbers') this.juice.numbersOn = on;
    saveSettings(this.settings);
  }

  gameOver(opt = {}) {
    const journey = this.mode === 'journey';
    const result = { time: this.runTime, kills: this.kills, scrap: this.scrap, level: this.level, best: false, mode: this.mode, victory: !!opt.victory };
    this.meta.scrap += this.scrap + (opt.bonusScrap || 0);
    this.meta.runs++;
    if (!journey && this.runTime > this.meta.bestTime) { this.meta.bestTime = this.runTime; result.best = true; }
    if (journey) {
      Object.assign(result, { map: this.map.num, mapIdx: this.map.n, stage: this.stage + 1, stages: this.map.stages.length, replay: this.mapReplay,
        bonusScrap: opt.bonusScrap || 0, bonusCoins: opt.bonusCoins || 0, stars: opt.stars || 0, newStars: opt.newStars || 0,
        starCoins: opt.starCoins || 0, allStars: (this.meta.jStars || {})[this.map.n] || 0, mod: this.map.mod });
      result.next = opt.victory ? { mode: 'journey', map: this.map.n + 1 } : { mode: 'journey', map: this.map.n };
    } else result.next = { mode: 'endless' };
    result.sector = this.sector + 1; result.sectorName = this.sectorInfo.biome.name; result.sectorColor = this.sectorInfo.biome.color;
    result.bestTime = this.meta.bestTime;
    result.totalScrap = this.meta.scrap;
    // XP permanente do personagem (nível e pontos de talento)
    const cx = this.meta.cxp || (this.meta.cxp = {}), before = charLevel(cx[this.char.id]).lvl;
    result.charXp = runCharXp({ kills: this.kills, time: this.runTime, stages: journey ? this.stage + (opt.victory ? 1 : 0) : this.sector, victory: !!opt.victory });
    cx[this.char.id] = (cx[this.char.id] || 0) + result.charXp;
    result.charLvl = charLevel(cx[this.char.id]); result.charUp = result.charLvl.lvl - before; result.charName = this.char.name;
    result.missionsDone = applyRun(this.meta, {
      kills: this.kills, time: this.runTime, scrap: this.scrap, level: this.level, crates: this.runStats.crates,
      tanks: this.runStats.tanks, biomes: this.runStats.biomes.size, evos: this.runStats.evos, char: this.char.id, bosses: this.runStats.bosses,
    });
    saveGame(this.meta);
    this.lastResult = result;
    if (result.best && this.cloud && !this.isDev) {
      result.rankPending = true;
      this.cloud.submitScore({ char: this.char.id, kills: this.kills }).then((ok) => {
        result.rankPending = false; result.ranked = ok;
        if (this.ui && this.ui.onScoreSent) this.ui.onScoreSent(result);
      });
    }
    this.audio.sfx('gameover');
    this.setState(GS.GameOver);
  }
}

// ---------------- Save (JSON) ----------------
const SETTINGS_KEY = 'nekog.settings.v1';
function loadSettings() {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(SETTINGS_KEY)); } catch { s = null; }
  return { shake: true, numbers: true, perf: false, auto: true, vib: true, size: 1, alpha: 1, lefty: false, ...(s || {}) };
}
function saveSettings(s) { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* sem armazenamento */ } }

// Na web: localStorage. No app Android: o mesmo JSON num arquivo do app (Capacitor Preferences/Filesystem).

function loadSave() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch { raw = null; }
  return buildMeta(raw);
}

// Monta o save a partir de um objeto (local ou vindo da nuvem), completando campos que faltam.
export function buildMeta(raw) {
  const base = { v: 1, rev: 0, scrap: 0, cyberCoins: 0, bestTime: 0, runs: 0, chars: ['gato'], selected: 'gato', nick: '', owner: '', jMax: 0, jStars: {}, weapons: {}, cxp: {}, tal: {}, tutDone: false, seenVer: '', seenJ: 0, upgrades: { hp: 0, speed: 0, damage: 0, magnet: 0, luck: 0, crit: 0 } };
  const data = raw && typeof raw === 'object' ? { ...base, ...raw, upgrades: { ...base.upgrades, ...(raw.upgrades || {}) } } : { ...base, upgrades: { ...base.upgrades } };
  // Multiplicadores calculados (não vão para o arquivo de save)
  for (const k of ['hpMult', 'speedMult', 'dashMult', 'damageMult', 'magnetMult', 'rareChance', 'critChance', 'critMult']) {
    Object.defineProperty(data, k, { get: () => metaStats(data.upgrades)[k], enumerable: false });
  }
  return data;
}

let saveHook = null;
export function setSaveHook(fn) { saveHook = fn; }

// Conta master (desenvolvedor): saldo nunca acaba
export const DEV_FUNDS = 999999;
let devMode = false;
export function setDevMode(v) { devMode = v; }

// Toda gravação sobe a revisão (rev): na sincronização, a nuvem só vence se tiver rev maior.
export function saveGame(meta) {
  meta.rev = (meta.rev || 0) + 1;
  if (devMode) { meta.scrap = Math.max(meta.scrap, DEV_FUNDS); meta.cyberCoins = Math.max(meta.cyberCoins, DEV_FUNDS); }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(meta)); } catch { /* armazenamento indisponível */ }
  if (saveHook) saveHook(meta);
}
