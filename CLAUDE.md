# Projeto: Plataforma 2D Roguelite de Hordas (Cyberpunk Neon)

## Visão geral
- Gênero: plataforma 2D de ação + roguelite de hordas (estilo Vampire Survivors), com movimentação ágil estilo Metroidvania (dash aéreo, wall jump, coyote time, jump buffer).
- Plataforma: **Android** (inicialmente). Orientação **retrato**, responsiva a diferentes proporções de tela.
- Tema: cyberpunk neon; personagens jogáveis são animais (ex.: Guaxinim); inimigos cibernéticos (drones de lixo, ratos robóticos, cães mecânicos).
- Partida: ondas crescentes → inimigos soltam G Batty (XP) → level up pausa e oferece 1 de 3 skills → sobreviver o máximo e pontuar.
- Revive (Protocolo de Backup): contagem de 5 s, volta com 50% de HP via anúncio recompensado ou Cyber-Moedas. **Máximo 1 por partida.**
- Economia: Sucata (soft) para o Laboratório de Upgrades permanentes (níveis 1–5); Cyber-Moedas (hard) via check-in, missões e loja, para personagens, skins e revive.

- Visual: pixel art com **animações fluidas e efeitos sempre presentes** (pilar visual). Render na resolução nativa, movimento suave sub-pixel, squash & stretch, partículas, brilho neon, hit stop.
- Música: tema principal "Steel Laced Pursuit" (~140 BPM) em `assets/audio/music/` é a **referência de direção musical** (ver `docs/arte.md` §9).
- Personagens: Gato (inicial), Guaxinim Hacker, Pug. Inimigos: 34 (ver `docs/bestiario.md`). Arte conceitual em `assets/concept/`.

**Fonte da verdade do design: `docs/GDD.md`.** Consulte também `docs/bestiario.md` e `docs/arte.md` antes de implementar.

## Stack técnica (decidida em 07/11/2026)
- **Jogo 100% web: HTML5 Canvas 2D + JavaScript (módulos ES), sem bibliotecas externas.** Código em `web/`. Depois será empacotado como app Android (ex.: Capacitor). Detalhes em **`docs/arquitetura.md`**.
- A Unity foi abandonada; os scripts C# estão em `archive/unity-Assets/` apenas como referência de lógica.
- **Pilar técnico: jogo "democrático"** — rodar bem em celulares simples: pools fixos, grade espacial, neon pré-desenhado, resolução limitada a 2×, HUD em DOM atualizado só quando muda.
- Sprites em **folhas separadas** (`web/assets/sprites/{core,boss,bio_*}.webp`, geradas por `tools/build_atlas.py`): o núcleo carrega sempre; as peças de cenário só do setor atual (e do próximo quando o portal abre). Nenhuma folha pode passar de 4096 px.
- Dois modos: **Infinito** (setores) e **Jornada** (`journey.js`: mapas com fases + chefe; `JOURNEY` em config.js; GDD 3.5).
- Música por setor (`TRACKS` em audio.js; `music` no bioma). Faixas compostas por código em `tools/compose.py` (sintetizador offline → MP3).
- Testes: Chrome headless + bot (`?bot=1&speed=N&god=1&debug=1&seed=N`). Protótipo: artifact **"Neko G — protótipo (dev)"** (slug 6d96f83e-1a43-42a6-aceb-e34735bd4a27) é o que recebe as atualizações. O primeiro link ("Neko G — protótipo") foi tornado público pelo produtor e não pode ser atualizado daqui.

## Decisões em aberto
Ver seção 9 do `docs/GDD.md`.

## Equipe de agentes (`.claude/agents/`)
| Agente | Responsabilidade |
|---|---|
| `game-designer` | Regras, loop, skills, inimigos, ondas, pontuação, GDD |
| `economy-designer` | Moedas, custos do Laboratório, preços, missões, check-in, balanço da economia |
| `game-architect` | Engine, arquitetura, performance mobile, builds Android e Google Play |
| `gameplay-engineer` | Movimentação, combate automático, skills, inimigos, controles touch |
| `procedural-generator` | Geração de estágios/arenas, diretor de ondas, sorteio de skills no level up |
| `monetization-ads` | Revive por anúncio, compras no app (Google Play Billing), consentimento, políticas |
| `ui-ux-designer` | HUD, controles touch em retrato, level up, revive, Esconderijo, loja |
| `art-audio-director` | Estilo neon, legibilidade, sprites, VFX, música e SFX |
| `backend-liveops` | Save, carteira de moedas, validação de compras, missões, placar, analytics, config remota |
| `qa-balance-tester` | Testes, bugs, performance, balanceamento de partida e economia |
| `web-wiki` | Site/wiki do jogo (história, personagens, monstros, jogabilidade, download do APK) em `site/` |

## Convenções
- Documentação e comentários em português (BR); identificadores de código em inglês.
- Documentos em `docs/`: `GDD.md`, `economia.md`, `monetizacao.md`, `arquitetura.md`, `analytics.md`, `arte.md`, `ui/`.
- Todo valor de balanceamento (física, skills, ondas, custos, preços, recompensas) fica em arquivos de configuração, nunca fixo no código.
- Itens de design não aprovados ficam marcados como **[PROPOSTA]**; pendências como **[EM ABERTO]**.
- Contas/ranking: Firebase (convidado + Google + e-mail). `web/src/cloud.js`, `firestore.rules`, guia em `docs/contas.md`. Sem config = modo demonstração (é o que roda no artifact, que bloqueia rede externa).
