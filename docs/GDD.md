# GDD — Documento de Design do Jogo (v0.1)

> Status: rascunho inicial a partir das definições do produtor.
> Itens marcados com **[PROPOSTA]** são sugestões da equipe e ainda precisam de aprovação.
> Itens marcados com **[EM ABERTO]** precisam de decisão.

---

## 0. Ficha técnica
| Item | Definição |
|---|---|
| Nome | **Neko G** (decidido pelo produtor, 07/11/2026) |
| Gênero | Plataforma 2D de ação + roguelite de hordas (estilo Vampire Survivors) |
| Plataforma | Android (inicialmente); otimizado para aparelhos de entrada |
| Tecnologia | Web (HTML5 Canvas + JavaScript), empacotado para Android depois (ver `docs/arquitetura.md`) |
| Orientação | Retrato, responsivo a diferentes proporções de tela |
| Tema | Cyberpunk neon; personagens jogáveis são animais (Gato, Guaxinim Hacker, Pug) |
| Visual | Pixel art com **animações fluidas e efeitos sempre presentes** (ver `docs/arte.md`) |
| Modelo | Gratuito, com anúncios recompensados e compras no app (Cyber-Moedas) |
| Objetivo do jogador | Sobreviver o máximo possível, fazer a maior pontuação e evoluir permanentemente entre partidas |

---

## 1. Loop principal

```
Esconderijo (meta) ──► Partida ──► Morte ──► Revive? (1x) ──► Fim de partida
     ▲                                                          │
     └──────── Sucata, missões, recordes, Cyber-Moedas ◄────────┘
```

### 1.1 Dentro da partida
1. O jogador se move pela arena infinita e ataca com o botão ATAQUE (ver 2.1).
2. Inimigos cibernéticos surgem em **ondas cada vez mais densas**.
3. Inimigos derrotados soltam **G Batty** (XP).
4. Ao encher a barra de XP → **Level Up**: a ação pausa e o jogador escolhe **1 entre 3** skills/upgrades temporários (valem só para a partida atual).
5. O jogador **controla quando e para onde ataca**; drones e fogo complementam. A habilidade está em mover, desviar e mirar.

### 1.2 Fora da partida (meta-progressão)
- Sucata ganha na partida é gasta no **Laboratório de Upgrades** (permanentes, valem para todos os personagens).
- Cyber-Moedas desbloqueiam personagens e skins e pagam o revive.

---

## 2. Movimentação (pilar nº 1 do jogo)
A movimentação deve ser extremamente ágil, responsiva e justa, no estilo Metroidvania.

Física com **Rigidbody2D** e **Input System** (regra do produtor).

| Mecânica | Regra |
|---|---|
| Pulo variável | Toque rápido = pulo baixo; segurar = pulo alto |
| Coyote Time | O pulo ainda é aceito por um curto período após sair da borda. **[PROPOSTA]** 0,10 s |
| Jump Buffer | O pulo pressionado pouco antes de tocar o chão é executado ao aterrissar. **[PROPOSTA]** 0,12 s |
| Pulo duplo | Pulo extra no ar, **para todos os personagens** (quantidade configurável) |
| Wall Slide / Wall Jump | Detecção lateral por **Raycasts**; desliza devagar ao encostar na parede; o pulo na parede impulsiona para o lado oposto |
| Dash | **Horizontal**, por alteração direta de velocidade, com **i-frames** e **cooldown**. Funciona no chão e no ar. **[PROPOSTA]** 1 dash aéreo, recarregado ao tocar o chão ou a parede |
| Gravidade | Maior na descida que na subida, com velocidade máxima de queda |
| Ataque básico | Ataque direcional básico (corpo a corpo ou tiro curto). A principal fonte de dano são as skills automáticas |

**Estados do jogador:** Idle, Run, Jump, Fall, Wall Slide, Dash, Hit/Damage, Death.

Todos os valores ficam no ScriptableObject `PlayerMovementConfig` (um asset por personagem).

### 2.1 Controles em retrato (regra do produtor, 07/11/2026)
- **Botões, não joystick:** ◀ ▶ no canto inferior esquerdo; **ATAQUE**, **PULO** e **DASH** no canto inferior direito.
- **Ataque controlado pelo jogador:** as skills de disparo (**Garras Elétricas** e **Shurikens**) saem quando o jogador aperta ATAQUE, na direção para onde olha; segurar o botão dispara sem parar, no ritmo de recarga de cada skill.
- Skills de "presença" continuam sem botão: **Drones Orbitais** giram sozinhos e o **Rastro de Fogo** sai no dash.
- Garras com área maior (acerta também quem está colado no personagem), golpe a cada ~0,3 s e empurrão forte.
- Teclado (testes): A/D ou ←/→, Espaço pula, J ataca, Shift dash.
- Dash: **horizontal** (decidido).

---

**Visual dos botões (v0.6):** discos neon com ícones vetoriais e anel tracejado girando. ◀▶ com setas duplas (lilás). **Ataque** muda com o personagem: garras douradas (Gato), lâmina verde (Guaxinim), soco laranja (Pug), com sombra de recarga. **Pulo** (rosa): pata com seta e pontos de pulos no ar restantes; no Guaxinim sem pulos no ar vira **PLANAR**. **Dash** (ciano): raio com sombra de recarga e um brilho quando volta; no Pug, no ar, vira **QUEDA** (laranja). Ao tocar, o botão encolhe e solta uma onda de luz.

## 3. Estrutura da partida

### 3.1 Cenário (decidido)
**Arena infinita horizontal, procedural e randomizada**, montada em **chunks** (blocos pré-montados com chão e plataformas):
- O jogador pode ir para a **direita ou para a esquerda** sem fim; novos chunks surgem fora da câmera e os que ficam para trás são reciclados (**object pooling**).
- O próximo chunk é sorteado por peso entre os que **encaixam na altura** do vizinho, respeitando dificuldade por distância, distância mínima, não repetição e **chunks de respiro** periódicos.
- Variação dentro do chunk: objetos opcionais ligados/desligados por sorteio.
- O layout é lembrado: voltar a um lugar mostra o mesmo chunk.
- Fundo com **parallax** em camadas (céu, prédios distantes, letreiros neon).
- Código: `Assets/_Project/Scripts/Level/` (`LevelGenerator`, `LevelChunk`, `ChunkPool`, `ChunkRandomToggle`, `ParallaxLayer`).

**Biomas (07/11/2026, aprovado pelo produtor):** o mundo muda de bioma a cada ~6 chunks de distância do início (para os dois lados, em ordens diferentes). Perto do início é sempre o Distrito Neon.
| Bioma | Visual | Favorece |
|---|---|---|
| Distrito Neon | Prédios e letreiros neon, plataformas de grade | Ratos, Drones Olho, Morcegos |
| Cyber-Coast | Céu verde-água, coqueiros, letreiros de praia | Voadores (Drones, Vespas, Drone Voador, Morcegos) |
| Favelas de Dados | Céu laranja de fumaça, barracos empilhados, fios, plataformas enferrujadas | Ratos, Esquilos, Scrap-Hounds, Lobos |
| Porto Automatizado | Contêineres, guindastes, servidores, canos | Drone Voador, Panda, Urso, Scrap-Hound |
As regras de tempo do GDD 10.3 continuam valendo (o bioma só aumenta o peso de quem já pode aparecer). Ao entrar num bioma aparece "ENTRANDO EM …"; o fundo troca com transição suave. Código: `web/src/biomes.js`.

**Balanceamento (07/11/2026, pedido do produtor — "a partir do nível 5 fica muito difícil"):** HP do jogador 100 → 120; dano dos inimigos reduzido (ex.: Scrap-Hound 14 → 10, Urso 22 → 16); inimigo que acabou de apanhar não causa dano por contato; investida dos cães mais lenta e com aviso maior; vida dos inimigos cresce mais devagar no começo (2 min: 1,13×; 5 min: 1,45×; 10 min: 2,3×); médios entram aos poucos a partir do minuto 2; Garras mais fortes. Teste automático (jogador que não desvia): sobrevivência média 2:12 → 3:31.

**Atenção — retrato + rolagem horizontal [PROPOSTA]:** a tela em pé mostra pouca largura (~8–10 unidades), então inimigos que chegam pelos lados aparecem com pouco aviso. Para manter a morte justa:
- **indicadores na borda da tela** apontando inimigos que estão chegando de fora dela;
- **câmera com antecipação** na direção do movimento;
- chunks com bastante **espaço vertical** (plataformas em vários níveis) para usar a altura da tela na fuga.

### 3.1b Setores e portal (decisão do produtor, 07/11/2026)
- A partida avança por **setores**. Cada setor é um cenário inteiro (o mundo todo fica com a cara dele).
- O **chefão** aparece depois de **2:30** no setor 1 e **2:20** nos seguintes (barra "CHEFÃO m:ss" no topo). Vencido, abre um **portal** na cor do próximo cenário (seta na borda da tela se estiver fora de vista).
- Entrar no portal: clarão de transição, as G Batty e a Sucata do chão são recolhidas, os inimigos somem, o mundo novo é gerado, **+25% de vida** e 2 s de invencibilidade.
- Cada setor deixa os inimigos comuns com **+12% de vida** e **+5% de dano** (acumulando), além do aumento por tempo que já existia.
- **Ordem (13 setores):** 1 Distrito Neon · 2 Cyber-Coast · 3 Favelas de Dados · 4 Porto Automatizado · **5 Cyber Deep (submerso)** · 6 Fábrica de Robôs · 7 Data Subway · 8 GeneLab · 9 Neon Mall · 10 Cyber Casino · 11 The Cage · 12 Glow Jungle · 13 Torre Corporativa. Depois do 13, recomeça no 1 em **CICLO 2** (chefões ×1,75 de vida a cada volta pelos 4).
- Arte: setores 6 a 11 vêm da folha `cenarios_biomas2.jpg`; Fábrica e Torre ainda são feitas por código (aguardando folha).
- Fim de partida mostra o setor alcançado; o melhor fica salvo (`bestSector`).
- **Inimigos por cenário (v0.8):** cada setor tem seu elenco (`SECTOR_ROSTER` em `biomes.js`), com fracos, médios e tanques. Lista completa e comportamentos em `docs/bestiario.md`.
- **Curva de desafio (v0.8):** a pressão depende do setor (n) e de quanto do setor já passou (p, de 0 até o chefão).
  - Inimigos vivos ao mesmo tempo: 6 → 14 no setor 1; 17 → 32 no setor 6; máximo 70.
  - Intervalo entre grupos: 2,6 s → 1,5 s no setor 1, caindo 0,11 s por setor.
  - Médios entram depois de ~15% do setor; tanques só no fim do setor 1 e cada vez mais cedo nos seguintes.
  - Vida dos inimigos: ×(1 + 0,1·n) × (1 + 0,3·p); dano +4% por setor; ciclo 2 em diante +60% de vida.
- **Subaquático:** arquitetura em `docs/subaquatico.md`.

### 3.1c Cyber Deep — setor submerso (v0.9, folha do produtor 07/11/2026)
- **Posição:** 5º setor, logo depois do Porto. Chefão: **Polvo de Neon**. **Sem oxigênio** (decisão do produtor).
- **Física de nado** (`WATER` em config.js; detalhes em docs/subaquatico.md): afunda devagar (gravidade 300, queda máx. 110); PULO = **braçada** (impulso 230, recarga 0,18 s, sem limite; segurar = sobe devagar); DASH = **torpedo** (0,25 s, diagonal para cima com PULO apertado, mantém a invencibilidade); sem pulo na parede; teto = superfície.
  - Gato: braçada 18% mais forte · Guaxinim: segurar PULO = **flutuar parado** · Pug: afunda 40% mais rápido e a Queda vira **Âncora** (mesma onda de dano no fundo).
- Inimigos que andam ficam "flutuados" (gravidade ×0,45); baterias e sucata descem devagar.
- **Efeito de água:** tom azul por profundidade, cáusticas deslizando, feixes de luz, bolhas (máx. 40: braçadas, mortes e fontes no fundo), linha de ondas na superfície e **som abafado** (filtro passa-baixa na música e nos efeitos).
- **Cenário animado:** anêmonas balançando, águas-vivas de fibra óptica flutuando, letreiro CYBER DEEP com glitch, viga em curto-circuito, cano vazando, correnteza de dados e neve marinha no fundo.
- **Elenco (v0.10, folha inimigos_aquaticos.jpg):** fracos **Peixe-Lanterna Glitch** (cardume que mantém distância e cospe luz), Medusa, Ouriço · médios **Cyber-Lula** (nada em jatos, alinha na altura do jogador e solta um raio em zigue-zague), Caranguejo, Tubarão-Torpedo, Leão-Marinho · tanques Crocodilo, Querubim-Tubarão.
- **Mini-chefe:** o **Querubim-Tubarão** aparece uma vez na metade do caminho até o chefão (aviso "MINI-CHEFE"): ronda, avisa com a boca aberta e dá um bote que morde.
- **Chefões aquáticos** (variações dos chefões de terra; um é sorteado por partida, `?wboss=mecha|serpente` para testar):
  - **Mecha-Povoador** (variação do Polvo): escafandro gigante no fundo. Tentáculo no chão com ondas elétricas dos dois lados, canhão da cabeça (leque), anel de choque (fase 2+), salto pesado com pouso que solta ondas (fase 2+; na fase 3 derruba destroços).
  - **O Grande Glitch — serpente** (variação do Dragão): nada em ondas; sopro de plasma que varre, travessia rápida na altura do jogador, anel de bolhas elétricas e cardume de Peixes-Lanterna (fase 2+).
  - Na troca de fase os dois mostram os quadros de DANO da folha; ao morrer, os quadros de MORTE. Os monstros comuns também usam DANO (ao levar golpe) e MORTE.

### 3.5 Modos de jogo: Infinito e Jornada (aprovado pelo produtor, 07/11/2026)
- **Infinito:** o modo de setores em sequência até morrer (3.1b), com ranking global de tempo.
- **Jornada:** mapas gerados em sequência, praticamente sem fim. Cada **mapa = um cenário** com **4 fases + chefe** (~6–8 min). Decisões tomadas (padrão sugerido, sem objeção do produtor): **as cartas valem para o mapa inteiro** e zeram no mapa seguinte; a Jornada terá ranking de "mapa mais longe" na etapa 3.
- **Ordem dos cenários:** o mapa 1 é sempre o Distrito; a cada ciclo de 13 mapas os cenários vêm embaralhados (semente fixa por ciclo: o mesmo mapa é igual para todos), sem repetir o último cenário do ciclo anterior.
- **Objetivos das fases** (sorteados por mapa, sem repetir o anterior; a 1ª fase do jogo é sempre "sobreviva"): **Sobreviva** X s (60 + 10/fase) · **Derrote** N inimigos (32 + 9/fase, +6% por mapa, máx. 90) · **Chegue à saída** (portal a 2800 + 450 px/fase à direita, com seta na borda da tela). Objetivo cumprido → abre o portal → próxima fase (mundo novo, +25% de vida). Fase final: o chefe surge em 5 s.
- **Dificuldade:** n = mapa + 0,25 × fase (mesma fórmula do Spawner do Infinito); p = progresso do objetivo. Chefe: vida × (1 + 0,12 × mapa) × (1 + 0,6 × ciclo). Valores em `JOURNEY` (config.js).
- **Recompensas:** chefe 5 ◆ (1 ◆ se o mapa já foi vencido); vitória: +Sucata (30 + 8 × mapa) e +5 ◆ na 1ª vez; mapa repetido dá metade da Sucata. Derrota: guarda a Sucata coletada, "Tentar de novo" o mesmo mapa.
- **Telas:** menu com **▶ JORNADA (próximo mapa)**, **∞ INFINITO** e **🗺 MAPAS** (lista para repetir mapas vencidos). Barra do topo mostra mapa, fase e o objetivo com progresso.
- **Próximas etapas:** (2) **nível do personagem** permanente + árvore de talentos por personagem (o que deixa as fases antigas mais fáceis); (3) caminho com bifurcações (fase elite, oficina, evento), **3 estrelas por fase**, desafio diário e ranking da Jornada; (4) modificadores por ciclo e chefes evoluídos.

### 3.2 Inimigos
**34 inimigos** definidos pela arte conceitual — detalhes, comportamentos e tiers em **`docs/bestiario.md`**:
- **Fracos (7):** Drone Olho, Morcego Cibernético, Cyber-Rato, Esquilo Bombardeiro, Vaga-lume Estático, Aranha-Drone, Ouriço-Espinho.
- **Médios (12):** Scrap-Hound, Cyber-Lobo, Macaco Cibernético, Texugo de Choque, Coruja de Vigilância, Ornitorrinco Lançador, Canguru Boxeador, Rato-Asa, Vespa Zangão, Sapo Tóxico, Camaleão Hacker, Medusa Cibernética.
- **Tanques (10):** Urso Cibernético, Crocodilo Mecânico, Gorila de Sucata, Rinoceronte de Demolição, Touro Blindado, Tubarão Terrestre, Bode Quebra-Muralhas, Leão-Marinho de Combate, Caranguejo Mecânico, Panda de Guerra.
- **Elite (1):** Alce Gerador (+ variantes "Glitch" de tanques **[PROPOSTA]**).
- **Chefes (4):** Polvo de Neon, Quimera Cibernética, O Grande Glitch (Dragão Cyber), T-Rex Cibernético.

Chefes surgem em marcos de tempo (3:00, 6:00, 9:00, 12:00 e repetem) e garantem recompensa (level up + Sucata + vida + ◆5). Detalhes em `docs/bestiario.md` → Chefões implementados. Elites ainda **[PROPOSTA]**.

### 3.2b Caixas destrutíveis **[PROPOSTA — já no protótipo]**
- A cada ~8 s, se houver menos de 2 caixas por perto, uma caixa surge no chão fora da tela.
- **Caixa comum:** 3–5 Sucatas, 1 bateria pequena, 15% de chance de cápsula de vida.
- **Caixa especial (12%):** 8–12 Sucatas, bateria grande, 60% de chance de cápsula grande.
- Quebram com qualquer ataque; não causam dano.

### 3.3 Ondas
- A densidade e a variedade de inimigos aumentam com o tempo.
- **[PROPOSTA]** Um "diretor de ondas" controla orçamento de spawn por segundo, com picos de pressão seguidos de respiros curtos.
- Inimigos nunca surgem em cima do jogador nem dentro do campo de visão imediato sem aviso.

### 3.4 Pontuação **[PROPOSTA]**
- Pontos por tempo sobrevivido + pontos por inimigo derrotado (com peso por tipo) + bônus por elites.
- Recorde pessoal salvo; placar online **[EM ABERTO]**.

---

## 4. Level Up e Skills

- Ao subir de nível, o jogo pausa e mostra **3 cartas**; o jogador escolhe 1.
- Cartas podem ser **skill nova** ou **upgrade de skill existente**.
- Raridades: Comum, Rara, Épica, Lendária. A chance de Épica/Lendária aumenta com o upgrade **Sorte Algorítmica**.
- As cartas são geradas a partir de **ScriptableObjects**; durante a escolha, `Time.timeScale = 0`.
- **Skills ativas:** disparam sozinhas, baseadas em timers.
- **Skills passivas (suporte):** Ímã (aumenta o raio de coleta), Aumento de HP, Velocidade, Redução de Cooldown.
- **Evolução/Sinergia:** uma skill ativa no **nível máximo** + a **passiva correspondente** evolui para uma versão superior. Tabela de pares **[EM ABERTO]**.

### 4.1 Skills iniciais
| Skill | Descrição |
|---|---|
| Drones Orbitais | Drones giram ao redor do personagem, causando dano e bloqueando projéteis |
| Shurikens de Holograma | Projéteis que ricocheteiam nas paredes e plataformas |
| Rastro de Fogo Cibernético | O dash deixa um rastro que causa dano contínuo |
| Garras Elétricas | Ataque corpo a corpo automático na direção do movimento |

**[EM ABERTO]** Número de níveis por skill, limite de skills simultâneas (ex.: 6) e se haverá evoluções/combinações de skills.

---


### 4.x Cartas novas — lote 1 (v0.9, escolhido pelo produtor em 07/11/2026)
| Carta | Tipo | Efeito | Evolui com → nome |
|---|---|---|---|
| Raio em Cadeia | ativa automática | A cada ~1,9 s, um raio atinge o inimigo mais próximo e salta para 2 a 6 outros (−12% de dano por salto) | Amplificador → **Tempestade Elétrica** (2 raios, até 10 saltos sem perder força) |
| Campo Tesla | ativa automática | A cada 0,5 s, dá choque em todos dentro do campo (raio 50 → 78) | Vampirismo → **Bobina Vampira** (campo 40% maior, cada choque cura um pouco) |
| Bumerangue de Plasma | ativa automática | Vai até ~200–250 px e volta, atravessando inimigos; +1 nos níveis 3 e 6 | Dash Duplo → **Bumerangue Duplo** (para os dois lados, +2, e cada dash lança um) |
| Vampirismo Digital | passiva | Cada abate cura 0,3% do HP por nível (até 2 vezes por segundo) | — |
| Amplificador | passiva | +8% por nível no tamanho de golpes, campos, raios, fogo, drones e bumerangues | — |
| Dash Duplo | passiva | Nível 1: 2ª carga de dash; níveis seguintes: −6% na recarga | — |

- **Rerrolar (2 por partida):** sorteia 3 cartas novas.
- **Banir (1 por partida):** toca em "Banir" e depois na carta; ela não aparece mais naquela partida (e sorteia de novo). Cura e Sucata não podem ser banidas.
- Agora são 7 ativas e 7 passivas disputando 4 + 4 espaços.
- **Próximos lotes sugeridos:** Laser Orbital, Minas de Pulso, Mísseis Teleguiados; Área/Projétil extra/Esquiva/Pulo extra; raridades (comum → lendária), cartas exclusivas por personagem, baú-caça-níquel do chefão; no Esconderijo: +rerrolagens, +Segunda Chance, carta inicial, árvore de talentos.

## 5. Morte e Revive (Protocolo de Backup)

1. HP chega a zero → a ação congela e aparece a tela **Protocolo de Backup**.
2. **Contagem regressiva de 5 segundos.**
3. Opções:
   - **Assistir anúncio** (rewarded video; rede de anúncios a definir no empacotamento Android) → revive com **50% do HP**.
   - **Gastar Cyber-Moedas** → revive com **50% do HP**. Preço **[EM ABERTO]**.
   - **Recusar** ou deixar o tempo acabar → tela de fim de partida.
4. **Regra de ouro: no máximo 1 revive por partida.**
5. Ao reviver: **3 s de invencibilidade** e uma **explosão que afasta todos os inimigos da tela** (regra do produtor, seção 10.1).
6. Recompensa do anúncio só é dada quando a rede confirmar que o vídeo foi assistido até o fim. Se o anúncio falhar ao carregar, a opção aparece desativada com aviso, e a contagem não pune o jogador.
7. **[PROPOSTA]** A contagem regressiva pausa enquanto o anúncio estiver carregando/sendo exibido.

---

## 6. Economia

### 6.1 Moedas
| Moeda | Tipo | Como ganhar | Uso |
|---|---|---|---|
| **Sucata** | Soft | Jogando partidas | Laboratório de Upgrades |
| **Cyber-Moedas** | Hard (premium) | Check-in diário, missões específicas, loja (dinheiro real) | Personagens (animais), skins, revive |

### 6.2 Laboratório de Upgrades (permanentes, níveis 1 a 5, todos os personagens)
> **Decidido (07/11/2026):** as listas foram unidas — 6 upgrades (o 6º, Ataque Crítico, veio depois), comprados com Sucata no Esconderijo.
>
> **Implementado no protótipo (07/11/2026)** — `web/src/meta.js`:
> | Upgrade | Por nível (1–5) |
> |---|---|
> | Chassi Reforçado | +10% HP máximo |
> | Propulsores | +4% velocidade e +6% dash |
> | Sobrecarga de Núcleo | +8% de dano |
> | Módulo Magnético | +15% raio de coleta |
> | Sorte Algorítmica | +6% de chance de cada carta de level up vir **RARA** (vale 2 níveis de uma vez) |
> | Ataque Crítico (pedido do produtor, 07/11/2026) | +5% de chance de crítico por nível (até 25%); dano do crítico ×1,8 no nível 1 até ×2,2 no nível 5. Vale para todo dano do jogador (ataque, Shurikens, Drones, Rastro, queda do Pug). Mostra "CRÍTICO!" dourado sobre o inimigo. |
> Custo por nível **[PROPOSTA]**: 40 · 90 · 180 · 320 · 520 Sucata (1.150 por upgrade; ~5.750 para completar tudo, ~40–50 partidas).
> Como o jogo não tinha raridade de cartas, a Sorte foi implementada com cartas RARAS (moldura roxa). Épica/Lendária ficam para quando houver mais skills.
| Upgrade | Efeito | Por nível **[PROPOSTA]** |
|---|---|---|
| Chassi Reforçado | Vida máxima | +10% HP |
| Propulsores | Velocidade de movimento e distância do dash | +4% velocidade, +6% distância |
| Módulo Magnético | Raio de coleta das G Batty | +15% raio |
| Sorte Algorítmica | Chance de skills Épicas/Lendárias no level up | +3 p.p. no peso de raras |
| Sobrecarga de Núcleo (nome **[PROPOSTA]**) | Dano de todas as skills e do ataque básico | +8% dano |

Custo em Sucata crescente por nível **[EM ABERTO]** — definido pelo agente `economy-designer`.

Os upgrades são comprados no **Lobby/Esconderijo** e salvos em **PlayerPrefs ou JSON** (regra do produtor). **[PROPOSTA]** JSON, porque PlayerPrefs é fácil de editar no aparelho e o save guarda Cyber-Moedas (moeda com valor real).

### 6.3 Missões e check-in
**Implementado (v0.4, `web/src/missions.js`):**
- **Check-in de 7 dias:** ◆ 10 · 15 · 20 · 25 · 30 · 40 · **80** (dia 7). Abre sozinho na primeira visita do dia. Perdeu um dia → volta ao dia 1; depois do dia 7 recomeça o ciclo.
- **3 missões diárias**, sorteadas pela data (todo jogador vê as mesmas no mesmo dia), trocadas à meia-noite do aparelho. Pool de 10: derrotar 150 inimigos (◆15), sobreviver 5 min numa partida (◆20), coletar 60 Sucata (◆10), nível 10 numa partida (◆15), quebrar 5 caixas (◆10), derrotar 3 tanques (◆20), visitar 2 biomas numa partida (◆15), jogar 3 partidas (◆10), fazer uma evolução (◆25), sobreviver 3 min com um personagem específico (◆25).
- Missões de soma acumulam entre partidas do dia; as de "numa partida" valem o melhor resultado. O progresso conta no fim de cada partida e o resgate é manual (ponto vermelho no botão MISSÕES quando há algo para resgatar).
- Teto diário: ~◆ 80 em missões + check-in. Com isso o Guaxinim (◆120) sai em 2–3 dias e o Pug (◆160) em ~1 semana.
- **Revive com Cyber-Moedas** (◆50) ativo na tela de Protocolo de Backup, ainda limitado a 1 por partida.
- **[A FAZER no app]** validar a data no servidor para impedir troca do relógio do aparelho (GDD 10.7).

---

### 6.4 Contas, nuvem e ranking (decisão do produtor, 07/11/2026)
- **Firebase** (Auth + Firestore). Login: **convidado automático**, **Google** e **e-mail/senha**. Convidado vira conta sem perder progresso.
- O save inteiro (Sucata, Cyber-Moedas, upgrades, personagens, missões, recorde) vai para a nuvem; vale o mais recente (`rev`).
- **Ranking global** por maior tempo sobrevivido, com apelido e personagem. Telas "Conta" e "Ranking" no menu, selo de status no canto (CONVIDADO / apelido / OFFLINE).
- **Conta master (DEV)** do produtor: recursos infinitos, Painel DEV e atalhos na partida; fora do ranking. Ver `docs/contas.md`.
- Detalhes, passo a passo do Firebase e limitações em `docs/contas.md`.

## 7. Personagens
Arte conceitual em `assets/concept/personagens_jogaveis.jpg`. Todos têm o kit base (pulo, dash, wall jump). Cada um ganha **um traço de movimento e uma skill inicial** próprios, sugeridos pela arte **[PROPOSTA]**:

| Personagem | Visual | Traço de movimento | Skill inicial | Perfil | Desbloqueio |
|---|---|---|---|---|---|
| **Gato** | Jaqueta neon, viseira, botas a jato | **Pulo duplo** (botas a jato) | Garras Elétricas | Ágil, equilibrado | Gratuito (inicial) |
| **Guaxinim Hacker** | Mochila tech, óculos verdes | **Planar** com paraquedas (segurar Pulo no ar) | Drones Orbitais | Controle de área, mais ímã | Cyber-Moedas |
| **Pug** | Armadura pesada laranja | **Queda pesada** (ground pound com dano em área) | Escudo/Soco de Energia | Tanque: mais HP, menos velocidade | Cyber-Moedas |

**Implementado no protótipo (07/11/2026)** — `web/src/chars.js`:
| Personagem | Traço | Ataque básico (botão ATAQUE) | Iniciais | Atributos | Preço |
|---|---|---|---|---|---|
| Gato | 2 pulos no ar | Garras Elétricas (cortes rosa/ciano) | Garras | padrão | grátis |
| Guaxinim | Plana com paraquedas (segurar PULO caindo) | Lâmina Hacker (−10% dano, +10% alcance) | Garras + Drones Orbitais | −10% HP, +30% ímã | ◆ 120 |
| Pug | Queda pesada: DASH no ar → mergulho com onda de choque em área | Soco de Energia (+35% dano, −15% alcance) | Garras | +30% HP, um pouco mais lento | ◆ 160 |
Desbloqueio com Cyber-Moedas na tela **Escolher personagem** (v0.15). Preços **[PROPOSTA]**.
**Atenção:** o pulo duplo agora é de **todos** os personagens (regra do produtor), então o traço do Gato precisa ser outro (ex.: 2 pulos aéreos ou dash mais longo) **[EM ABERTO]**.

---

## 8. Telas
Abertura → Esconderijo (hub: jogar, Laboratório, personagens, loja, missões, configurações) → Partida (HUD: HP, barra de XP/nível, tempo, pontuação, skills ativas) → Level Up (3 cartas) → Pausa → Protocolo de Backup → Fim de partida (pontuação, recorde, Sucata ganha, missões concluídas, jogar de novo).

**Tela inicial (v0.15):** limpa — botão do personagem atual (pedestal animado, nome, traço, "TROCAR ▸"), ▶ JORNADA, ∞ INFINITO · 🗺 MAPAS, ⚙ ESCONDERIJO · ◆ MISSÕES e uma fileira de ícones pequenos (Ranking, Conta, Dev, Sair).

**Escolher personagem (v0.15):** pedestal grande animado (3 quadros, folha `menu`), setas ‹ › e deslizar o dedo para trocar, fileira com os 7 personagens (✓ em uso, 🔒 bloqueado, cinza = em breve). Mostra nome, traço, ataque básico e barras de Vida, Dano, Alcance, Velocidade e Ímã. Botão: SELECIONAR / ◆ preço · DESBLOQUEAR / ▶ JOGAR (se já está em uso, abre a Jornada). Coelho, Macaco, Tatu e Corvo aparecem como **EM BREVE** com o traço proposto **[PROPOSTA]** até serem integrados.

**Pausa (v0.13):** botão ❚❚ no HUD, tecla Esc/P, botão "voltar" do Android e o app indo para o segundo plano pausam a partida (não pausa durante a transição de setor). Menu: Continuar (volta com 0,6 s de invencibilidade) · Som e música · Tremor de tela · Números de dano (salvos no aparelho) · **Encerrar partida** (segundo toque confirma; conta como fim de partida: guarda Sucata e recorde). Na tela inicial do app Android há **Sair do jogo**; o "voltar" na tela inicial também fecha o app.

---

## 9. Questões em aberto (resumo)
1. ~~Engine~~ → **web (HTML5 + JavaScript)**, empacotado para Android (decidido em 07/11; a Unity foi descartada).
2. ~~Formato do cenário~~ → **arena infinita horizontal em chunks** (decidido, seção 3.1).
3. Dash direcional ou só horizontal.
4. Duração-alvo de uma boa partida (ex.: 10–15 min) e se existe "vitória" ao atingir um tempo.
5. Quantidade de níveis por skill, limite de skills, evoluções.
6. Preço do revive em Cyber-Moedas e pacotes da loja.
7. Personagens iniciais e diferenças entre eles.
8. Placar online e login (Google Play Games?).
9. Público-alvo / faixa etária (impacta políticas de anúncios e de compras).
10. Traços e skills iniciais dos personagens (seção 7).
11. Biomas e escopo do primeiro protótipo (`docs/bestiario.md`).
12. Origem/licença da arte e quem vai produzir as folhas finais (`docs/arte.md`).
13. Pontos de atenção das regras de lógica (seção 10.7).

---

## 10. Regras de lógica de jogo (produtor, 07/11/2026)
> **Seção autoritativa.** Em caso de conflito com seções anteriores, vale esta.

### 10.1 Fluxo da partida (máquina de estados)
| Estado | Regra |
|---|---|
| **Start** | Timer global começa (`Time.timeSinceLevelLoad`). Jogador com **3 s de invencibilidade** |
| **Jogando** | Movimento livre, hordas surgindo, disparo automático de skills |
| **Level Up** | XP atinge o teto do nível → `Time.timeScale = 0`; a UI gera **3 opções aleatórias** (skills ou upgrades); a escolhida entra no inventário; `Time.timeScale = 1` |
| **Morte** | HP = 0 → o personagem cai, a tela escurece 50% e surge o pop-up de **Segunda Chance** com contador de **5 s**. O jogo **pausa** enquanto o pop-up está aberto |
| **Revive** | Anúncio ou Cyber-Moedas → **50% de HP**, **explosão que afasta todos os inimigos da tela**, **3 s de invencibilidade**, volta para Jogando. **Máximo 1 por partida** |
| **Fim (Game Over)** | Contador zerou ou revive já usado → tela com **tempo de sobrevivência, inimigos abatidos e moedas/Sucata coletadas** → transição para o Lobby |

### 10.2 Vida (HP)
- Dano por **contato** (Trigger Enter 2D).
- **I-frames de dano: 0,5 s**, piscando branco/vermelho, intangível (evita vários danos no mesmo quadro).
- **Cura (atualizada pelo produtor, 07/11):** cápsulas de vida caem **aleatoriamente de qualquer monstro**. Valores atuais (em `web/src/config.js`):
  | Monstro | Chance | Cura |
  |---|---|---|
  | Fraco | 3% | 10% do HP máximo (cápsula pequena) |
  | Médio | 6% | 20% (cápsula grande) |
  | Tanque | 25% | 20% |
  Com HP abaixo de 35%, a chance **dobra**.

### 10.3 Surgimento de inimigos (Wave Spawner)
A dificuldade escala **a cada minuto**.
| Tempo | Inimigos | Quantidade |
|---|---|---|
| 0–2 min | Apenas fracos (esquilos/ratos) | Grupos de 3 a 5 |
| 2–5 min | Entram os médios | 10 a 15 simultâneos |
| 5+ min | Entram tanques pesados e voadores | Crescente |

- Inimigos nascem **sempre fora do campo de visão da câmera** (coordenadas de viewport / fora da tela).
- Voadores **fracos** (Drone Olho, Morcego, Vaga-lume) podem surgir antes do minuto 5; voadores médios/avançados só a partir do minuto 5.

### 10.4 G Batty (XP) e nível
- **100%** dos inimigos soltam G Batty, que ficam no chão com animação de flutuação.
- O jogador tem um **CircleCollider2D Trigger** (raio de coleta). Bateria dentro do raio **voa até o jogador** (`Vector3.MoveTowards`).
- XP necessária (decidido): `XP = 100 × Nível × 1,2^(Nível−1)` → Nv1 = 100, Nv2 = 240, Nv3 = 432, Nv4 = 691, Nv5 = 995.

### 10.5 Skills ativas e passivas
- Limite de slots: **4 ativas + 4 passivas**. Nível máximo de cada skill: **8**.
- No level up, skills que o jogador **já possui têm peso maior** (para serem melhoradas até o Nv 8).
- Skills ativas criam **projéteis temporários** a partir do jogador, respeitando um **temporizador de recarga**. **Atualização (07/11):** Garras e Shurikens disparam pelo botão ATAQUE (ver 2.1); Drones e Rastro continuam automáticos.

### 10.6 Loja e save (meta-progressão)
- **Sucata (soft):** coletada em massa durante as partidas (moedas douradas caindo no cenário). Usada **só no Esconderijo** para subir os **Atributos Base Globais**: +HP, +Velocidade/Dash, +Dano, Ímã e Sorte (5 upgrades, seção 6.2).
- **Cyber-Moedas (hard):** missões diárias, recompensa de **login de 7 dias** e compras no app. Usadas para **revives** e **desbloquear personagens** (Guaxinim, Pug etc.).
- **Save em JSON** (serialização de classes) em `Application.persistentDataPath`: moedas, personagens desbloqueados e níveis do laboratório. **Não usar PlayerPrefs** para moedas e upgrades.

### 10.7 Pontos de atenção (análise da equipe)
**Decididos pelo produtor (07/11/2026):**
- Item 1 → fórmula **mista**: `XP = 100 × Nível × 1,2^(Nível−1)` (100, 240, 432, 691, 995…).
- Item 2 → **voadores fracos** (Drone Olho, Morcego, Vaga-lume) podem surgir **antes do minuto 5**; voadores médios/avançados só a partir do minuto 5.
- Item 3 → **juntar as listas**: 5 upgrades no Esconderijo (HP, Velocidade/Dash, Dano, Ímã, Sorte) — ver 6.2.
- Item 7 → durante a Segunda Chance o jogo **pausa** (`timeScale = 0`); o tempo de sobrevivência é um contador próprio que só avança em Jogando.

**Ainda abertos:** itens 4, 5, 6, 8 e 9 (são propostas técnicas/de nomenclatura; serão aplicadas como proposto se não houver objeção).
1. **Fórmula de XP:** `Nivel * 100 * 1.2` resulta em 120, 240, 360… (cresce em linha reta, não exponencial) e o exemplo diz Nv1 = 100. Opções:
   - (a) linear `120 × Nível` → 120, 240, 360, 480…
   - (b) exponencial `100 × 1,2^(Nível−1)` → 100, 120, 144, 173…
   - (c) mista `100 × Nível × 1,2^(Nível−1)` → 100, 240, 432, 691… (bate com Nv1 e Nv2 do exemplo e cresce de forma exponencial)
2. **Voadores só a partir do minuto 5:** existem voadores fracos (Drone Olho, Morcego, Vaga-lume) e médios (Coruja, Vespa, Rato-Asa, Medusa). Confirmar se a regra vale para todos. Elites e chefes ainda sem momento definido.
3. **Atributos do Esconderijo:** a nova lista (+HP, +Velocidade, +Dano) difere do Laboratório anterior (Chassi Reforçado, Propulsores, Módulo Magnético, Sorte Algorítmica — seção 6.2). Substitui ou soma?
4. **Nomes (decidido, 07/11/2026):** jogo = **Neko G**; XP = **G Batty**; moeda dourada = **Sucata**.
5. **Dano só no Trigger Enter:** se o inimigo continuar encostado quando os i-frames acabarem, não há novo "Enter", então o jogador fica dentro do inimigo sem tomar dano. **[PROPOSTA]** checar o contato também enquanto estiver sobreposto (Trigger Stay, ou checagem ao fim dos i-frames). Para centenas de inimigos com trigger, cada um precisa de **Rigidbody2D Kinematic** (mover collider sem Rigidbody2D é caro).
6. **InvokeRepeating nas skills:** usa o nome do método em texto e intervalo fixo; a passiva **Redução de Cooldown** não altera o intervalo sem cancelar e reiniciar. **[PROPOSTA]** um timer próprio por skill (também respeita `timeScale = 0`).
7. **Timer na morte:** durante o pop-up de Segunda Chance, o jogo continua rodando ou pausa? **[PROPOSTA]** pausa, e o tempo de sobrevivência é um contador próprio que só avança no estado Jogando (o `Time.timeSinceLevelLoad` não pode ser zerado nem pausado separadamente).
8. **Ímã com collider por bateria:** com centenas de baterias, desligar o collider quando a bateria começa a voar e manter o limite/fusão de baterias (`docs/arquitetura.md` §3.1).
9. **Save JSON:** também é editável em aparelhos com root. Para Cyber-Moedas (valor real), somar um checksum no arquivo e validação no servidor (`backend-liveops`).
