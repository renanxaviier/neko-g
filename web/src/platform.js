// Ponte com o app Android (Capacitor). No navegador tudo cai no modo web (anúncio simulado etc.).
// No app, os plugins nativos são acessados pelo objeto global window.Capacitor (sem bundler).

import { BUILD } from './build.js';

// AdMob (conta da RX Games). APKs de teste usam SEMPRE os blocos de teste do Google (nunca toque nos anúncios reais).
// A versão da loja é gerada com ADS_MODE=real (veja android-app/scripts/prepare.mjs e o workflow do APK).
const ADMOB = {
  real: { app: 'ca-app-pub-6649269264969475~7641906932', rewarded: 'ca-app-pub-6649269264969475/4496868842' },   // Neko G · Revive - Protocolo de Backup
  test: { app: 'ca-app-pub-3940256099942544~3347511713', rewarded: 'ca-app-pub-3940256099942544/5224354917' },   // testes oficiais do Google
};
export const ADS = {
  testing: BUILD.ads !== 'real',
  get rewardedAndroid() { return (this.testing ? ADMOB.test : ADMOB.real).rewarded; },
};

export const isNative = () => !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());

function plugin(name) {
  const C = window.Capacitor;
  if (!C) return null;
  if (C.Plugins && C.Plugins[name]) return C.Plugins[name];
  const reg = (window.capacitorExports && window.capacitorExports.registerPlugin) || C.registerPlugin;
  try { return reg ? reg(name) : null; } catch { return null; }
}

let admob = null, adReady = false, adLoading = false;

async function askAdConsent() {
  try {
    const info = await admob.requestConsentInfo();
    if (info && info.isConsentFormAvailable && info.status === 'REQUIRED') await admob.showConsentForm();
  } catch (e) { console.warn('[ads] consentimento', e); }
}

async function loadRewarded() {
  if (!admob || adReady || adLoading) return;
  adLoading = true;
  try {
    await admob.prepareRewardVideoAd({ adId: ADS.rewardedAndroid, isTesting: ADS.testing });
    adReady = true;
  } catch (e) {
    console.warn('[ads] falha ao carregar', e);
  }
  adLoading = false;
}

// Mostra o anúncio premiado. Resolve true se o jogador ganhou a recompensa.
export async function showRewarded() {
  if (!admob) return false;
  if (!adReady) await loadRewarded();
  if (!adReady) return false;
  adReady = false;
  try {
    const reward = await admob.showRewardVideoAd();
    return !!reward;
  } catch (e) {
    console.warn('[ads] falha ao mostrar', e);
    return false;
  } finally {
    setTimeout(loadRewarded, 1500);                // já deixa o próximo carregado
  }
}

export const nativeAds = () => !!admob;

// Fecha o app (só no Android; no navegador não faz nada)
export function exitApp() {
  const app = plugin('App');
  try { app?.exitApp(); } catch { /* sem plugin */ }
}

// Chamado uma vez na inicialização
export async function initPlatform(handlers) {
  if (!isNative()) return;
  document.documentElement.classList.add('native');

  const status = plugin('StatusBar');
  try { await status?.hide(); } catch { /* sem barra */ }

  const app = plugin('App');
  try { app?.addListener('backButton', () => handlers.back(() => app.exitApp())); } catch { /* opcional */ }
  try { app?.addListener('pause', () => handlers.pause()); } catch { /* opcional */ }

  admob = plugin('AdMob');
  if (admob) {
    try {
      await admob.initialize({ initializeForTesting: ADS.testing });
      if (!ADS.testing) await askAdConsent();       // LGPD/GDPR: formulário de consentimento do Google (UMP) quando exigido
      loadRewarded();
    } catch (e) {
      console.warn('[ads] AdMob indisponível', e);
      admob = null;
    }
  }
}
