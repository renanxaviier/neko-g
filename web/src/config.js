// Todos os números de balanceamento ficam aqui (espelham o GDD). Nada de valor "mágico" no resto do código.
// Unidades: pixels de mundo e segundos. 1 tile = 32 px.

export const TILE = 32;
export const VIEW_W = 380;          // largura visível do mundo (retrato); a altura se adapta à tela
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
};

// GDD 10.1 / 10.2
export const RUN = {
  maxHP: 120,
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
