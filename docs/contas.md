# Contas, progresso na nuvem e ranking (Firebase)

## Como funciona no jogo
- **Convidado automático:** ao abrir o jogo, o jogador já entra como convidado (login anônimo do Firebase), sem cadastro. O progresso dele já sobe para a nuvem.
- **Criar conta (Google ou e-mail/senha):** a conta de convidado é *vinculada* à nova conta. O id continua o mesmo, então nada se perde. A partir daí, o progresso volta em qualquer aparelho.
- **Entrar numa conta que já existe** estando como convidado com progresso: o jogo avisa que o progresso de convidado deste aparelho será trocado pelo da conta, e pede confirmação.
- **Sair da conta:** o progresso fica na nuvem; o aparelho vira um convidado novo (do zero).
- **Conflito entre aparelhos:** cada gravação aumenta um contador `rev`. Ao entrar, vale o save com o maior `rev` (o mais jogado).
- **Ranking global:** maior tempo sobrevivido numa partida, com apelido (3 a 16 caracteres, editável na tela Conta) e o personagem usado. Convidados também aparecem.
- **Sem internet:** o jogo segue com o save local e o selo mostra OFFLINE.
- **Sem configuração do Firebase** (`web/src/firebaseConfig.js` vazio): **modo demonstração**. Tudo funciona, mas fica só no navegador, e o ranking traz jogadores fictícios. É o modo usado no protótipo publicado no Claude, porque aquela página bloqueia conexões externas.

Código: `web/src/cloud.js` (Firebase e demonstração com a mesma interface), telas em `web/src/ui.js` (Conta e Ranking), regras em `firestore.rules`.

Dados no Firestore:
- `players/{uid}`: `save` (o JSON do save), `rev`, `nick`, `updatedAt`
- `leaderboard/{uid}`: `nick`, `best` (segundos), `char`, `kills`, `updatedAt`

## Passo a passo para ligar o Firebase de verdade
1. Entre em https://console.firebase.google.com e crie um projeto (por exemplo, "Neko G"). O Google Analytics é opcional.
2. **Authentication → Começar → Método de login**: ative **Anônimo**, **Google** (escolha o e-mail de suporte) e **E-mail/senha**.
3. **Firestore Database → Criar banco de dados**: modo de produção, local `southamerica-east1 (São Paulo)`.
4. Ainda no Firestore, aba **Regras**: apague o conteúdo, cole o arquivo `firestore.rules` deste projeto e toque em **Publicar**.
5. **Configurações do projeto → Seus apps → Web (`</>`)**: registre o app "Neko G Web" (sem Hosting) e copie o bloco `firebaseConfig`. Cole os valores em `web/src/firebaseConfig.js`, ou me mande que eu colo. Esses valores **não são senha**: a configuração web do Firebase é pública por natureza, e quem protege os dados são as regras do passo 4.
6. **Authentication → Configurações → Domínios autorizados**: adicione o domínio onde a versão web ficar hospedada (`localhost` já vem na lista).
7. **Android** (para o login com Google dentro do app):
   - **Configurações do projeto → Adicionar app → Android**, pacote `com.nekog.game`.
   - Informe a impressão digital **SHA-1** do certificado. Para a de teste: `cd android-app/android && ./gradlew signingReport`. Quando for publicar na Play Store, adicione também a SHA-1 da chave de assinatura do Google Play (Play Console → Integridade do app).
   - Baixe o `google-services.json` e coloque em `android-app/google-services.json`.
   - Rode `npm install` e `npm run prepare:android` na pasta `android-app`. O script copia o arquivo para o projeto nativo.

## Conta master (desenvolvedor)
- Login: **usuário `renanmaster`** (o jogo transforma em `renanmaster@nekog.dev`) e a senha combinada. O campo de login aceita e-mail ou usuário.
- Privilégios: Sucata e Cyber-Moedas infinitas (999.999, repostas a cada gravação), todos os personagens liberados, revive sem limite, **Painel DEV** no menu (invencível, Esconderijo no máximo, missões/check-in de novo, zerar recorde) e botão **🛠 DEV** durante a partida (+nível, +1 min, chamar chefão, limpar a tela, curar, invencível).
- Partidas da conta DEV **não entram no ranking** (seriam imbatíveis com esses poderes).
- **A senha não fica no código do jogo.** No Firebase, quem é DEV é decidido pelo documento `admins/{uid}`, que só pode ser criado pelo Console (as regras bloqueiam escrita pelo app). No modo demonstração, o código guarda só um *hash* da senha.
- Para criar no Firebase:
  1. **Authentication → Usuários → Adicionar usuário**: e-mail `renanmaster@nekog.dev` e a senha.
  2. Copie o **UID** que aparece na lista.
  3. **Firestore → Iniciar coleção** `admins` → ID do documento = o UID → um campo `role` (string) = `dev` → Salvar.
- Como `nekog.dev` não é um e-mail real, "Esqueci a senha" não chega a lugar nenhum para essa conta. Para trocar a senha: exclua o usuário no Console, crie de novo e atualize o documento em `admins` com o novo UID.

## Login com Google no app Android
Pop-ups de login não funcionam dentro do WebView do app. Por isso, no Android, o jogo usa o plugin `@capacitor-firebase/authentication` (com `skipNativeAuth: true`, em `capacitor.config.json`): o login do Google acontece na tela nativa do Android, e o token é passado ao Firebase do jogo. No navegador, abre a janela de login do Google normalmente.

## Limitações conhecidas / próximos passos
- **Trapaça no ranking:** as regras impedem gravar o recorde de outra pessoa, piorar um recorde ou valores absurdos (acima de 10 h), mas um jogador técnico ainda consegue enviar um tempo falso pelo próprio aparelho. Quando o jogo tiver público, o ideal é validar o recorde numa Cloud Function e ligar o **App Check** (Play Integrity).
- O SDK do Firebase é carregado de `www.gstatic.com` (versão 13.2.0) na primeira vez em que o jogo abre online.
- Exclusão de conta pelo próprio jogador (exigida pela Play Store para apps com login): ainda falta um botão "Excluir conta e dados".
