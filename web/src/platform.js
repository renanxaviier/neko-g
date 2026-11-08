// Ponte com o app Android (Capacitor). No navegador tudo cai no modo web (anúncio simulado etc.).
// No app, os plugins nativos são acessados pelo objeto global window.Capacitor (sem bundler).

// IDs de TESTE do Google AdMob: troque pelos seus antes de publicar (veja android-app/README.md).
export const ADS = {
  testing: true,
  rewardedAndroid: 'ca-app-pub-3940256099942544/5224354917',   // anúncio premiado de teste oficial do Google
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
      loadRewarded();
    } catch (e) {
      console.warn('[ads] AdMob indisponível', e);
      admob = null;
    }
  }
}
