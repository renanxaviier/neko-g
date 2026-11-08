# Estado do projeto e próximos passos (atualizado em 08/11/2026)

## Onde paramos
- **Protótipo (dev):** artifact "Neko G — protótipo (dev)" (slug 6d96f83e-1a43-42a6-aceb-e34735bd4a27), versão 1794100565-ea12.
- **Repositório:** github.com/renanxaviier/neko-g (público). Cada envio gera um APK de teste na aba Actions ("APK Android (teste)" → Artifacts → neko-g-apk). APK assinado com a chave de teste fixa `android-app/keystore/debug.keystore` (SHA-1 `18:B0:07:8E:DE:44:0E:99:40:7B:34:15:6A:24:48:37:01:7C:34:E5`).
- **Feito hoje:** setor submerso Cyber Deep (física de nado, efeito de água, música própria), monstros e chefões aquáticos, folhas de sprites por setor, lote de efeitos (números de dano, rastros, distorção, glitch, bloom adaptativo), pausa/sair, **modo Jornada etapa 1** (GDD 3.5).

## Aguardando o produtor
- Firebase: bloco `firebaseConfig` (app Web), `google-services.json` (app Android com a SHA-1 acima), Authentication (Anônimo, Google, E-mail/senha) e Firestore criados; UID da conta master `renanmaster@nekog.dev` para o documento `admins/{uid}`. Depois: colar a config em `web/src/firebaseConfig.js`, o JSON em `android-app/google-services.json`, publicar `firestore.rules`.
- AdMob (ID do app e do anúncio premiado) e conta no Play Console — adiados.
- Folhas de arte: Fábrica, Torre, quadros de nado dos personagens.

## Arte recebida no fim do dia (ainda não integrada)
- `assets/concept/personagens_novos.jpg`: **Coelho Cyber**, **Macaco Cyber** e **Tatu Cyber** — pulo, pulo duplo (2 quadros), queda, aterrissagem, deslizar na parede e **agarrar a borda** (ledge grab, mecânica nova).
  - Atenção: o rótulo "2. MACACO" está abaixo da 2ª linha; a 3ª linha mistura Tatu (pulo, bola) com uma variação do Macaco (queda com jato, aterrissagem, parede, borda). A 4ª linha é o Tatu completo.
  - `assets/concept/personagens_novos2.jpg` (recebida em seguida) completa os 3: parado, correr (2), dash, ataque, dano e morte. Coelho: ataque corpo a corpo (meia-lua rosa), morte 2 quadros. Macaco: **ataque à distância** (granada/dados), linhas 2 e 3 são o macaco (a 2ª está rotulada "1. COELHO" por engano; usar uma das duas). Tatu: garra no chão; dash = **bola rolando**.
  - Proposta de identidade [PROPOSTA]: Coelho = pulo alto/3 pulos no ar e meia-lua; Macaco = ataque à distância e agarrar bordas; Tatu = tanque, dash em bola que atravessa inimigos.
- `assets/concept/chefoes_novos.jpg`: **Titã Sobrecarregado** (andar 3, início do salto, no ar, impacto), **Rainha da Sucata** (pairar 2, dash, agarrar parede, virar) e **Sentinela de Dados** (voo 4, teleporte saindo/voltando, descida rápida).
  - Faltam ataque, dano e morte — dá para fazer por código (como nos chefões atuais), mas quadros próprios ficam melhores.

- `assets/concept/armas_vfx.jpg`: efeitos de armas. **Fogo:** laser (8 q.), rajada com rastros (6), plasma (8), ondas de choque (6), explosão glitch (8). **Brancas:** corte de dados (6), golpe de energia com meia-lua (8), arcos elétricos (6), martelo de impacto (8), garras energizadas (6).
  - Ideia do produtor: **armas por personagem**, como upgrade de uso exclusivo, escolhidas pela característica de cada um. Proposta inicial [PROPOSTA]: Gato → garras energizadas; Guaxinim → corte de dados / blaster glitch; Pug → martelo de impacto; Coelho → lâmina de energia (meia-lua); Macaco → laser, rajada ou plasma; Tatu → ondas de choque / arcos elétricos.

- `assets/concept/menu_personagens.jpg`: **tela de escolher personagem**: 3 quadros de "parado" sobre um pedestal neon para Gato, Guaxinim, Pug, Coelho, Macaco, Tatu e **Corvo (personagem novo)**.
  - Observações: abaixo do Pug há uma linha solta de ondas de choque e uma linha extra do Coelho (pedestais de cores trocadas) — ignorar. O Coelho do menu original era cinza; **corrigido** pelo produtor: usar `assets/concept/menu_coelho.jpg` (marrom, igual à folha de jogo). O **Corvo** só tem os quadros do menu; para ser jogável faltam as folhas de jogo (parado, correr/voar, pulo, dash, ataque, dano, morte).

## Combinado para a próxima sessão
1. ~~Mais regras e objetivos na Jornada~~ — **feito** (GDD 3.5b: Elite, Colete, modificadores, estrelas).
2. **Interface de usuário melhor** (HUD e telas).
3. ~~**Menu do jogo melhor**~~ — **feito em 08/11** (v0.15): tela inicial limpa + tela **Escolher personagem** com os pedestais animados (GDD §8).
4. ~~Mapa de progressão da Jornada~~ — **feito** (caminho com nós, estrelas e detalhes).
5. ~~Armas por personagem~~ — **feito** para Gato, Guaxinim e Pug (GDD §7). Coelho/Macaco/Tatu junto com a integração deles.
6. ~~Integrar Coelho, Macaco, Tatu e os 3 chefões~~ — **feito** (GDD §7 e 3.2b). Falta: Corvo (folhas de jogo), armas do Coelho/Macaco/Tatu, agarrar borda.
- ~~Etapa 2 da Jornada: nível do personagem + talentos~~ — **feito** (GDD 3.5c).
- Próximo: etapa 3 da Jornada (ranking de mapa mais longe), armas do Coelho/Macaco/Tatu, agarrar borda, Corvo.
