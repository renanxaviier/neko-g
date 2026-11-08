# Hospedagem em nekog.com (Firebase Hosting)

O jogo web é só a pasta `web/` (arquivos estáticos). Hospedando no **Firebase Hosting**, o site fica no mesmo projeto das contas e do ranking, o Firebase de verdade passa a funcionar (a prévia do Claude bloqueia conexões externas) e o certificado HTTPS é automático.

## O que só você pode fazer
1. **Registrar o domínio `nekog.com`** num registrador (Cloudflare, Namecheap, GoDaddy, Hostinger etc.). Antes, confira se está livre.
2. **Criar o projeto no Firebase** (passo a passo em `docs/contas.md`).

## Publicar (no seu computador, uma vez)
1. Instale o Node.js (nodejs.org) e depois: `npm install -g firebase-tools`
2. Na pasta do projeto: `firebase login` e `firebase use --add` (escolha o projeto do Neko G)
3. `firebase deploy` → publica o site (pasta `web/`) **e** as regras do banco (`firestore.rules`) juntos.
4. O site já fica no ar em `https://SEU-PROJETO.web.app`.

## Ligar o domínio
1. Console do Firebase → **Hosting → Adicionar domínio personalizado** → `nekog.com` (e depois `www.nekog.com`, redirecionando para o principal).
2. O Firebase mostra registros DNS (tipo A/TXT); copie-os no painel do registrador do domínio.
3. Espere a verificação (minutos a algumas horas) — o HTTPS é emitido sozinho.
4. **Authentication → Configurações → Domínios autorizados:** adicione `nekog.com` e `www.nekog.com` (senão o login com Google falha no site).

## O domínio também serve para
- **Política de privacidade** (`nekog.com/privacidade`): exigida pela Play Store e pelo AdMob.
- **app-ads.txt** (`nekog.com/app-ads.txt`): arquivo do AdMob que comprova que os anúncios do app são seus; o site do desenvolvedor informado na Play Store precisa ser este domínio.
- **Exclusão de conta** (`nekog.com/excluir-conta`): página exigida pela Play Store para apps com login.

Atualizar o jogo depois: editar os arquivos e rodar `firebase deploy` de novo.
