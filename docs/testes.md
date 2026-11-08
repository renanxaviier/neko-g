# Teste com testadores (v0.18)

## Como distribuir
- **Agora (rápido):** APK do GitHub Actions ("APK Android (teste)" → Artifacts → `neko-g-apk-<número>`). O testador precisa permitir "instalar apps de fontes desconhecidas".
- **Para a loja:** conta pessoal nova no Google Play precisa de **teste fechado com pelo menos 12 testadores inscritos por 14 dias seguidos** antes de pedir a produção. Para isso falta: conta no Play Console, build de loja (AAB assinado com chave de produção), política de privacidade e formulário de segurança de dados. **[EM ABERTO]**

## O que pedir aos testadores
1. Jogar pelo menos 3 partidas (Jornada e Infinito) e trocar de personagem.
2. Testar as Opções (tamanho/transparência dos botões, canhoto, ataque automático ligado e desligado).
3. Responder pelo botão 💬 Feedback (nota, assuntos, texto). O diagnóstico do aparelho vai junto.
4. Perguntas-chave: retrato ou paisagem? ataque automático ou manual? onde travou ou ficou confuso? a dificuldade subiu rápido demais?

## Voltar para a versão anterior
Antes do pacote dos testadores: ramo `versao-0.17.2` no GitHub e versão `1794146563-4738` do protótipo (dev).

## Atualização pelo app (Firebase App Distribution) — 08/11/2026
- Cada build do `main` no GitHub Actions é enviado automaticamente ao grupo **testadores** do Firebase App Distribution (projeto neko-g), com as notas do commit.
- Para entrar no teste: o produtor adiciona o e-mail em Firebase → App Distribution → Testadores e grupos → **testadores**. O testador recebe um convite por e-mail, aceita e instala o APK (pelo navegador ou pelo app "App Tester").
- Depois de instalado, ao abrir o jogo aparece o pedido para **ativar alertas de versão nova** (login Google do testador, uma vez só). A partir daí, quando sair build novo, o jogo mostra "Nova versão → Atualizar"; um toque baixa e o Android pede para instalar.
- Só funciona para e-mails que estão no grupo. A versão da loja (`CHANNEL=store`) não tem esse aviso: lá quem atualiza é a Play Store.
- CI sem chave secreta: o GitHub se autentica no Google pela Federação de identidade (pool `github`, provedor `neko-g-actions`, só o repositório renanxaviier/neko-g) e usa a conta de serviço `neko-g-ci` (papel: Administrador do App Distribution).
