# Arquitetura Técnica (v0.2 — stack web)

## 1. Decisão (07/11/2026): jogo 100% web, empacotado para Android
| Item | Definição |
|---|---|
| Tecnologia | **HTML5 Canvas 2D + JavaScript (módulos ES)**, sem bibliotecas externas |
| Plataforma inicial | Navegador (protótipo jogável por link) → **Android** empacotado como app (ex.: Capacitor) |
| Motivo (produtor) | Evitar o trabalho manual na Unity: o jogo é construído e testado de ponta a ponta pelo Claude (Chrome headless + bot de testes) |
| Código | `web/` (`index.html` + `web/src/*.js` + `web/assets/`) |
| Unity | Abandonada. Os scripts C# ficam em `archive/unity-Assets/` só como referência de lógica |

**Riscos aceitos:** anúncios e compras dependem de plugins do empacotador (a confirmar no momento da integração); desempenho com hordas grandes em aparelhos simples exige cuidado constante (ver §3).

## 2. Estrutura do código (`web/src/`)
| Arquivo | Responsabilidade |
|---|---|
| `config.js` | **Todos os números de balanceamento** (física, vida, XP, limites) |
| `main.js` | Inicialização, laço com passo fixo de 60 Hz + desenho interpolado, bot de testes |
| `game.js` | Gerenciador da partida: estados (Title, Start, Playing, LevelUp, Revive, GameOver), vida, i-frames, XP, revive, save |
| `player.js` | Movimentação: pulo variável, coyote time, jump buffer, pulo duplo, wall slide/jump, dash com i-frames |
| `world.js` + `chunks.js` | Cenário infinito em chunks (sorteio ponderado, encaixe por altura, espelhamento, memória do layout) e colisão por tiles |
| `enemies.js` | 7 inimigos com IA simples, tiros inimigos, spawner por minuto (GDD 10.3), explosão do revive |
| `skills.js` | 4 ativas + 4 passivas, níveis 1–8, evoluções, sorteio das cartas |
| `pickups.js` | G Batty (XP), Sucata, Health Packs, ímã |
| `fx.js` | Partículas, golpes, raios, rastro do dash, tremor de tela |
| `render.js` | Desenho: sprites com brilho pré-desenhado, parallax, setas de borda, debug |
| `audio.js` | Música com loop sem o fade-out (compassos 15→87 a 140 BPM) e efeitos sonoros sintetizados |
| `ui.js` | HUD, cartas, Segunda Chance, Fim de Jogo (HTML sobre o canvas) |
| `input.js` | Teclado + toque (joystick flutuante, PULO, DASH) com buffer |

## 3. Diretrizes de desempenho (jogo "democrático")
- **Pools fixos** para inimigos (150), projéteis, baterias (300, com fusão ao lotar), partículas e efeitos: nada é criado/destruído durante a partida.
- **Grade espacial** para consultas de proximidade (skills, separação de inimigos).
- **Neon "assado"**: o brilho é desenhado uma vez nos sprites e nos chunks (cache LRU de 8 chunks); nada de blur em tempo real.
- Resolução limitada a 2× a densidade da tela; visual pixel art (sem suavização) com movimento suave (interpolado).
- DOM do HUD só é atualizado quando o valor muda.
- **Medição:** `?debug=1` mostra FPS e contagem de entidades; `window.__perf` mede o custo por quadro.
- Teste de estresse (07/11, Chrome desktop headless): 10 min de partida, 42 inimigos simultâneos, < 1 ms de trabalho por quadro, 4 MB de memória JS. **Falta validar num celular Android simples.**

### 3b. Fluidez e 90/120 Hz (v0.17, 08/11/2026)
- **Taxa da tela reestimada a cada 2 s** (telas LTPO como a do S25 Ultra mudam 60↔120 Hz sozinhas): período = percentil 20 dos intervalos; "lento" = quadro que perdeu a vez da tela. A resolução só muda quando a taxa ficou estável entre duas janelas.
- **Efeitos de tela cheia** (distorção, glitch, bloom) saem primeiro: q cai para 0,6 quando mais de 4% dos quadros atrasam, antes de baixar a resolução.
- **Pausa de impacto** dos golpes comuns limitada a uma a cada `RUN.hitStopGap` (0,45 s) e mais curta (18–30 ms). Antes cada acerto congelava 25 ms e parecia queda de quadros.
- **App Android pede o modo de tela mais rápido** (`MainActivity` gerado por `android-app/scripts/prepare.mjs`: `preferredDisplayModeId` / `preferredRefreshRate`), senão o WebView fica em 60 Hz.
- **Medidor no jogo:** Pausa → "Mostrar desempenho" (FPS/Hz, resolução, ms de CPU por quadro, lógica, desenho, quadros lentos, inimigos/itens/efeitos).
- Medição de 08/11 no Chrome sem GPU: lógica + desenho ≈ 1 ms de CPU por quadro (4 ms com a CPU 4× mais lenta); o gargalo, quando houver, é GPU/composição.

## 4. Testes automáticos
- Servidor local (`python3 -m http.server`) + Chrome headless (Playwright) em viewport de celular.
- Parâmetros: `?seed=N` (cenário reproduzível), `?bot=1` (joga sozinho), `?speed=N` (acelera), `?god=1` (invencível), `?loop=1` (recomeça após o fim), `?debug=1`.

### 4b. Envios ao GitHub (v0.17)
Só enviar lotes fechados e testados (smoke test do Infinito e da Jornada + telas novas). A compilação do APK cancela a anterior se chegar um envio novo, usa cache do npm/Gradle e tenta de novo até 3 vezes as etapas de rede. `[skip apk]` na mensagem do commit pula a compilação (ex.: só documentação). O APK sai como `neko-g-apk-<número da execução>`.

## 5. Save
- Web: JSON no `localStorage` (`neonpaws.save.v1`): Sucata total, recorde, partidas, níveis do Esconderijo.
- Nuvem: `cloud.js` sincroniza o mesmo JSON com o Firestore (`players/{uid}`) e mantém o ranking (`leaderboard/{uid}`). Cada `saveGame()` sobe `rev` e agenda o envio (2,5 s). Sem `firebaseConfig.js` preenchido: modo demonstração local. Ver `docs/contas.md`.
- App Android: o mesmo JSON em armazenamento do app (ex.: Preferences/Filesystem do empacotador) + validação no servidor para Cyber-Moedas (GDD 10.7, item 9).

## 6. Próximos passos técnicos
1. Testar no celular (link do protótipo) e ajustar controles e balanceamento.
2. Esconderijo (loja de upgrades com Sucata) e persistência.
3. Empacotar para Android, integrar anúncios recompensados e compras (confirmar plugins atuais) e o fluxo de consentimento.
4. Arte final: substituir as formas provisórias pelos sprites (PNG transparentes em grade).
