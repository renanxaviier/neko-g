# Estado do projeto e próximos passos (atualizado em 08/11/2026, 22h)

## Onde paramos
- **Versão:** v0.26 teste. Tudo está no repositório **github.com/renanxaviier/neko-g** (branch `main`).
- **Protótipo no Claude:** artifact "Neko G — protótipo (dev)", slug `6d96f83e-1a43-42a6-aceb-e34735bd4a27`, versão **1794174737-a474** (usar como `base_version` no próximo envio).
- **Site/wiki:** artifact "Neko G — Wiki", slug `95b9084e-ea7b-49a5-b1d4-7356d2752b9e`. Código em `site/`. Scripts que geram as imagens e o HTML: `tools/wiki/` (`gen_site.py` tem os dados escritos à mão).
- **Ponto de volta (rollback):** branch `versao-0.17.2`.

### Feito nesta sessão (v0.18 → v0.25)
- Pacote para testadores, notificações (sino), Expedição na Jornada, abertura RX Games, contagem 3-2-1 no início de fase (3 s).
- **Firebase ligado** (projeto `neko-g`): login Anônimo, Google e E-mail/senha; app Web (config em `web/src/firebaseConfig.js`); app Android com SHA-1 da chave de teste; Firestore em São Paulo com `firestore.rules`; `google-services.json` com os clientes OAuth. **Login com Google no APK funcionando.**
- **Conta master:** renanxavieraquino1@gmail.com, UID `MWOL5PQnSYNT9hYwQg3qnIoDOUX2`, documento `admins/{uid}` com apelido `kiisuq`. Recorde antigo no ranking mantido (decisão do produtor).
- **AdMob:** conta criada; app Android `ca-app-pub-6649269264969475~7641906932`; bloco Premiado do revive `ca-app-pub-6649269264969475/4496868842`. APKs de teste usam sempre anúncios de teste; versão da loja com `CHANNEL=store` (ou `ADS_MODE=real`) em `android-app/scripts/prepare.mjs`. Detalhes em `docs/monetizacao.md`.
- **Atualização pelo app (testadores):** cada build do `main` vai para o Firebase App Distribution, grupo `testadores`, e o jogo mostra "Nova versão → Atualizar". CI autentica no Google **sem chave** (pool `github`, provedor `neko-g-actions`, conta de serviço `neko-g-ci`). Guia em `docs/testes.md`.
- **v0.24:** dificuldade progressiva entre mapas da Jornada (`JOURNEY.ramp`) e veteranos dourados.
- **v0.25:** modo história (13 capítulos, `web/src/story.js`, roteiro em `docs/roteiro.md`, história aprovada em `docs/historia.md`); arma exclusiva virou **ataque especial com barra de MP** (`WEAPONS.special`, botão ESPECIAL, dano ×3,2); armas do Coelho (Lâmina Meia-Lua), Macaco (Plasma de Dados) e Tatu (Ondas de Choque).
- **Propostas escritas:** PvP em salas estilo Grand Chase (`docs/pvp.md`, [PROPOSTA]); agente `web-wiki` em `.claude/agents/`.

## Feito depois da pausa (08/11, noite) — v0.26
- Anúncio do revive: o jogo só volta quando o anúncio é fechado (corrigido e confirmado pelo produtor).
- Conta → **Excluir conta e dados** (exigência da Play Store).
- E-mail do produtor no grupo **testadores** do App Distribution.
- AdMob → Privacidade e mensagens: aviso de consentimento "Neko G - consentimento (UE/Reino Unido)" **salvo como rascunho** (Não consentir ligado, inglês + português). Falta o link da política para publicar.
- **GitHub Pages ligado:** wiki pública em https://renanxaviier.github.io/neko-g/ (workflow `.github/workflows/pages.yml`, publica a pasta `site/`).
- Política de Privacidade escrita (PT/EN) em `site/privacidade.html`, com a seção `#excluir`. Tem o marcador `{{CONTATO}}`; o workflow **não publica** a página enquanto o marcador existir.

## Aguardando o produtor
- **Criar o e-mail de contato da RX Games** (ex.: contato.rxgames@gmail.com) e mandar só o endereço. Depois: trocar `{{CONTATO}}` em `site/privacidade.html` (4 lugares em PT e EN), subir, colocar `https://renanxaviier.github.io/neko-g/privacidade.html` no app em AdMob → Privacidade e mensagens → Regulamentações europeias → mensagem rascunho → Selecionar apps → URL da Política de Privacidade, e **Publicar** a mensagem.
- Adicionar e-mails ao grupo **testadores** (Firebase → App Distribution) e instalar uma vez pelo convite; confirmar se o aviso "Nova versão" aparece no celular.
- Completar o **perfil de pagamentos** no AdMob (sem isso o app não entra em revisão).
- Revisar o roteiro (`docs/roteiro.md`) e jogar a v0.25: dificuldade dos mapas, valor do especial (MP e dano).
- Play Console (conta de desenvolvedor), quando quiser publicar.

## Próximos passos sugeridos
1. Atualizar o site/wiki (armas novas, ataque especial, modo história, download pelo App Distribution) com o agente `web-wiki`.
2. Ajustes de equilíbrio com o retorno dos testadores (`JOURNEY.ramp`, `WEAPONS.special`).
3. Retratos em busto para as cenas da história (hoje usam os pedestais da tela de personagens).
4. Preparar a Play Store: AAB assinado com chave de envio, política de privacidade e exclusão de conta, teste fechado (12 testadores por 14 dias), vincular o app no AdMob, `app-ads.txt` no site.
5. Corvo jogável (faltam as folhas de jogo), agarrar a borda, ranking da Jornada.
6. PvP: começar pela fase F0 (cooperativo de 2) depois do lançamento (`docs/pvp.md`).

## Como retomar (técnico)
- Fonte de trabalho: `/home/claude/web`, `/home/claude/docs`, `/home/claude/tools`; o repositório clonado em `/home/claude/neko-g` (copiar com `cp -a web/. neko-g/web/`). Se a máquina for nova, basta clonar o repositório: tudo está nele.
- Teste local: `cd web && python3 -m http.server 8765`; testes automáticos (Playwright + Chrome) em `tools/tests/` (`t_smoke.py`, `t_story.py`, `t_sp.py`, `t_wpn.py`, `t_ramp.py`, `t_lag.py`…).
- Atlas de sprites: os quadros recortados ficam em `/tmp/ext/` (temporário). Se sumirem, regenerar com os scripts `tools/build_*.py` e `tools/extract_sprites.py` a partir de `assets/concept/`, depois `python3 tools/build_atlas.py`.
- Roteiro legível: `node tools/gen_roteiro.mjs` (copiar `story.js`, `boss.js`, `config.js` como `.mjs`; ver o próprio script).
