# Estado do projeto e próximos passos (atualizado em 07/11/2026, fim do dia)

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

## Combinado para a próxima sessão
1. **Mais regras e objetivos** na Jornada (novos tipos de fase, fase elite, eventos).
2. **Interface de usuário melhor** (HUD e telas).
3. **Menu do jogo melhor** (tela inicial / hub). Pedido do produtor: os personagens saem da tela inicial e vão para uma tela própria **"Escolher personagem"** (a tela inicial fica mais limpa).
4. **Mapa de progressão da Jornada** (caminho visual com os mapas e fases, bifurcações).
5. Integrar os novos personagens (quando chegarem os quadros que faltam) e os 3 novos chefões.
- Em seguida, etapa 2 da Jornada: nível do personagem permanente + árvore de talentos.
