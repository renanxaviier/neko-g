
## AdMob configurado (08/11/2026)
- Conta AdMob da RX Games (editor `pub-6649269264969475`, pagamentos AdSense Brasil).
- App Android **Neko G**: `ca-app-pub-6649269264969475~7641906932` (status "Requer revisão": ainda não está na Play Store).
- Bloco **Premiado** "Revive - Protocolo de Backup" (prêmio: 1 Revive): `ca-app-pub-6649269264969475/4496868842`.
- Troca teste/real: `web/src/build.js` (`BUILD.ads`). APKs de teste (GitHub Actions) usam **sempre** os blocos de teste do Google.
  A versão da loja é preparada com `ADS_MODE=real npm run prepare:android`: IDs reais no jogo e no AndroidManifest, e o formulário de consentimento do Google (UMP) quando exigido.
- Pendências: completar o perfil de pagamentos no AdMob (sem isso o app não entra em revisão); publicar na Play Store e vincular a loja ao app no AdMob; `app-ads.txt` no site do jogo (o mesmo domínio informado na ficha da Play Store); configurar a mensagem de consentimento em AdMob → Privacidade e mensagens.
- Nunca tocar nos anúncios reais nos próprios aparelhos: cadastrar o celular como dispositivo de teste (AdMob → Configurações → Dispositivos de teste).
