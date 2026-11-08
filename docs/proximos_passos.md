# Estado do projeto e próximos passos (atualizado em 07/11/2026, fim do dia)

## Onde paramos
- **Protótipo (dev):** artifact "Neko G — protótipo (dev)" (slug 6d96f83e-1a43-42a6-aceb-e34735bd4a27), versão 1794100565-ea12.
- **Repositório:** github.com/renanxaviier/neko-g (público). Cada envio gera um APK de teste na aba Actions ("APK Android (teste)" → Artifacts → neko-g-apk). APK assinado com a chave de teste fixa `android-app/keystore/debug.keystore` (SHA-1 `18:B0:07:8E:DE:44:0E:99:40:7B:34:15:6A:24:48:37:01:7C:34:E5`).
- **Feito hoje:** setor submerso Cyber Deep (física de nado, efeito de água, música própria), monstros e chefões aquáticos, folhas de sprites por setor, lote de efeitos (números de dano, rastros, distorção, glitch, bloom adaptativo), pausa/sair, **modo Jornada etapa 1** (GDD 3.5).

## Aguardando o produtor
- Firebase: bloco `firebaseConfig` (app Web), `google-services.json` (app Android com a SHA-1 acima), Authentication (Anônimo, Google, E-mail/senha) e Firestore criados; UID da conta master `renanmaster@nekog.dev` para o documento `admins/{uid}`. Depois: colar a config em `web/src/firebaseConfig.js`, o JSON em `android-app/google-services.json`, publicar `firestore.rules`.
- AdMob (ID do app e do anúncio premiado) e conta no Play Console — adiados.
- Folhas de arte: Fábrica, Torre, quadros de nado dos personagens.

## Combinado para a próxima sessão
1. **Mais regras e objetivos** na Jornada (novos tipos de fase, fase elite, eventos).
2. **Interface de usuário melhor** (HUD e telas).
3. **Menu do jogo melhor** (tela inicial / hub).
4. **Mapa de progressão da Jornada** (caminho visual com os mapas e fases, bifurcações).
- Em seguida, etapa 2 da Jornada: nível do personagem permanente + árvore de talentos.
