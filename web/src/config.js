// Todos os números de balanceamento ficam aqui (espelham o GDD). Nada de valor "mágico" no resto do código.
// Unidades: pixels de mundo e segundos. 1 tile = 32 px.

export const TILE = 32;
export const VERSION = '0.21 teste';   // aparece na tela inicial e no feedback dos testadores
export const VIEW_W = 410;          // largura visível do mundo (retrato; era 380 até a v0.17); a altura se adapta à tela
export const CHUNK_W = 24;          // largura de um chunk em tiles
export const CHUNK_H = 16;          // altura de um chunk em tiles (abaixo disso é chão sólido)
export const STEP = 1 / 60;         // passo fixo da simulação

export const PLAYER = {
  w: 24, h: 38,
  maxRunSpeed: 225,
  groundAccel: 2600, groundDecel: 3400,
  airAccel: 1900, airDecel: 1300,
  gravity: 1350,
  fallGravityMult: 1.7,
  maxFall: 760,
  apexThreshold: 55, apexGravityMult: 0.55,
  jumpHeight: 108,            // ~3,4 tiles com o botão segurado
  jumpCut: 0.45,              // toque rápido = pulo baixo
  coyote: 0.10,
  jumpBuffer: 0.12,
  maxAirJumps: 1, airJumpHeight: 84,
  requireInputTowardWall: true,
  wallSlideMax: 120, wallJumpHeight: 96, wallJumpSpeed: 300, wallJumpLock: 0.14, wallCoyote: 0.08,
  dashSpeed: 720, dashDuration: 0.14, dashCooldown: 0.40, maxAirDashes: 1, dashExtraInvuln: 0.05, dashBuffer: 0.10,
  hitStun: 0.22, knockbackX: 220, knockbackY: 230,
};

// Física de nado (setor submerso, docs/subaquatico.md §3). top = teto da água (y do mundo).
export const WATER = {
  top: -CHUNK_H * TILE - 20,
  gravity: 300, maxFall: 110, pugSink: 1.4, anchorSpeed: 620,
  speed: 160, accel: 900, drag: 420, groundAccel: 1400, groundDecel: 1600,
  stroke: 230, strokeCd: 0.18, gatoStroke: 1.18, pugStroke: 0.92, riseDrag: 1.1,
  holdRise: 70, holdLift: 160,
  torpedo: 520, torpedoTime: 0.25,
  enemyGravity: 0.45, enemyMaxFall: 230,
  pickupGravity: 120, pickupMaxFall: 50,
};

// Modo Jornada (GDD 3.5): mapas gerados em sequência, cada um com fases + chefe
export const JOURNEY = {
  stagesPerMap: 4,                       // fases antes do chefe
  stageDiff: 0.25,                       // cada fase soma isto à dificuldade do mapa (n do Spawner)
  survive: { base: 60, perStage: 10 },   // segundos
  hunt: { base: 32, perStage: 9, perMap: 0.06, max: 90 },   // abates
  reach: { base: 2800, perStage: 450 },  // distância até a saída (px de mundo; 32 px = 1 m)
  bossDelay: 5,                          // segundos até o chefe surgir na fase final
  bossHpPerMap: 0.12, bossHpPerCycle: 0.6,
  clearScrap: { base: 30, perMap: 8 },   // bônus de Sucata ao vencer o mapa
  clearCoins: 5,                         // Cyber-Moedas na 1ª vitória de cada mapa
  replayMult: 0.5,                       // mapa já vencido: metade do bônus
  replayBossCoins: 1,                    // e o chefe dá só 1 Cyber-Moeda
  // v0.16 [PROPOSTA]: novos tipos de fase (a partir do mapa 2)
  elite: { base: 3, perStage: 0.5, max: 6, hp: 4, every: 5, first: 3, scrap: 4 },   // inimigos de elite: vida ×hp, um por vez
  collect: { base: 40, perStage: 8, perMap: 0.04, max: 110 },                     // G Batty coletados na fase
  // Modificador do mapa (um por mapa, a partir do mapa 2). Multiplicadores sobre a fase normal.
  modFrom: 1,
  mods: {
    enxame:    { icon: '🐀', name: 'ENXAME',     desc: 'Muito mais inimigos, mais frágeis',       alive: 1.45, rate: 0.75, hp: 0.7 },
    blindados: { icon: '🛡', name: 'BLINDADOS',  desc: 'Inimigos +50% vida · +60% Sucata',        hp: 1.5, scrap: 1.6 },
    furia:     { icon: '🔥', name: 'FÚRIA',      desc: 'Inimigos +40% dano · +30% XP',            dmg: 1.4, xp: 1.3 },
    sobrecarga:{ icon: '⚡', name: 'SOBRECARGA', desc: 'Suas skills recarregam 20% mais rápido · inimigos +20% vida', cd: 0.8, hp: 1.2 },
  },
  // v0.20 Expedição: ao vencer um mapa, dá para seguir para o próximo mantendo nível, skills e vida.
  // Dificuldade proporcional à força: compara o nível do jogador com o nível esperado de quem começou o mapa
  // do zero (1 + perStage × fases andadas) e reforça os inimigos pelo excesso (sem enfraquecer o personagem).
  continueHeal: 0.35,          // vida recuperada ao seguir para o próximo mapa
  adapt: { perStage: 3.5, cap: 24, hp: 0.06, dmg: 0.025, alive: 0.015, aliveMax: 1.35, boss: 0.04 },
  // Estrelas do mapa: vencer · sem usar o revive · terminar com ≥ starHp de vida. Cada estrela nova dá Cyber-Moedas.
  starHp: 0.5,
  starCoins: 2,
};

// GDD 10.1 / 10.2
export const RUN = {
  maxHP: 120,
  hitStopGap: 0.45,           // pausa de impacto dos golpes comuns: no máximo uma a cada 0,45 s
  damageIFrames: 0.5,
  startInvuln: 3,
  reviveInvuln: 3,
  reviveHP: 0.5,
  reviveCountdown: 5,
  deathSequence: 1.0,
  fakeAdSeconds: 2.5,
  // Cápsulas de vida caem aleatoriamente de qualquer monstro (regra do produtor, 07/11)
  healthDrop: {
    chance: { weak: 0.03, medium: 0.06, tank: 0.25 },
    lowHp: 0.35, lowHpMult: 2,    // abaixo de 35% de HP a chance dobra
    heal: { weak: 0.10, medium: 0.20, tank: 0.20 },   // fração do HP máximo
  },
  reviveCyberCoinCost: 50,
};

// GDD 10.4 (fórmula mista decidida pelo produtor)
export const xpForLevel = (lvl) => Math.round(100 * lvl * Math.pow(1.2, lvl - 1));

export const PICKUP = {
  magnetRadius: 70,
  flyStartSpeed: 240, flyAccel: 1400, flyMaxSpeed: 950,
  collectRadius: 14,
  maxActive: 300,             // acima disso, baterias se fundem (economia de desempenho)
};

export const LIMITS = { enemies: 150, projectiles: 160, enemyShots: 80, particles: 500, effects: 160, fire: 120 };

export const SKILL_LIMITS = { actives: 4, passives: 4, maxLevel: 8 };

export const SAVE_KEY = 'neonpaws.save.v1';

// v0.16: armas exclusivas dos personagens [PROPOSTA]. Compradas/evoluídas com Sucata na tela "Escolher personagem".
// Com a arma comprada, o personagem já começa a partida com ela disparando sozinha. Nível 5 = bônus especial.
export const WEAPONS = {
  costs: [150, 300, 500, 800, 1200],     // Sucata para o nível 1, 2, 3, 4, 5
  garrasE: { char: 'gato', name: 'Garras Energizadas', icon: '≋', color: '#ff4df0', anim: 'wpn.garras',
    desc: 'Três garras de energia avançam e atravessam a horda.', max5: 'Nv 5: lança para frente e para trás.',
    cd: 1.7, cdMul: 0.93, dmg: 20, dmgPer: 8, range: 210, speed: 560, h: 40 },
  corteDados: { char: 'guaxinim', name: 'Corte de Dados', icon: '⌁', color: '#4dffa6', anim: 'wpn.dados',
    desc: 'Corte dos dois lados; quem é atingido trava com glitch.', max5: 'Nv 5: corte maior e glitch mais longo.',
    cd: 2.0, cdMul: 0.93, dmg: 16, dmgPer: 7, r: 92, stun: 0.45 },
  martelo: { char: 'pug', name: 'Martelo de Impacto', icon: '⚒', color: '#ff9a3c', anim: 'wpn.martelo',
    desc: 'Pancada pesada à frente e onda de choque pelo chão.', max5: 'Nv 5: uma segunda onda de choque.',
    cd: 2.6, cdMul: 0.93, dmg: 34, dmgPer: 12, front: 100, wave: 230, waveDmg: 0.6, knock: 300 },
};
